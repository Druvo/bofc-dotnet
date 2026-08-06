import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["systemSettings"],
});

export interface SystemSettings {
    smtpEnabled: boolean;
    smtpHost?: string | null;
    smtpPort: number;
    smtpUsername?: string | null;
    smtpPasswordSet: boolean;
    smtpFromEmail?: string | null;
    smtpFromName?: string | null;
    smtpUseSsl: boolean;
    notifyMatchDayReminderEnabled: boolean;
    matchDayReminderDaysBefore: number;
    notifyPaymentDueEnabled: boolean;
    paymentDueReminderDayOfMonth: number;
    notifyCustomEmailEnabled: boolean;
    pushNotificationsEnabled: boolean;
    auctionEnabled: boolean;
    weeklyMatchEnabled: boolean;
    weeklyMatchNamePrefix: string;
    weeklyMatchDayOfWeek: string;
    weeklyMatchTime: string;
    weeklyMatchVenueId?: number | null;
    weeklyMatchVenueName?: string | null;
    weeklyMatchSportType: string;
    weeklyMatchDurationMinutes: number;
    weeklyMatchTimeGapMinutes: number;
    cashChartCode: string;
    cashChartName?: string | null;
    collectionIncomeChartCode: string;
    collectionIncomeChartName?: string | null;
    cashChartCodeIsOverridden: boolean;
    collectionIncomeChartCodeIsOverridden: boolean;
    jerseyColorA: string;
    jerseyColorB: string;
}

export interface SystemSettingsResType extends BasicResType {
    content: SystemSettings;
}

export interface UpdateSystemSettingsRequest {
    smtpEnabled: boolean;
    smtpHost?: string;
    smtpPort: number;
    smtpUsername?: string;
    /** Omit to keep the currently stored password, "" to clear it, non-empty to replace it. */
    smtpPassword?: string;
    smtpFromEmail?: string;
    smtpFromName?: string;
    smtpUseSsl: boolean;
    notifyMatchDayReminderEnabled: boolean;
    matchDayReminderDaysBefore: number;
    notifyPaymentDueEnabled: boolean;
    paymentDueReminderDayOfMonth: number;
    notifyCustomEmailEnabled: boolean;
    pushNotificationsEnabled: boolean;
    auctionEnabled: boolean;
    weeklyMatchEnabled: boolean;
    weeklyMatchNamePrefix: string;
    weeklyMatchDayOfWeek: string;
    /** "HH:mm" */
    weeklyMatchTime: string;
    weeklyMatchVenueId?: number;
    weeklyMatchSportType: string;
    weeklyMatchDurationMinutes: number;
    weeklyMatchTimeGapMinutes: number;
    /** Null/omitted to clear the override and fall back to the appsettings default. */
    cashChartCode?: string | null;
    /** Null/omitted to clear the override and fall back to the appsettings default. */
    collectionIncomeChartCode?: string | null;
    jerseyColorA: string;
    jerseyColorB: string;
}

export const settingsApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getSystemSettings: builder.query<SystemSettingsResType, void>({
            query: () => "settings",
            providesTags: ["systemSettings"],
        }),

        updateSystemSettings: builder.mutation<SystemSettingsResType, UpdateSystemSettingsRequest>({
            query: (body) => ({
                url: "settings",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["systemSettings"],
        }),

        sendTestEmail: builder.mutation<BasicResType, { toEmail: string }>({
            query: (body) => ({
                url: "settings/test-email",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useSendTestEmailMutation,
} = settingsApi;
