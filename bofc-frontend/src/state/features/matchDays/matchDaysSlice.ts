import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
  getSingleMatchDayInfoType,
  IoMatchDaySummaryResType,
  NextMatchDayResType,
  MatchDayGoalKeeperHistoryInfoType,
  MatchDayGoalKeeperInfoType,
  MatchDayPlayerInfoType,
  MatchDaySummeryResType,
  LatestMatchDayWithUserStatusType,
  MatchDaySessionsResType,
  MatchDayListResType,
  CurrentMatchDayResType,
} from "./matchDayTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["matchDays", "matchDayTeam"],
});

export const matchDaysApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    createMatchDay: builder.mutation<
      BasicResType,
      {
        matchDayName: string;
        matchDayDate: string | Date;
        durationMinutes?: number;
        venueId: number;
        defaultMatchDay?: boolean;
        season?: string;
        description?: string;
        rules?: string;
        roadmapImageUrl?: string;
      }
    >({
      query: ({ matchDayName, matchDayDate, durationMinutes, venueId, defaultMatchDay, season, description, rules, roadmapImageUrl }) => ({
        url: "match-days",
        method: "POST",
        body: { matchDayName, matchDayDate, durationMinutes, venueId, defaultMatchDay, season, description, rules, roadmapImageUrl },
      }),
      invalidatesTags: ["matchDays"],
    }),
    getMatchDayById: builder.query<
      getSingleMatchDayInfoType,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) => `match-days/${matchDayId}`,
      providesTags: ["matchDays"],
    }),
    updateMatchDay: builder.mutation<
      BasicResType,
      {
        id: number;
        matchDayName: string;
        matchDayDate: string | Date;
        durationMinutes?: number;
        venueId: number;
        defaultMatchDay?: boolean;
        season?: string;
        description?: string;
        rules?: string;
        roadmapImageUrl?: string;
      }
    >({
      query: ({ id, matchDayName, matchDayDate, durationMinutes, venueId, defaultMatchDay, season, description, rules, roadmapImageUrl }) => ({
        url: `match-days/${id}`,
        method: "PUT",
        body: { matchDayName, matchDayDate, durationMinutes, venueId, defaultMatchDay, season, description, rules, roadmapImageUrl },
      }),
      invalidatesTags: ["matchDays"],
    }),
    updateMatchDayActiveStatus: builder.mutation<
      BasicResType,
      { id: number; activeStatus: boolean }
    >({
      query: ({ id, activeStatus }) => ({
        url: `match-days/${id}/status?active=${activeStatus}`,
        method: "PUT",
      }),
      invalidatesTags: ["matchDays"],
    }),

    concludeMatchDay: builder.mutation<BasicResType, { id: number }>({
      query: ({ id }) => ({
        url: `match-days/${id}/conclude`,
        method: "PUT",
      }),
      invalidatesTags: ["matchDays"],
    }),

    /** Permanently deletes the MatchDay and everything under it - cannot be undone. */
    hardDeleteMatchDay: builder.mutation<BasicResType, { id: number }>({
      query: ({ id }) => ({
        url: `match-days/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["matchDays"],
    }),

    presignRoadmapImageUpload: builder.mutation<
      BasicResType & { content: { key: string; url: string; uploadUrl: string; expiresInSeconds: number } },
      { fileName: string; contentType: string }
    >({
      query: ({ fileName, contentType }) => ({
        url: `files/team-logos/presign`,
        method: "POST",
        params: { fileName, contentType },
      }),
    }),

    getMatchDays: builder.query<
      IoMatchDaySummaryResType,
      {
        offSet: number;
        pageSize: number;
        sortedBy: string;
        sortDirection: "ASC" | "DESC";
      }
    >({
      query: ({ offSet, pageSize, sortedBy, sortDirection }) =>
        `match-days?offSet=${offSet}&pageSize=${pageSize}&sortedBy=${sortedBy}&sortDirection=${sortDirection}`,
      providesTags: ["matchDays"],
    }),

    getMatchDayParticipantsList: builder.query<
      NextMatchDayResType,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) =>
        `match-day-participants/${matchDayId}/next-upcoming`,
      providesTags: ["matchDays"],
    }),

    addParticipationToMatchDay: builder.mutation<
      MatchDayPlayerInfoType,
      {
        matchDayId: number;
        playerId: number;
        participationStatus: boolean;
        comments: string;
        matchDayParticipantId?: number;
      }
    >({
      query: ({
        matchDayId,
        playerId,
        participationStatus,
        comments,
        matchDayParticipantId,
      }) => ({
        url: `match-day-participants`,
        method: "POST",
        body: {
          matchDayId,
          playerId,
          participationStatus,
          comments,
          matchDayParticipantId,
        },
      }),
      // "matchDayTeam" too - playerListToAddToTeam (matchDayTeamSlice) is how the
      // Participants view's "Unassigned" bucket and the team-builder picker know who's
      // confirmed-but-unassigned; without it, a Yes/No vote here left both showing stale
      // data until a hard refresh blew away the whole RTK Query cache.
      invalidatesTags: ["matchDays", "matchDayTeam"],
    }),
    getMatchDaySummary: builder.query<
      MatchDaySummeryResType,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) => ({
        url: `match-days/details?matchDayId=${matchDayId}`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
    getMatchDayGoalKeeperList: builder.query<
      MatchDayGoalKeeperInfoType,
      { matchDayId: number }
    >({
      query: ({ matchDayId }) =>
        `match-day-participants/${matchDayId}/goal-keepers`,
      providesTags: ["matchDays"],
    }),
    getMatchDayGoalkeeperHistoryList: builder.query<
      MatchDayGoalKeeperHistoryInfoType,
      void
    >({
      query: () => ({
        url: `players/goal-keeper-history`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
    getLatestMatchDayWithUserStatus: builder.query<
      LatestMatchDayWithUserStatusType,
      void
    >({
      query: () => ({
        url: `match-day-participants/latest/with-user-status`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
    getMatchDaySessions: builder.query<MatchDaySessionsResType, void>({
      query: () => ({
        url: `match-days/sessions`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
    getMatchDaysByYear: builder.query<
      MatchDayListResType,
      { year: string }
    >({
      query: ({ year }) => ({
        url: `match-days/list?year=${year}`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
    getCurrentMatchDay: builder.query<CurrentMatchDayResType, void>({
      query: () => ({
        url: `match-days/current-match-day`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
    getNextActiveMatchDay: builder.query<CurrentMatchDayResType, void>({
      query: () => ({
        url: `match-days/next-active`,
        method: "GET",
      }),
      providesTags: ["matchDays"],
    }),
  }),
});

export const {
  useCreateMatchDayMutation,
  useGetMatchDayByIdQuery,
  useUpdateMatchDayMutation,
  useGetMatchDaysQuery,
  useUpdateMatchDayActiveStatusMutation,
  useConcludeMatchDayMutation,
  useHardDeleteMatchDayMutation,
  usePresignRoadmapImageUploadMutation,
  useGetMatchDayParticipantsListQuery,
  useAddParticipationToMatchDayMutation,
  useGetMatchDaySummaryQuery,
  useGetMatchDayGoalKeeperListQuery,
  useGetMatchDayGoalkeeperHistoryListQuery,
  useGetLatestMatchDayWithUserStatusQuery,
  useGetMatchDaySessionsQuery,
  useGetMatchDaysByYearQuery,
  useGetCurrentMatchDayQuery,
  useGetNextActiveMatchDayQuery,
} = matchDaysApi;
