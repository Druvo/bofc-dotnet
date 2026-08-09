import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    PlayerListToAddToTeamType,
    MatchDayPlayerInfoType,
} from "./matchDayTypes";

// "matchDays" is also declared in matchDaysSlice.ts — declaring the same tag type again here is
// safe/idempotent (RTK Query merges tag-type declarations across every enhanceEndpoints call
// against the same base apiSlice) and is what lets a team/roster mutation invalidate
// getMatchDaySummary/getMatchDayById/getMatchDays too. Without this, those consumers (a second
// browser tab, the MatchDayViewer team-count badge, etc.) stayed on the pre-mutation roster
// until a manual page reload — SingleMatchDay.tsx/useMatchDayTeams.ts previously worked around
// this with a manual refetchMatchDay() call, which is a local patch, not a cache contract.
const apiWithTags = apiSlice.enhanceEndpoints({
    // "fixtures" is also declared in fixturesSlice.ts — generateTeamsByRank creates round-robin
    // matches alongside the teams it drafts, so its cache invalidation needs to reach that tag too.
    addTagTypes: ["matchDayTeam", "matchDays", "fixtures"],
});

export const matchDayTeamApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        createMatchDayTeam: builder.mutation<
            MatchDayPlayerInfoType,
            { matchDayId: number; teamName: string; logoKey?: string }
        >({
            query: ({ matchDayId, teamName, logoKey }) => ({
                url: `teams`,
                method: "POST",
                body: { matchDayId, teamName, logoKey },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        renameTeam: builder.mutation<
            BasicResType,
            { teamId: number; teamName: string; matchDayId: number; logoKey?: string }
        >({
            query: ({ teamId, teamName, matchDayId, logoKey }) => ({
                url: `teams`,
                method: "POST",
                body: { id: teamId, teamName, matchDayId, logoKey },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        presignTeamLogoUpload: builder.mutation<
            BasicResType & { content: { key: string; url: string; uploadUrl: string; expiresInSeconds: number } },
            { fileName: string; contentType: string }
        >({
            query: ({ fileName, contentType }) => ({
                url: `files/team-logos/presign`,
                method: "POST",
                params: { fileName, contentType },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        deleteMatchDayTeam: builder.mutation<
            BasicResType,
            { teamId: number }
        >({
            query: ({ teamId }) => ({
                url: `teams/${teamId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        playerListToAddToTeam: builder.query<
            PlayerListToAddToTeamType,
            { matchDayId: number }
        >({
            query: ({ matchDayId }) => ({
                url: `match-day-participants/${matchDayId}/to-be-selected`,
                method: "GET",
            }),
            providesTags: ["matchDayTeam"],
        }),

        addPlayerToTeam: builder.mutation<
            BasicResType,
            {
                playingPosition: string;
                teamId: number;
                playerId: number;
                isCaptain?: boolean;
                teamPlayerRole?: string;
                jerseyNumber?: number;
                /** Existing TeamPlayer row's id — when set, backend treats this as a
                 * reassignment (moving between teams) instead of a fresh add, since
                 * a player can only ever have one TeamPlayer row per matchDay. */
                id?: number;
            }
        >({
            query: ({ playingPosition, teamId, playerId, isCaptain = false, teamPlayerRole = "PLAYER", jerseyNumber, id }) => {
                const body: any = {
                    playerId,
                    teamId,
                    playingPosition,
                    isCaptain,
                    teamPlayerRole,
                };

                // Only include jerseyNumber if it's provided
                if (jerseyNumber !== undefined && jerseyNumber !== null) {
                    body.jerseyNumber = jerseyNumber;
                }

                if (id !== undefined && id !== null) {
                    body.id = id;
                }

                return {
                    url: `teams/players`,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        updatePlayerInTeam: builder.mutation<
            BasicResType,
            {
                playingPosition: string;
                teamId: number;
                playerId: number;
                isCaptain?: boolean;
                teamPlayerRole?: string;
                jerseyNumber?: number;
            }
        >({
            query: ({ playingPosition, teamId, playerId, isCaptain = false, teamPlayerRole = "PLAYER", jerseyNumber }) => {
                const body: any = {
                    playerId,
                    teamId,
                    playingPosition,
                    isCaptain,
                    teamPlayerRole,
                };

                // Only include jerseyNumber if it's provided
                if (jerseyNumber !== undefined && jerseyNumber !== null) {
                    body.jerseyNumber = jerseyNumber;
                }

                return {
                    url: `teams/players`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),
        removePlayerFromTeam: builder.mutation<
            BasicResType,
            { teamId: number; playerId: number }
        >({
            query: ({ teamId, playerId }) => ({
                url: `teams/players`,
                method: "DELETE",
                body: { teamId, playerId },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        /** Manual on-demand rank-based team draft — same snake-draft-by-rank logic the weekly
         * scheduler uses, admin-triggered with a max-players-per-team cap. The number of teams
         * is derived from confirmed participant turnout, not chosen directly. Only succeeds when
         * the MatchDay has zero teams yet (see TeamController.GenerateTeamsByRank). */
        generateTeamsByRank: builder.mutation<
            BasicResType & { content: { success: boolean; reason?: string | null } },
            { matchDayId: number; maxPlayersPerTeam: number }
        >({
            query: ({ matchDayId, maxPlayersPerTeam }) => ({
                url: `teams/matchday/${matchDayId}/generate`,
                method: "POST",
                params: { maxPlayersPerTeam },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays", "fixtures"],
        }),
    }),
});

export const {
    useCreateMatchDayTeamMutation,
    useRenameTeamMutation,
    usePresignTeamLogoUploadMutation,
    usePlayerListToAddToTeamQuery,
    useDeleteMatchDayTeamMutation,
    useAddPlayerToTeamMutation,
    useUpdatePlayerInTeamMutation,
    useRemovePlayerFromTeamMutation,
    useGenerateTeamsByRankMutation,
} = matchDayTeamApi;
