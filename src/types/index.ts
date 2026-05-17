export * from './domain'
export type { Database, Json } from './supabase'

/**
 * Helpers para acceder a las filas/inserts/updates de cada tabla.
 * Uso: `Tables<'products'>` → tipo de fila de `public.products`.
 */
import type { Database } from './supabase'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
