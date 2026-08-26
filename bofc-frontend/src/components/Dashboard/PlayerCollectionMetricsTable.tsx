import React, { useState, useMemo } from "react";
import {
  TableOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../state/features/account/playerCollectionMetricsSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { PlayerMetric } from "../../interfaces/IPlayerCollectionMetrics";
import IPlayer from "../../interfaces/IPlayer";
import PlayerCollectionMobileView from "./PlayerCollectionMobileView";
import LogPaymentModal from "./LogPaymentModal";
import Avatar from "../CommonAtoms/Avatar";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import FormSelect from "../ui/form-select";
import Loader from "../ui/loader";
import useIsMobile from "../../hooks/useIsMobile";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type FilterType = "all" | "active" | "inactive";
type SortOrder = "ascend" | "descend" | null;

interface TableRow {
  key: number;
  index: number;
  playerName: string;
  [key: string]: any; // for month_1 ... month_12
}

interface PlayerCollectionMetricsProps {
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  className?: string;
  isDarkMode?: boolean;
}

const segmentBtn = (active: boolean) =>
  `flex items-center gap-1.5 px-3 py-1.5 text-theme-xs font-medium transition ${
    active
      ? "bg-brand-500 text-white"
      : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;

const PlayerCollectionMetrics: React.FC<PlayerCollectionMetricsProps> = ({
  selectedYear: propSelectedYear,
  onYearChange,
}) => {
  const [internalSelectedYear, setInternalSelectedYear] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'cards' | 'table'>('table');

  React.useEffect(() => {
    setMobileView(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const selectedYear = propSelectedYear || internalSelectedYear;

  const { data, isLoading } = useGetPlayerCollectionMetricsQuery(
    selectedYear ? { year: selectedYear } : undefined
  );

  const metrics = data?.content?.metrics || [];
  const years = data?.content?.years || [];

  // The metrics endpoint returns amounts only, no photo - join against the player list
  // (already cached app-wide) client-side for the avatar column instead of a backend change.
  const { data: playersData } = useGetPlayersQuery();
  const playersById = useMemo(() => {
    const map: Record<number, IPlayer> = {};
    (playersData?.content || []).forEach((p) => { map[p.id] = p; });
    return map;
  }, [playersData]);

  const [logPaymentFor, setLogPaymentFor] = useState<{ playerId: number; playerName: string; photoUrl?: string; month: number } | null>(null);
  const openLogPayment = (playerId: number, playerName: string, month: number) => {
    setLogPaymentFor({ playerId, playerName, photoUrl: playersById[playerId]?.photoUrl, month });
  };

  React.useEffect(() => {
    if (!selectedYear && years.length > 0) {
      const defaultYear = [...years].sort((a, b) => b - a)[0];
      if (propSelectedYear === undefined) {
        setInternalSelectedYear(defaultYear);
      } else if (onYearChange) {
        onYearChange(defaultYear);
      }
    }
  }, [years, selectedYear, propSelectedYear, onYearChange]);

  const handleYearChange = (year: number) => {
    if (propSelectedYear === undefined) {
      setInternalSelectedYear(year);
    }
    if (onYearChange) {
      onYearChange(year);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("ascend");
    } else if (sortOrder === "ascend") {
      setSortOrder("descend");
    } else if (sortOrder === "descend") {
      setSortField(null);
      setSortOrder(null);
    } else {
      setSortOrder("ascend");
    }
  };

  const filteredMetrics = useMemo(() => {
    return metrics.filter((player: PlayerMetric) => {
      if (filter === "all") return true;
      if (filter === "active") return player.active === true;
      if (filter === "inactive") return player.active === false;
      return true;
    });
  }, [metrics, filter]);

  const dataSource: TableRow[] = useMemo(() => {
    const rows = filteredMetrics.map((player: PlayerMetric, idx: number) => {
      const row: TableRow = {
        key: player.playerId,
        playerName: player.playerName,
        index: idx + 1,
      };
      const monthData = player.yearMonthAmount[selectedYear?.toString() || ""] || {};
      for (let i = 1; i <= 12; i++) {
        row[`month_${i}`] = monthData[i] || 0;
      }
      return row;
    });

    if (!sortField || !sortOrder) return rows;

    const sorted = [...rows].sort((a, b) => {
      if (sortField === "playerName") return a.playerName.localeCompare(b.playerName);
      return (a[sortField] || 0) - (b[sortField] || 0);
    });
    return sortOrder === "descend" ? sorted.reverse() : sorted;
  }, [filteredMetrics, selectedYear, sortField, sortOrder]);

  const monthlyTotals = useMemo(
    () =>
      monthNames.map((_, idx) =>
        dataSource.reduce((sum, row) => sum + (Number(row[`month_${idx + 1}`]) || 0), 0)
      ),
    [dataSource]
  );

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 inline-flex flex-col leading-none">
      <CaretUpOutlined className={`text-[9px] ${sortField === field && sortOrder === "ascend" ? "text-brand-500" : "text-gray-300 dark:text-gray-600"}`} />
      <CaretDownOutlined className={`-mt-0.5 text-[9px] ${sortField === field && sortOrder === "descend" ? "text-brand-500" : "text-gray-300 dark:text-gray-600"}`} />
    </span>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-theme-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-[var(--color-rule)]">
            <th
              onClick={() => toggleSort("playerName")}
              className="sticky left-0 z-10 min-w-[190px] cursor-pointer whitespace-nowrap bg-white px-3 py-2.5 text-left font-semibold text-gray-500 dark:bg-[var(--color-paper-3)] dark:text-gray-400"
            >
              Player <SortIcon field="playerName" />
            </th>
            {monthNames.map((month, idx) => (
              <th
                key={month}
                onClick={() => toggleSort(`month_${idx + 1}`)}
                className="min-w-[64px] cursor-pointer whitespace-nowrap px-2 py-2.5 text-center font-semibold text-gray-500 dark:text-gray-400"
              >
                {month} <SortIcon field={`month_${idx + 1}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {dataSource.map((record) => {
            const player = playersById[record.key];
            return (
              <tr key={record.key} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 dark:bg-[var(--color-paper-3)]">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={toAbsolutePlayerPhotoUrl(player?.photoUrl)} name={record.playerName} seed={record.key} size={30} />
                    <span className="font-semibold text-gray-800 dark:text-white/90">{record.playerName}</span>
                  </div>
                </td>
                {monthNames.map((_, idx) => {
                  const monthNumber = idx + 1;
                  const amount = record[`month_${monthNumber}`] || 0;
                  const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
                  const playerData = metrics.find((p: PlayerMetric) => p.playerId === record.key);
                  const isActive = playerData?.active ?? false;
                  const showDue = isCurrentCell && amount <= 0 && isActive;
                  return (
                    <td
                      key={monthNumber}
                      onClick={() => selectedYear && openLogPayment(record.key, record.playerName, monthNumber)}
                      title="Click to view/log payments for this month"
                      className={`cursor-pointer px-2 py-2 text-center tabular-nums text-gray-600 hover:ring-1 hover:ring-inset hover:ring-brand-300 dark:text-gray-300 ${showDue ? "bg-warning-50 dark:bg-warning-500/10" : ""}`}
                    >
                      {showDue ? <span className="font-bold text-warning-600 dark:text-orange-400">Due</span> : amount > 0 ? amount.toFixed(0) : <span className="text-gray-300 dark:text-gray-700">-</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 font-bold dark:border-[var(--color-rule)]">
            <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-gray-800 dark:bg-[var(--color-paper-3)] dark:text-white/90">
              Total ({dataSource.length})
            </td>
            {monthlyTotals.map((total, idx) => (
              <td key={monthNames[idx]} className="px-2 py-2.5 text-center tabular-nums text-gray-800 dark:text-white/90">
                {total > 0 ? total.toFixed(0) : ""}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      {/* Toolbar */}
      <div className="border-b border-gray-100 px-5 py-4 dark:border-[var(--color-rule)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 rounded bg-brand-500" />
            <BarChartOutlined className="text-brand-500 dark:text-brand-400" />
            <h5 className="text-base font-bold text-gray-800 dark:text-white/90">Monthly Contributions</h5>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              {dataSource.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <FormSelect
              className="!h-9 w-[90px]"
              value={selectedYear || ''}
              disabled={isLoading}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              options={years.map((year: number) => ({ value: year, label: String(year) }))}
            />
            <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-[var(--color-rule)]">
              <button type="button" disabled={isLoading} onClick={() => setFilter("all")} className={segmentBtn(filter === "all")}>
                <TeamOutlined /> All
              </button>
              <button type="button" disabled={isLoading} onClick={() => setFilter("active")} className={segmentBtn(filter === "active")}>
                <UserAddOutlined /> Active
              </button>
              <button type="button" disabled={isLoading} onClick={() => setFilter("inactive")} className={segmentBtn(filter === "inactive")}>
                <UserDeleteOutlined /> Inactive
              </button>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-[var(--color-rule)]">
              <button type="button" onClick={() => setMobileView('cards')} className={segmentBtn(mobileView === "cards")}>
                <AppstoreOutlined /> Cards
              </button>
              <button type="button" onClick={() => setMobileView('table')} className={segmentBtn(mobileView === "table")}>
                <TableOutlined /> Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loader className="py-8" />
      ) : mobileView === 'cards' ? (
        <PlayerCollectionMobileView
          dataSource={dataSource}
          metrics={metrics}
          selectedYear={selectedYear}
          currentYear={currentYear}
          currentMonth={currentMonth}
          years={years}
          onYearChange={handleYearChange}
          isLoading={isLoading}
          playersById={playersById}
          onCellClick={(playerId, playerName, month) => selectedYear && openLogPayment(playerId, playerName, month)}
        />
      ) : (
        <div className="p-4">{renderTable()}</div>
      )}

      {logPaymentFor && selectedYear && (
        <LogPaymentModal
          playerId={logPaymentFor.playerId}
          playerName={logPaymentFor.playerName}
          photoUrl={logPaymentFor.photoUrl}
          month={logPaymentFor.month}
          year={selectedYear}
          onClose={() => setLogPaymentFor(null)}
        />
      )}
    </div>
  );
};

export default PlayerCollectionMetrics;
