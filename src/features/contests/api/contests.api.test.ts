import { beforeEach, describe, expect, it, vi } from "vitest";
import { contestsApi } from "./contests.api";
import { api } from "@/shared/lib/axios";

vi.mock("@/shared/lib/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("contestsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: { success: true, data: [] } });
    mockedApi.post.mockResolvedValue({ data: { success: true, data: {} } });
  });

  it("lists contests with notification query params", async () => {
    await contestsApi.listContests({ upcoming: true, status: "OPEN", notify_within_hours: 72 });

    expect(mockedApi.get).toHaveBeenCalledWith("/v1/contests", {
      params: { upcoming: true, status: "OPEN", notify_within_hours: 72 },
    });
  });

  it("reads current user contest registration without provider-only endpoint", async () => {
    await contestsApi.getMyContestRegistrations("contest-1");

    expect(mockedApi.get).toHaveBeenCalledWith("/v1/me/contest-registrations", {
      params: { contest_id: "contest-1" },
    });
  });

  it("looks up staff check-in registrations by code", async () => {
    await contestsApi.lookupContestRegistrationByCode("contest-1", "check-in-code");

    expect(mockedApi.get).toHaveBeenCalledWith("/v1/contests/contest-1/registrations/lookup", {
      params: { check_in_code: "check-in-code" },
    });
  });

  it("checks in and cancels participant registrations", async () => {
    await contestsApi.checkInParticipant("registration-1", { cafe_id: "cafe-1" });
    await contestsApi.cancelRegistration("registration-1", { reason: "No show" });

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/v1/contest-registrations/registration-1/check-in",
      { cafe_id: "cafe-1" },
    );
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/v1/contest-registrations/registration-1/cancel",
      { reason: "No show" },
    );
  });

  it("reads bracket resources used by FE reload", async () => {
    await contestsApi.listContestClasses("contest-1");
    await contestsApi.listContestRounds("contest-1");
    await contestsApi.getContestBracket("contest-1");

    expect(mockedApi.get).toHaveBeenCalledWith("/v1/contests/contest-1/classes");
    expect(mockedApi.get).toHaveBeenCalledWith("/v1/contests/contest-1/rounds");
    expect(mockedApi.get).toHaveBeenCalledWith("/v1/contests/contest-1/bracket");
  });

  it("publishes leaderboard and issues rewards without fake class ids", async () => {
    await contestsApi.publishLeaderboard("contest-1", { scope: "OVERALL" });
    await contestsApi.issueRewards("contest-1", {});

    expect(mockedApi.post).toHaveBeenCalledWith("/v1/contests/contest-1/leaderboard/publish", {
      scope: "OVERALL",
    });
    expect(mockedApi.post).toHaveBeenCalledWith("/v1/contests/contest-1/rewards/issue", {});
  });
});
