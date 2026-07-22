let PDFDocumentClass: any = null

async function loadPdfLib() {
  if (!PDFDocumentClass) {
    const { PDFDocument } = await import('pdf-lib')
    PDFDocumentClass = PDFDocument
  }
  return PDFDocumentClass
}

export interface W8BENData {
  fullName: string
  country: string
  permanentAddress: string
  mailingAddress?: string
  usTin?: string
  foreignTin?: string
  dateOfBirth?: string
  claimTreaty: boolean
  treatyCountry?: string
  treatyArticle?: string
  treatyRate?: number
  signature: string
}

// W-8BEN field mapping from IRS official PDF
const FIELDS = {
  line1_name: 'topmostSubform[0].Page1[0].f_1[0]',
  line2_country: 'topmostSubform[0].Page1[0].f_2[0]',
  line3_permanentAddress1: 'topmostSubform[0].Page1[0].f_3[0]',
  line3_permanentAddress2: 'topmostSubform[0].Page1[0].f_4[0]',
  line3_permanentAddress3: 'topmostSubform[0].Page1[0].f_5[0]',
  line4_mailingAddress1: 'topmostSubform[0].Page1[0].f_6[0]',
  line4_mailingAddress2: 'topmostSubform[0].Page1[0].f_7[0]',
  line4_mailingAddress3: 'topmostSubform[0].Page1[0].f_8[0]',
  line5_usTin: 'topmostSubform[0].Page1[0].f_9[0]',
  line6_foreignTin: 'topmostSubform[0].Page1[0].f_10[0]',
  line7_referenceNumbers: 'topmostSubform[0].Page1[0].f_11[0]',
  line8_dateOfBirth: 'topmostSubform[0].Page1[0].f_12[0]',
  line9_claimTreaty: 'topmostSubform[0].Page1[0].c1_01[0]',
  line9a_treatyCountry: 'topmostSubform[0].Page1[0].f_13[0]',
  line9b_articleAndParagraph: 'topmostSubform[0].Page1[0].f_14[0]',
  line9c_withholdingRate: 'topmostSubform[0].Page1[0].f_15[0]',
  line9d特殊Rate: 'topmostSubform[0].Page1[0].f_16[0]',
  line9e_gaIncome: 'topmostSubform[0].Page1[0].f_17[0]',
  line9f_paragraph4: 'topmostSubform[0].Page1[0].f_18[0]',
  hasUsTin: 'topmostSubform[0].Page1[0].c1_02[0]',
  signature: 'topmostSubform[0].Page1[0].f_20[0]',
  signatureDate: 'topmostSubform[0].Page1[0].Date[0]',
  printName: 'topmostSubform[0].Page1[0].f_21[0]',
}

function splitAddress(address: string): [string, string, string] {
  const lines = address.split('\n').map(l => l.trim()).filter(Boolean)
  return [
    lines[0] || '',
    lines[1] || '',
    lines[2] || '',
  ]
}

function safeSetTextField(form: any, fieldName: string, value: string) {
  try {
    const fields = form.getFields()
    const field = fields.find((f: any) => f.getName() === fieldName)
    if (!field) return
    if (field.constructor.name !== 'PDFTextField') return
    field.setText(value)
  } catch {
    // Field may not exist in this template version
  }
}

function safeCheckField(form: any, fieldName: string) {
  try {
    const fields = form.getFields()
    const field = fields.find((f: any) => f.getName() === fieldName)
    if (!field) return
    if (field.constructor.name !== 'PDFCheckBox') return
    field.check()
  } catch {
    // Field may not exist in this template version
  }
}

export async function generateW8BENPDF(data: W8BENData, pdfBytes: ArrayBuffer): Promise<Uint8Array> {
  const PDFDocument = await loadPdfLib()
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()

  // Line 1: Full name
  safeSetTextField(form, FIELDS.line1_name, data.fullName || '')

  // Line 2: Country of citizenship
  safeSetTextField(form, FIELDS.line2_country, data.country || '')

  // Line 3: Permanent residence address
  const [addr1, addr2, addr3] = splitAddress(data.permanentAddress || '')
  safeSetTextField(form, FIELDS.line3_permanentAddress1, addr1)
  if (addr2) safeSetTextField(form, FIELDS.line3_permanentAddress2, addr2)
  if (addr3) safeSetTextField(form, FIELDS.line3_permanentAddress3, addr3)

  // Line 4: Mailing address
  if (data.mailingAddress) {
    const [mail1, mail2, mail3] = splitAddress(data.mailingAddress)
    safeSetTextField(form, FIELDS.line4_mailingAddress1, mail1)
    if (mail2) safeSetTextField(form, FIELDS.line4_mailingAddress2, mail2)
    if (mail3) safeSetTextField(form, FIELDS.line4_mailingAddress3, mail3)
  }

  // Line 5: US TIN
  if (data.usTin) {
    safeCheckField(form, FIELDS.hasUsTin)
    safeSetTextField(form, FIELDS.line5_usTin, data.usTin)
  }

  // Line 6: Foreign tax identifying number
  if (data.foreignTin) {
    safeSetTextField(form, FIELDS.line6_foreignTin, data.foreignTin)
  }

  // Line 8: Date of birth
  if (data.dateOfBirth) {
    safeSetTextField(form, FIELDS.line8_dateOfBirth, data.dateOfBirth)
  }

  // Line 9: Treaty benefits
  if (data.claimTreaty) {
    safeCheckField(form, FIELDS.line9_claimTreaty)
    if (data.treatyCountry) {
      safeSetTextField(form, FIELDS.line9a_treatyCountry, data.treatyCountry)
    }
    if (data.treatyArticle) {
      safeSetTextField(form, FIELDS.line9b_articleAndParagraph, data.treatyArticle)
    }
    if (data.treatyRate !== undefined) {
      safeSetTextField(form, FIELDS.line9c_withholdingRate, `${data.treatyRate}%`)
    }
  }

  // Signature and date - skip if field type doesn't match
  safeSetTextField(form, FIELDS.signature, data.signature || '')
  safeSetTextField(form, FIELDS.signatureDate, new Date().toLocaleDateString('en-US'))
  safeSetTextField(form, FIELDS.printName, data.fullName || '')

  // Try to flatten form, but don't fail if it doesn't work
  try {
    form.flatten()
  } catch {
    // Flattening may not work on all template versions
  }

  return pdfDoc.save()
}

export async function loadW8BENTemplate(): Promise<ArrayBuffer> {
  const response = await fetch('/fw8ben.pdf')
  return response.arrayBuffer()
}
