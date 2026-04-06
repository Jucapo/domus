import { create } from 'zustand'
import { MOCK_USERS, MOCK_HOUSEHOLDS } from '../data/mock'

export const useAuthStore = create((set) => ({
  user: MOCK_USERS[0],
  households: MOCK_HOUSEHOLDS,

  switchHousehold: (householdId) =>
    set((state) => ({
      user: { ...state.user, currentHouseholdId: householdId },
    })),
}))

export const useCurrentHousehold = () =>
  useAuthStore((s) =>
    s.households.find((h) => h.id === s.user.currentHouseholdId) ?? null,
  )
