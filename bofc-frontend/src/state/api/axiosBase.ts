import axios from "axios";
import { selectLoginInfo } from "../slices/loginInfoSlice";
import store from "../store";
import { endExpiredSession, isExpiredSessionResponse } from "../../utils/session";

// Create an axios instance
// Falls back to "/api" so a plain `npm start` (no REACT_APP_API_URL set) behaves the same
// as production, instead of leaving baseURL empty and forcing every caller here to hand-prepend
// API_URL itself - the two conventions coexisting was what caused a real double "/api/api/..."
// 404 in production (REACT_APP_API_URL="/api" baked in at build time, PLUS callers doing
// axiosApi.get(`${API_URL}/players/${id}`)). Callers of this instance must pass bare paths
// ("players/123"), never prefixed with API_URL.
const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "/api",
});

// Add a request interceptor
axiosApi.interceptors.request.use(
    (config) => {
        // Get the token from your Redux store
        const state = store.getState();
        const loginInfo = selectLoginInfo(state);

        const token = loginInfo.token; // Assuming you store the token in loginInfo.token

        // If token exists, add it to headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

// Optionally, add a response interceptor to handle any response errors globally
axiosApi.interceptors.response.use(
    (response) => response, // Return the response if successful
    (error) => {
        // Shares its definition of "the session ran out" with RTK Query, so the two layers cannot
        // disagree. This used to redirect on any 401 at all, which included the login endpoint
        // answering "wrong password" - that reloaded the login page and threw away the very
        // message telling the user what they had got wrong.
        if (isExpiredSessionResponse(error?.response?.status, error?.config?.url)) {
            endExpiredSession();
        }

        return Promise.reject(error);
    }
);

export default axiosApi;
