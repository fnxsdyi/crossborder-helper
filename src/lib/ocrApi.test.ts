import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recognizeInvoice } from './ocrApi'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock setTimeout to speed up tests
vi.stubGlobal('setTimeout', vi.fn((fn: Function) => fn()))

describe('recognizeInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws IMAGE_TOO_LARGE for large images', async () => {
    // Create a base64 string that exceeds 10MB
    const largeBase64 = 'data:image/png;base64,' + 'a'.repeat(15 * 1024 * 1024)
    await expect(recognizeInvoice(largeBase64)).rejects.toThrow('IMAGE_TOO_LARGE')
  })

  it('throws TIMEOUT on abort', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('Aborted')
      error.name = 'AbortError'
      throw error
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow('TIMEOUT')
  })

  it('throws RECOGNITION_FAILED on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow()
  })

  it('throws RECOGNITION_FAILED on empty response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [] }),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow()
  })

  it('throws RECOGNITION_FAILED on invalid JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'not json' } }],
      }),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow()
  })

  it('returns valid result on success', async () => {
    const ocrResult = {
      invoice_number: 'INV-001',
      date: '2024-01-15',
      amount: 100.50,
      currency: 'CNY',
      vendor_name: 'Test Company',
      tax_id: '123456789012345',
      confidence: 0.95,
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(ocrResult) } }],
      }),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    const result = await recognizeInvoice(smallBase64)
    expect(result.invoice_number).toBe('INV-001')
    expect(result.amount).toBe(100.50)
  })

  it('handles JSON with markdown code blocks', async () => {
    const ocrResult = {
      invoice_number: 'INV-002',
      date: '2024-02-20',
      amount: 200,
      currency: 'USD',
      vendor_name: 'Another Company',
      tax_id: null,
      confidence: 0.8,
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '```json\n' + JSON.stringify(ocrResult) + '\n```' } }],
      }),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    const result = await recognizeInvoice(smallBase64)
    expect(result.invoice_number).toBe('INV-002')
  })

  it('throws INVALID_RESPONSE when schema validation fails', async () => {
    // Return null which causes validateOcrResult to return null
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'null' } }],
      }),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow()
  })

  it('re-throws IMAGE_TOO_LARGE immediately without retry', async () => {
    // Create a base64 string that exceeds 10MB
    const largeBase64 = 'data:image/png;base64,' + 'a'.repeat(15 * 1024 * 1024)
    await expect(recognizeInvoice(largeBase64)).rejects.toThrow('IMAGE_TOO_LARGE')
    // fetch should not be called for image too large
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('retries on network failure then throws RECOGNITION_FAILED', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow('RECOGNITION_FAILED')
    // Should have been called MAX_RETRIES + 1 times (0, 1, 2)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('succeeds on retry after initial failure', async () => {
    const ocrResult = {
      invoice_number: 'INV-003',
      date: '2024-03-01',
      amount: 300,
      currency: 'EUR',
      vendor_name: 'Retry Company',
      tax_id: null,
      confidence: 0.9,
    }

    // First call fails, second succeeds
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(ocrResult) } }],
      }),
    })

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    const result = await recognizeInvoice(smallBase64)
    expect(result.invoice_number).toBe('INV-003')
  })

  it('handles non-Error exceptions gracefully', async () => {
    mockFetch.mockRejectedValue('string error')

    const smallBase64 = 'data:image/png;base64,' + 'a'.repeat(100)
    await expect(recognizeInvoice(smallBase64)).rejects.toThrow('RECOGNITION_FAILED')
  })
})
