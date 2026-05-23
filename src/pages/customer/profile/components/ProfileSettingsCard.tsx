import { LockKeyhole, Mail, MessageSquareText, Save, Trash2 } from "lucide-react"
import { demoCustomerProfile } from "@/features/customer-booking/data/customer-booking-demo"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"
import { Switch } from "@/shared/ui/switch"

export function ProfileSettingsCard() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Cài đặt & bảo mật</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thông tin cơ bản</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <Label>Họ và tên</Label>
              <Input defaultValue={demoCustomerProfile.fullName} />
            </label>
            <label className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input defaultValue={demoCustomerProfile.phone} />
            </label>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thông báo</p>
          <NotificationRow icon={Mail} title="Email Marketing" description="Nhận tin tức khuyến mãi, giải đua và sự kiện." defaultChecked />
          <NotificationRow icon={MessageSquareText} title="SMS Booking Reminders" description="Nhận tin nhắn nhắc nhở trước giờ chạy." defaultChecked />
        </section>

        <Separator />

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bảo mật</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <LockKeyhole className="h-4 w-4" /> Đổi mật khẩu
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" /> Xóa tài khoản
            </Button>
          </div>
        </section>

        <div className="flex justify-end">
          <Button>
            <Save className="h-4 w-4" /> Lưu thay đổi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  defaultChecked,
}: {
  icon: typeof Mail
  title: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-3">
        <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  )
}
