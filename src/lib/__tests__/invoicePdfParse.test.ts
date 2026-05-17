import { describe, it, expect } from 'vitest'
import {
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
} from '../invoicePdfParse'
import { newBatchLine } from '../../views/preciosShared'
import {
  CANALAVERAL_PDF_TEXT,
  CANALAVERAL_PDF_TEXT_NO_BARCODES,
  CANALAVERAL_PDF_TEXT_UNIT_PRICE_MISMATCH,
} from './fixtures/canalaveral-sample'
import type { Product } from '../../types'

describe('normalizeBarcode', () => {
  it('extrae solo dígitos', () => {
    expect(normalizeBarcode('  7702011000019 ')).toBe('7702011000019')
    expect(normalizeBarcode('770-2011/000019')).toBe('7702011000019')
  })

  it('devuelve cadena vacía cuando no hay dígitos', () => {
    expect(normalizeBarcode('abc***')).toBe('')
    expect(normalizeBarcode(null)).toBe('')
    expect(normalizeBarcode(undefined)).toBe('')
  })
})

describe('parseMoney', () => {
  it('extrae enteros de strings con separadores', () => {
    expect(parseMoney('$ 38.100')).toBe(38100)
    expect(parseMoney('1,234,567')).toBe(1234567)
  })

  it('devuelve 0 cuando no hay dígitos', () => {
    expect(parseMoney('abc')).toBe(0)
    expect(parseMoney('')).toBe(0)
  })
})

describe('parseInvoiceDate', () => {
  it('parsea formato Cañaveral YYYY/M/D', () => {
    expect(parseInvoiceDate('Fecha: 2026/4/15 12:30')).toBe('2026-04-15')
    expect(parseInvoiceDate('Fecha : 2026/04/15')).toBe('2026-04-15')
  })

  it('devuelve null si no encuentra fecha', () => {
    expect(parseInvoiceDate('sin fecha aquí')).toBeNull()
  })
})

describe('parseInvoiceTotalCop', () => {
  it('reconoce VALOR A PAGAR', () => {
    expect(parseInvoiceTotalCop('VALOR A PAGAR 38.100')).toBe(38100)
  })

  it('reconoce TOTAL A PAGAR', () => {
    expect(parseInvoiceTotalCop('TOTAL A PAGAR $ 100.000')).toBe(100000)
  })

  it('devuelve null si no encuentra ningún patrón', () => {
    expect(parseInvoiceTotalCop('sin total visible')).toBeNull()
  })
})

describe('guessStoreLabelFromPdfText', () => {
  it('detecta Cañaveral', () => {
    expect(guessStoreLabelFromPdfText('SUPERMERCADO CAÑAVERAL S.A.')).toBe('Cañaveral')
  })

  it('detecta D1/Carulla', () => {
    expect(guessStoreLabelFromPdfText('TIENDAS D1 SAS')).toBe('D1 / Carulla')
    expect(guessStoreLabelFromPdfText('CARULLA EXPRESS')).toBe('D1 / Carulla')
  })

  it('devuelve string vacío si no encuentra', () => {
    expect(guessStoreLabelFromPdfText('OTRA TIENDA')).toBe('')
  })
})

describe('parseCanalaveralStyleLineItems', () => {
  it('parsea 3 líneas con su código de barras, cantidad y total', () => {
    const items = parseCanalaveralStyleLineItems(CANALAVERAL_PDF_TEXT)
    expect(items).toHaveLength(3)

    expect(items[0]).toMatchObject({
      desc: 'ARROZ PREMIUM 500g',
      qty: 2,
      total: 7000,
      barcodeRaw: '7702011000019',
    })
    expect(items[1]).toMatchObject({
      desc: 'LECHE ENTERA 1L',
      qty: 3,
      total: 12600,
      barcodeRaw: '7702011000026',
    })
    expect(items[2]).toMatchObject({
      desc: 'ACEITE GIRASOL 1000ml',
      qty: 1,
      total: 18500,
      barcodeRaw: '7702011000033',
    })
  })

  it('ignora líneas sin código de barras válido', () => {
    const items = parseCanalaveralStyleLineItems(CANALAVERAL_PDF_TEXT_NO_BARCODES)
    expect(items).toHaveLength(0)
  })

  it('corrige unitPrice cuando difiere >12% del implícito (total/qty)', () => {
    const items = parseCanalaveralStyleLineItems(
      CANALAVERAL_PDF_TEXT_UNIT_PRICE_MISMATCH,
    )
    expect(items).toHaveLength(1)
    // total 50000 / qty 2 = 25000 (no los 100000 declarados)
    expect(items[0].unitPrice).toBe(25000)
    expect(items[0].total).toBe(50000)
  })
})

describe('parseLineItemsForSource', () => {
  it('usa el parser Cañaveral para ambas fuentes soportadas', () => {
    const items1 = parseLineItemsForSource(CANALAVERAL_PDF_TEXT, 'canalaveral')
    const items2 = parseLineItemsForSource(CANALAVERAL_PDF_TEXT, 'd1-carulla')
    expect(items1).toHaveLength(3)
    expect(items2).toHaveLength(3)
  })
})

describe('buildBarcodeToProductIdMap', () => {
  const products = [
    { id: 'p1', barcode: '7702011000019' },
    { id: 'p2', barcode: '7702011000026' },
    { id: 'p3', barcode: '' }, // sin barcode → no entra al mapa
    { id: 'p4', barcode: '7702011000019' }, // duplicado → primero gana
  ] as unknown as Product[]

  it('mapea solo productos con código y no permite duplicados', () => {
    const map = buildBarcodeToProductIdMap(products)
    expect(map.size).toBe(2)
    expect(map.get('7702011000019')).toBe('p1') // el primero gana
    expect(map.get('7702011000026')).toBe('p2')
  })
})

describe('parsedItemsToBatchLines', () => {
  it('asigna productId cuando hay match por barcode', () => {
    const parsed = parseCanalaveralStyleLineItems(CANALAVERAL_PDF_TEXT)
    const products = [
      { id: 'p1', barcode: '7702011000019' },
      { id: 'p2', barcode: '7702011000026' },
    ] as unknown as Product[]
    const map = buildBarcodeToProductIdMap(products)

    const lines = parsedItemsToBatchLines(parsed, map, newBatchLine)

    expect(lines[0].productId).toBe('p1')
    expect(lines[1].productId).toBe('p2')
    expect(lines[2].productId).toBe('') // sin match
    expect(lines[2].invoiceBarcode).toBe('7702011000033')
  })

  it('preserva descripción y total de la factura en cada línea', () => {
    const parsed = parseCanalaveralStyleLineItems(CANALAVERAL_PDF_TEXT)
    const lines = parsedItemsToBatchLines(parsed, new Map(), newBatchLine)
    expect(lines[0].invoiceDesc).toBe('ARROZ PREMIUM 500g')
    expect(lines[0].price).toBe('7000')
    expect(lines[0].quantity).toBe('2')
  })
})

describe('parsePdfForBatchForm', () => {
  it('integra items + fecha + total + tienda', () => {
    const payload = parsePdfForBatchForm(CANALAVERAL_PDF_TEXT, 'canalaveral')
    expect(payload.items).toHaveLength(3)
    expect(payload.date).toBe('2026-04-15')
    expect(payload.invoiceTotal).toBe(38100)
    expect(payload.storeGuess).toBe('Cañaveral')
  })
})
