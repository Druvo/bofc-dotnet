import apiSlice from "../../api/apiSlice";
import {
  IFixture,
  IFixtureGenerationRequest,
  IRecordMatchEventRequest,
  IGetFixturesResponse,
  IGetMatchResponse,
  IStartMatchRequest,
  IStartMatchResponse,
  IPauseMatchResponse,
  IResumeMatchResponse,
  ICompleteMatchRequest,
  ICompleteMatchResponse,
  IUpdateMatchResponse,
  IUpdateScoreResponse,
  IUpdateFixtureResponse,
  IClearFixturesResponse,
  IRecordMatchEventResponse,
  IUpdateMatchEventRequest,
  IUpdateMatchEventResponse,
  IGetMatchStatisticsResponse,
  IGetMatchEventsResponse,
  IDeleteEventResponse,
  IUpdateElapsedTimeResponse,
  ICreateMatchRequest,
  ICreateMatchResponse,
  IDeleteMatchResponse,
  IMatchOrderUpdateRequest,
  IMatchOrderUpdateResponse,
} from "./fixtureTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["fixtures", "matches", "statistics"],
});

export const fixturesApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    // Fixture Management Endpoints - Simplified API

    /**
     * Generate fixtures (simplified - takes teamIds and matchDates)
     */
    generateFixtures: builder.mutation<
      IGetFixturesResponse,
      IFixtureGenerationRequest
    >({
      query: (body) => ({
        url: `/fixtures/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["fixtures"],
    }),

    /**
     * Get all fixtures for a tournament
     */
    getFixtures: builder.query<IGetFixturesResponse, { tournamentId: number }>({
      query: ({ tournamentId }) => ({
        url: `/fixtures/tournament/${tournamentId}`,
        method: "GET",
      }),
      providesTags: ["fixtures"],
    }),

    /**
     * Clear all fixtures for a tournament
     */
    clearFixtures: builder.mutation<IClearFixturesResponse, { tournamentId: number }>({
      query: ({ tournamentId }) => ({
        url: `/fixtures/tournament/${tournamentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["fixtures"],
    }),

    /**
     * Update a fixture (edit matchDate and/or venueId)
     * Endpoint: PUT /fixtures/{fixtureId}
     */
    updateFixture: builder.mutation<
      IUpdateFixtureResponse,
      { matchId: number; matchDate?: string; venueId?: number }
    >({
      query: ({ matchId, ...body }) => ({
        url: `/fixtures/${matchId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["fixtures", "matches"],
    }),

    /**
     * Get fixture by ID
     */
    getFixtureById: builder.query<IFixture, { fixtureId: number }>({
      query: ({ fixtureId }) => ({
        url: `/fixtures/${fixtureId}`,
        method: "GET",
      }),
      providesTags: ["fixtures"],
    }),

    /**
     * Get match by ID
     */
    getMatchById: builder.query<IGetMatchResponse, { fixtureId: number }>({
      query: ({ fixtureId }) => ({
        url: `/matches/${fixtureId}`,
        method: "GET",
      }),
      providesTags: (result, error, { fixtureId }) => [
        { type: "matches", id: fixtureId },
      ],
    }),

    // Match Management Endpoints

    /**
     * Get match details
     */
    getMatch: builder.query<IGetMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `matches/${matchId}`,
        method: "GET",
      }),
      providesTags: ["matches"],
    }),

    /**
     * Start a match (SCHEDULED -> ONGOING)
     */
    startMatch: builder.mutation<IStartMatchResponse, IStartMatchRequest>({
      query: ({ matchId, venueId, matchDurationMinutes }) => ({
        url: `/matches/${matchId}/start`,
        method: "POST",
        body: {
          venueId,
          matchDurationMinutes,
        },
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Pause a match
     */
    pauseMatch: builder.mutation<IPauseMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/pause`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Resume a paused match
     */
    resumeMatch: builder.mutation<IResumeMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/resume`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Complete a match (ONGOING -> COMPLETED)
     */
    completeMatch: builder.mutation<ICompleteMatchResponse, ICompleteMatchRequest>({
      query: ({ matchId, matchDurationMinutes }) => ({
        url: `/matches/${matchId}/complete`,
        method: "POST",
        body: {
          matchDurationMinutes,
        },
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Update match score
     */
    updateScore: builder.mutation<
      IUpdateScoreResponse,
      { matchId: number; homeTeamScore: number; awayTeamScore: number }
    >({
      query: ({ matchId, ...body }) => ({
        url: `/matches/${matchId}/score`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Record a match event (goal, card, substitution, etc.)
     * Endpoint: POST /matches/events
     * matchId goes in request body, not URL path
     */
    recordMatchEvent: builder.mutation<
      IRecordMatchEventResponse,
      IRecordMatchEventRequest
    >({
      query: (body) => ({
        url: `/matches/events`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        "fixtures",
        { type: "matches", id: arg.matchId },
        "statistics",
      ],
    }),

    /**
     * Get match events
     */
    getMatchEvents: builder.query<IGetMatchEventsResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/events`,
        method: "GET",
      }),
      providesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Update elapsed time
     */
    updateElapsedTime: builder.mutation<
      IUpdateElapsedTimeResponse,
      { matchId: number; elapsedTimeSeconds: number }
    >({
      query: ({ matchId, ...body }) => ({
        url: `/matches/${matchId}/elapsed-time`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Get match statistics
     */
    getMatchStatistics: builder.query<
      IGetMatchStatisticsResponse,
      { matchId: number }
    >({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/statistics`,
        method: "GET",
      }),
      providesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Delete a match event
     * Endpoint: DELETE /matches/events/{eventId}
     * Automatically reverses GOAL scores
     */
    deleteMatchEvent: builder.mutation<
      IDeleteEventResponse,
      { matchId: number; eventId: number }
    >({
      query: ({ eventId }) => ({
        url: `/matches/events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
        "statistics",
      ],
    }),

    /**
     * Update a match event
     * Endpoint: PUT /matches/events/{eventId}
     */
    updateMatchEvent: builder.mutation<
      IUpdateMatchEventResponse,
      { matchId: number; eventId: number; body: IUpdateMatchEventRequest }
    >({
      query: ({ eventId, body }) => ({
        url: `/matches/events/${eventId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
        "statistics",
      ],
    }),

    /**
     * Create a new match
     * Endpoint: POST /matches
     */
    createMatch: builder.mutation<ICreateMatchResponse, ICreateMatchRequest>({
      query: (body) => ({
        url: `/matches`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["fixtures"],
    }),

    /**
     * Delete a match
     * Endpoint: DELETE /matches/{matchId}
     */
    deleteMatch: builder.mutation<IDeleteMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["fixtures"],
    }),

    /**
     * Update match order (for drag and drop reordering)
     * Endpoint: PUT /matches/order
     */
    updateMatchOrder: builder.mutation<
      IMatchOrderUpdateResponse,
      IMatchOrderUpdateRequest
    >({
      query: (body) => ({
        url: `/matches/order`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["fixtures"],
    }),
  }),
});

export const {
  useGenerateFixturesMutation,
  useGetFixturesQuery,
  useClearFixturesMutation,
  useUpdateFixtureMutation,
  useGetMatchQuery,
  useStartMatchMutation,
  usePauseMatchMutation,
  useResumeMatchMutation,
  useCompleteMatchMutation,
  useUpdateScoreMutation,
  useRecordMatchEventMutation,
  useGetMatchEventsQuery,
  useGetMatchStatisticsQuery,
  useDeleteMatchEventMutation,
  useUpdateMatchEventMutation,
  useUpdateElapsedTimeMutation,
  useGetFixtureByIdQuery,
  useGetMatchByIdQuery,
  useCreateMatchMutation,
  useDeleteMatchMutation,
  useUpdateMatchOrderMutation,
} = fixturesApi;
