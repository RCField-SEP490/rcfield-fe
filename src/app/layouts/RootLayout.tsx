import { useEffect } from "react"
import { Outlet } from "react-router"
import { Toaster } from "sonner"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { storageKeys } from "@/shared/lib/storage"
import type { UserRole } from "@/shared/types/common"

function AuthInitializer() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setInitialized = useAuthStore((state) => state.setInitialized)

  useEffect(() => {
    const raw =
      localStorage.getItem(storageKeys.auth) ??
      sessionStorage.getItem(storageKeys.auth)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user?: { id: string; email: string; role: UserRole } }
        if (parsed.user?.role) {
          setAuthenticated(parsed.user.role, {
            id: parsed.user.id,
            fullName: parsed.user.email,
            email: parsed.user.email,
          })
        }
      } catch {
        // malformed storage — ignore
      }
    }
    setInitialized()
  }, [setAuthenticated, setInitialized])

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
