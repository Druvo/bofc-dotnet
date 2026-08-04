import React from 'react';

interface FormatCurrencyProps {
  amount: number;
  currency?: string; // Optional if you want to extend it for other currencies in the future
}

const FormatCurrencyWithSymbol: React.FC<FormatCurrencyProps> = ({ amount, currency = 'BDT' }) => {
  const formatCurrencyWithSymbol = (amount: number, currency: string) => {
    const formattedAmount = new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);

    // Replace "BDT" with the symbol "৳" for Bangladeshi Taka
    return formattedAmount.replace('BDT', '৳');
  };

  return <span>{formatCurrencyWithSymbol(amount, currency)}</span>;
};

export default FormatCurrencyWithSymbol;
