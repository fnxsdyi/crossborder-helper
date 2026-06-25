import { PDFDocument } from 'pdf-lib'

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

export async function generateW8BENPDF(data: W8BENData, pdfBytes: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()

  // Line 1: Full name
  form.getTextField(FIELDS.line1_name).setText(data.fullName)

  // Line 2: Country of citizenship
  form.getTextField(FIELDS.line2_country).setText(data.country)

  // Line 3: Permanent residence address (split into 3 lines)
  const [addr1, addr2, addr3] = splitAddress(data.permanentAddress)
  form.getTextField(FIELDS.line3_permanentAddress1).setText(addr1)
  if (addr2) form.getTextField(FIELDS.line3_permanentAddress2).setText(addr2)
  if (addr3) form.getTextField(FIELDS.line3_permanentAddress3).setText(addr3)

  // Line 4: Mailing address (if different)
  if (data.mailingAddress) {
    const [mail1, mail2, mail3] = splitAddress(data.mailingAddress)
    form.getTextField(FIELDS.line4_mailingAddress1).setText(mail1)
    if (mail2) form.getTextField(FIELDS.line4_mailingAddress2).setText(mail2)
    if (mail3) form.getTextField(FIELDS.line4_mailingAddress3).setText(mail3)
  }

  // Line 5: US TIN (if has)
  if (data.usTin) {
    form.getCheckBox(FIELDS.hasUsTin).check()
    form.getTextField(FIELDS.line5_usTin).setText(data.usTin)
  }

  // Line 6: Foreign tax identifying number
  if (data.foreignTin) {
    form.getTextField(FIELDS.line6_foreignTin).setText(data.foreignTin)
  }

  // Line 8: Date of birth
  if (data.dateOfBirth) {
    form.getTextField(FIELDS.line8_dateOfBirth).setText(data.dateOfBirth)
  }

  // Line 9: Treaty benefits
  if (data.claimTreaty) {
    form.getCheckBox(FIELDS.line9_claimTreaty).check()
    if (data.treatyCountry) {
      form.getTextField(FIELDS.line9a_treatyCountry).setText(data.treatyCountry)
    }
    if (data.treatyArticle) {
      form.getTextField(FIELDS.line9b_articleAndParagraph).setText(data.treatyArticle)
    }
    if (data.treatyRate !== undefined) {
      form.getTextField(FIELDS.line9c_withholdingRate).setText(`${data.treatyRate}%`)
    }
  }

  // Signature
  form.getTextField(FIELDS.signature).setText(data.signature)
  form.getTextField(FIELDS.signatureDate).setText(new Date().toLocaleDateString('en-US'))
  form.getTextField(FIELDS.printName).setText(data.fullName)

  // Flatten form (makes fields non-editable in the PDF)
  form.flatten()

  return pdfDoc.save()
}

export async function loadW8BENTemplate(): Promise<ArrayBuffer> {
  const response = await fetch('/fw8ben.pdf')
  return response.arrayBuffer()
}
