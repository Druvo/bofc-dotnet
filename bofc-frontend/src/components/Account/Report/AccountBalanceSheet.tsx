import { AccountBookOutlined } from "@ant-design/icons";
import IBalanceSheetReport from "../../../interfaces/IBalanceSheetReport";
import { useGetAcBalanceSheetListQuery } from "../../../state/features/account/accountSlice";
import { fmtMoney } from "../../../utils/acFormat";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";

const NATURE_BADGE: Record<string, "success" | "error" | "warning" | "light"> = {
    INCOME: "success",
    EXPENSE: "error",
    ASSET: "warning",
    LIABILITY: "light",
    EQUITY: "light",
};

function AccountBalanceSheet() {
    const { data, isLoading } = useGetAcBalanceSheetListQuery();
    const balanceSheet = data?.content || [];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <AccountBookOutlined className="text-brand-500 dark:text-brand-400" />
                Balance Sheet
            </h2>

            {isLoading ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Nature Type</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Debit</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Credit</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {balanceSheet.map((record: IBalanceSheetReport) => (
                                <tr key={record.natureType} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-3 py-2.5"><Badge variant={NATURE_BADGE[record.natureType] || "light"}>{record.natureType}</Badge></td>
                                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmtMoney(record.totalDebit)}</td>
                                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmtMoney(record.totalCredit)}</td>
                                    <td className={`px-3 py-2.5 text-right font-semibold ${record.balance > 0 ? "text-success-600 dark:text-success-500" : record.balance < 0 ? "text-error-600 dark:text-error-500" : "text-gray-500"}`}>{fmtMoney(record.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AccountBalanceSheet;
