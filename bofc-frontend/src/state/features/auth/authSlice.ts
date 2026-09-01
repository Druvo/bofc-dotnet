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

export const authApi = apiWithTags.injectEndpoints({
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
        // Mandatory first-login/expired-password reset - no oldPassword, unlike
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
        }),
        // Synced across devices via the player row - logging in on a different browser/machine
        // picks up the same theme instead of defaulting back to light/system.
        updateThemePreference: build.mutation<BasicResType, { themePreference: "light" | "dark" | null }>({
            query: (data) => ({
                url: "players/me/theme-preference",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        updateEmailNotificationsEnabled: build.mutation<BasicResType, { emailNotificationsEnabled: boolean }>({
            query: (data) => ({
                url: "players/me/email-notifications-enabled",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        // "Forgot password?" on the login page - anonymous, no session. Always resolves
        // successfully regardless of whether the email matches a player (see the backend's
        // matching doc comment) - the UI shows the same "check your email" message either way.
        requestPasswordReset: build.mutation<BasicResType, { email: string }>({
            query: (data) => ({
                url: "auth/forgot-password",
                method: "POST",
                body: data,
            }),
        }),
        // Redeems the link from the "forgot password" email.
        resetPasswordWithToken: build.mutation<BasicResType, { token: string; newPassword: string }>({
            query: (data) => ({
                url: "auth/reset-password-with-token",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useChangePasswordMutation,
    useForcePasswordResetMutation,
    useGetUserProfileQuery,
    useUpdatePlayerDataMutation,
    useResetPlayerPasswordMutation,
    useUpdateThemePreferenceMutation,
    useUpdateEmailNotificationsEnabledMutation,
    useRequestPasswordResetMutation,
    useResetPasswordWithTokenMutation,
} = authApi;
