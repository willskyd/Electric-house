'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  ClipboardList, CreditCard, LayoutDashboard, Menu, MoreHorizontal, Package, Plus, Search,
  Settings, ShoppingCart, SlidersHorizontal, Sparkles, Store, Sun, Moon, X, Check, UserRound,
  WalletCards, TrendingUp, CircleAlert, LogOut,
} from 'lucide-react'

type Section = 'Stocks' | 'New Stocks' | 'Debt' | 'Paid'
type Product = { id: number; name: string; sku: string; category: string; stock: number; price: number; status: 'In stock' | 'Low stock' | 'Out of stock' }
type Debt = { id: number; customer: string; invoice: string; amount: number; paid: number; due: string; status: 'Overdue' | 'Due soon' | 'On track' }

const initialProducts: Product[] = [
  { id: 1, name: 'Premium Rice 25kg', sku: 'RIC-2501', category: 'Groceries', stock: 248, price: 38.5, status: 'In stock' },
  { id: 2, name: 'Sunflower Oil 5L', sku: 'OIL-5002', category: 'Groceries', stock: 86, price: 14.9, status: 'In stock' },
  { id: 3, name: 'Blue Label Tea', sku: 'TEA-1008', category: 'Beverages', stock: 22, price: 8.25, status: 'Low stock' },
  { id: 4, name: 'Basmati Rice 10kg', sku: 'RIC-1004', category: 'Groceries', stock: 0, price: 21.2, status: 'Out of stock' },
  { id: 5, name: 'Sparkling Water 12pk', sku: 'WAT-1210', category: 'Beverages', stock: 64, price: 11.75, status: 'In stock' },
]
const initialDebts: Debt[] = [
  { id: 1, customer: 'Harbor Market', invoice: 'INV-1048', amount: 4600, paid: 2100, due: 'Today', status: 'Overdue' },
  { id: 2, customer: 'Maya Grocers', invoice: 'INV-1045', amount: 2850, paid: 1500, due: 'Jun 28', status: 'Due soon' },
  { id: 3, customer: 'Westside Cafe', invoice: 'INV-1039', amount: 1920, paid: 1920, due: 'Jul 02', status: 'On track' },
]

