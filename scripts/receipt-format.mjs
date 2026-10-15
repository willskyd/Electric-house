function ascii(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '?');
}

function wrap(value, width = 32) {
  const words = ascii(value).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (word.length > width) {
      if (line) lines.push(line), line = '';
      for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width));
    } else if (!line) line = word;
    else if (line.length + word.length + 1 <= width) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function amount(minor, currency) {
  return `${currency} ${(minor / 100).toFixed(2)}`;
}

function pair(label, value, width = 32) {
  const left = ascii(label);
  const right = ascii(value);
  if (left.length + right.length + 1 > width) return [...wrap(left, width), ...wrap(right, width)];
  return [`${left}${' '.repeat(width - left.length - right.length)}${right}`];
}

export function formatReceipt(sale) {
  const lines = [
    ...wrap(sale.businessName, 32), 'SALES RECEIPT',
    ...wrap(`Receipt: ${sale.receiptNumber}`, 32), ...wrap(new Date(sale.createdAt).toLocaleString('en-GB'), 32),
    '-'.repeat(32),
  ];
  for (const item of sale.items) {
    lines.push(...wrap(item.name, 32));
    const identifiers = [item.sku, item.barcode].filter(Boolean).join(' / ');
    if (identifiers) lines.push(...wrap(identifiers, 32));
    lines.push(...pair(`${item.quantity} x ${amount(item.unitPriceMinor, sale.currency)}`, amount(item.lineTotalMinor, sale.currency)));
  }
  lines.push('-'.repeat(32), ...pair('Subtotal', amount(sale.subtotalMinor, sale.currency)));
  if (sale.discountMinor) lines.push(...pair('Discount', amount(sale.discountMinor, sale.currency)));
  if (sale.taxMinor) lines.push(...pair('Tax', amount(sale.taxMinor, sale.currency)));
  lines.push(...pair('TOTAL', amount(sale.totalMinor, sale.currency)), '-'.repeat(32));
  lines.push(...wrap('Payment: Cash - Paid'), ...pair('Cash received', amount(sale.payment.amountTenderedMinor, sale.currency)));
  lines.push(...pair('Change', amount(sale.payment.changeMinor, sale.currency)), '', ...wrap('Thank you for shopping with us.'), '', '', '');
  return Buffer.from(`\x1b@${lines.join('\n')}\n`, 'ascii');
}
