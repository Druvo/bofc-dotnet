import IFootballPosition from "../../../interfaces/IFootballPosition";
import IPlayer from "../../../interfaces/IPlayer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["player"],
});

export interface PlayerList extends BasicResType {
    content: IPlayer[];
}

export interface PlayerPositions extends BasicResType {
    content: IFootballPosition[];
}

export interface GoalkeepingHistoryRecord {
    playerId: number;
    playerName: string;
    roundNumber: number;
    playedDate: string;
}

export interface PlayerGoalkeepingHistoryResType extends BasicResType {
    content: GoalkeepingHistoryRecord[];
}

export interface PlayerPhotoPresignResponse extends BasicResType {
    content: {
        key: string;
        url: string;
        uploadUrl: string;
        expiresInSeconds: number;
    };
}

export interface PlayerRankListItem {
    playerId: number;
    name: string;
    photoUrl?: string | null;
    jerseyNumber?: number | null;
    isActive: boolean;
    /** Null = not ranked yet. */
    rank?: number | null;
}

export interface PlayerRankListResType extends BasicResType {
    content: PlayerRankListItem[];
}

export const playerApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getPlayers: builder.query<PlayerList, void>({
            query: () => "players",
            providesTags: ["player"],
        }),

        getPlayerPositions: builder.query<PlayerPositions, void>({
            query: () => "football-positions",
        }),

        getPlayerGoalkeepingHistory: builder.query<PlayerGoalkeepingHistoryResType, { playerId: number }>({
            query: ({ playerId }) => `players/${playerId}/goalkeeping-history`,
            providesTags: ["player"],
        }),

        getMyGoalkeepingHistory: builder.query<PlayerGoalkeepingHistoryResType, void>({
            query: () => "players/goalkeeping-history",
            providesTags: ["player"],
        }),

        presignPlayerPhotoUpload: builder.mutation<PlayerPhotoPresignResponse, { fileName: string; contentType: string }>({
            query: ({ fileName, contentType }) => ({
                url: `files/player-photos/presign?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}`,
                method: "POST",
            }),
        }),

        getPlayerRanks: builder.query<PlayerRankListResType, void>({
            query: () => "players/ranks",
            providesTags: ["player"],
        }),

        // Board owns its own optimistic local state (see PlayerRankBoard) — no invalidatesTags,
        // an in-flight getPlayerRanks refetch would otherwise clobber a drag that hasn't saved yet.
        setPlayerRank: builder.mutation<BasicResType, { playerId: number; rank: number | null }>({
            query: ({ playerId, rank }) => ({
                url: `players/${playerId}/rank`,
                method: "PUT",
                body: { rank },
            }),
        }),
    }),
});

export const {
    useGetPlayersQuery,
    useGetPlayerPositionsQuery,
    useGetPlayerGoalkeepingHistoryQuery,
    useGetMyGoalkeepingHistoryQuery,
    usePresignPlayerPhotoUploadMutation,
    useGetPlayerRanksQuery,
    useSetPlayerRankMutation,
} = playerApi;
