import { create } from "zustand"
import type { UserRole } from "@/shared/types/common"

type AuthState = {
  isAuthenticated: boolean
  role: UserRole | null
  setAuthenticated: (role: UserRole) => void
  clearAuthenticated: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  setAuthenticated: (role) => set({ isAuthenticated: true, role }),
  clearAuthenticated: () => set({ isAuthenticated: false, role: null }),
}))
