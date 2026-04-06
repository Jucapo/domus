import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001'

export const useAuthStore = create((set, get) => ({
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
        ? { id: profile.id, name: profile.name, email: profile.email, currentHouseholdId: profile.household_id }
        : { id: 'anon', name: 'Usuario', email: '', currentHouseholdId: HOUSEHOLD_ID },
      households: (households || []).map((h) => ({ id: h.id, name: h.name })),
      loading: false,
    })
  },

  switchHousehold: (householdId) =>
    set((state) => ({
      user: { ...state.user, currentHouseholdId: householdId },
    })),
}))

export const useCurrentHousehold = () =>
  useAuthStore((s) =>
    s.households.find((h) => h.id === s.user?.currentHouseholdId) ?? null,
  )
