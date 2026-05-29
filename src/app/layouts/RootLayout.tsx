import { useEffect } from "react"
import { Outlet } from "react-router"
import { Toaster } from "sonner"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import type { ImpersonationState } from "@/features/auth/stores/auth.store"
import { storageKeys } from "@/shared/lib/storage"
import type { UserRole } from "@/shared/types/common"

function AuthInitializer() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setInitialized = useAuthStore((state) => state.setInitialized)
  const startImpersonation = useAuthStore((state) => state.startImpersonation)

  useEffect(() => {
    const raw =
      localStorage.getItem(storageKeys.auth) ??
      sessionStorage.getItem(storageKeys.auth)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          user?: {
            id: string
            email: string
            fullName?: string
            phone?: string | null
            avatarUrl?: string | null
            role: UserRole
            registrationStatus?: string
          }
        }
        if (parsed.user?.role) {
          setAuthenticated(parsed.user.role, {
            id: parsed.user.id,
            fullName: parsed.user.fullName ?? parsed.user.email,
            email: parsed.user.email,
            phone: parsed.user.phone ?? undefined,
            avatarUrl: parsed.user.avatarUrl ?? undefined,
            registrationStatus: parsed.user.registrationStatus,
          })
        }
      } catch {
        // malformed storage — ignore
      }
    }

    // Restore impersonation state if present
    const impersonationRaw = localStorage.getItem(storageKeys.impersonation)
    if (impersonationRaw) {
      try {
        const imp = JSON.parse(impersonationRaw) as ImpersonationState
        if (imp.providerUserId && imp.providerName) {
          startImpersonation(imp)
        }
      } catch {
        localStorage.removeItem(storageKeys.impersonation)
      }
    }

    setInitialized()
  }, [setAuthenticated, setInitialized, startImpersonation])

  return null
}

export function RootLayout() {
  return (
    <>
      <AuthInitializer />
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  )
}
