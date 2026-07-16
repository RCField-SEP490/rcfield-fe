import { describe, expect, it } from "vitest"
import {
  defaultContestWorkspaceSection,
  getContestWorkspacePath,
  parseContestWorkspaceContext,
} from "./contest-workspace"

describe("contest workspace helpers", () => {
  it("builds contest workspace urls", () => {
    expect(getContestWorkspacePath("contest-1", "bracket")).toBe(
      "/provider/contests/contest-1/bracket",
    )
  })

  it("parses contest workspace context", () => {
    expect(
      parseContestWorkspaceContext("/provider/contests/contest-1/overview"),
    ).toEqual({
      contestId: "contest-1",
      section: "overview",
      isLegacyRuntime: false,
    })
  })

  it("treats runtime as a legacy route", () => {
    expect(
      parseContestWorkspaceContext("/provider/contests/contest-1/runtime"),
    ).toEqual({
      contestId: "contest-1",
      section: null,
      isLegacyRuntime: true,
    })
  })

  it("returns null outside contest workspace", () => {
    expect(parseContestWorkspaceContext("/provider/contests")).toBeNull()
    expect(defaultContestWorkspaceSection).toBe("overview")
  })
})
