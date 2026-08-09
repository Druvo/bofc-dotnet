import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { LineChartOutlined } from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { Spinner } from "../../ui/loader";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Named "Collections Trend" rather than "income vs expense" — the backend has
// no expense time-series endpoint (only current-total and per-account
// listings, see IAccountsReport), so a true income-vs-expense chart would
// have to fabricate the expense side. This shows the one real monthly trend
// that exists today; extend it once an expense-by-month endpoint exists.
const CollectionsTrendWidget: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data, isLoading } = useGetPlayerCollectionMetricsQuery({ year: currentYear });
  const metrics = data?.content?.metrics || [];

  const monthlyTotals = useMemo(
    () =>
      MONTH_LABELS.map((_, idx) =>
        metrics.reduce((sum, p) => sum + (p.yearMonthAmount?.[currentYear.toString()]?.[idx + 1] || 0), 0)
      ),
    [metrics, currentYear]
  );

  const hasData = monthlyTotals.some((v) => v > 0);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: "Collections",
        data: monthlyTotals,
        borderColor: "#28552b",
        backgroundColor: "rgba(40,85,43,0.12)",
        pointBackgroundColor: "#28552b",
        pointRadius: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#98a2b3", font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: "rgba(152,162,179,0.15)" }, ticks: { color: "#98a2b3", font: { size: 10 } } },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <LineChartOutlined /> Collections Trend ({currentYear})
      </div>
      {isLoading ? (
        <Spinner className="my-3 text-gray-400" />
      ) : !hasData ? (
        <div className="py-6 text-center text-theme-xs text-gray-400 dark:text-gray-500">No collections recorded yet</div>
      ) : (
        <div style={{ height: 200 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default CollectionsTrendWidget;
