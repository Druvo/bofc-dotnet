import React from "react";

/** TailAdmin Free v2.3.0 tabs (src/tabs.html "Default Tabs" pattern). Controlled, no Radix. */
export function Tabs({
  items,
  active,
  onChange,
  className = "",
}: {
  items: { key: string; label: React.ReactNode; disabled?: boolean; disabledTitle?: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`border-b border-gray-200 dark:border-[var(--color-rule)] ${className}`}>
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            title={item.disabled ? item.disabledTitle : undefined}
            onClick={() => !item.disabled && onChange(item.key)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
              item.disabled
                ? "cursor-not-allowed border-transparent text-gray-300 dark:text-gray-700"
                : active === item.key
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Tabs;
