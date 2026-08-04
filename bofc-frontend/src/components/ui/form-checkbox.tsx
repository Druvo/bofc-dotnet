import React from "react";

/** TailAdmin Free v2.3.0 checkbox (src/form-elements.html "Checkbox Input"). */
export default function FormCheckbox({
  label,
  checked,
  onChange,
  disabled,
  id,
}: {
  label?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
      <span className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] ${
            checked ? "border-brand-500 bg-brand-500" : "border-gray-300 bg-transparent dark:border-gray-700"
          }`}
        >
          {checked && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="white"
                strokeWidth="1.94167"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
      {label && <span className="text-sm text-gray-700 dark:text-gray-400">{label}</span>}
    </label>
  );
}
