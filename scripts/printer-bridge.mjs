import http from 'node:http';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { formatReceipt } from './receipt-format.mjs';
import { discoverConnectedPrinters, getPrinterStatus } from './printer-discovery.mjs';

const HOST = '127.0.0.1';
const PORT = 17891;
const TOKEN_FILE = process.env.MICRO_MEC_PRINTER_TOKEN_FILE || '/home/kingsey-godswill/micro-mec-printer/printer-token.txt';
const ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
const configuredOrigins = (process.env.MICRO_MEC_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
for (const origin of configuredOrigins) {
  let parsed;
  try { parsed = new URL(origin); } catch { throw new Error('MICRO_MEC_ALLOWED_ORIGINS must contain exact HTTPS origins'); }
  if (parsed.protocol !== 'https:' || parsed.origin !== origin || parsed.username || parsed.password) {
    throw new Error('MICRO_MEC_ALLOWED_ORIGINS must contain exact HTTPS origins without paths or credentials');
  }
  ALLOWED_ORIGINS.add(origin);
}
const grants = new Map();
const printed = new Map();
const printingIds = new Set();
const MAX_BODY = 16 * 1024;
const MAX_ITEMS = 40;

async function consumeAuthorization(req) {
  const parts = /^Bearer ([a-f0-9]{32})\.([a-f0-9]{64})$/i.exec(req.headers.authorization || '');
  if (!parts) return false;
  let secret;
  try { secret = await loadSecret(); } catch { return null; }
  const expiry = grants.get(parts[1]);
  const expected = createHmac('sha256', secret).update(parts[1]).digest();
  const signature = Buffer.from(parts[2], 'hex');
  if (!safeEqual(expected, signature) || !expiry || expiry < Date.now()) return false;
  grants.delete(parts[1]);
  return true;
}

function printerUnavailableMessage(status) {
  if (status === 'bluetooth_disconnected') return 'The MPT-II Bluetooth printer is disconnected. The reconnect service will keep trying; retry printing shortly.';
  if (status === 'permission_denied') return 'The printer is connected, but the bridge does not have permission to send data. Check the bridge service permissions.';
  if (status === 'printer_device_unavailable') return 'Bluetooth is connected, but the printer device is unavailable. Check the RFCOMM service.';
  return 'Bluetooth printer status is unavailable. Check the Bluetooth and RFCOMM services.';
}

function respond(res, status, data, origin) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function validText(value, max, { allowEmpty = false } = {}) {
  return typeof value === 'string' && value.length <= max &&
    (allowEmpty || value.trim().length > 0) && !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}

function validMinor(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000_000;
}

function validateSale(sale) {
  if (!sale || typeof sale !== 'object' || Array.isArray(sale)) return false;
  if (!validText(sale.id, 128) || !validText(sale.receiptNumber, 64) ||
      !validText(sale.businessName, 100) || !validText(sale.currency, 3) ||
      !/^[A-Z]{3}$/.test(sale.currency) || !validText(sale.createdAt, 64) ||
      !Number.isFinite(Date.parse(sale.createdAt)) || !Array.isArray(sale.items) ||
      sale.items.length < 1 || sale.items.length > MAX_ITEMS) return false;
  for (const item of sale.items) {
    if (!item || typeof item !== 'object' || !Number.isSafeInteger(item.productId) || item.productId < 0 ||
        !validText(item.name, 120) || !validText(item.sku, 64, { allowEmpty: true }) ||
        !validText(item.barcode, 128, { allowEmpty: true }) ||
        typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1_000_000 ||
        Math.abs(item.quantity * 1000 - Math.round(item.quantity * 1000)) > 1e-6 ||
        !validMinor(item.unitPriceMinor) || !validMinor(item.lineTotalMinor)) return false;
  }
  if (!validMinor(sale.subtotalMinor) || !validMinor(sale.discountMinor) ||
      !validMinor(sale.taxMinor) || !validMinor(sale.totalMinor)) return false;
  const payment = sale.payment;
  return payment && typeof payment === 'object' && payment.method === 'cash' && payment.status === 'paid' &&
    validMinor(payment.amountTenderedMinor) && validMinor(payment.changeMinor);
}

async function readBody(req, limit = MAX_BODY) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request body is too large'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Request body must be valid JSON'), { status: 400 }); }
}

async function loadSecret() {
  const value = (await fs.readFile(TOKEN_FILE, 'utf8')).trim();
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('Printer authorization is unavailable');
  return Buffer.from(value, 'hex');
}

function safeEqual(a, b) {
  return a.length === b.length && timingSafeEqual(a, b);
}

