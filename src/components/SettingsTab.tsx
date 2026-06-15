import { useState } from 'react'
import { db } from '../db'
import { exportSalesCSV, exportFullBackup } from '../utils/excel'
import ExcelImport from './ExcelImport'

type Props = {
  onImportDone: () => void
}

export default function SettingsTab({ onImportDone }: Props) {
  const [showImport, setShowImport] = useState(false)
  const [clearStep, setClearStep] = useState(0)

  const handleExportCSV = async () => {
    const sales = await db.sales.toArray()
    if (sales.length === 0) { alert('No sales to export.'); return }
    exportSalesCSV(sales)
  }

  const handleExportBackup = async () => {
    const [items, sales] = await Promise.all([db.items.toArray(), db.sales.toArray()])
    if (items.length === 0 && sales.length === 0) { alert('No data to export.'); return }
    exportFullBackup(items, sales)
  }

  const handleClear = async () => {
    if (clearStep === 0) {
      setClearStep(1)
      return
    }
    await db.transaction('rw', db.items, db.sales, async () => {
      await db.items.clear()
      await db.sales.clear()
    })
    setClearStep(0)
  }

  return (
    <div className="space-y-4">
      {/* Import */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
        <h3 className="font-bold text-base">Import</h3>
        <button
          onClick={() => setShowImport(true)}
          className="w-full py-3 rounded-lg bg-iris-600 text-white font-medium text-sm"
        >
          Import from Excel
        </button>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
        <h3 className="font-bold text-base">Export</h3>
        <button onClick={handleExportCSV} className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm">
          Export Sales CSV
        </button>
        <button onClick={handleExportBackup} className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm">
          Export Full Backup (.xlsx)
        </button>
      </div>

      {/* New event */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
        <h3 className="font-bold text-base">New Event</h3>
        {clearStep === 0 ? (
          <button
            onClick={handleClear}
            className="w-full py-3 rounded-lg border border-red-300 text-red-600 font-medium text-sm"
          >
            Start New Event / Clear All Data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">Have you exported your summary?</p>
            <div className="flex gap-2">
              <button
                onClick={handleExportBackup}
                className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm"
              >
                Export Backup First
              </button>
              <button
                onClick={handleClear}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium text-sm"
              >
                I exported, clear data
              </button>
            </div>
            <button onClick={() => setClearStep(0)} className="w-full text-sm text-slate-400 py-1">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Add to Home Screen instructions */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 space-y-2">
        <h3 className="font-bold text-sm text-teal-700">Add to Home Screen</h3>
        <p className="text-xs text-teal-600/80">
          For the best experience, add this app to your Home Screen: tap the Share button in Safari, then "Add to Home Screen". This keeps your data safe between sessions.
        </p>
      </div>

      {/* Tech + privacy footer */}
      <div className="rounded-xl p-4 space-y-2">
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Hosted on Vercel. All sales data is stored locally on your device
          and never uploaded. Export or share to move data off this device.
        </p>
        <p className="text-center text-xs text-slate-300">Supported by Syneira Lab</p>
      </div>

      {showImport && (
        <ExcelImport
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); onImportDone() }}
        />
      )}
    </div>
  )
}
