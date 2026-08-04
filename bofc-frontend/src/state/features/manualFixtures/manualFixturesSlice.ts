import apiSlice from "../../api/apiSlice";
import {
  TournamentRoundRequest,
  TournamentRoundResponse,
  RoundGroupRequest,
  RoundGroupResponse,
  TeamAssignmentRequest,
  PlaceholderTeamRequest,
  RoundCompletionRequest,
  GroupStandingResponse,
  GetRoundByIdResponse,
  GetRoundsByTournamentResponse,
  GetTournamentStructureResponse,
  CreateRoundResponse,
  UpdateRoundResponse,
  DeleteRoundResponse,
  CompleteRoundResponse,
  GetNextRoundResponse,
  GetPreviousRoundResponse,
  GetGroupByIdResponse,
  GetGroupsByRoundResponse,
  CreateGroupResponse,
  UpdateGroupResponse,
  DeleteGroupResponse,
  AssignTeamsResponse,
  CreatePlaceholderResponse,
  RemoveTeamResponse,
  GetGroupStandingsResponse,
  RecalculateStandingsResponse,
  GroupTiebreakRequest,
  ApplyGroupTiebreakResponse,
  GroupMatchGenerationRequest,
  RoundMatchGenerationRequest,
  GenerateGroupMatchesResponse,
  GenerateRoundMatchesResponse,
  GetGroupMatchesResponse,
} from "./manualFixtureTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["rounds", "groups", "standings", "tournament-structure"],
});

