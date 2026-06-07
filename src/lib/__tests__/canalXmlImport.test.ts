import { describe, it, expect } from 'vitest'
import {
  normKey,
  buildNormNameToProductIdMap,
  parseUblInvoiceLineItems,
  extractEmbeddedInvoiceXml,
  parseElectronicInvoiceXmlForBatch,
  applyNameFallbackToBatchLines,
} from '../canalXmlImport'
import { buildBarcodeToProductIdMap, parsedItemsToBatchLines } from '../invoicePdfParse'
import { newBatchLine } from '../../views/preciosShared'
import {
  DIAN_ATTACHED_DOCUMENT_XML,
  DIAN_PLAIN_INVOICE_XML,
  DIAN_NO_INVOICE_XML,
  DIAN_EMPTY_LINES_XML,
} from './fixtures/dian-ubl-sample'
import type { Product, BatchLine } from '../../types'

describe('normKey', () => {
  it('normaliza acentos, mayúsculas, asteriscos y espacios', () => {
    expect(normKey('Café*con LECHE  ')).toBe('CAFE CON LECHE')
    expect(normKey('Pollo / Cerdo')).toBe('POLLO CERDO')
    expect(normKey('Pan integral 500g')).toBe('PAN INTEGRAL 500G')
  })

  it('devuelve cadena vacía con input vacío', () => {
    expect(normKey('')).toBe('')
    expect(normKey('***')).toBe('')
  })
})

describe('buildNormNameToProductIdMap', () => {
  const products = [
    { id: 'p1', name: 'Arroz Premium' },
    { id: 'p2', name: 'Leche Entera' },
    { id: 'p3', name: 'arroz premium' }, // mismo normKey → no sobrescribe
  ] as unknown as Product[]

  it('mapea por nombre normalizado y conserva el primer match', () => {
    const map = buildNormNameToProductIdMap(products)
    expect(map.size).toBe(2)
    expect(map.get('ARROZ PREMIUM')).toBe('p1')
    expect(map.get('LECHE ENTERA')).toBe('p2')
  })
})

describe('extractEmbeddedInvoiceXml', () => {
  it('extrae el Invoice de un AttachedDocument con CDATA', () => {
    const inner = extractEmbeddedInvoiceXml(DIAN_ATTACHED_DOCUMENT_XML)
    expect(inner).not.toBeNull()
    expect(inner).toContain('<cbc:IssueDate>2026-04-15</cbc:IssueDate>')
  })

  it('acepta un XML que ya es Invoice directo (sin envoltorio)', () => {
    const inner = extractEmbeddedInvoiceXml(DIAN_PLAIN_INVOICE_XML)
    expect(inner).toBe(DIAN_PLAIN_INVOICE_XML)
  })

  it('devuelve null si no hay Invoice', () => {
    expect(extractEmbeddedInvoiceXml(DIAN_NO_INVOICE_XML)).toBeNull()
  })
})

describe('parseUblInvoiceLineItems', () => {
  it('parsea 3 líneas con desc, qty, total y GTIN', () => {
    const items = parseUblInvoiceLineItems(DIAN_PLAIN_INVOICE_XML)
    expect(items).toHaveLength(3)

    expect(items[0]).toMatchObject({
      desc: 'ARROZ PREMIUM 500g',
      qty: 2,
      barcodeRaw: '7702011000019',
    })
    expect(items[1].desc).toBe('LECHE ENTERA 1L')
    expect(items[2].desc).toBe('ACEITE GIRASOL 1000ml')
  })

  it('reasigna unitPrice como total/qty', () => {
    const items = parseUblInvoiceLineItems(DIAN_PLAIN_INVOICE_XML)
    expect(items[0].unitPrice).toBe(3500) // 7000 / 2
    expect(items[1].unitPrice).toBe(4200) // 12600 / 3
    expect(items[2].unitPrice).toBe(18500) // 18500 / 1
  })

  it('ajusta totales a TaxInclusiveAmount cuando difieren', () => {
    // Fixture: LineExtension suma 37500, TaxInclusive declara 38100.
    // El parser debe redistribuir para que la suma redondeada cuadre con 38100.
    const items = parseUblInvoiceLineItems(DIAN_PLAIN_INVOICE_XML)
    const sumLineTotals = items.reduce((s, it) => s + it.total, 0)
    expect(sumLineTotals).toBe(38100)
  })

  it('devuelve array vacío si no hay líneas con LineExtensionAmount', () => {
    expect(parseUblInvoiceLineItems(DIAN_EMPTY_LINES_XML)).toHaveLength(0)
  })
})

