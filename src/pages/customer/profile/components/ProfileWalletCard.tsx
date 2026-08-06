import { CreditCard, ShieldCheck, WalletCards } from "lucide-react"
import { demoCustomerProfile } from "@/features/customer-booking/data/customer-booking-demo"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function ProfileWalletCard() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Ví & thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {demoCustomerProfile.savedPaymentMethods.map((method) => (
          <div key={method.id} className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {method.provider === "VNPAY" ? <WalletCards className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium">{method.label}</p>
                <p className="text-sm text-muted-foreground">{method.masked}</p>
              </div>
            </div>
            {method.provider === "VNPAY" && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><ShieldCheck className="h-3 w-3" /> Mặc định</Badge>}
          </div>
        ))}
        <Button variant="outline" className="w-full">Thêm phương thức thanh toán</Button>
      </CardContent>
    </Card>
  )
}
