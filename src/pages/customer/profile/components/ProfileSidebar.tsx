import { CalendarCheck, CreditCard, Medal, ShieldCheck } from "lucide-react"
import { demoCustomerProfile } from "@/features/customer-booking/data/customer-booking-demo"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function ProfileSidebar() {
  const progress = Math.round((demoCustomerProfile.points / (demoCustomerProfile.points + demoCustomerProfile.pointsToNextTier)) * 100)

  return (
    <div className="space-y-4">
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="relative mx-auto h-24 w-24">
            <Avatar className="h-24 w-24">
              <AvatarImage src={demoCustomerProfile.avatarUrl} />
              <AvatarFallback>NA</AvatarFallback>
            </Avatar>
            <Button size="icon-sm" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow">
              <ShieldCheck className="h-3.5 w-3.5" />
            </Button>
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{demoCustomerProfile.fullName}</h2>
          <p className="text-sm text-muted-foreground">{demoCustomerProfile.email}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Ngày tham gia</p>
              <p className="font-semibold">{new Date(demoCustomerProfile.joinedAt).toLocaleDateString("vi-VN")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Số booking</p>
              <p className="font-semibold">{demoCustomerProfile.bookingCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Medal className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-amber-700">Hạng thành viên</p>
              <h3 className="text-xl font-semibold text-amber-900">{demoCustomerProfile.memberTier}</h3>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-amber-900">
              <span>{demoCustomerProfile.points.toLocaleString("vi-VN")} điểm</span>
              <span>Còn {demoCustomerProfile.pointsToNextTier.toLocaleString("vi-VN")} điểm</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-100">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-20 flex-col gap-2 bg-background">
          <CalendarCheck className="h-5 w-5" />
          Lịch sử booking
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 bg-background">
          <CreditCard className="h-5 w-5" />
          Ví & thanh toán
        </Button>
      </div>
    </div>
  )
}
