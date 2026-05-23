import { CalendarDays, Car, CheckCircle2, Download, Eye, Home, MapPin } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { getDemoBookingSnapshot } from "@/features/customer-booking/data/customer-booking-demo"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { formatCurrency } from "@/shared/lib/format"

export function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const booking = getDemoBookingSnapshot()
  const bookingId = searchParams.get("bookingId") ?? booking.bookingId
  const total = booking.paymentComponents.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden rounded-xl text-center shadow-sm">
          <CardHeader className="border-b bg-background py-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="mt-4 text-3xl">Thanh toán thành công</CardTitle>
            <p className="text-muted-foreground">Mã đặt chỗ: <span className="font-semibold text-foreground">{bookingId}</span></p>
          </CardHeader>
          <CardContent className="space-y-6 p-6 text-left">
            <section>
              <h2 className="mb-3 border-l-4 border-primary pl-3 text-lg font-semibold">Tóm tắt phiên chạy</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile icon={MapPin} label="Địa điểm" value={booking.cafe.name} />
                <InfoTile icon={CalendarDays} label="Thời gian" value="09:00 - 11:00" />
                <InfoTile icon={Car} label="Phương tiện" value={booking.vehicle.name} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 border-l-4 border-primary pl-3 text-lg font-semibold">Chi tiết hóa đơn</h2>
              <div className="rounded-xl border">
                {booking.paymentComponents.map((line) => (
                  <div key={line.id} className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0">
                    <span className="text-muted-foreground">{line.label}</span>
                    <span className="font-medium">{formatCurrency(line.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between px-4 py-4 text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link to="/customer/bookings">
              <Home className="h-4 w-4" /> Quay lại lịch đặt
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to={`/booking/${bookingId}`}>
              <Eye className="h-4 w-4" /> Xem chi tiết đặt chỗ
            </Link>
          </Button>
        </div>
        <Button variant="ghost" className="mx-auto mt-4 flex gap-2">
          <Download className="h-4 w-4" /> Tải hóa đơn PDF
        </Button>
      </div>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold">{value}</p>
    </div>
  )
}
