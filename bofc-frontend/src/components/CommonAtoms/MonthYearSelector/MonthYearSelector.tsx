import React from 'react';

interface MonthYearSelectorProps {
  onChange: (month: number, year: number) => void;
  defaultMonth?: number;
  defaultYear?: number;
}

const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  onChange,
  defaultMonth,
  defaultYear
}) => {
  const currentDate = new Date();
  const initialYear = defaultYear || currentDate.getFullYear();
  const initialMonth = defaultMonth !== undefined ? defaultMonth : currentDate.getMonth() + 1;

  const defaultValue = `${initialYear}-${String(initialMonth).padStart(2, "0")}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // "YYYY-MM"
    if (!value) return;
    const [year, month] = value.split("-").map(Number);
    onChange(month, year);
  };

  return (
    <input
      type="month"
      defaultValue={defaultValue}
      onChange={handleChange}
      className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
    />
  );
};

export default MonthYearSelector;
