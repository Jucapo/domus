-- =====================================================================
-- Detección de productos faltantes a partir de 3 facturas de prueba
--
-- Facturas analizadas (2026-05-27 y 2026-05-29):
--   - Cañaveral 02FC135717 (3 líneas)   $36,950
--   - Cañaveral 08FC76336  (16 líneas)  $116,951
--   - D1        F2G0236675 (23 líneas)  $163,420
--
-- 33 códigos de barras únicos. Ejecutar en SQL Editor:
--   https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/sql/new
-- =====================================================================

with invoice_items(barcode, descripcion, factura) as (
  values
    -- Cañaveral 02FC135717
    ('7705326023261', 'PAN BIMBO*730g BLANCO TAJADO',        'Canaveral 135717'),
    ('7705326629166', 'PAN BIMBO*67.5*4und PERRO DORADO',    'Canaveral 135717'),
    ('7702398040110', 'TOCINETA RICA*250g CHEF',             'Canaveral 135717'),
    -- Cañaveral 08FC76336
    ('2404844',       'SANDIA A GRANEL',                     'Canaveral 76336'),
    ('7702129020756', 'QUESO COLANTA*500g MOZAREL TAJADO',   'Canaveral 76336'),
    ('7702129030236', 'MANTEQUILLA COLANTA*250g C/SAL',      'Canaveral 76336'),
    ('7702004033635', 'CERVEZA AGUILA*330ml*6und 0.0% LATA', 'Canaveral 76336'),
    ('2404928',       'ZANAHORIA A GRANEL',                  'Canaveral 76336'),
    ('7708432897948', 'CILANTRO*80g',                        'Canaveral 76336'),
    ('2400161',       'TOMATE CHONTO A GRANEL',              'Canaveral 76336'),
    ('2404347',       'CEBOLLA CABEZONA BLANCA S/PELAR',     'Canaveral 76336'),
    ('2404614',       'MANGO GRUESO SURTIDO A GRANEL',       'Canaveral 76336'),
    ('7702001148578', 'YOGURT ALPINA*113g BABY VAINILLA',    'Canaveral 76336'),
    ('7702001148561', 'YOGURT ALPINA*113g BABY NATURAL',     'Canaveral 76336'),
    -- D1 F2G0236675
    ('7700304755011', 'DETERGENTE LIQUIDO B',                'D1 236675'),
    ('7700304934744', 'BOLSA PAPELERA TIDY',                 'D1 236675'),
    ('7700304391035', 'PERLAS DE FRAGANCIA',                 'D1 236675'),
    ('7702026162245', 'TOALLA COCINA PRACTI',                'D1 236675'),
    ('7700304648115', 'TOALLA COCINA TRIPLE',                'D1 236675'),
    ('7700304324538', 'TOALLITAS HUMEDAS LI',                'D1 236675'),
    ('7700304372959', 'TOALLAS HUMEDAS 99.9',                'D1 236675'),
    ('7700304507962', 'SUAVIZANTE BONAROPA',                 'D1 236675'),
    ('7700304345373', 'DETERGENTE PRENDAS O',                'D1 236675'),
    ('7700304346851', 'DETERGENTE ROPA DELI',                'D1 236675'),
    ('7700304783755', 'QUITAMANCHAS LIQUIDO',                'D1 236675'),
    ('7700304484546', 'QUITAMANCHAS BLANCA',                 'D1 236675'),
    ('7700304998562', 'ROPA COLOR BONAROPA',                 'D1 236675'),
    ('7700304586004', 'JABON LIQUIDO NF OAS',                'D1 236675'),
    ('7700304716890', 'SERVILLETA DE LUJO R',                'D1 236675'),
    ('7700304797981', 'SALSA DE SOYA ZEV X',                 'D1 236675'),
    ('7702535018675', 'COCA COLA SIN AZUCAR',                'D1 236675'),
    ('7707110100370', 'CHAMPINON 250 GR',                    'D1 236675'),
    ('7702418006577', 'VITAMINA C EN TABLET',                'D1 236675'),
    ('7700304670413', 'AREPA QUESO EXTRADEL',                'D1 236675'),
    ('7700304195473', 'AREPA DE YUCA 4 UND',                 'D1 236675'),
    ('7700304456659', 'SALCHICHA PARRILLA V',                'D1 236675'),
    ('7700304983049', 'VINAGRE BLANCO ZEV 1',                'D1 236675')
)
select
  ii.barcode,
  ii.descripcion                          as desc_en_factura,
  ii.factura,
  case
    when p.id is null then '❌ FALTA EN BD'
    else '✅ existe'
  end                                     as estado,
  p.name                                  as nombre_en_bd,
  p.brand                                 as marca_en_bd,
  c.name                                  as categoria
from invoice_items ii
left join public.products p
  on p.barcode = ii.barcode
  and p.household_id = '00000000-0000-0000-0000-000000000001'
left join public.categories c
  on c.id = p.category_id
order by
  case when p.id is null then 0 else 1 end,  -- faltantes primero
  ii.factura,
  ii.descripcion;
