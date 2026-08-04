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
    }),
});

export const {
    useGetPlayersQuery,
    useGetPlayerPositionsQuery,
    useGetPlayerGoalkeepingHistoryQuery,
    useGetMyGoalkeepingHistoryQuery,
    usePresignPlayerPhotoUploadMutation,
} = playerApi;
