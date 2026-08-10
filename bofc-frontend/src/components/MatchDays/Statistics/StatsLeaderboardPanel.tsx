import React, { useMemo } from "react";
import {
  EditOutlined,
  FireOutlined,
  ReloadOutlined,
  RiseOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  useAggregateMatchDayStatisticsMutation,
  useGetPlayerStatisticsQuery,
} from "../../../state/features/statistics/statisticsSlice";
import { useGetFixturesQuery } from "../../../state/features/fixtures/fixturesSlice";
import { useGetMatchDaySummaryQuery } from "../../../state/features/matchDays/matchDaysSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import type { IPlayerStatisticsData } from "../../../state/features/statistics/statisticsTypes";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import Button from "../../ui/button";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";
import Avatar from "../../CommonAtoms/Avatar";
import AlertBox from "../../ui/alert";

interface StatsLeaderboardPanelProps {
  matchDayId: number;
  isActive?: boolean;
  weeklyMatchDaysOnly?: boolean;
}

interface LeaderboardRow {
  key: string;
  playerName: string;
  teamName: string;
  value: number;
  photoUrl?: string;
}

const playerKey = (playerId: string | number | undefined | null): string =>
  String(playerId ?? "");

const rankAvatarColor = (rank: number) => {
  if (rank === 1) return "#d4af37";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#b87333";
  return "#1677ff";
};

const buildScorerRows = (
  players: IPlayerStatisticsData[] = [],
  teamLookup: Map<string, string>,
  playerPhotoLookup: Map<string, string>
): LeaderboardRow[] =>
  players
    .filter((player) => player.statistics.goalsScored > 0)
    .sort((left, right) => right.statistics.goalsScored - left.statistics.goalsScored)
    .map((player) => ({
      key: `scorer-${player.playerId}`,
      playerName: player.playerName,
      teamName: teamLookup.get(playerKey(player.playerId)) || "-",
      value: player.statistics.goalsScored,
      photoUrl: playerPhotoLookup.get(playerKey(player.playerId)),
    }));

const buildAssistRows = (
  players: IPlayerStatisticsData[] = [],
  teamLookup: Map<string, string>,
  playerPhotoLookup: Map<string, string>
): LeaderboardRow[] =>
  players
    .filter((player) => player.statistics.assists > 0)
    .sort((left, right) => right.statistics.assists - left.statistics.assists)
    .map((player) => ({
      key: `assist-${player.playerId}`,
      playerName: player.playerName,
      teamName: teamLookup.get(playerKey(player.playerId)) || "-",
      value: player.statistics.assists,
      photoUrl: playerPhotoLookup.get(playerKey(player.playerId)),
    }));

const buildCardRows = (
  players: IPlayerStatisticsData[] = [],
  teamLookup: Map<string, string>,
  playerPhotoLookup: Map<string, string>,
  cardType: "yellow" | "red"
): LeaderboardRow[] => {
  const readValue = (player: IPlayerStatisticsData) =>
    cardType === "yellow"
      ? player.statistics.yellowCards
      : player.statistics.redCards;

  return players
    .filter((player) => readValue(player) > 0)
    .sort((left, right) => {
      const difference = readValue(right) - readValue(left);
      if (difference !== 0) {
        return difference;
      }

      if (cardType === "yellow") {
        return right.statistics.redCards - left.statistics.redCards;
      }

      return right.statistics.yellowCards - left.statistics.yellowCards;
    })
    .map((player) => ({
      key: `${cardType}-${player.playerId}`,
      playerName: player.playerName,
      teamName: teamLookup.get(playerKey(player.playerId)) || "-",
      value: readValue(player),
      photoUrl: playerPhotoLookup.get(playerKey(player.playerId)),
    }));
};

interface CompletedMatch {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number;
  awayTeamScore: number;
}

