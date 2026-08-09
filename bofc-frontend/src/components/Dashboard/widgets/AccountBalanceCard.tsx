import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  CopyOutlined,
  BankOutlined,
} from "@ant-design/icons";
import CountUp from "react-countup";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from "chart.js";
import { useGetAccountSummaryQuery } from "../../../state/features/account/accountSummarySlice";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { useGetActivePaymentAccountsQuery } from "../../../state/features/paymentAccounts/paymentAccountSlice";
import { useSelector } from "react-redux";
import { selectUserRoles } from "../../../state/slices/loginInfoSlice";
import Button from "../../ui/button";
import PaymentAccountsModal from "../../PaymentAccounts/PaymentAccountsModal";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const maskAccountNumber = (value: string) => {
  const last4 = value.slice(-4);
  return `•••• •••• •••• ${last4}`;
};

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.success("Copied to clipboard");
};

const AccountBalanceCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const roles = useSelector(selectUserRoles);
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPERADMIN");

  const { data: summary, isLoading: isSummaryLoading } = useGetAccountSummaryQuery();
  const { data: accountsData } = useGetActivePaymentAccountsQuery();
  const primaryAccount = accountsData?.content?.[0];

  const currentYear = new Date().getFullYear();
  const { data: metricsData } = useGetPlayerCollectionMetricsQuery({ year: currentYear });
  const metrics = useMemo(() => metricsData?.content?.metrics || [], [metricsData]);

  // Real month-over-month signal (collections, the one time-series the
  // backend actually has) rather than a fabricated overall-balance trend.
  const monthlyTotals = useMemo(
    () =>
      MONTH_LABELS.map((_, idx) =>
        metrics.reduce((sum, p) => sum + (p.yearMonthAmount?.[currentYear.toString()]?.[idx + 1] || 0), 0)
      ),
    [metrics, currentYear]
  );

  const trend = useMemo(() => {
    const now = new Date();
    const thisMonthIdx = now.getMonth() + 1;
    if (thisMonthIdx < 2) return null; // January — no same-year prior month to compare

    const thisMonth = monthlyTotals[thisMonthIdx - 1];
    const lastMonth = monthlyTotals[thisMonthIdx - 2];
    if (lastMonth <= 0) return null;

    const pct = ((thisMonth - lastMonth) / lastMonth) * 100;
    return { pct, up: pct >= 0 };
  }, [monthlyTotals]);

  const hasChartData = monthlyTotals.some((v) => v > 0);
  const sparklineData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        data: monthlyTotals,
        borderColor: "#28552b",
        backgroundColor: "rgba(40,85,43,0.12)",
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
    ],
  };
  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <WalletOutlined />
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account Balance</span>
        </div>
        <p className="mb-4 text-theme-xs text-gray-400 dark:text-gray-500">Overview of the club's current funds</p>

        <div className="flex items-center justify-between gap-3">
          <div>
            {isSummaryLoading ? (
              <div className="h-9 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
            ) : (
              <div className="flex items-baseline gap-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
                <span className="text-base font-semibold text-gray-500 dark:text-gray-400">৳</span>
                <CountUp end={summary?.content?.currentBalance || 0} decimals={2} separator="," />
              </div>
            )}

            {trend && (
              <div className={`mt-1.5 flex items-center gap-1 text-theme-xs font-medium ${trend.up ? "text-success-600 dark:text-success-500" : "text-error-500"}`}>
                {trend.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(trend.pct).toFixed(1)}% collections vs last month
              </div>
            )}
          </div>

          {hasChartData && (
            <div className="h-12 w-28 shrink-0">
              <Line data={sparklineData} options={sparklineOptions} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4 dark:border-[var(--color-rule)]">
        {primaryAccount ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Primary Account</div>
              <div className="mt-1 flex items-center gap-1.5 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                {primaryAccount.bankName && (
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <BankOutlined /> {primaryAccount.bankName}
                  </span>
                )}
                <span>{maskAccountNumber(primaryAccount.accountNumber)}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(primaryAccount.accountNumber)}
                  className="text-gray-400 hover:text-brand-500"
                  title="Copy account number"
                >
                  <CopyOutlined className="text-theme-xs" />
                </button>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
              See Details
            </Button>
          </div>
        ) : (
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-theme-xs text-gray-400 dark:text-gray-500">
              {isAdmin ? "No payment accounts added yet." : "Payment details not set up yet."}
            </p>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
              See Details
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2">
            <Link to="/ac/collections" className="flex-1">
              <Button size="sm" startIcon={<ArrowDownOutlined />} className="w-full">
                Collection
              </Button>
            </Link>
            <Link to="/ac/bill-payments" className="flex-1">
              <Button size="sm" variant="outline" startIcon={<ArrowUpOutlined />} className="w-full">
                Payment
              </Button>
            </Link>
          </div>
        )}
      </div>

      <PaymentAccountsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isAdmin={isAdmin} />
    </div>
  );
};

export default AccountBalanceCard;
