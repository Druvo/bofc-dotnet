import apiSlice from "../../api/apiSlice";
import {
  IGetTournamentStandingsResponse,
  IGetTopScorersResponse,
  IGetTopAssistsResponse,
  IGetTopCardsResponse,
  IGetMatchStatisticsResponse,
  IGetPlayerTournamentStatisticsResponse,
  IGetPlayerStatisticsResponse,
  IGetPlayerMatchHistoryResponse,
} from "./statisticsTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["statistics"],
});

export const statisticsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get tournament standings (teams ranked by points, goal difference, etc.)
     */
    getTournamentStandings: builder.query<
      IGetTournamentStandingsResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/statistics/tournaments/${tournamentId}/standings`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get top scorers in a tournament
     */
    getTopScorers: builder.query<
      IGetTopScorersResponse,
      { tournamentId: number; limit?: number }
    >({
      query: ({ tournamentId, limit }) => {
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit.toString());

        return {
          url: `/player-statistics/tournament/${tournamentId}/top-scorers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["statistics"],
    }),

    /**
     * Get top assist providers in a tournament
     */
    getTopAssists: builder.query<
      IGetTopAssistsResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId}) => ({
        url: `/statistics/tournaments/${tournamentId}/top-assists`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get players with most disciplinary cards in a tournament
     */
    getTopCards: builder.query<
      IGetTopCardsResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/statistics/tournaments/${tournamentId}/top-cards`,
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
     * Get all statistics for a player across all matches in a tournament
     */
    getPlayerTournamentStatistics: builder.query<
      IGetPlayerTournamentStatisticsResponse,
      { tournamentId: number; playerId: number }
    >({
      query: ({ tournamentId, playerId }) => ({
        url: `/statistics/tournaments/${tournamentId}/players/${playerId}`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get player statistics with optional filters
     */
    aggregateTournamentStatistics: builder.mutation<
      { status: string; message: string },
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/statistics/tournaments/${tournamentId}/aggregate`,
        method: "POST",
      }),
      invalidatesTags: ["statistics"],
    }),

    getPlayerStatistics: builder.query<
      IGetPlayerStatisticsResponse,
      {
        tournamentId?: number;
        position?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.tournamentId) queryParams.append('tournamentId', params.tournamentId.toString());
        if (params.position) queryParams.append('position', params.position);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        
        return {
          url: `/player-statistics${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
          method: "GET",
        };
      },
      providesTags: ["statistics"],
    }),

    /**
     * A player's full match-by-match history across all tournaments (newest first)
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
  useGetTournamentStandingsQuery,
  useGetTopScorersQuery,
  useGetTopAssistsQuery,
  useGetTopCardsQuery,
  useGetMatchPlayerStatisticsQuery,
  useGetPlayerTournamentStatisticsQuery,
  useGetPlayerStatisticsQuery,
  useGetPlayerMatchHistoryQuery,
  useAggregateTournamentStatisticsMutation,
} = statisticsApi;
