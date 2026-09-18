import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    selectLoginInfo,
    setAllData,
    removeUser,
} from "../state/slices/loginInfoSlice";
import { clearStoredCredentials } from "../utils/utils";
import { isStoredSessionValid } from "../utils/session";

export const useAuthHook = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const loginInfo = useSelector(selectLoginInfo);

    const login = (tokenContent: string) => {
        localStorage.setItem("tokenContent", tokenContent);
        const contentData = JSON.parse(tokenContent);
        dispatch(setAllData(contentData));
    };

    const logout = () => {
        // Clear both localStorage token and remembered credentials
        localStorage.removeItem("tokenContent");
        clearStoredCredentials(); // Clear cookies with remembered credentials
        dispatch(removeUser());
        navigate("/");
    };

    /**
     * Signed in means the token is present AND still within its lifetime. Presence alone - which
     * is all this used to check - stayed true for the whole seven-day life of a tab, so an
     * expired session kept reading as authenticated and kept firing requests that could only 401.
     */
    const isAuthenticated = () => {
        return !!loginInfo?.token && isStoredSessionValid();
    };

    return {
        login,
        logout,
        isAuthenticated,
        user: loginInfo,
    };
};
