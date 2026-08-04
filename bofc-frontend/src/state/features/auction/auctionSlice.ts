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
      query: (tournamentId) => `tournaments/${tournamentId}/auction/settings`,
      providesTags: ["auctionSettings"],
    }),
    createAuctionSettings: builder.mutation<AuctionSettingsResponse, { tournamentId: number; body: AuctionSettingsRequest }>({
      query: ({ tournamentId, body }) => ({
        url: `tournaments/${tournamentId}/auction/settings`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionSettings"],
    }),
    updateAuctionSettings: builder.mutation<AuctionSettingsResponse, { tournamentId: number; body: AuctionSettingsRequest }>({
      query: ({ tournamentId, body }) => ({
        url: `tournaments/${tournamentId}/auction/settings`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["auctionSettings"],
    }),

    // === Registration ===
    registerForAuction: builder.mutation<AuctionRegistrationResponse, AuctionRegistrationRequest>({
      query: (body) => ({
        url: `auction/tournaments/${body.tournamentId}/register`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionRegistrations"],
    }),
    quickRegisterForAuction: builder.mutation<AuctionRegistrationResponse, number>({
      query: (tournamentId) => ({
        url: `auction/tournaments/${tournamentId}/quick-register`,
        method: "POST",
      }),
      invalidatesTags: ["auctionRegistrations"],
    }),
    getAuctionRegistrations: builder.query<AuctionRegistrationResponse[], { tournamentId?: number; status?: string }>({
      query: ({ tournamentId, status }) => {
        const params = new URLSearchParams();
        if (tournamentId) params.append("tournamentId", String(tournamentId));
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
      query: (tournamentId) => `tournaments/${tournamentId}/auction/players`,
      providesTags: ["auctionPlayers"],
    }),
    addExistingPlayer: builder.mutation<AuctionPlayerResponse, { tournamentId: number; body: AuctionPlayerRequest }>({
      query: ({ tournamentId, body }) => ({
        url: `tournaments/${tournamentId}/auction/players/add-existing`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionPlayers"],
    }),
    addFromRegistration: builder.mutation<AuctionPlayerResponse, { tournamentId: number; registrationId: number; body: AuctionPlayerRequest }>({
      query: ({ tournamentId, registrationId, body }) => ({
        url: `tournaments/${tournamentId}/auction/players/add-from-registration/${registrationId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionPlayers", "auctionRegistrations"],
    }),
    updateAuctionPlayer: builder.mutation<AuctionPlayerResponse, { tournamentId: number; auctionPlayerId: number; body: AuctionPlayerRequest }>({
      query: ({ tournamentId, auctionPlayerId, body }) => ({
        url: `tournaments/${tournamentId}/auction/players/${auctionPlayerId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["auctionPlayers"],
    }),
    removeAuctionPlayer: builder.mutation<void, { tournamentId: number; auctionPlayerId: number }>({
      query: ({ tournamentId, auctionPlayerId }) => ({
        url: `tournaments/${tournamentId}/auction/players/${auctionPlayerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["auctionPlayers"],
    }),
    restoreAuctionPlayer: builder.mutation<AuctionPlayerResponse, { tournamentId: number; auctionPlayerId: number }>({
      query: ({ tournamentId, auctionPlayerId }) => ({
        url: `tournaments/${tournamentId}/auction/players/${auctionPlayerId}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["auctionPlayers", "auctionRegistrations"],
    }),

    // === Team Budgets ===
    getTeamBudgets: builder.query<TeamBudgetResponse[], number>({
      query: (tournamentId) => `tournaments/${tournamentId}/auction/team-budgets`,
      providesTags: ["teamBudgets"],
    }),
    getAvailableTeams: builder.query<{ teamId: number; teamName: string }[], number>({
      query: (tournamentId) => `tournaments/${tournamentId}/auction/team-budgets/available-teams`,
      providesTags: ["teamBudgets"],
    }),
    createTeamForAuction: builder.mutation<{ teamId: number; teamName: string }, { tournamentId: number; teamName: string }>({
      query: ({ tournamentId, teamName }) => ({
        url: `tournaments/${tournamentId}/auction/team-budgets/create-team`,
        method: "POST",
        body: { teamName, tournamentId },
      }),
      invalidatesTags: ["teamBudgets"],
    }),
    createTeamBudget: builder.mutation<TeamBudgetResponse, { tournamentId: number; body: TeamBudgetRequest }>({
      query: ({ tournamentId, body }) => ({
        url: `tournaments/${tournamentId}/auction/team-budgets`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["teamBudgets"],
    }),
    updateTeamBudget: builder.mutation<TeamBudgetResponse, { tournamentId: number; id: number; body: TeamBudgetRequest }>({
      query: ({ tournamentId, id, body }) => ({
        url: `tournaments/${tournamentId}/auction/team-budgets/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["teamBudgets"],
    }),

    deleteTeamBudget: builder.mutation<void, { tournamentId: number; id: number }>({
      query: ({ tournamentId, id }) => ({
        url: `tournaments/${tournamentId}/auction/team-budgets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["teamBudgets"],
    }),

    // === Session Control ===
    getAuctionSession: builder.query<AuctionSessionResponse, number>({
      query: (tournamentId) => `tournaments/${tournamentId}/auction/session`,
      providesTags: ["auctionSession"],
    }),
    startAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/start`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    pauseAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/pause`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard"],
    }),
    resumeAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/resume`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard"],
    }),
    endAuction: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/end`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionResults"],
    }),
    nextPlayer: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/next-player`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    nextPlayerRandom: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/next-player/random`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    skipPlayer: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/skip-player`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    markSold: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/mark-sold`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers", "teamBudgets"],
    }),
    markUnsold: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/mark-unsold`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    undoLastSale: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/undo-last-sale`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers", "teamBudgets"],
    }),
    startUnsoldRound: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/start-unsold-round`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),
    restartBidding: builder.mutation<AuctionSessionResponse, number>({
      query: (tournamentId) => ({
        url: `tournaments/${tournamentId}/auction/session/restart-bidding`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard"],
    }),
    selectPlayerForAuction: builder.mutation<AuctionSessionResponse, { tournamentId: number; playerId: number }>({
      query: ({ tournamentId, playerId }) => ({
        url: `tournaments/${tournamentId}/auction/session/select-player/${playerId}`,
        method: "POST",
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionPlayers"],
    }),

    // === Bidding ===
    placeBid: builder.mutation<BidResponse, { tournamentId: number; body: BidRequest }>({
      query: ({ tournamentId, body }) => ({
        url: `tournaments/${tournamentId}/auction/bids`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["auctionSession", "auctionDashboard", "auctionBids"],
    }),
    getBidsForPlayer: builder.query<BidResponse[], { tournamentId: number; auctionPlayerId: number }>({
      query: ({ tournamentId, auctionPlayerId }) => `tournaments/${tournamentId}/auction/players/${auctionPlayerId}/bids`,
      providesTags: ["auctionBids"],
    }),

    // === Dashboard & Results ===
    getAuctionDashboard: builder.query<AuctionDashboardResponse, number>({
      query: (tournamentId) => `tournaments/${tournamentId}/auction/dashboard`,
      providesTags: ["auctionDashboard"],
    }),
    getAuctionResults: builder.query<AuctionResultResponse, number>({
      query: (tournamentId) => `tournaments/${tournamentId}/auction/results`,
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
