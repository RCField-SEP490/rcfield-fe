import { create } from "zustand"
import type { UserRole } from "@/shared/types/common"
import { storageKeys } from "@/shared/lib/storage"

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role?: UserRole
  phone?: string
  avatarUrl?: string
  registrationStatus?: string
}

type AuthState = {
  isInitialized: boolean
  isAuthenticated: boolean
  role: UserRole | null
  user: AuthUser | null
  setAuthenticated: (role: UserRole, user?: AuthUser) => void
  setUser: (user: AuthUser) => void
  clearAuthenticated: () => void
  setInitialized: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  isInitialized: false,
  isAuthenticated: false,
  role: null,
  user: null,
  setAuthenticated: (role, user) => set({ isAuthenticated: true, role, user }),
  setUser: (user) => set((state) => ({ user, role: user.role ?? state.role })),
  clearAuthenticated: () =>
    set((state) => {
      if (state.user?.email) {
        localStorage.setItem(storageKeys.lastEmail, state.user.email)
      }
      return { isAuthenticated: false, role: null, user: null }
    }),
  setInitialized: () => set({ isInitialized: true }),
}))
