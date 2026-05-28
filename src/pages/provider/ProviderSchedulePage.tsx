import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, GripVertical, Plus, Search, Users, X } from "lucide-react"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

const weekDays = [
  { label: "T2", date: "23" },
  { label: "T3", date: "24", active: true },
  { label: "T4", date: "25" },
  { label: "T5", date: "26" },
  { label: "T6", date: "27" },
  { label: "T7", date: "28" },
  { label: "CN", date: "29" },
]

const staff = [
  { name: "Phạm Thị D", role: "Lễ tân", hours: "24h/tuần", initials: "D" },
  { name: "Hoàng Văn E", role: "Giám sát", hours: "32h/tuần", initials: "E" },
  { name: "Đinh Quý F", role: "Kỹ thuật", hours: "Nghỉ phép", initials: "F", disabled: true },
]

const scheduleRows = [
  {
    position: "Lễ tân",
    days: [
      [
        { shift: "Sáng (08-14)", person: "Nguyễn Văn A", initials: "A" },
        { shift: "Chiều (14-20)", person: "Trần Thị B", initials: "B" },
      ],
      [{ shift: "Sáng (08-14)", person: "Nguyễn Văn A", initials: "A", removable: true }, { missing: "Thiếu NV (Chiều)" }],
      [],
      [],
      [],
      [],
      [],
    ],
  },
  {
    position: "Giám sát",
    days: [
      [{ shift: "Cả ngày (09-18)", person: "Lê Văn C", initials: "C" }],
      [{ shift: "Cả ngày (09-18)", person: "Lê Văn C", initials: "C" }],
      [],
      [],
      [],
      [],
      [],
    ],
  },
  {
    position: "Kỹ thuật",
    days: [[], [], [{ missing: "Thiếu NV (Tối)" }], [], [{ shift: "Tối (18-24)", person: "Hoàng Văn E", initials: "E" }], [], []],
  },
]

