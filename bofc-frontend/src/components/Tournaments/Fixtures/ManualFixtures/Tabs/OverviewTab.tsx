import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
    TrophyOutlined,
    TeamOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    BarChartOutlined,
    FireOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
    TournamentStructureResponse,
    RoundType,
    RoundStatus,
    GroupStandingResponse,
} from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetGroupStandingsQuery } from "../../../../../state/features/manualFixtures/manualFixturesSlice";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import {
    formatMatchTime,
    isMatchOngoing,
} from "../../../../../utils/matchTimeUtils";
import { useGetTopScorersQuery } from "../../../../../state/features/statistics/statisticsSlice";
import { ITournamentTopScorer } from "../../../../../state/features/statistics/statisticsTypes";
import { CardDataStats } from "../../../../ui/card";
import Badge from "../../../../ui/badge";
import Loader from "../../../../ui/loader";

interface OverviewTabProps {
    tournamentId: number;
    tournamentStructure?: TournamentStructureResponse;
    isLoading: boolean;
    onRefresh: () => void;
    isActive?: boolean;
}

interface TeamStanding {
    id: number;
    teamId: number;
    teamName: string;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    yellowCards?: number;
    redCards?: number;
    position: number;
    roundName: string;
    groupName?: string;
    isAdvanced?: boolean;
}

const rankBadge = (pos: number) => {
    if (pos === 1) return <Badge variant="warning">{pos}</Badge>;
    if (pos === 2) return <Badge variant="light">{pos}</Badge>;
    if (pos === 3) return <Badge variant="light">{pos}</Badge>;
    return <span className="font-semibold text-gray-700 dark:text-gray-300">{pos}</span>;
};

