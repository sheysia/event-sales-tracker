import { useState, useRef } from 'react'
import { db } from '../db'
import { parseExcel, parsedRowsToItems, generateTemplate, type ParsedRow } from '../utils/excel'

type Props = {
  onClose: () => void
  onDone: () => void
}

export default function ExcelImport({ onClose, onDone }: Props) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const buf = await file.arrayBuffer()
      const parsed = parseExcel(buf)
      if (parsed.length === 0) {
        setError('No data found in file')
        return
      }
      setRows(parsed)
    } catch {
      setError('Could not read file. Make sure it is a valid .xlsx or .csv file.')
    }
  }

  const validRows = rows?.filter(r => !r.error) ?? []
  const errorRows = rows?.filter(r => r.error) ?? []

  const doImport = async (mode: 'append' | 'replace') => {
    const items = parsedRowsToItems(validRows)
    if (mode === 'replace') {
      await db.transaction('rw', db.items, db.sales, async () => {
        await db.items.clear()
        await db.sales.clear()
        await db.items.bulkAdd(items)
      })
    } else {
      await db.items.bulkAdd(items)
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Import from Excel</h2>

        {!rows ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Upload an .xlsx or .csv file with columns: Item Name, Price, Quantity (optional), Category (optional), Note (optional).
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="w-full text-sm"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={generateTemplate}
              className="text-sm text-slate-500 underline"
            >
              Download template .xlsx
            </button>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-600 font-medium">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {validRows.length} items ready{errorRows.length > 0 ? `, ${errorRows.length} with errors (will be skipped)` : ''}
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">Qty</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r.error ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 truncate max-w-[150px]">{r.name || '—'}</td>
                      <td className="px-3 py-2 text-right">{r.error ? '—' : `$${r.price.toFixed(2)}`}</td>
                      <td className="px-3 py-2 text-right">{r.quantity}</td>
                      <td className="px-3 py-2 text-xs">{r.error ? <span className="text-red-500">{r.error}</span> : '✓'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button onClick={() => doImport('append')} className="flex-1 py-3 rounded-lg bg-slate-800 text-white font-medium text-sm">
                Append to existing
              </button>
              <button onClick={() => doImport('replace')} className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium text-sm">
                Replace all
              </button>
            </div>
            <button onClick={() => { setRows(null); if (fileRef.current) fileRef.current.value = '' }} className="w-full text-sm text-slate-500 py-2">
              Choose a different file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
