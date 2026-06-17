import { useState, useEffect, useRef, type FormEvent } from 'react'
import type { Item } from '../db'
import { resizePhoto } from '../utils/photo'

type Props = {
  item?: Item
  onSave: (data: { name: string; askingPrice: number; quantity: number; category: string; note: string; photo?: string }) => void
  onClose: () => void
}

export default function ItemForm({ item, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('1')
  const [qty, setQty] = useState('1')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setPrice(String(item.askingPrice))
      setQty(String(item.quantity))
      setCategory(item.category ?? '')
      setNote(item.note ?? '')
      setPhoto(item.photo)
    }
  }, [item])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizePhoto(file)
    setPhoto(dataUrl)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsedPrice = parseFloat(price)
    const parsedQty = parseInt(qty, 10)
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice < 0) return
    onSave({
      name: name.trim(),
      askingPrice: parsedPrice,
      quantity: Math.max(1, parsedQty || 1),
      category: category.trim(),
      note: note.trim(),
      photo,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-lg font-bold">{item ? 'Edit Item' : 'Add Item'}</h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden"
          >
            {photo ? (
              <img src={photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl text-slate-400">📷</span>
            )}
          </button>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          {photo && (
            <button type="button" onClick={() => setPhoto(undefined)} className="text-xs text-slate-400">
              Remove
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Name *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-3 text-base outline-none focus:border-slate-500"
            placeholder="Blue Vase"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Price *</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-3 text-base outline-none focus:border-slate-500"
              placeholder="15.00"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-slate-600 mb-1">Qty</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-3 text-base outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-3 text-base outline-none focus:border-slate-500"
              placeholder="Home"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Note</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-3 text-base outline-none focus:border-slate-500"
              placeholder="small scratch"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-600 font-medium">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-3 rounded-lg bg-iris-600 text-white font-medium">
            {item ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
