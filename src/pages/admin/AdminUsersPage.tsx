import { useState } from "react"
import { Award, UserMinus, UserCheck, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  AdminTable,
  UserStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { mockAdminUsers as initialUsers, mockTrustScoreLogs } from "@/shared/data/admin-mock-data"
import type { AdminUser, TrustScoreLog } from "@/shared/data/admin-mock-data"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Trust Score Adjust Dialog state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [adjustPoints, setAdjustPoints] = useState<number>(5)
  const [adjustType, setAdjustType] = useState<"ADD" | "DEDUCT">("ADD")
  const [adjustReason, setAdjustReason] = useState("")

  // History Dialog state
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null)

  const handleBanToggle = (user: AdminUser) => {
    const nextStatus = user.status === "ACTIVE" ? "BANNED" : "ACTIVE"
    
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    )

    if (nextStatus === "BANNED") {
      toast.error(`Đã khóa tài khoản của ${user.fullName}.`)
    } else {
      toast.success(`Đã kích hoạt lại tài khoản của ${user.fullName}.`)
    }
  }

  const handleAdjustTrustScore = () => {
    if (!selectedUser) return

    const delta = adjustType === "ADD" ? adjustPoints : -adjustPoints
    const nextScore = Math.max(0, Math.min(100, selectedUser.trustScore + delta))

    // Update user score
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, trustScore: nextScore } : u))
    )

    // Add entry to Mock logs
    const newLog: TrustScoreLog = {
      id: `TSL-${Date.now().toString().slice(-4)}`,
      userId: selectedUser.id,
      userName: selectedUser.fullName,
      previousScore: selectedUser.trustScore,
      newScore: nextScore,
      delta: delta,
      reason: adjustReason || (adjustType === "ADD" ? "Cộng điểm thưởng từ Admin" : "Trừ điểm uy tín từ Admin"),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
    }

    mockTrustScoreLogs.unshift(newLog)

    toast.success(`Đã cập nhật điểm uy tín của ${selectedUser.fullName}!`, {
      description: `Điểm mới: ${nextScore} (Thay đổi: ${delta > 0 ? "+" : ""}${delta})`,
    })

    setSelectedUser(null)
    setAdjustReason("")
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Table Setup
  const columns = ["Mã User", "Họ và tên", "Email", "Vai trò", "Điểm uy tín", "Trạng thái", "Ngày tham gia", "Hành động"]

  const rows = filteredUsers.map((user) => {
    const userLogs = mockTrustScoreLogs.filter((log) => log.userId === user.id)

    return [
      <span key={user.id} className="font-mono text-xs text-[#747878]">{user.id}</span>,
      <span key={`${user.id}-name`} className="font-bold text-[#1c1b1b]">{user.fullName}</span>,
      <span key={`${user.id}-email`} className="text-xs font-semibold text-[#444748]">{user.email}</span>,
      <Badge
        key={`${user.id}-role`}
        variant="outline"
        className={`border-none font-bold rounded-md px-2 py-0.5 text-xs ${
          user.role === "customer"
            ? "bg-blue-50 text-blue-700"
            : user.role === "provider"
              ? "bg-purple-50 text-purple-700"
              : user.role === "staff"
                ? "bg-amber-50 text-amber-700"
                : "bg-zinc-100 text-zinc-700"
        }`}
      >
        {user.role === "customer" && "Khách hàng"}
        {user.role === "provider" && "Chủ sân"}
        {user.role === "staff" && "Nhân viên"}
        {user.role === "admin" && "Admin"}
      </Badge>,
      <div key={`${user.id}-score`} className="flex items-center gap-1.5">
        <span
          className={`font-mono font-extrabold text-sm ${
            user.trustScore >= 90
              ? "text-emerald-600"
              : user.trustScore >= 70
                ? "text-amber-500"
                : "text-red-500"
          }`}
        >
          {user.trustScore}
        </span>
        <button
          onClick={() => {
            setSelectedUser(user)
            setAdjustPoints(5)
            setAdjustType("ADD")
          }}
          className="text-[#747878] hover:text-orange-600 p-0.5 rounded transition-colors"
          title="Điều chỉnh điểm"
        >
          <Award className="size-4" />
        </button>
      </div>,
      <UserStatusBadge key={`${user.id}-status`} status={user.status} />,
      <span key={`${user.id}-date`} className="font-mono text-xs text-[#747878]">{user.createdDate}</span>,
      <div key={`${user.id}-actions`} className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setHistoryUser(user)}
          className="h-8 border-[#c4c7c8] hover:bg-[#f6f3f2] text-[#444748] font-bold text-xs rounded-md shadow-none px-2"
        >
          Lịch sử điểm ({userLogs.length})
        </Button>

        {user.role !== "admin" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBanToggle(user)}
            className={`h-8 font-bold text-xs rounded-md shadow-none px-2 ${
              user.status === "ACTIVE"
                ? "border-red-200 hover:bg-red-50 text-red-700"
                : "border-emerald-200 hover:bg-emerald-50 text-emerald-700"
            }`}
          >
            {user.status === "ACTIVE" ? (
              <span className="flex items-center gap-1"><UserMinus className="size-3.5" />Khóa</span>
            ) : (
              <span className="flex items-center gap-1"><UserCheck className="size-3.5" />Mở</span>
            )}
          </Button>
        )}
      </div>
    ]
  })

  return (
    <AdminShell>
      <AdminHeader
        title="Danh sách đối tác"
        description="Quản lý tài khoản khách chơi, chủ quán và nhân viên sân chơi. Thiết lập điểm uy tín và phân quyền truy cập."
      />

      {/* User Directory Panel */}
      <AdminPanel>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            placeholder="Tìm theo tên, email hoặc mã ID..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="flex flex-wrap gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="customer">Khách hàng</option>
                <option value="provider">Chủ sân</option>
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="BANNED">Bị khóa</option>
              </select>
            </div>
          </div>
        </div>

        <AdminPanelTitle
          title={`Tài khoản người dùng hệ thống (${filteredUsers.length})`}
          subtitle="Admin quản trị điểm uy tín để ràng buộc trách nhiệm bồi thường và đặt sân."
        />

        <AdminTable columns={columns} rows={rows} />
      </AdminPanel>

      {/* Adjust Trust Score Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md bg-white border border-[#e5e2e1] rounded-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#1c1b1b] flex items-center gap-2">
              <Award className="size-5 text-orange-600" />
              Điều chỉnh Điểm Uy tín: {selectedUser?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-[#5d5f5f] mt-1.5">
              Điểm hiện tại: <span className="font-extrabold text-[#1c1b1b]">{selectedUser?.trustScore} / 100</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            {/* Add or Deduct Mode */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setAdjustType("ADD")}
                className={`flex-1 h-10 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  adjustType === "ADD"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                    : "border-[#e5e2e1] bg-white text-[#444748] hover:bg-[#f6f3f2]"
                }`}
              >
                <Plus className="size-4" />
                Cộng điểm thưởng
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("DEDUCT")}
                className={`flex-1 h-10 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  adjustType === "DEDUCT"
                    ? "bg-red-50 border-red-300 text-red-700 shadow-sm"
                    : "border-[#e5e2e1] bg-white text-[#444748] hover:bg-[#f6f3f2]"
                }`}
              >
                <Minus className="size-4" />
                Trừ điểm phạt
              </button>
            </div>

            {/* Point Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="points" className="text-xs font-bold text-[#444748]">Số lượng điểm:</Label>
              <Input
                id="points"
                type="number"
                min={1}
                max={50}
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(Number(e.target.value))}
                className="rounded-lg border-[#e5e2e1] text-xs font-semibold text-[#1c1b1b]"
              />
            </div>

            {/* Adjust Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-bold text-[#444748]">Lý do điều chỉnh (Bắt buộc):</Label>
              <Input
                id="reason"
                placeholder="Ví dụ: Hoàn thành bồi thường hư hại cản..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="rounded-lg border-[#e5e2e1] text-xs font-semibold text-[#1c1b1b]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedUser(null)}
              className="h-10 rounded-lg border-[#c4c7c8] bg-white text-[#1c1b1b] hover:bg-[#e5e2e1]/30 font-bold"
            >
              Hủy
            </Button>
            <Button
              onClick={handleAdjustTrustScore}
              disabled={!adjustReason.trim()}
              className="h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              Xác nhận thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trust Score History View for User */}
      <Dialog open={historyUser !== null} onOpenChange={(open) => !open && setHistoryUser(open ? historyUser : null)}>
        <DialogContent className="max-w-xl bg-white border border-[#e5e2e1] rounded-xl font-sans max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#e5e2e1] pb-3">
            <DialogTitle className="text-lg font-extrabold text-[#1c1b1b] flex items-center gap-2">
              <Award className="size-5 text-orange-600" />
              Lịch sử Điểm Uy tín: {historyUser?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-[#5d5f5f]">
              Lịch sử các biến động cộng trừ điểm của người dùng trên toàn hệ thống
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3">
            {mockTrustScoreLogs.filter((log) => log.userId === historyUser?.id).length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-[#747878]">
                Người dùng chưa có lịch sử biến động điểm uy tín.
              </div>
            ) : (
              mockTrustScoreLogs
                .filter((log) => log.userId === historyUser?.id)
                .map((log) => (
                  <div key={log.id} className="p-3.5 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-[#1c1b1b]">{log.reason}</div>
                      <div className="text-[10px] text-[#747878] font-bold mt-1">{log.timestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-extrabold text-sm ${log.delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {log.delta > 0 ? "+" : ""}
                        {log.delta}
                      </div>
                      <div className="text-[9px] text-[#747878] mt-0.5">
                        {log.previousScore} → {log.newScore} điểm
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          <DialogFooter className="border-t border-[#e5e2e1] pt-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setHistoryUser(null)}
              className="h-10 rounded-lg border-[#c4c7c8] bg-white text-[#1c1b1b] font-bold w-full"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
