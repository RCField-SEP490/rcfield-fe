import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DndProvider, useDrag, useDragLayer, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { ChevronLeft, ChevronRight, GripVertical, Plus, Search, Users, X } from "lucide-react"
import { toast } from "sonner"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { staffApi, staffQueryKeys, type StaffListItem } from "@/features/staff/api/staff.api"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import {
  scheduleApi,
  scheduleQueryKeys,
  type StaffShift,
  type ShiftPosition,
} from "@/features/schedule/api/schedule.api"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

const employeeDragType = "SCHEDULE_EMPLOYEE"

type DragEmployee = {
  type: typeof employeeDragType
  staffId: string
  name: string
}

const shiftPresets = [
  { label: "Sáng (08-14)", start: "08:00", end: "14:00" },
  { label: "Chiều (14-20)", start: "14:00", end: "20:00" },
  { label: "Tối (18-24)", start: "18:00", end: "23:59" },
  { label: "Cả ngày (09-18)", start: "09:00", end: "18:00" },
]

function getWeekStart(date = new Date()) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd")
}

function buildWeekDays(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index)
    return {
      label: index === 6 ? "CN" : `T${index + 2}`,
      date: format(date, "yyyy-MM-dd"),
      dayNumber: format(date, "dd"),
      active: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
    }
  })
}

function initialsFromName(name: string) {
  const words = name.trim().split(/\s+/)
  return (words.at(-1)?.[0] ?? name[0] ?? "?").toUpperCase()
}

export function ProviderSchedulePage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ProviderScheduleBoard />
    </DndProvider>
  )
}

