import React from "react";

/** TailAdmin Free v2.3.0 form input (src/form-elements.html "Default Input"). */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

export default function FormInput({ label, error, hint, id, className = "", ...rest }: FormInputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 dark:bg-[var(--color-paper-3)] dark:placeholder:text-white/30 ${
          error
            ? "border-error-500 focus:border-error-300 focus:ring-error-500/10 dark:border-error-500 dark:focus:border-error-800"
            : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90 dark:focus:border-brand-800"
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-theme-xs text-error-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}
