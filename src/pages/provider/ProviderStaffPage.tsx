import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Mail, 
  Phone, 
  Search, 
  UserPlus, 
  Building2, 
  MoreHorizontal, 
  UserCheck, 
  UserMinus, 
  KeyRound, 
  UserCog, 
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/shared/ui/dropdown-menu"

// Feature integrations
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { staffApi, staffQueryKeys } from "@/features/staff/api/staff.api"
import type { StaffUser } from "@/features/staff/types"

// Local Dialogs
import { ProviderStaffFormDialog } from "./components/ProviderStaffFormDialog"
import { ProviderStaffResetPasswordDialog } from "./components/ProviderStaffResetPasswordDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"

export function ProviderStaffPage() {
  const queryClient = useQueryClient()

  // State filters
  const [selectedCafeId, setSelectedCafeId] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [selectedStaffForForm, setSelectedStaffForForm] = useState<StaffUser | null>(null)
  
  const [resetOpen, setResetOpen] = useState(false)
  const [selectedStaffForReset, setSelectedStaffForReset] = useState<StaffUser | null>(null)

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [selectedStaffForStatus, setSelectedStaffForStatus] = useState<StaffUser | null>(null)

  // 1. Fetch managed Cafes list
  const cafeParams = { page: 1, limit: 100, scope: "managed" as const }
  const { data: cafesData } = useQuery({
    queryKey: cafeQueryKeys.list(cafeParams),
    queryFn: () => cafeApi.listCafes(cafeParams),
  })
  const cafes = cafesData?.data ?? []

  // 2. Fetch live staff list matching filters
  const listParams = {
    page: 1,
    limit: 100, // Fetch all for easy search
    cafe_id: selectedCafeId || undefined,
    is_active: selectedStatus === "active" ? true : selectedStatus === "inactive" ? false : undefined,
  }

  const { 
    data: staffData, 
    isLoading: isStaffLoading, 
    isError: isStaffError, 
    refetch: refetchStaff 
  } = useQuery({
    queryKey: staffQueryKeys.list(listParams),
    queryFn: () => staffApi.listStaff(listParams),
  })
  const staffList = staffData?.data ?? []

  // Client-side search logic
  const filteredStaff = staffList.filter((staff) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      staff.fullName.toLowerCase().includes(query) ||
      staff.email.toLowerCase().includes(query) ||
      (staff.phone && staff.phone.includes(query))
    )
  })

  // 3. Mutation: Create or Update staff
  const staffFormMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!selectedStaffForForm) {
        // Create Mode
        return await staffApi.createStaff(payload)
      } else {
        // Edit Mode
        const staffId = selectedStaffForForm.id
        const updatePromise = staffApi.updateStaff(staffId, {
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
        })
        
        const cafeAssignPromise = 
          payload.cafe_id !== selectedStaffForForm.cafeId
            ? staffApi.assignStaffCafe(staffId, { cafe_id: payload.cafe_id })
            : Promise.resolve()

        return await Promise.all([updatePromise, cafeAssignPromise])
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      if (selectedStaffForForm) {
        toast.success("Đã cập nhật thông tin nhân viên")
      } else {
        toast.success("Đã tạo tài khoản nhân viên")
      }
    },
  })

  // 4. Mutation: Toggle staff active/inactive status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
      await staffApi.updateStaffStatus(staffId, { is_active: isActive })
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      toast.success(
        variables.isActive 
          ? "Đã kích hoạt lại tài khoản nhân viên" 
          : "Đã tạm ngưng tài khoản nhân viên"
      )
    },
    onError: () => {
      toast.error("Không thể thay đổi trạng thái nhân viên.")
    }
  })

  // 5. Callback: Password reset trigger
  const handleResetPasswordConfirm = async () => {
    if (!selectedStaffForReset) throw new Error("No staff selected")
    const res = await staffApi.resetStaffPassword(selectedStaffForReset.id)
    return res.temporaryPassword
  }

  // Dialog launchers
  const openCreateDialog = () => {
    setSelectedStaffForForm(null)
    setFormOpen(true)
  }

  const openEditDialog = (staff: StaffUser) => {
    setSelectedStaffForForm(staff)
    setFormOpen(true)
  }

  const openResetDialog = (staff: StaffUser) => {
    setSelectedStaffForReset(staff)
    setResetOpen(true)
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Quản lý nhân sự"
        description="Quản lý tài khoản nhân viên STAFF, phân công cơ sở trực thuộc và cấp lại mật khẩu."
      />

      {/* Filter and search panel */}
      <section className="mb-4 flex flex-col gap-2 rounded-xl border border-[#c4c7c8] bg-[#fcf8f8] p-2.5 shadow-sm md:flex-row md:items-center">
        <div className="relative flex flex-grow items-center">
          <Search className="absolute left-3.5 size-5 text-[#444748]" />
          <input
            className="w-full border-none bg-transparent py-2 pl-11 pr-4 text-sm font-semibold leading-relaxed text-[#1c1b1b] placeholder:text-[#747878] focus:ring-0 focus:outline-none"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="mx-2 h-px bg-[#c4c7c8] md:h-8 md:w-px" />
        
        <div className="flex flex-wrap gap-2">
          {/* Cafe Filter */}
          <select 
            value={selectedCafeId}
            onChange={(e) => setSelectedCafeId(e.target.value)}
            className="cursor-pointer rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#1c1b1b] focus:ring-1 focus:ring-[#747878] focus:outline-none"
          >
            <option value="">Tất cả Cơ sở</option>
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="cursor-pointer rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#1c1b1b] focus:ring-1 focus:ring-[#747878] focus:outline-none"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngưng</option>
          </select>

          <Button 
            onClick={openCreateDialog} 
            className="h-9 gap-2 rounded-lg bg-[#1c1b1b] text-xs font-bold uppercase tracking-wider text-[#fcf8f8] hover:bg-[#313030]"
          >
            <UserPlus className="size-[18px]" />
            Thêm nhân viên
          </Button>
        </div>
      </section>

      {/* Staff Grid Container */}
      {isStaffLoading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-44 animate-pulse rounded-xl border border-[#c4c7c8] bg-[#fcf8f8]" />
          ))}
        </section>
      ) : isStaffError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c4c7c8] bg-white p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Không thể tải dữ liệu nhân viên</h3>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm">
            Hệ thống gặp sự cố khi tải danh sách. Vui lòng nhấn nút tải lại hoặc thử lại sau.
          </p>
          <Button onClick={() => void refetchStaff()} className="mt-4 bg-slate-950 text-white font-bold h-9">
            Tải lại
          </Button>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c4c7c8] bg-white py-16 px-4 text-center">
          <Building2 className="h-10 w-10 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy nhân viên nào</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md">
            Không tìm thấy kết quả phù hợp với các tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
          </p>
          {(searchQuery || selectedCafeId || selectedStatus) && (
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedCafeId("")
                setSelectedStatus("")
              }} 
              className="mt-4 border-slate-200 text-slate-700 h-9 font-bold hover:bg-slate-50"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => (
            <StaffCard 
              key={staff.id} 
              staff={staff} 
              onEdit={openEditDialog}
              onResetPassword={openResetDialog}
              onToggleStatus={(staff) => {
                setSelectedStaffForStatus(staff)
                setStatusConfirmOpen(true)
              }}
              isToggling={toggleStatusMutation.isPending}
            />
          ))}
        </section>
      )}

      {/* Dialog Components */}
      <ProviderStaffFormDialog
        open={formOpen}
        staff={selectedStaffForForm}
        cafes={cafes}
        isPending={staffFormMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={async (values) => {
          await staffFormMutation.mutateAsync(values)
        }}
      />

      <ProviderStaffResetPasswordDialog
        open={resetOpen}
        staff={selectedStaffForReset}
        onOpenChange={setResetOpen}
        onConfirm={handleResetPasswordConfirm}
      />

      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedStaffForStatus?.isActive ? "Tạm ngưng hoạt động nhân viên?" : "Kích hoạt hoạt động nhân viên?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStaffForStatus?.isActive
                ? `Bạn có chắc chắn muốn tạm ngưng hoạt động của nhân viên ${selectedStaffForStatus.fullName} (${selectedStaffForStatus.email})? Họ sẽ không thể đăng nhập vào hệ thống cho đến khi được kích hoạt lại.`
                : `Bạn có chắc chắn muốn kích hoạt lại hoạt động cho nhân viên ${selectedStaffForStatus?.fullName} (${selectedStaffForStatus?.email})?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleStatusMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant={selectedStaffForStatus?.isActive ? "destructive" : "default"}
              disabled={toggleStatusMutation.isPending}
              onClick={async (e) => {
                e.preventDefault()
                if (selectedStaffForStatus) {
                  try {
                    await toggleStatusMutation.mutateAsync({
                      staffId: selectedStaffForStatus.id,
                      isActive: !selectedStaffForStatus.isActive
                    })
                    setStatusConfirmOpen(false)
                  } catch {
                    // error handled in mutation
                  }
                }
              }}
            >
              {toggleStatusMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProviderShell>
  )
}

function StaffCard({ 
  staff, 
  onEdit, 
  onResetPassword, 
  onToggleStatus,
  isToggling 
}: { 
  staff: StaffUser
  onEdit: (staff: StaffUser) => void
  onResetPassword: (staff: StaffUser) => void
  onToggleStatus: (staff: StaffUser) => void
  isToggling: boolean
}) {
  const initials = staff.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(-2)
    .toUpperCase()

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white p-5 transition-all hover:border-slate-400 hover:shadow-sm",
        staff.isActive ? "border-slate-200" : "border-slate-200 opacity-70 border-dashed bg-slate-50/50"
      )}
    >
      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-base font-extrabold text-slate-700">
            {initials}
          </div>
          <div>
            <h3 className="text-base font-bold leading-snug text-slate-900">{staff.fullName}</h3>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
              {staff.role}
            </p>
          </div>
        </div>
        <span 
          className={cn(
            "inline-flex rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border",
            staff.isActive 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
              : "bg-slate-100 border-slate-200 text-slate-500"
          )}
        >
          {staff.isActive ? "Hoạt động" : "Tạm ngưng"}
        </span>
      </div>

      <div className="relative z-10 mt-4 space-y-2 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-slate-400" />
          <span className="truncate normal-case text-slate-800">{staff.email}</span>
        </div>
        
        {staff.phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-slate-400" />
            <span className="tabular-nums text-slate-800">{staff.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-slate-400" />
          <span className="normal-case truncate text-slate-800">{staff.cafeName || "Chưa gán cơ sở"}</span>
        </div>
      </div>

      {/* Card Footer Options */}
      <div className="relative z-10 mt-5 flex items-center justify-end border-t border-slate-100 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none">
              <MoreHorizontal className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg bg-white border border-slate-100">
            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1">Tác vụ</DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={() => onEdit(staff)}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <UserCog className="mr-2 h-4 w-4 text-slate-500" />
              Sửa thông tin
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => onResetPassword(staff)}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
              Đặt lại mật khẩu
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 border-slate-100" />

            <DropdownMenuItem 
              disabled={isToggling}
              onClick={() => onToggleStatus(staff)}
              className={cn(
                "cursor-pointer rounded-lg px-2.5 py-2 text-xs font-bold hover:bg-slate-50",
                staff.isActive ? "text-red-600" : "text-emerald-700"
              )}
            >
              {staff.isActive ? (
                <>
                  <UserMinus className="mr-2 h-4 w-4 text-red-500" />
                  Tạm ngưng hoạt động
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                  Kích hoạt hoạt động
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
