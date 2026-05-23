import type { ReactNode } from "react"
import { PublicFooter } from "@/shared/components/PublicFooter"
import { PublicHeader } from "@/shared/components/PublicHeader"

export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
