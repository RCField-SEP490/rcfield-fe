import { api } from "@/shared/lib/axios"
import type { UserRole } from "@/shared/types/common"

type BackendRole = "CUSTOMER" | "STAFF" | "PROVIDER" | "ADMIN"

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  phone?: string
  password: string
  role: Extract<UserRole, "customer" | "provider">
}

export type AuthUser = {
  id: string
  email: string
  role: UserRole
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

type BackendLoginResponse = {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
    user: {
      id: string
      email: string
      role: BackendRole
    }
  }
}

const roleMap: Record<BackendRole, UserRole> = {
  CUSTOMER: "customer",
  STAFF: "staff",
  PROVIDER: "provider",
  ADMIN: "admin",
}

export async function loginWithPassword(payload: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<BackendLoginResponse>("/v1/auth/login", payload)
  const { access_token, refresh_token, user } = response.data.data

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    user: {
      id: user.id,
      email: user.email,
      role: roleMap[user.role],
    },
  }
}

export async function registerWithPassword(payload: RegisterRequest): Promise<LoginResponse> {
  const response = await api.post<BackendLoginResponse>("/v1/auth/register", {
    full_name: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: payload.role.toUpperCase(),
  })
  const { access_token, refresh_token, user } = response.data.data

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    user: {
      id: user.id,
      email: user.email,
      role: roleMap[user.role],
    },
  }
}

export async function logoutSession(accessToken: string, refreshToken: string): Promise<void> {
  await api.post(
    "/v1/auth/logout",
    { refresh_token: refreshToken },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
}
