import React, { useMemo, useState } from "react";
import { CalendarOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetMatchDaysQuery } from "../../../state/features/matchDays/matchDaysSlice";
import { getEffectiveMatchDayStatus } from "../../../utils/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Local-date key (not toISOString, which UTC-converts and shifts the date
// by a day in any positive-offset timezone, e.g. Asia/Dhaka +6).
const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Lightweight month grid - antd's <Calendar> pulled in a whole grid/picker
// subsystem for what this widget only ever needed: current month, a dot on
// days with a Match Day, click-through to that Match Day.
const MatchCalendarWidget: React.FC = () => {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => new Date());
  const { data } = useGetMatchDaysQuery({
    offSet: 0,
    pageSize: 50,
    sortedBy: "matchDayDate",
    sortDirection: "ASC",
  });

  const byDate = useMemo(() => {
    const map = new Map<string, { id: number; name: string }[]>();
    (data?.content?.matchDays || [])
      .filter((t) => {
        const status = getEffectiveMatchDayStatus(t.matchDayStatus, t.matchDayDate, t.durationMinutes);
        return status === "UPCOMING" || status === "ONGOING";
      })
      .forEach((t) => {
        const key = localDateKey(new Date(t.matchDayDate));
        const list = map.get(key) || [];
        list.push({ id: t.id, name: t.name });
        map.set(key, list);
      });
    return map;
  }, [data]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const dateKey = (d: number) => localDateKey(new Date(year, month, d));

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <CalendarOutlined /> Match Day Calendar
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <LeftOutlined className="text-[10px]" />
          </button>
          <span className="w-20 text-center text-theme-xs font-medium text-gray-700 dark:text-gray-300">
            {cursor.toLocaleString("default", { month: "short", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <RightOutlined className="text-[10px]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <div key={`${w}-${i}`} className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const matches = byDate.get(dateKey(d));
          const hasMatch = !!matches?.length;
          const today = isToday(d);
          return (
            <div key={d} className="relative mx-auto h-8 w-8">
              <button
                type="button"
                disabled={!hasMatch}
                title={matches?.map((m) => m.name).join(", ")}
                onClick={() => hasMatch && navigate(`/match-days/join-match-day/${matches[0].id}`)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-theme-xs transition ${
                  today
                    ? "bg-brand-500 text-white font-bold"
                    : hasMatch
                    ? "border-2 border-brand-500 bg-brand-50 font-bold text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                } ${hasMatch ? "cursor-pointer" : "cursor-default"} ${today && hasMatch ? "ring-2 ring-warning-400 ring-offset-1 dark:ring-offset-[var(--color-paper-3)]" : ""}`}
              >
                {d}
              </button>
              {hasMatch && (
                <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] leading-none dark:bg-[var(--color-paper-3)]">
                  ⚽
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchCalendarWidget;
