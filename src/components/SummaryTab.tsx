import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Sale } from '../db'
import { useSummary } from '../db/useSummary'

function formatSummaryText(sales: Sale[], summary: ReturnType<typeof useSummary>): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const lines: string[] = [
    `Event Sales Summary — ${date}`,
    `Units sold: ${summary.unitsSold} · Revenue: $${summary.totalRevenue.toFixed(2)}`,
  ]

  const payments = Object.entries(summary.byPayment)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} $${v.toFixed(2)}`)
  if (payments.length) lines.push(payments.join(' · '))

  lines.push('')

  sales.forEach((s, i) => {
    const unitStr = s.units > 1 ? ` ×${s.units}` : ''
    const priceStr = s.units > 1
      ? `$${s.soldPrice.toFixed(2)} ea / $${(s.soldPrice * s.units).toFixed(2)}`
      : `$${s.soldPrice.toFixed(2)}`
    const method = s.paymentMethod.charAt(0).toUpperCase() + s.paymentMethod.slice(1)
    lines.push(`${i + 1}. ${s.itemName}${unitStr} — ${priceStr} (${method})`)
  })

  return lines.join('\n')
}

type Props = {
  onUndo: (saleId: string) => void
}

export default function SummaryTab({ onUndo }: Props) {
  const sales = useLiveQuery(() => db.sales.orderBy('soldAt').reverse().toArray(), [])
  const items = useLiveQuery(() => db.items.toArray(), [])
  const summary = useSummary()

  const inventoryValue = useMemo(() => {
    if (!items) return 0
    return items.reduce((sum, i) => sum + i.askingPrice * i.remaining, 0)
  }, [items])

  const inventoryRemaining = useMemo(() => {
    if (!items) return 0
    return items.reduce((sum, i) => sum + i.remaining, 0)
  }, [items])

  const handleCopy = async () => {
    if (!sales) return
    const text = formatSummaryText(sales, summary)
    try {
      await navigator.clipboard.writeText(text)
      alert('Summary copied!')
    } catch {
      prompt('Copy this summary:', text)
    }
  }

  const handleShare = async () => {
    if (!sales) return
    const text = formatSummaryText(sales, summary)
    if (navigator.share) {
      await navigator.share({ title: 'Event Sales Summary', text })
    } else {
      handleCopy()
    }
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="text-center text-slate-400 py-20">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-lg font-medium">No sales yet</p>
        <p className="text-sm mt-1">Sell items from the Items tab to see your summary here</p>
      </div>
    )
  }

  const paymentEntries = Object.entries(summary.byPayment).filter(([, v]) => v > 0)
  const askingTotal = sales.reduce((sum, s) => sum + s.askingPrice * s.units, 0)
  const delta = summary.totalRevenue - askingTotal

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="text-center mb-4">
          <p className="text-3xl font-bold">${summary.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-1">{summary.unitsSold} units sold</p>
          {delta !== 0 && (
            <p className={`text-xs mt-1 ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {delta > 0 ? '+' : ''}{delta.toFixed(2)} vs asking
            </p>
          )}
        </div>
        {paymentEntries.length > 0 && (
          <div className="flex justify-center gap-4 flex-wrap">
            {paymentEntries.map(([method, amount]) => (
              <div key={method} className="text-center">
                <p className="text-lg font-bold">${(amount as number).toFixed(2)}</p>
                <p className="text-xs text-slate-500 capitalize">{method}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory balance */}
      {inventoryRemaining > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Remaining inventory</p>
            <p className="text-xs text-slate-400 mt-0.5">{inventoryRemaining} units unsold</p>
          </div>
          <p className="text-lg font-bold">${inventoryValue.toFixed(2)}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleCopy} className="flex-1 py-3 rounded-lg bg-iris-600 text-white font-medium text-sm">
          Copy Summary
        </button>
        <button onClick={handleShare} className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm">
          Share
        </button>
      </div>

      {/* Sales list */}
      <div className="space-y-2">
        {sales.map((sale, i) => {
          const method = sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)
          const time = new Date(sale.soldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-iris-50 flex items-center justify-center text-xs font-bold text-iris-500 shrink-0">
                {sales.length - i}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {sale.itemName}{sale.units > 1 ? ` ×${sale.units}` : ''}
                </p>
                <p className="text-sm text-slate-500">
                  ${sale.soldPrice.toFixed(2)}{sale.units > 1 ? ` ea · $${(sale.soldPrice * sale.units).toFixed(2)}` : ''}
                  {' · '}{method} · {time}
                </p>
              </div>
              <button
                onClick={() => onUndo(sale.id)}
                className="text-xs text-red-500 font-medium shrink-0 px-2 py-1"
              >
                Undo
              </button>
            </div>
          )
        })}
      </div>

      {/* Export reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-sm text-amber-700">
        Event done? Copy summary or export backup before clearing data.
      </div>
    </div>
  )
}
