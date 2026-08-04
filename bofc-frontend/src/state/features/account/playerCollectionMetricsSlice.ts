import IPlayerCollectionMetrics from "../../../interfaces/IPlayerCollectionMetrics";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["playerCollectionMetrics"],
});

export interface PlayerCollectionMetricsResType extends BasicResType {
  content: IPlayerCollectionMetrics;
}

export const playerCollectionMetricsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getPlayerCollectionMetrics: builder.query<PlayerCollectionMetricsResType, { year?: number } | void>({
      query: (params) => ({
        url: `/ac/reports/player-collection-metrics`,
        method: "GET",
        params: params?.year ? { year: params.year } : undefined,
      }),
      providesTags: ["playerCollectionMetrics"],
    }),
  }),
});

export const { useGetPlayerCollectionMetricsQuery } = playerCollectionMetricsApi;

export default playerCollectionMetricsApi;
