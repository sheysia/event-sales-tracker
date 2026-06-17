import Dexie, { type EntityTable } from 'dexie'

export type Item = {
  id: string
  name: string
  askingPrice: number
  quantity: number
  remaining: number
  category?: string
  note?: string
  photo?: string
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = 'cash' | 'venmo' | 'zelle' | 'other'

export type Sale = {
  id: string
  itemId: string
  itemName: string
  askingPrice: number
  soldPrice: number
  units: number
  paymentMethod: PaymentMethod
  soldAt: string
}

class SalesDB extends Dexie {
  items!: EntityTable<Item, 'id'>
  sales!: EntityTable<Sale, 'id'>

  constructor() {
    super('event-sales-tracker')
    this.version(1).stores({
      items: 'id, name, remaining, createdAt',
      sales: 'id, itemId, paymentMethod, soldAt',
    })
    this.version(2).stores({
      items: 'id, name, remaining, createdAt',
      sales: 'id, itemId, paymentMethod, soldAt',
    })
  }
}

export const db = new SalesDB()
