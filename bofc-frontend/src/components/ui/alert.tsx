import React from "react";

/** TailAdmin Free v2.3.0 alert (src/partials/alert/alert-error.html + siblings). */
type AlertVariant = "success" | "error" | "warning" | "info";

const variantConfig: Record<AlertVariant, { wrap: string; title: string; icon: React.ReactNode }> = {
  success: {
    wrap: "border-success-500 bg-success-50 dark:border-success-500/30 dark:bg-success-500/15",
    title: "text-success-800 dark:text-success-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="fill-success-500">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm4.03-11.97a.75.75 0 0 0-1.06-1.06L10.5 13.44l-2.47-2.47a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l5-5Z" />
      </svg>
    ),
  },
  error: {
    wrap: "border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15",
    title: "text-error-800 dark:text-error-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="fill-error-500">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm1 5a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0V7Zm-1 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
      </svg>
    ),
  },
  warning: {
    wrap: "border-warning-500 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/15",
    title: "text-warning-800 dark:text-orange-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="fill-warning-500">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
      </svg>
    ),
  },
  info: {
    wrap: "border-blue-light-500 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/15",
    title: "text-blue-light-800 dark:text-blue-light-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="fill-blue-light-500">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z" />
      </svg>
    ),
  },
};

export default function Alert({
  variant = "info",
  title,
  children,
  className = "",
}: {
  variant?: AlertVariant;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const cfg = variantConfig[variant];
  return (
    <div className={`rounded-xl border p-4 ${cfg.wrap} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="-mt-0.5">{cfg.icon}</div>
        <div>
          <h4 className={`mb-1 text-sm font-semibold ${cfg.title}`}>{title}</h4>
          {children && <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>}
        </div>
      </div>
    </div>
  );
}