const nav: { label: Section; icon: typeof Package }[] = [
  { label: 'Stocks', icon: Package }, { label: 'New Stocks', icon: ClipboardList }, { label: 'Debt', icon: CreditCard }, { label: 'Paid', icon: CircleDollarSign },
]
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function Page() {
  const [section, setSection] = useState<Section>('Stocks')
  const [products, setProducts] = useState(initialProducts)
  const [debts, setDebts] = useState(initialDebts)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(true)
  const [sidebar, setSidebar] = useState(true)
  const [modal, setModal] = useState<'product' | 'debt' | 'receipt' | null>(null)
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sort, setSort] = useState('Newest')

  const filteredProducts = useMemo(() => products.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const filteredDebts = useMemo(() => debts.filter((d) => `${d.customer} ${d.invoice}`.toLowerCase().includes(query.toLowerCase())), [debts, query])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800) }
  const addProduct = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name')); const stock = Number(data.get('stock')); const price = Number(data.get('price')); setProducts((items) => [{ id: Date.now(), name, sku: `NEW-${String(Date.now()).slice(-4)}`, category: String(data.get('category')), stock, price, status: stock === 0 ? 'Out of stock' : stock < 30 ? 'Low stock' : 'In stock' }, ...items]); setModal(null); notify('Product added to your stock') }
  const payDebt = (id: number) => { setDebts((items) => items.map((d) => d.id === id ? { ...d, paid: d.amount, status: 'On track' } : d)); notify('Payment recorded successfully') }

  return <div className={dark ? 'app-shell dark' : 'app-shell'}>
    <aside className={`sidebar ${sidebar ? '' : 'sidebar-collapsed'}`}>
      <div className="brand"><div className="brand-mark"><Store /></div>{sidebar && <><strong>micro-mec</strong><span className="brand-dot" /></>}</div>
      <div className="workspace"><div className="avatar">AM</div>{sidebar && <div><b>Acme Market</b><small>Workspace</small></div>}<ChevronDown className="workspace-chevron" /></div>
      <p className="nav-label">Workspace</p>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={section === label ? 'nav-item active' : 'nav-item'} onClick={() => { setSection(label); setQuery('') }} title={!sidebar ? label : undefined}><Icon />{sidebar && <span>{label}</span>}{sidebar && label === 'New Stocks' && <span className="nav-count">3</span>}</button>)}</nav>
      <div className="sidebar-bottom"><p className="nav-label">Manage</p><button className="nav-item"><Settings />{sidebar && <span>Settings</span>}</button><button className="nav-item"><UserRound />{sidebar && <span>Team members</span>}</button><div className="help-card">{sidebar && <><Sparkles /><div><b>Need a hand?</b><small>Contact your admin</small></div></>}</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button" onClick={() => setSidebar(!sidebar)} aria-label="Toggle sidebar">{sidebar ? <ChevronLeft /> : <Menu />}</button><div className="breadcrumbs"><span>Workspace</span><ChevronRight /><b>{section}</b></div><div className="top-actions"><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</button><button className="icon-button notification"><Bell /><i /></button><div className="profile-wrap"><button className="profile" onClick={() => setMenuOpen(!menuOpen)}><div className="avatar small">AM</div><span>Alex Morgan</span><ChevronDown /></button>{menuOpen && <div className="profile-menu"><b>Alex Morgan</b><small>Administrator</small><hr /><button onClick={() => notify('Signed out of demo workspace')}><LogOut /> Sign out</button></div>}</div></div></header>
      <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">{section === 'Stocks' ? 'Inventory overview' : 'Workspace'}</div><h1>{section}</h1><p>{section === 'Stocks' ? 'Keep an eye on your products and stock levels.' : section === 'New Stocks' ? 'Review incoming inventory and recent receipts.' : section === 'Debt' ? 'Stay on top of outstanding customer balances.' : 'A record of completed customer payments.'}</p></div><button className="primary-button" onClick={() => setModal(section === 'Debt' ? 'debt' : section === 'New Stocks' ? 'receipt' : 'product')}><Plus />{section === 'Debt' ? 'Add debt' : section === 'New Stocks' ? 'Record stock' : 'Add product'}</button></div>
        {section === 'Stocks' && <><div className="stat-grid"><Stat icon={<Package />} label="Total products" value="1,248" change="+12.5%" positive /><Stat icon={<TrendingUp />} label="Total stock value" value="$84,290" change="+8.2%" positive /><Stat icon={<CircleAlert />} label="Low stock items" value="23" change="5 need attention" /><Stat icon={<WalletCards />} label="Out of stock" value="8" change="-2 from last week" positive /></div><section className="panel"><Toolbar query={query} setQuery={setQuery} sort={sort} setSort={setSort} /><ProductTable products={filteredProducts} onNotify={notify} /></section></>}
        {section === 'New Stocks' && <section className="panel"><Toolbar query={query} setQuery={setQuery} sort={sort} setSort={setSort} /><div className="receipt-list">{['June grocery delivery', 'Beverage restock', 'Weekend top-up'].map((name, i) => <div className="receipt-row" key={name}><div className="receipt-icon"><ArrowDownLeft /></div><div className="receipt-info"><b>{name}</b><span>Receipt #STK-00{i + 18} · {i + 2} days ago</span></div><strong>+{[180, 96, 42][i]} items</strong><span className="status-pill success">Completed</span><button className="more-button"><MoreHorizontal /></button></div>)}</div></section>}
        {(section === 'Debt' || section === 'Paid') && <section className="panel"><Toolbar query={query} setQuery={setQuery} sort={sort} setSort={setSort} /><DebtTable debts={section === 'Paid' ? filteredDebts.filter((d) => d.paid === d.amount) : filteredDebts} paid={section === 'Paid'} onPay={payDebt} /></section>}
      </div>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={(e) => e.currentTarget === e.target && setModal(null)}><div className="modal"><div className="modal-header"><div><div className="eyebrow">Workspace action</div><h2>{modal === 'product' ? 'Add new product' : modal === 'debt' ? 'Add customer debt' : 'Record stock receipt'}</h2></div><button className="icon-button" onClick={() => setModal(null)}><X /></button></div><form onSubmit={modal === 'product' ? addProduct : (e) => { e.preventDefault(); setModal(null); notify(modal === 'debt' ? 'Debt added to your records' : 'Stock receipt recorded') }}><label>Name or reference<input name="name" required placeholder={modal === 'product' ? 'e.g. Premium Rice 25kg' : 'e.g. Harbor Market'} /></label>{modal === 'product' && <div className="form-row"><label>Category<select name="category" defaultValue="Groceries"><option>Groceries</option><option>Beverages</option><option>Household</option></select></label><label>Price<input name="price" type="number" min="0" step="0.01" required placeholder="0.00" /></label><label>Quantity<input name="stock" type="number" min="0" required placeholder="0" /></label></div>}{modal !== 'product' && <label>Amount<input name="amount" type="number" min="1" required placeholder="0.00" /></label>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" type="submit"><Check />Save record</button></div></form></div></div>}
    {toast && <div className="toast"><Check />{toast}</div>}
  </div>
}

function Stat({ icon, label, value, change, positive }: { icon: React.ReactNode; label: string; value: string; change: string; positive?: boolean }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small className={positive ? 'positive' : ''}>{positive && <ArrowUpRight />}{change}</small></div> }
function Toolbar({ query, setQuery, sort, setSort }: { query: string; setQuery: (s: string) => void; sort: string; setSort: (s: string) => void }) { return <div className="toolbar"><div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, customers..." /></div><button className="filter-button"><SlidersHorizontal /> Filter</button><select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}><option>Newest</option><option>Name A–Z</option><option>Highest value</option></select></div> }
function ProductTable({ products, onNotify }: { products: Product[]; onNotify: (s: string) => void }) { return <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>In stock</th><th>Unit price</th><th>Status</th><th /></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td><div className="product-name"><div className="product-thumb"><Package /></div><div><b>{p.name}</b><span>{p.sku}</span></div></div></td><td>{p.category}</td><td><b>{p.stock}</b> units</td><td>{money(p.price)}</td><td><span className={`status-pill ${p.status === 'In stock' ? 'success' : p.status === 'Low stock' ? 'warning' : 'danger'}`}>{p.status}</span></td><td><button className="more-button" onClick={() => onNotify(`${p.name} selected`)}><MoreHorizontal /></button></td></tr>)}</tbody></table>{products.length === 0 && <div className="empty"><Package /><b>No products found</b><span>Try changing your search terms.</span></div>}</div> }
function DebtTable({ debts, paid, onPay }: { debts: Debt[]; paid: boolean; onPay: (id: number) => void }) { return <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Remaining</th><th>Due</th><th /></tr></thead><tbody>{debts.map((d) => <tr key={d.id}><td><div className="customer"><div className="avatar customer-avatar">{d.customer.slice(0, 2).toUpperCase()}</div><b>{d.customer}</b></div></td><td>{d.invoice}</td><td><b>{money(d.amount)}</b></td><td><b>{money(d.amount - d.paid)}</b><span className="progress"><i style={{ width: `${(d.paid / d.amount) * 100}%` }} /></span></td><td><span className={`status-pill ${d.status === 'Overdue' ? 'danger' : d.status === 'Due soon' ? 'warning' : 'success'}`}>{paid ? 'Paid' : d.due}</span></td><td>{!paid && d.paid < d.amount ? <button className="pay-button" onClick={() => onPay(d.id)}>Record payment</button> : <button className="more-button"><MoreHorizontal /></button>}</td></tr>)}</tbody></table>{debts.length === 0 && <div className="empty"><CircleDollarSign /><b>No payment records</b><span>Completed payments will appear here.</span></div>}</div> }
