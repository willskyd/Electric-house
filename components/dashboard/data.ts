import type { Activity, Debt, Product } from './types'

export const nav = [
  { label: 'Overview', icon: 'overview' },
  { label: 'Stocks', icon: 'stocks' },
  { label: 'New Stocks', icon: 'new-stocks' },
  { label: 'Store', icon: 'store' },
  { label: 'Transfers', icon: 'transfers' },
  { label: 'Debt', icon: 'debt' },
  { label: 'Paid', icon: 'paid' },
  { label: 'Pending', icon: 'pending' },
  { label: 'Returns', icon: 'returns' },
  { label: 'Sync Center', icon: 'sync' },
] as const

export const initialProducts: Product[] = [
  { id: 1, name: '20,000mAh Power Bank', model: 'MEC-PWB-20000', sku: 'PWB-20000', category: 'Power banks', stock: 24, price: 28500, status: 'In stock' },
  { id: 2, name: '20W USB-C Charger', model: 'MEC-CHG-20W', sku: 'CHG-20W', category: 'Chargers', stock: 18, price: 12500, status: 'In stock' },
  { id: 3, name: 'USB-C Fast Charge Cable', model: 'MEC-CBL-USBC', sku: 'CBL-USBC', category: 'Cables', stock: 7, price: 3500, status: 'Low stock' },
  { id: 4, name: 'Wireless Earbuds', model: 'MEC-EAR-BT01', sku: 'EAR-BT01', category: 'Earphones', stock: 0, price: 18500, status: 'Out of stock' },
  { id: 5, name: 'Tempered Glass Screen Guard', model: 'MEC-SCR-TG01', sku: 'SCR-TG01', category: 'Screen guards', stock: 32, price: 2500, status: 'In stock' },
]

export const initialDebts: Debt[] = [
  {
    id: 1,
    customer: 'Harbor Mobile',
    invoice: 'INV-1048',
    items: [{ name: '20,000mAh Power Bank', price: 28500 }, { name: 'USB-C Fast Charge Cable', price: 3500 }],
    amount: 4600,
    payments: [{ id: 11, amount: 2100, date: 'Jun 18, 2026, 10:14 AM' }],
    due: 'Today',
    createdAt: 'Jun 12, 2026, 9:40 AM',
  },
  {
    id: 2,
    customer: 'Maya Telecom',
    invoice: 'INV-1045',
    items: [{ name: '20W USB-C Charger', price: 12500 }, { name: 'Tempered Glass Screen Guard', price: 2500 }],
    amount: 2850,
    payments: [{ id: 12, amount: 1500, date: 'Jun 20, 2026, 2:30 PM' }],
    due: 'Jun 28',
    createdAt: 'Jun 11, 2026, 3:12 PM',
  },
  {
    id: 3,
    customer: 'Westside Phones',
    invoice: 'INV-1039',
    items: [{ name: 'Wireless Earbuds', price: 18500 }],
    amount: 1920,
    payments: [{ id: 13, amount: 1920, date: 'Jun 21, 2026, 11:05 AM' }],
    due: 'Jul 02',
    createdAt: 'Jun 09, 2026, 11:05 AM',
    paidAt: 'Jun 21, 2026, 11:05 AM',
  },
]

export const initialActivities: Activity[] = [
  { id: 1, text: 'Payment received from Westside Phones', detail: 'A customer payment was received and matched to invoice INV-1039.', time: 'Oct 31, 2026, 11:05 AM', read: false },
  { id: 2, text: 'New stock receipt completed', detail: 'A stock receipt was recorded for a delivery of USB-C chargers.', time: 'Oct 30, 2026, 4:20 PM', read: false },
  { id: 3, text: 'Debt added for Harbor Mobile', detail: 'A new customer debt record was created for phone accessories.', time: 'Oct 29, 2026, 9:40 AM', read: true },
]

export const money = (n: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
