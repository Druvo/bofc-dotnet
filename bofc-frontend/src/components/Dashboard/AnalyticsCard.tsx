import React from "react";
import CountUp from "react-countup";

type AnalyticsCardVariant = "success" | "error" | "primary";

const variantIconWrap: Record<AnalyticsCardVariant, string> = {
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  primary: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
};

interface AnalyticsCardProps {
  title: string;
  value: number;
  variant: AnalyticsCardVariant;
  icon: React.ReactNode;
  /** Icon sits inline beside the title instead of a floating tile — use on
   * one card in a row so the row doesn't repeat the same icon-tile shape
   * three times. */
  inline?: boolean;
}

const variantInlineText: Record<AnalyticsCardVariant, string> = {
  success: "text-success-600 dark:text-success-500",
  error: "text-error-600 dark:text-error-500",
  primary: "text-brand-500 dark:text-brand-400",
};

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value, variant, icon, inline = false }) => {
  if (inline) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:-translate-y-0.5 hover:shadow-theme-sm dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
        <div className={`mb-3 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400`}>
          <span className={`text-base ${variantInlineText[variant]}`}>{icon}</span>
          {title}
        </div>
        <div className="flex items-baseline text-title-sm font-bold text-gray-800 dark:text-white/90">
          <span className="mr-1 text-base font-semibold text-gray-500 dark:text-gray-400">৳</span>
          <CountUp end={value} decimals={2} separator="," />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:-translate-y-0.5 hover:shadow-theme-sm dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
      <div className="min-w-0">
        <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
        <div className="flex items-baseline text-title-sm font-bold text-gray-800 dark:text-white/90">
          <span className="mr-1 text-base font-semibold text-gray-500 dark:text-gray-400">৳</span>
          <CountUp end={value} decimals={2} separator="," />
        </div>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${variantIconWrap[variant]}`}>
        {icon}
      </div>
    </div>
  );
};

export default AnalyticsCard;
