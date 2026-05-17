/**
 * Adapter de sesión.
 *
 * Hoy: devuelve un user mock anclado al HOUSEHOLD_ID legacy (compatibilidad).
 * En el hito 6 (activar Supabase Auth) se reemplaza por `supabase.auth.getUser()`
 * + lectura de `household_members` para listar los hogares del usuario.
 *
 * El resto del código (useAuthStore, views, etc.) ya consume esta interfaz —
 * el switch del hito 6 es cambiar la implementación, no los consumidores.
 */
import { supabase } from './supabase'
import type { Household, Profile, UUID } from '../types'

/** Hogar único hardcodeado mientras no haya auth real. */
const LEGACY_HOUSEHOLD_ID: UUID = '00000000-0000-0000-0000-000000000001'

export interface SessionSnapshot {
  /** Usuario activo + el hogar actualmente seleccionado. `null` si no hay sesión. */
  user: Profile | null
  /** Lista de hogares a los que pertenece el usuario. */
  households: Household[]
}

/**
 * Implementación actual (pre-auth): toma el primer profile del hogar legacy
 * y lista todos los households (como sigue funcionando hoy).
 */
export async function loadSessionSnapshot(): Promise<SessionSnapshot> {
  const [{ data: profile }, { data: households }] = await Promise.all([
    supabase.from('profiles').select('*').eq('household_id', LEGACY_HOUSEHOLD_ID).single(),
    supabase.from('households').select('*'),
  ])

  const user: Profile = profile
    ? {
        id: profile.id,
        name: profile.name,
        email: profile.email ?? '',
        currentHouseholdId: profile.household_id,
      }
    : { id: 'anon', name: 'Usuario', email: '', currentHouseholdId: LEGACY_HOUSEHOLD_ID }

  return {
    user,
    households: (households || []).map((h) => ({ id: h.id, name: h.name })),
  }
}

/**
 * Placeholder para el hito 6: cuando se active Supabase Auth, reemplazar
 * `loadSessionSnapshot` por esta variante. Se deja stub para que el contrato
 * quede claro en el código.
 *
 * Implementación futura (pseudo):
 *   const { data: { user } } = await supabase.auth.getUser()
 *   if (!user) return { user: null, households: [] }
 *   const { data: members } = await supabase
 *     .from('household_members')
 *     .select('household_id, households(name)')
 *     .eq('user_id', user.id)
 *   ...
 */
export const HAS_REAL_AUTH = false
