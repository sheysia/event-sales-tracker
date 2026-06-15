import { useState, type FormEvent } from 'react'
import type { Item, PaymentMethod } from '../db'

type Props = {
  item: Item
  onConfirm: (data: { soldPrice: number; units: number; paymentMethod: PaymentMethod }) => void
  onClose: () => void
}

const methods: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'venmo', label: 'Venmo' },
  { key: 'zelle', label: 'Zelle' },
  { key: 'other', label: 'Other' },
]

export default function SoldModal({ item, onConfirm, onClose }: Props) {
  const [price, setPrice] = useState(item.askingPrice.toFixed(2))
  const [units, setUnits] = useState(1)
  const [method, setMethod] = useState<PaymentMethod>('cash')

  const showStepper = item.remaining > 1

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (isNaN(parsed) || parsed < 0) return
    onConfirm({ soldPrice: parsed, units, paymentMethod: method })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-bold">Sell: {item.name}</h2>
          <p className="text-sm text-slate-500">Asking ${item.askingPrice.toFixed(2)}{item.remaining > 1 ? ` · ${item.remaining} left` : ''}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Sold Price (per unit)</label>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-3 text-xl font-bold text-center outline-none focus:border-slate-500"
          />
        </div>

        {showStepper && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Units</label>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setUnits(u => Math.max(1, u - 1))}
                className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 text-xl font-bold"
              >
                -
              </button>
              <span className="text-2xl font-bold w-10 text-center">{units}</span>
              <button
                type="button"
                onClick={() => setUnits(u => Math.min(item.remaining, u + 1))}
                className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Payment</label>
          <div className="grid grid-cols-4 gap-2">
            {methods.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                className={`py-3 rounded-lg font-medium text-sm ${
                  method === m.key
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg active:bg-green-700"
        >
          Confirm ${(parseFloat(price || '0') * units).toFixed(2)}
        </button>
      </form>
    </div>
  )
}
