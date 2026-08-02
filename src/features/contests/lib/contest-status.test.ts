import { describe, expect, it } from "vitest"
import {
  getContestCheckInAvailability,
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  getRegistrationAvailabilityLabel,
} from "./contest-status"

const baseContest = {
  status: "OPEN" as const,
  registration_opens_at: "2026-07-17T01:00:00.000Z",
  registration_closes_at: "2026-07-17T02:00:00.000Z",
  starts_at: "2026-07-17T03:00:00.000Z",
  ends_at: "2026-07-17T04:00:00.000Z",
}

describe("getEffectiveContestStatus", () => {
  it("keeps draft and cancelled as explicit backend states", () => {
    expect(
      getEffectiveContestStatus(
        { ...baseContest, status: "DRAFT" },
        new Date("2026-07-17T03:30:00.000Z"),
      ),
    ).toBe("DRAFT")
    expect(
      getEffectiveContestStatus(
        { ...baseContest, status: "CANCELLED" },
        new Date("2026-07-17T03:30:00.000Z"),
      ),
    ).toBe("CANCELLED")
  })

  it("derives the registration and contest lifecycle from timestamps", () => {
    expect(
      getEffectiveContestStatus(
        baseContest,
        new Date("2026-07-17T00:30:00.000Z"),
      ),
    ).toBe("OPEN")
    expect(
      getEffectiveContestStatus(
        baseContest,
        new Date("2026-07-17T01:30:00.000Z"),
      ),
    ).toBe("OPEN")
    expect(
      getEffectiveContestStatus(
        baseContest,
        new Date("2026-07-17T02:30:00.000Z"),
      ),
    ).toBe("CLOSED")
    expect(
      getEffectiveContestStatus(
        baseContest,
        new Date("2026-07-17T03:30:00.000Z"),
      ),
    ).toBe("RUNNING")
    expect(
      getEffectiveContestStatus(
        baseContest,
        new Date("2026-07-17T04:30:00.000Z"),
      ),
    ).toBe("COMPLETED")
  })
})

describe("getContestRegistrationAvailability", () => {
  it("blocks registration before the registration window opens", () => {
    expect(
      getContestRegistrationAvailability(
        baseContest,
        new Date("2026-07-17T00:30:00.000Z"),
      ),
    ).toBe("NOT_OPEN_YET")
    expect(getRegistrationAvailabilityLabel("NOT_OPEN_YET")).toBe(
      "Sắp mở đăng ký",
    )
  })

  it("allows registration only inside the registration window", () => {
    expect(
      getContestRegistrationAvailability(
        baseContest,
        new Date("2026-07-17T01:30:00.000Z"),
      ),
    ).toBe("AVAILABLE")
    expect(
      getContestRegistrationAvailability(
        baseContest,
        new Date("2026-07-17T02:30:00.000Z"),
      ),
    ).toBe("CLOSED")
  })
})

describe("getContestCheckInAvailability", () => {
  // Bám đúng các điều kiện backend áp trong checkInRegistration; lệch một cái là
  // nhân viên bấm được nút rồi ăn lỗi 400 giữa ca trực.
  const race = {
    starts_at: "2026-08-11T01:00:00.000Z",
    ends_at: "2026-08-11T04:00:00.000Z",
  }

  it("chặn khi giải còn đang mở đăng ký", () => {
    const result = getContestCheckInAvailability(
      { ...race, status: "OPEN" },
      new Date("2026-08-11T02:00:00.000Z"),
    )
    expect(result.canCheckIn).toBe(false)
    expect(result).toMatchObject({
      reason: "Còn đang mở đăng ký — đóng đăng ký rồi mới điểm danh được",
    })
  })

  it("chặn khi chưa tới giờ thi đấu", () => {
    const result = getContestCheckInAvailability(
      { ...race, status: "CLOSED" },
      new Date("2026-08-11T00:30:00.000Z"),
    )
    expect(result).toMatchObject({
      canCheckIn: false,
      reason: "Chưa tới giờ thi đấu",
    })
  })

  it("chặn khi giải đã kết thúc", () => {
    const result = getContestCheckInAvailability(
      { ...race, status: "RUNNING" },
      new Date("2026-08-11T05:00:00.000Z"),
    )
    expect(result).toMatchObject({
      canCheckIn: false,
      reason: "Giải đã kết thúc",
    })
  })

  it("cho điểm danh trong khung giờ thi đấu", () => {
    expect(
      getContestCheckInAvailability(
        { ...race, status: "CLOSED" },
        new Date("2026-08-11T02:00:00.000Z"),
      ),
    ).toEqual({ canCheckIn: true })
    expect(
      getContestCheckInAvailability(
        { ...race, status: "RUNNING" },
        new Date("2026-08-11T03:59:00.000Z"),
      ),
    ).toEqual({ canCheckIn: true })
  })
})
