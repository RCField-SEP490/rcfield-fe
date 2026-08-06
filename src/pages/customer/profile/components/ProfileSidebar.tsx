import { useQuery } from "@tanstack/react-query"
import { Trophy } from "lucide-react"

import { useAuthStore } from "@/features/auth/stores/auth.store"
import { useMyBookings } from "@/features/booking/hooks/use-booking"
import { racingApi, racingQueryKeys } from "@/features/racing/api/racing.api"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Card, CardContent } from "@/shared/ui/card"

export function ProfileSidebar() {
  const user = useAuthStore((state) => state.user)
  const { data: bookingsData } = useMyBookings()
  const bookingCount = bookingsData?.total ?? 0
  const { data: passport } = useQuery({
    queryKey: racingQueryKeys.passport(),
    queryFn: () => racingApi.getMyPassport(),
    retry: false,
    staleTime: 60_000,
  })

  const fullName = user?.fullName ?? "--"
  const email = user?.email ?? "--"
  const avatarUrl = user?.avatarUrl ?? undefined
  const titleLabel = passport?.current_title.label ?? null

  return (
    <div className="space-y-4">
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="relative mx-auto h-24 w-24">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
              {titleLabel ? (
                <AvatarBadge className="size-5 [&>svg]:size-3">
                  <Trophy />
                </AvatarBadge>
              ) : null}
            </Avatar>
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{fullName}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          {titleLabel ? (
            <div className="mt-3 flex justify-center">
              <DriverTitleChip
                label={titleLabel}
                code={passport?.current_title.code}
              />
            </div>
          ) : null}
          {passport ? (
            <p className="mt-2 text-xs text-muted-foreground">
              @{passport.driver_handle} · Hộ chiếu {passport.passport_code}
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Số booking</p>
              <p className="font-semibold">{bookingCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lượt chơi</p>
              <p className="font-semibold">
                {passport ? passport.stats.completed_plays : "--"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {passport ? (
        <Card className="rounded-xl border-orange-200 bg-orange-50/60 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {passport.stats.completed_plays}
                </p>
                <p className="text-xs text-muted-foreground">Lượt chơi</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">
                  {passport.stats.distinct_cafes_played}
                </p>
                <p className="text-xs text-muted-foreground">Quán đã đi</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">
                  {passport.achievements.length}
                </p>
                <p className="text-xs text-muted-foreground">Danh hiệu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(-2)
    .toUpperCase()
}
