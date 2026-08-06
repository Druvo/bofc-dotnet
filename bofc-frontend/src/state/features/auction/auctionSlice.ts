import apiSlice from "../../api/apiSlice";
import {
  AuctionSettingsRequest,
  AuctionSettingsResponse,
  AuctionRegistrationRequest,
  AuctionRegistrationResponse,
  AuctionPlayerRequest,
  AuctionPlayerResponse,
  ApproveAndPoolRequest,
  TeamBudgetRequest,
  TeamBudgetResponse,
  BidRequest,
  BidResponse,
  AuctionSessionResponse,
  AuctionDashboardResponse,
  AuctionResultResponse,
} from "./auctionTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["auctionSettings", "auctionRegistrations", "auctionPlayers", "teamBudgets", "auctionSession", "auctionDashboard", "auctionResults", "auctionBids"],
});

export const auctionApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    // === Settings ===
    getAuctionSettings: builder.query<AuctionSettingsResponse, number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/settings`,
      providesTags: ["auctionSettings"],
    }),
    createAuctionSettings: builder.mutation<AuctionSettingsResponse, { matchDayId: number; body: AuctionSettingsRequest }>({
      query: ({ matchDayId, body }) => ({
        url: `match-days/${matchDayId}/auction/settings`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionSettings"],
    }),
    updateAuctionSettings: builder.mutation<AuctionSettingsResponse, { matchDayId: number; body: AuctionSettingsRequest }>({
      query: ({ matchDayId, body }) => ({
        url: `match-days/${matchDayId}/auction/settings`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["auctionSettings"],
    }),

    // === Registration ===
    registerForAuction: builder.mutation<AuctionRegistrationResponse, AuctionRegistrationRequest>({
      query: (body) => ({
        url: `auction/match-days/${body.matchDayId}/register`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionRegistrations"],
    }),
    quickRegisterForAuction: builder.mutation<AuctionRegistrationResponse, number>({
      query: (matchDayId) => ({
        url: `auction/match-days/${matchDayId}/quick-register`,
        method: "POST",
      }),
      invalidatesTags: ["auctionRegistrations"],
    }),
    getAuctionRegistrations: builder.query<AuctionRegistrationResponse[], { matchDayId?: number; status?: string }>({
      query: ({ matchDayId, status }) => {
        const params = new URLSearchParams();
        if (matchDayId) params.append("matchDayId", String(matchDayId));
        if (status) params.append("status", status);
        return `auction/registrations?${params.toString()}`;
      },
      providesTags: ["auctionRegistrations"],
    }),
    approveRegistration: builder.mutation<AuctionRegistrationResponse, number>({
      query: (id) => ({
        url: `auction/registrations/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["auctionRegistrations", "auctionPlayers"],
    }),
    rejectRegistration: builder.mutation<AuctionRegistrationResponse, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `auction/registrations/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["auctionRegistrations"],
    }),
    undoRejectRegistration: builder.mutation<AuctionRegistrationResponse, number>({
      query: (id) => ({
        url: `auction/registrations/${id}/undo-reject`,
        method: "POST",
      }),
      invalidatesTags: ["auctionRegistrations"],
    }),
    approveAndAddToPool: builder.mutation<AuctionRegistrationResponse, { id: number; body: ApproveAndPoolRequest }>({
      query: ({ id, body }) => ({
        url: `auction/registrations/${id}/approve-and-pool`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionRegistrations", "auctionPlayers"],
    }),

    // === Player Pool ===
    getAuctionPlayers: builder.query<AuctionPlayerResponse[], number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/players`,
      providesTags: ["auctionPlayers"],
    }),
    addExistingPlayer: builder.mutation<AuctionPlayerResponse, { matchDayId: number; body: AuctionPlayerRequest }>({
      query: ({ matchDayId, body }) => ({
        url: `match-days/${matchDayId}/auction/players/add-existing`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionPlayers"],
    }),
    addFromRegistration: builder.mutation<AuctionPlayerResponse, { matchDayId: number; registrationId: number; body: AuctionPlayerRequest }>({
      query: ({ matchDayId, registrationId, body }) => ({
        url: `match-days/${matchDayId}/auction/players/add-from-registration/${registrationId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionPlayers", "auctionRegistrations"],
    }),
    updateAuctionPlayer: builder.mutation<AuctionPlayerResponse, { matchDayId: number; auctionPlayerId: number; body: AuctionPlayerRequest }>({
      query: ({ matchDayId, auctionPlayerId, body }) => ({
        url: `match-days/${matchDayId}/auction/players/${auctionPlayerId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["auctionPlayers"],
    }),
    removeAuctionPlayer: builder.mutation<void, { matchDayId: number; auctionPlayerId: number }>({
      query: ({ matchDayId, auctionPlayerId }) => ({
        url: `match-days/${matchDayId}/auction/players/${auctionPlayerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["auctionPlayers"],
    }),
    restoreAuctionPlayer: builder.mutation<AuctionPlayerResponse, { matchDayId: number; auctionPlayerId: number }>({
      query: ({ matchDayId, auctionPlayerId }) => ({
        url: `match-days/${matchDayId}/auction/players/${auctionPlayerId}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["auctionPlayers", "auctionRegistrations"],
    }),

    // === Team Budgets ===
    getTeamBudgets: builder.query<TeamBudgetResponse[], number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/team-budgets`,
      providesTags: ["teamBudgets"],
    }),
    getAvailableTeams: builder.query<{ teamId: number; teamName: string }[], number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/team-budgets/available-teams`,
      providesTags: ["teamBudgets"],
    }),
    createTeamForAuction: builder.mutation<{ teamId: number; teamName: string }, { matchDayId: number; teamName: string }>({
      query: ({ matchDayId, teamName }) => ({
        url: `match-days/${matchDayId}/auction/team-budgets/create-team`,
        method: "POST",
        body: { teamName, matchDayId },
      }),
      invalidatesTags: ["teamBudgets"],
    }),
    createTeamBudget: builder.mutation<TeamBudgetResponse, { matchDayId: number; body: TeamBudgetRequest }>({
      query: ({ matchDayId, body }) => ({
        url: `match-days/${matchDayId}/auction/team-budgets`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["teamBudgets"],
    }),
    updateTeamBudget: builder.mutation<TeamBudgetResponse, { matchDayId: number; id: number; body: TeamBudgetRequest }>({
      query: ({ matchDayId, id, body }) => ({
        url: `match-days/${matchDayId}/auction/team-budgets/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["teamBudgets"],
    }),

    deleteTeamBudget: builder.mutation<void, { matchDayId: number; id: number }>({
      query: ({ matchDayId, id }) => ({
        url: `match-days/${matchDayId}/auction/team-budgets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["teamBudgets"],
    }),

    // === Session Control ===
    getAuctionSession: builder.query<AuctionSessionResponse, number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/session`,
      providesTags: ["auctionSession"],
    }),
    startAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/start`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    pauseAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/pause`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard"],
    }),
    resumeAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/resume`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard"],
    }),
    endAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/end`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionResults"],
    }),
    nextPlayer: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/next-player`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    nextPlayerRandom: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/next-player/random`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    skipPlayer: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/skip-player`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    markSold: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/mark-sold`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers", "teamBudgets"],
    }),
    markUnsold: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/mark-unsold`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    undoLastSale: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/undo-last-sale`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers", "teamBudgets"],
    }),
    startUnsoldRound: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/start-unsold-round`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    restartBidding: builder.mutation<AuctionSessionResponse, number>({
      query: (matchDayId) => ({
        url: `match-days/${matchDayId}/auction/session/restart-bidding`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard"],
    }),
    selectPlayerForAuction: builder.mutation<AuctionSessionResponse, { matchDayId: number; playerId: number }>({
      query: ({ matchDayId, playerId }) => ({
        url: `match-days/${matchDayId}/auction/session/select-player/${playerId}`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),

    // === Bidding ===
    placeBid: builder.mutation<BidResponse, { matchDayId: number; body: BidRequest }>({
      query: ({ matchDayId, body }) => ({
        url: `match-days/${matchDayId}/auction/bids`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionBids"],
    }),
    getBidsForPlayer: builder.query<BidResponse[], { matchDayId: number; auctionPlayerId: number }>({
      query: ({ matchDayId, auctionPlayerId }) => `match-days/${matchDayId}/auction/players/${auctionPlayerId}/bids`,
      providesTags: ["auctionBids"],
    }),

    // === Dashboard & Results ===
    getAuctionDashboard: builder.query<AuctionDashboardResponse, number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/dashboard`,
      providesTags: ["auctionDashboard"],
    }),
    getAuctionResults: builder.query<AuctionResultResponse, number>({
      query: (matchDayId) => `match-days/${matchDayId}/auction/results`,
      providesTags: ["auctionResults"],
    }),
  }),
});

export const {
  useGetAuctionSettingsQuery,
  useCreateAuctionSettingsMutation,
  useUpdateAuctionSettingsMutation,
  useRegisterForAuctionMutation,
  useQuickRegisterForAuctionMutation,
  useGetAuctionRegistrationsQuery,
  useApproveRegistrationMutation,
  useRejectRegistrationMutation,
  useUndoRejectRegistrationMutation,
  useApproveAndAddToPoolMutation,
  useGetAuctionPlayersQuery,
  useAddExistingPlayerMutation,
  useAddFromRegistrationMutation,
  useUpdateAuctionPlayerMutation,
  useRemoveAuctionPlayerMutation,
  useRestoreAuctionPlayerMutation,
  useGetTeamBudgetsQuery,
  useGetAvailableTeamsQuery,
  useCreateTeamForAuctionMutation,
  useCreateTeamBudgetMutation,
  useUpdateTeamBudgetMutation,
  useDeleteTeamBudgetMutation,
  useGetAuctionSessionQuery,
  useStartAuctionMutation,
  usePauseAuctionMutation,
  useResumeAuctionMutation,
  useEndAuctionMutation,
  useNextPlayerMutation,
  useNextPlayerRandomMutation,
  useSkipPlayerMutation,
  useMarkSoldMutation,
  useMarkUnsoldMutation,
  useUndoLastSaleMutation,
  useStartUnsoldRoundMutation,
  useRestartBiddingMutation,
  useSelectPlayerForAuctionMutation,
  usePlaceBidMutation,
  useGetBidsForPlayerQuery,
  useGetAuctionDashboardQuery,
  useGetAuctionResultsQuery,
} = auctionApi;
