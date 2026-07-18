import { describe, expect, it } from "vitest"
import {
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
      getEffectiveContestStatus(baseContest, new Date("2026-07-17T00:30:00.000Z")),
    ).toBe("OPEN")
    expect(
      getEffectiveContestStatus(baseContest, new Date("2026-07-17T01:30:00.000Z")),
    ).toBe("OPEN")
    expect(
      getEffectiveContestStatus(baseContest, new Date("2026-07-17T02:30:00.000Z")),
    ).toBe("CLOSED")
    expect(
      getEffectiveContestStatus(baseContest, new Date("2026-07-17T03:30:00.000Z")),
    ).toBe("RUNNING")
    expect(
      getEffectiveContestStatus(baseContest, new Date("2026-07-17T04:30:00.000Z")),
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
    expect(getRegistrationAvailabilityLabel("NOT_OPEN_YET")).toBe("Sắp mở đăng ký")
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
