import { Package, Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Stat, TrendingUpIcon, money } from '../utils'
import type { Product } from '../types'

export function StocksSection({
  products,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  filteredProducts,
  notify,
  setProducts,
  setDeleteProduct,
}: {
  products: Product[]
  query: string
  setQuery: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  filteredProducts: Product[]
  notify: (text: string) => void
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setDeleteProduct: (product: Product | null) => void
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  return (
    <>
      <div className="stat-grid">
        <Stat icon={<Package />} label="Total products" value={products.length.toLocaleString()} change="+12.5%" positive />
        <Stat icon={<TrendingUpIcon />} label="Total stock value" value={money(products.reduce((a, p) => a + p.stock * p.price, 0))} change="+8.2%" positive />
        <Stat icon={<Package />} label="Low stock items" value={products.filter((p) => p.status === 'Low stock').length.toString()} change="Needs attention" />
        <Stat icon={<Package />} label="Out of stock" value={products.filter((p) => p.stock === 0).length.toString()} change="-2 this week" positive />
      </div>

      <section className="panel">
        <Toolbar query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} options={['All', 'In stock', 'Low stock', 'Out of stock']} />
        <ProductTable
          products={filteredProducts}
          onNotify={notify}
          onStatusChange={(id, status) => { setProducts((ps) => ps.map((p) => p.id === id ? { ...p, status } : p)); notify('Stock status updated') }}
          onEdit={(id, key, value) => setProducts((ps) => ps.map((p) => p.id === id ? { ...p, [key]: key === 'name' || key === 'model' ? value : Number(value) || 0 } : p))}
          onDelete={(id) => setDeleteProduct(products.find((p) => p.id === id) ?? null)}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      </section>
    </>
  )
}

function Toolbar({ query, setQuery, statusFilter, setStatusFilter, options }: { query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; options: string[] }) {
  return (
    <div className="toolbar">
      <div className="search">
        <Search />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, customers..." />
      </div>
      <div className="filter-select">
        <SlidersHorizontal />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter">
          <option value="All">All filters</option>
          {options.filter((x) => x !== 'All').map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
    </div>
  )
}

function ProductTable({ products, onNotify, onStatusChange, onEdit, onDelete, editingId, setEditingId }: { products: Product[]; onNotify: (s: string) => void; onStatusChange: (id: number, status: string) => void; onEdit: (id: number, key: 'stock' | 'price' | 'name' | 'model', value: string) => void; onDelete: (id: number) => void; editingId: number | null; setEditingId: (id: number | null) => void }) {
  const [openId, setOpenId] = useState<number | null>(null)

  return (
    <div className="table-wrap ">
      <table >
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>In stock</th>
            <th>Unit price</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="product-name">
                  <div className="product-thumb"><Package /></div>
                  {editingId === p.id ? (
                    <div className="flex w-full flex-col gap-2">
                      <input className="rounded-lg border border-[#29352d] bg-white px-2 py-1 text-sm text-[#29352d] placeholder:text-[#29352d] dark:border-[#29352d] dark:bg-[#29352d] dark:text-white" value={p.name ?? ''} onChange={(e) => onEdit(p.id, 'name', e.target.value)} />
                      <input className="rounded-lg border border-[#29352d] bg-white px-2 py-1 text-xs text-[#29352d] placeholder:text-[#29352d] dark:border-[#29352d] dark:bg-[#29352d] dark:text-white" value={p.model ?? ''} onChange={(e) => onEdit(p.id, 'model', e.target.value)} />
                    </div>
                  ) : (
                    <div>
                      <b>{p.name}</b>
                      <span>{p.model ?? p.sku}</span>
                    </div>
                  )}
                </div>
              </td>
              <td>{p.category}</td>
              <td>
                <input className="table-number" type="number" min="0" value={p.stock} onChange={(e) => onEdit(p.id, 'stock', e.target.value)} aria-label={`Stock for ${p.name}`} /> units
              </td>
              <td>
                <input className="table-number price" type="number" min="0" step="0.01" value={p.price} onChange={(e) => onEdit(p.id, 'price', e.target.value)} aria-label={`Price for ${p.name}`} />
              </td>
              <td>
                <select className="status-control" value={p.status} onChange={(e) => onStatusChange(p.id, e.target.value)} aria-label={`Status for ${p.name}`}>
                  <option>In stock</option>
                  <option>Low stock</option>
                  <option>Out of stock</option>
                  <option>Discontinued</option>
                </select>
              </td>
              <td className="row-actions">
                <button className="more-button" onClick={() => setOpenId(openId === p.id ? null : p.id)} aria-label={`More actions for ${p.name}`} aria-expanded={openId === p.id}>
                  <MoreHorizontal />
                </button>
                {openId === p.id && (
                  <div className="stock-menu">
                    <button onClick={() => { onNotify(`${p.name} has ${p.stock} units available`); setOpenId(null) }}>View stock details</button>
                    <button onClick={() => { setEditingId(p.id); setOpenId(null) }}>Edit product</button>
                    <button onClick={() => { onStatusChange(p.id, p.stock === 0 ? 'In stock' : 'Out of stock'); setOpenId(null) }}>Toggle availability</button>
                    <button className="w-full rounded-md px-3 py-2 text-left text-[#29352d] transition hover:bg-[#29352d]" onClick={() => { onDelete(p.id); setOpenId(null) }}>Delete stock</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
