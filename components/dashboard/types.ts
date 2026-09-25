export type Section = 'Overview' | 'Stocks' | 'New Stocks' | 'Debt' | 'Paid' | 'Settings' | 'Team members' | 'Inbox'

export type Product = {
  id: number
  name: string
  model: string
  sku: string
  category: string
  stock: number
  price: number
  status: string
}

export type DebtItem = {
  name: string
  price: number
}

export type Payment = {
  id: number
  amount: number
  date: string
}

export type Debt = {
  id: number
  customer: string
  invoice: string
  items: DebtItem[]
  amount: number
  payments: Payment[]
  due: string
  createdAt: string
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
