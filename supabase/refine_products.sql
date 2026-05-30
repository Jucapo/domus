-- =====================================================================
-- Refinamiento masivo de los 288 productos del hogar legacy.
--
-- Parsea nombres "crudos" del proveedor (ej. "BLANQ CLOROX*3800ml ORIGINAL")
-- para extraer marca, contenido y tipo de empaque en columnas separadas,
-- dejando el name limpio en Title Case.
--
-- Productos con ambigüedad real (duplicados de barcode, abreviaturas
-- raras, sin info suficiente) se marcan con notes = '[REVISAR] ...'
-- y aparecen en la sección "Pendientes de revisión" en Gestión de Productos.
--
-- Ejecutar en SQL Editor. Atómico con rollback si algo falla.
-- =====================================================================

begin;

-- Refinamiento principal: name + brand + display_unit + content + notes.
-- Solo incluye productos que se modifican (los que ya estaban bien quedan intactos).
update public.products as p set
  name = d.name,
  brand = d.brand,
  display_unit = d.display_unit,
  content_amount = d.content_amount,
  content_unit = d.content_unit,
  notes = d.notes
from (values

  -- ============================== ACEITES ==============================
  ('a1000001-0000-4000-8000-000000000068'::uuid, 'Aceite de soya',                       'Doña Lupe',  'bottle', 3000::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000f5'::uuid, 'Aceite gourmet',                       'Vitaplus',   'bottle', 2600::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000182'::uuid, 'Aceite premium girasol',               'Diana',      'bottle', 2000::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000080'::uuid, 'Margarina esparcible',                 'Natura',     'bar',    125::numeric,  'g',   ''),

  -- ============================== ALACENA ==============================
  ('a1000001-0000-4000-8000-000000000152'::uuid, 'Aliño',                                'Triguisar',  'box',    16::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-00000000007e'::uuid, 'Arroz de coco',                        'Diana',      'pack',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000021'::uuid, 'Arroz integral',                       'Diana',      'pack',   1000::numeric, 'g',   ''),
  ('8bf71fd6-3e9d-4987-9bd7-51885caf54ba'::uuid, 'Arroz premium',                        'Doña Lupe',  'bag',    500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000a9'::uuid, 'Arroz premium',                        'Doña Lupe',  'bag',    2500::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-00000000013a'::uuid, 'Avena en hojuelas',                    'Quaker',     'bag',    2000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-00000000007f'::uuid, 'Azúcar morena',                        'Incauca',    'bag',    1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000149'::uuid, 'Base bechamel',                        'Maggi',      'bag',    50::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000137'::uuid, 'Base carbonara',                       'Maggi',      'bag',    50::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000138'::uuid, 'Base delicia pollo y champiñones',     'Maggi',      'bag',    50::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000139'::uuid, 'Base gulash',                          'Maggi',      'bag',    45::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000027'::uuid, 'Café molido',                          'Tostao',     'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000065'::uuid, 'Café molido selecto',                  'Tostao',     'pack',   454::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000f8'::uuid, 'Café Orinoquía',                       'Origenn',    'bag',    340::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000134'::uuid, 'Caldo Ricostilla 24 cubos',            'Ricostilla', 'pack',   24::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000172'::uuid, 'Canela entera',                        'Santaféreño','jar',    200::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000e8'::uuid, 'Cereal 5 cereales',                    'Nestum',     'box',    350::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000160'::uuid, 'Chile con carne',                      'Azteca',     'can',    300::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000173'::uuid, 'Chips sabor chocolate',                'Corona',     'unit',   250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000147'::uuid, 'Coco bolsa',                           'Santaféreño','bag',    100::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000103'::uuid, 'Coco rallado sin azúcar',              'Santaféreño','bag',    50::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-0000000000b3'::uuid, 'Color chapeta',                        'El Rey',     'unit',   55::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000133'::uuid, 'Color',                                'La Gran Cocina','unit', 70::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000014a'::uuid, 'Crema sopera de verduras 3 porciones', 'Maggi',      'unit',   46.5::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000132'::uuid, 'Crema sopera pollo y champiñones 6 porciones','Maggi','unit',  89::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000136'::uuid, 'Crema sopera de verduras 6 porciones', 'Maggi',      'unit',   93::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-0000000000b4'::uuid, 'Cúrcuma',                              'El Rey',     'unit',   25::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000198'::uuid, 'Frijol rojo',                          'Duba',       'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000017d'::uuid, 'Galleta vainilla sin azúcar 6 und',    'Colombina',  'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000014f'::uuid, 'Galleta chocolate 6 und',              'Colombina',  'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000010c'::uuid, 'Galleta wafer',                        'Cocosette',  'unit',   46::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-00000000014e'::uuid, 'Galleta vainilla 6 und',               'Colombina',  'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000165'::uuid, 'Galleta Ducales 4 tacos',              'Noel',       'pack',   430::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000c6'::uuid, 'Galleta Ducales 5 tacos',              'Noel',       'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000054'::uuid, 'Galleta Saltín 6 tacos',               'Noel',       'pack',   524::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000168'::uuid, 'Gelatina fresa',                       'Twisty',     'unit',   120::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000016a'::uuid, 'Gelatina naranja',                     'Twisty',     'unit',   120::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000167'::uuid, 'Gelatina uva',                         'Twisty',     'unit',   120::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000f9'::uuid, 'Granola light',                        'Vitagranola','bag',    800::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000171'::uuid, 'Harina de trigo',                      'Haz de Oros','bag',    500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000179'::uuid, 'Harina de maíz blanco',                'P.A.N.',     'bag',    1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-0000000000fd'::uuid, 'Harina de maíz amarillo',              'P.A.N.',     'bag',    500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000015d'::uuid, 'Hinojo',                               '',           'unit',   null::numeric, null,  '[REVISAR] Sin contenido ni marca claros'),
  ('a1000001-0000-4000-8000-000000000142'::uuid, 'Maíz tierno',                          'Doña Lupe',  'bag',    425::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000017f'::uuid, 'Maíz pira',                            'Doña Lupe',  'bag',    500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000181'::uuid, 'Maíz tierno',                          'San Jorge',  'bag',    340::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000cc'::uuid, 'Mora congelada',                       'Agroya',     'bag',    500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000013d'::uuid, 'Panela redonda 8 und',                 'Doña Lupe',  'pack',   8::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000fc'::uuid, 'Panelitas redondas 8 und',             'Palestina',  'pack',   8::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000f6'::uuid, 'Pasabocas limón intenso',              'Choclitos',  'bag',    210::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000017e'::uuid, 'Pasabocas BBQ',                        'Detodito',   'bag',    165::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000016c'::uuid, 'Pasabocas pollo parrillero',           'Detodito',   'bag',    165::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000015f'::uuid, 'Pasabocas natural bolsaza',            'Detodito',   'bag',    80::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-00000000017a'::uuid, 'Pasabocas palomitas galleta crema',    'Yupi',       'bag',    170::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000145'::uuid, 'Pasas bolsa',                          'Santaféreño','bag',    100::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000007d'::uuid, 'Pasta cabello de ángel',               'La Muñeca',  'pack',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000169'::uuid, 'Pasta megapack',                       'Conzazoni',  'pack',   2000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-00000000013b'::uuid, 'Pasta spaghettini',                    'De Cecco',   'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000014b'::uuid, 'Pasta spaghetti',                      'Doria',      'pack',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000184'::uuid, 'Pasta letras',                         'Doria',      'pack',   250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000013c'::uuid, 'Pimienta roja en escamas',             'Santaféreño','jar',    300::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000011a'::uuid, 'Polvo para hornear',                   'Levapan',    'unit',   20::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-00000000017b'::uuid, 'Ponqué casero mora y tres leches',     'Bimbo',      'pack',   200::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000170'::uuid, 'Sal ligera',                           'Refisal',    'bag',    800::numeric,  'g',   'Revisar código de barras'),
  ('a1000001-0000-4000-8000-000000000135'::uuid, 'Sal ligera',                           'Refisal',    'bag',    400::numeric,  'g',   'Revisar código de barras'),
  ('a1000001-0000-4000-8000-000000000081'::uuid, 'Sal',                                  'Refisal',    'bag',    1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000148'::uuid, 'Sal marina',                           'Refisal',    'bag',    400::numeric,  'g',   'Revisar código de barras'),
  ('a1000001-0000-4000-8000-0000000000cd'::uuid, 'Mayonesa doypack',                     'Constancia', 'unit',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-0000000000cf'::uuid, 'Salsa rosada',                         'Constancia', 'unit',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000026'::uuid, 'Salsa de soya',                        'Zev',        'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000023'::uuid, 'Salsa negra',                          'Zev',        'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000124'::uuid, 'Sopa ramen costilla de res',           'Ají No Men', 'unit',   80::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000121'::uuid, 'Sopa ramen oriental',                  'Ají No Men', 'unit',   80::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-000000000076'::uuid, 'Talco',                                'Arden For Men','unit', 415::numeric,  'g',   '[REVISAR] Producto de cuidado personal en Alacena — mover categoría'),
  ('a1000001-0000-4000-8000-000000000151'::uuid, 'Té chai moringa 20 bolsitas',          'Teresita',   'box',    30::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-00000000013e'::uuid, 'Tostada de maíz',                      'Susanita',   'pack',   100::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000009a'::uuid, 'Trifogón del fogón 24 und',            '',           'pack',   24::numeric,   'unit','[REVISAR] Marca desconocida'),

  -- ============================== ASEO HOGAR ==============================
  ('a1000001-0000-4000-8000-000000000164'::uuid, 'Blanqueador original',                 'Clorox',     'bottle', 3800::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000d1'::uuid, 'Blanqueador corriente',                'Fleur',      'bottle', 3700::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000c2'::uuid, 'Bolsa 100% material reciclado',        'Cañaveral',  'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-0000000000ae'::uuid, 'Bolsa ecológica papel',                'Cañaveral',  'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000113'::uuid, 'Bolsa negra familiar 65x90 cm 25 und', 'Charly',     'pack',   25::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-00000000015c'::uuid, 'Bolsa blanca 43x48 cm 30 und',         'Doña Lupe',  'pack',   30::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000140'::uuid, 'Bolsa negra 51x75 cm 10 und',          'Fleur',      'pack',   10::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-0000000000b6'::uuid, 'Bolsa negra 65x90 cm 10 und',          'Fleur',      'pack',   10::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000112'::uuid, 'Bolsa blanca 43x48 cm 30 und',         'Fleur',      'pack',   30::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-0000000000f1'::uuid, 'Bolsa kit 45x60 cm 30 und',            'Fleur',      'pack',   30::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-0000000000f3'::uuid, 'Bolsa negra 65x90 cm 50 und',          'Fleur',      'pack',   50::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-00000000007b'::uuid, 'Detergente manzana',                   'AK 1',       'bag',    3000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-000000000188'::uuid, 'Escoba Zulia suave repuesto',          'Daniel',     'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000105'::uuid, 'Esponja brillo 12 und',                'Bonbril',    'pack',   12::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000106'::uuid, 'Esponja alambre con sujetador 3 und',  'Bonbril',    'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000ed'::uuid, 'Esponja oro/plata 2 und',              'Brio',       'pack',   2::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000111'::uuid, 'Esponja cocina oro/plata 2 und',       'Fregona',    'pack',   2::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000175'::uuid, 'Incienso lavanda 20 und',              'HEM',        'pack',   20::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000187'::uuid, 'Incienso mamá bebé 8 und',             'HEM',        'pack',   8::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000153'::uuid, 'Infusión Superblends Energy 10 bolsitas','Hindu',    'pack',   10::numeric,   'unit','[REVISAR] Categoría posible: Bebidas o Alacena, hoy en Aseo hogar'),
  ('a1000001-0000-4000-8000-000000000154'::uuid, 'Insecticida matarrastrero',            'Black Flag', 'bottle', 280::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000eb'::uuid, 'Jabón coco bebé 180 g x 3',            'Azul K',     'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000114'::uuid, 'Jabón lavanda 200 g x 3',              'Azul K',     'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000e9'::uuid, 'Jabón extra poder total 240 g x 3',    'Azul K',     'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000ec'::uuid, 'Jabón floral blanco/azul',             'Azul K',     'bar',    400::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000079'::uuid, 'Jabón líquido baby humectante',        'Dove',       'bottle', 400::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-000000000086'::uuid, 'Jabón body pitahaya naturals',         'Palmolive',  'bottle', 390::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000013f'::uuid, 'Jabón smoothie blackberry banana',     'Palmolive',  'bottle', 390::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-000000000087'::uuid, 'Jabón sport men 110 g x 3',            'Protex',     'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000156'::uuid, 'Jabón azul super fuerza 215 g x 3',    'Puro',       'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000074'::uuid, 'Jabón con bicarbonato 280 g x 3',      'Super Riel', 'pack',   3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000075'::uuid, 'Jabón coco',                           'Varela',     'bar',    300::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000b5'::uuid, 'Lavaloza líquido limón doypack',       'Crem',       'bottle', 1500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000e7'::uuid, 'Lavaloza líquido limón',               'Fleur',      'bottle', 1000::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000185'::uuid, 'Limpiador frescor 830 + 150 ml',       'A Klean',    'bottle', 980::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000f0'::uuid, 'Limpiador encanto bebé',               'A Klean',    'bottle', 980::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000015b'::uuid, 'Limpiador 3 en 1',                     'Fabuloso',   'bottle', 2000::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-00000000007a'::uuid, 'Limpiador multiusos lavanda',          'Fleur',      'bottle', 5000::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000155'::uuid, 'Limpiavidrios antiempañante doypack',  'Glassi',     'bottle', 500::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000d0'::uuid, 'Papel higiénico 4 hojas 26 m 9 rollos','Familia',    'pack',   9::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000018e'::uuid, 'Papel higiénico T/H 29.6 m 12 rollos', 'Familia',    'pack',   12::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000073'::uuid, 'Suavizante fresca 2.8 L x 2',          'Suavitel',   'pack',   2::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000f2'::uuid, 'Toalla T/H mega 120 hojas',            'Familia',    'roll',   120::numeric,  'unit',''),
  ('a1000001-0000-4000-8000-000000000129'::uuid, 'Toalla T/H green FSC 135 hojas',       'Familia',    'roll',   135::numeric,  'unit',''),
  ('a1000001-0000-4000-8000-00000000018c'::uuid, 'Toalla T/H 120 hojas',                 'Nube',       'roll',   120::numeric,  'unit',''),

  -- ============================== BEBIDAS ==============================
  ('a1000001-0000-4000-8000-000000000162'::uuid, 'Agua',                                 'Manantial',  'bottle', 1500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000183'::uuid, 'Agua Ecopack',                         'Cristal',    'bottle', 1000::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000ee'::uuid, 'Agua H2OH',                            'Seven Up',   'bottle', 600::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000012a'::uuid, 'Agua PET',                             'Cristal',    'bottle', 600::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-000000000071'::uuid, 'Cerveza Light lata 330 ml x 6',        'Águila',     'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000008b'::uuid, 'Cerveza Club Colombia dorada lata 330 ml x 6','Club Colombia','pack', 6::numeric,'unit',''),
  ('a1000001-0000-4000-8000-000000000163'::uuid, 'Gaseosa manzana',                      'Postobón',   'bottle', 2500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-00000000006e'::uuid, 'Sixpack cerveza Cero',                 'Águila',     'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000006c'::uuid, 'Sixpack cerveza',                      'Poker',      'pack',   6::numeric,    'unit',''),

  -- ============================== CUIDADO PERSONAL ==============================
  ('a1000001-0000-4000-8000-000000000159'::uuid, 'Acondicionador baby cabello claro',    'Johnsons',   'bottle', 400::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-000000000186'::uuid, 'Acondicionador baby fuerza y vitamina','Johnsons',   'bottle', 400::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000ef'::uuid, 'Crema dental smiles Liga de la Justicia','Colgate', 'unit',   75::numeric,   'ml',  ''),
  ('a1000001-0000-4000-8000-000000000157'::uuid, 'Crema dental smiles Minions',          'Colgate',    'unit',   75::numeric,   'ml',  ''),
  ('a1000001-0000-4000-8000-000000000085'::uuid, 'Crema dental 3D White',                'Oral-B',     'unit',   107::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000007c'::uuid, 'Cepillo 360 firme 5 und',              'Colgate',    'pack',   5::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000d3'::uuid, 'Desodorante antibacterial gel',        'Gillette',   'unit',   113::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000077'::uuid, 'Enjuague bucal kids Minions',          'Plax',       'bottle', 250::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000d2'::uuid, 'Gel papaya',                           'Bio Herbal', 'jar',    400::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000b7'::uuid, 'Guante doméstico corrugado talla 8',   'Protex',     'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000078'::uuid, 'Jabón sandía y lychee',                'Palmolive',  'bottle', 390::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000018d'::uuid, 'Pañitos manzanilla 80 und',            'Pequeñín',   'pack',   80::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-0000000000ea'::uuid, 'Protectores largos sin alas 50 und',   'Nosotras',   'pack',   50::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000189'::uuid, 'Seda dental Essential Floss 25 m x 2', 'Oral-B',     'pack',   2::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000015a'::uuid, 'Shampoo 2 en 1 suave y manejable',     'H&S',        'bottle', 650::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-000000000158'::uuid, 'Shampoo baby cabello claro',           'Johnson',    'bottle', 400::numeric,  'ml',  ''),

  -- ============================== FRUTAS ==============================
  ('a1000001-0000-4000-8000-000000000117'::uuid, 'Agraz',                                '',           'bag',    250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000009c'::uuid, 'Aguacate común',                       '',           'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000116'::uuid, 'Arándanos extra',                      '',           'pack',   125::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000100'::uuid, 'Bebida hidratante fresa kiwi',         'Suerox',     'bottle', 630::numeric,  'ml',  '[REVISAR] Está en categoría Frutas — debería ser Bebidas'),
  ('a1000001-0000-4000-8000-000000000104'::uuid, 'Ciruela sin semilla',                  'Santaféreño','pack',   200::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000119'::uuid, 'Fresa bolsa',                          '',           'bag',    400::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000004d'::uuid, 'Fresa estándar',                       '',           'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000bc'::uuid, 'Fresa extra',                          '',           'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000009e'::uuid, 'Fresa jumbo',                          '',           'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000083'::uuid, 'Limón malla',                          '',           'pack',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-00000000011c'::uuid, 'Pulpa de mora',                        'Fruticorbera','pack',  500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000012f'::uuid, 'Uchuvas empacadas',                    '',           'pack',   250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000ad'::uuid, 'Uva Isabella',                         '',           'pack',   400::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000146'::uuid, 'Pasabocas arándanos',                  'Santaféreño','pack',   100::numeric,  'g',   '[REVISAR] Está en Frutas — podría ser Mecato/Alacena'),

  -- ============================== LACTEOS ==============================
  ('a1000001-0000-4000-8000-000000000178'::uuid, 'Bebida láctea Bonyurt mini Trol 108 g x 2','Alpina', 'pack',   2::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000cb'::uuid, 'Bebida láctea Bonyurt multisabor 171 g x 6','Alpina','pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000110'::uuid, 'Bebida láctea Yogo Premio mora',       'Alpina',     'bottle', 150::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-0000000000b2'::uuid, 'Bebida láctea Yogo Premio fresa',      'Alpina',     'bottle', 150::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-000000000123'::uuid, 'Chocolatina con leche',                'Jet',        'unit',   11::numeric,   'g',   ''),
  ('a1000001-0000-4000-8000-00000000018a'::uuid, 'Chocolatina con leche 12 und',         'Jet',        'pack',   12::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-0000000000c8'::uuid, 'Crema de leche bolsa',                 'Celema',     'bag',    200::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000018b'::uuid, 'Crema Nucita leche con calcio 14 g x 6','Nucita',    'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000118'::uuid, 'Leche entera UHT bolsa',               'Alpina',     'bag',    1100::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000143'::uuid, 'Leche semidescremada UHT 6 und',       'Alpina',     'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000089'::uuid, 'Leche entera UHT bolsa 6 und',         'Alpina',     'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000b0'::uuid, 'Leche entera UHT bolsa 6 und',         'Alpina',     'pack',   6::numeric,    'unit','[REVISAR] Posible duplicado con 052274 / "...000089"'),
  ('a1000001-0000-4000-8000-0000000000c7'::uuid, 'Leche condensada doypack',             'La Lechera', 'unit',   600::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000c9'::uuid, 'Mantequilla con sal',                  'Colanta',    'unit',   125::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000014c'::uuid, 'Mantequilla con sal',                  'Colanta',    'unit',   250::numeric,  'g',   '[REVISAR] Posible duplicado con 7702129030236 (mismo producto, distinto código interno)'),
  ('a1000001-0000-4000-8000-000000000141'::uuid, 'Pasabocas mega queso',                 'Doritos',    'bag',    185::numeric,  'g',   '[REVISAR] Mecato/Alacena en vez de Lácteos'),
  ('a1000001-0000-4000-8000-000000000131'::uuid, 'Queso cremoso para untar',             'Alpina',     'unit',   380::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000161'::uuid, 'Queso cheddar',                        'Azteca',     'unit',   200::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000ac'::uuid, 'Queso mozzarella tajado',              'Colanta',    'unit',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-0000000000ca'::uuid, 'Queso crema',                          'Colanta',    'unit',   230::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000088'::uuid, 'Queso crema',                          'Colanta',    'unit',   400::numeric,  'g',   '[REVISAR] Posible duplicado con "...0000002d"'),
  ('a1000001-0000-4000-8000-000000000057'::uuid, 'Queso doble crema tajado',             'El Portal',  'unit',   400::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000122'::uuid, 'Queso doble crema bloque',             'La Florida', 'unit',   450::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000004f'::uuid, 'Queso mozzarella tajado',              'Colanta',    'pack',   500::numeric,  'g',   '[REVISAR] Posible duplicado con 7702129020756'),
  ('a1000001-0000-4000-8000-0000000000fe'::uuid, 'Tortilla con mantequilla 30 g x 8',    'Bimbo',      'pack',   8::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000052'::uuid, 'Yogurt baby natural',                  'Alpina',     'unit',   113::numeric,  'g',   '[REVISAR] Posible duplicado con 7702001148561'),
  ('a1000001-0000-4000-8000-00000000008a'::uuid, 'Yogurt baby vainilla',                 'Alpina',     'unit',   113::numeric,  'g',   '[REVISAR] Posible duplicado con 7702001148578'),
  ('a1000001-0000-4000-8000-0000000000ff'::uuid, 'Yogurt griego natural Hidden',         'Deja Mu',    'unit',   450::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000f4'::uuid, 'Yogurt frutos rojos',                  'Finesse',    'unit',   1700::numeric, 'g',   ''),

  -- ============================== MECATO ==============================
  ('a1000001-0000-4000-8000-000000000180'::uuid, 'Brownie de arequipe',                  'Ramo',       'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000066'::uuid, 'Tic Tac menta fresca',                 'Tic Tac',    'jar',    16::numeric,   'g',   ''),

  -- ============================== PANADERIA ==============================
  ('a1000001-0000-4000-8000-00000000006b'::uuid, 'Hoja de tamal',                        '',           'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-0000000000a6'::uuid, 'Pan artesano hamburguesa 4 und',       'Bimbo',      'pack',   4::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000aa'::uuid, 'Pan blanco tajado',                    'Bimbo',      'pack',   730::numeric,  'g',   '[REVISAR] Posible duplicado con 7705326023261'),
  ('a1000001-0000-4000-8000-000000000064'::uuid, 'Pan blanco tajado',                    'Bimbo',      'pack',   600::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000a8'::uuid, 'Pan perro 6 und',                      'Bimbo',      'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-0000000000bb'::uuid, 'Pan perro dorado 4 und',               'Bimbo',      'pack',   4::numeric,    'unit','[REVISAR] Posible duplicado con 7705326629166'),
  ('a1000001-0000-4000-8000-0000000000ab'::uuid, 'Pan super perro 6 und',                'Bimbo',      'pack',   6::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-000000000050'::uuid, 'Tortilla integral 8 und',              'Bimbo',      'pack',   8::numeric,    'unit',''),

  -- ============================== PROTEINAS ==============================
  ('a1000001-0000-4000-8000-0000000000d4'::uuid, 'Anillos de calamar apanados',          'Antillana',  'pack',   400::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000056'::uuid, 'Atún en agua abre-fácil',              'Van Camps',  'can',    160::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000005c'::uuid, 'Camarón precocido large',              '',           'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000006a'::uuid, 'Camarón precocido small',              '',           'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000010b'::uuid, 'Carne para hamburguesa 3 und',         'El Cuatrillo','pack',  3::numeric,    'unit',''),
  ('a1000001-0000-4000-8000-00000000005b'::uuid, 'Filete de tilapia',                    'Gran Langostino','pack',500::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-0000000000b8'::uuid, 'Filete de tilapia',                    'Río y Mar',  'pack',   350::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000d7'::uuid, 'Hígados bandeja',                      'Piku',       'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000fa'::uuid, 'Huevo de codorniz 24 und',             'Brofoods',   'pack',   24::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-000000000107'::uuid, 'Huevo AAA campesino 30 und',           'Doña Lupe',  'panal',  30::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-0000000000be'::uuid, 'Jamón estándar',                       'Pietrán',    'unit',   230::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000067'::uuid, 'Jamón cerdo',                          'Pietrán',    'unit',   431::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000bd'::uuid, 'Salchicha ranchera',                   '',           'unit',   480::numeric,  'g',   '[REVISAR] Marca posible: Zenú/Ranchera'),
  ('a1000001-0000-4000-8000-0000000000af'::uuid, 'Salchicha ranchera super',             '',           'unit',   525::numeric,  'g',   '[REVISAR] Marca posible: Zenú/Ranchera'),
  ('a1000001-0000-4000-8000-000000000166'::uuid, 'Tocineta ahumada',                     'Berna',      'unit',   200::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000a7'::uuid, 'Tocineta',                             'Rica',       'unit',   250::numeric,  'g',   '[REVISAR] Posible duplicado con 7702398040110'),
  ('a1000001-0000-4000-8000-00000000005e'::uuid, 'Vísceras de pollo',                    'Macpollo',   'unit',   null::numeric, null,  ''),

  -- ============================== VARIOS ==============================
  ('a1000001-0000-4000-8000-000000000051'::uuid, 'Cigarrillos',                          'Lucky Strike','pack',  10::numeric,   'unit',''),
  ('a1000001-0000-4000-8000-00000000016f'::uuid, 'Palillo tipo coctel',                  'Bambusa',    'jar',    161::numeric,  'unit',''),

  -- ============================== VERDURAS ==============================
  ('a1000001-0000-4000-8000-000000000094'::uuid, 'Acelga común bolsa',                   '',           'bag',    250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000012d'::uuid, 'Albahaca blanca',                      '',           'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-00000000009b'::uuid, 'Champiñón entero',                     'Champis',    'pack',   150::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000c4'::uuid, 'Champiñón entero',                     'Champis',    'pack',   250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000a4'::uuid, 'Cilantro',                             '',           'unit',   80::numeric,   'g',   '[REVISAR] Posible duplicado con 7708432897948'),
  ('a1000001-0000-4000-8000-0000000000e1'::uuid, 'Cimarrón',                             '',           'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000101'::uuid, 'Crema sopera pollo con champiñones',   'Maggi',      'unit',   60::numeric,   'g',   '[REVISAR] Está en Verduras — debería ser Alacena'),
  ('a1000001-0000-4000-8000-00000000016b'::uuid, 'Crema sopera champiñones 6 porciones', 'Maggi',      'unit',   90::numeric,   'g',   '[REVISAR] Está en Verduras — debería ser Alacena'),
  ('a1000001-0000-4000-8000-0000000000a1'::uuid, 'Espinaca bolsa',                       '',           'bag',    250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000ba'::uuid, 'Habichuela empacada',                  '',           'pack',   250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000018f'::uuid, 'Lechuga Batavia',                      '',           'unit',   null::numeric, null,  ''),
  ('a1000001-0000-4000-8000-000000000176'::uuid, 'Lechuga tropical',                     'Biofrescos', 'bag',    160::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000127'::uuid, 'Lechuga común',                        '',           'bag',    250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000c5'::uuid, 'Lechuga romana',                       'Hortifresco','bag',    200::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000095'::uuid, 'Lechuga romana tierna',                'Hortifresco','bag',    400::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000016e'::uuid, 'Papa cabello de ángel',                'Ripapa',     'unit',   300::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-0000000000f7'::uuid, 'Papas onduladas mayonesa',             'Margarita',  'bag',    105::numeric,  'g',   '[REVISAR] Está en Verduras — debería ser Mecato'),
  ('a1000001-0000-4000-8000-00000000017c'::uuid, 'Papas rizadas mayonesa',               'Yupi',       'bag',    105::numeric,  'g',   '[REVISAR] Está en Verduras — debería ser Mecato'),
  ('a1000001-0000-4000-8000-000000000053'::uuid, 'Papas rizadas naturales',              'Yupi',       'bag',    105::numeric,  'g',   '[REVISAR] Está en Verduras — debería ser Mecato'),
  ('a1000001-0000-4000-8000-0000000000e4'::uuid, 'Pimentón malla',                       '',           'pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000015e'::uuid, 'Pimientos',                            'Eurosemillas','pack',  250::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-000000000070'::uuid, 'Refajo Cola y Pola lata 330 ml x 6',   'Bavaria',    'pack',   6::numeric,    'unit','[REVISAR] Está en Verduras — debería ser Bebidas'),
  ('a1000001-0000-4000-8000-0000000000ce'::uuid, 'Salsa de tomate doypack',              'Constancia', 'unit',   1000::numeric, 'g',   '[REVISAR] Está en Verduras — debería ser Alacena'),
  ('a1000001-0000-4000-8000-000000000084'::uuid, 'Tomate chonto malla',                  '',           'pack',   1000::numeric, 'g',   ''),
  ('a1000001-0000-4000-8000-00000000010f'::uuid, 'Tomate uva',                           'El Diamante','pack',   500::numeric,  'g',   ''),
  ('a1000001-0000-4000-8000-00000000009d'::uuid, 'Tomate cherry contenedor',             '',           'pack',   500::numeric,  'g',   ''),

  -- ============================== AJUSTES MENORES (solo title case en name) ==============================
  ('a1000001-0000-4000-8000-000000000019'::uuid, 'Agua con gas limón',                   'D1',         'bottle', 1500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-00000000001a'::uuid, 'Agua con gas limonada',                'D1',         'bottle', 1500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-000000000018'::uuid, 'Agua con gas maracuyá',                'D1',         'bottle', 1500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-00000000001b'::uuid, 'Cola y pola',                          'Bavaria',    'can',    330::numeric,  'ml',  ''),
  ('a1000001-0000-4000-8000-00000000001c'::uuid, 'Coca-Cola sin azúcar',                 'Coca-Cola',  'bottle', 1500::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-00000000001d'::uuid, 'Soda',                                 'Izots',      'bottle', 1700::numeric, 'ml',  ''),
  ('a1000001-0000-4000-8000-00000000001e'::uuid, 'Cerveza Cero',                         'Águila',     'can',    330::numeric,  'ml',  '')

) as d(id, name, brand, display_unit, content_amount, content_unit, notes)
where p.id = d.id;

-- =====================================================================
-- Productos que NO se modifican (datos ya correctos): no aparecen arriba.
-- =====================================================================

-- =====================================================================
-- Productos que requieren decisión humana — marcados con [REVISAR]
-- en notes para que aparezcan en la sección "Pendientes de revisión"
-- de la UI. Incluye productos sin info suficiente, duplicados sospechosos
-- y los que vienen sin barcode pero con nombre genérico.
-- =====================================================================
update public.products
set notes = '[REVISAR] ' || coalesce(nullif(notes, ''), 'Sin info suficiente para limpiar (nombre genérico, sin marca, etc.)')
where household_id = '00000000-0000-0000-0000-000000000001'
  and barcode is null
  and id in (
    'a1000001-0000-4000-8000-000000000017'::uuid,  -- Crema dental Colgate Sensitive
    'a1000001-0000-4000-8000-000000000011'::uuid,  -- Crema dental Oral-B 3D White
    'a1000001-0000-4000-8000-000000000010'::uuid,  -- Enjuague bucal Plax 250ml
    'a1000001-0000-4000-8000-000000000014'::uuid,  -- Jabón Palmolive 390ml
    'a1000001-0000-4000-8000-000000000015'::uuid,  -- Jabón Protex 110g x3
    'a1000001-0000-4000-8000-000000000012'::uuid,  -- Maquinilla Gillette Venus
    'a1000001-0000-4000-8000-000000000016'::uuid,  -- Repuesto Gillette Mach3 4und
    'a1000001-0000-4000-8000-000000000013'::uuid,  -- Repuesto Gillette Venus 2und
    'a1000001-0000-4000-8000-000000000033'::uuid,  -- Hoja tamal
    'a1000001-0000-4000-8000-000000000044'::uuid,  -- Cilantro 80g (sin barcode)
    'a1000001-0000-4000-8000-000000000048'::uuid,  -- Tomate chonto (granel)
    'a1000001-0000-4000-8000-000000000049'::uuid,  -- Tomate chonto 1000g malla
    'a1000001-0000-4000-8000-00000000003e'::uuid,  -- Brócoli
    'a1000001-0000-4000-8000-00000000003f'::uuid,  -- Cebolla larga 500g
    'a1000001-0000-4000-8000-000000000042'::uuid,  -- Mandarina arrayana (granel)
    'a1000001-0000-4000-8000-000000000043'::uuid,  -- Aguacate común (sin barcode)
    'a1000001-0000-4000-8000-000000000045'::uuid,  -- Limón Tahití (granel)
    'a1000001-0000-4000-8000-000000000046'::uuid,  -- Limón 1000g malla
    'a1000001-0000-4000-8000-000000000047'::uuid,  -- Papa lista y fresca 2500g
    'a1000001-0000-4000-8000-00000000003c'::uuid,  -- Caderita res (granel)
    'a1000001-0000-4000-8000-00000000003a'::uuid,  -- Pechuga piku marinada
    'a1000001-0000-4000-8000-00000000003b'::uuid,  -- Pernil cerdo (granel)
    'a1000001-0000-4000-8000-000000000039'::uuid,  -- Chorizo Colanta 450g campesino
    'a1000001-0000-4000-8000-00000000004a'::uuid,  -- Plátano (granel)
    '37cc5c54-684e-40e9-8fb5-a8317fdc7cf1'::uuid   -- Huevos (creado a mano sin nada)
  );

commit;

-- =====================================================================
-- Verificación (descomenta y corre después)
-- =====================================================================
-- select
--   (select count(*) from public.products where household_id = '00000000-0000-0000-0000-000000000001') as total,
--   (select count(*) from public.products where household_id = '00000000-0000-0000-0000-000000000001' and brand <> '') as con_marca,
--   (select count(*) from public.products where household_id = '00000000-0000-0000-0000-000000000001' and notes like '[REVISAR]%') as a_revisar,
--   (select count(*) from public.products where household_id = '00000000-0000-0000-0000-000000000001' and display_unit <> 'unit') as con_display_unit_especifico;
