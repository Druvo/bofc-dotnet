import { useMemo, useState } from "react";
import { BranchesOutlined } from "@ant-design/icons";
import IAcNature from "../../../interfaces/IAcNature";
import { AcNatureType } from "../../Enum/AcNatureType";
import { useGetAcNatureListQuery } from "../../../state/features/account/accountSlice";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";

const NATURE_BADGE: Record<string, "success" | "error" | "warning" | "light"> = {
    INCOME: "success",
    EXPENSE: "error",
    ASSET: "warning",
    LIABILITY: "light",
};

type SortField = "name" | "code" | "type" | null;

function AcNature() {
    const { data, isLoading } = useGetAcNatureListQuery();
    const acNatures = data?.content || [];
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const getEnumValue = (type: string): string => {
        switch (type) {
            case "ASSET": return AcNatureType.ASSET;
            case "LIABILITY": return AcNatureType.LIABILITY;
            case "INCOME": return AcNatureType.INCOME;
            case "EXPENSE": return AcNatureType.EXPENSE;
            default: return type;
        }
    };

    const toggleSort = (field: SortField) => {
        if (sortField !== field) { setSortField(field); setSortOrder("asc"); }
        else if (sortOrder === "asc") setSortOrder("desc");
        else setSortField(null);
    };

    const sorted = useMemo(() => {
        const rows = [...acNatures];
        if (!sortField) return rows;
        rows.sort((a, b) => {
            let diff = 0;
            if (sortField === "name") diff = a.name.localeCompare(b.name);
            else if (sortField === "code") diff = a.code - b.code;
            else if (sortField === "type") diff = a.type.localeCompare(b.type);
            return sortOrder === "asc" ? diff : -diff;
        });
        return rows;
    }, [acNatures, sortField, sortOrder]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <BranchesOutlined className="text-brand-500 dark:text-brand-400" />
                Account Natures
            </h2>

            {isLoading ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                                <th onClick={() => toggleSort("name")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Name</th>
                                <th onClick={() => toggleSort("code")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Code</th>
                                <th onClick={() => toggleSort("type")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sorted.map((record: IAcNature) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{record.name}</td>
                                    <td className="px-3 py-2.5"><Badge variant="light">{record.code}</Badge></td>
                                    <td className="px-3 py-2.5"><Badge variant={NATURE_BADGE[record.type] || "light"}>{getEnumValue(record.type)}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AcNature;
