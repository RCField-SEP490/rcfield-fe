import type { ReactNode } from "react"
import { PublicFooter } from "@/shared/components/PublicFooter"
import { PublicHeader } from "@/shared/components/PublicHeader"

export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  )
}
