import apiSlice from "../../api/apiSlice";
import {
  IGetMatchDayStandingsResponse,
  IGetTopScorersResponse,
  IGetTopAssistsResponse,
  IGetTopCardsResponse,
  IGetMatchStatisticsResponse,
  IGetPlayerMatchDayStatisticsResponse,
  IGetPlayerStatisticsResponse,
  IGetPlayerMatchHistoryResponse,
} from "./statisticsTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["statistics"],
});

export const statisticsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get matchDay standings (teams ranked by points, goal difference, etc.)
     */
    getMatchDayStandings: builder.query<
      IGetMatchDayStandingsResponse,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) => ({
        url: `/statistics/match-days/${matchDayId}/standings`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get top scorers in a matchDay
     */
    getTopScorers: builder.query<
      IGetTopScorersResponse,
      { matchDayId: number; limit?: number }
    >({
      query: ({ matchDayId, limit }) => {
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit.toString());

        return {
          url: `/player-statistics/match-day/${matchDayId}/top-scorers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["statistics"],
    }),

    /**
     * Get top assist providers in a matchDay
     */
    getTopAssists: builder.query<
      IGetTopAssistsResponse,
      { matchDayId: number }
    >({
      query: ({ matchDayId}) => ({
        url: `/statistics/match-days/${matchDayId}/top-assists`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get players with most disciplinary cards in a matchDay
     */
    getTopCards: builder.query<
      IGetTopCardsResponse,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) => ({
        url: `/statistics/match-days/${matchDayId}/top-cards`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get all player statistics for a specific match
     */
    getMatchPlayerStatistics: builder.query<
      IGetMatchStatisticsResponse,
      { matchId: number }
    >({
      query: ({ matchId }) => ({
        url: `/statistics/matches/${matchId}`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get all statistics for a player across all matches in a matchDay
     */
    getPlayerMatchDayStatistics: builder.query<
      IGetPlayerMatchDayStatisticsResponse,
      { matchDayId: number; playerId: number }
    >({
      query: ({ matchDayId, playerId }) => ({
        url: `/statistics/match-days/${matchDayId}/players/${playerId}`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get player statistics with optional filters
     */
    aggregateMatchDayStatistics: builder.mutation<
      { status: string; message: string },
      { matchDayId: number }
    >({
      query: ({ matchDayId }) => ({
        url: `/statistics/match-days/${matchDayId}/aggregate`,
        method: "POST",
      }),
      invalidatesTags: ["statistics"],
    }),

    getPlayerStatistics: builder.query<
      IGetPlayerStatisticsResponse,
      {
        matchDayId?: number;
        position?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
        weeklyMatchDaysOnly?: boolean;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.matchDayId) queryParams.append('matchDayId', params.matchDayId.toString());
        if (params.position) queryParams.append('position', params.position);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        if (params.weeklyMatchDaysOnly) queryParams.append('weeklyMatchDaysOnly', 'true');

        return {
          url: `/player-statistics${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
          method: "GET",
        };
      },
      providesTags: ["statistics"],
    }),

    /**
     * A player's full match-by-match history across all matchDays (newest first)
     */
    getPlayerMatchHistory: builder.query<
      IGetPlayerMatchHistoryResponse,
      { playerId: number }
    >({
      query: ({ playerId }) => ({
        url: `/statistics/players/${playerId}/match-history`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),
  }),
});

export const {
  useGetMatchDayStandingsQuery,
  useGetTopScorersQuery,
  useGetTopAssistsQuery,
  useGetTopCardsQuery,
  useGetMatchPlayerStatisticsQuery,
  useGetPlayerMatchDayStatisticsQuery,
  useGetPlayerStatisticsQuery,
  useGetPlayerMatchHistoryQuery,
  useAggregateMatchDayStatisticsMutation,
} = statisticsApi;
