import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import { PlayerMetric } from '../../interfaces/IPlayerCollectionMetrics';
import { isChasedForDues } from '../../utils/paymentDues';
import IPlayer from '../../interfaces/IPlayer';
import Avatar from '../CommonAtoms/Avatar';
import { toAbsolutePlayerPhotoUrl } from '../../utils/playerPhotoUtils';
import FormSelect from '../ui/form-select';

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface PlayerCollectionMobileViewProps {
  dataSource: any[];
  metrics: PlayerMetric[];
  selectedYear: number | null;
  currentYear: number;
  currentMonth: number;
  isDarkMode?: boolean;
  years?: number[];
  onYearChange?: (year: number) => void;
  isLoading?: boolean;
  playersById?: Record<number, IPlayer>;
  onCellClick?: (playerId: number, playerName: string, month: number) => void;
}

const monthCellClasses = {
  due: 'border-error-500/40 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500',
  current: 'border-brand-500/40 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  paid: 'border-success-500/40 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
  empty: 'border-gray-100 bg-gray-50 text-gray-400 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)] dark:text-gray-600',
};

const PlayerCollectionMobileView: React.FC<PlayerCollectionMobileViewProps> = ({
  dataSource,
  metrics,
  selectedYear,
  currentYear,
  currentMonth,
  years = [],
  onYearChange,
  isLoading = false,
  playersById = {},
  onCellClick,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
      <div className="col-span-full flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
          <FormSelect
            className="!h-9 w-20"
            value={selectedYear || ''}
            disabled={isLoading}
            onChange={(e) => onYearChange?.(Number(e.target.value))}
            options={years.map((y) => ({ value: y, label: String(y) }))}
          />
        </div>
        <div className="flex flex-1 items-center justify-center gap-3 text-theme-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-500" />Paid</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" />Current</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-error-500" />Due</span>
        </div>
      </div>

      {dataSource.map((player, index) => {
        const playerData = metrics.find((p: PlayerMetric) => p.playerId === player.key);
        const isChased = isChasedForDues(playerData);

        const photoUrl = playersById[player.key]?.photoUrl;

        return (
          <div key={player.key} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar src={toAbsolutePlayerPhotoUrl(photoUrl)} name={player.playerName} seed={player.key} size={28} />
                <div>
                  <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{player.playerName}</span>
                  {playerData?.paused && (
                    <span
                      title="Temporarily away - not being chased for dues"
                      className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400"
                    >
                      Paused
                    </span>
                  )}
                  <span className="ml-2 text-theme-xs text-gray-400 dark:text-gray-500">{selectedYear}</span>
                </div>
              </div>
              <span className="text-theme-xs text-gray-400 dark:text-gray-500">#{index + 1}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {monthNames.map((month, idx) => {
                const monthNumber = idx + 1;
                const amount = player[`month_${monthNumber}`] || 0;
                const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
                const showDue = isCurrentCell && amount <= 0 && isChased;

                let variant: keyof typeof monthCellClasses = 'empty';
                if (showDue) variant = 'due';
                else if (isCurrentCell && amount > 0) variant = 'current';
                else if (amount > 0) variant = 'paid';

                return (
                  <button
                    type="button"
                    key={monthNumber}
                    onClick={() => onCellClick?.(player.key, player.playerName, monthNumber)}
                    className={`rounded-lg border px-1.5 py-1.5 text-center ${monthCellClasses[variant]}`}
                  >
                    <div className="text-[10px] font-medium uppercase">{month}</div>
                    <div className="text-theme-xs font-semibold">
                      {showDue ? 'Due' : (amount > 0 ? amount.toFixed(0) : '-')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerCollectionMobileView;
