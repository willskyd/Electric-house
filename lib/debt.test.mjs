import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeDebtRequest } from './debt.js';

test('normalizeDebtRequest calculates total from product rows and keeps an invoice', () => {
  const debt = normalizeDebtRequest(
    {
      customer: 'Harbor Market',
      lines: [
        { productId: 1, quantity: 2, amount: 300 },
        { productId: 2, quantity: 1 },
      ],
    },
    [
      { id: 1, name: 'Rice', sku: 'RIC-25', model: 'RIC-25', category: 'Groceries', stock: 12, price: 150, status: 'In stock' },
      { id: 2, name: 'Beans', sku: 'BEA-10', model: 'BEA-10', category: 'Groceries', stock: 8, price: 80, status: 'In stock' },
    ]
  );

  assert.equal(debt.customer, 'Harbor Market');
  assert.equal(debt.amount, 380);
  assert.equal(debt.items.length, 2);
  assert.ok(debt.invoice.startsWith('DEBT-'));
  assert.equal(debt.items[0].quantity, 2);
  assert.equal(debt.items[1].quantity, 1);
});
