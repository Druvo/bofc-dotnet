import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["notification"],
});

export interface NotificationHistoryItem {
    id: number;
    notificationId: number;
    title: string;
    body: string;
    sentDate: string;
    isRead: boolean;
    readDate?: string | null;
}

export interface NotificationHistoryResType extends BasicResType {
    content: {
        notifications: NotificationHistoryItem[];
        totalCount: number;
        unreadCount: number;
    };
}

export interface VapidPublicKeyResType extends BasicResType {
    content: {
        publicKey: string;
    };
}

export type NotificationTargetType = "ALL" | "CUSTOM";

export interface SendNotificationRequest {
    title: string;
    body: string;
    targetType: NotificationTargetType;
    userIds?: number[];
    sendEmail?: boolean;
}

export interface PushSubscriptionPayload {
    endpoint: string;
    p256dh: string;
    auth: string;
}

export const notificationApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getMyNotifications: builder.query<NotificationHistoryResType, { offSet: number; pageSize: number }>({
            query: ({ offSet, pageSize }) => `notifications/me?offSet=${offSet}&pageSize=${pageSize}`,
            providesTags: ["notification"],
        }),

        markNotificationRead: builder.mutation<BasicResType, number>({
            query: (id) => ({
                url: `notifications/${id}/read`,
                method: "PUT",
            }),
            invalidatesTags: ["notification"],
        }),

        markAllNotificationsRead: builder.mutation<BasicResType, void>({
            query: () => ({
                url: "notifications/read-all",
                method: "PUT",
            }),
            invalidatesTags: ["notification"],
        }),

        sendNotification: builder.mutation<BasicResType, SendNotificationRequest>({
            query: (body) => ({
                url: "notifications",
                method: "POST",
                body,
            }),
            invalidatesTags: ["notification"],
        }),

        getVapidPublicKey: builder.query<VapidPublicKeyResType, void>({
            query: () => "notifications/vapid-public-key",
        }),

        subscribePush: builder.mutation<BasicResType, PushSubscriptionPayload>({
            query: (body) => ({
                url: "notifications/subscribe",
                method: "POST",
                body,
            }),
        }),

        unsubscribePush: builder.mutation<BasicResType, string>({
            query: (endpoint) => ({
                url: `notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`,
                method: "DELETE",
            }),
        }),
    }),
});

export const {
    useGetMyNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
    useSendNotificationMutation,
    useGetVapidPublicKeyQuery,
    useSubscribePushMutation,
    useUnsubscribePushMutation,
} = notificationApi;
