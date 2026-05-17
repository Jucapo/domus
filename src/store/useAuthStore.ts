import { create } from 'zustand'
import { loadSessionSnapshot } from '../lib/sessionAdapter'
import { supabase } from '../lib/supabase'
import type { Household, Profile, UUID } from '../types'

interface AuthState {
  user: Profile | null
  households: Household[]
  loading: boolean
  /** true cuando la sesión viene de Supabase Auth (no del fallback legacy). */
  isAuthenticated: boolean
  /** Subscribe a cambios de Supabase Auth + carga snapshot inicial. */
  init: () => Promise<() => void>
  /** Refresca el snapshot (útil tras crear un hogar o aceptar invitación). */
  refresh: () => Promise<void>
  switchHousehold: (householdId: UUID) => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  households: [],
  loading: true,
  isAuthenticated: false,

  init: async () => {
    await get().refresh()
    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        await get().refresh()
      }
    })
    return () => {
      data.subscription.unsubscribe()
    }
  },

  refresh: async () => {
    const snapshot = await loadSessionSnapshot()
    set({
      user: snapshot.user,
      households: snapshot.households,
      isAuthenticated: snapshot.isAuthenticated,
      loading: false,
    })
  },

  switchHousehold: (householdId) =>
    set((state) => ({
      user: state.user ? { ...state.user, currentHouseholdId: householdId } : null,
    })),

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    await get().refresh()
  },
}))

export const useCurrentHousehold = (): Household | null =>
  useAuthStore((s) =>
    s.households.find((h) => h.id === s.user?.currentHouseholdId) ?? null,
  )
