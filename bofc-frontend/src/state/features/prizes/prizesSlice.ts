import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
  GetTournamentPrizesResponse,
  GetTournamentPrizeResponse,
  TournamentPrizeRequest,
  PrizeType,
} from "./prizeTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["prizes"],
});

export const prizesApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new tournament prize
     */
    createTournamentPrize: builder.mutation<
      GetTournamentPrizeResponse,
      { tournamentId: number; data: TournamentPrizeRequest }
    >({
      query: ({ tournamentId, data }) => ({
        url: `tournaments/${tournamentId}/prizes`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["prizes"],
    }),

    /**
     * Update an existing prize
     */
    updateTournamentPrize: builder.mutation<
      GetTournamentPrizeResponse,
      { tournamentId: number; prizeId: number; data: TournamentPrizeRequest }
    >({
      query: ({ tournamentId, prizeId, data }) => ({
        url: `tournaments/${tournamentId}/prizes/${prizeId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["prizes"],
    }),

    /**
     * Delete a prize
     */
    deleteTournamentPrize: builder.mutation<
      BasicResType,
      { tournamentId: number; prizeId: number }
    >({
      query: ({ tournamentId, prizeId }) => ({
        url: `tournaments/${tournamentId}/prizes/${prizeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["prizes"],
    }),

    /**
     * Get all prizes for a tournament
     */
    getTournamentPrizes: builder.query<
      GetTournamentPrizesResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `tournaments/${tournamentId}/prizes`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),

    /**
     * Get prizes by type (TEAM or PLAYER)
     */
    getTournamentPrizesByType: builder.query<
      GetTournamentPrizesResponse,
      { tournamentId: number; prizeType: PrizeType }
    >({
      query: ({ tournamentId, prizeType }) => ({
        url: `tournaments/${tournamentId}/prizes/by-type?prizeType=${prizeType}`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),

    /**
     * Get prizes for a specific team
     */
    getTeamPrizes: builder.query<
      GetTournamentPrizesResponse,
      { tournamentId: number; teamId: number }
    >({
      query: ({ tournamentId, teamId }) => ({
        url: `tournaments/${tournamentId}/prizes/team/${teamId}`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),

    /**
     * Get prizes for a specific player
     */
    getPlayerPrizes: builder.query<
      GetTournamentPrizesResponse,
      { tournamentId: number; playerId: number }
    >({
      query: ({ tournamentId, playerId }) => ({
        url: `tournaments/${tournamentId}/prizes/player/${playerId}`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),
  }),
});

export const {
  useCreateTournamentPrizeMutation,
  useUpdateTournamentPrizeMutation,
  useDeleteTournamentPrizeMutation,
  useGetTournamentPrizesQuery,
  useGetTournamentPrizesByTypeQuery,
  useGetTeamPrizesQuery,
  useGetPlayerPrizesQuery,
} = prizesApi;
