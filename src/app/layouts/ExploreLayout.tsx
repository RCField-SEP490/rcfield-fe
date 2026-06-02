import { Outlet } from "react-router"
import { PublicHeader } from "@/shared/components/PublicHeader"

export function ExploreLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50/80 text-slate-950">
      <PublicHeader />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
