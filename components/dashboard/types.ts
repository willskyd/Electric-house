export type Section = 'Overview' | 'Stocks' | 'New Stocks' | 'Store' | 'Transfers' | 'Debt' | 'Paid' | 'Settings' | 'Team members' | 'Inbox' | 'POS'

export type Product = {
  id: number
  name: string
  model: string
  sku: string
  barcode?: string
  category: string
  stock: number
  price: number
  status: string
}

export type StoreReceivingRecord = {
  id: string
  reference: string
  productId: number
  productName: string
  sku: string
  barcode: string
  supplier: string
  receivedAt: string
  cartons: number
  individualUnits: number
  unitsPerCarton: number | null
  totalUnits: number | null
  stockUnits?: number
  deliveryReference: string
  notes: string
  status: 'Recorded'
  createdAt: string
  updatedAt?: string
  revision?: number
  stockAdjusted?: boolean
  history?: Array<{ at: string; previous: Record<string, unknown>; next: Record<string, unknown>; stockDeltaUnits: number }>
}

export type PrototypeBranch = {
  id: string
  name: string
  createdAt: string
}

export type PrototypeTransferLine = {
  productId: number
  productName: string
  sku: string
  barcode: string
  unit: 'units' | 'cartons'
  quantity: number
  unitsPerCarton?: number | null
  stockUnits: number
  manualSourceText?: string
}

export type PrototypeTransfer = {
  id: string
  reference: string
  transferDate: string
  destinationBranchId: string
  destinationNameAtTransfer: string
  sourceLocation: string
  lines: PrototypeTransferLine[]
  manualItems: string
  notes: string
  status: 'Recorded'
  createdAt: string
  updatedAt?: string
  revision?: number
  history?: Array<{ at: string; previous: Record<string, unknown>; next: Record<string, unknown>; stockAdjustments: Array<{ productId: number; deltaUnits: number }> }>
}

export type DebtItem = {
  name: string
  productId?: number
  sku?: string
  quantity?: number
  unitPrice?: number
  stockUnits?: number
  price: number
  date?: string
}

export type Payment = {
  id: number | string
  amount: number
  date: string
}

export type Debt = {
  id: number | string
  customer: string
  invoice: string
  items: DebtItem[]
  amount: number
  payments: Payment[]
  due: string
  createdAt: string
  stockAdjusted?: boolean
  paidAt?: string
}

export type Activity = {
  id: number
  text: string
  detail?: string
  time: string
  read?: boolean
  type?: 'debt' | 'payment' | 'stock' | 'product' | 'system'
  amount?: number
  currency?: string
  customer?: string
  invoice?: string
  product?: string
  quantity?: number
  remaining?: number
}

export type Receipt = {
  id: number
  name: string
  model: string
  quantity: number
  invoice: string
  date: string
}

export type SaleLine = {
  productId: number
  name: string
  sku: string
  barcode: string
  quantity: number
  unitPriceMinor: number
  lineTotalMinor: number
}

export type Sale = {
  id: string
  receiptNumber: string
  businessName: string
  currency: string
  createdAt: string
  items: SaleLine[]
  subtotalMinor: number
  discountMinor: number
  taxMinor: number
  totalMinor: number
  payment: {
    method: 'cash'
    status: 'paid'
    amountTenderedMinor: number
    changeMinor: number
  }
}
