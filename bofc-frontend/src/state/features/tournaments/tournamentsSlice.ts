import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
  getSingleTournamentInfoType,
  IoTournamentSummaryResType,
  NextTournamentResType,
  TournamentGoalKeeperHistoryInfoType,
  TournamentGoalKeeperInfoType,
  TournamentPlayerInfoType,
  TournamentSummeryResType,
  LatestTournamentWithUserStatusType,
  TournamentSessionsResType,
  TournamentListResType,
} from "./tournamentTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["tournaments"],
});

export const tournamentsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    createTournament: builder.mutation<
      BasicResType,
      {
        tournamentName: string;
        tournamentDate: string | Date;
        venueId: number;
        auctionMode?: boolean;
        defaultTournament?: boolean;
        season?: string;
        description?: string;
        rules?: string;
        roadmapImageUrl?: string;
      }
    >({
      query: ({ tournamentName, tournamentDate, venueId, auctionMode, defaultTournament, season, description, rules, roadmapImageUrl }) => ({
        url: "tournaments",
        method: "POST",
        body: { tournamentName, tournamentDate, venueId, auctionMode: auctionMode || false, defaultTournament, season, description, rules, roadmapImageUrl },
      }),
      invalidatesTags: ["tournaments"],
    }),
    getTournamentById: builder.query<
      getSingleTournamentInfoType,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => `tournaments/${tournamentId}`,
      providesTags: ["tournaments"],
    }),
    updateTournament: builder.mutation<
      BasicResType,
      {
        id: number;
        tournamentName: string;
        tournamentDate: string | Date;
        venueId: number;
        auctionMode?: boolean;
        defaultTournament?: boolean;
        season?: string;
        description?: string;
        rules?: string;
        roadmapImageUrl?: string;
      }
    >({
      query: ({ id, tournamentName, tournamentDate, venueId, auctionMode, defaultTournament, season, description, rules, roadmapImageUrl }) => ({
        url: `tournaments/${id}`,
        method: "PUT",
        body: { tournamentName, tournamentDate, venueId, auctionMode: auctionMode || false, defaultTournament, season, description, rules, roadmapImageUrl },
      }),
      invalidatesTags: ["tournaments"],
    }),
    updateTournamentActiveStatus: builder.mutation<
      BasicResType,
      { id: number; activeStatus: boolean }
    >({
      query: ({ id, activeStatus }) => ({
        url: `tournaments/${id}/status?active=${activeStatus}`,
        method: "PUT",
      }),
      invalidatesTags: ["tournaments"],
    }),

    concludeTournament: builder.mutation<BasicResType, { id: number }>({
      query: ({ id }) => ({
        url: `tournaments/${id}/conclude`,
        method: "PUT",
      }),
      invalidatesTags: ["tournaments"],
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

    getTournaments: builder.query<
      IoTournamentSummaryResType,
      {
        offSet: number;
        pageSize: number;
        sortedBy: string;
        sortDirection: "ASC" | "DESC";
      }
    >({
      query: ({ offSet, pageSize, sortedBy, sortDirection }) =>
        `tournaments?offSet=${offSet}&pageSize=${pageSize}&sortedBy=${sortedBy}&sortDirection=${sortDirection}`,
      providesTags: ["tournaments"],
    }),

    getTournamentParticipantsList: builder.query<
      NextTournamentResType,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) =>
        `tournament-participants/${tournamentId}/next-upcoming`,
      providesTags: ["tournaments"],
    }),

    addParticipationToTournament: builder.mutation<
      TournamentPlayerInfoType,
      {
        tournamentId: number;
        playerId: number;
        participationStatus: boolean;
        comments: string;
        tournamentParticipantId?: number;
      }
    >({
      query: ({
        tournamentId,
        playerId,
        participationStatus,
        comments,
        tournamentParticipantId,
      }) => ({
        url: `tournament-participants`,
        method: "POST",
        body: {
          tournamentId,
          playerId,
          participationStatus,
          comments,
          tournamentParticipantId,
        },
      }),
      invalidatesTags: ["tournaments"],
    }),
    getTournamentSummary: builder.query<
      TournamentSummeryResType,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `tournaments/details?tournamentId=${tournamentId}`,
        method: "GET",
      }),
      providesTags: ["tournaments"],
    }),
    getTournamentGoalKeeperList: builder.query<
      TournamentGoalKeeperInfoType,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) =>
        `tournament-participants/${tournamentId}/goal-keepers`,
      providesTags: ["tournaments"],
    }),
    getTournamentGoalkeeperHistoryList: builder.query<
      TournamentGoalKeeperHistoryInfoType,
      void
    >({
      query: () => ({
        url: `players/goal-keeper-history`,
        method: "GET",
      }),
      providesTags: ["tournaments"],
    }),
    getLatestTournamentWithUserStatus: builder.query<
      LatestTournamentWithUserStatusType,
      void
    >({
      query: () => ({
        url: `tournament-participants/latest/with-user-status`,
        method: "GET",
      }),
      providesTags: ["tournaments"],
    }),
    getTournamentSessions: builder.query<TournamentSessionsResType, void>({
      query: () => ({
        url: `tournaments/sessions`,
        method: "GET",
      }),
      providesTags: ["tournaments"],
    }),
    getTournamentsByYear: builder.query<
      TournamentListResType,
      { year: string }
    >({
      query: ({ year }) => ({
        url: `tournaments/list?year=${year}`,
        method: "GET",
      }),
      providesTags: ["tournaments"],
    }),
  }),
});

export const {
  useCreateTournamentMutation,
  useGetTournamentByIdQuery,
  useUpdateTournamentMutation,
  useGetTournamentsQuery,
  useUpdateTournamentActiveStatusMutation,
  useConcludeTournamentMutation,
  usePresignRoadmapImageUploadMutation,
  useGetTournamentParticipantsListQuery,
  useAddParticipationToTournamentMutation,
  useGetTournamentSummaryQuery,
  useGetTournamentGoalKeeperListQuery,
  useGetTournamentGoalkeeperHistoryListQuery,
  useGetLatestTournamentWithUserStatusQuery,
  useGetTournamentSessionsQuery,
  useGetTournamentsByYearQuery,
} = tournamentsApi;