export const manualFixturesApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    // ===== Tournament Round Management Endpoints =====

    /**
     * Create a new round
     * POST /api/rounds
     */
    createRound: builder.mutation<CreateRoundResponse, TournamentRoundRequest>({
      query: (body) => ({
        url: `/rounds`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["rounds", "tournament-structure"],
    }),

    /**
     * Update an existing round
     * PUT /api/rounds/{roundId}
     */
    updateRound: builder.mutation<
      UpdateRoundResponse,
      { roundId: number } & TournamentRoundRequest
    >({
      query: ({ roundId, ...body }) => ({
        url: `/rounds/${roundId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "rounds", id: roundId },
        "tournament-structure",
      ],
    }),

    /**
     * Delete a round
     * DELETE /api/rounds/{roundId}
     */
    deleteRound: builder.mutation<DeleteRoundResponse, { roundId: number }>({
      query: ({ roundId }) => ({
        url: `/rounds/${roundId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { roundId }) => [
        "rounds",
        "tournament-structure",
        { type: "rounds", id: roundId }, // Invalidate specific round cache
      ],
    }),

    /**
     * Get round by ID
     * GET /api/rounds/{roundId}
     */
    getRoundById: builder.query<GetRoundByIdResponse, { roundId: number }>({
      query: ({ roundId }) => ({
        url: `/rounds/${roundId}`,
        method: "GET",
      }),
      providesTags: (result, error, { roundId }) => [
        { type: "rounds", id: roundId },
      ],
    }),

    /**
     * Get all rounds for a tournament
     * GET /api/rounds/tournament/{tournamentId}
     */
    getRoundsByTournament: builder.query<
      GetRoundsByTournamentResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/rounds/tournament/${tournamentId}`,
        method: "GET",
      }),
      providesTags: ["rounds"],
    }),

    /**
     * Get complete tournament structure
     * GET /api/rounds/tournament/{tournamentId}/structure
     */
    getTournamentStructure: builder.query<
      GetTournamentStructureResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/rounds/tournament/${tournamentId}/structure`,
        method: "GET",
      }),
      providesTags: ["tournament-structure"],
    }),

    /**
     * Start a round (NOT_STARTED -> ONGOING)
     * POST /api/rounds/{roundId}/start
     */
    startRound: builder.mutation<
      CreateRoundResponse,
      { roundId: number }
    >({
      query: ({ roundId }) => ({
        url: `/rounds/${roundId}/start`,
        method: "POST",
      }),
      invalidatesTags: ["rounds", "tournament-structure"],
    }),

    /**
     * Complete a round and advance teams
     * POST /api/rounds/complete
     */
    completeRound: builder.mutation<CompleteRoundResponse, RoundCompletionRequest>({
      query: (body) => ({
        url: `/rounds/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["rounds", "groups", "standings", "tournament-structure"],
    }),

    /**
     * Get next round in sequence
     * GET /api/rounds/tournament/{tournamentId}/next?currentSequenceOrder={order}
     */
    getNextRound: builder.query<
      GetNextRoundResponse,
      { tournamentId: number; currentSequenceOrder: number }
    >({
      query: ({ tournamentId, currentSequenceOrder }) => ({
        url: `/rounds/tournament/${tournamentId}/next?currentSequenceOrder=${currentSequenceOrder}`,
        method: "GET",
      }),
      providesTags: ["rounds"],
    }),

    /**
     * Get previous round in sequence
     * GET /api/rounds/tournament/{tournamentId}/previous?currentSequenceOrder={order}
     */
    getPreviousRound: builder.query<
      GetPreviousRoundResponse,
      { tournamentId: number; currentSequenceOrder: number }
    >({
      query: ({ tournamentId, currentSequenceOrder }) => ({
        url: `/rounds/tournament/${tournamentId}/previous?currentSequenceOrder=${currentSequenceOrder}`,
        method: "GET",
      }),
      providesTags: ["rounds"],
    }),

    // ===== Round Group Management Endpoints =====

    /**
     * Create a new group
     * POST /api/groups
     */
    createGroup: builder.mutation<CreateGroupResponse, RoundGroupRequest>({
      query: (body) => ({
        url: `/groups`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["groups", "tournament-structure"],
    }),

    /**
     * Update an existing group
     * PUT /api/groups/{groupId}
     */
    updateGroup: builder.mutation<
      UpdateGroupResponse,
      { groupId: number } & RoundGroupRequest
    >({
      query: ({ groupId, ...body }) => ({
        url: `/groups/${groupId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
        "tournament-structure",
      ],
    }),

    /**
     * Delete a group
     * DELETE /api/groups/{groupId}
     */
    deleteGroup: builder.mutation<DeleteGroupResponse, { groupId: number }>({
      query: ({ groupId }) => ({
        url: `/groups/${groupId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
        "groups",
        "tournament-structure",
      ],
    }),

    /**
     * Get group by ID
     * GET /api/groups/{groupId}
     */
    getGroupById: builder.query<GetGroupByIdResponse, { groupId: number }>({
      query: ({ groupId }) => ({
        url: `/groups/${groupId}`,
        method: "GET",
      }),
      providesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
      ],
    }),

    /**
     * Get all groups in a round
     * GET /api/groups/round/{roundId}
     */
    getGroupsByRound: builder.query<GetGroupsByRoundResponse, { roundId: number }>({
      query: ({ roundId }) => ({
        url: `/groups/round/${roundId}`,
        method: "GET",
      }),
      providesTags: ["groups"],
    }),

    /**
     * Assign teams to a group
     * POST /api/groups/{groupId}/teams
     */
    assignTeamsToGroup: builder.mutation<
      AssignTeamsResponse,
      { groupId: number } & TeamAssignmentRequest
    >({
      query: ({ groupId, ...body }) => ({
        url: `/groups/${groupId}/teams`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
        "standings",
        "tournament-structure",
      ],
    }),

    /**
     * Assign teams to a round (for DIRECT_KNOCKOUT rounds)
     * POST /api/rounds/{roundId}/teams
     */
    assignTeamsToRound: builder.mutation<
      AssignTeamsResponse,
      { roundId: number } & TeamAssignmentRequest
    >({
      query: ({ roundId, ...body }) => ({
        url: `/rounds/${roundId}/teams`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "rounds", id: roundId },
        "tournament-structure",
      ],
    }),

    /**
     * Remove team from round (for DIRECT_KNOCKOUT rounds)
     * DELETE /api/rounds/{roundId}/teams/{teamId}
     */
    removeTeamFromRound: builder.mutation<
      RemoveTeamResponse,
      { roundId: number; teamId: number }
    >({
      query: ({ roundId, teamId }) => ({
        url: `/rounds/${roundId}/teams/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "rounds", id: roundId },
        "tournament-structure",
      ],
    }),

    /**
     * Create placeholder team
     * POST /api/groups/placeholder
     */
    createPlaceholderTeam: builder.mutation<
      CreatePlaceholderResponse,
      PlaceholderTeamRequest
    >({
      query: (body) => ({
        url: `/groups/placeholder`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["groups", "tournament-structure"],
    }),

    /**
     * Remove team from group
     * DELETE /api/groups/{groupId}/teams/{teamId}
     */
    removeTeamFromGroup: builder.mutation<
      RemoveTeamResponse,
      { groupId: number; teamId: number }
    >({
      query: ({ groupId, teamId }) => ({
        url: `/groups/${groupId}/teams/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
        "standings",
        "tournament-structure",
      ],
    }),

    /**
     * Get group standings
     * GET /api/groups/{groupId}/standings
     */
    getGroupStandings: builder.query<
      GetGroupStandingsResponse,
      { groupId: number }
    >({
      query: ({ groupId }) => ({
        url: `/groups/${groupId}/standings`,
        method: "GET",
      }),
      providesTags: (result, error, { groupId }) => [
        { type: "standings", id: groupId },
      ],
    }),

    /**
     * Recalculate group standings
     * POST /api/groups/{groupId}/standings/recalculate
     */
    recalculateGroupStandings: builder.mutation<
      RecalculateStandingsResponse,
      { groupId: number }
    >({
      query: ({ groupId }) => ({
        url: `/groups/${groupId}/standings/recalculate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "standings", id: groupId },
        { type: "groups", id: groupId },
      ],
    }),

    /**
     * Apply a manual penalty-shootout tiebreak for a group
     * POST /api/groups/{groupId}/standings/tiebreak
     */
    applyGroupTiebreak: builder.mutation<
      ApplyGroupTiebreakResponse,
      { groupId: number } & GroupTiebreakRequest
    >({
      query: ({ groupId, ...body }) => ({
        url: `/groups/${groupId}/standings/tiebreak`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "standings", id: groupId },
        { type: "groups", id: groupId },
        "tournament-structure",
      ],
    }),

    /**
     * Generate round-robin matches for a group
     * POST /api/groups/{groupId}/generate-matches
     */
    generateGroupMatches: builder.mutation<
      GenerateGroupMatchesResponse,
      { groupId: number } & GroupMatchGenerationRequest
    >({
      query: ({ groupId, ...body }) => ({
        url: `/groups/${groupId}/generate-matches`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
        "tournament-structure",
      ],
    }),

    /**
     * Generate matches for a round (DIRECT_KNOCKOUT)
     * POST /api/rounds/{roundId}/matches/generate
     */
    generateRoundMatches: builder.mutation<
      GenerateRoundMatchesResponse,
      { roundId: number } & RoundMatchGenerationRequest
    >({
      query: ({ roundId, ...body }) => ({
        url: `/rounds/${roundId}/matches/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "rounds", id: roundId },
        "tournament-structure",
      ],
    }),

    /**
     * Get all matches for a group
     * GET /api/groups/{groupId}/matches
     */
    getGroupMatches: builder.query<
      GetGroupMatchesResponse,
      { groupId: number }
    >({
      query: ({ groupId }) => ({
        url: `/groups/${groupId}/matches`,
        method: "GET",
      }),
      providesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
      ],
    }),

    /**
     * Clear all matches for a group
     * DELETE /api/groups/{groupId}/matches
     */
    clearGroupMatches: builder.mutation<
      { statusCode: number; status: string; message: string },
      { groupId: number }
    >({
      query: ({ groupId }) => ({
        url: `/groups/${groupId}/matches`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: "groups", id: groupId },
        "tournament-structure",
      ],
    }),
  }),
});

export const {
  // Round mutations
  useCreateRoundMutation,
  useUpdateRoundMutation,
  useDeleteRoundMutation,
  useStartRoundMutation,
  useCompleteRoundMutation,

  // Round queries
  useGetRoundByIdQuery,
  useGetRoundsByTournamentQuery,
  useGetTournamentStructureQuery,
  useGetNextRoundQuery,
  useGetPreviousRoundQuery,

  // Group mutations
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAssignTeamsToGroupMutation,
  useAssignTeamsToRoundMutation,
  useCreatePlaceholderTeamMutation,
  useRemoveTeamFromGroupMutation,
  useRemoveTeamFromRoundMutation,
  useRecalculateGroupStandingsMutation,
  useApplyGroupTiebreakMutation,
  useGenerateGroupMatchesMutation,
  useGenerateRoundMatchesMutation,
  useClearGroupMatchesMutation,

  // Group queries
  useGetGroupByIdQuery,
  useGetGroupsByRoundQuery,
  useGetGroupStandingsQuery,
  useGetGroupMatchesQuery,
} = manualFixturesApi;
