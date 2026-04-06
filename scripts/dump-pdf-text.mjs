import fs from 'fs'
import { PDFParse } from 'pdf-parse'

const buf = fs.readFileSync(process.argv[2])
const parser = new PDFParse({ data: buf })
const result = await parser.getText()
await parser.destroy()
console.log(result.text.slice(0, 12000))
