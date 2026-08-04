import React from "react";

/** TailAdmin Free v2.3.0 toggle switch (src/form-elements.html "Toggle switch input"). */
export default function FormSwitch({
  label,
  checked,
  onChange,
  disabled,
  color = "brand",
}: {
  label?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: "brand" | "gray";
}) {
  return (
    <label className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-400 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
      {label}
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block h-6 w-11 rounded-full transition ${checked ? (color === "brand" ? "bg-brand-500" : "bg-gray-800") : "bg-gray-200 dark:bg-white/10"}`} />
        <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
    </label>
  );
}
