import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { checkTockenValidity } from "../../utils/utils";

interface LoginInfoState {
    token: string;
    username: string;
    email: string;
    userId: string;
    image?: string;
    roles: string[];
    resetPassword?: boolean;
}

const blankState: LoginInfoState = {
    token: "",
    username: "",
    email: "",
    userId: "",
    image: "",
    roles: [""],
};

// Hydrate synchronously from localStorage so the very first render already
// knows whether the user is logged in. Without this, the store starts blank
// and only picks up the token in a useLayoutEffect after mount — during that
// gap, App renders its "logged out" routes, whose catch-all redirects to
// /login, which itself isn't a valid route once the real auth state lands a
// moment later, bouncing to "/". Net effect: any deep link (a pasted/shared
// URL) gets redirected to the dashboard before the app ever notices you were
// already logged in.
const getInitialState = (): LoginInfoState => {
    try {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent && checkTockenValidity(tokenContent)) {
            const parsed = JSON.parse(tokenContent);
            return {
                token: parsed.token,
                username: parsed.username,
                email: parsed.email,
                userId: parsed.userId,
                image: parsed.image ?? "",
                roles: parsed.roles ?? [""],
                resetPassword: parsed.resetPassword,
            };
        }
    } catch {
        // Corrupted localStorage content - fall back to a blank session.
    }
    return blankState;
};

const initialState: LoginInfoState = getInitialState();

export const loginInfoSlice = createSlice({
    name: "loginInfo",
    initialState,
    reducers: {
        setAllData(state, action: PayloadAction<LoginInfoState>) {
            state.token = action.payload.token;
            state.username = action.payload.username;
            state.email = action.payload.email;
            state.userId = action.payload.userId;
            state.roles = action.payload.roles;
            state.image = action.payload.image;
            state.resetPassword = action.payload.resetPassword;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
        },
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setRoles: (state, action: PayloadAction<string[]>) => {
            state.roles = action.payload;
        },
        setImage: (state, action: PayloadAction<string>) => {
            state.image = action.payload;
        },
        setResetPassword: (state, action: PayloadAction<boolean>) => {
            state.resetPassword = action.payload;
        },
        removeUser: (state) => {
            return {
                ...state,
                token: "",
                username: "",
                email: "",
                userId: "",
                roles: [""],
                image: "",
                resetPassword: false,
            };
        },
    },
});

export const {
    setAllData,
    setToken,
    setUsername,
    setEmail,
    setUserId,
    setRoles,
    setImage,
    setResetPassword,
    removeUser,
} = loginInfoSlice.actions;
export default loginInfoSlice.reducer;

export const selectLoginInfo = (state: RootState) => state.loginInfo;
export const selectToken = (state: RootState) => state.loginInfo.token;
export const selectUserName = (state: RootState) => state.loginInfo.username;
export const selectUserEmail = (state: RootState) => state.loginInfo.email;
export const selectUserId = (state: RootState) => state.loginInfo.userId;
export const selectUserRoles = (state: RootState) => state.loginInfo.roles;
export const selectUserImage = (state: RootState) => state.loginInfo.image;
export const selectResetPassword = (state: RootState) => state.loginInfo.resetPassword;