function ProviderScheduleBoard() {
  const queryClient = useQueryClient()
  const [weekStart, setWeekStart] = useState(() => getWeekStart())
  const [selectedCafeId, setSelectedCafeId] = useState("")
  const [search, setSearch] = useState("")
  const [newPositionName, setNewPositionName] = useState("")
  const [addingPosition, setAddingPosition] = useState(false)
  const [timeTarget, setTimeTarget] = useState<StaffShift | null>(null)
  const [timeForm, setTimeForm] = useState({ label: shiftPresets[0].label, start: shiftPresets[0].start, end: shiftPresets[0].end })

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart])
  const isDraggingEmployee = useIsDraggingEmployee()

  const { data: weekData, isLoading: scheduleLoading } = useQuery({
    queryKey: scheduleQueryKeys.week(weekStart),
    queryFn: () => scheduleApi.getWeek(weekStart),
  })

  const { data: cafesResp, isLoading: cafesLoading } = useQuery({
    queryKey: cafeQueryKeys.list({ page: 1, limit: 100, scope: "managed" }),
    queryFn: () => cafeApi.listCafes({ page: 1, limit: 100, scope: "managed" }),
  })
  const cafes = cafesResp?.data ?? []

  useEffect(() => {
    if (!selectedCafeId && cafes.length > 0) {
      setSelectedCafeId(cafes[0].id)
    }
  }, [cafes, selectedCafeId])

  const { data: staffList = [] } = useQuery({
    queryKey: staffQueryKeys.list(selectedCafeId || undefined),
    queryFn: () => staffApi.listStaff(selectedCafeId || undefined),
    enabled: Boolean(selectedCafeId),
  })

  const createPositionMutation = useMutation({
    mutationFn: (name: string) => scheduleApi.createPosition(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
      setNewPositionName("")
      setAddingPosition(false)
      toast.success("Đã thêm vị trí mới.")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Không thể thêm vị trí.")
    },
  })

  const assignShiftMutation = useMutation({
    mutationFn: scheduleApi.assignShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.week(weekStart) })
      toast.success("Đã phân công nhân viên.")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Không thể phân công nhân viên.")
    },
  })

  const updateTimeMutation = useMutation({
    mutationFn: scheduleApi.updateShiftTime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.week(weekStart) })
      setTimeTarget(null)
      toast.success("Đã cập nhật khung giờ.")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Không thể cập nhật khung giờ.")
    },
  })

  const positions = weekData?.positions ?? []
  const shifts = weekData?.shifts ?? []
  const shiftsByCell = useMemo(() => {
    const map = new Map<string, StaffShift[]>()
    for (const shift of shifts) {
      const key = `${shift.positionId}:${shift.shiftDate}`
      map.set(key, [...(map.get(key) ?? []), shift])
    }
    return map
  }, [shifts])

  const availableStaff = staffList.filter(
    (item) =>
      item.status !== "DISABLED" &&
      (item.fullName.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase()) ||
        item.cafeName.toLowerCase().includes(search.toLowerCase())),
  )

  const weekEnd = weekDays[6]?.date ?? weekStart
  const title = `${format(new Date(`${weekStart}T00:00:00`), "dd/MM")} - ${format(new Date(`${weekEnd}T00:00:00`), "dd/MM/yyyy")}`

  const submitNewPosition = () => {
    const name = newPositionName.trim()
    if (!name) {
      toast.error("Vui lòng nhập tên vị trí.")
      return
    }
    createPositionMutation.mutate(name)
  }

  return (
    <ProviderShell contentClassName="max-w-none">
      <ProviderPageHeader
        title="Quản lý ca làm việc"
        description="Phân công nhân sự theo tuần, theo vị trí vận hành và theo tình trạng thiếu người."
      />

      <section className="mb-4 rounded-xl border border-[#c4c7c8] bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <label className="text-lg font-bold leading-tight tracking-tight text-[#1c1b1b]" htmlFor="schedule-cafe-select">
            Chi nhánh áp dụng
          </label>
          <select
            id="schedule-cafe-select"
            value={selectedCafeId}
            onChange={(event) => {
              setSelectedCafeId(event.target.value)
              setSearch("")
            }}
            disabled={cafesLoading || cafes.length === 0}
            className="h-11 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm font-bold text-[#1c1b1b] outline-none transition-colors focus:border-[#ef6c00] disabled:bg-[#f6f3f2] disabled:text-[#747878]"
          >
            {cafes.length === 0 ? <option>Chưa có chi nhánh</option> : null}
            {cafes.map((cafe) => (
              <option key={cafe.id} value={cafe.id}>
                {cafe.name} - {cafe.district}, {cafe.city}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-[#747878]">
        <LegendDot className="border-[#c4c7c8] bg-[#e5e2e1]" label="Đủ nhân sự" />
        <LegendDot className="border-[#ba1a1a] bg-[#ffdad6]" label="Thiếu nhân sự" />
        <LegendDot className="border-[#ef6c00] bg-[#fff4e5]" label="Có thể thả khi đang kéo" />
      </div>

      <div className="grid min-h-[720px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#c4c7c8] bg-[#f6f3f2] p-4">
            <div className="flex items-center gap-3">
              <IconButton ariaLabel="Tuần trước" onClick={() => setWeekStart(format(addDays(new Date(`${weekStart}T00:00:00`), -7), "yyyy-MM-dd"))}>
                <ChevronLeft className="size-5" />
              </IconButton>
              <h3 className="text-lg font-bold text-[#1c1b1b]">{title}</h3>
              <IconButton ariaLabel="Tuần sau" onClick={() => setWeekStart(format(addDays(new Date(`${weekStart}T00:00:00`), 7), "yyyy-MM-dd"))}>
                <ChevronRight className="size-5" />
              </IconButton>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] p-1">
                <button className="rounded bg-white px-4 py-1.5 text-sm font-bold text-[#1c1b1b] shadow-sm">Tuần</button>
                <button className="rounded px-4 py-1.5 text-sm font-bold text-[#444748] transition-colors hover:bg-[#e5e2e1]">Ngày</button>
              </div>
              <Button variant="outline" className="h-9 rounded-lg border-[#c4c7c8] bg-white text-sm font-bold text-[#1c1b1b] hover:bg-[#ebe7e7]" onClick={() => setWeekStart(getWeekStart())}>
                Hôm nay
              </Button>
              <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030] font-bold" onClick={() => setAddingPosition(true)}>
                <Plus className="size-4" />
                Vị trí
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-[900px]">
              <div className="sticky top-0 z-10 grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] border-b border-[#c4c7c8] bg-[#fcf8f8]">
                <div className="flex items-end justify-end border-r border-[#c4c7c8] bg-[#f6f3f2] p-3 font-mono text-xs font-bold uppercase tracking-[0.05em] text-[#747878]">Vị trí</div>
                {weekDays.map((day) => (
                  <div key={day.date} className={cn("border-r border-[#c4c7c8] p-3 text-center last:border-r-0", day.active && "bg-[#ebe7e7]")}>
                    <div className="font-mono text-xs font-bold uppercase tracking-[0.05em] text-[#747878]">{day.label}</div>
                    <div className="mt-1 font-bold text-[#1c1b1b]">{day.dayNumber}</div>
                  </div>
                ))}
              </div>

              {scheduleLoading ? (
                <div className="p-8 text-center text-sm font-semibold text-[#747878]">Đang tải lịch làm việc...</div>
              ) : (
                <>
                  {positions.map((position) => (
                    <ScheduleRow
                      key={position.id}
                      position={position}
                      weekDays={weekDays}
                      shiftsByCell={shiftsByCell}
                      isDraggingEmployee={isDraggingEmployee}
                      onDropEmployee={(staffId, shiftDate) =>
                        assignShiftMutation.mutate({
                          position_id: position.id,
                          staff_id: staffId,
                          shift_date: shiftDate,
                        })
                      }
                      onOpenTime={(shift) => {
                        setTimeTarget(shift)
                        setTimeForm({
                          label: shift.shiftLabel ?? shiftPresets[0].label,
                          start: shift.startTime ?? shiftPresets[0].start,
                          end: shift.endTime ?? shiftPresets[0].end,
                        })
                      }}
                    />
                  ))}

                  <div className="grid min-h-[76px] grid-cols-[100px_repeat(7,minmax(120px,1fr))]">
                    <div className="flex items-center justify-center border-r border-[#c4c7c8] bg-[#f6f3f2] p-2">
                      {addingPosition ? (
                        <div className="flex w-full flex-col gap-2">
                          <input
                            autoFocus
                            className="w-full rounded border border-[#c4c7c8] px-2 py-1 text-xs font-semibold outline-none focus:border-[#ef6c00]"
                            placeholder="Vị trí mới"
                            value={newPositionName}
                            onChange={(event) => setNewPositionName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") submitNewPosition()
                              if (event.key === "Escape") setAddingPosition(false)
                            }}
                          />
                          <Button size="sm" className="h-7 bg-[#1c1b1b] text-xs text-white" onClick={submitNewPosition} disabled={createPositionMutation.isPending}>
                            Thêm
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="flex size-9 items-center justify-center rounded-full border border-dashed border-[#ef6c00] bg-[#fff4e5] text-[#ef6c00] transition-colors hover:bg-[#ffe8cc]"
                          aria-label="Thêm vị trí mới"
                          onClick={() => setAddingPosition(true)}
                        >
                          <Plus className="size-5" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-7 border-t border-dashed border-[#c4c7c8] bg-[#fcf8f8]" />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
          <div className="shrink-0 border-b border-[#c4c7c8] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1c1b1b]">
              <Users className="size-5 text-[#5d5f5f]" />
              Nhân sự khả dụng
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#747878]" />
              <input
                className="w-full rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] py-2 pl-10 pr-3 text-sm font-semibold outline-none transition-shadow focus:border-[#5d5f5f] focus:ring-1 focus:ring-[#5d5f5f]"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {availableStaff.map((item) => (
              <DraggableEmployeeCard key={item.id} employee={item} />
            ))}
            {availableStaff.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#c4c7c8] p-4 text-center text-sm font-semibold text-[#747878]">
                Không có nhân sự phù hợp.
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {timeTarget ? (
        <TimeModal
          shift={timeTarget}
          form={timeForm}
          setForm={setTimeForm}
          isSaving={updateTimeMutation.isPending}
          onClose={() => setTimeTarget(null)}
          onSubmit={() =>
            updateTimeMutation.mutate({
              shift_id: timeTarget.id,
              shift_label: timeForm.label,
              start_time: timeForm.start,
              end_time: timeForm.end,
            })
          }
        />
      ) : null}
    </ProviderShell>
  )
}

function ScheduleRow({
  position,
  weekDays,
  shiftsByCell,
  isDraggingEmployee,
  onDropEmployee,
  onOpenTime,
}: {
  position: ShiftPosition
  weekDays: ReturnType<typeof buildWeekDays>
  shiftsByCell: Map<string, StaffShift[]>
  isDraggingEmployee: boolean
  onDropEmployee: (staffId: string, shiftDate: string) => void
  onOpenTime: (shift: StaffShift) => void
}) {
  return (
    <div className="grid min-h-[132px] grid-cols-[100px_repeat(7,minmax(120px,1fr))] border-b border-[#c4c7c8] last:border-b-0">
      <div className="flex items-center justify-center border-r border-[#c4c7c8] bg-[#f6f3f2] p-3">
        <span className="-rotate-90 whitespace-nowrap text-center font-mono text-xs font-bold uppercase tracking-[0.05em] text-[#747878]">{position.name}</span>
      </div>
      {weekDays.map((day) => {
        const cellShifts = shiftsByCell.get(`${position.id}:${day.date}`) ?? []
        return (
          <DropZoneCell
            key={`${position.id}-${day.date}`}
            date={day.date}
            active={day.active}
            shifts={cellShifts}
            isDraggingEmployee={isDraggingEmployee}
            onDropEmployee={(staffId) => onDropEmployee(staffId, day.date)}
            onOpenTime={onOpenTime}
          />
        )
      })}
    </div>
  )
}

function DraggableEmployeeCard({ employee }: { employee: StaffListItem }) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: employeeDragType,
    item: { type: employeeDragType, staffId: employee.id, name: employee.fullName } satisfies DragEmployee,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [employee.id, employee.fullName])
  drag(cardRef)

  return (
    <div
      ref={cardRef}
      className={cn(
        "group flex cursor-grab items-center gap-3 rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-3 transition-all hover:border-[#5d5f5f] hover:shadow-sm active:cursor-grabbing",
        isDragging && "scale-[0.98] opacity-50 shadow-md",
      )}
    >
      <Avatar initials={initialsFromName(employee.fullName)} />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-[#1c1b1b]">{employee.fullName}</h4>
        <p className="truncate text-xs font-semibold text-[#444748]">
          {employee.cafeName} - {employee.status === "PENDING" ? "Chờ kích hoạt" : "Đang hoạt động"}
        </p>
      </div>
      <GripVertical className="size-5 text-[#747878] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

function DropZoneCell({
  date,
  active,
  shifts,
  isDraggingEmployee,
  onDropEmployee,
  onOpenTime,
}: {
  date: string
  active: boolean
  shifts: StaffShift[]
  isDraggingEmployee: boolean
  onDropEmployee: (staffId: string) => void
  onOpenTime: (shift: StaffShift) => void
}) {
  const isEmpty = shifts.length === 0
  const cellRef = useRef<HTMLDivElement | null>(null)
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: employeeDragType,
    canDrop: () => isEmpty,
    drop: (item: DragEmployee) => {
      onDropEmployee(item.staffId)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [isEmpty, onDropEmployee])
  drop(cellRef)

  return (
    <div
      ref={cellRef}
      className={cn(
        "relative flex min-h-[132px] flex-col gap-2 border-r border-[#c4c7c8] p-2 last:border-r-0",
        active && "bg-[#ebe7e7]",
        isDraggingEmployee && isEmpty && "bg-[#fffaf2]",
        isDraggingEmployee && isEmpty && "after:pointer-events-none after:absolute after:inset-2 after:rounded-lg after:border after:border-dashed after:border-[#ef6c00]/50 after:content-['']",
        isOver && canDrop && "bg-[#fff4e5] ring-2 ring-inset ring-[#ef6c00]",
      )}
      data-date={date}
    >
      {shifts.map((shift) => (
        <ShiftCard key={shift.id} shift={shift} onOpenTime={() => onOpenTime(shift)} />
      ))}
      {isDraggingEmployee && isEmpty ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className={cn("flex size-9 items-center justify-center rounded-full border border-dashed text-lg font-bold", isOver && canDrop ? "border-[#ef6c00] bg-white text-[#ef6c00]" : "border-[#ef6c00]/40 text-[#ef6c00]/50")}>
            +
          </span>
        </div>
      ) : null}
    </div>
  )
}

function ShiftCard({ shift, onOpenTime }: { shift: StaffShift; onOpenTime: () => void }) {
  const label = shift.shiftLabel ?? "Chưa set giờ"
  return (
    <div className="group relative rounded border border-[#c4c7c8] bg-[#e5e2e1] p-2 text-xs transition-colors hover:border-[#5d5f5f]">
      <div className="font-semibold text-[#1c1b1b]">{label}</div>
      <div className="mt-1 flex items-center gap-1 text-[#444748]">
        <Avatar initials={initialsFromName(shift.staffName)} size="sm" />
        <span className="truncate">{shift.staffName}</span>
        <button
          className="ml-auto flex size-5 items-center justify-center rounded-full bg-white text-[#ef6c00] shadow-sm transition-colors hover:bg-[#fff4e5]"
          aria-label="Cập nhật giờ ca"
          onClick={onOpenTime}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function TimeModal({
  shift,
  form,
  setForm,
  isSaving,
  onClose,
  onSubmit,
}: {
  shift: StaffShift
  form: { label: string; start: string; end: string }
  setForm: (form: { label: string; start: string; end: string }) => void
  isSaving: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-[#c4c7c8] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1c1b1b]">Chọn thời gian ca</h2>
            <p className="mt-1 text-sm font-semibold text-[#747878]">{shift.staffName}</p>
          </div>
          <button className="rounded p-1 text-[#747878] hover:bg-[#f6f3f2]" onClick={onClose} aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {shiftPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={cn(
                "rounded-lg border border-[#c4c7c8] p-2 text-left text-xs font-bold transition-colors hover:bg-[#fff4e5]",
                form.label === preset.label && "border-[#ef6c00] bg-[#fff4e5] text-[#ef6c00]",
              )}
              onClick={() => setForm({ label: preset.label, start: preset.start, end: preset.end })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#444748]">
            Tên ca
            <input
              className="mt-1 w-full rounded-lg border border-[#c4c7c8] px-3 py-2 text-sm normal-case outline-none focus:border-[#ef6c00]"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#444748]">
              Bắt đầu
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-[#c4c7c8] px-3 py-2 text-sm outline-none focus:border-[#ef6c00]"
                value={form.start}
                onChange={(event) => setForm({ ...form, start: event.target.value })}
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#444748]">
              Kết thúc
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-[#c4c7c8] px-3 py-2 text-sm outline-none focus:border-[#ef6c00]"
                value={form.end}
                onChange={(event) => setForm({ ...form, end: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" className="flex-1 bg-[#1c1b1b] text-white hover:bg-[#313030]" disabled={isSaving} onClick={onSubmit}>
            Lưu giờ
          </Button>
        </div>
      </div>
    </div>
  )
}

function useIsDraggingEmployee() {
  return useDragLayer((monitor) => monitor.isDragging() && monitor.getItemType() === employeeDragType)
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full border border-[#c4c7c8] bg-white font-semibold text-[#5d5f5f]", size === "sm" ? "size-4 text-[10px]" : "size-10 text-sm")}>
      {initials}
    </span>
  )
}

function IconButton({ ariaLabel, children, onClick }: { ariaLabel: string; children: ReactNode; onClick: () => void }) {
  return (
    <button className="rounded p-1 text-[#444748] transition-colors hover:bg-[#e5e2e1] hover:text-[#1c1b1b]" aria-label={ariaLabel} onClick={onClick}>
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
