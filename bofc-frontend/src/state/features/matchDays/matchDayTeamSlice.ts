import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    PlayerListToAddToTeamType,
    MatchDayPlayerInfoType,
    MatchDayGuestListType,
    MatchDayGuestInfoType,
} from "./matchDayTypes";

// "matchDays" is also declared in matchDaysSlice.ts - declaring the same tag type again here is
// safe/idempotent (RTK Query merges tag-type declarations across every enhanceEndpoints call
// against the same base apiSlice) and is what lets a team/roster mutation invalidate
// getMatchDaySummary/getMatchDayById/getMatchDays too. Without this, those consumers (a second
// browser tab, the MatchDayViewer team-count badge, etc.) stayed on the pre-mutation roster
// until a manual page reload - SingleMatchDay.tsx/useMatchDayTeams.ts previously worked around
// this with a manual refetchMatchDay() call, which is a local patch, not a cache contract.
const apiWithTags = apiSlice.enhanceEndpoints({
    // "fixtures" is also declared in fixturesSlice.ts - generateTeamsByRank creates round-robin
    // matches alongside the teams it drafts, so its cache invalidation needs to reach that tag too.
    addTagTypes: ["matchDayTeam", "matchDays", "fixtures"],
});

export const matchDayTeamApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        createMatchDayTeam: builder.mutation<
            MatchDayPlayerInfoType,
            /** teamName omitted/blank - server assigns the next "Team {letter}" itself (COUNT at
             * insert time), rather than the client computing it from a possibly-stale team list -
             * see CreateTeamComponent.tsx. */
            { matchDayId: number; teamName?: string; logoKey?: string }
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
                /** Existing TeamPlayer row's id - when set, backend treats this as a
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

        /** Manual on-demand rank-based team draft - same snake-draft-by-rank logic the weekly
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

        /** Fills in a goalkeeper for every team on this MatchDay that doesn't already have one,
         * ranked by the club's fairness formula (owed slices from attendance minus turns served -
         * see TeamService.ComputeGoalkeeperBalancesAsync). Never overrides a team that already has
         * a goalkeeper assigned - it only fills gaps. */
        autoAssignGoalkeepers: builder.mutation<
            BasicResType & {
                content: {
                    teams: {
                        teamId: number;
                        teamName: string;
                        /** Every player newly assigned goalkeeper for this team this run - empty if none
                         * (already at/past the configured minimum, or no eligible players left). */
                        assigned: { playerId: number; playerName: string; isDefaultGoalkeeper: boolean }[];
                        skippedReason?: string | null;
                    }[];
                    pastMatchDaysMissingGoalkeeperData: number;
                    pastMatchDaysConsidered: number;
                };
            },
            { matchDayId: number }
        >({
            query: ({ matchDayId }) => ({
                url: `teams/matchday/${matchDayId}/auto-assign-goalkeepers`,
                method: "POST",
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        /** Read-only: the same per-team ranking auto-assign acts on (played/in goal/balance/status,
         * ranked, NEXT UP marked) - the club's "Whose turn in goal" table, shown before committing
         * to an assignment. */
        getGoalkeeperRanking: builder.query<
            BasicResType & {
                content: {
                    teams: {
                        teamId: number;
                        teamName: string;
                        players: {
                            rank: number;
                            playerId: number;
                            playerName: string;
                            played: number;
                            inGoal: number;
                            balance: number;
                            isDefaultGoalkeeper: boolean;
                            status: "NEXT_UP" | "ELIGIBLE" | "RESTING" | "CURRENT_GOALKEEPER";
                        }[];
                    }[];
                    pastMatchDaysConsidered: number;
                    pastMatchDaysMissingGoalkeeperData: number;
                };
            },
            { matchDayId: number }
        >({
            query: ({ matchDayId }) => `teams/matchday/${matchDayId}/goalkeeper-ranking`,
            providesTags: ["matchDayTeam"],
        }),

        /** Bulk-undo for autoAssignGoalkeepers - every team's current goalkeeper (if any) goes back
         * to UNASSIGNED, so the ranking can be re-run from a clean slate. */
        clearGoalkeepers: builder.mutation<
            BasicResType & {
                content: {
                    cleared: { teamId: number; teamName: string; playerId: number; playerName: string }[];
                };
            },
            { matchDayId: number }
        >({
            query: ({ matchDayId }) => ({
                url: `teams/matchday/${matchDayId}/clear-goalkeepers`,
                method: "POST",
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        /** "Declare Teams" button - manual only, emails every confirmed participant the line-ups
         * and the schedule as two inline images. Never fired automatically off generation: teams
         * are generated hours before kickoff and routinely adjusted afterwards, so an automatic
         * send would announce a draft roster to the whole club.
         *
         * The images are base64 PNG data URLs produced in the browser - the layout only exists as
         * React components, so rendering them server-side would mean maintaining the design twice.
         * Passing testEmail diverts the identical mail to that one address and skips the in-app
         * notifications. */
        declareTeams: builder.mutation<
            BasicResType & { content: { sent: number; failed: number; isTest: boolean; errorMessage?: string | null } },
            { matchDayId: number; teamsImageBase64: string; scheduleImageBase64: string; testEmail?: string }
        >({
            query: ({ matchDayId, ...body }) => ({
                url: `teams/matchday/${matchDayId}/declare-teams`,
                method: "POST",
                body,
            }),
        }),

        /** Every guest player on this MatchDay, assigned and unassigned alike. Guests are names
         * only - no player profile, no participation record, nothing in statistics - so they come
         * from their own endpoint rather than the participant list the Unassigned Pool is built
         * from. Callers split them on teamId (null = still in the pool). */
        matchDayGuests: builder.query<MatchDayGuestListType, { matchDayId: number }>({
            query: ({ matchDayId }) => `match-day-guests/matchday/${matchDayId}`,
            providesTags: ["matchDayTeam"],
        }),

        addMatchDayGuest: builder.mutation<
            BasicResType & { content: MatchDayGuestInfoType },
            { matchDayId: number; name: string }
        >({
            query: ({ matchDayId, name }) => ({
                url: `match-day-guests`,
                method: "POST",
                body: { matchDayId, name },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        /** Drag-and-drop between the Unassigned Pool and a team card. teamId null sends the
         * guest back to the pool. */
        assignMatchDayGuestToTeam: builder.mutation<
            BasicResType & { content: MatchDayGuestInfoType },
            { guestId: number; teamId: number | null }
        >({
            query: ({ guestId, teamId }) => ({
                url: `match-day-guests/${guestId}/team`,
                method: "PUT",
                body: { teamId },
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        deleteMatchDayGuest: builder.mutation<BasicResType, { guestId: number }>({
            query: ({ guestId }) => ({
                url: `match-day-guests/${guestId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["matchDayTeam", "matchDays"],
        }),

        /** "Send Match Day Reminder" button - manual only, triggers the exact same reminder email
         * the hourly scheduler sends automatically, right now, for just this MatchDay. */
        sendMatchDayReminderEmail: builder.mutation<BasicResType & { content: { sent: number } }, { matchDayId: number }>({
            query: ({ matchDayId }) => ({
                url: `teams/matchday/${matchDayId}/send-reminder-email`,
                method: "POST",
            }),
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
    useAutoAssignGoalkeepersMutation,
    useLazyGetGoalkeeperRankingQuery,
    useClearGoalkeepersMutation,
    useDeclareTeamsMutation,
    useSendMatchDayReminderEmailMutation,
    useMatchDayGuestsQuery,
    useAddMatchDayGuestMutation,
    useAssignMatchDayGuestToTeamMutation,
    useDeleteMatchDayGuestMutation,
} = matchDayTeamApi;
