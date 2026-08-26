import apiSlice from "../../api/apiSlice";
import IAcCollection from "../../../interfaces/IAcCollection";
import IAcChart from "../../../interfaces/IAcChart";
import IAcNature from "../../../interfaces/IAcNature";
import IAcVoucherType from "../../../interfaces/IAcVoucherType";
import IAccountsReport from "../../../interfaces/IAccountsReport";
import IAccountBalanceSummary from "../../../interfaces/IAccountBalanceSummary";
import IBalanceSheetReport from "../../../interfaces/IBalanceSheetReport";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
// import IAccountSummaryResponse from "../../../interfaces/AccountSummaryResponse";
export interface BasicResType<T> {
  message: string;
  statusCode: number;
  timeStamp: string;
  status: boolean;
  content: T;
}

// AcCollection.tsx and AcBillPayment.tsx create/update these records via raw
// axios calls (not RTK Query mutations), then re-fetch their own local list
// manually. That local refetch keeps those two pages themselves fresh, but
// without these tags nothing ever invalidates the RTK Query cache used by
// other consumers (e.g. Dashboard widgets like RecentActivityWidget and
// SpendingBreakdownWidget), so they'd keep showing stale data. See those
// components for the dispatch(acCollectionApi.util.invalidateTags(...)) calls
// that close the loop.
const apiWithTags = apiSlice.enhanceEndpoints({
  // "playerCollectionMetrics" belongs to playerCollectionMetricsSlice.ts, but RTK Query's tag
  // registry is shared across the whole apiSlice - declaring it here too just lets
  // createAcCollection's invalidatesTags reference it, so logging a payment refreshes the
  // Monthly Payments table without a manual refetch call.
  addTagTypes: ["acCollection", "acBillPayment", "playerCollectionMetrics"],
});

export const acCollectionApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch AC Collection list
    getAcCollections: builder.query<BasicResType<IAcCollection[]>, void>({
      query: () => ({
        url: `/ac/collections`,
        method: "GET",
      }),
      providesTags: ["acCollection"],
    }),

    // Create new AC Collection
    createAcCollection: builder.mutation<
      BasicResType<IAcCollection>,
      Partial<IAcCollection>
    >({
      query: (data) => ({
        url: `/ac/collections`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["acCollection", "playerCollectionMetrics"],
    }),

    // Update existing AC Collection
    updateAcCollection: builder.mutation<
      BasicResType<IAcCollection>,
      { id: number; data: Partial<IAcCollection> }
    >({
      query: ({ id, data }) => ({
        url: `/ac/collections/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["acCollection"],
    }),

    // Fetch specific AC Collection by ID
    getAcCollectionById: builder.query<BasicResType<IAcCollection>, number>({
      query: (id) => ({
        url: `/ac/collections/${id}`,
        method: "GET",
      }),
      providesTags: ["acCollection"],
    }),

    getAcChartList: builder.query<BasicResType<IAcChart[]>, void>({
      query: () => ({
        url: `/ac/charts`,
        method: "GET",
      }),
    }),

    getAcReportList: builder.query<BasicResType<IAccountsReport[]>, void>({
      query: () => ({
        url: `/ac/reports/accounts-summary`,
        method: "GET",
      }),
    }),

    getAcBalanceSummaryList: builder.query<BasicResType<IAccountBalanceSummary[]>, void>({
      query: () => ({
        url: `/ac/reports/balance-summary`,
        method: "GET",
      }),
    }),
    getAcBalanceSheetList: builder.query<BasicResType<IBalanceSheetReport[]>, void>({
      query: () => ({
        url: `/ac/reports/balance-sheet`,
        method: "GET",
      }),
    }),
    getAcNatureList: builder.query<BasicResType<IAcNature[]>, void>({
      query: () => ({
        url: `/ac/natures`,
        method: "GET",
      }),
    }),
    getAcVoucherTypeList: builder.query<BasicResType<IAcVoucherType[]>, void>({
      query: () => ({
        url: `/ac/voucher-types`,
        method: "GET",
      }),
    }),
    getAcBillPayments: builder.query<BasicResType<IAcBillPayment[]>, void>({
      query: () => ({
        url: `/ac/bill-payments`,
        method: "GET",
      }),
      providesTags: ["acBillPayment"],
    }),
  }),
});

export const {
  useGetAcCollectionsQuery,
  // removed useGetAcSummaryQuery as it's now in accountSummarySlice
  useCreateAcCollectionMutation,
  useUpdateAcCollectionMutation,
  useGetAcCollectionByIdQuery,
  useGetAcChartListQuery,
  useGetAcNatureListQuery,
  useGetAcVoucherTypeListQuery,
  useGetAcReportListQuery,
  useGetAcBalanceSummaryListQuery,
  useGetAcBalanceSheetListQuery,
  useGetAcBillPaymentsQuery,
} = acCollectionApi;

