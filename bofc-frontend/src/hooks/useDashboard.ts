// This file is no longer needed and can be deleted
import { useGetPlayerCollectionMetricsQuery } from '../state/features/account/playerCollectionMetricsSlice';
import { PlayerMetric } from '../interfaces/IPlayerCollectionMetrics';
import { useEffect, useMemo, useState } from 'react';

export const useDashboard = () => {
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table'); // Changed default to 'table'
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Queries
  const { data: playerMetricsData, isLoading: isMetricsLoading } =
    useGetPlayerCollectionMetricsQuery();

  // Track window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter and search players
  const filteredPlayers = useMemo(() => {
    if (!playerMetricsData?.content?.metrics) return [];

    let filtered = [...playerMetricsData.content.metrics];

    // Filter based on search
    if (searchTerm) {
      filtered = filtered.filter((player) =>
        player.playerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply additional filters
    if (activeFilter === "active") {
      filtered = filtered.filter((player) => {
        const currentYearData = player.yearMonthAmount[selectedYear.toString()];
        return currentYearData && currentYearData[selectedMonth.toString()] > 0;
      });
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((player) => {
        const currentYearData = player.yearMonthAmount[selectedYear.toString()];
        return !currentYearData || !(currentYearData[selectedMonth.toString()] > 0);
      });
    } else if (activeFilter === "high") {
      filtered = filtered.filter((player) => {
        const totalContribution = Object.keys(player.yearMonthAmount).reduce(
          (total, year) => {
            return (
              total +
              Object.values(player.yearMonthAmount[year]).reduce(
                (sum, amount) => sum + amount,
                0
              )
            );
          },
          0
        );
        return totalContribution > 10000;
      });
    }

    return filtered;
  }, [playerMetricsData, searchTerm, activeFilter, selectedMonth, selectedYear]);

  // Pagination
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPlayers.slice(startIndex, endIndex);
  }, [filteredPlayers, currentPage, pageSize]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, selectedMonth, selectedYear]);

  // Statistics calculations
  const statistics = useMemo(() => {
    if (!playerMetricsData?.content?.metrics) {
      return {
        totalPlayers: 0,
        activePlayers: 0,
        totalContributions: 0,
        averagePerPlayer: 0,
        monthlyContribution: 0
      };
    }

    const metrics = playerMetricsData.content.metrics;
    const activePlayers = metrics.filter((player) => {
      const currentYearData = player.yearMonthAmount[selectedYear.toString()];
      return currentYearData && currentYearData[selectedMonth.toString()] > 0;
    }).length;

    // Calculate monthly contribution
    let monthlyTotal = 0;
    metrics.forEach(player => {
      const yearData = player.yearMonthAmount[selectedYear.toString()];
      if (yearData && yearData[selectedMonth.toString()]) {
        monthlyTotal += yearData[selectedMonth.toString()];
      }
    });

    const totalContributions = metrics.reduce((total, player) => {
      return (
        total +
        Object.keys(player.yearMonthAmount).reduce((yearTotal, year) => {
          return (
            yearTotal +
            Object.values(player.yearMonthAmount[year]).reduce(
              (sum, amount) => sum + amount,
              0
            )
          );
        }, 0)
      );
    }, 0);

    return {
      totalPlayers: metrics.length,
      activePlayers,
      totalContributions,
      averagePerPlayer:
        metrics.length > 0 ? totalContributions / metrics.length : 0,
      monthlyContribution: monthlyTotal
    };
  }, [playerMetricsData, selectedMonth, selectedYear]);

  // Transform players data for table view
  const tableData = useMemo(() => {
    return filteredPlayers.map(player => {
      const currentYearData = player.yearMonthAmount[selectedYear.toString()];
      const currentMonthAmount = currentYearData ? currentYearData[selectedMonth.toString()] || 0 : 0;
      
      const totalContribution = Object.keys(player.yearMonthAmount).reduce((total, year) => {
        return total + Object.values(player.yearMonthAmount[year]).reduce(
          (sum, amount) => sum + amount, 0
        );
      }, 0);

      const activeMonths = Object.keys(player.yearMonthAmount).reduce((count, year) => {
        return count + Object.values(player.yearMonthAmount[year])
          .filter(amount => amount > 0).length;
      }, 0);

      return {
        key: player.playerId,
        playerId: player.playerId,
        playerName: player.playerName,
        currentMonthAmount,
        totalContribution,
        activeMonths,
        status: currentMonthAmount > 0 ? 'Active' : 'Inactive',
        player: player
      };
    });
  }, [filteredPlayers, selectedMonth, selectedYear]);

  return {
    // States
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    viewMode,
    setViewMode,
    windowWidth,
    
    // Data
    playerMetricsData,
    isMetricsLoading,
    filteredPlayers,
    paginatedPlayers,
    statistics,
    tableData
  };
};
