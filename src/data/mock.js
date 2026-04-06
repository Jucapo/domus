export const MOCK_HOUSEHOLDS = [
  { id: 'household-1', name: 'Hogar A' },
  { id: 'household-2', name: 'Hogar B' },
]

export const MOCK_USERS = [
  {
    id: 'user-1',
    name: 'Juan Pérez',
    email: 'juan@domus.app',
    currentHouseholdId: 'household-1',
  },
]

export const MOCK_PRODUCTS = [
  { id: 'prod-1', householdId: 'household-1', name: 'Leche', category: 'Lácteos', quantity: 2 },
  { id: 'prod-2', householdId: 'household-1', name: 'Pan', category: 'Panadería', quantity: 1 },
  { id: 'prod-3', householdId: 'household-1', name: 'Huevos', category: 'Proteínas', quantity: 12 },
  { id: 'prod-4', householdId: 'household-1', name: 'Arroz', category: 'Granos', quantity: 0 },
  { id: 'prod-5', householdId: 'household-1', name: 'Aceite de oliva', category: 'Aceites', quantity: 1 },
  { id: 'prod-6', householdId: 'household-1', name: 'Jabón de platos', category: 'Limpieza', quantity: 0 },
  { id: 'prod-7', householdId: 'household-1', name: 'Papel higiénico', category: 'Higiene', quantity: 4 },
  { id: 'prod-8', householdId: 'household-1', name: 'Café', category: 'Bebidas', quantity: 0 },
  { id: 'prod-9', householdId: 'household-1', name: 'Pasta', category: 'Granos', quantity: 3 },
  { id: 'prod-10', householdId: 'household-1', name: 'Detergente', category: 'Limpieza', quantity: 1 },
  { id: 'prod-11', householdId: 'household-2', name: 'Yogur', category: 'Lácteos', quantity: 5 },
]
