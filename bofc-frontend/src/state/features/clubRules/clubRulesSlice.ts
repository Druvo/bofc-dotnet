import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["ClubRules"],
});

export interface IClubRules {
    id?: number;
    description: string;
}

export interface ClubRulesRes extends BasicResType {
    content: IClubRules[];
}

export interface SingleClubRulesRes extends BasicResType {
    content: {
        id: number;
        description: string;
    };
}

export const clubRulesApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getClubRules: builder.query<ClubRulesRes, void>({
            query: () => ({
                url: "club-rules",
                method: "GET",
            }),
            providesTags: ["ClubRules"],
        }),
        createClubRules: builder.mutation<BasicResType, IClubRules>({
            query: (data) => ({
                url: "club-rules",
                method: "POST",
                body: {
                    description: data.description,
                },
            }),
            invalidatesTags: ["ClubRules"],
        }),
        updateClubRules: builder.mutation<BasicResType, IClubRules>({
            query: (data) => ({
                url: `club-rules/${data.id}`,
                method: "PUT",
                body: {
                    description: data.description,
                },
            }),
            invalidatesTags: ["ClubRules"],
        }),
        getSingleClubRules: builder.query<SingleClubRulesRes, number>({
            query: (id) => ({
                url: `club-rules/${id}`,
                method: "GET",
            }),
            providesTags: ["ClubRules"],
        }),
    }),
});

export const {
    useGetClubRulesQuery,
    useCreateClubRulesMutation,
    useUpdateClubRulesMutation,
    useGetSingleClubRulesQuery,
} = clubRulesApi;
