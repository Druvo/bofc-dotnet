import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    PlayerListToAddToTeamType,
    MatchDayPlayerInfoType,
} from "./matchDayTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["matchDayTeam"],
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
            invalidatesTags: ["matchDayTeam"],
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
            invalidatesTags: ["matchDayTeam"],
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
            invalidatesTags: ["matchDayTeam"],
        }),

        deleteMatchDayTeam: builder.mutation<
            BasicResType,
            { teamId: number }
        >({
            query: ({ teamId }) => ({
                url: `teams/${teamId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["matchDayTeam"],
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
            invalidatesTags: ["matchDayTeam"],
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
            invalidatesTags: ["matchDayTeam"],
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
            invalidatesTags: ["matchDayTeam"],
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
} = matchDayTeamApi;