function StandingsTable({ rows }: { rows: TeamStanding[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-theme-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                        <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Pos</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Team</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">P</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">W</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">D</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">L</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">GD</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">GF</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">GA</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">Y</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">R</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">Pts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((record, index) => (
                        <tr
                            key={`${record.roundName}-${record.groupName}-${record.teamId}`}
                            className={
                                index === 0
                                    ? "bg-warning-50 dark:bg-warning-500/10"
                                    : index === 1
                                    ? "bg-success-50 dark:bg-success-500/10"
                                    : index === 2
                                    ? "bg-warning-50/60 dark:bg-warning-500/5"
                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                            }
                        >
                            <td className="px-2 py-2">{rankBadge(record.position)}</td>
                            <td className="px-2 py-2">
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800 dark:text-white/90">{record.teamName}</span>
                                    {record.isAdvanced && <Badge variant="success"><TrophyOutlined /> Advanced</Badge>}
                                </span>
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{record.matchesPlayed}</td>
                            <td className="px-2 py-2 text-center text-success-600 dark:text-success-500">{record.wins}</td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{record.draws}</td>
                            <td className="px-2 py-2 text-center text-error-600 dark:text-error-500">{record.losses}</td>
                            <td className={`px-2 py-2 text-center font-semibold ${record.goalDifference > 0 ? "text-success-600 dark:text-success-500" : record.goalDifference < 0 ? "text-error-600 dark:text-error-500" : "text-gray-600 dark:text-gray-300"}`}>
                                {record.goalDifference > 0 ? `+${record.goalDifference}` : record.goalDifference}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{record.goalsFor}</td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{record.goalsAgainst}</td>
                            <td className="px-2 py-2 text-center font-semibold text-warning-600 dark:text-orange-400">{record.yellowCards ?? 0}</td>
                            <td className="px-2 py-2 text-center font-semibold text-error-600 dark:text-error-500">{record.redCards ?? 0}</td>
                            <td className="px-2 py-2 text-center text-base font-bold text-brand-500 dark:text-brand-400">{record.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function OverviewTab({
    tournamentId,
    tournamentStructure,
    isLoading,
    onRefresh,
    isActive = false,
}: OverviewTabProps) {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(Date.now());

    const {
        data: fixturesData,
        isLoading: fixturesLoading,
        refetch: refetchFixtures,
    } = useGetFixturesQuery({ tournamentId }, { skip: !isActive });

    const fixtures = useMemo(() => fixturesData?.content || [], [fixturesData]);

    const { data: topScorersData, isLoading: topScorersLoading } =
        useGetTopScorersQuery({ tournamentId, limit: 5 }, { skip: !isActive });

    const topScorers = topScorersData?.content || [];

    const ongoingMatches = useMemo(() => {
        return fixtures.filter((f) => isMatchOngoing(f.matchStatus));
    }, [fixtures]);

    useEffect(() => {
        if (ongoingMatches.length > 0 && isActive) {
            const interval = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [ongoingMatches.length, isActive]);

    useEffect(() => {
        if (isActive) {
            refetchFixtures();
        }
    }, [isActive, refetchFixtures]);

    const allGroups = useMemo(() => {
        if (!tournamentStructure) return [];
        const groups: Array<{
            groupId: number;
            groupName: string;
            roundName: string;
            roundId: number;
        }> = [];
        tournamentStructure.rounds.forEach((round) => {
            if (round.groups) {
                round.groups.forEach((group) => {
                    groups.push({
                        groupId: group.id,
                        groupName: group.groupName,
                        roundName: round.roundName,
                        roundId: round.id,
                    });
                });
            }
        });
        return groups;
    }, [tournamentStructure]);

    const directKnockoutStandings = useMemo(() => {
        if (!tournamentStructure || !fixtures.length) return [];

        const standings: TeamStanding[] = [];

        tournamentStructure.rounds.forEach((round) => {
            if (round.roundType === RoundType.DIRECT_KNOCKOUT) {
                const roundMatches = fixtures.filter((f) => {
                    const matchesTournament = f.tournamentId === tournamentId;
                    if (!matchesTournament) return false;
                    const fixtureRoundNumber = f.roundNumber ?? f.round;
                    const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
                    const matchesByRoundId = f.round === round.id;
                    return matchesByRoundNumber || matchesByRoundId;
                });

                const teamStats: Record<
                    number,
                    {
                        teamId: number;
                        teamName: string;
                        matchesPlayed: number;
                        wins: number;
                        draws: number;
                        losses: number;
                        goalsFor: number;
                        goalsAgainst: number;
                        goalDifference: number;
                        points: number;
                    }
                > = {};

                if (round.teams) {
                    round.teams.forEach((team: any) => {
                        if (!team.isPlaceholder && team.teamId) {
                            teamStats[team.teamId] = {
                                teamId: team.teamId,
                                teamName: team.teamName || "",
                                matchesPlayed: 0,
                                wins: 0,
                                draws: 0,
                                losses: 0,
                                goalsFor: 0,
                                goalsAgainst: 0,
                                goalDifference: 0,
                                points: 0,
                            };
                        }
                    });
                }

                roundMatches.forEach((match) => {
                    if (match.matchStatus !== "COMPLETED") return;

                    const homeTeamId = match.homeTeamId;
                    const awayTeamId = match.awayTeamId;
                    const homeScore = match.homeTeamScore || 0;
                    const awayScore = match.awayTeamScore || 0;

                    if (!teamStats[homeTeamId]) {
                        teamStats[homeTeamId] = {
                            teamId: homeTeamId,
                            teamName: match.homeTeamName || `Team ${homeTeamId}`,
                            matchesPlayed: 0,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            goalsFor: 0,
                            goalsAgainst: 0,
                            goalDifference: 0,
                            points: 0,
                        };
                    }

                    if (!teamStats[awayTeamId]) {
                        teamStats[awayTeamId] = {
                            teamId: awayTeamId,
                            teamName: match.awayTeamName || `Team ${awayTeamId}`,
                            matchesPlayed: 0,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            goalsFor: 0,
                            goalsAgainst: 0,
                            goalDifference: 0,
                            points: 0,
                        };
                    }

                    teamStats[homeTeamId].matchesPlayed++;
                    teamStats[homeTeamId].goalsFor += homeScore;
                    teamStats[homeTeamId].goalsAgainst += awayScore;
                    teamStats[homeTeamId].goalDifference =
                        teamStats[homeTeamId].goalsFor -
                        teamStats[homeTeamId].goalsAgainst;

                    if (homeScore > awayScore) {
                        teamStats[homeTeamId].wins++;
                        teamStats[homeTeamId].points += 3;
                    } else if (homeScore === awayScore) {
                        teamStats[homeTeamId].draws++;
                        teamStats[homeTeamId].points += 1;
                    } else {
                        teamStats[homeTeamId].losses++;
                    }

                    teamStats[awayTeamId].matchesPlayed++;
                    teamStats[awayTeamId].goalsFor += awayScore;
                    teamStats[awayTeamId].goalsAgainst += homeScore;
                    teamStats[awayTeamId].goalDifference =
                        teamStats[awayTeamId].goalsFor -
                        teamStats[awayTeamId].goalsAgainst;

                    if (awayScore > homeScore) {
                        teamStats[awayTeamId].wins++;
                        teamStats[awayTeamId].points += 3;
                    } else if (awayScore === homeScore) {
                        teamStats[awayTeamId].draws++;
                        teamStats[awayTeamId].points += 1;
                    } else {
                        teamStats[awayTeamId].losses++;
                    }
                });

                const roundStandings = Object.values(teamStats)
                    .filter((stat) => stat.matchesPlayed > 0)
                    .sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points;
                        if (b.goalDifference !== a.goalDifference)
                            return b.goalDifference - a.goalDifference;
                        return b.goalsFor - a.goalsFor;
                    })
                    .map((stat, index) => ({
                        ...stat,
                        position: index + 1,
                        id: stat.teamId,
                        roundName: round.roundName,
                    }));

                standings.push(...roundStandings);
            }
        });

        return standings;
    }, [tournamentStructure, fixtures, tournamentId]);

    const GroupStandingsFetcher: React.FC<{
        groupId: number;
        groupName: string;
        roundName: string;
        isActive: boolean;
        onStandingsLoaded: (
            standings: GroupStandingResponse[],
            groupName: string,
            roundName: string
        ) => void;
    }> = ({
        groupId,
        groupName,
        roundName,
        isActive: isTabActive,
        onStandingsLoaded,
    }) => {
        const { data } = useGetGroupStandingsQuery(
            { groupId },
            { skip: !isTabActive }
        );

        useEffect(() => {
            if (data?.content) {
                onStandingsLoaded(data.content, groupName, roundName);
            }
        }, [data, groupName, roundName, onStandingsLoaded]);

        return null;
    };

    const [groupStandingsMap, setGroupStandingsMap] = useState<
        Record<
            string,
            {
                groupName: string;
                roundName: string;
                standings: GroupStandingResponse[];
            }
        >
    >({});

    const handleStandingsLoaded = useCallback(
        (
            standings: GroupStandingResponse[],
            groupName: string,
            roundName: string
        ) => {
            const key = `${roundName}-${groupName}`;
            setGroupStandingsMap((prev) => ({
                ...prev,
                [key]: { groupName, roundName, standings },
            }));
        },
        []
    );

    const allStandings = useMemo(() => {
        const combined: TeamStanding[] = [];

        Object.values(groupStandingsMap).forEach(
            ({ groupName, roundName, standings }) => {
                standings.forEach((standing: GroupStandingResponse) => {
                    combined.push({
                        id: standing.id,
                        teamId: standing.teamId,
                        teamName: standing.teamName,
                        matchesPlayed: standing.matchesPlayed,
                        wins: standing.wins,
                        draws: standing.draws,
                        losses: standing.losses,
                        goalsFor: standing.goalsFor,
                        goalsAgainst: standing.goalsAgainst,
                        goalDifference: standing.goalDifference,
                        points: standing.points,
                        yellowCards: standing.yellowCards,
                        redCards: standing.redCards,
                        position: standing.position || 0,
                        roundName,
                        groupName,
                        isAdvanced: standing.isAdvanced,
                    });
                });
            }
        );

        combined.push(...directKnockoutStandings);

        return combined;
    }, [groupStandingsMap, directKnockoutStandings]);

    const tournamentStats = useMemo(() => {
        if (!tournamentStructure) {
            return {
                totalRounds: 0,
                totalGroups: 0,
                totalTeams: 0,
                totalMatches: 0,
                completedMatches: 0,
                ongoingRounds: 0,
                completedRounds: 0,
            };
        }

        const totalGroups = tournamentStructure.rounds.reduce(
            (sum, round) => sum + (round.groups?.length || 0),
            0
        );

        const uniqueTeams = new Set<number>();
        tournamentStructure.rounds.forEach((round) => {
            if (round.teams) {
                round.teams.forEach((team: any) => {
                    if (!team.isPlaceholder && team.teamId) {
                        uniqueTeams.add(team.teamId);
                    }
                });
            }
            if (round.groups) {
                round.groups.forEach((group) => {
                    if (group.teams) {
                        group.teams.forEach((team: any) => {
                            if (!team.isPlaceholder && team.teamId) {
                                uniqueTeams.add(team.teamId);
                            }
                        });
                    }
                });
            }
        });

        const ongoingRounds = tournamentStructure.rounds.filter(
            (r) => r.status === RoundStatus.ONGOING
        ).length;
        const completedRounds = tournamentStructure.rounds.filter(
            (r) => r.status === RoundStatus.COMPLETED
        ).length;

        return {
            totalRounds:
                tournamentStructure.totalRounds ||
                tournamentStructure.rounds.length,
            totalGroups,
            totalTeams: uniqueTeams.size,
            totalMatches: tournamentStructure.totalMatches || 0,
            completedMatches: tournamentStructure.completedMatches || 0,
            ongoingRounds,
            completedRounds,
        };
    }, [tournamentStructure]);

    const standingsByRoundAndGroup = useMemo(() => {
        const grouped: Record<string, Record<string, TeamStanding[]>> = {};

        allStandings.forEach((standing) => {
            const roundKey = standing.roundName;
            const groupKey = standing.groupName || "Direct Knockout";

            if (!grouped[roundKey]) {
                grouped[roundKey] = {};
            }
            if (!grouped[roundKey][groupKey]) {
                grouped[roundKey][groupKey] = [];
            }

            grouped[roundKey][groupKey].push(standing);
        });

        Object.keys(grouped).forEach((roundKey) => {
            Object.keys(grouped[roundKey]).forEach((groupKey) => {
                grouped[roundKey][groupKey].sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    if (b.goalDifference !== a.goalDifference)
                        return b.goalDifference - a.goalDifference;
                    return b.goalsFor - a.goalsFor;
                });
                grouped[roundKey][groupKey].forEach((standing, index) => {
                    standing.position = index + 1;
                });
            });
        });

        return grouped;
    }, [allStandings]);

    const sortedRounds = useMemo(() => {
        if (!tournamentStructure) return [];
        return [...tournamentStructure.rounds].sort(
            (a, b) => (b.sequenceOrder || 0) - (a.sequenceOrder || 0)
        );
    }, [tournamentStructure]);

    if (!tournamentStructure || tournamentStructure.rounds.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">No MatchDay structure yet.</p>
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Create rounds and groups to see standings.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-1">
            {allGroups.map((group) => (
                <GroupStandingsFetcher
                    key={`${group.roundId}-${group.groupId}`}
                    groupId={group.groupId}
                    groupName={group.groupName}
                    roundName={group.roundName}
                    isActive={isActive}
                    onStandingsLoaded={handleStandingsLoaded}
                />
            ))}

            {(isLoading || fixturesLoading) ? (
                <Loader className="py-8" />
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        <CardDataStats title="Total Rounds" value={tournamentStats.totalRounds} icon={<TrophyOutlined className="text-brand-500" />} />
                        <CardDataStats title="Total Groups" value={tournamentStats.totalGroups} icon={<TeamOutlined className="text-success-500" />} />
                        <CardDataStats title="Total Teams" value={tournamentStats.totalTeams} icon={<TeamOutlined className="text-blue-light-500" />} />
                        <CardDataStats title="Total Matches" value={tournamentStats.totalMatches} icon={<PlayCircleOutlined className="text-warning-500" />} />
                        <CardDataStats title="Completed Matches" value={`${tournamentStats.completedMatches} / ${tournamentStats.totalMatches}`} icon={<CheckCircleOutlined className="text-success-500" />} />
                        <CardDataStats title="Ongoing Rounds" value={tournamentStats.ongoingRounds} icon={<FireOutlined className="text-error-500" />} />
                        <CardDataStats title="Completed Rounds" value={`${tournamentStats.completedRounds} / ${tournamentStats.totalRounds}`} icon={<CheckCircleOutlined className="text-success-500" />} />
                        <CardDataStats
                            title="Progress"
                            value={`${tournamentStats.totalMatches > 0 ? Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100) : 0}%`}
                            icon={<BarChartOutlined className="text-brand-500" />}
                        />
                    </div>

                    {/* Top 5 Scorers */}
                    {topScorers.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <FireOutlined className="text-error-500" />
                                <h5 className="text-lg font-bold text-gray-800 dark:text-white/90">Top 5 Scorers</h5>
                                {topScorersLoading && <Loader className="!py-0" size={18} />}
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                                {topScorers.map((player: ITournamentTopScorer, index: number) => {
                                    const rankColor = index === 0 ? "border-warning-500" : index === 1 ? "border-gray-300" : index === 2 ? "border-orange-400" : "border-gray-200 dark:border-gray-800";
                                    const rankBg = index === 0 ? "bg-warning-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-400" : "bg-brand-500";
                                    return (
                                        <div key={player.playerId} className={`relative overflow-hidden rounded-xl border-2 p-1.5 transition hover:-translate-y-1 ${rankColor}`}>
                                            <div className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-theme-xs font-bold text-white shadow ${rankBg}`}>
                                                #{index + 1}
                                            </div>
                                            <div className="flex aspect-[2/3] flex-col justify-between rounded-lg bg-gradient-to-b from-gray-700 to-gray-900 px-3 pb-3 pt-6">
                                                <div className="flex flex-1 items-center justify-center">
                                                    <span className="text-6xl font-bold text-white/90">{player.playerName.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="mb-3 rounded bg-black/60 px-2 py-1.5 text-center backdrop-blur">
                                                    <div className="truncate text-theme-sm font-bold text-white">{player.playerName}</div>
                                                    <div className="truncate text-theme-xs text-white/70">{player.teamName}</div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1 text-center">
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-warning-400">Goals</div>
                                                        <div className="text-lg font-bold text-warning-400">{player.goalsScored}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-success-400">Assists</div>
                                                        <div className="text-lg font-bold text-success-400">{player.assists}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-[#B69549]">Match</div>
                                                        <div className="text-lg font-bold text-[#B69549]">{player.matchesPlayed}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Live Matches */}
                    {ongoingMatches.length > 0 && (
                        <div className="rounded-2xl border border-success-500/40 bg-white p-4 dark:bg-white/[0.03] md:p-5">
                            <div className="mb-3 flex items-center gap-2">
                                <PlayCircleOutlined className="text-success-500" />
                                <h5 className="text-lg font-bold text-gray-800 dark:text-white/90">Live Matches</h5>
                                <Badge variant="success">{ongoingMatches.length}</Badge>
                            </div>
                            <div className="flex flex-col gap-2">
                                {ongoingMatches.map((match: IFixture) => {
                                    const _ = currentTime;
                                    const matchTime = formatMatchTime(
                                        match.matchStatus,
                                        match.startedAt,
                                        match.elapsedTimeSeconds,
                                        match.completedAt
                                    );
                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => navigate(`/fixtures/${match.id}`)}
                                            className="flex cursor-pointer items-center justify-between rounded-xl border border-success-500/40 bg-success-50 px-4 py-2.5 dark:bg-success-500/10"
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <PlayCircleOutlined className="text-success-500" />
                                                <span className="font-semibold text-gray-800 dark:text-white/90">{match.homeTeamName}</span>
                                                <span className="text-base font-bold text-gray-800 dark:text-white/90">{match.homeTeamScore} - {match.awayTeamScore}</span>
                                                <span className="font-semibold text-gray-800 dark:text-white/90">{match.awayTeamName}</span>
                                            </span>
                                            {matchTime && (
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/fixtures/${match.id}`); }}
                                                    className="rounded-full bg-success-500 px-3 py-1 text-theme-sm font-bold text-white"
                                                >
                                                    {matchTime}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Standings by Round and Group */}
                    {Object.keys(standingsByRoundAndGroup).length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                            <p className="text-theme-sm text-gray-500 dark:text-gray-400">No standings available yet.</p>
                            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Complete some matches to see standings.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {sortedRounds.map((round) => {
                                const roundStandings = standingsByRoundAndGroup[round.roundName];
                                if (!roundStandings || Object.keys(roundStandings).length === 0) {
                                    return null;
                                }

                                return (
                                    <div key={round.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                            <span className="flex items-center gap-2">
                                                <TrophyOutlined className="text-brand-500" />
                                                <h5 className="text-lg font-bold text-gray-800 dark:text-white/90">{round.roundName}</h5>
                                                <Badge variant={round.status === RoundStatus.COMPLETED ? "success" : round.status === RoundStatus.ONGOING ? "primary" : "light"}>{round.status}</Badge>
                                            </span>
                                            <span className="text-theme-xs text-gray-400 dark:text-gray-500">
                                                Round {round.roundNumber} • {round.roundType.replace("_", " ")}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {round.roundType === RoundType.GROUP_BASED
                                                ? Object.keys(roundStandings)
                                                      .sort()
                                                      .map((groupName) => {
                                                          const groupStandings = roundStandings[groupName];
                                                          if (groupStandings.length === 0) return null;

                                                          return (
                                                              <div key={groupName}>
                                                                  <div className="mb-2 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                                                      <TeamOutlined className="text-gray-400" />
                                                                      <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{groupName}</span>
                                                                      <span className="text-theme-xs text-gray-400">({groupStandings.length} {groupStandings.length === 1 ? 'team' : 'teams'})</span>
                                                                  </div>
                                                                  <StandingsTable rows={groupStandings} />
                                                              </div>
                                                          );
                                                      })
                                                : (() => {
                                                      const knockoutStandings = roundStandings["Direct Knockout"] || [];
                                                      if (knockoutStandings.length === 0) return null;
                                                      return <StandingsTable rows={knockoutStandings} />;
                                                  })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
