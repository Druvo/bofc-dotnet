import React from "react";

/**
 * TailAdmin Free v2.3.0 table primitives (src/partials/table/table-01.html,
 * src/basic-tables.html). Thin wrapper components - callers compose
 * <Table><TableHead>...<TableRow><TableCell>...
 */
export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`min-w-full ${className}`}>{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-y border-gray-100 dark:border-[var(--color-rule)]">{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`py-3 ${className}`}>
      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{children}</p>
    </th>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>;
}

export function TableRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]" : undefined}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`py-3 ${className}`}>
      <div className="flex items-center">{children}</div>
    </td>
  );
}

export default Table;
