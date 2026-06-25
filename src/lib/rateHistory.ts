import Dexie, { type EntityTable } from 'dexie'

export interface RateHistory {
  id?: number
  fromCurrency: string
  toCurrency: string
  rate: number
  amount: number
  result: number
  queriedAt: Date
}

const historyDb = new Dexie('RateHistory') as Dexie & {
  queries: EntityTable<RateHistory, 'id'>
}

historyDb.version(1).stores({
  queries: '++id, fromCurrency, toCurrency, queriedAt',
})

export async function saveRateQuery(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  amount: number,
  result: number
): Promise<void> {
  await historyDb.queries.add({
    fromCurrency,
    toCurrency,
    rate,
    amount,
    result,
    queriedAt: new Date(),
  })
}

export async function getRateHistory(limit: number = 20): Promise<RateHistory[]> {
  return await historyDb.queries
    .orderBy('queriedAt')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function clearRateHistory(): Promise<void> {
  await historyDb.queries.clear()
}
