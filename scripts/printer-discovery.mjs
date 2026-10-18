import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
export const PRINTER_ADDRESS = '86:67:7A:92:30:AE';
export const PRINTER_DEVICE = '/dev/rfcomm0';

export function parseConnectedRfcomm(output) {
  const linePattern = /^rfcomm(\d+):\s+([0-9a-f]{2}(?::[0-9a-f]{2}){5})\s+->\s+([0-9a-f]{2}(?::[0-9a-f]{2}){5})\s+channel\s+(\d+)\s+connected\b/im;
  for (const line of String(output).split(/\r?\n/)) {
    const match = linePattern.exec(line);
    if (!match || Number(match[1]) !== 0 || match[3].toUpperCase() !== PRINTER_ADDRESS) continue;
    return [{
      id: 'rfcomm-0',
      device: PRINTER_DEVICE,
      localAddress: match[2].toUpperCase(),
      address: match[3].toUpperCase(),
      channel: Number(match[4]),
    }];
  }
  return [];
}

// This function only checks existing OS state. Reconnection is owned by
// micro-mec-printer-autoconnect.service, never by a web request or health check.
export async function getPrinterStatus() {
  let rfcommOutput = '';
  let rfcommAvailable = true;
  try {
    ({ stdout: rfcommOutput } = await execFileAsync('rfcomm', ['-a'], { timeout: 1500, maxBuffer: 16 * 1024 }));
  } catch (error) {
    if (error?.code === 'ENOENT') rfcommAvailable = false;
    rfcommOutput = typeof error?.stdout === 'string' ? error.stdout : '';
  }

  const [printers, device] = await Promise.all([
    Promise.resolve(parseConnectedRfcomm(rfcommOutput)),
    fs.stat(PRINTER_DEVICE).catch(() => null),
  ]);
  let writable = false;
  if (device?.isCharacterDevice()) {
    try {
      await fs.access(PRINTER_DEVICE, constants.W_OK);
      writable = true;
    } catch {
      // Device exists but the bridge service account cannot write to it.
    }
  }

  if (printers.length && writable) {
    return { status: 'ready', bluetoothConnected: true, printerDeviceReady: true, writable: true };
  }
  if (!rfcommAvailable) {
    return { status: 'bluetooth_tools_unavailable', bluetoothConnected: false, printerDeviceReady: false, writable: false };
  }
  if (!printers.length) {
    return { status: 'bluetooth_disconnected', bluetoothConnected: false, printerDeviceReady: false, writable: false };
  }
  return {
    status: writable ? 'ready' : device?.isCharacterDevice() ? 'permission_denied' : 'printer_device_unavailable',
    bluetoothConnected: true,
    printerDeviceReady: Boolean(device?.isCharacterDevice()),
    writable,
  };
}

export async function discoverConnectedPrinters() {
  const status = await getPrinterStatus();
  if (status.status !== 'ready') return [];
  return [{ id: 'rfcomm-0', device: PRINTER_DEVICE, address: PRINTER_ADDRESS, channel: undefined }];
}
