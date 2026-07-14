import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Clock3, MapPin, Search, Waypoints } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { trackTypeApi } from "@/features/cafes/api/cafe.api"
import { getCafes } from "@/features/explore/api/explore.api"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const TIME_SLOTS = [
  "Mọi khung giờ",
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "20:00 - 22:00",
] as const

type FieldShellProps = {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

export function HomeSearchPanel() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [city, setCity] = useState("all")
  const [trackType, setTrackType] = useState("all")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("all")

  const { data: cafes = [] } = useQuery({
    queryKey: ["landing", "search-cafes"],
    queryFn: () => getCafes({ limit: 100 }),
  })

  const { data: trackTypes = [] } = useQuery({
    queryKey: ["landing", "track-types"],
    queryFn: () => trackTypeApi.listAll(),
  })

  const cityOptions = useMemo(() => {
    const uniqueCities = Array.from(
      new Set(cafes.map((cafe) => cafe.city).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right, "vi"))

    return [{ value: "all", label: "Tất cả địa điểm" }, ...uniqueCities.map((item) => ({ value: item, label: item }))]
  }, [cafes])

  const trackTypeOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả loại sân" },
      ...trackTypes.map((item) => ({ value: item.code, label: item.name })),
    ],
    [trackTypes],
  )

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (city !== "all") params.set("city", city)
    if (trackType !== "all") params.set("trackType", trackType)
    if (date) params.set("date", date)
    if (time !== "all") params.set("time", time)
    navigate(`/cafes?${params.toString()}`)
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="home-search-panel rounded-[28px] border border-white/70 bg-white/88 p-4 shadow-[var(--landing-shadow-soft)] backdrop-blur xl:p-5"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.15fr_1.15fr_0.95fr_0.95fr_auto]">
        <FieldShell icon={<MapPin className="h-4 w-4" />} label="Vị trí">
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={fieldClassName}
          >
            {cityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell icon={<Waypoints className="h-4 w-4" />} label="Loại sân">
          <select
            value={trackType}
            onChange={(event) => setTrackType(event.target.value)}
            className={fieldClassName}
          >
            {trackTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell icon={<CalendarDays className="h-4 w-4" />} label="Ngày chơi">
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(event) => setDate(event.target.value)}
            className={cn(fieldClassName, "pr-3")}
          />
        </FieldShell>

        <FieldShell icon={<Clock3 className="h-4 w-4" />} label="Khung giờ">
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={fieldClassName}
          >
            <option value="all">Mọi khung giờ</option>
            {TIME_SLOTS.filter((item) => item !== "Mọi khung giờ").map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FieldShell>

        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleSearch}
            className="h-14 w-full rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-[0_18px_42px_-20px_rgba(234,88,12,0.8)] hover:bg-orange-500 xl:min-w-[220px]"
          >
            <Search className="mr-2 h-4 w-4" />
            Khám phá sân RC
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function FieldShell({ icon, label, children }: FieldShellProps) {
  return (
    <label className="flex min-h-14 flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5">
      <span className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
        <span className="text-slate-500">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  )
}

const fieldClassName =
  "w-full appearance-none border-0 bg-transparent p-0 text-sm font-bold text-slate-900 outline-none"
