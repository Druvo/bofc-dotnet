import { useMemo, useState } from "react";
import { BarChartOutlined } from "@ant-design/icons";
import IAccountsReport from "../../../interfaces/IAccountsReport";
import { useGetAcReportListQuery } from "../../../state/features/account/accountSlice";
import { fmtMoney } from "../../../utils/acFormat";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";

type SortField = "accountName" | "totalDebit" | "totalCredit" | "balance" | null;

function AccountsReport() {
    const { data, isLoading } = useGetAcReportListQuery();
    const accountsReport = data?.content || [];
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const toggleSort = (field: SortField) => {
        if (sortField !== field) { setSortField(field); setSortOrder("asc"); }
        else if (sortOrder === "asc") setSortOrder("desc");
        else setSortField(null);
    };

    const sorted = useMemo(() => {
        const rows = [...accountsReport];
        if (!sortField) return rows;
        rows.sort((a, b) => {
            let diff = 0;
            if (sortField === "accountName") diff = a.accountName.localeCompare(b.accountName);
            else diff = a[sortField] - b[sortField];
            return sortOrder === "asc" ? diff : -diff;
        });
        return rows;
    }, [accountsReport, sortField, sortOrder]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <BarChartOutlined className="text-brand-500 dark:text-brand-400" />
                Accounts Report
            </h2>

            {isLoading ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Account Code</th>
                                <th onClick={() => toggleSort("accountName")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Account Name</th>
                                <th onClick={() => toggleSort("totalDebit")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Debit</th>
                                <th onClick={() => toggleSort("totalCredit")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Credit</th>
                                <th onClick={() => toggleSort("balance")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sorted.map((record: IAccountsReport) => (
                                <tr key={record.accountId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-3 py-2.5"><Badge variant="light">{record.accountCode}</Badge></td>
                                    <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{record.accountName}</td>
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

export default AccountsReport;
