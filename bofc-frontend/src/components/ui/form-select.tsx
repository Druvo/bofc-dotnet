import React from "react";

/** TailAdmin Free v2.3.0 select (src/form-elements.html "Select Input"). */
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string | number; label: string }[];
}

export default function FormSelect({ label, error, hint, placeholder, options, id, className = "", ...rest }: FormSelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          // py-0, not py-2.5: a select centres its text in the content box, so at the
          // default h-11 this renders identically - but vertical padding eats the content
          // box, and callers that shrink the control (!h-9) were left with 14.4px for a
          // 20px line-height, clipping the descenders. Keeping the padding at zero means
          // a height override is all a caller needs.
          className={`h-11 w-full appearance-none rounded-lg border px-4 py-0 pr-9 text-sm shadow-theme-xs focus:outline-none focus:ring-3 dark:bg-[var(--color-paper-3)] ${
            error
              ? "border-error-500 focus:border-error-300 focus:ring-error-500/10 dark:border-error-500 dark:focus:border-error-800"
              : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90 dark:focus:border-brand-800"
          } ${className}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? (
        <p className="mt-1.5 text-theme-xs text-error-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}
