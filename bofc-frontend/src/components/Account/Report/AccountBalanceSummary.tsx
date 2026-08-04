import { useMemo, useState } from "react";
import { FundOutlined } from "@ant-design/icons";
import { useGetAcBalanceSummaryListQuery } from "../../../state/features/account/accountSlice";
import IAccountBalanceSummary from "../../../interfaces/IAccountBalanceSummary";
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

type SortField = "totalDebit" | "totalCredit" | "netBalance" | null;

function AccountBalanceSummary() {
    const { data, error, isLoading } = useGetAcBalanceSummaryListQuery();
    const accountSummary = data?.content || [];
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const toggleSort = (field: SortField) => {
        if (sortField !== field) { setSortField(field); setSortOrder("asc"); }
        else if (sortOrder === "asc") setSortOrder("desc");
        else setSortField(null);
    };

    const sorted = useMemo(() => {
        const rows = [...accountSummary];
        if (!sortField) return rows;
        rows.sort((a, b) => {
            const diff = a[sortField] - b[sortField];
            return sortOrder === "asc" ? diff : -diff;
        });
        return rows;
    }, [accountSummary, sortField, sortOrder]);

    if (error) {
        return (
            <div className="rounded-2xl border border-error-500/30 bg-error-50 p-5 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-500">
                Failed to load account summary
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <FundOutlined className="text-brand-500 dark:text-brand-400" />
                Account Balances Summary
            </h2>

            {isLoading ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Account Type</th>
                                <th onClick={() => toggleSort("totalDebit")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Debit</th>
                                <th onClick={() => toggleSort("totalCredit")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Credit</th>
                                <th onClick={() => toggleSort("netBalance")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sorted.map((record: IAccountBalanceSummary) => (
                                <tr key={record.accountType} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-3 py-2.5"><Badge variant={NATURE_BADGE[record.accountType] || "light"}>{record.accountType}</Badge></td>
                                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmtMoney(record.totalDebit)}</td>
                                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmtMoney(record.totalCredit)}</td>
                                    <td className={`px-3 py-2.5 text-right font-semibold ${record.netBalance > 0 ? "text-success-600 dark:text-success-500" : record.netBalance < 0 ? "text-error-600 dark:text-error-500" : "text-gray-500"}`}>{fmtMoney(record.netBalance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AccountBalanceSummary;
