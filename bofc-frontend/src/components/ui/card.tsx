import React from "react";

/**
 * TailAdmin Free v2.3.0 card container (src/form-elements.html's section
 * wrapper: `rounded-2xl border border-gray-200 bg-white ... dark:bg-[var(--color-paper-3)]`).
 */
export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
          {title && <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>}
          {action}
        </div>
      )}
      <div className={title || action ? "border-t border-gray-100 p-5 sm:p-6 dark:border-[var(--color-rule)]" : "p-5 sm:p-6"}>
        {children}
      </div>
    </div>
  );
}

/**
 * TailAdmin's stat tile (src/partials/metric-group/metric-group-01.html
 * pattern) — used for dashboard KPI cards (Total Collections, etc.).
 */
export function CardDataStats({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { direction: "up" | "down"; label: string };
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-[var(--color-paper-2)]">
          {icon}
        </div>
      )}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
          <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${
              trend.direction === "up"
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}

export default Card;
