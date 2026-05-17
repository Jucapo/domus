/**
 * Adapter de sesión: aísla la fuente de verdad del "usuario activo" y sus hogares.
 *
 * Comportamiento dual (transición sin breaking changes):
 *  - Si hay sesión Supabase Auth (`auth.getUser()` devuelve user): usa
 *    `household_members` para listar hogares y devuelve el user de auth.
 *  - Si NO hay sesión (auth no configurado todavía o user deslogueado): cae
 *    al modo legacy — primer profile del hogar único hardcodeado, igual que
 *    la app funcionaba hasta el hito 4.
 *
 * Cuando el usuario configure Google OAuth en Supabase Dashboard + aplique
 * `supabase/policies_v2.sql`, todo se "activa" sin tocar el resto del código.
 */
import { supabase } from './supabase'
import type { Household, Profile, UUID } from '../types'

/** Hogar único hardcodeado del modo legacy. */
const LEGACY_HOUSEHOLD_ID: UUID = '00000000-0000-0000-0000-000000000001'

export interface SessionSnapshot {
  user: Profile | null
  households: Household[]
  /** true si el snapshot vino de Supabase Auth (no del fallback legacy). */
  isAuthenticated: boolean
}

/** Snapshot vacío (no logueado y sin modo legacy disponible). */
const EMPTY_SNAPSHOT: SessionSnapshot = {
  user: null,
  households: [],
  isAuthenticated: false,
}

async function loadAuthenticatedSnapshot(authUser: {
  id: string
  email?: string | null
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string }
}): Promise<SessionSnapshot> {
  // Cast temporal: la tabla `household_members` existe en la migration 010
  // pero todavía no en los tipos generados (regenerar `supabase.ts` tras aplicar
  // la migration). Cuando se regeneren los tipos, este cast se puede eliminar.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase as any)
    .from('household_members')
    .select('household_id, households(id, name)')
    .eq('user_id', authUser.id)

  type MemberRow = { household_id: string; households: { id: string; name: string } | null }
  const rows = (members ?? []) as unknown as MemberRow[]

  const households: Household[] = rows
    .filter((m) => m.households)
    .map((m) => ({ id: m.households!.id, name: m.households!.name }))

  const displayName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email ||
    'Usuario'

  const user: Profile = {
    id: authUser.id,
    name: displayName,
    email: authUser.email ?? '',
    currentHouseholdId: households[0]?.id ?? '',
  }

  return { user, households, isAuthenticated: true }
}

async function loadLegacySnapshot(): Promise<SessionSnapshot> {
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
    isAuthenticated: false,
  }
}

/**
 * Carga el snapshot actual. Prefiere auth real; cae a legacy si no hay sesión.
 */
export async function loadSessionSnapshot(): Promise<SessionSnapshot> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) return await loadAuthenticatedSnapshot(authUser)
  } catch {
    // Sin sesión o auth no configurado: cae al legacy.
  }
  return loadLegacySnapshot()
}

/** Empty snapshot exportado para usos puntuales (logout). */
export { EMPTY_SNAPSHOT }
