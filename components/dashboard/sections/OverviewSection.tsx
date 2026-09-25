import { ArrowUpRight, ClipboardList, CreditCard, Package, ShoppingCart, Sparkles, Users } from 'lucide-react'

import { Stat, money } from '../utils'
import type { Section } from '../types'

export function OverviewSection({
  outstanding,
  onGo,
}: {
  outstanding: number
  onGo: (s: Section) => void
}) {
  return (
    <>
      <div className="welcome-card ">
        <div>
          <span className="eyebrow">Today&apos;s pulse</span>
          <h2>Everything is in view.</h2>
          <p>Track inventory movement, collect balances, and keep the team aligned.</p>
        </div>
        <div className="pulse-orb">
          <Sparkles />
        </div>
      </div>

      <div className="stat-grid">
        <Stat icon={<Package />} label="Products tracked" value="1,248" change="12.5% this month" positive />
        <Stat icon={<CreditCard />} label="Outstanding debt" value={money(outstanding)} change="Across 2 customers" />
        <Stat icon={<ShoppingCart />} label="Stock received" value="318" change="This month" positive />
        <Stat icon={<Users />} label="Team members" value="6" change="2 active now" />
      </div>

      <div className="quick-grid mb-20">
        <button onClick={() => onGo('Debt')}>
          <CreditCard />
          <b>Review debt</b>
          <span>See balances and payments</span>
          <ArrowUpRight />
        </button>
        <button onClick={() => onGo('New Stocks')}>
          <ClipboardList />
          <b>Recent stock</b>
          <span>Review incoming inventory</span>
          <ArrowUpRight />
        </button>
      </div>
    </>
  )
}
