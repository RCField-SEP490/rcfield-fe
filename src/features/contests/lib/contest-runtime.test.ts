import { describe, expect, it } from "vitest"
import {
  applyStagedParticipants,
  formatDurationSeconds,
  getAuditGroup,
  getEligibleRuntimeRegistrations,
  getMatchParticipantName,
  groupMatchesByRound,
} from "./contest-runtime"

describe("contest runtime helpers", () => {
  it("filters eligible registrations for runtime", () => {
    const registrations = [
      { id: "1", status: "PENDING" },
      { id: "2", status: "CONFIRMED" },
      { id: "3", status: "CHECKED_IN" },
    ] as const

    expect(
      getEligibleRuntimeRegistrations(registrations as never),
    ).toHaveLength(1)
  })

  it("groups matches by round number", () => {
    const matches = [
      { id: "a", round_no: 2 },
      { id: "b", round_no: 1 },
      { id: "c", round_no: 2 },
    ] as const

    const groups = groupMatchesByRound(matches as never)

    expect(groups).toEqual([
      { roundNo: 2, matches: [matches[0], matches[2]] },
      { roundNo: 1, matches: [matches[1]] },
    ])
  })

  it("maps audit event group by prefix", () => {
    expect(
      getAuditGroup({ eventType: "match.results_submitted" } as never),
    ).toBe("match")
    expect(
      getAuditGroup({ eventType: "registration.checked_in" } as never),
    ).toBe("registration")
    expect(
      getAuditGroup({ eventType: "contest.leaderboard_published" } as never),
    ).toBe("contest")
  })

  it("formats contest runtime durations in seconds", () => {
    expect(formatDurationSeconds(32.4567)).toBe("32.457s")
    expect(formatDurationSeconds(null)).toBe("--")
  })
})

describe("applyStagedParticipants", () => {
  const snapshot = {
    id: "reg-1",
    user_id: "user-1",
    participant_name: "Đỗ Khánh Linh",
    participant_email: "linh@rcfield.test",
    participant_avatar_url: null,
    status: "CONFIRMED" as const,
    check_in_code: "5794EDB6",
    checked_in_at: null,
    is_my_registration: false,
  }

  const sourceMatch = {
    id: "match-1",
    round_no: 1,
    match_no: 1,
    participants: [
      {
        id: "p-1",
        registration_id: "reg-1",
        slot_no: 1,
        registration: snapshot,
      },
    ],
  }
  const targetMatch = {
    id: "match-2",
    round_no: 2,
    match_no: 1,
    participants: [],
  }

  it("giữ tên người chơi khi kéo sang trận vòng sau", () => {
    const result = applyStagedParticipants(
      [sourceMatch, targetMatch] as never,
      { "match-2": [{ registration_id: "reg-1", slot_no: 1 }] } as never,
    )
    const moved = result[1].participants[0]
    expect(moved.registration?.participant_name).toBe("Đỗ Khánh Linh")
    expect(getMatchParticipantName(moved)).toBe("Đỗ Khánh Linh")
  })

  it("không đụng tới trận không có thay đổi", () => {
    const result = applyStagedParticipants(
      [sourceMatch, targetMatch] as never,
      { "match-2": [{ registration_id: "reg-1", slot_no: 1 }] } as never,
    )
    expect(result[0]).toBe(sourceMatch)
  })
})
