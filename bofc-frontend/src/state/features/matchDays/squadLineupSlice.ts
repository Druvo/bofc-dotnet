import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

export interface ILineupPlayer {
  playerId: number;
  playerName: string;
  playingPosition: string;
  availability: "FIT" | "DOUBTFUL" | "INJURED";
  isCaptain?: boolean;
  photoKey?: string;
  photoUrl?: string;
}

export interface ITeamLineup {
  teamId: number;
  squadSize: number | null;
  formation: string | null;
  starters: ILineupPlayer[];
  bench: ILineupPlayer[];
}

export interface IGetTeamLineupResponse extends BasicResType {
  content: ITeamLineup;
}

export interface IUpdateTeamLineupRequest {
  teamId: number;
  squadSize: number;
  formation: string;
  starters: Array<{ playerId: number; availability: string }>;
  bench: Array<{ playerId: number; availability: string }>;
}

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["squadLineup"],
});

export const squadLineupApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getTeamLineup: builder.query<IGetTeamLineupResponse, { teamId: number }>({
      query: ({ teamId }) => ({
        url: `teams/${teamId}/lineup`,
        method: "GET",
      }),
      providesTags: (result, error, { teamId }) => [{ type: "squadLineup", id: teamId }],
    }),

    updateTeamLineup: builder.mutation<IGetTeamLineupResponse, IUpdateTeamLineupRequest>({
      query: ({ teamId, ...body }) => ({
        url: `teams/${teamId}/lineup`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { teamId }) => [{ type: "squadLineup", id: teamId }],
    }),
  }),
});

export const { useGetTeamLineupQuery, useUpdateTeamLineupMutation } = squadLineupApi;
