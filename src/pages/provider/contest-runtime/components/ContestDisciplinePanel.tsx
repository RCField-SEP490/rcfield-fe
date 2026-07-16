import { useMemo, useState } from "react"
import { ShieldBan, UserCog, UserX } from "lucide-react"
import type { ContestRegistration } from "@/features/contests/types"
import { getRegistrationDisplayName } from "@/features/contests/lib/contest-runtime"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "sonner"
import { getErrorMessage } from "@/features/contests/lib/contest-runtime"
import type { useContestWorkspace } from "@/features/contests/hooks/useContestWorkspace"

type WorkspaceHook = ReturnType<typeof useContestWorkspace>

export function ContestDisciplinePanel({
  registrations,
  workspace,
}: {
  registrations: ContestRegistration[]
  workspace: WorkspaceHook
}) {
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [selectedRegistrationId, setSelectedRegistrationId] = useState("")
  const [disqualifyReason, setDisqualifyReason] = useState("")
  const [banUserId, setBanUserId] = useState("")
  const [banReason, setBanReason] = useState("")
  const [banNotes, setBanNotes] = useState("")
  const [banExpiresAt, setBanExpiresAt] = useState("")

  const activeStaffIds = useMemo(
    () =>
      new Set(
        (workspace.staffAssignmentsQuery.data ?? []).map((item) => item.staff_id),
      ),
    [workspace.staffAssignmentsQuery.data],
  )

  const eligibleForDisqualify = useMemo(
    () =>
      registrations.filter(
        (item) => item.status === "CONFIRMED" || item.status === "CHECKED_IN",
      ),
    [registrations],
  )

  const handleAssignStaff = async () => {
    if (!selectedStaffId) return
    try {
      await workspace.assignStaffMutation.mutateAsync(selectedStaffId)
      toast.success("Đã phân công staff cho contest")
      setSelectedStaffId("")
    } catch (error) {
      toast.error("Không thể phân công staff", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleDisqualify = async () => {
    if (!selectedRegistrationId || !disqualifyReason.trim()) {
      toast.error("Cần chọn registration và nhập lý do")
      return
    }
    try {
      await workspace.disqualifyRegistrationMutation.mutateAsync({
        registrationId: selectedRegistrationId,
        reason: disqualifyReason.trim(),
      })
      toast.success("Đã disqualify người chơi")
      setSelectedRegistrationId("")
      setDisqualifyReason("")
    } catch (error) {
      toast.error("Không thể disqualify người chơi", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleCreateBan = async () => {
    if (!banUserId.trim() || !banReason.trim()) {
      toast.error("Cần nhập user id và lý do ban")
      return
    }
    try {
      await workspace.createBanMutation.mutateAsync({
        user_id: banUserId.trim(),
        scope_type: "CONTEST",
        reason: banReason.trim(),
        notes: banNotes.trim() || null,
        expires_at: banExpiresAt || null,
      })
      toast.success("Đã tạo lệnh cấm")
      setBanUserId("")
      setBanReason("")
      setBanNotes("")
      setBanExpiresAt("")
    } catch (error) {
      toast.error("Không thể tạo lệnh cấm", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleLiftBan = async (banId: string) => {
    try {
      await workspace.liftBanMutation.mutateAsync({ banId })
      toast.success("Đã gỡ lệnh cấm")
    } catch (error) {
      toast.error("Không thể gỡ lệnh cấm", {
        description: getErrorMessage(error).message,
      })
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <Panel>
          <PanelTitle
            title="Phân công nhân sự"
            subtitle="Gắn staff vận hành trực tiếp cho contest hiện tại."
          />
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <select
              className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
            >
              <option value="">Chọn staff để phân công</option>
              {(workspace.staffOptionsQuery.data ?? [])
                .filter((item) => !activeStaffIds.has(item.id))
                .map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} · {staff.cafeName}
                  </option>
                ))}
            </select>
            <Button
              className="h-10 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
              onClick={() => void handleAssignStaff()}
            >
              Gán staff
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {(workspace.staffAssignmentsQuery.data ?? []).map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-orange-50 p-2 text-orange-700">
                    <UserCog className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#1c1b1b]">
                      {assignment.staff?.full_name ?? assignment.staff_id}
                    </p>
                    <p className="text-xs font-semibold text-[#747878]">
                      {assignment.staff?.email ?? "Chưa có email"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-8 rounded-lg border-red-200 bg-red-50 px-3 text-xs text-red-700 hover:bg-red-100"
                  onClick={() =>
                    void workspace.unassignStaffMutation.mutateAsync(
                      assignment.staff_id,
                    )
                  }
                >
                  Bỏ phân công
                </Button>
              </div>
            ))}

            {(workspace.staffAssignmentsQuery.data ?? []).length === 0 ? (
              <p className="text-sm font-semibold text-[#747878]">
                Chưa có staff nào được phân công cho contest.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="Disqualify người chơi"
            subtitle="Xử lý phá giải trực tiếp trên registration đang thi đấu."
          />
          <div className="space-y-3">
            <div>
              <Label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                Registration
              </Label>
              <select
                className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={selectedRegistrationId}
                onChange={(event) => setSelectedRegistrationId(event.target.value)}
              >
                <option value="">Chọn người chơi cần disqualify</option>
                {eligibleForDisqualify.map((registration) => (
                  <option key={registration.id} value={registration.id}>
                    {getRegistrationDisplayName(registration)} · {registration.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                Lý do
              </Label>
              <Textarea
                rows={4}
                value={disqualifyReason}
                onChange={(event) => setDisqualifyReason(event.target.value)}
              />
            </div>
            <Button
              className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleDisqualify()}
            >
              <UserX className="mr-2 size-4" />
              Disqualify
            </Button>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle
          title="Ban và gỡ ban"
          subtitle="Dùng BE contest bans để khóa người chơi ở scope contest."
        />

        <div className="grid gap-3 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4">
          <div>
            <Label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#747878]">
              User ID
            </Label>
            <Input
              value={banUserId}
              onChange={(event) => setBanUserId(event.target.value)}
              placeholder="Nhập user id từ registration hoặc hồ sơ người chơi"
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#747878]">
              Lý do ban
            </Label>
            <Textarea
              rows={3}
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#747878]">
              Ghi chú nội bộ
            </Label>
            <Textarea
              rows={3}
              value={banNotes}
              onChange={(event) => setBanNotes(event.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#747878]">
              Hết hạn
            </Label>
            <Input
              type="datetime-local"
              value={banExpiresAt}
              onChange={(event) => setBanExpiresAt(event.target.value)}
            />
          </div>
          <Button
            className="h-10 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
            onClick={() => void handleCreateBan()}
          >
            <ShieldBan className="mr-2 size-4" />
            Tạo ban contest
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {(workspace.bansQuery.data ?? []).map((ban) => (
            <article
              key={ban.id}
              className="rounded-xl border border-[#e5e2e1] bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#1c1b1b]">
                    {ban.user?.full_name ?? ban.user_id}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#747878]">
                    {ban.user?.email ?? "Không có email"} · scope {ban.scope_type}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#444748]">
                    {ban.reason}
                  </p>
                  {ban.notes ? (
                    <p className="mt-2 text-xs font-semibold text-[#747878]">
                      Ghi chú: {ban.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#747878]">
                    <span>Tạo lúc: {new Date(ban.created_at).toLocaleString("vi-VN")}</span>
                    <span>Hết hạn: {ban.expires_at ? new Date(ban.expires_at).toLocaleString("vi-VN") : "Không đặt"}</span>
                    <span>{ban.lifted_at ? "Đã gỡ ban" : "Đang hiệu lực"}</span>
                  </div>
                </div>

                {!ban.lifted_at ? (
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg border-emerald-200 bg-emerald-50 px-3 text-xs text-emerald-700 hover:bg-emerald-100"
                    onClick={() => void handleLiftBan(ban.id)}
                  >
                    Gỡ ban
                  </Button>
                ) : null}
              </div>
            </article>
          ))}

          {(workspace.bansQuery.data ?? []).length === 0 ? (
            <p className="text-sm font-semibold text-[#747878]">
              Chưa có lệnh cấm nào cho contest này.
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  )
}
