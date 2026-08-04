import axios from "axios";
import { selectLoginInfo } from "../slices/loginInfoSlice";
import store from "../store";

// Create an axios instance
const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // Your API URL
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
        // Handle unauthorized errors globally (e.g., token expiration)
        if (error.response && error.response.status === 401) {
            // For example, redirect to login page
            window.location.href = "/login"; // Or dispatch a logout action
        }

        return Promise.reject(error);
    }
);

export default axiosApi;
