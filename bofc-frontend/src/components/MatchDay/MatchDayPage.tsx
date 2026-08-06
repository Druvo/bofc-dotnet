import React from "react";
import { Navigate } from "react-router-dom";
import { CalendarOutlined } from "@ant-design/icons";
import { useGetNextActiveTournamentQuery } from "../../state/features/tournaments/tournamentsSlice";
import Loader from "../ui/loader";

// Same "next active" pick as the Dashboard's Next Match card (any upcoming/
// not-stale-ongoing tournament, not just the auto-created weekly Match Day) —
// otherwise a manually created tournament dated sooner than the recurring
// Match Day never shows up here, and once the weekly one's date passes this
// page falls back to displaying it stale/concluded instead of whatever's
// actually next.
export default function MatchDayPage() {
  const { data, isLoading } = useGetNextActiveTournamentQuery();

  if (isLoading) {
    return <Loader className="py-16" />;
  }

  const matchDay = data?.content;

  if (!matchDay) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <CalendarOutlined style={{ fontSize: 40 }} className="text-gray-300 dark:text-gray-600" />
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">No Next Match scheduled yet</h4>
        <p className="max-w-md text-theme-sm text-gray-400 dark:text-gray-500">
          The next match is created automatically based on the schedule configured in Settings. Check back after the
          next scheduled day/time, or ask an admin to verify Next Match is enabled in Settings.
        </p>
      </div>
    );
  }

  return <Navigate to={`/tournament-viewer/${matchDay.id}`} replace />;
}