describe('parseElectronicInvoiceXmlForBatch', () => {
  it('integra items + fecha + total para XML válido', () => {
    const result = parseElectronicInvoiceXmlForBatch(DIAN_ATTACHED_DOCUMENT_XML)
    expect(result.error).toBeNull()
    expect(result.items).toHaveLength(3)
    expect(result.date).toBe('2026-04-15')
    expect(result.invoiceTotal).toBe(38100)
  })

  it('devuelve error claro si no hay Invoice', () => {
    const result = parseElectronicInvoiceXmlForBatch(DIAN_NO_INVOICE_XML)
    expect(result.items).toHaveLength(0)
    expect(result.error).toMatch(/No se encontró factura UBL/)
  })

  it('devuelve error si Invoice no tiene líneas reconocibles', () => {
    const result = parseElectronicInvoiceXmlForBatch(DIAN_EMPTY_LINES_XML)
    expect(result.items).toHaveLength(0)
    expect(result.error).toMatch(/InvoiceLine/)
  })
})

describe('match de productos a granel (códigos cortos UBL)', () => {
  // Línea de granel: GTIN de 7 dígitos (Standard) + código interno de 6 (Sellers).
  const granelXml = `
    <Invoice>
      <cac:InvoiceLine><cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="KGM">1.40</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="COP">4928.00</cbc:LineExtensionAmount>
        <cac:Item><cbc:Description>ZANAHORIA A GRANEL</cbc:Description>
          <cac:SellersItemIdentification><cbc:ID>012047</cbc:ID></cac:SellersItemIdentification>
          <cac:StandardItemIdentification><cbc:ID schemeID="010" schemeName="GTIN">2404928</cbc:ID></cac:StandardItemIdentification>
        </cac:Item>
        <cac:Price><cbc:PriceAmount currencyID="COP">4400.00</cbc:PriceAmount></cac:Price>
      </cac:InvoiceLine>
      <cac:InvoiceLine><cbc:ID>2</cbc:ID>
        <cbc:InvoicedQuantity unitCode="KGM">1.05</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="COP">10185.00</cbc:LineExtensionAmount>
        <cac:Item><cbc:Description>PAPA AMARILLA A GRANEL</cbc:Description>
          <cac:SellersItemIdentification><cbc:ID>006339</cbc:ID></cac:SellersItemIdentification>
          <cac:StandardItemIdentification><cbc:ID schemeID="010" schemeName="GTIN">2400143</cbc:ID></cac:StandardItemIdentification>
        </cac:Item>
        <cac:Price><cbc:PriceAmount currencyID="COP">9700.00</cbc:PriceAmount></cac:Price>
      </cac:InvoiceLine>
      <cac:LegalMonetaryTotal><cbc:TaxInclusiveAmount currencyID="COP">15113.00</cbc:TaxInclusiveAmount></cac:LegalMonetaryTotal>
    </Invoice>`

  it('captura ambos códigos como candidatos (Standard y Sellers)', () => {
    const items = parseUblInvoiceLineItems(granelXml)
    expect(items[0].barcodeCandidates).toEqual(['2404928', '012047'])
    expect(items[1].barcodeCandidates).toEqual(['2400143', '006339'])
  })

  it('matchea granel por GTIN de 7 dígitos y por código interno de 6', () => {
    // Inventario inconsistente: zanahoria guardó el GTIN; papa el código interno.
    const products = [
      { id: 'zan', name: 'Zanahoria', barcode: '2404928' },
      { id: 'papa', name: 'Papa amarilla', barcode: '006339' },
    ] as unknown as Product[]
    const items = parseUblInvoiceLineItems(granelXml)
    const map = buildBarcodeToProductIdMap(products)
    const lines = parsedItemsToBatchLines(items, map, newBatchLine)
    expect(lines[0].productId).toBe('zan')
    expect(lines[1].productId).toBe('papa')
  })
})

describe('applyNameFallbackToBatchLines', () => {
  const products = [
    { id: 'p1', name: 'Arroz Premium 500g' },
    { id: 'p2', name: 'Leche Entera 1L' },
  ] as unknown as Product[]

  const baseLines: BatchLine[] = [
    { ...newBatchLine(), productId: '', invoiceDesc: 'Arroz Premium 500g', invoiceBarcode: 'no-match' },
    { ...newBatchLine(), productId: '', invoiceDesc: 'Producto desconocido' },
    { ...newBatchLine(), productId: 'p-existente', invoiceDesc: 'Arroz Premium 500g' }, // ya matcheada
  ]

  it('asigna productId por nombre normalizado solo a líneas sin match previo', () => {
    const result = applyNameFallbackToBatchLines(baseLines, products)
    expect(result[0].productId).toBe('p1')
    expect(result[1].productId).toBe('') // no hay match
    expect(result[2].productId).toBe('p-existente') // se respeta el match anterior
  })
})
