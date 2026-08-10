import React, { useMemo } from "react";
import {
    CrownFilled,
    StarFilled,
    RiseOutlined,
    ShareAltOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { IPlayerStatisticsData } from "../../state/features/statistics/statisticsTypes";
import { computeRating } from "../../utils/playerRating";
import Avatar from "../CommonAtoms/Avatar";

interface PlayerStatsSidebarProps {
    rows: IPlayerStatisticsData[];
    photoById: Record<number, string>;
    onViewFullRanking: () => void;
    /** "sidebar" (default) stacks the 3 cards in a narrow column meant to sit beside the
     * list. "top" lays them out as a 3-column row meant to sit above it instead. */
    layout?: "sidebar" | "top";
}

const podiumAccent = ["#B69549", "#8792A8", "#A9754A"]; // gold / silver / bronze, matching the 1st/2nd/3rd order below
const podiumHeight = ["h-28", "h-20", "h-16"]; // 1st, 2nd, 3rd

const PlayerAvatarCircle: React.FC<{ photo?: string; name: string; seed: string | number; size: number }> = ({ photo, name, seed, size }) => (
    <Avatar src={photo} name={name} seed={seed} size={size} className="border-2 border-white shadow-theme-sm dark:border-gray-900" />
);

const PlayerStatsSidebar: React.FC<PlayerStatsSidebarProps> = ({ rows, photoById, onViewFullRanking, layout = "sidebar" }) => {
    const topThree = useMemo(
        () => [...rows].sort((a, b) => b.statistics.goalsAndAssists - a.statistics.goalsAndAssists).slice(0, 3),
        [rows]
    );
    const spotlight = topThree[0];

    const insights = useMemo(() => {
        const total = rows.length || 1;
        const scored = rows.filter((r) => r.statistics.goalsScored > 0).length;
        const assisted = rows.filter((r) => r.statistics.assists > 0).length;
        const totalGoals = rows.reduce((sum, r) => sum + r.statistics.goalsScored, 0);
        const totalCards = rows.reduce((sum, r) => sum + r.statistics.yellowCards + r.statistics.redCards, 0);
        return {
            scoredPct: Math.round((scored / total) * 100),
            assistedPct: Math.round((assisted / total) * 100),
            avgGoals: (totalGoals / total).toFixed(2),
            avgCards: (totalCards / total).toFixed(2),
        };
    }, [rows]);

    if (rows.length === 0) return null;

    // Podium display order: 2nd, 1st, 3rd (winner elevated in the middle).
    const podiumOrder = [topThree[1], topThree[0], topThree[2]];

    return (
        <div className={layout === "top" ? "grid w-full grid-cols-1 gap-4 md:grid-cols-3" : "flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0"}>
            {/* Top 3 podium */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <h4 className="mb-4 text-theme-sm font-bold text-gray-800 dark:text-white/90">Top 3 Players (G+A)</h4>
                <div className="flex items-end justify-center gap-3">
                    {podiumOrder.map((player, i) => {
                        if (!player) return <div key={i} className="w-20" />;
                        const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                        const accent = podiumAccent[rank - 1];
                        return (
                            <div key={player.playerId} className="flex w-20 flex-col items-center">
                                <div className="relative mb-2">
                                    {rank === 1 && (
                                        <CrownFilled className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg" style={{ color: accent }} />
                                    )}
                                    <PlayerAvatarCircle photo={photoById[player.playerId]} name={player.playerName} seed={player.playerId} size={rank === 1 ? 52 : 44} />
                                    <span
                                        className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                        style={{ background: accent }}
                                    >
                                        {rank}
                                    </span>
                                </div>
                                <span className="w-full truncate text-center text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {player.playerName}
                                </span>
                                <div
                                    className={`mt-2 flex w-full flex-col items-center justify-start rounded-t-lg pt-1.5 ${podiumHeight[rank - 1]}`}
                                    style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}
                                >
                                    <span className="text-base font-extrabold" style={{ color: accent }}>
                                        {player.statistics.goalsAndAssists}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">G+A</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={onViewFullRanking}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 text-theme-xs font-medium text-brand-500 hover:underline dark:text-brand-400"
                >
                    View full ranking <ArrowRightOutlined />
                </button>
            </div>

            {/* Player spotlight - current #1 by G+A */}
            {spotlight && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                    <h4 className="mb-4 text-theme-sm font-bold text-gray-800 dark:text-white/90">Player Spotlight</h4>
                    <div className="mb-4 flex items-center gap-3">
                        <PlayerAvatarCircle photo={photoById[spotlight.playerId]} name={spotlight.playerName} seed={spotlight.playerId} size={56} />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-bold text-brand-500 dark:text-brand-400">{spotlight.playerName}</span>
                            <span className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{spotlight.position || "-"}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            ["Matches", spotlight.statistics.matchesPlayed],
                            ["Goals", spotlight.statistics.goalsScored],
                            ["Assists", spotlight.statistics.assists],
                            ["G+A", spotlight.statistics.goalsAndAssists],
                            ["Yellow", spotlight.statistics.yellowCards],
                            ["Red", spotlight.statistics.redCards],
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-lg border border-gray-100 bg-gray-50 px-1 py-2 text-center dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <div className="text-base font-bold leading-none text-gray-800 dark:text-white/90">{value}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                        <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Performance Rating</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-extrabold text-brand-500 dark:text-brand-400">{computeRating(spotlight.statistics).toFixed(1)}</span>
                            <span className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <StarFilled
                                        key={i}
                                        className="text-sm"
                                        style={{ color: i < Math.round(computeRating(spotlight.statistics) / 2) ? "#B69549" : "#D1D5DB" }}
                                    />
                                ))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick insights - aggregate across all currently-loaded players */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <h4 className="mb-4 text-theme-sm font-bold text-gray-800 dark:text-white/90">Quick Insights</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                        <RiseOutlined className="mb-1 block text-lg text-success-500" />
                        <div className="text-base font-bold text-gray-800 dark:text-white/90">{insights.scoredPct}%</div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500">Players have scored</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                        <ShareAltOutlined className="mb-1 block text-lg text-blue-light-500" />
                        <div className="text-base font-bold text-gray-800 dark:text-white/90">{insights.assistedPct}%</div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500">Players with assists</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                        <ClockCircleOutlined className="mb-1 block text-lg text-brand-500 dark:text-brand-400" />
                        <div className="text-base font-bold text-gray-800 dark:text-white/90">{insights.avgGoals}</div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500">Avg goals per player</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                        <WarningOutlined className="mb-1 block text-lg text-warning-500" />
                        <div className="text-base font-bold text-gray-800 dark:text-white/90">{insights.avgCards}</div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500">Avg cards per player</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsSidebar;
