import React from "react";

/** TailAdmin Free v2.3.0 loader (src/loader.html spinner ring). */
export default function Loader({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="animate-spin rounded-full border-4 border-brand-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-500"
      />
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}
