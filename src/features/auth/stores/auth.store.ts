import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserRole } from "@/shared/types/common"

export type AuthUser = {
  id: string
  fullName: string
  email: string
  phone?: string
  avatarUrl?: string
}

type AuthState = {
  isAuthenticated: boolean
  role: UserRole | null
  user: AuthUser | null
  setAuthenticated: (role: UserRole, user?: AuthUser) => void
  clearAuthenticated: () => void
}

export const demoAuthUser: AuthUser = {
  id: "user-demo-customer",
  fullName: "Nguyễn Văn A",
  email: "nguyen.vana@example.com",
  phone: "0901234567",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      user: null,
      setAuthenticated: (role, user = demoAuthUser) => set({ isAuthenticated: true, role, user }),
      clearAuthenticated: () => set({ isAuthenticated: false, role: null, user: null }),
    }),
    {
      name: "rcfield-auth-demo",
    },
  ),
)
