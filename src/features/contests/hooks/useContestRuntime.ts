import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { contestApi, contestQueryKeys } from "../api/contest.api"
import type {
  ContestCorrectResultsBody,
  ContestGenerateMatchesBody,
  ContestSubmitResultsBody,
  ContestUpdateMatchParticipantsBody,
} from "../types"

export function useContestRuntime(contestId?: string) {
  const queryClient = useQueryClient()

  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })

  const registrationsQuery = useQuery({
    queryKey: contestQueryKeys.registrations(contestId),
    queryFn: () => contestApi.listContestRegistrations(contestId!),
    enabled: Boolean(contestId),
  })

  const matchesQuery = useQuery({
    queryKey: contestQueryKeys.matches(contestId),
    queryFn: () => contestApi.listMatches(contestId!),
    enabled: Boolean(contestId),
  })

  const metricsQuery = useQuery({
    queryKey: contestQueryKeys.metrics(contestId),
    queryFn: () => contestApi.getMetrics(contestId!),
    enabled: Boolean(contestId),
  })

  const auditLogsQuery = useQuery({
    queryKey: contestQueryKeys.auditLogs(contestId),
    queryFn: () => contestApi.listAuditLogs(contestId!),
    enabled: Boolean(contestId),
  })

  const invalidateRuntime = async () => {
    if (!contestId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) }),
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) }),
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.matches(contestId) }),
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) }),
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.auditLogs(contestId) }),
    ])
  }

  const generateMatchesMutation = useMutation({
    mutationFn: (body: ContestGenerateMatchesBody) => contestApi.generateMatches(contestId!, body),
    onSuccess: invalidateRuntime,
  })

  const publishLeaderboardMutation = useMutation({
    mutationFn: () => contestApi.publishLeaderboard(contestId!),
    onSuccess: invalidateRuntime,
  })

  const updateParticipantsMutation = useMutation({
    mutationFn: ({ matchId, body }: { matchId: string; body: ContestUpdateMatchParticipantsBody }) =>
      contestApi.updateMatchParticipants(matchId, body),
    onSuccess: invalidateRuntime,
  })

  const submitResultsMutation = useMutation({
    mutationFn: ({ matchId, body }: { matchId: string; body: ContestSubmitResultsBody }) =>
      contestApi.submitMatchResults(matchId, body),
    onSuccess: invalidateRuntime,
  })

  const correctResultsMutation = useMutation({
    mutationFn: ({ matchId, body }: { matchId: string; body: ContestCorrectResultsBody }) =>
      contestApi.correctMatchResults(matchId, body),
    onSuccess: invalidateRuntime,
  })

  const advanceMatchMutation = useMutation({
    mutationFn: (matchId: string) => contestApi.advanceMatch(matchId),
    onSuccess: invalidateRuntime,
  })

  return {
    contestQuery,
    registrationsQuery,
    matchesQuery,
    metricsQuery,
    auditLogsQuery,
    generateMatchesMutation,
    publishLeaderboardMutation,
    updateParticipantsMutation,
    submitResultsMutation,
    correctResultsMutation,
    advanceMatchMutation,
  }
}
