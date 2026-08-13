import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    // matchDays/matchDayTeam/fixtures aren't this slice's own data, but generateWeeklyMatchesNow
    // and generateTeamsNow mutate them server-side (new MatchDays, drafted teams+players,
    // round-robin matches) - without invalidating those tags here too, the Team Building/Fixtures
    // tabs keep showing whatever they'd already cached before the admin clicked "generate now".
    addTagTypes: ["systemSettings", "matchDays", "matchDayTeam", "fixtures"],
});

export interface WeeklyMatchDaySlot {
    dayOfWeek: string;
    /** "HH:mm" */
    time: string;
    /** How long THIS weekly MatchDay runs, in minutes - each slot has its own (e.g. Wednesday
     * 90 min, Saturday 120 min); previously a single duration was shared across every slot. */
    durationMinutes: number;
    /** Length of each individual auto-generated MATCH within this slot's MatchDays - not the
     * same as durationMinutes above, which is the whole MatchDay's length. */
    matchDurationMinutes: number;
    /** Gap between each auto-generated match's start time within THIS slot's MatchDays -
     * each slot has its own; previously a single gap was shared across every slot. */
    timeGapMinutes: number;
}

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
    matchDayStatusCheckIntervalHours: number;
    weeklyMatchDayEnabled: boolean;
    weeklyMatchDayNamePrefix: string;
    weeklyMatchDayOfWeek: string;
    weeklyMatchTime: string;
    weeklyMatchDayVenueId?: number | null;
    weeklyMatchDayVenueName?: string | null;
    weeklyMatchDaySportType: string;
    matchDaysPerWeek: number;
    weeklyMatchDaySlots: WeeklyMatchDaySlot[];
    /** Max squad size (including goalkeeper) per auto-drafted team - team COUNT is derived from
     * confirmed participant turnout at generation time, not fixed here. */
    weeklyMatchDayMaxPlayersPerTeam: number;
    weeklyMatchDayAutoTeamsEnabled: boolean;
    weeklyMatchDayAutoTeamsLeadHours: number;
    cashChartCode: string;
    cashChartName?: string | null;
    collectionIncomeChartCode: string;
    collectionIncomeChartName?: string | null;
    cashChartCodeIsOverridden: boolean;
    collectionIncomeChartCodeIsOverridden: boolean;
    /** The club's configured jersey colors - any count (not hardcoded to 2). */
    jerseyColors: string[];
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
    matchDayStatusCheckIntervalHours: number;
    weeklyMatchDayEnabled: boolean;
    weeklyMatchDayNamePrefix: string;
    weeklyMatchDayOfWeek: string;
    /** "HH:mm" */
    weeklyMatchTime: string;
    weeklyMatchDayVenueId?: number;
    weeklyMatchDaySportType: string;
    matchDaysPerWeek: number;
    weeklyMatchDaySlots: WeeklyMatchDaySlot[];
    /** Max squad size (including goalkeeper) per auto-drafted team - team COUNT is derived from
     * confirmed participant turnout at generation time, not fixed here. */
    weeklyMatchDayMaxPlayersPerTeam: number;
    weeklyMatchDayAutoTeamsEnabled: boolean;
    weeklyMatchDayAutoTeamsLeadHours: number;
    /** Null/omitted to clear the override and fall back to the appsettings default. */
    cashChartCode?: string | null;
    /** Null/omitted to clear the override and fall back to the appsettings default. */
    collectionIncomeChartCode?: string | null;
    /** At least 2 required (server-validated) - need 2 distinct colors to tell the teams in a match apart. */
    jerseyColors: string[];
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

        getPushNotificationsEnabled: builder.query<BasicResType & { content: boolean }, void>({
            query: () => "settings/push-notifications-enabled",
            providesTags: ["systemSettings"],
        }),

        getAuctionEnabled: builder.query<BasicResType & { content: boolean }, void>({
            query: () => "settings/auction-enabled",
            providesTags: ["systemSettings"],
        }),

        generateWeeklyMatchesNow: builder.mutation<
            BasicResType & { content: { matchDaysCreated: number; teamsGenerated: number } },
            void
        >({
            query: () => ({
                url: "settings/weekly-match/generate-now",
                method: "POST",
            }),
            invalidatesTags: ["matchDays", "matchDayTeam", "fixtures"],
        }),

        generateTeamsNow: builder.mutation<
            BasicResType & { content: { success: boolean; reason?: string | null } },
            { matchDayId: number }
        >({
            query: ({ matchDayId }) => ({
                url: `settings/weekly-match/${matchDayId}/generate-teams-now`,
                method: "POST",
            }),
            invalidatesTags: ["matchDayTeam", "matchDays", "fixtures"],
        }),
    }),
});

export const {
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useSendTestEmailMutation,
    useGetPushNotificationsEnabledQuery,
    useGetAuctionEnabledQuery,
    useGenerateWeeklyMatchesNowMutation,
    useGenerateTeamsNowMutation,
} = settingsApi;
