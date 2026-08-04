import apiSlice from "../../api/apiSlice";
import { AllVenueResType } from "./vanuesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["global"],
});

export const commonApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getVanues: builder.query<AllVenueResType, void>({
            query: () => ({
                url: "venues",
                method: "GET",
            }),
            providesTags: ["global"],
        }),
        createVenue: builder.mutation({
            query: (newVenue) => ({
                url: "venues",
                method: "POST",
                body: newVenue,
            }),
            invalidatesTags: ["global"],
        }),
        updateVenue: builder.mutation({
            query: ({ id, ...updatedVenue }) => ({
                url: `venues/${id}`,
                method: "PUT",
                body: updatedVenue,
            }),
            invalidatesTags: ["global"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetVanuesQuery,
    useCreateVenueMutation,
    useUpdateVenueMutation,
} = commonApi;
