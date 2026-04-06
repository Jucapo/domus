export const UNITS = [
  { id: 'unit', label: 'Unidad', abbreviation: 'ud' },
  { id: 'g', label: 'Gramos', abbreviation: 'g' },
  { id: 'kg', label: 'Kilogramos', abbreviation: 'kg' },
  { id: 'lb', label: 'Libras', abbreviation: 'lb' },
  { id: 'ml', label: 'Mililitros', abbreviation: 'ml' },
  { id: 'l', label: 'Litros', abbreviation: 'L' },
  { id: 'bottle', label: 'Botella', abbreviation: 'bot' },
  { id: 'jar', label: 'Tarro', abbreviation: 'tarro' },
  { id: 'can', label: 'Lata', abbreviation: 'lata' },
  { id: 'box', label: 'Caja', abbreviation: 'caja' },
  { id: 'bag', label: 'Bolsa', abbreviation: 'bolsa' },
  { id: 'roll', label: 'Rollo', abbreviation: 'rollo' },
  { id: 'pack', label: 'Paquete', abbreviation: 'paq' },
  { id: 'dozen', label: 'Docena', abbreviation: 'doc' },
]

export const MOCK_HOUSEHOLDS = [
  { id: 'household-1', name: 'La Julia' },
  { id: 'household-2', name: 'Hogar B' },
]

export const MOCK_USERS = [
  {
    id: 'user-1',
    name: 'Familia Posso Polo',
    email: 'fliapossopolo19@gmail.com',
    currentHouseholdId: 'household-1',
  },
]

export const MOCK_CATEGORIES = [
  { id: 'cat-1', householdId: 'household-1', name: 'Lácteos' },
  { id: 'cat-2', householdId: 'household-1', name: 'Panadería' },
  { id: 'cat-3', householdId: 'household-1', name: 'Proteínas' },
  { id: 'cat-4', householdId: 'household-1', name: 'Granos' },
  { id: 'cat-5', householdId: 'household-1', name: 'Aceites' },
  { id: 'cat-6', householdId: 'household-1', name: 'Limpieza' },
  { id: 'cat-7', householdId: 'household-1', name: 'Higiene' },
  { id: 'cat-8', householdId: 'household-1', name: 'Bebidas' },
  { id: 'cat-9', householdId: 'household-2', name: 'Lácteos' },
]

export const MOCK_PRODUCTS = [
  { id: 'prod-1', householdId: 'household-1', name: 'Leche', category: 'Lácteos', quantity: 2, unit: 'l', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-2', householdId: 'household-1', name: 'Pan', category: 'Panadería', quantity: 1, unit: 'unit', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-3', householdId: 'household-1', name: 'Huevos', category: 'Proteínas', quantity: 12, unit: 'dozen', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-4', householdId: 'household-1', name: 'Arroz', category: 'Granos', quantity: 0, unit: 'kg', inShoppingList: true, pendingRegistration: false },
  { id: 'prod-5', householdId: 'household-1', name: 'Aceite de oliva', category: 'Aceites', quantity: 1, unit: 'bottle', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-6', householdId: 'household-1', name: 'Jabón de platos', category: 'Limpieza', quantity: 0, unit: 'bottle', inShoppingList: true, pendingRegistration: false },
  { id: 'prod-7', householdId: 'household-1', name: 'Papel higiénico', category: 'Higiene', quantity: 4, unit: 'roll', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-8', householdId: 'household-1', name: 'Café', category: 'Bebidas', quantity: 0, unit: 'bag', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-9', householdId: 'household-1', name: 'Pasta', category: 'Granos', quantity: 3, unit: 'bag', inShoppingList: false, pendingRegistration: false },
  { id: 'prod-10', householdId: 'household-1', name: 'Detergente', category: 'Limpieza', quantity: 1, unit: 'bottle', inShoppingList: true, pendingRegistration: false },
  { id: 'prod-11', householdId: 'household-2', name: 'Yogur', category: 'Lácteos', quantity: 5, unit: 'unit', inShoppingList: false, pendingRegistration: false },
]

export const MOCK_PRICE_RECORDS = [
  { id: 'price-1', productId: 'prod-1', householdId: 'household-1', price: 4500, store: 'Éxito', date: '2026-03-02' },
  { id: 'price-2', productId: 'prod-1', householdId: 'household-1', price: 4200, store: 'Jumbo', date: '2026-03-15' },
  { id: 'price-3', productId: 'prod-1', householdId: 'household-1', price: 4800, store: 'Éxito', date: '2026-04-01' },
  { id: 'price-4', productId: 'prod-3', householdId: 'household-1', price: 12000, store: 'Plaza de mercado', date: '2026-03-05' },
  { id: 'price-5', productId: 'prod-3', householdId: 'household-1', price: 11500, store: 'Jumbo', date: '2026-03-20' },
  { id: 'price-6', productId: 'prod-4', householdId: 'household-1', price: 3800, store: 'D1', date: '2026-02-28' },
  { id: 'price-7', productId: 'prod-4', householdId: 'household-1', price: 4100, store: 'Éxito', date: '2026-03-18' },
  { id: 'price-8', productId: 'prod-5', householdId: 'household-1', price: 28000, store: 'Jumbo', date: '2026-03-10' },
  { id: 'price-9', productId: 'prod-8', householdId: 'household-1', price: 15000, store: 'D1', date: '2026-03-12' },
  { id: 'price-10', productId: 'prod-8', householdId: 'household-1', price: 16500, store: 'Éxito', date: '2026-03-28' },
  { id: 'price-11', productId: 'prod-10', householdId: 'household-1', price: 9800, store: 'Ara', date: '2026-03-08' },
]
