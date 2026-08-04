import React from "react";

/**
 * TailAdmin Free v2.3.0 button (src/partials/buttons/button-*.html).
 * variant/size control which of TailAdmin's exact class combinations apply —
 * no new visual patterns invented, just parameterized.
 */
type ButtonVariant = "primary" | "outline" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600",
  outline:
    "border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200",
  danger: "bg-error-500 text-white shadow-theme-xs hover:bg-error-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-theme-sm",
  md: "px-5 py-3.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  startIcon,
  endIcon,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
}
