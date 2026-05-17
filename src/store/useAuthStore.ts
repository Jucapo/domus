import { create } from 'zustand'
import { loadSessionSnapshot } from '../lib/sessionAdapter'
import type { Household, Profile, UUID } from '../types'

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
    const snapshot = await loadSessionSnapshot()
    set({
      user: snapshot.user,
      households: snapshot.households,
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
