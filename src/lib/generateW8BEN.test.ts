import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetFields = vi.fn()
const mockFlatten = vi.fn()
const mockSave = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
const mockGetForm = vi.fn().mockReturnValue({
  getFields: mockGetFields,
  flatten: mockFlatten,
})

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getForm: mockGetForm,
      save: mockSave,
    }),
  },
}))

describe('generateW8BEN', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFields.mockReturnValue([])
    mockSave.mockResolvedValue(new Uint8Array([1, 2, 3]))
  })

  it('exports generateW8BENPDF function', async () => {
    const mod = await import('./generateW8BEN')
    expect(typeof mod.generateW8BENPDF).toBe('function')
  })

  it('exports loadW8BENTemplate function', async () => {
    const mod = await import('./generateW8BEN')
    expect(typeof mod.loadW8BENTemplate).toBe('function')
  })

  it('generateW8BENPDF returns Uint8Array', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'John Doe',
        country: 'China',
        permanentAddress: '123 Main St\nBeijing',
        claimTreaty: false,
        signature: 'John Doe',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('handles empty address lines', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'Jane Doe',
        country: 'Japan',
        permanentAddress: '',
        claimTreaty: false,
        signature: 'Jane Doe',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('handles mailing address', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'Test User',
        country: 'Germany',
        permanentAddress: '456 Oak Ave',
        mailingAddress: '789 Pine Blvd\nSuite 100',
        claimTreaty: false,
        signature: 'Test User',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('handles US TIN', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'US Person',
        country: 'China',
        permanentAddress: '123 Main St',
        usTin: '123-45-6789',
        claimTreaty: false,
        signature: 'US Person',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('handles foreign TIN', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'Foreign Person',
        country: 'China',
        permanentAddress: '123 Main St',
        foreignTin: 'CN123456',
        claimTreaty: false,
        signature: 'Foreign Person',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('handles date of birth', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'DOB Person',
        country: 'China',
        permanentAddress: '123 Main St',
        dateOfBirth: '01/15/1990',
        claimTreaty: false,
        signature: 'DOB Person',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('handles treaty claim with all fields', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'Treaty Person',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: true,
        treatyCountry: 'China',
        treatyArticle: 'Article 12',
        treatyRate: 10,
        signature: 'Treaty Person',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('handles treaty claim without optional fields', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    const result = await generateW8BENPDF(
      {
        fullName: 'Treaty Person',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: true,
        signature: 'Treaty Person',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('safeSetTextField handles non-existent field', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    mockGetFields.mockReturnValue([])
    const result = await generateW8BENPDF(
      {
        fullName: 'No Fields',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: false,
        signature: 'No Fields',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('safeSetTextField handles wrong field type', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    mockGetFields.mockReturnValue([
      { getName: () => 'topmostSubform[0].Page1[0].f_1[0]', constructor: { name: 'PDFCheckBox' } },
    ])
    const result = await generateW8BENPDF(
      {
        fullName: 'Wrong Type',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: false,
        signature: 'Wrong Type',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('safeCheckField handles non-existent field', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    mockGetFields.mockReturnValue([])
    const result = await generateW8BENPDF(
      {
        fullName: 'Check Test',
        country: 'China',
        permanentAddress: '123 Main St',
        usTin: '123-45-6789',
        claimTreaty: true,
        treatyCountry: 'China',
        signature: 'Check Test',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('safeCheckField handles wrong field type', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    mockGetFields.mockReturnValue([
      { getName: () => 'topmostSubform[0].Page1[0].c1_01[0]', constructor: { name: 'PDFTextField' } },
    ])
    const result = await generateW8BENPDF(
      {
        fullName: 'Check Wrong Type',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: true,
        signature: 'Check Wrong Type',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })

  it('form.flatten handles errors gracefully', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    mockFlatten.mockImplementation(() => { throw new Error('Flatten failed') })
    const result = await generateW8BENPDF(
      {
        fullName: 'Flatten Error',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: false,
        signature: 'Flatten Error',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
    mockFlatten.mockImplementation(() => {})
  })

  it('safeSetTextField catches and ignores errors', async () => {
    const { generateW8BENPDF } = await import('./generateW8BEN')
    mockGetFields.mockImplementation(() => { throw new Error('Field error') })
    const result = await generateW8BENPDF(
      {
        fullName: 'Error Test',
        country: 'China',
        permanentAddress: '123 Main St',
        claimTreaty: false,
        signature: 'Error Test',
      },
      new ArrayBuffer(100)
    )
    expect(result).toBeDefined()
  })
})
