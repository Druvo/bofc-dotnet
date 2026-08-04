import IAccountSummaryResponse from "../../../interfaces/AccountSummaryResponse";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["accountSummary"],
});

export interface AccountSummaryResType extends BasicResType {
  content: IAccountSummaryResponse;
}

export const accountSummaryApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getAccountSummary: builder.query<AccountSummaryResType, void>({
      query: () => ({
        url: `/ac/reports/summary`,
        method: "GET",
      }),
      providesTags: ["accountSummary"],
    }),
  }),
});

export const { useGetAccountSummaryQuery } = accountSummaryApi;

export default accountSummaryApi;
