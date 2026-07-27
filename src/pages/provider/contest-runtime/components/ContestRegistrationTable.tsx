import type { ContestRegistration } from "@/features/contests/types"
import {
  formatContestDateTime,
  getRegistrationDisplayName,
  getRegistrationSubtitle,
} from "@/features/contests/lib/contest-runtime"
import {
  JourneyStatusBadge,
  PaymentStatusBadge,
  RegistrationStatusBadge,
} from "@/features/contests/components"
import {
  RegistrationRowActions,
  type RegistrationActionKind,
} from "./RegistrationRowActions"

export function ContestRegistrationTable({
  registrations,
  onAction,
}: {
  registrations: ContestRegistration[]
  onAction: (kind: RegistrationActionKind, registration: ContestRegistration) => void
}) {
  return (
    <div className="space-y-3">
      {registrations.map((registration) => (
        <article
          key={registration.id}
          className="rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-extrabold text-[#1c1b1b]">
                  {getRegistrationDisplayName(registration)}
                </p>
                <RegistrationStatusBadge status={registration.status} />
                <PaymentStatusBadge status={registration.paymentStatus} />
                {registration.customerJourneyStatus ? (
                  <JourneyStatusBadge
                    status={registration.customerJourneyStatus}
                  />
                ) : null}
              </div>

              <p className="mt-1 text-xs font-semibold text-[#747878]">
                {getRegistrationSubtitle(registration) ??
                  `Mã đăng ký ${registration.id.slice(0, 8)}`}
              </p>

              <div className="mt-3 grid gap-2 text-xs font-semibold text-[#5d5f5f] md:grid-cols-2 xl:grid-cols-4">
                <MetaRow
                  label="Mã điểm danh"
                  value={registration.checkInCode ?? "--"}
                />
                <MetaRow
                  label="Lệ phí"
                  value={
                    registration.entryFeeAmount
                      ? formatCurrency(registration.entryFeeAmount)
                      : "--"
                  }
                />
                <MetaRow
                  label="Điểm danh"
                  value={formatContestDateTime(registration.checkedInAt)}
                />
                <MetaRow
                  label="Trận gần nhất"
                  value={
                    registration.latestMatch?.name ??
                    (registration.latestMatch
                      ? `Vòng ${registration.latestMatch.roundNo} · Lượt ${registration.latestMatch.matchNo}`
                      : "--")
                  }
                />
              </div>
            </div>

            <RegistrationRowActions
              registration={registration}
              onAction={onAction}
            />
          </div>
        </article>
      ))}

      {registrations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#c4c7c8] p-8 text-center text-sm font-semibold text-[#747878]">
          Không có đăng ký phù hợp bộ lọc.
        </div>
      ) : null}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-white px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#1c1b1b]">{value}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}
