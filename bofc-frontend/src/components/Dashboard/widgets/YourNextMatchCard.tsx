import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { TeamOutlined, CrownOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import {
  useGetLatestMatchDayWithUserStatusQuery,
  useGetMatchDaySummaryQuery,
} from "../../../state/features/matchDays/matchDaysSlice";
import Loader from "../../ui/loader";

const formatPosition = (position?: string) =>
  !position || position === "UNASSIGNED"
    ? "Unassigned"
    : position
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

// "What's my role in the next match?" - the one thing LatestMatchDayCard
// doesn't answer (it covers the MatchDay itself and RSVP, not the logged-in
// player's own team/position/captaincy once teams are drafted).
const YourNextMatchCard: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const { data: latestMatchDayData, isLoading: isLoadingMatchDay } = useGetLatestMatchDayWithUserStatusQuery();
  const matchDayId = latestMatchDayData?.content?.matchDay?.id;

  const { data: summaryData, isLoading: isLoadingSummary } = useGetMatchDaySummaryQuery(
    { matchDayId: matchDayId ?? 0 },
    { skip: !matchDayId }
  );

  const teams = summaryData?.content?.[0]?.teams || [];
  const teamsDrafted = teams.length > 0;

  const myAssignment = useMemo(() => {
    for (const team of teams) {
      const me = team.players.find((p) => String(p.playerId) === String(loginInfo.userId));
      if (me) return { team, player: me };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryData, loginInfo.userId]);

  // No upcoming MatchDay at all - LatestMatchDayCard already shows that
  // empty state, no need to duplicate it here.
  if (!isLoadingMatchDay && !matchDayId) return null;

  const isGoalkeeper = myAssignment?.player.playingPosition === "GOALKEEPER";
  const isCaptain = !!myAssignment?.player.isCaptain;

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <TeamOutlined />
        Your Next Match
      </div>

      {isLoadingMatchDay || isLoadingSummary ? (
        <Loader className="py-4" />
      ) : !teamsDrafted ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">
          Teams haven&apos;t been drafted for this Match Day yet.
        </p>
      ) : !myAssignment ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">
          Teams are set for this Match Day, but you&apos;re not on one - check your RSVP.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-theme-xs text-gray-400 dark:text-gray-500">Team</div>
              <div className="text-theme-md font-bold text-gray-800 dark:text-white/90">{myAssignment.team.teamName}</div>
            </div>
            <div className="text-right">
              <div className="text-theme-xs text-gray-400 dark:text-gray-500">Position</div>
              <div className="text-theme-sm font-semibold text-gray-700 dark:text-gray-300">
                {formatPosition(myAssignment.player.playingPosition)}
              </div>
            </div>
          </div>

          {(isCaptain || isGoalkeeper) && (
            <div className="flex flex-wrap gap-2">
              {isCaptain && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-theme-xs font-semibold text-warning-600 dark:bg-warning-500/15 dark:text-warning-500">
                  <CrownOutlined /> Captain
                </span>
              )}
              {isGoalkeeper && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <SafetyCertificateOutlined /> Goalkeeper
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
            <UserOutlined /> {myAssignment.team.players.length} players on your team
          </div>

          <Link
            to={`/match-days/team-building/${matchDayId}`}
            className="text-theme-xs font-medium text-brand-500 hover:underline"
          >
            View squad &rarr;
          </Link>
        </div>
      )}
    </div>
  );
};

export default YourNextMatchCard;
