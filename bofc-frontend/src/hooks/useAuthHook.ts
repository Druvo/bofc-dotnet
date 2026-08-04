import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    selectLoginInfo,
    setAllData,
    removeUser,
} from "../state/slices/loginInfoSlice";
import { clearStoredCredentials } from "../utils/utils";

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

    const isAuthenticated = () => {
        return !!loginInfo?.token;
    };

    return {
        login,
        logout,
        isAuthenticated,
        user: loginInfo,
    };
};
