import axios from "axios"
import { toast } from "sonner"
import { env } from "./env"
import { storageKeys } from "./storage"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { router } from "@/app/router/routes"
import { routePaths } from "@/app/router/route-paths"

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem(storageKeys.auth) ?? sessionStorage.getItem(storageKeys.auth)
  if (stored) {
    try {
      const { accessToken } = JSON.parse(stored) as { accessToken?: string }
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const code = error?.response?.data?.code

    if (status === 401 || code === "TOKEN_INVALID" || code === "TOKEN_EXPIRED") {
      const adminRaw = localStorage.getItem(storageKeys.adminAuth)
      if (adminRaw) {
        // Graceful exit from impersonation — restore admin session and reload
        localStorage.setItem(storageKeys.auth, adminRaw)
        localStorage.removeItem(storageKeys.adminAuth)
        localStorage.removeItem(storageKeys.impersonation)
        toast.error("Phiên hỗ trợ đã hết hạn", { description: "Đã khôi phục phiên quản trị viên." })
        window.location.href = "/admin/providers"
        return Promise.reject(error)
      }
      useAuthStore.getState().clearAuthenticated()
      localStorage.removeItem(storageKeys.auth)
      sessionStorage.removeItem(storageKeys.auth)
      toast.error("Vui lòng đăng nhập lại", { description: "Phiên đăng nhập đã hết hạn." })
      void router.navigate(routePaths.login, { replace: true })
    }

    return Promise.reject(error)
  },
)
