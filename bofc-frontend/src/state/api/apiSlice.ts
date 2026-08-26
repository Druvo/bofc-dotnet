import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { API_URL } from "../../settings";
import { showErrorNotification } from "../../utils/errorNotification";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";

// Define types for the error response
interface FieldError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  timeStamp: number;
  statusCode: number;
  status: string;
  message: string;
  errors?: FieldError[];
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.loginInfo.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Track recent error messages to prevent duplicates
const recentErrors = new Map<string, number>();
const ERROR_DEDUP_TIME = 3000; // 3 seconds

// Custom baseQuery with improved error handling and types
const customBaseQuery: typeof baseQuery = async (args, api, extraOptions) => {
  let result;

  try {
    result = await baseQuery(args, api, extraOptions);
  } catch (error) {
    // Catch any errors during the base query itself
    console.error("Error during API call:", error);
    return {
      error: {
        status: 'FETCH_ERROR',
        error: String(error),
      },
    } as any;
  }

  // Check if result.error exists
  if (result?.error) {
    // Network-level failure (offline, DNS, backend unreachable) - every widget's
    // query fails independently and would otherwise stack a "Failed to fetch"
    // toast per widget. Skip the toast and let the app-wide OfflineBanner
    // (DefaultLayout.tsx) show one persistent "you're offline" message instead.
    //
    // A dead backend process (server down, still starting up) doesn't fail at the
    // fetch level though - the dev proxy / reverse proxy is still up and answers with
    // a real HTTP response, just a 502/503/504 one. Treat those the same way, or every
    // widget on the page fires its own error toast in a loop for as long as the
    // backend stays down.
    const errorStatus = (result.error as any)?.status;
    if (errorStatus === "FETCH_ERROR" || errorStatus === 502 || errorStatus === 503 || errorStatus === 504) {
      window.dispatchEvent(new Event("bofc:network-error"));
      return result;
    }

    try {
      const errorData = result?.error?.data as ApiErrorResponse; // Cast to ApiErrorResponse
      const statusCode = (result?.error as any)?.status || errorData?.statusCode;

      // Destructure the error data with default fallback values
      const { message: errorMessage, errors } = errorData || {};

      let alertMessage = "";

      // Append specific field errors if available
      if (errors && Array.isArray(errors)) {
        const fieldErrors = errors
          ?.map((err: FieldError) => `${err.message}`)
          .join("\n");
        alertMessage += fieldErrors;
      } else if (errorMessage) {
        alertMessage = normalizeErrorMessage(errorMessage, "An error occurred");
      } else if (statusCode === 500) {
        // For 500 errors without a message, show endpoint-specific error
        const endpoint = typeof args === 'string' ? args : (args as any)?.url || "unknown endpoint";
        alertMessage = `Internal server error for API ${endpoint}`;
      } else {
        // Fallback: normalize the full error object for consistent user-facing text.
        alertMessage = normalizeErrorMessage(result.error, "An error occurred");
      }

      alertMessage = normalizeErrorMessage(alertMessage, "An error occurred");

      // Check if this error was recently displayed
      const now = Date.now();
      const lastErrorTime = recentErrors.get(alertMessage);

      if (!lastErrorTime || now - lastErrorTime > ERROR_DEDUP_TIME) {
        try {
          // Display the alert only if it hasn't been shown recently
          showErrorNotification({
            statusCode,
            message: alertMessage,
          });
          recentErrors.set(alertMessage, now);
        } catch (toastError) {
          // Silently fail if toast fails
          console.error("Toast notification failed:", toastError);
        }
      }
    } catch (notificationError) {
      // If error notification fails, log to console instead of crashing
      console.error("Error displaying notification:", notificationError);
      console.error("Original API error:", result?.error);
    }
  }

  return result;
};

const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery, // Use the custom baseQuery
  endpoints: () => ({}),
  tagTypes: [],
});

export default apiSlice;
