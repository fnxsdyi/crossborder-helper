import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

async function dumpFields() {
  const pdfPath = path.join(__dirname, '..', 'public', 'fw8ben.pdf')
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  console.log(`\nTotal fields: ${fields.length}\n`)
  console.log('=' .repeat(80))

  fields.forEach(field => {
    const type = field.constructor.name
    const name = field.getName()
    console.log(`${type.padEnd(20)} | ${name}`)
  })

  console.log('=' .repeat(80))
}

dumpFields().catch(console.error)
