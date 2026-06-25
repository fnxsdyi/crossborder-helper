import Dexie, { type EntityTable } from 'dexie'

const rateDb = new Dexie('ExchangeRates') as Dexie & {
  rates: EntityTable<RateCache, 'id'>
}

rateDb.version(1).stores({
  rates: 'id, currencyPair, date',
})

interface RateCache {
  id?: number
  currencyPair: string
  rate: number
  date: string
  fetchedAt: Date
}

const FALLBACK_RATES: Record<string, number> = {
  'USD_EUR': 0.92,
  'USD_GBP': 0.79,
  'USD_CAD': 1.36,
  'USD_AUD': 1.53,
  'USD_JPY': 149.50,
  'USD_CNY': 7.24,
  'EUR_USD': 1.09,
  'EUR_GBP': 0.86,
  'GBP_USD': 1.27,
  'GBP_EUR': 1.16,
}

export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1

  const pair = `${from}_${to}`
  const today = new Date().toISOString().split('T')[0]

  // Check cache first
  const cached = await rateDb.rates
    .where('currencyPair')
    .equals(pair)
    .and(r => r.date === today)
    .first()

  if (cached) {
    return cached.rate
  }

  // Fetch from API
  try {
    const rate = await fetchRate(from, to)
    if (rate !== null) {
      // Cache the rate
      await rateDb.rates.add({
        currencyPair: pair,
        rate,
        date: today,
        fetchedAt: new Date(),
      })
      return rate
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rate:', error)
  }

  // Fallback to static rates
  return FALLBACK_RATES[pair] || null
}

async function fetchRate(from: string, to: string): Promise<number | null> {
  // Using exchangerate-api.com free tier (1500 requests/month)
  const url = `https://api.exchangerate-api.com/v4/latest/${from}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('API error')

    const data = await response.json()
    return data.rates[to] || null
  } catch {
    // Try alternative free API
    return fetchRateAlternative(from, to)
  }
}

async function fetchRateAlternative(from: string, to: string): Promise<number | null> {
  // Alternative: frankfurter.app (free, no API key)
  const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('API error')

    const data = await response.json()
    return data.rates[to] || null
  } catch {
    return null
  }
}

export async function getHistoricalRate(from: string, to: string, date: string): Promise<number | null> {
  if (from === to) return 1

  const pair = `${from}_${to}`

  // Check cache first
  const cached = await rateDb.rates
    .where('currencyPair')
    .equals(pair)
    .and(r => r.date === date)
    .first()

  if (cached) {
    return cached.rate
  }

  // Fetch historical rate
  try {
    const url = `https://api.frankfurter.app/${date}?from=${from}&to=${to}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('API error')

    const data = await response.json()
    const rate = data.rates[to]
    if (rate) {
      await rateDb.rates.add({
        currencyPair: pair,
        rate,
        date,
        fetchedAt: new Date(),
      })
      return rate
    }
  } catch (error) {
    console.warn('Failed to fetch historical rate:', error)
  }

  return null
}

export function calculateFXGainLoss(
  invoiceAmount: number,
  invoiceCurrency: string,
  localCurrency: string,
  invoiceDateRate: number | null,
  paymentDateRate: number | null
): { gainLoss: number; percentage: number } | null {
  if (!invoiceDateRate || !paymentDateRate || invoiceCurrency === localCurrency) {
    return null
  }

  const amountInLocalAtInvoice = invoiceAmount * invoiceDateRate
  const amountInLocalAtPayment = invoiceAmount * paymentDateRate
  const gainLoss = amountInLocalAtPayment - amountInLocalAtInvoice
  const percentage = amountInLocalAtInvoice > 0
    ? (gainLoss / amountInLocalAtInvoice) * 100
    : 0

  return { gainLoss, percentage }
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
]
