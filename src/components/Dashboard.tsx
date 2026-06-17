import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Item } from '../db'
import { nanoid } from 'nanoid'
import ItemCard from './ItemCard'
import ItemForm from './ItemForm'

type Filter = 'all' | 'available' | 'soldout'

type Props = {
  onSold: (item: Item) => void
}

export default function Dashboard({ onSold }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Item | undefined>()

  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray(), [])

  const filtered = useMemo(() => {
    if (!items) return []
    let list = items
    if (filter === 'available') list = list.filter(i => i.remaining > 0)
    if (filter === 'soldout') list = list.filter(i => i.remaining <= 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q))
    }
    return list
  }, [items, filter, search])

  const handleAdd = async (data: { name: string; askingPrice: number; quantity: number; category: string; note: string; photo?: string }) => {
    const now = new Date().toISOString()
    await db.items.add({
      id: nanoid(),
      name: data.name,
      askingPrice: data.askingPrice,
      quantity: data.quantity,
      remaining: data.quantity,
      category: data.category || undefined,
      note: data.note || undefined,
      photo: data.photo,
      createdAt: now,
      updatedAt: now,
    })
    setShowForm(false)
  }

  const handleEdit = async (data: { name: string; askingPrice: number; quantity: number; category: string; note: string; photo?: string }) => {
    if (!editItem) return
    const qtyDiff = data.quantity - editItem.quantity
    await db.items.update(editItem.id, {
      name: data.name,
      askingPrice: data.askingPrice,
      quantity: data.quantity,
      remaining: Math.max(0, editItem.remaining + qtyDiff),
      category: data.category || undefined,
      note: data.note || undefined,
      photo: data.photo,
      updatedAt: new Date().toISOString(),
    })
    setEditItem(undefined)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'soldout', label: 'Sold Out' },
  ]

  const empty = !items || items.length === 0

  return (
    <div className="space-y-3">
      {!empty && (
        <>
          <div className="flex gap-2">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  filter === f.key ? 'bg-iris-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-slate-400 bg-white"
          />
        </>
      )}

      {empty ? (
        <div className="text-center text-slate-400 py-20">
          <p className="text-5xl mb-4">🏷️</p>
          <p className="text-lg font-medium">No items yet</p>
          <p className="text-sm mt-1">Add items or import from Excel to get started</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-10">
          <p className="text-sm">No matching items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} onSold={onSold} onEdit={setEditItem} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-iris-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:bg-iris-700"
      >
        +
      </button>

      {showForm && <ItemForm onSave={handleAdd} onClose={() => setShowForm(false)} />}
      {editItem && <ItemForm item={editItem} onSave={handleEdit} onClose={() => setEditItem(undefined)} />}
    </div>
  )
}
