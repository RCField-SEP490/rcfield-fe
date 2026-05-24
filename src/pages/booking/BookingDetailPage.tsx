import { CalendarClock, Car, CheckCircle2, Clock3, CreditCard, MapPin, QrCode, RotateCcw, XCircle } from "lucide-react"
import { Link, useParams } from "react-router"
import { getDemoBookingSnapshot } from "@/features/customer-booking/data/customer-booking-demo"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { formatCurrency } from "@/shared/lib/format"

export function BookingDetailPage() {
  const params = useParams()
  const booking = getDemoBookingSnapshot()
  const bookingId = params.bookingId ?? booking.bookingId
  const total = booking.paymentComponents.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link to="/customer/bookings" className="hover:text-foreground">Quay lại danh sách</Link>
          <span className="mx-2">/</span>
          <span>Đơn đặt #{bookingId}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-4">
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl">Đơn đặt #{bookingId}</CardTitle>
                  <p className="mt-2 text-muted-foreground">Ngày tạo: 24/10/2026, 14:30</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Đã xác nhận</Badge>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6 pl-8">
                  <div className="absolute left-3 top-3 h-[calc(100%-24px)] w-px bg-border" />
                  <TimelineItem icon={CheckCircle2} title="Đặt thành công" description="24/10/2026, 14:30" done />
                  <TimelineItem icon={Clock3} title="Chờ check-in" description="Dự kiến: 26/05/2026, 09:00" />
                  <TimelineItem icon={CalendarClock} title="Hoàn thành" description="Chưa bắt đầu" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <DetailLine icon={Car} label="Phương tiện" value={booking.vehicle.name} />
                <DetailLine icon={MapPin} label="Địa điểm" value={booking.cafe.name} />
                <DetailLine icon={CreditCard} label="Dịch vụ" value={booking.packageName} />
                <DetailLine icon={Clock3} label="Thời gian" value="09:00 - 11:00, 26/05/2026" />
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-4">
            <Card className="rounded-xl text-center shadow-sm">
              <CardHeader>
                <CardTitle>Mã Check-in</CardTitle>
                <p className="text-sm text-muted-foreground">Quét mã này tại quầy để nhận xe</p>
              </CardHeader>
              <CardContent>
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border bg-muted">
                  <QrCode className="h-28 w-28 text-foreground" />
                </div>
                <Badge variant="secondary" className="mt-3">{booking.checkInCode}</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.paymentComponents.map((line) => (
                  <div key={line.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{line.label}</span>
                    <span className="font-medium">{formatCurrency(line.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Đã thanh toán qua VNPAY</div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4" /> Thay đổi lịch
            </Button>
            <Button variant="destructive" className="w-full">
              <XCircle className="h-4 w-4" /> Hủy đơn
            </Button>
          </aside>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ icon: Icon, title, description, done = false }: { icon: typeof CheckCircle2; title: string; description: string; done?: boolean }) {
  return (
    <div className="relative">
      <span className={`absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full border bg-background ${done ? "text-emerald-600" : "text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function DetailLine({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
      </div>
    </div>
  )
}
