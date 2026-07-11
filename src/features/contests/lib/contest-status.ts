import type {
  ContestEntryFeePaymentStatus,
  ContestItem,
  ContestMatchStatus,
  ContestRegistrationStatus,
} from "../types"

export function getContestStatusClass(status: ContestItem["status"]) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "CLOSED":
    case "RUNNING":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getRegistrationStatusClass(status: ContestRegistrationStatus) {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "CHECKED_IN":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-200"
  }
}

export function getPaymentStatusClass(status: ContestEntryFeePaymentStatus) {
  switch (status) {
    case "MARKED_PAID":
    case "WAIVED":
    case "NOT_REQUIRED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "PENDING_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getMatchStatusClass(status: ContestMatchStatus) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "RUNNING":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "READY":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}
