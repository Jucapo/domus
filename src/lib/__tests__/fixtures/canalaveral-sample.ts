/**
 * Fixture sintético del texto extraído de un PDF tipo Cañaveral (formato SIESA).
 * Estructura por línea de ítem:
 *   Línea A: `n descripción`
 *   Línea B: `codigoBarras cantidad UM precioUnit total[ D]`
 *
 * Total y fecha imitan el formato real de las facturas escaneadas.
 */
export const CANALAVERAL_PDF_TEXT = `
SUPERMERCADO CAÑAVERAL S.A.
NIT 800.000.000-1

Fecha: 2026/04/15

1 ARROZ PREMIUM 500g
7702011000019 2.000 UND 3.500 7.000
2 LECHE ENTERA 1L
7702011000026 3.000 UND 4.200 12.600
3 ACEITE GIRASOL 1000ml
7702011000033 1.000 UND 18.500 18.500

VALOR A PAGAR  38.100
`.trim()

/** Sin código de barras válido en línea B → no debe matchear. */
export const CANALAVERAL_PDF_TEXT_NO_BARCODES = `
Fecha: 2026/04/15

1 ARROZ SIN CODIGO
*** 2.000 UND 3.500 7.000

VALOR A PAGAR  7.000
`.trim()

/** Ejemplo donde unit price está mal y debe corregirse con total/qty (heurística >12%). */
export const CANALAVERAL_PDF_TEXT_UNIT_PRICE_MISMATCH = `
Fecha: 2026/04/15

1 PRODUCTO CON DESCUENTO
7702011099999 2.000 UND 100.000 50.000

VALOR A PAGAR  50.000
`.trim()
