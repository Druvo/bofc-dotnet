/** Canonical BDT currency formatter - `৳12,345.00`. Replaces the ~9 duplicated
 * inline `${'৳'}${n.toLocaleString()}`-style helpers scattered across Auction/
 * Dashboard components. */
export function formatCurrency(amount: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 2;
  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
