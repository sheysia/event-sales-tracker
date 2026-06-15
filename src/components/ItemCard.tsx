import type { Item } from '../db'

type Props = {
  item: Item
  onSold: (item: Item) => void
  onEdit: (item: Item) => void
}

export default function ItemCard({ item, onSold, onEdit }: Props) {
  const soldOut = item.remaining <= 0
  const hasStock = item.quantity > 1

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 ${soldOut ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base truncate">{item.name}</span>
          {item.category && (
            <span className="text-xs bg-iris-50 text-iris-600 px-2 py-0.5 rounded-full shrink-0">{item.category}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
          <span className="font-bold text-slate-800 text-lg">${item.askingPrice.toFixed(2)}</span>
          {hasStock && (
            <span className={`${item.remaining <= 2 && item.remaining > 0 ? 'text-amber-500 font-medium' : ''}`}>
              {item.remaining} / {item.quantity} left
            </span>
          )}
        </div>
        {item.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{item.note}</p>}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => !soldOut && onSold(item)}
          disabled={soldOut}
          className={`px-5 py-3 rounded-lg font-bold text-sm min-h-[48px] ${
            soldOut
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-green-600 text-white active:bg-green-700'
          }`}
        >
          {soldOut ? 'Sold Out' : 'SOLD'}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
