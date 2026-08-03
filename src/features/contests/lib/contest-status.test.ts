import { describe, expect, it } from "vitest"
import {
  getContestCheckInAvailability,
  getContestDrawAvailability,
  getContestEditAvailability,
  getContestPublishAvailability,
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

describe("getContestEditAvailability", () => {
  it("cho sửa khi còn bản nháp hoặc đang mở đăng ký", () => {
    expect(getContestEditAvailability({ status: "DRAFT" })).toEqual({ allowed: true })
    expect(getContestEditAvailability({ status: "OPEN" })).toEqual({ allowed: true })
  })

  it("chặn sau khi đóng đăng ký vì khách đã sắp lịch theo thông tin cũ", () => {
    expect(getContestEditAvailability({ status: "CLOSED" })).toMatchObject({
      allowed: false,
      reason: "Đã đóng đăng ký — không sửa được thông tin giải nữa",
    })
    expect(getContestEditAvailability({ status: "COMPLETED" })).toMatchObject({
      allowed: false,
      reason: "Giải đã kết thúc — không sửa được nữa",
    })
  })
})

describe("getContestDrawAvailability", () => {
  const drawable = { eligibleCount: 6, hasPlayedMatch: false }

  it("cho bốc thăm khi giải đã mở và đủ người", () => {
    expect(getContestDrawAvailability({ status: "OPEN" }, drawable)).toEqual({ allowed: true })
    expect(getContestDrawAvailability({ status: "CLOSED" }, drawable)).toEqual({ allowed: true })
  })

  it("chặn khi giải còn là bản nháp", () => {
    expect(getContestDrawAvailability({ status: "DRAFT" }, drawable)).toMatchObject({
      allowed: false,
      reason: "Giải còn là bản nháp — mở đăng ký trước đã",
    })
  })

  it("chặn bốc lại khi đã có trận thi đấu", () => {
    expect(
      getContestDrawAvailability({ status: "RUNNING" }, { ...drawable, hasPlayedMatch: true }),
    ).toMatchObject({
      allowed: false,
      reason: "Đã có trận thi đấu — không bốc thăm lại được nữa",
    })
  })

  it("chặn khi chưa đủ 2 người được duyệt", () => {
    expect(
      getContestDrawAvailability({ status: "OPEN" }, { ...drawable, eligibleCount: 1 }),
    ).toMatchObject({
      allowed: false,
      reason: "Cần ít nhất 2 người đã được duyệt để bốc thăm",
    })
  })
})

describe("getContestPublishAvailability", () => {
  const finished = { totalMatches: 7, unfinishedMatches: 0 }

  it("cho công bố khi mọi trận đã xong", () => {
    expect(getContestPublishAvailability({ status: "RUNNING" }, finished)).toEqual({
      allowed: true,
    })
  })

  it("chặn khi còn đang mở đăng ký", () => {
    expect(
      getContestPublishAvailability({ status: "OPEN" }, { totalMatches: 0, unfinishedMatches: 0 }),
    ).toMatchObject({
      allowed: false,
      reason: "Còn đang mở đăng ký — chưa có gì để công bố",
    })
  })

  it("chặn khi chưa bốc thăm", () => {
    expect(
      getContestPublishAvailability({ status: "CLOSED" }, { totalMatches: 0, unfinishedMatches: 0 }),
    ).toMatchObject({
      allowed: false,
      reason: "Chưa bốc thăm nên chưa có trận nào",
    })
  })

  it("nói rõ còn bao nhiêu trận chưa có kết quả", () => {
    expect(
      getContestPublishAvailability({ status: "RUNNING" }, { totalMatches: 7, unfinishedMatches: 3 }),
    ).toMatchObject({
      allowed: false,
      reason: "Còn 3 trận chưa có kết quả",
    })
  })

  it("chặn công bố lần hai khi giải đã hoàn thành", () => {
    expect(getContestPublishAvailability({ status: "COMPLETED" }, finished)).toMatchObject({
      allowed: false,
      reason: "Bảng xếp hạng đã được công bố",
    })
  })
})