function writeToPrinter(device, data, timeoutMs = 10_000) {
  const stream = createWriteStream(device);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => stream.destroy(new Error('Printer write timed out')), timeoutMs);
    timer.unref();
    stream.once('error', finish);
    stream.once('finish', () => finish());
    stream.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) return respond(res, 403, { ok: false, error: 'Origin not allowed' }, origin);
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return respond(res, 403, { ok: false, error: 'Origin not allowed' }, origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    return respond(res, 204, {}, origin);
  }
  if (req.method === 'GET' && req.url === '/health') {
    const printer = await getPrinterStatus();
    return respond(res, 200, { ok: true, bridgeRunning: true, printerConnected: printer.status === 'ready', printer }, origin);
  }
  if (req.method === 'POST' && (req.url === '/authorize' || req.url === '/print-receipt')) {
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return respond(res, 415, { ok: false, error: 'Content-Type must be application/json' }, origin);
    let payload;
    try { payload = await readBody(req, req.url === '/authorize' ? 64 : MAX_BODY); }
    catch (error) { return respond(res, error.status || 400, { ok: false, error: error.status === 413 ? error.message : 'Invalid JSON request' }, origin); }
    if (req.url === '/authorize') {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) return respond(res, 403, { ok: false, error: 'An allowed site origin is required' }, origin);
      let secret;
      try { secret = await loadSecret(); }
      catch { return respond(res, 503, { ok: false, error: 'Local printer authorization is unavailable' }, origin); }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length !== 0) return respond(res, 400, { ok: false, error: 'Invalid authorization request' }, origin);
      for (const [key, expiry] of grants) if (expiry < Date.now()) grants.delete(key);
      if (grants.size >= 1000) return respond(res, 429, { ok: false, error: 'Too many pending printer authorizations' }, origin);
      const nonce = randomBytes(16).toString('hex');
      const signature = createHmac('sha256', secret).update(nonce).digest('hex');
      const authorization = `${nonce}.${signature}`;
      grants.set(nonce, Date.now() + 30_000);
      return respond(res, 200, { ok: true, authorization }, origin);
    }
    const authorized = await consumeAuthorization(req);
    if (authorized === null) return respond(res, 503, { ok: false, error: 'Local printer authorization is unavailable' }, origin);
    if (!authorized) return respond(res, 401, { ok: false, error: 'Printer authorization expired or already used' }, origin);
    if (!validateSale(payload)) return respond(res, 400, { ok: false, error: 'Receipt data is invalid' }, origin);
    const requestId = req.headers['idempotency-key'];
    if (typeof requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(requestId)) return respond(res, 400, { ok: false, error: 'A valid print request ID is required' }, origin);
    const existing = printed.get(requestId);
    if (existing) return respond(res, existing.status, existing.body, origin);
    if (printingIds.has(requestId)) return respond(res, 409, { ok: false, error: 'This print request is already being sent to the printer' }, origin);
    if (printed.size > 500) printed.clear();
    printingIds.add(requestId);
    try {
      const printers = await discoverConnectedPrinters();
      const printer = printers[0];
      if (!printer) {
        const status = await getPrinterStatus();
        return respond(res, 503, { ok: false, error: printerUnavailableMessage(status.status), printerStatus: status.status }, origin);
      }
      await writeToPrinter(printer.device, formatReceipt(payload));
      const body = { ok: true, message: 'Receipt written to printer', receiptNumber: payload.receiptNumber, printer: `Bluetooth printer ${printers.indexOf(printer) + 1}` };
      printed.set(requestId, { status: 200, body });
      return respond(res, 200, body, origin);
    } catch (error) {
      console.error('Receipt write failed:', error?.code || 'printer_error');
      return respond(res, 503, { ok: false, error: 'Could not write to printer. Check Bluetooth connection and device permissions.' }, origin);
    } finally { printingIds.delete(requestId); }
  }
  if (req.method === 'POST' && req.url === '/print-test') {
    const authorized = await consumeAuthorization(req);
    if (authorized === null) return respond(res, 503, { ok: false, error: 'Local printer authorization is unavailable' }, origin);
    if (!authorized) return respond(res, 401, { ok: false, error: 'Printer authorization required' }, origin);
    try {
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return respond(res, 415, { ok: false, error: 'Content-Type must be application/json' }, origin);
      const payload = await readBody(req, 1024);
      if (!payload || payload.confirm !== 'PRINT-MICRO-MEC-TEST') return respond(res, 400, { ok: false, error: 'Invalid test confirmation' }, origin);
      const printers = await discoverConnectedPrinters();
      const printer = printers[0];
      if (!printer) {
        const status = await getPrinterStatus();
        return respond(res, 503, { ok: false, error: printerUnavailableMessage(status.status), printerStatus: status.status }, origin);
      }
      await writeToPrinter(printer.device, Buffer.from('\x1b@MICRO-MEC PRINTER TEST\nBluetooth connection OK\n------------------------\n\n\n\x1dV\x00', 'binary'));
      return respond(res, 200, { ok: true, message: 'Test sent to printer', printer: `Bluetooth printer ${printers.indexOf(printer) + 1}` }, origin);
    } catch (error) {
      console.error('Printer test write failed:', error?.code || 'printer_error');
      return respond(res, 503, { ok: false, error: 'Could not write to printer. Check Bluetooth connection and device permissions.' }, origin);
    }
  }
  return respond(res, 404, { ok: false, error: 'Not found' }, origin);
});

server.headersTimeout = 5_000;
server.requestTimeout = 15_000;
server.listen(PORT, HOST, () => console.log(`Micro-mec printer bridge listening at http://${HOST}:${PORT}`));
