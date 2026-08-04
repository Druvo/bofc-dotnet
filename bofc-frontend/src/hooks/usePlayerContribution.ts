import { useMemo, useState } from 'react';
import { PlayerMetric } from '../interfaces/IPlayerCollectionMetrics';

interface ContributionRecord {
  key: string;
  month: string;
  year: string;
  amount: number;
}

// Helper to get month name
const getMonthName = (monthNum: string): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[parseInt(monthNum) - 1];
};

export const usePlayerContribution = (player: PlayerMetric | null) => {
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  // Transform player data into table format
  const allContributionData = useMemo(() => {
    if (!player) return [];
    
    const data: ContributionRecord[] = [];
    Object.keys(player.yearMonthAmount).forEach(year => {
      Object.keys(player.yearMonthAmount[year]).forEach(month => {
        const amount = player.yearMonthAmount[year][month];
        data.push({
          key: `${year}-${month}`,
          month: getMonthName(month),
          year,
          amount
        });
      });
    });
    return data;
  }, [player]);

  // Get available years
  const availableYears = useMemo(() => {
    if (!player) return [];
    return Object.keys(player.yearMonthAmount).sort((a, b) => parseInt(b) - parseInt(a));
  }, [player]);

  // Filter by year if specified
  const filteredData = useMemo(() => {
    if (selectedYear === 'all') return allContributionData;
    return allContributionData.filter(record => record.year === selectedYear);
  }, [selectedYear, allContributionData]);

  // Sort by year and month (newest first)
  const contributionData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (a.year !== b.year) {
        return parseInt(b.year) - parseInt(a.year);
      }
      // Extract month number from key
      const aMonth = parseInt(a.key.split('-')[1]);
      const bMonth = parseInt(b.key.split('-')[1]);
      return bMonth - aMonth;
    });
  }, [filteredData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalContribution = contributionData.reduce((sum, record) => sum + record.amount, 0);
    const paidMonths = contributionData.filter(record => record.amount > 0).length;
    
    return {
      totalContribution,
      paidMonths,
      totalRecords: contributionData.length
    };
  }, [contributionData]);

  return {
    selectedYear,
    setSelectedYear,
    availableYears,
    contributionData,
    statistics
  };
};
