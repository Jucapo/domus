/**
 * Fixture XML UBL 2.1 (DIAN) sintético. Cañaveral / proveedores colombianos
 * envían el XML embebido en CDATA dentro de un AttachedDocument; el parser
 * extrae el Invoice interior.
 */

const INNER_INVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:IssueDate>2026-04-15</cbc:IssueDate>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">37500.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">37500.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">38100.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">38100.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:InvoicedQuantity unitCode="EA">2.000</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">7000.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="COP">0.00</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>ARROZ PREMIUM 500g</cbc:Description>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="9">7702011000019</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:InvoiceLine>
    <cbc:InvoicedQuantity unitCode="EA">3.000</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">12600.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="COP">0.00</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>LECHE ENTERA 1L</cbc:Description>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="9">7702011000026</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>
  <cac:InvoiceLine>
    <cbc:InvoicedQuantity unitCode="EA">1.000</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">18500.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="COP">0.00</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>ACEITE GIRASOL 1000ml</cbc:Description>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="9">7702011000033</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>`

/** AttachedDocument con el Invoice DIAN embebido en CDATA (formato real). */
export const DIAN_ATTACHED_DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<AttachedDocument xmlns="urn:oasis:names:specification:ubl:schema:xsd:AttachedDocument-1"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cac:Attachment>
    <cac:ExternalReference>
      <cbc:Description><![CDATA[${INNER_INVOICE_XML}]]></cbc:Description>
    </cac:ExternalReference>
  </cac:Attachment>
</AttachedDocument>`

/** El propio Invoice sin envoltorio AttachedDocument (también soportado). */
export const DIAN_PLAIN_INVOICE_XML = INNER_INVOICE_XML

/** Edge: XML sin <Invoice> dentro. El parser debe devolver error. */
export const DIAN_NO_INVOICE_XML = `<?xml version="1.0"?>
<Something xmlns="x"><Foo>bar</Foo></Something>`

/** Edge: ítems sin LineExtensionAmount → no se cuentan como ítems. */
export const DIAN_EMPTY_LINES_XML = `<?xml version="1.0"?>
<Invoice xmlns:cac="x" xmlns:cbc="y">
  <cbc:IssueDate>2026-04-15</cbc:IssueDate>
  <cac:InvoiceLine>
    <cbc:InvoicedQuantity>1.0</cbc:InvoicedQuantity>
    <cac:Item><cbc:Description>Sin total</cbc:Description></cac:Item>
  </cac:InvoiceLine>
</Invoice>`
