import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["emailTemplates"],
});

export interface EmailTemplate {
    id: number;
    key: string;
    name: string;
    description: string;
    subject: string;
    body: string;
    availablePlaceholders: string[];
}

export interface EmailTemplateListResponse extends BasicResType {
    content: EmailTemplate[];
}

export interface EmailTemplateResponse extends BasicResType {
    content: EmailTemplate;
}

export interface EmailTemplatePreview {
    subject: string;
    html: string;
}

export interface EmailTemplatePreviewResponse extends BasicResType {
    content: EmailTemplatePreview;
}

export const emailTemplateApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getEmailTemplates: builder.query<EmailTemplateListResponse, void>({
            query: () => "email-templates",
            providesTags: ["emailTemplates"],
        }),

        updateEmailTemplate: builder.mutation<EmailTemplateResponse, { id: number; subject: string; body: string }>({
            query: ({ id, ...body }) => ({
                url: `email-templates/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["emailTemplates"],
        }),

        resetEmailTemplate: builder.mutation<EmailTemplateResponse, { id: number }>({
            query: ({ id }) => ({
                url: `email-templates/${id}/reset`,
                method: "POST",
            }),
            invalidatesTags: ["emailTemplates"],
        }),

        getEmailTemplatePreview: builder.query<EmailTemplatePreviewResponse, { id: number }>({
            query: ({ id }) => `email-templates/${id}/preview`,
        }),

        sendTestEmailTemplate: builder.mutation<BasicResType, { id: number; toEmail: string; matchDayId?: number }>({
            query: ({ id, ...body }) => ({
                url: `email-templates/${id}/test`,
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useGetEmailTemplatesQuery,
    useUpdateEmailTemplateMutation,
    useResetEmailTemplateMutation,
    useLazyGetEmailTemplatePreviewQuery,
    useSendTestEmailTemplateMutation,
} = emailTemplateApi;
