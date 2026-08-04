import { useMemo, useState } from "react";
import { BarChartOutlined, AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
import useIsMobile from "../../hooks/useIsMobile";
import {
    useGetPlayerStatisticsQuery,
    useGetPlayerMatchHistoryQuery,
} from "../../state/features/statistics/statisticsSlice";
import { useGetTournamentSessionsQuery, useGetTournamentsByYearQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { API_URL } from "../../settings";
import Button from "../ui/button";
import FormSelect from "../ui/form-select";
import Pagination from "../ui/pagination";
import Loader from "../ui/loader";
import { IPlayerStatisticsData } from "../../state/features/statistics/statisticsTypes";
import { computeRating } from "../../utils/playerRating";
import PlayerStatsSidebar from "./PlayerStatsSidebar";

const FORM_SLOTS = 5;

const resultColor: Record<string, string> = {
    WIN: "bg-success-500",
    DRAW: "bg-warning-400",
    LOSS: "bg-error-500",
};

const PlayerStatCard: React.FC<{ record: IPlayerStatisticsData; photo?: string; rank: number }> = ({ record, photo, rank }) => {
    const s = record.statistics;
    const initial = record.playerName?.charAt(0)?.toUpperCase() || "?";
    const { data: historyData } = useGetPlayerMatchHistoryQuery({ playerId: record.playerId });

    // Oldest -> newest, left to right, same convention as most "form guide" strips.
    const recentResults = useMemo(() => {
        const history = [...(historyData?.content || [])].sort(
            (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
        );
        return history.slice(0, FORM_SLOTS).reverse();
    }, [historyData]);

    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-brand-500 bg-brand-50 text-xl font-bold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initial}
                </div>
                <div className="flex min-w-0 flex-col">
                    <span className="truncate text-theme-sm font-bold text-gray-800 dark:text-white/90">{record.playerName}</span>
                    <span className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{record.position || "—"}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {statChip("Matches", s.matchesPlayed)}
                {statChip("Goals", s.goalsScored)}
                {statChip("Assists", s.assists)}
                {statChip("G+A", s.goalsAndAssists)}
                {statChip("Yellow", s.yellowCards)}
                {statChip("Red", s.redCards)}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Form</div>
                    <div className="flex gap-1">
                        {Array.from({ length: FORM_SLOTS }).map((_, i) => {
                            const match = recentResults[i - (FORM_SLOTS - recentResults.length)];
                            return (
                                <span
                                    key={i}
                                    title={match ? `${match.result} vs ${match.opponentTeamName || "opponent"} (${match.teamScore}-${match.opponentScore})` : "No match yet"}
                                    className={`h-3 w-3 rounded-sm ${match ? resultColor[match.result] : "bg-gray-200 dark:bg-gray-700"}`}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="text-base font-bold leading-none text-brand-500 dark:text-brand-400">{computeRating(s).toFixed(1)}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Rating</div>
                </div>
            </div>
        </div>
    );
};

const statChip = (label: string, value: number) => (
    <div className="rounded-lg border border-gray-100 bg-white px-1 py-2 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <div className={`text-base font-bold leading-none ${value === 0 ? "text-gray-400 dark:text-gray-600" : statAccent[label] || "text-gray-800 dark:text-white/90"}`}>
            {value}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</div>
    </div>
);

const POSITION_OPTIONS = [
    { value: "UNASSIGNED", label: "Unassigned" },
    { value: "GOALKEEPER", label: "Goalkeeper" },
    { value: "RIGHT_BACK", label: "Right Back" },
    { value: "LEFT_BACK", label: "Left Back" },
    { value: "CENTER_BACK_1", label: "Center Back 1" },
    { value: "CENTER_BACK_2", label: "Center Back 2" },
    { value: "DEFENSIVE_MIDFIELD", label: "Defensive Midfield" },
    { value: "RIGHT_WING_FORWARD", label: "Right Wing/Forward" },
    { value: "CENTRAL_MIDFIELD", label: "Central Midfield" },
    { value: "STRIKER", label: "Striker" },
    { value: "ATTACKING_MIDFIELD", label: "Attacking Midfield" },
    { value: "LEFT_WING_FORWARD", label: "Left Wing/Forward" },
];

const statAccent: Record<string, string> = {
    Goals: "text-success-600 dark:text-success-500",
    Assists: "text-blue-light-500",
    "G+A": "text-brand-500 dark:text-brand-400",
    Yellow: "text-warning-600 dark:text-orange-400",
    Red: "text-error-600 dark:text-error-500",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "goalsScored", label: "Goals" },
    { value: "assists", label: "Assists" },
    { value: "goalsAndAssists", label: "G+A" },
    { value: "matchesPlayed", label: "Matches" },
    { value: "yellowCards", label: "Yellow Cards" },
    { value: "redCards", label: "Red Cards" },
];

type SortKey = "goalsScored" | "assists" | "goalsAndAssists" | "matchesPlayed" | "yellowCards" | "redCards";

const PlayerStatistics: React.FC = () => {
    const [selectedSeason, setSelectedSeason] = useState<string | undefined>(undefined);
    const [selectedTournament, setSelectedTournament] = useState<number | undefined>(undefined);
    const [position, setPosition] = useState<string | undefined>(undefined);
    const isMobile = useIsMobile(576);
    const [currentPage, setCurrentPage] = useState<number>(1);
    // Web: 20 players per page (5 per row × 4 rows). Mobile: 10 in one column.
    const [pageSize] = useState<number>(isMobile ? 10 : 20);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortKey, setSortKey] = useState<SortKey>("goalsScored");

    const { data: sessionsData, isLoading: sessionsLoading } = useGetTournamentSessionsQuery();

    const { data: tournamentsData, isLoading: tournamentsLoading } = useGetTournamentsByYearQuery(
        { year: selectedSeason || "" },
        { skip: !selectedSeason }
    );

    const { data, isLoading, refetch } = useGetPlayerStatisticsQuery({
        tournamentId: selectedTournament,
        position,
        limit: 100,
    });

    const { data: playersData } = useGetPlayersQuery();
    const photoById = useMemo(() => {
        const map: Record<number, string> = {};
        playersData?.content?.forEach((p) => {
            if (p.photoUrl) {
                map[p.id] = p.photoUrl.startsWith("http") ? p.photoUrl : `${API_URL}${p.photoUrl}`;
            }
        });
        return map;
    }, [playersData]);

    const sortedRows = useMemo(() => {
        const rows = data?.content || [];
        return [...rows].sort((a, b) => b.statistics[sortKey] - a.statistics[sortKey]);
    }, [data, sortKey]);

    const renderCards = () => {
        const rows = sortedRows;
        if (isLoading) return <Loader className="py-10" />;
        if (rows.length === 0) return (
            <div className="py-10 text-center">
                <BarChartOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
                <p className="text-theme-sm text-gray-400 dark:text-gray-500">No player statistics found</p>
            </div>
        );
        const start = (currentPage - 1) * pageSize;
        const paged = rows.slice(start, start + pageSize);
        return (
            <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {paged.map((record, idx) => (
                        <PlayerStatCard
                            key={record.playerId}
                            record={record}
                            photo={photoById[record.playerId]}
                            rank={start + idx + 1}
                        />
                    ))}
                </div>
                <div className="mt-4">
                    <Pagination page={currentPage} totalPages={Math.ceil(rows.length / pageSize)} onChange={setCurrentPage} />
                </div>
            </>
        );
    };

    const renderList = () => {
        const rows = sortedRows;
        if (isLoading) return <Loader className="py-10" />;
        if (rows.length === 0) return (
            <div className="py-10 text-center">
                <BarChartOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
                <p className="text-theme-sm text-gray-400 dark:text-gray-500">No player statistics found</p>
            </div>
        );
        const start = (currentPage - 1) * pageSize;
        const paged = rows.slice(start, start + pageSize);
        return (
            <>
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                                <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">#</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">MP</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">G</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">A</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">G+A</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">YC</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">RC</th>
                                <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paged.map((record, idx) => {
                                const initial = record.playerName?.charAt(0)?.toUpperCase() || "?";
                                const s = record.statistics;
                                const photo = photoById[record.playerId];
                                return (
                                    <tr key={record.playerId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                        <td className="px-3 py-2.5 text-theme-xs font-bold text-brand-500 dark:text-brand-400">{start + idx + 1}</td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 text-theme-xs font-bold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                                    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initial}
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate font-semibold text-gray-800 dark:text-white/90">{record.playerName}</span>
                                                    <span className="text-theme-xs text-gray-400 dark:text-gray-500">{record.position || "—"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{s.matchesPlayed}</td>
                                        <td className={`px-3 py-2.5 text-center font-semibold ${s.goalsScored === 0 ? "text-gray-400 dark:text-gray-600" : statAccent.Goals}`}>{s.goalsScored}</td>
                                        <td className={`px-3 py-2.5 text-center font-semibold ${s.assists === 0 ? "text-gray-400 dark:text-gray-600" : statAccent.Assists}`}>{s.assists}</td>
                                        <td className={`px-3 py-2.5 text-center font-semibold ${s.goalsAndAssists === 0 ? "text-gray-400 dark:text-gray-600" : statAccent["G+A"]}`}>{s.goalsAndAssists}</td>
                                        <td className={`px-3 py-2.5 text-center font-semibold ${s.yellowCards === 0 ? "text-gray-400 dark:text-gray-600" : statAccent.Yellow}`}>{s.yellowCards}</td>
                                        <td className={`px-3 py-2.5 text-center font-semibold ${s.redCards === 0 ? "text-gray-400 dark:text-gray-600" : statAccent.Red}`}>{s.redCards}</td>
                                        <td className="px-3 py-2.5 text-center font-bold text-brand-500 dark:text-brand-400">{computeRating(s).toFixed(1)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4">
                    <Pagination page={currentPage} totalPages={Math.ceil(rows.length / pageSize)} onChange={setCurrentPage} />
                </div>
            </>
        );
    };

    const handleReset = () => {
        setSelectedSeason(undefined);
        setSelectedTournament(undefined);
        setPosition(undefined);
        setCurrentPage(1);
        refetch();
    };

    const handleSeasonChange = (value: string) => {
        setSelectedSeason(value || undefined);
        setSelectedTournament(undefined);
    };

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white/90">
                        <BarChartOutlined className="text-brand-500 dark:text-brand-400" />
                        Player Statistics
                    </h3>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">Goals, assists and disciplinary records across tournaments</p>
                </div>
                <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => {
                            setViewMode("grid");
                            setCurrentPage(1);
                        }}
                        aria-label="Grid view"
                        className={`flex items-center gap-1.5 px-3 py-2 text-theme-sm font-medium transition ${
                            viewMode === "grid" ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                        }`}
                    >
                        <AppstoreOutlined />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setViewMode("list");
                            setCurrentPage(1);
                        }}
                        aria-label="List view"
                        className={`flex items-center gap-1.5 px-3 py-2 text-theme-sm font-medium transition ${
                            viewMode === "list" ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                        }`}
                    >
                        <UnorderedListOutlined />
                    </button>
                </div>
            </div>

            <div className="mb-5 h-0.5 w-full rounded bg-gradient-to-r from-brand-500 to-transparent" />

            {/* Filter bar */}
            <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className={`flex flex-wrap items-center gap-2.5 ${isMobile ? "flex-col items-stretch" : ""}`}>
                    <FormSelect
                        className={`!h-10 ${isMobile ? "w-full" : "w-[150px]"}`}
                        placeholder="Select Season"
                        value={selectedSeason || ""}
                        disabled={sessionsLoading}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                        options={[{ value: "", label: "All" }, ...(sessionsData?.content?.map((season) => ({ value: season, label: season })) || [])]}
                    />

                    <FormSelect
                        className={`!h-10 ${isMobile ? "w-full" : "w-[200px]"}`}
                        placeholder="Select Tournament"
                        value={selectedTournament ?? ""}
                        disabled={!selectedSeason || tournamentsLoading}
                        onChange={(e) => setSelectedTournament(e.target.value ? Number(e.target.value) : undefined)}
                        options={[{ value: "", label: "All" }, ...(tournamentsData?.content?.map((t) => ({ value: t.id, label: t.name })) || [])]}
                    />

                    <FormSelect
                        className={`!h-10 ${isMobile ? "w-full" : "w-[200px]"}`}
                        placeholder="Filter by Position"
                        value={position || ""}
                        onChange={(e) => setPosition(e.target.value || undefined)}
                        options={[{ value: "", label: "All" }, ...POSITION_OPTIONS]}
                    />

                    <FormSelect
                        className={`!h-10 ${isMobile ? "w-full" : "w-[150px]"}`}
                        placeholder="Sort by"
                        value={sortKey}
                        onChange={(e) => {
                            setSortKey(e.target.value as SortKey);
                            setCurrentPage(1);
                        }}
                        options={SORT_OPTIONS}
                    />

                    <Button variant="outline" size="sm" className={isMobile ? "w-full" : ""} onClick={handleReset}>
                        Reset Filters
                    </Button>
                </div>
            </div>

            {viewMode === "grid" ? renderCards() : renderList()}
        </div>

        <PlayerStatsSidebar
            rows={sortedRows}
            photoById={photoById}
            onViewFullRanking={() => {
                setSortKey("goalsAndAssists");
                setViewMode("list");
                setCurrentPage(1);
            }}
        />
        </div>
    );
};

export default PlayerStatistics;
