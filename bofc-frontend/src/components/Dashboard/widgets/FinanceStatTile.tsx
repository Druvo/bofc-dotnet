import React from "react";
import CountUp from "react-countup";

type TileVariant = "success" | "error" | "primary" | "warning";

const variantIconWrap: Record<TileVariant, string> = {
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  primary: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
};

interface FinanceStatTileProps {
  title: string;
  icon: React.ReactNode;
  variant: TileVariant;
  /** Numeric tile shows ৳ + CountUp; set `value` for that. */
  value?: number;
  /** Non-numeric tile (e.g. a plain count) — set `display` instead of `value`. */
  display?: React.ReactNode;
  subtitle?: React.ReactNode;
}

const FinanceStatTile: React.FC<FinanceStatTileProps> = ({ title, icon, variant, value, display, subtitle }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${variantIconWrap[variant]}`}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline text-title-sm font-bold text-gray-800 dark:text-white/90">
        {value !== undefined ? (
          <>
            <span className="mr-1 text-sm font-semibold text-gray-500 dark:text-gray-400">৳</span>
            <CountUp end={value} decimals={2} separator="," />
          </>
        ) : (
          display
        )}
      </div>
      {subtitle && <div className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">{subtitle}</div>}
    </div>
  );
};

export default FinanceStatTile;
