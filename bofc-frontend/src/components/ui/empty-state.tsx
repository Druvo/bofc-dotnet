import React from "react";
import Button from "./button";

/** Shared empty-list pattern: circular icon badge + title + one-line explanation +
 * optional primary CTA. Replaces the 4 different hand-rolled versions previously
 * duplicated across Venues/Players/MatchDays/ClubRules. */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center py-10 text-center ${className}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        {icon}
      </div>
      <div className="text-theme-sm font-semibold text-gray-700 dark:text-gray-300">{title}</div>
      {description && (
        <p className="mt-1 max-w-xs text-theme-xs text-gray-400 dark:text-gray-500">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="sm" startIcon={action.icon} onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