export function ProviderSchedulePage() {
  return (
    <ProviderShell contentClassName="max-w-none">
      <ProviderPageHeader
        title="Quản lý ca làm việc"
        description="Phân công nhân sự theo tuần, theo vị trí vận hành và theo tình trạng thiếu người."
        actions={
          <>
            <div className="flex rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] p-1">
              <button className="rounded bg-white px-4 py-1.5 text-sm font-medium text-[#1c1b1b] shadow-sm">Tuần</button>
              <button className="rounded px-4 py-1.5 text-sm font-medium text-[#444748] transition-colors hover:bg-[#e5e2e1]">Ngày</button>
            </div>
            <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
              <Plus className="size-4" />
              Phân công
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm font-medium text-[#444748]">
        <LegendDot className="border-[#c4c7c8] bg-[#e5e2e1]" label="Đủ nhân sự" />
        <LegendDot className="border-[#ba1a1a] bg-[#ffdad6]" label="Thiếu nhân sự" />
      </div>

      <div className="grid min-h-[720px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-[#c4c7c8] bg-[#f6f3f2] p-4">
            <div className="flex items-center gap-3">
              <IconButton ariaLabel="Tuần trước">
                <ChevronLeft className="size-5" />
              </IconButton>
              <h3 className="text-lg font-semibold text-[#1c1b1b]">Tháng 10, 23 - 29, 2023</h3>
              <IconButton ariaLabel="Tuần sau">
                <ChevronRight className="size-5" />
              </IconButton>
            </div>
            <Button variant="outline" className="h-9 rounded-lg border-[#c4c7c8] bg-white text-sm text-[#1c1b1b] hover:bg-[#ebe7e7]">
              Hôm nay
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-[900px]">
              <div className="sticky top-0 z-10 grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] border-b border-[#c4c7c8] bg-[#fcf8f8]">
                <div className="flex items-end justify-end border-r border-[#c4c7c8] bg-[#f6f3f2] p-3 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#747878]">Vị trí</div>
                {weekDays.map((day) => (
                  <div key={day.label} className={cn("border-r border-[#c4c7c8] p-3 text-center last:border-r-0", day.active && "bg-[#ebe7e7]")}>
                    <div className={cn("font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#747878]", day.active && "text-[#5d5f5f]")}>{day.label}</div>
                    <div className={cn("mt-1 font-semibold text-[#1c1b1b]", day.active && "text-[#5d5f5f]")}>{day.date}</div>
                  </div>
                ))}
              </div>

              {scheduleRows.map((row) => (
                <div key={row.position} className="grid min-h-[132px] grid-cols-[100px_repeat(7,minmax(120px,1fr))] border-b border-[#c4c7c8] last:border-b-0">
                  <div className="flex items-center justify-center border-r border-[#c4c7c8] bg-[#f6f3f2] p-3">
                    <span className="-rotate-90 whitespace-nowrap text-center font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#747878]">{row.position}</span>
                  </div>
                  {row.days.map((items, dayIndex) => (
                    <div key={`${row.position}-${dayIndex}`} className={cn("flex flex-col gap-2 border-r border-[#c4c7c8] p-2 last:border-r-0", dayIndex === 1 && "bg-[#ebe7e7]")}>
                      {items.map((item, index) =>
                        "missing" in item ? (
                          <button key={`${item.missing}-${index}`} className="flex min-h-12 items-center justify-center rounded border border-dashed border-[#ba1a1a]/60 bg-[#ffdad6] p-2 text-xs font-semibold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/80">
                            + {item.missing}
                          </button>
                        ) : (
                          <ShiftCard key={`${item.shift}-${item.person}`} shift={item.shift} person={item.person} initials={item.initials} removable={"removable" in item ? item.removable : false} />
                        )
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
          <div className="shrink-0 border-b border-[#c4c7c8] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#1c1b1b]">
              <Users className="size-5 text-[#5d5f5f]" />
              Nhân sự khả dụng
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#747878]" />
              <input className="w-full rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] py-2 pl-10 pr-3 text-sm font-medium outline-none transition-shadow focus:border-[#5d5f5f] focus:ring-1 focus:ring-[#5d5f5f]" placeholder="Tìm kiếm..." />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {staff.map((item) => (
              <div key={item.name} className={cn("group flex cursor-grab items-center gap-3 rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-3 transition-all hover:border-[#5d5f5f] hover:shadow-sm", item.disabled && "cursor-not-allowed opacity-60")}>
                <Avatar initials={item.initials} />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-[#1c1b1b]">{item.name}</h4>
                  <p className="truncate text-xs font-medium text-[#444748]">
                    {item.role} - {item.hours}
                  </p>
                </div>
                {!item.disabled ? <GripVertical className="size-5 text-[#747878] opacity-0 transition-opacity group-hover:opacity-100" /> : null}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </ProviderShell>
  )
}

function ShiftCard({ shift, person, initials, removable }: { shift: string; person: string; initials: string; removable?: boolean }) {
  return (
    <div className="group relative rounded border border-[#c4c7c8] bg-[#e5e2e1] p-2 text-xs transition-colors hover:border-[#5d5f5f]">
      <div className="font-semibold text-[#1c1b1b]">{shift}</div>
      <div className="mt-1 flex items-center gap-1 text-[#444748]">
        <Avatar initials={initials} size="sm" />
        <span className="truncate">{person}</span>
      </div>
      {removable ? (
        <button className="absolute right-1 top-1 hidden rounded text-[#747878] transition-colors hover:text-[#ba1a1a] group-hover:block" aria-label="Xóa ca">
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full border border-[#c4c7c8] bg-white font-semibold text-[#5d5f5f]", size === "sm" ? "size-4 text-[10px]" : "size-10 text-sm")}>
      {initials}
    </span>
  )
}

function IconButton({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
  return (
    <button className="rounded p-1 text-[#444748] transition-colors hover:bg-[#e5e2e1] hover:text-[#1c1b1b]" aria-label={ariaLabel}>
      {children}
    </button>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full border", className)} />
      {label}
    </span>
  )
}
