import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { useContestEventDay } from "@/features/contests/hooks/useContestEventDay"
import { getErrorMessage } from "@/features/contests/lib/contest-runtime"
import { useStaffOperations } from "../context/StaffOperationContext"
import { StaffHeader } from "../components/StaffUI"
import { ContestCheckInLookupCard } from "./components/ContestCheckInLookupCard"
import { ContestCheckInResultCard } from "./components/ContestCheckInResultCard"

export default function StaffContestCheckInPage() {
  const { contestId } = useParams()
  const { assignedCafeId } = useStaffOperations()
  const eventDay = useContestEventDay(contestId)
  const [code, setCode] = useState("")

  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })

  useEffect(() => {
    if (!assignedCafeId) return
  }, [assignedCafeId])

  const handleLookup = async () => {
    if (!code.trim()) return
    try {
      await eventDay.lookupMutation.mutateAsync(code.trim())
    } catch (error) {
      toast.error("Không thể tra cứu ngườ đăng ký", { description: getErrorMessage(error).message })
    }
  }

  const handleCheckIn = async (payload: {
    byocConfirmed?: boolean
    byocInspection?: {
      photos?: Array<{ url: string; angle?: string; notes?: string }>
      checklist?: Array<{
        itemKey: string
        itemLabel: string
        status?: 'OK' | 'NOT_OK' | 'NA'
        note?: string
      }>
    }
  }) => {
    const registration = eventDay.lookupMutation.data
    if (!registration || !assignedCafeId) return
    try {
      await eventDay.checkInMutation.mutateAsync({
        registrationId: registration.id,
        checkedInCafeId: assignedCafeId,
        byocConfirmed: payload.byocConfirmed,
        byocInspection: payload.byocInspection,
      })
      toast.success("Đã điểm danh ngườ đăng ký")
    } catch (error) {
      toast.error("Không thể điểm danh", { description: getErrorMessage(error).message })
    }
  }

  return (
    <div className="space-y-6">
      <StaffHeader
        title={contestQuery.data?.name ?? "Điểm danh giải đấu"}
        subtitle="Tra cứu ngườ đăng ký theo mã điểm danh và xác nhận điểm danh đúng cơ sở được phân công."
      />

      <ContestCheckInLookupCard
        code={code}
        onChangeCode={setCode}
        onLookup={() => void handleLookup()}
        isLoading={eventDay.lookupMutation.isPending}
      />

      <ContestCheckInResultCard
        registration={eventDay.lookupMutation.data ?? null}
        onCheckIn={handleCheckIn}
        isPending={eventDay.checkInMutation.isPending}
      />
    </div>
  )
}
