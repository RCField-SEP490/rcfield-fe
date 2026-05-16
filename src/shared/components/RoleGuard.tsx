import { Navigate } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import type { UserRole } from "@/shared/types/common"

export type RoleGuardProps = {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const role = useAuthStore((state) => state.role)

  if (role && !allowedRoles.includes(role)) {
    return <Navigate replace to={routePaths.forbidden} />
  }

  return children
}
