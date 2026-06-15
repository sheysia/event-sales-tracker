import { useState, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { db, type Item, type PaymentMethod } from './db'
import { useSummary } from './db/useSummary'
import Dashboard from './components/Dashboard'
import SoldModal from './components/SoldModal'
import SummaryTab from './components/SummaryTab'
import SettingsTab from './components/SettingsTab'
import HomescreenBanner from './components/HomescreenBanner'

type Tab = 'dashboard' | 'summary' | 'settings'

type Toast = { saleId: string; text: string }

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [soldItem, setSoldItem] = useState<Item | undefined>()
  const [toast, setToast] = useState<Toast | null>(null)
  const summary = useSummary()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const handleSold = useCallback((item: Item) => {
    setSoldItem(item)
  }, [])

  const confirmSold = useCallback(async (data: { soldPrice: number; units: number; paymentMethod: PaymentMethod }) => {
    if (!soldItem) return
    const saleId = nanoid()
    await db.transaction('rw', db.items, db.sales, async () => {
      await db.sales.add({
        id: saleId,
        itemId: soldItem.id,
        itemName: soldItem.name,
        askingPrice: soldItem.askingPrice,
        soldPrice: data.soldPrice,
        units: data.units,
        paymentMethod: data.paymentMethod,
        soldAt: new Date().toISOString(),
      })
      await db.items.update(soldItem.id, {
        remaining: Math.max(0, soldItem.remaining - data.units),
        updatedAt: new Date().toISOString(),
      })
    })
    setSoldItem(undefined)
    setToast({
      saleId,
      text: `Sold ${data.units > 1 ? `${data.units}x ` : ''}${soldItem.name} · $${(data.soldPrice * data.units).toFixed(2)}`,
    })
  }, [soldItem])

  const handleUndo = useCallback(async (saleId: string) => {
    const sale = await db.sales.get(saleId)
    if (!sale) return
    await db.transaction('rw', db.items, db.sales, async () => {
      await db.sales.delete(saleId)
      const item = await db.items.get(sale.itemId)
      if (item) {
        await db.items.update(sale.itemId, {
          remaining: item.remaining + sale.units,
          updatedAt: new Date().toISOString(),
        })
      }
    })
    setToast(null)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <HomescreenBanner />
      <header className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center text-sm font-medium">
        <span>{summary.unitsSold} sold</span>
        <span className="text-lg font-bold">${summary.totalRevenue.toFixed(2)}</span>
        <span>{summary.availableCount} available</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {tab === 'dashboard' && <Dashboard onSold={handleSold} />}
        {tab === 'summary' && <SummaryTab onUndo={handleUndo} />}
        {tab === 'settings' && <SettingsTab onImportDone={() => setTab('dashboard')} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex">
        {([
          ['dashboard', 'Items'],
          ['summary', 'Summary'],
          ['settings', 'Settings'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === key
                ? 'text-slate-800 border-t-2 border-slate-800'
                : 'text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {soldItem && (
        <SoldModal
          item={soldItem}
          onConfirm={confirmSold}
          onClose={() => setSoldItem(undefined)}
        />
      )}

      {toast && (
        <div className="fixed bottom-16 left-4 right-4 bg-slate-800 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg z-40">
          <span className="text-sm font-medium">{toast.text}</span>
          <button
            onClick={() => handleUndo(toast.saleId)}
            className="text-amber-400 font-bold text-sm ml-3"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
