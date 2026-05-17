import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Household, Profile, UUID } from '../types'

const HOUSEHOLD_ID: UUID = '00000000-0000-0000-0000-000000000001'

interface AuthState {
  user: Profile | null
  households: Household[]
  loading: boolean
  init: () => Promise<void>
  switchHousehold: (householdId: UUID) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  households: [],
  loading: true,

  init: async () => {
    const [{ data: profile }, { data: households }] = await Promise.all([
      supabase.from('profiles').select('*').eq('household_id', HOUSEHOLD_ID).single(),
      supabase.from('households').select('*'),
    ])

    set({
      user: profile
        ? { id: profile.id, name: profile.name, email: profile.email ?? '', currentHouseholdId: profile.household_id }
        : { id: 'anon', name: 'Usuario', email: '', currentHouseholdId: HOUSEHOLD_ID },
      households: (households || []).map((h) => ({ id: h.id, name: h.name })),
      loading: false,
    })
  },

  switchHousehold: (householdId) =>
    set((state) => ({
      user: state.user ? { ...state.user, currentHouseholdId: householdId } : null,
    })),
}))

export const useCurrentHousehold = (): Household | null =>
  useAuthStore((s) =>
    s.households.find((h) => h.id === s.user?.currentHouseholdId) ?? null,
  )
