import { CustomerSubNav } from "@/pages/customer/components/CustomerSubNav"
import { CustomerPageShell } from "@/pages/customer/components/CustomerPageShell"
import { DriverPassportCard } from "./components/DriverPassportCard"
import { ProfileSettingsCard } from "./components/ProfileSettingsCard"
import { ProfileVehiclesCard } from "./components/ProfileVehiclesCard"
import { ProfileWalletCard } from "./components/ProfileWalletCard"

export function CustomerProfilePage() {
  return (
    <CustomerPageShell>
      <CustomerSubNav activeTab="profile" />
      <DriverPassportCard />
      <ProfileVehiclesCard />
      <ProfileSettingsCard />
      <ProfileWalletCard />
    </CustomerPageShell>
  )
}
