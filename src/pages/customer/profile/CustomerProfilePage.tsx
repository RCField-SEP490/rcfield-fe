import { CustomerSubNav } from "@/pages/customer/components/CustomerSubNav"
import { ProfileSettingsCard } from "./components/ProfileSettingsCard"
import { ProfileSidebar } from "./components/ProfileSidebar"
import { ProfileVehiclesCard } from "./components/ProfileVehiclesCard"
import { ProfileWalletCard } from "./components/ProfileWalletCard"

export function CustomerProfilePage() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside>
          <ProfileSidebar />
        </aside>
        <main className="space-y-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Customer Center</p>
            <h1 className="text-3xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
          </div>
          <CustomerSubNav activeTab="profile" />
          <ProfileVehiclesCard />
          <ProfileSettingsCard />
          <ProfileWalletCard />
        </main>
      </div>
    </div>
  )
}
