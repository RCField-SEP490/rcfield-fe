import { MoreVertical, Plus } from "lucide-react"
import { mockCustomerVehicles } from "@/shared/data/user-mock-data"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function ProfileVehiclesCard() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Phương tiện của tôi</CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Thêm phương tiện
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {mockCustomerVehicles.slice(0, 2).map((vehicle) => (
          <article key={vehicle.vehicleId} className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <img src={vehicle.imageUrl} alt={vehicle.name} className="h-16 w-16 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{vehicle.name}</p>
              <p className="text-sm text-muted-foreground">Loại: {vehicle.chassisType} · {vehicle.scale}</p>
              <Badge variant={vehicle.status === "approved" ? "secondary" : "outline"} className="mt-2">
                {vehicle.status === "approved" ? "Hoạt động tốt" : "Đang chờ duyệt"}
              </Badge>
            </div>
            <Button size="icon-sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
