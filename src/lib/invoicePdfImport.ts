/**
 * Wrapper de pdf.js (browser only) + re-exports de los parsers puros.
 * La lógica testeable sin DOM vive en `./invoicePdfParse.ts`.
 */
import * as pdfjs from 'pdfjs-dist'
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export {
  normalizeBarcode,
  parseMoney,
  parseInvoiceDate,
  parseInvoiceTotalCop,
  guessStoreLabelFromPdfText,
  parseCanalaveralStyleLineItems,
  parseLineItemsForSource,
  buildBarcodeToProductIdMap,
  parsedItemsToBatchLines,
  parsePdfForBatchForm,
} from './invoicePdfParse'

function textContentToLines(textContent: TextContent): string {
  const raw = textContent.items
    .filter((x): x is TextItem => !!x && typeof x === 'object' && 'str' in x && !!(x as TextItem).str)
    .map((x) => ({
      str: x.str,
      y: x.transform[5],
      x: x.transform[4],
    }))
  raw.sort((a, b) => b.y - a.y || a.x - b.x)
  const out: string[] = []
  let buf: string[] = []
  let currentY: number | null = null
  const eps = 4
  for (const it of raw) {
    if (currentY === null || Math.abs(it.y - currentY) < eps) {
      buf.push(it.str)
      currentY = it.y
    } else {
      out.push(buf.join(' ').trim())
      buf = [it.str]
      currentY = it.y
    }
  }
  if (buf.length) out.push(buf.join(' ').trim())
  return out.join('\n')
}

export interface ExtractPdfTextOptions {
  onProgress?: (pct0to100: number) => void
}

/**
 * Extrae texto del PDF con saltos de línea aproximados (navegador).
 */
export async function extractPdfText(file: File, options: ExtractPdfTextOptions = {}): Promise<string> {
  const { onProgress } = options
  let lastPct = -1
  const report = (pct: number) => {
    const p = Math.min(100, Math.max(0, Math.round(pct)))
    if (p === lastPct) return
    lastPct = p
    onProgress?.(p)
  }

  report(0)
  const buf = await file.arrayBuffer()
  report(3)

  const loadingTask = pdfjs.getDocument({ data: buf })
  loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      report(3 + (loaded / total) * 27)
    }
  }

  const doc = await loadingTask.promise
  const numPages = doc.numPages
  if (numPages === 0) {
    await doc.destroy().catch(() => {})
    report(100)
    return ''
  }

  report(32)
  const parts: string[] = []
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    parts.push(textContentToLines(tc))
    report(32 + (i / numPages) * 66)
  }

  report(99)
  await doc.destroy().catch(() => {})
  report(100)
  return parts.join('\n\n')
}