function LeaderboardSection({
  title,
  icon,
  rows,
  loading,
  error,
  emptyMessage,
  valueTitle,
  accentColor,
  completedMatches,
  onNavigate,
  showCompletedMatchesHelp = true,
}: {
  title: string;
  icon: React.ReactNode;
  rows: LeaderboardRow[];
  loading: boolean;
  error: unknown;
  emptyMessage: string;
  valueTitle: string;
  accentColor: string;
  completedMatches?: CompletedMatch[];
  onNavigate?: (matchId: number) => void;
  showCompletedMatchesHelp?: boolean;
}) {
  if (error) {
    return (
      <AlertBox variant="error" title={`Unable to load ${title.toLowerCase()}`}>
        Please refresh and try again.
      </AlertBox>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      {loading ? (
        <Loader className="py-10" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-[var(--color-rule)]">
            <div className="flex min-w-0 items-center gap-3.5">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold"
                style={{ background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)", color: accentColor }}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-gray-800 dark:text-white/90">{title}</h4>
                <span className="text-theme-xs text-gray-400">Ranked by {valueTitle.toLowerCase()}</span>
              </div>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="flex flex-col">
              {rows.map((row, index) => (
                <div key={row.key} className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-b-0 dark:border-[var(--color-rule)]">
                  <div
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-theme-xs font-bold text-white"
                    style={{ background: rankAvatarColor(index + 1) }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar src={toAbsolutePlayerPhotoUrl(row.photoUrl)} name={row.playerName} seed={row.key} size={28} fontSize={11} />
                      <span className="truncate font-semibold text-gray-800 dark:text-white/90">{row.playerName}</span>
                    </div>
                    <span className="text-theme-xs text-gray-400">{row.teamName || "-"}</span>
                  </div>
                  <span
                    className="min-w-[52px] rounded-full px-3 py-1 text-center font-extrabold"
                    style={{ background: "rgba(0,0,0,0.04)", color: accentColor }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-theme-sm text-gray-400">{emptyMessage}</p>
              {showCompletedMatchesHelp && completedMatches && completedMatches.length > 0 && (
                <div className="rounded-xl border border-gray-100 p-3 dark:border-[var(--color-rule)]">
                  <div className="mb-2 flex items-center gap-1.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                    <EditOutlined /> Completed matches - record events here
                  </div>
                  <div className="flex flex-col gap-2">
                    {completedMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-[var(--color-rule)]">
                        <span className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                          {match.homeTeamName} <Badge variant="info">{match.homeTeamScore} – {match.awayTeamScore}</Badge> {match.awayTeamName}
                        </span>
                        <Button type="button" size="sm" startIcon={<EditOutlined />} onClick={() => onNavigate?.(match.id)}>
                          Record Events
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StatsLeaderboardPanel({
  matchDayId,
  isActive = false,
  weeklyMatchDaysOnly = false,
}: StatsLeaderboardPanelProps) {
  const navigate = useNavigate();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin =
    loginInfo.roles.includes("ADMIN") ||
    loginInfo.roles.includes("SUPERADMIN") ||
    loginInfo.roles.includes("COORDINATOR");
  const [aggregateStats, { isLoading: isAggregating }] =
    useAggregateMatchDayStatisticsMutation();
  const playerStatisticsQuery = useGetPlayerStatisticsQuery(
    weeklyMatchDaysOnly
      ? { weeklyMatchDaysOnly: true, limit: 200 }
      : { matchDayId, limit: 200 },
    { skip: !isActive || !matchDayId, refetchOnMountOrArgChange: true }
  );
  const matchDaySummaryQuery = useGetMatchDaySummaryQuery(
    { matchDayId },
    { skip: !isActive || !matchDayId }
  );
  const fixturesQuery = useGetFixturesQuery(
    { matchDayId },
    { skip: !isActive || !matchDayId }
  );

  const completedMatches: CompletedMatch[] = useMemo(() => {
    return (fixturesQuery.data?.content || [])
      .filter((f) => f.matchStatus === "COMPLETED")
      .map((f) => ({
        id: f.id,
        homeTeamName: f.homeTeamName || `Team ${f.homeTeamId}`,
        awayTeamName: f.awayTeamName || `Team ${f.awayTeamId}`,
        homeTeamScore: f.homeTeamScore ?? 0,
        awayTeamScore: f.awayTeamScore ?? 0,
      }));
  }, [fixturesQuery.data]);

  const handleNavigateToMatch = (matchId: number) => {
    navigate(`/fixtures/${matchId}`);
  };

  const playerTeamLookup = useMemo(() => {
    const map = new Map<string, string>();
    const matchDay = matchDaySummaryQuery.data?.content?.[0];

    (matchDay?.teams || []).forEach((team) => {
      (team.players || []).forEach((player) => {
        const key = playerKey(player.playerId);
        if (!map.has(key)) {
          map.set(key, team.teamName);
        }
      });
    });

    return map;
  }, [matchDaySummaryQuery.data]);

  const playerPhotoLookup = useMemo(() => {
    const map = new Map<string, string>();
    const matchDay = matchDaySummaryQuery.data?.content?.[0];

    (matchDay?.teams || []).forEach((team) => {
      (team.players || []).forEach((player) => {
        const key = playerKey(player.playerId);
        if (!map.has(key) && player.photoUrl) {
          map.set(key, player.photoUrl);
        }
      });
    });

    return map;
  }, [matchDaySummaryQuery.data]);

  const topScorers = useMemo(
    () =>
      buildScorerRows(
        playerStatisticsQuery.data?.content,
        playerTeamLookup,
        playerPhotoLookup
      ),
    [playerStatisticsQuery.data, playerTeamLookup, playerPhotoLookup]
  );
  const topAssists = useMemo(
    () =>
      buildAssistRows(
        playerStatisticsQuery.data?.content,
        playerTeamLookup,
        playerPhotoLookup
      ),
    [playerStatisticsQuery.data, playerTeamLookup, playerPhotoLookup]
  );
  const yellowCardLeaders = useMemo(
    () =>
      buildCardRows(
        playerStatisticsQuery.data?.content,
        playerTeamLookup,
        playerPhotoLookup,
        "yellow"
      ),
    [playerStatisticsQuery.data, playerTeamLookup, playerPhotoLookup]
  );
  const redCardLeaders = useMemo(
    () =>
      buildCardRows(
        playerStatisticsQuery.data?.content,
        playerTeamLookup,
        playerPhotoLookup,
        "red"
      ),
    [playerStatisticsQuery.data, playerTeamLookup, playerPhotoLookup]
  );

  const loading = playerStatisticsQuery.isLoading || playerStatisticsQuery.isFetching;

  return (
    <div className="flex flex-col gap-5">
      {isAdmin && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
          <span className="text-theme-sm text-gray-500 dark:text-gray-400">
            Re-sync goals, assists and cards from recorded match events.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            startIcon={<ReloadOutlined />}
            disabled={isAggregating}
            onClick={() => aggregateStats({ matchDayId })}
          >
            Sync Stats
          </Button>
        </div>
      )}
      <LeaderboardSection
        title="Top Scorers"
        icon={<FireOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />}
        rows={topScorers}
        loading={loading}
        error={playerStatisticsQuery.error}
        emptyMessage="No goal scorers found for this MatchDay."
        valueTitle="Goals"
        accentColor="#ff4d4f"
        completedMatches={completedMatches}
        onNavigate={handleNavigateToMatch}
      />
      <LeaderboardSection
        title="Most Assists"
        icon={<RiseOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
        rows={topAssists}
        loading={loading}
        error={playerStatisticsQuery.error}
        emptyMessage="No assists found for this MatchDay."
        valueTitle="Assists"
        accentColor="#52c41a"
        completedMatches={completedMatches}
        onNavigate={handleNavigateToMatch}
        showCompletedMatchesHelp={false}
      />
      <LeaderboardSection
        title="Yellow Cards"
        icon={<WarningOutlined style={{ color: "#faad14", fontSize: 18 }} />}
        rows={yellowCardLeaders}
        loading={loading}
        error={playerStatisticsQuery.error}
        emptyMessage="No yellow cards found for this MatchDay."
        valueTitle="Cards"
        accentColor="#faad14"
        completedMatches={completedMatches}
        onNavigate={handleNavigateToMatch}
        showCompletedMatchesHelp={false}
      />
      <LeaderboardSection
        title="Red Cards"
        icon={<StopOutlined style={{ color: "#cf1322", fontSize: 18 }} />}
        rows={redCardLeaders}
        loading={loading}
        error={playerStatisticsQuery.error}
        emptyMessage="No red cards found for this MatchDay"
        valueTitle="Cards"
        accentColor="#cf1322"
        completedMatches={completedMatches}
        onNavigate={handleNavigateToMatch}
        showCompletedMatchesHelp={false}
      />
    </div>
  );
}
