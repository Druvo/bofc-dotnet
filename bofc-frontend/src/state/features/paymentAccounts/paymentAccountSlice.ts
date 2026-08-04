import apiSlice from "../../api/apiSlice";
import IPaymentAccount from "../../../interfaces/IPaymentAccount";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["paymentAccount"],
});

interface PaymentAccountListResType extends BasicResType {
  content: IPaymentAccount[];
}

interface PaymentAccountIdResType extends BasicResType {
  content: number;
}

export const paymentAccountApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getActivePaymentAccounts: builder.query<PaymentAccountListResType, void>({
      query: () => ({ url: `/payment-accounts`, method: "GET" }),
      providesTags: ["paymentAccount"],
    }),

    getAllPaymentAccounts: builder.query<PaymentAccountListResType, void>({
      query: () => ({ url: `/payment-accounts/all`, method: "GET" }),
      providesTags: ["paymentAccount"],
    }),

    createPaymentAccount: builder.mutation<PaymentAccountIdResType, Partial<IPaymentAccount>>({
      query: (data) => ({ url: `/payment-accounts`, method: "POST", body: data }),
      invalidatesTags: ["paymentAccount"],
    }),

    updatePaymentAccount: builder.mutation<PaymentAccountIdResType, { id: number; data: Partial<IPaymentAccount> }>({
      query: ({ id, data }) => ({ url: `/payment-accounts/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["paymentAccount"],
    }),

    deletePaymentAccount: builder.mutation<BasicResType, number>({
      query: (id) => ({ url: `/payment-accounts/${id}`, method: "DELETE" }),
      invalidatesTags: ["paymentAccount"],
    }),
  }),
});

export const {
  useGetActivePaymentAccountsQuery,
  useGetAllPaymentAccountsQuery,
  useCreatePaymentAccountMutation,
  useUpdatePaymentAccountMutation,
  useDeletePaymentAccountMutation,
} = paymentAccountApi;

export default paymentAccountApi;
