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
    /** Hours between re-sends during the reminder window - only to players who still haven't voted. */
    matchDayReminderRepeatHours: number;
    notifyPaymentDueEnabled: boolean;
    paymentDueReminderDayOfMonth: number;
    /** Days between re-sends after the trigger day - only to players still unpaid for the month. */
    paymentDueReminderRepeatDays: number;
    notifyCustomEmailEnabled: boolean;
    pushNotificationsEnabled: boolean;
    matchDayStatusCheckIntervalHours: number;
    /** Master switch for closing RSVP voting some hours before kickoff. */
    votingLockEnabled: boolean;
    /** How many hours before kickoff voting closes, once votingLockEnabled is on. */
    votingLockHoursBeforeMatch: number;
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
    /** How many goalkeepers "Auto-Assign Goalkeepers" fills per team (starter + backup/rotation cover). */
    minGoalkeepersPerTeam: number;
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
    /** Hours between re-sends during the reminder window - only to players who still haven't voted. */
    matchDayReminderRepeatHours: number;
    notifyPaymentDueEnabled: boolean;
    paymentDueReminderDayOfMonth: number;
    /** Days between re-sends after the trigger day - only to players still unpaid for the month. */
    paymentDueReminderRepeatDays: number;
    notifyCustomEmailEnabled: boolean;
    pushNotificationsEnabled: boolean;
    matchDayStatusCheckIntervalHours: number;
    /** Master switch for closing RSVP voting some hours before kickoff. */
    votingLockEnabled: boolean;
    /** How many hours before kickoff voting closes, once votingLockEnabled is on. */
    votingLockHoursBeforeMatch: number;
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
    /** How many goalkeepers "Auto-Assign Goalkeepers" fills per team (starter + backup/rotation cover). */
    minGoalkeepersPerTeam: number;
    /** Null/omitted to clear the override and fall back to the appsettings default. */
    cashChartCode?: string | null;
    /** Null/omitted to clear the override and fall back to the appsettings default. */
    collectionIncomeChartCode?: string | null;
    /** At least 2 required (server-validated) - need 2 distinct colors to tell the teams in a match apart. */
    jerseyColors: string[];
}

/** Maps a fetched SystemSettings 1:1 into a full save payload - used whenever a page needs to
 * change just ONE field (e.g. the email branding color) without wiping out every other setting,
 * since PUT /settings replaces the whole row rather than patching individual fields. */
export function toUpdateSystemSettingsRequest(s: SystemSettings): UpdateSystemSettingsRequest {
    return {
        smtpEnabled: s.smtpEnabled,
        smtpHost: s.smtpHost || undefined,
        smtpPort: s.smtpPort,
        smtpUsername: s.smtpUsername || undefined,
        // Omitted - keeps whatever password is currently stored untouched.
        smtpFromEmail: s.smtpFromEmail || undefined,
        smtpFromName: s.smtpFromName || undefined,
        smtpUseSsl: s.smtpUseSsl,
        notifyMatchDayReminderEnabled: s.notifyMatchDayReminderEnabled,
        matchDayReminderDaysBefore: s.matchDayReminderDaysBefore,
        matchDayReminderRepeatHours: s.matchDayReminderRepeatHours,
        notifyPaymentDueEnabled: s.notifyPaymentDueEnabled,
        paymentDueReminderDayOfMonth: s.paymentDueReminderDayOfMonth,
        paymentDueReminderRepeatDays: s.paymentDueReminderRepeatDays,
        notifyCustomEmailEnabled: s.notifyCustomEmailEnabled,
        pushNotificationsEnabled: s.pushNotificationsEnabled,
        matchDayStatusCheckIntervalHours: s.matchDayStatusCheckIntervalHours,
        votingLockEnabled: s.votingLockEnabled,
        votingLockHoursBeforeMatch: s.votingLockHoursBeforeMatch,
        weeklyMatchDayEnabled: s.weeklyMatchDayEnabled,
        weeklyMatchDayNamePrefix: s.weeklyMatchDayNamePrefix,
        weeklyMatchDayOfWeek: s.weeklyMatchDaySlots[0]?.dayOfWeek || s.weeklyMatchDayOfWeek,
        weeklyMatchTime: s.weeklyMatchDaySlots[0]?.time || s.weeklyMatchTime,
        weeklyMatchDayVenueId: s.weeklyMatchDayVenueId ?? undefined,
        weeklyMatchDaySportType: s.weeklyMatchDaySportType,
        matchDaysPerWeek: s.matchDaysPerWeek,
        weeklyMatchDaySlots: s.weeklyMatchDaySlots,
        weeklyMatchDayMaxPlayersPerTeam: s.weeklyMatchDayMaxPlayersPerTeam,
        weeklyMatchDayAutoTeamsEnabled: s.weeklyMatchDayAutoTeamsEnabled,
        weeklyMatchDayAutoTeamsLeadHours: s.weeklyMatchDayAutoTeamsLeadHours,
        minGoalkeepersPerTeam: s.minGoalkeepersPerTeam,
        cashChartCode: s.cashChartCodeIsOverridden ? s.cashChartCode : null,
        collectionIncomeChartCode: s.collectionIncomeChartCodeIsOverridden ? s.collectionIncomeChartCode : null,
        jerseyColors: s.jerseyColors,
    };
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

        sendPaymentDueReminderNow: builder.mutation<BasicResType & { content: { due: number; sent: number } }, { year: number; month: number }>({
            query: ({ year, month }) => ({
                url: `settings/payment-due-reminder/send-now?year=${year}&month=${month}`,
                method: "POST",
            }),
            invalidatesTags: ["systemSettings"],
        }),
    }),
});

export const {
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useSendTestEmailMutation,
    useGetPushNotificationsEnabledQuery,
    useGenerateWeeklyMatchesNowMutation,
    useGenerateTeamsNowMutation,
    useSendPaymentDueReminderNowMutation,
} = settingsApi;
