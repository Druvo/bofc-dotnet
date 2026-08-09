import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

interface FormatCurrencyProps {
  amount: number;
}

const FormatCurrencyWithSymbol: React.FC<FormatCurrencyProps> = ({ amount }) => {
  return <span>{formatCurrency(amount)}</span>;
};

export default FormatCurrencyWithSymbol;
