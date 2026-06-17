import { api } from "@/shared/lib/axios";
import type {
  Contest,
  ContestRegistration,
  ContestClass,
  ContestRound,
  ContestHeat,
  ContestHeatEntry,
  ContestResultItem,
  ContestLeaderboardStanding,
  ContestReward,
  ContestRewardClaim,
  BracketMatch,
} from "../types";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
}

export const contestQueryKeys = {
  all: ["contests"] as const,
  list: (params?: any) => [...contestQueryKeys.all, "list", params ?? {}] as const,
  detail: (id?: string) => [...contestQueryKeys.all, "detail", id] as const,
  registrations: (id?: string) => [...contestQueryKeys.all, "registrations", id] as const,
  leaderboard: (id?: string) => [...contestQueryKeys.all, "leaderboard", id] as const,
  rewards: (id?: string) => [...contestQueryKeys.all, "rewards", id] as const,
  rewardClaims: () => [...contestQueryKeys.all, "reward-claims"] as const,
};

export const contestsApi = {
  // --- Public / Guest API ---
  listContests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    upcoming?: boolean;
    notify_within_hours?: number;
  }): Promise<ApiEnvelope<Contest[]>> => {
    const res = await api.get<ApiEnvelope<Contest[]>>("/v1/contests", { params });
    return res.data;
  },

  getCafeContests: async (
    cafeId: string,
    params?: { page?: number; limit?: number; upcoming?: boolean }
  ): Promise<ApiEnvelope<Contest[]>> => {
    const res = await api.get<ApiEnvelope<Contest[]>>(`/v1/cafes/${cafeId}/contests`, { params });
    return res.data;
  },

  getContestDetail: async (id: string, params?: { notify_within_hours?: number }): Promise<Contest> => {
    const res = await api.get<ApiEnvelope<Contest>>(`/v1/contests/${id}`, { params });
    return res.data.data;
  },

  getContestLeaderboard: async (id: string): Promise<ApiEnvelope<{ standings: ContestLeaderboardStanding[] }>> => {
    const res = await api.get<ApiEnvelope<{ standings: ContestLeaderboardStanding[] }>>(`/v1/contests/${id}/leaderboard`);
    return res.data;
  },

  getContestRewards: async (id: string): Promise<ApiEnvelope<ContestReward[]>> => {
    const res = await api.get<ApiEnvelope<ContestReward[]>>(`/v1/contests/${id}/rewards`);
    return res.data;
  },

  getMyRewardClaims: async (): Promise<ApiEnvelope<ContestRewardClaim[]>> => {
    const res = await api.get<ApiEnvelope<ContestRewardClaim[]>>("/v1/me/contest-reward-claims");
    return res.data;
  },

  // --- Participant Registration API ---
  registerContest: async (
    contestId: string,
    body: {
      vehicle_source: "BYOC" | "RENTAL";
      vehicle_id?: string;
      metadata?: { note?: string; [key: string]: any };
    }
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contests/${contestId}/register`, body);
    return res.data.data;
  },

  cancelRegistration: async (
    registrationId: string,
    body: { reason: string }
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contest-registrations/${registrationId}/cancel`, body);
    return res.data.data;
  },

  // --- Provider / Staff Management API ---
  createContest: async (body: any): Promise<Contest> => {
    const res = await api.post<ApiEnvelope<Contest>>("/v1/contests", body);
    return res.data.data;
  },

  updateContest: async (id: string, body: any): Promise<Contest> => {
    const res = await api.patch<ApiEnvelope<Contest>>(`/v1/contests/${id}`, body);
    return res.data.data;
  },

  openContest: async (id: string): Promise<Contest> => {
    const res = await api.post<ApiEnvelope<Contest>>(`/v1/contests/${id}/open`, {});
    return res.data.data;
  },

  cancelContest: async (id: string): Promise<Contest> => {
    const res = await api.post<ApiEnvelope<Contest>>(`/v1/contests/${id}/cancel`, {});
    return res.data.data;
  },

  getContestRegistrations: async (id: string): Promise<ContestRegistration[]> => {
    const res = await api.get<ApiEnvelope<ContestRegistration[]>>(`/v1/contests/${id}/registrations`);
    return res.data.data;
  },

  checkInParticipant: async (
    registrationId: string,
    body: { cafe_id: string }
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contest-registrations/${registrationId}/check-in`, body);
    return res.data.data;
  },

  // --- Competition Flow API ---
  createContestClass: async (contestId: string, body: any): Promise<ContestClass> => {
    const res = await api.post<ApiEnvelope<ContestClass>>(`/v1/contests/${contestId}/classes`, body);
    return res.data.data;
  },

  createContestRound: async (contestId: string, body: any): Promise<ContestRound> => {
    const res = await api.post<ApiEnvelope<ContestRound>>(`/v1/contests/${contestId}/rounds`, body);
    return res.data.data;
  },

  createContestHeat: async (roundId: string, body: any): Promise<ContestHeat> => {
    const res = await api.post<ApiEnvelope<ContestHeat>>(`/v1/contest-rounds/${roundId}/heats`, body);
    return res.data.data;
  },

  addHeatEntry: async (heatId: string, body: { registration_id: string; contest_class_id: string; grid_position: number }): Promise<ContestHeatEntry> => {
    const res = await api.post<ApiEnvelope<ContestHeatEntry>>(`/v1/contest-heats/${heatId}/entries`, body);
    return res.data.data;
  },

  submitHeatResult: async (
    heatId: string,
    body: {
      result_type: "TIME_ATTACK" | "RACE_FINAL";
      results: ContestResultItem[];
    }
  ): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contest-heats/${heatId}/results`, body);
    return res.data.data;
  },

  verifyResult: async (resultId: string): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contest-results/${resultId}/verify`, {});
    return res.data.data;
  },

  publishLeaderboard: async (
    contestId: string,
    body: { contest_class_id: string; scope: "OVERALL" }
  ): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contests/${contestId}/leaderboard/publish`, body);
    return res.data.data;
  },

  createContestReward: async (contestId: string, body: any): Promise<ContestReward> => {
    const res = await api.post<ApiEnvelope<ContestReward>>(`/v1/contests/${contestId}/rewards`, body);
    return res.data.data;
  },

  issueRewards: async (
    contestId: string,
    body: { contest_class_id: string }
  ): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contests/${contestId}/rewards/issue`, body);
    return res.data.data;
  },

  // --- Bracket Knockout Flow API ---
  createBracketMatch: async (roundId: string, body: any): Promise<BracketMatch> => {
    const res = await api.post<ApiEnvelope<BracketMatch>>(`/v1/contest-rounds/${roundId}/bracket-matches`, body);
    return res.data.data;
  },

  decideBracketWinner: async (
    matchId: string,
    body: { winner_registration_id: string; metadata?: { score?: string; [key: string]: any } }
  ): Promise<BracketMatch> => {
    const res = await api.post<ApiEnvelope<BracketMatch>>(`/v1/contest-bracket-matches/${matchId}/decide`, body);
    return res.data.data;
  },
};
