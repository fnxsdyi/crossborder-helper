import { create } from 'zustand'
import type { OcrResult } from '@/lib/ocrSchema'

interface OcrState {
  image: string | null
  result: OcrResult | null
  loading: boolean
  error: string | null
  usageCount: number
  hasSubscription: boolean
  setImage: (image: string | null) => void
  setResult: (result: OcrResult | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUsageCount: (count: number) => void
  setHasSubscription: (has: boolean) => void
  reset: () => void
}

const initialState = {
  image: null,
  result: null,
  loading: false,
  error: null,
  usageCount: 0,
  hasSubscription: false,
}

export const useOcrStore = create<OcrState>((set) => ({
  ...initialState,
  setImage: (image) => set({ image }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUsageCount: (count) => set({ usageCount: count }),
  setHasSubscription: (has) => set({ hasSubscription: has }),
  reset: () => set(initialState),
}))
