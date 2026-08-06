import React, { useMemo, useState } from "react";
import { CalendarOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetTournamentsQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { getEffectiveTournamentStatus } from "../../../utils/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Local-date key (not toISOString, which UTC-converts and shifts the date
// by a day in any positive-offset timezone, e.g. Asia/Dhaka +6).
const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Lightweight month grid — antd's <Calendar> pulled in a whole grid/picker
// subsystem for what this widget only ever needed: current month, a dot on
// days with a match, click-through to that match.
const MatchCalendarWidget: React.FC = () => {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => new Date());
  const { data } = useGetTournamentsQuery({
    offSet: 0,
    pageSize: 50,
    sortedBy: "tournamentDate",
    sortDirection: "ASC",
  });

  const byDate = useMemo(() => {
    const map = new Map<string, { id: number; name: string }[]>();
    (data?.content?.tournaments || [])
      .filter((t) => {
        const status = getEffectiveTournamentStatus(t.tournamentStatus, t.tournamentDate, t.durationMinutes);
        return status === "UPCOMING" || status === "ONGOING";
      })
      .forEach((t) => {
        const key = localDateKey(new Date(t.tournamentDate));
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
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <CalendarOutlined /> Match Calendar
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
          return (
            <button
              key={d}
              type="button"
              disabled={!matches?.length}
              title={matches?.map((m) => m.name).join(", ")}
              onClick={() => matches?.length && navigate(`/tournaments/join-tournament/${matches[0].id}`)}
              className={`mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-full text-theme-xs ${
                isToday(d) ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              } ${matches?.length ? "cursor-pointer font-semibold" : "cursor-default"}`}
            >
              {d}
              {matches?.length ? (
                <span className={`-mt-0.5 h-1 w-1 rounded-full ${isToday(d) ? "bg-white" : "bg-brand-500"}`} />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MatchCalendarWidget;
