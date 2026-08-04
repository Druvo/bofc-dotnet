import React from "react";

// Thousands-separated, 2-decimal money formatting for account reports.
export const fmtMoney = (value: number | null | undefined): string =>
    (value ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

// Right-aligned tabular figure. When `colored` is set, positive values read
// green, negative red, and zero muted — used for balance columns.
export const amountCell = (value: number, colored = false): React.ReactNode => {
    const v = value ?? 0;
    const tone = !colored
        ? ""
        : v > 0
        ? "bofc-amount--pos"
        : v < 0
        ? "bofc-amount--neg"
        : "bofc-amount--muted";
    return <span className={`bofc-amount ${tone}`}>{fmtMoney(v)}</span>;
};

// Accounting natures / account types mapped to pill tones.
export const NATURE_TONE: Record<string, string> = {
    INCOME: "active",
    EXPENSE: "inactive",
    ASSET: "gold",
    LIABILITY: "neutral",
    EQUITY: "neutral",
};

export const natureTone = (type: string): string =>
    NATURE_TONE[(type || "").toUpperCase()] || "neutral";
