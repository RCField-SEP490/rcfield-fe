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
  ContestAuditLog,
  ContestMetrics,
} from "../types";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface ContestListParams {
  page?: number;
  limit?: number;
  status?: string;
  upcoming?: boolean;
  notify_within_hours?: number;
}

export interface ContestWritePayload {
  name?: string;
  description?: string;
  track_type_id?: string;
  starts_at?: string;
  ends_at?: string;
  registration_opens_at?: string;
  registration_closes_at?: string;
  capacity?: number;
  entry_fee?: number;
  banner_image_url?: string;
  participating_cafe_ids?: string[];
  config?: Record<string, unknown>;
}

export interface ContestClassPayload {
  code: string;
  name: string;
  capacity: number;
  rules?: Record<string, unknown>;
  display_order?: number;
  is_active?: boolean;
}

export interface ContestRoundPayload {
  contest_class_id: string;
  round_type: "PRACTICE" | "QUALIFYING" | "FINAL";
  round_no: number;
  name: string;
  rules?: Record<string, unknown>;
}

export interface ContestHeatPayload {
  heat_no: number;
  config?: Record<string, unknown>;
}

export interface ContestRewardPayload {
  contest_class_id?: string;
  title: string;
  description: string;
  reward_type: string;
  position: number;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface BracketMatchPayload {
  contest_round_id?: string;
  match_no: number;
  competitor_a_registration_id?: string | null;
  competitor_b_registration_id?: string | null;
  next_match_id?: string | null;
  next_slot?: "A" | "B" | null;
  metadata?: Record<string, unknown>;
}

export interface ContestResult {
  id: string;
  [key: string]: unknown;
}

export const contestQueryKeys = {
  all: ["contests"] as const,
  list: (params?: ContestListParams) => [...contestQueryKeys.all, "list", params ?? {}] as const,
  detail: (id?: string) => [...contestQueryKeys.all, "detail", id] as const,
  registrations: (id?: string) => [...contestQueryKeys.all, "registrations", id] as const,
  myRegistrations: (id?: string) => [...contestQueryKeys.all, "my-registrations", id] as const,
  classes: (id?: string) => [...contestQueryKeys.all, "classes", id] as const,
  rounds: (id?: string) => [...contestQueryKeys.all, "rounds", id] as const,
  bracket: (id?: string) => [...contestQueryKeys.all, "bracket", id] as const,
  leaderboard: (id?: string) => [...contestQueryKeys.all, "leaderboard", id] as const,
  rewards: (id?: string) => [...contestQueryKeys.all, "rewards", id] as const,
  rewardClaims: () => [...contestQueryKeys.all, "reward-claims"] as const,
  auditLogs: (id?: string) => [...contestQueryKeys.all, "audit-logs", id] as const,
  metrics: (id?: string) => [...contestQueryKeys.all, "metrics", id] as const,
};

const mapMatchDtoToBracketMatch = (dto: Record<string, any>): BracketMatch => {
  const participants = (dto.participants as any[]) || [];
  const pA = participants.find((p: any) => p.slot_no === 1 || p.slotNo === 1);
  const pB = participants.find((p: any) => p.slot_no === 2 || p.slotNo === 2);
  const winner = participants.find((p: any) => p.is_winner || p.isWinner);
  const loser = participants.find((p: any) => (p.slot_no === 1 || p.slotNo === 1 || p.slot_no === 2 || p.slotNo === 2) && p.registration_id !== winner?.registration_id);
  
  const roundNo = dto.round_no ?? dto.roundNo ?? 1;
  const contestRoundId = `round-${roundNo}`;

  return {
    id: dto.id,
    contestId: dto.contest_id ?? dto.contestId,
    contestRoundId,
    matchNo: dto.match_no ?? dto.matchNo,
    competitorARegistrationId: pA?.registration_id ?? pA?.registrationId ?? null,
    competitorBRegistrationId: pB?.registration_id ?? pB?.registrationId ?? null,
    winnerRegistrationId: winner?.registration_id ?? winner?.registrationId ?? null,
    loserRegistrationId: loser?.registration_id ?? loser?.registrationId ?? null,
    nextMatchId: dto.next_match_id ?? dto.nextMatchId,
    nextSlot: (dto.match_no ?? dto.matchNo) % 2 !== 0 ? 'A' : 'B',
    status: dto.status === 'READY' || dto.status === 'SCHEDULED' ? 'SCHEDULED' : 
            dto.status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED',
    metadata: {
      stage: dto.name || `Round ${roundNo} Match ${dto.match_no ?? dto.matchNo}`,
      score: winner ? `${winner.score ?? ''}` : undefined,
      ...dto.metadata,
    }
  };
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

  getMyContestRegistrations: async (contestId?: string): Promise<ContestRegistration[]> => {
    const res = await api.get<ApiEnvelope<ContestRegistration[]>>("/v1/me/contest-registrations", {
      params: contestId ? { contest_id: contestId } : undefined,
    });
    return res.data.data;
  },

  // --- Participant Registration API ---
  registerContest: async (
    contestId: string,
    body: {
      vehicle_source: "BYOC" | "RENTAL";
      vehicle_id?: string;
      customer_vehicle_id?: string;
      booking_id?: string;
      metadata?: { note?: string; [key: string]: unknown };
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
  createContest: async (body: ContestWritePayload): Promise<Contest> => {
    const res = await api.post<ApiEnvelope<Contest>>("/v1/contests", body);
    return res.data.data;
  },

  updateContest: async (id: string, body: ContestWritePayload): Promise<Contest> => {
    const res = await api.patch<ApiEnvelope<Contest>>(`/v1/contests/${id}`, body);
    return res.data.data;
  },

  uploadContestBanner: async (
    contestId: string,
    file: File,
  ): Promise<{ banner_image_url: string; public_id?: string | null }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiEnvelope<{ banner_image_url: string; public_id?: string | null }>>(
      `/v1/contests/${contestId}/banner`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
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

  lookupContestRegistrationByCode: async (
    contestId: string,
    checkInCode: string
  ): Promise<ContestRegistration> => {
    const res = await api.get<ApiEnvelope<ContestRegistration>>(`/v1/contests/${contestId}/registrations/lookup`, {
      params: { check_in_code: checkInCode },
    });
    return res.data.data;
  },

  checkInParticipant: async (
    registrationId: string,
    body: { cafe_id: string }
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contest-registrations/${registrationId}/check-in`, body);
    return res.data.data;
  },

  approveRegistration: async (
    registrationId: string
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contest-registrations/${registrationId}/approve`, {});
    return res.data.data;
  },

  rejectRegistration: async (
    registrationId: string,
    body: { reason: string }
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contest-registrations/${registrationId}/reject`, body);
    return res.data.data;
  },

  // --- Competition Flow API ---
  createContestClass: async (contestId: string, body: ContestClassPayload): Promise<ContestClass> => {
    const res = await api.post<ApiEnvelope<ContestClass>>(`/v1/contests/${contestId}/classes`, body);
    return res.data.data;
  },

  listContestClasses: async (contestId: string): Promise<ContestClass[]> => {
    const res = await api.get<ApiEnvelope<ContestClass[]>>(`/v1/contests/${contestId}/classes`);
    return res.data.data;
  },

  createContestRound: async (contestId: string, body: ContestRoundPayload): Promise<ContestRound> => {
    const res = await api.post<ApiEnvelope<ContestRound>>(`/v1/contests/${contestId}/rounds`, body);
    return res.data.data;
  },

  listContestRounds: async (contestId: string): Promise<ContestRound[]> => {
    const res = await api.get<ApiEnvelope<ContestRound[]>>(`/v1/contests/${contestId}/rounds`);
    return res.data.data;
  },

  getContestBracket: async (contestId: string): Promise<{
    classes: ContestClass[];
    rounds: ContestRound[];
    matches: BracketMatch[];
    registrations: ContestRegistration[];
  }> => {
    // 1. Fetch matches from /v1/contests/${contestId}/matches
    const resMatches = await api.get<ApiEnvelope<any[]>>(`/v1/contests/${contestId}/matches`);
    const matchesDto = resMatches.data.data || [];

    // 2. Map matches
    const matches: BracketMatch[] = matchesDto.map(mapMatchDtoToBracketMatch);

    // 3. Synthesize unique rounds
    const roundNumbers = Array.from(new Set(matchesDto.map(m => m.round_no ?? m.roundNo ?? 1))).sort((a, b) => a - b);
    const rounds: ContestRound[] = roundNumbers.map(roundNo => ({
      id: `round-${roundNo}`,
      contest_id: contestId,
      contestId,
      contest_class_id: 'default',
      contestClassId: 'default',
      round_no: roundNo,
      roundNo,
      name: roundNo === roundNumbers.length ? 'Final' : `Vòng ${roundNo}`,
      round_type: roundNo === roundNumbers.length ? 'FINAL' : 'QUALIFYING',
      roundType: roundNo === roundNumbers.length ? 'FINAL' : 'QUALIFYING',
      rules: { bracket: true },
      scheduled_at: undefined,
      scheduledAt: undefined,
    }));

    // 4. Fetch registrations to enrich properly
    const resRegs = await api.get<ApiEnvelope<ContestRegistration[]>>(`/v1/contests/${contestId}/registrations`);
    const registrations = resRegs.data.data || [];

    return {
      classes: [{
        id: 'default',
        contest_id: contestId,
        code: 'DEFAULT',
        name: 'Mặc định',
        capacity: 100,
        display_order: 1,
        is_active: true,
      }],
      rounds,
      matches,
      registrations
    };
  },

  createContestHeat: async (roundId: string, body: ContestHeatPayload): Promise<ContestHeat> => {
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
  ): Promise<ContestResult> => {
    const res = await api.post<ApiEnvelope<ContestResult>>(`/v1/contest-heats/${heatId}/results`, body);
    return res.data.data;
  },

  verifyResult: async (resultId: string): Promise<ContestResult> => {
    const res = await api.post<ApiEnvelope<ContestResult>>(`/v1/contest-results/${resultId}/verify`, {});
    return res.data.data;
  },

  publishLeaderboard: async (
    contestId: string,
    body: { contest_class_id?: string; scope?: "OVERALL" }
  ): Promise<unknown> => {
    const res = await api.post<ApiEnvelope<unknown>>(`/v1/contests/${contestId}/leaderboard/publish`, body);
    return res.data.data;
  },

  createContestReward: async (contestId: string, body: ContestRewardPayload): Promise<ContestReward> => {
    const res = await api.post<ApiEnvelope<ContestReward>>(`/v1/contests/${contestId}/rewards`, body);
    return res.data.data;
  },

  issueRewards: async (
    contestId: string,
    body: { contest_class_id?: string }
  ): Promise<unknown> => {
    const res = await api.post<ApiEnvelope<unknown>>(`/v1/contests/${contestId}/rewards/issue`, body);
    return res.data.data;
  },

  // --- Bracket Knockout Flow API ---
  createBracketMatch: async (roundId: string, body: BracketMatchPayload): Promise<BracketMatch> => {
    const res = await api.post<ApiEnvelope<BracketMatch>>(`/v1/contest-rounds/${roundId}/bracket-matches`, body);
    return res.data.data;
  },

  decideBracketWinner: async (
    matchId: string,
    body: { winner_registration_id: string; metadata?: { score?: string; [key: string]: unknown } }
  ): Promise<BracketMatch> => {
    const res = await api.post<ApiEnvelope<BracketMatch>>(`/v1/contest-bracket-matches/${matchId}/decide`, body);
    return res.data.data;
  },

  listAuditLogs: async (contestId: string): Promise<ContestAuditLog[]> => {
    const res = await api.get<ApiEnvelope<ContestAuditLog[]>>(`/v1/contests/${contestId}/audit-logs`);
    return res.data.data;
  },

  getMetrics: async (contestId: string): Promise<ContestMetrics> => {
    const res = await api.get<ApiEnvelope<ContestMetrics>>(`/v1/contests/${contestId}/metrics`);
    return res.data.data;
  },

  generateMatches: async (
    contestId: string,
    body: {
      format?: "KNOCKOUT" | "MULTI_DRIVER_HEAT" | "TIME_ATTACK";
      drivers_per_match?: number;
      registration_ids: string[];
      seeding_mode?: "MANUAL" | "RANDOM" | "CHECK_IN_ORDER" | "QUALIFYING_RANK";
      advancement_rule?: Record<string, unknown>;
      cafe_id?: string | null;
      track_config_id?: string | null;
    }
  ): Promise<any[]> => {
    const res = await api.post<ApiEnvelope<any[]>>(`/v1/contests/${contestId}/matches/generate`, body);
    return res.data.data;
  },

  submitMatchResults: async (
    matchId: string,
    body: {
      results: Array<{
        registration_id: string;
        finish_position?: number | null;
        score?: number | null;
        best_lap_ms?: number | null;
        total_time_ms?: number | null;
        is_winner?: boolean;
        result_note?: string;
      }>;
      reason?: string;
    }
  ): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contest-matches/${matchId}/results`, body);
    return res.data.data;
  },

  advanceMatch: async (
    matchId: string,
    body: {
      next_match_id: string;
      top_n?: number;
    }
  ): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contest-matches/${matchId}/advance`, body);
    return res.data.data;
  },

  correctMatchResults: async (
    matchId: string,
    body: {
      results: Array<{
        registration_id: string;
        finish_position?: number | null;
        score?: number | null;
        best_lap_ms?: number | null;
        total_time_ms?: number | null;
        is_winner?: boolean;
        result_note?: string;
      }>;
      reason?: string;
      force_cascade?: boolean;
    }
  ): Promise<any> => {
    const res = await api.post<ApiEnvelope<any>>(`/v1/contest-matches/${matchId}/results/correct`, body);
    return res.data.data;
  },
};




