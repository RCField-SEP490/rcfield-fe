const CHECK_IN_GRACE_MINUTES = 30

type BookingCheckInState = {
  status?: string | null
  slotStart?: string | Date | null
  session?: { status?: string | null } | null
}

/**
 * A confirmed booking is no longer eligible for check-in 30 minutes after its
 * scheduled start. This mirrors the server-side no-show policy.
 */
export function isCheckInDeadlineExpired(
  slotStart: string | Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!slotStart) return false

  const startAt = new Date(slotStart).getTime()
  return Number.isFinite(startAt) && startAt + CHECK_IN_GRACE_MINUTES * 60_000 < now
}

/**
 * A CHECKED_IN session only represents the handover in progress. When that
 * handover is abandoned past the deadline, present the booking as NO_SHOW
 * until the timeout job persists the final status.
 */
export function hasExpiredCheckInWindow(booking: BookingCheckInState, now = Date.now()): boolean {
  if (booking.status !== "CONFIRMED" || !isCheckInDeadlineExpired(booking.slotStart, now)) {
    return false
  }

  return !booking.session || booking.session.status === "CHECKED_IN"
}
