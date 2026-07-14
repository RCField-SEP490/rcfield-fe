import type {
  CustomerJourneyStatus,
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

export function getContestStatusLabel(status: ContestItem["status"]): string {
  switch (status) {
    case "DRAFT":
      return "Bản nháp"
    case "OPEN":
      return "Đang mở đăng ký"
    case "CLOSED":
      return "Đã đóng đăng ký"
    case "RUNNING":
      return "Đang diễn ra"
    case "COMPLETED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return status
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

export function getRegistrationStatusLabel(status: ContestRegistrationStatus): string {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt"
    case "CONFIRMED":
      return "Đã xác nhận"
    case "CHECKED_IN":
      return "Đã điểm danh"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return status
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

export function getPaymentStatusLabel(status: ContestEntryFeePaymentStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Chờ thanh toán"
    case "PENDING_REVIEW":
      return "Đang chờ duyệt thanh toán"
    case "MARKED_PAID":
      return "Đã thanh toán"
    case "WAIVED":
      return "Được miễn phí"
    case "NOT_REQUIRED":
      return "Miễn lệ phí"
    default:
      return status
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

export function getMatchStatusLabel(status: ContestMatchStatus): string {
  switch (status) {
    case "DRAFT":
      return "Bản nháp"
    case "READY":
      return "Sẵn sàng"
    case "RUNNING":
      return "Đang đua"
    case "COMPLETED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return status
  }
}

export function getJourneyStatusClass(status: CustomerJourneyStatus | null) {
  switch (status) {
    case "CHECKED_IN_WAITING_BRACKET":
    case "ADVANCED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "IN_BRACKET":
    case "APPROVED_WAITING_CHECKIN":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "ELIMINATED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    case "FINISHED":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getJourneyStatusLabel(status: CustomerJourneyStatus | null) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Chờ duyệt"
    case "APPROVED_WAITING_CHECKIN":
      return "Đã duyệt, chờ check-in"
    case "CHECKED_IN_WAITING_BRACKET":
      return "Đã check-in, chờ xếp nhánh"
    case "IN_BRACKET":
      return "Đang thi đấu"
    case "ADVANCED":
      return "Đã vào vòng tiếp"
    case "ELIMINATED":
      return "Đã bị loại"
    case "FINISHED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return "Đang cập nhật"
  }
}
