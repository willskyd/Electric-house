import assert from 'node:assert/strict';
import test from 'node:test';
import { formatReceipt } from './receipt-format.mjs';

const sale = {
  id: 'sale-1', receiptNumber: 'R-1', businessName: 'Micro MEC', currency: 'NGN',
  createdAt: '2026-10-15T12:00:00.000Z',
  items: [{ productId: 1, name: 'A long item name that should wrap cleanly', sku: 'SKU1', barcode: '0123', quantity: 2, unitPriceMinor: 12345, lineTotalMinor: 24690 }],
  subtotalMinor: 24690, discountMinor: 100, taxMinor: 200, totalMinor: 24790,
  payment: { method: 'cash', status: 'paid', amountTenderedMinor: 30000, changeMinor: 5210 },
};

test('formats saved sale fields into 32-column ESC/POS text without cutting', () => {
  const text = formatReceipt(sale).toString('ascii');
  assert.equal(text.charCodeAt(0), 0x1b);
  assert.ok(text.startsWith(`${String.fromCharCode(0x1b)}@`));
  for (const expected of ['R-1', 'SKU1 / 0123', 'NGN 123.45', 'NGN 246.90', 'NGN 247.90', 'NGN 300.00', 'NGN 52.10', 'Discount', 'Tax']) {
    assert.ok(text.includes(expected), `missing ${expected}`);
  }
  assert.ok(text.includes('A long item name'));
  assert.ok(!text.includes(`${String.fromCharCode(0x1d)}V`), 'receipt must not issue a cut command');
  const printable = text.slice(2).split('\n');
  for (const line of printable) assert.ok(line.length <= 32, `line exceeds 32 columns: ${line}`);
});

test('uses an ASCII-safe representation for unsupported currency glyphs', () => {
  const text = formatReceipt({ ...sale, businessName: 'Café', currency: 'EUR' }).toString('ascii');
  assert.ok(text.includes('Cafe'));
  assert.ok(text.includes('EUR 247.90'));
});
