import { useMemo, useState } from "react";
import { TagsOutlined } from "@ant-design/icons";
import IAcVoucherType from "../../../interfaces/IAcVoucherType";
import { useGetAcVoucherTypeListQuery } from "../../../state/features/account/accountSlice";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";

function AcVoucherType() {
    const { data, isLoading } = useGetAcVoucherTypeListQuery();
    const acVoucherTypes = data?.content || [];
    const [sortAsc, setSortAsc] = useState<boolean | null>(null);

    const sorted = useMemo(() => {
        const rows = [...acVoucherTypes];
        if (sortAsc === null) return rows;
        rows.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
        return rows;
    }, [acVoucherTypes, sortAsc]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <TagsOutlined className="text-brand-500 dark:text-brand-400" />
                Voucher Types
            </h2>

            {isLoading ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <th onClick={() => setSortAsc((v) => (v === null ? true : !v))} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Name</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Alias</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Description</th>
                                <th className="px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-gray-400">Default</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sorted.map((record: IAcVoucherType) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{record.name}</td>
                                    <td className="px-3 py-2.5">{record.alias ? <Badge variant="light">{record.alias}</Badge> : <span className="text-gray-400">-</span>}</td>
                                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{record.description || "-"}</td>
                                    <td className="px-3 py-2.5 text-center">
                                        {record.default ? <Badge variant="warning">Default</Badge> : <span className="text-gray-400">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AcVoucherType;
