import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PaymentMethod } from '.'

export type Summary = {
  unitsSold: number
  totalRevenue: number
  byPayment: Record<PaymentMethod, number>
  availableCount: number
  totalItems: number
}

const emptyByPayment: Record<PaymentMethod, number> = {
  cash: 0, venmo: 0, zelle: 0, other: 0,
}

export function useSummary(): Summary {
  return useLiveQuery(async () => {
    const [sales, items] = await Promise.all([
      db.sales.toArray(),
      db.items.toArray(),
    ])

    const byPayment = { ...emptyByPayment }
    let unitsSold = 0
    let totalRevenue = 0

    for (const s of sales) {
      const amount = s.soldPrice * s.units
      unitsSold += s.units
      totalRevenue += amount
      byPayment[s.paymentMethod] += amount
    }

    return {
      unitsSold,
      totalRevenue,
      byPayment,
      availableCount: items.filter(i => i.remaining > 0).length,
      totalItems: items.length,
    }
  }, [], {
    unitsSold: 0,
    totalRevenue: 0,
    byPayment: { ...emptyByPayment },
    availableCount: 0,
    totalItems: 0,
  })
}
