import IPlayer from "../../../interfaces/IPlayer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["auth"],
});

export interface LoginResType extends BasicResType {
    content: {
        token: string;
        username: string;
        email: string;
        userId: string;
        roles: string[];
        resetPassword?: boolean;
    };
}

export interface PlayerProfileResType extends BasicResType {
    content: IPlayer;
}

export const tournamentsApi = apiWithTags.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<
            LoginResType,
            {
                email: string;
                password: string;
            }
        >({
            query: (data) => ({
                url: "auth/login",
                method: "POST",
                body: data,
            }),
        }),
        changePassword: build.mutation<BasicResType, any>({
            query: (data) => ({
                url: "auth/change-password",
                method: "PUT",
                body: data,
            }),
        }),
        // Mandatory first-login/expired-password reset — no oldPassword, unlike
        // changePassword above (that one's for the voluntary profile/settings flow).
        forcePasswordReset: build.mutation<BasicResType, { newPassword: string }>({
            query: (data) => ({
                url: "auth/force-password-reset",
                method: "PUT",
                body: data,
            }),
        }),
        getUserProfile: build.query<
            PlayerProfileResType,
            {
                id: string;
            }
        >({
            query: ({ id }) => `/players/${id}`,
            providesTags: ["auth"],
        }),
        updatePlayerData: build.mutation<
            BasicResType,
            {
                id: number;
                data: {
                    name: string;
                    email: string;
                    mobileNo: string;
                    teamsId: string;
                    playerPosition?: string;
                    employeeId: string;
                    playingPosition?: string;
                    profilePhoto?: string;
                    jerseyNumber?: number;
                };
            }
        >({
            query: ({ id, data }) => ({
                url: `players/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        resetPlayerPassword: build.mutation<BasicResType, {
            email: string,
            newPassword: string
        }>({  
            query: (
                { email, newPassword }
            ) => ({
                url: "auth/reset-password",
                method: "PUT",
                body: { email, newPassword },
            }),
        })
    }),
});

export const {
    useLoginMutation,
    useChangePasswordMutation,
    useForcePasswordResetMutation,
    useGetUserProfileQuery,
    useUpdatePlayerDataMutation,
    useResetPlayerPasswordMutation
} = tournamentsApi;
