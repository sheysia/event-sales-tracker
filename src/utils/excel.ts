import * as XLSX from 'xlsx'
import { nanoid } from 'nanoid'
import type { Item } from '../db'

export type ParsedRow = {
  name: string
  price: number
  quantity: number
  category: string
  note: string
  error?: string
}

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  'item name': 'name',
  'name': 'name',
  'item': 'name',
  'price': 'price',
  'asking price': 'price',
  'askingprice': 'price',
  'quantity': 'quantity',
  'qty': 'quantity',
  'count': 'quantity',
  'category': 'category',
  'cat': 'category',
  'note': 'note',
  'notes': 'note',
  'description': 'note',
}

export function parseExcel(data: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(data, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

  if (raw.length === 0) return []

  const headerKeys = Object.keys(raw[0])
  const colMap: Partial<Record<keyof ParsedRow, string>> = {}
  for (const hk of headerKeys) {
    const normalized = hk.toLowerCase().trim()
    const mapped = HEADER_MAP[normalized]
    if (mapped) colMap[mapped] = hk
  }

  return raw.map(row => {
    const nameVal = colMap.name ? String(row[colMap.name] ?? '').trim() : ''
    const priceRaw = colMap.price ? row[colMap.price] : undefined
    const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw ?? ''))
    const qtyRaw = colMap.quantity ? row[colMap.quantity] : 1
    const quantity = typeof qtyRaw === 'number' ? qtyRaw : parseInt(String(qtyRaw || '1'), 10)

    const parsed: ParsedRow = {
      name: nameVal,
      price: isNaN(price) ? 0 : price,
      quantity: isNaN(quantity) || quantity < 1 ? 1 : quantity,
      category: colMap.category ? String(row[colMap.category] ?? '').trim() : '',
      note: colMap.note ? String(row[colMap.note] ?? '').trim() : '',
    }

    if (!parsed.name) parsed.error = 'Missing name'
    else if (isNaN(price) || price < 0) parsed.error = 'Invalid price'

    return parsed
  })
}

export function parsedRowsToItems(rows: ParsedRow[]): Item[] {
  const now = new Date().toISOString()
  return rows
    .filter(r => !r.error)
    .map(r => ({
      id: nanoid(),
      name: r.name,
      askingPrice: r.price,
      quantity: r.quantity,
      remaining: r.quantity,
      category: r.category || undefined,
      note: r.note || undefined,
      createdAt: now,
      updatedAt: now,
    }))
}

export function generateTemplate(): void {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['Item Name', 'Price', 'Quantity', 'Category', 'Note'],
    ['Blue Vase', 15, 1, 'Home', 'small scratch'],
    ['Candle', 5, 10, 'Home', ''],
    ['Kids Book Set', 8, 1, 'Books', ''],
  ])
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
  XLSX.writeFile(wb, 'inventory-template.xlsx')
}

export function exportSalesCSV(sales: { itemName: string; askingPrice: number; soldPrice: number; units: number; paymentMethod: string; soldAt: string }[]): void {
  const wb = XLSX.utils.book_new()
  const data = sales.map(s => ({
    'Item': s.itemName,
    'Asking Price': s.askingPrice,
    'Sold Price': s.soldPrice,
    'Units': s.units,
    'Total': s.soldPrice * s.units,
    'Payment': s.paymentMethod,
    'Time': new Date(s.soldAt).toLocaleString(),
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Sales')
  XLSX.writeFile(wb, `sales-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportFullBackup(items: Item[], sales: { id: string; itemId: string; itemName: string; askingPrice: number; soldPrice: number; units: number; paymentMethod: string; soldAt: string }[]): void {
  const wb = XLSX.utils.book_new()

  const itemData = items.map(i => ({
    'ID': i.id,
    'Name': i.name,
    'Asking Price': i.askingPrice,
    'Quantity': i.quantity,
    'Remaining': i.remaining,
    'Category': i.category ?? '',
    'Note': i.note ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemData), 'Items')

  const saleData = sales.map(s => ({
    'ID': s.id,
    'Item ID': s.itemId,
    'Item': s.itemName,
    'Asking Price': s.askingPrice,
    'Sold Price': s.soldPrice,
    'Units': s.units,
    'Total': s.soldPrice * s.units,
    'Payment': s.paymentMethod,
    'Time': new Date(s.soldAt).toLocaleString(),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(saleData), 'Sales')

  XLSX.writeFile(wb, `backup-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
