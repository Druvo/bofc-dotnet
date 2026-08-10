import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { PieChartOutlined } from "@ant-design/icons";
import { useGetAcBillPaymentsQuery } from "../../../state/features/account/accountSlice";
import { Spinner } from "../../ui/loader";

ChartJS.register(ArcElement, Tooltip);

// Same accent family used across the dashboard (brand/success/warning/error)
// plus a couple of neutral extras for whatever categories overflow the top 5.
// First slot is the club gold accent rather than brand-green - sitting next to
// the success-green slice, two greens back to back would be hard to tell apart.
const SLICE_COLORS = ["#b69549", "#12b76a", "#f79009", "#0ba5ec", "#f04438", "#98a2b3"];

const SpendingBreakdownWidget: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data, isLoading } = useGetAcBillPaymentsQuery();

  const { categories, total } = useMemo(() => {
    const payments = (data?.content || []).filter(
      (p) => new Date(p.paymentDate).getFullYear() === currentYear
    );
    const byCategory = new Map<string, number>();
    payments.forEach((p) => {
      const name = p.costType?.name || "Others";
      byCategory.set(name, (byCategory.get(name) || 0) + p.amount);
    });
    const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const sum = sorted.reduce((s, [, amt]) => s + amt, 0);
    return { categories: sorted, total: sum };
  }, [data, currentYear]);

  const chartData = {
    labels: categories.map(([name]) => name),
    datasets: [
      {
        data: categories.map(([, amt]) => amt),
        backgroundColor: categories.map((_, i) => SLICE_COLORS[i % SLICE_COLORS.length]),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <PieChartOutlined /> Spending ({currentYear})
        </div>
      </div>

      {isLoading ? (
        <Spinner className="my-4 text-gray-400" />
      ) : categories.length === 0 ? (
        <div className="py-6 text-center text-theme-xs text-gray-400 dark:text-gray-500">No expenses recorded yet</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-[110px] w-[110px] shrink-0">
            <Doughnut data={chartData} options={{ cutout: "70%", plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-theme-xs text-gray-400 dark:text-gray-500">Total</span>
              <span className="text-theme-sm font-bold text-gray-800 dark:text-white/90">
                ৳{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {categories.slice(0, 6).map(([name], i) => (
              <div key={name} className="flex items-center gap-2 text-theme-xs text-gray-600 dark:text-gray-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingBreakdownWidget;
