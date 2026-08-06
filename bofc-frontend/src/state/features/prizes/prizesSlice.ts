import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
  GetMatchDayPrizesResponse,
  GetMatchDayPrizeResponse,
  MatchDayPrizeRequest,
  PrizeType,
} from "./prizeTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["prizes"],
});

export const prizesApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new matchDay prize
     */
    createMatchDayPrize: builder.mutation<
      GetMatchDayPrizeResponse,
      { matchDayId: number; data: MatchDayPrizeRequest }
    >({
      query: ({ matchDayId, data }) => ({
        url: `match-days/${matchDayId}/prizes`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["prizes"],
    }),

    /**
     * Update an existing prize
     */
    updateMatchDayPrize: builder.mutation<
      GetMatchDayPrizeResponse,
      { matchDayId: number; prizeId: number; data: MatchDayPrizeRequest }
    >({
      query: ({ matchDayId, prizeId, data }) => ({
        url: `match-days/${matchDayId}/prizes/${prizeId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["prizes"],
    }),

    /**
     * Delete a prize
     */
    deleteMatchDayPrize: builder.mutation<
      BasicResType,
      { matchDayId: number; prizeId: number }
    >({
      query: ({ matchDayId, prizeId }) => ({
        url: `match-days/${matchDayId}/prizes/${prizeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["prizes"],
    }),

    /**
     * Get all prizes for a matchDay
     */
    getMatchDayPrizes: builder.query<
      GetMatchDayPrizesResponse,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) => ({
        url: `match-days/${matchDayId}/prizes`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),

    /**
     * Get prizes by type (TEAM or PLAYER)
     */
    getMatchDayPrizesByType: builder.query<
      GetMatchDayPrizesResponse,
      { matchDayId: number; prizeType: PrizeType }
    >({
      query: ({ matchDayId, prizeType }) => ({
        url: `match-days/${matchDayId}/prizes/by-type?prizeType=${prizeType}`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),

    /**
     * Get prizes for a specific team
     */
    getTeamPrizes: builder.query<
      GetMatchDayPrizesResponse,
      { matchDayId: number; teamId: number }
    >({
      query: ({ matchDayId, teamId }) => ({
        url: `match-days/${matchDayId}/prizes/team/${teamId}`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),

    /**
     * Get prizes for a specific player
     */
    getPlayerPrizes: builder.query<
      GetMatchDayPrizesResponse,
      { matchDayId: number; playerId: number }
    >({
      query: ({ matchDayId, playerId }) => ({
        url: `match-days/${matchDayId}/prizes/player/${playerId}`,
        method: "GET",
      }),
      providesTags: ["prizes"],
    }),
  }),
});

export const {
  useCreateMatchDayPrizeMutation,
  useUpdateMatchDayPrizeMutation,
  useDeleteMatchDayPrizeMutation,
  useGetMatchDayPrizesQuery,
  useGetMatchDayPrizesByTypeQuery,
  useGetTeamPrizesQuery,
  useGetPlayerPrizesQuery,
} = prizesApi;
