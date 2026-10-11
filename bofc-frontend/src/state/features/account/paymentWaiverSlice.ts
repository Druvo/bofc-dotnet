import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["paymentWaiver", "playerCollectionMetrics"],
});

/** A month of club dues an admin has omitted for one player - see the backend's PaymentWaiver.
 * While it exists the player is not shown as Due for that month and gets no reminder for it. */
export interface PaymentWaiver {
  id: number;
  playerId: number;
  playerName: string;
  year: number;
  /** 1-12 */
  month: number;
  reason?: string | null;
  createdDate: string;
}

export const paymentWaiverApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentWaivers: builder.query<BasicResType & { content: PaymentWaiver[] }, { year?: number } | void>({
      query: (params) => ({
        url: `/ac/payment-waivers`,
        method: "GET",
        params: params?.year ? { year: params.year } : undefined,
      }),
      providesTags: ["paymentWaiver"],
    }),

    // Both mutations also invalidate the collection-metrics report: it carries waivedMonths,
    // which is what turns a "Due" cell into "Omitted" on the dashboard and payments table.
    waivePayment: builder.mutation<
      BasicResType & { content: PaymentWaiver },
      { playerId: number; year: number; month: number; reason?: string }
    >({
      query: (body) => ({
        url: `/ac/payment-waivers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["paymentWaiver", "playerCollectionMetrics"],
    }),

    removePaymentWaiver: builder.mutation<BasicResType, { id: number }>({
      query: ({ id }) => ({
        url: `/ac/payment-waivers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["paymentWaiver", "playerCollectionMetrics"],
    }),
  }),
});

export const { useGetPaymentWaiversQuery, useWaivePaymentMutation, useRemovePaymentWaiverMutation } = paymentWaiverApi;

export default paymentWaiverApi;
