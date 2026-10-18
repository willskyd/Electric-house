export function generateDebtInvoice() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DEBT-${stamp}-${suffix}`;
}

export function normalizeDebtRequest(rawBody = {}, catalog = []) {
  if (!rawBody || typeof rawBody !== 'object') {
    throw new Error('Debt details must be a JSON object');
  }

  const customer = typeof rawBody.customer === 'string' ? rawBody.customer.trim() : '';
  if (!customer) {
    throw new Error('Customer name is required');
  }

  const rawLines = Array.isArray(rawBody.lines)
    ? rawBody.lines
    : Array.isArray(rawBody.items)
      ? rawBody.items
      : [];

  if (!rawLines.length) {
    throw new Error('Add at least one product to the debt');
  }

  const items = rawLines.map((line, index) => {
    if (!line || typeof line !== 'object') {
      throw new Error(`Debt row ${index + 1} is invalid`);
    }

    const productId = Number(line.productId ?? line.id);
    const quantity = Number(line.quantity);
    const product = catalog.find((entry) => Number(entry.id) === productId) || null;
    const amountFromInput = Number(line.amount);
    const fallbackAmount = product && Number.isFinite(quantity) && quantity > 0
      ? Number(product.price) * quantity
      : 0;
    const amount = Number.isFinite(amountFromInput) && amountFromInput >= 0
      ? amountFromInput
      : fallbackAmount;

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      throw new Error(`Select a valid product for debt row ${index + 1}`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Enter a valid quantity for debt row ${index + 1}`);
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Enter a valid amount for debt row ${index + 1}`);
    }

    return {
      name: product?.name ?? `Product ${productId}`,
      productId,
      sku: product?.sku ?? product?.model ?? '',
      quantity,
      unitPrice: product ? Number(product.price) : 0,
      stockUnits: product ? Number(product.stock) : 0,
      price: Number(amount),
    };
  });

  const rawAmount = Number(rawBody.amount);
  const totalAmount = Number.isFinite(rawAmount) && rawAmount >= 0
    ? rawAmount
    : items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    throw new Error('Debt total is invalid');
  }

  return {
    customer,
    invoice: typeof rawBody.invoice === 'string' && rawBody.invoice.trim()
      ? rawBody.invoice.trim()
      : generateDebtInvoice(),
    items,
    amount: Number(totalAmount.toFixed(2)),
    payments: Array.isArray(rawBody.payments) ? rawBody.payments : [],
    due: typeof rawBody.due === 'string' && rawBody.due.trim() ? rawBody.due.trim() : '30 days',
    createdAt: typeof rawBody.createdAt === 'string' && rawBody.createdAt.trim() ? rawBody.createdAt.trim() : new Date().toISOString(),
    ...(rawBody.paidAt ? { paidAt: String(rawBody.paidAt) } : {}),
  };
}
