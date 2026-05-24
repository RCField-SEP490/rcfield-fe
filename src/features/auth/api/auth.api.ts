import { api } from "@/shared/lib/axios"
import type { UserRole } from "@/shared/types/common"
import { getAuthFromJwt } from "../lib/jwt"

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

export async function loginWithPassword(payload: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<BackendLoginResponse>("/v1/auth/login", payload)
  const { access_token, refresh_token, user } = response.data.data
  const jwtUser = getAuthFromJwt(access_token)

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    user: {
      id: jwtUser.id || user.id,
      email: jwtUser.email || user.email,
      role: jwtUser.role,
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
  const jwtUser = getAuthFromJwt(access_token)

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    user: {
      id: jwtUser.id || user.id,
      email: jwtUser.email || user.email,
      role: jwtUser.role,
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
