import React, { useState } from "react";
import { toast } from "react-toastify";
import { SafetyOutlined, LoadingOutlined, StarFilled } from "@ant-design/icons";
import {
    useAutoAssignGoalkeepersMutation,
    useLazyGetGoalkeeperRankingQuery,
    useClearGoalkeepersMutation,
} from "../../../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import Badge from "../../ui/badge";

type RankingPlayer = {
    rank: number;
    playerId: number;
    playerName: string;
    played: number;
    inGoal: number;
    balance: number;
    isDefaultGoalkeeper: boolean;
    status: "NEXT_UP" | "ELIGIBLE" | "RESTING" | "CURRENT_GOALKEEPER";
};

const STATUS_LABEL: Record<RankingPlayer["status"], string> = {
    NEXT_UP: "Next Up",
    ELIGIBLE: "Eligible",
    RESTING: "Resting",
    CURRENT_GOALKEEPER: "Current Goalkeeper",
};

const STATUS_BADGE_VARIANT: Record<RankingPlayer["status"], "success" | "light" | "warning" | "dark" | "info"> = {
    NEXT_UP: "success",
    ELIGIBLE: "light",
    RESTING: "warning",
    CURRENT_GOALKEEPER: "info",
};

// Balance bar scaled against the biggest |balance| in the team so bars stay comparable within a
// team's own table (matching the reference doc's "Rakib beats Sunipoon" table, not a fixed scale).
function BalanceBar({ balance, maxAbs }: { balance: number; maxAbs: number }) {
    const pct = maxAbs > 0 ? Math.min(100, (Math.abs(balance) / maxAbs) * 100) : 0;
    const positive = balance >= 0;
    return (
        <div className="flex items-center gap-2">
            <span className={`w-12 shrink-0 text-right text-theme-xs font-semibold ${positive ? "text-success-600 dark:text-success-500" : "text-gray-400"}`}>
                {positive ? "+" : ""}
                {balance.toFixed(1)}
            </span>
            <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                    className={`h-full rounded-full ${positive ? "bg-success-500" : "bg-gray-400"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// Shows the club's "Whose turn in goal" ranking (played/in goal/balance/status per player, same
// fairness formula as the reference doc) before filling in a goalkeeper for every team on this
// MatchDay that doesn't already have one - see TeamController's goalkeeper-ranking / auto-assign-
// goalkeepers endpoints for the actual math. Never overrides a team's existing goalkeeper choice.
export default function AutoAssignGoalkeeperButton({
    matchDayId,
    isOpen,
    onOpenChange,
    onOpenRecords,
}: {
    matchDayId: number;
    /** Controlled open state - lets a parent cross-link this with Goalkeeper Records. Falls back
     * to its own internal state when omitted. */
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Renders a button in the modal that switches to the Goalkeeper Records panel instead. */
    onOpenRecords?: () => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = isOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const [fetchRanking, { data: ranking, isFetching: isLoadingRanking }] = useLazyGetGoalkeeperRankingQuery();
    const [autoAssign, { isLoading: isAssigning }] = useAutoAssignGoalkeepersMutation();
    const [clearGoalkeepers, { isLoading: isClearing }] = useClearGoalkeepersMutation();

    const showModal = () => {
        setOpen(true);
        fetchRanking({ matchDayId });
    };

    const handleClear = async () => {
        try {
            const result = await clearGoalkeepers({ matchDayId }).unwrap();
            const count = result.content.cleared.length;
            toast.success(count > 0 ? `Cleared goalkeeper${count > 1 ? "s" : ""} for ${count} team${count > 1 ? "s" : ""}` : "No goalkeepers to clear");
            fetchRanking({ matchDayId });
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to clear goalkeepers"));
        }
    };

    const handleConfirm = async () => {
        try {
            const result = await autoAssign({ matchDayId }).unwrap();
            const { teams, pastMatchDaysMissingGoalkeeperData } = result.content;
            const teamsWithAssignments = teams.filter((t) => t.assigned.length > 0);
            const totalAssigned = teams.reduce((sum, t) => sum + t.assigned.length, 0);

            if (totalAssigned > 0) {
                toast.success(
                    `Assigned ${totalAssigned} goalkeeper${totalAssigned > 1 ? "s" : ""} across ${teamsWithAssignments.length} of ${teams.length} team${teams.length > 1 ? "s" : ""}`
                );
            } else {
                toast.info("No teams needed a goalkeeper assigned");
            }

            teams
                .filter((t) => t.assigned.length === 0 && t.skippedReason && t.skippedReason !== "Already has enough goalkeepers")
                .forEach((t) => toast.warning(`${t.teamName}: ${t.skippedReason}`));

            if (pastMatchDaysMissingGoalkeeperData > 0) {
                toast.info(
                    `${pastMatchDaysMissingGoalkeeperData} past match day${pastMatchDaysMissingGoalkeeperData > 1 ? "s have" : " has"} no goalkeeper recorded - balances above are partly an estimate`
                );
            }

            setOpen(false);
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to auto-assign goalkeepers"));
        }
    };

    const teams = ranking?.content.teams || [];
    const missingDataCount = ranking?.content.pastMatchDaysMissingGoalkeeperData || 0;
    const anyAssignable = teams.some((t) => t.players.some((p) => p.status === "NEXT_UP"));

    const anyCurrentGoalkeepers = teams.some((t) => t.players.some((p) => p.status === "CURRENT_GOALKEEPER"));

    return (
        <>
            <Button type="button" variant="outline" size="sm" startIcon={<SafetyOutlined />} onClick={showModal}>
                Assign Goalkeepers
            </Button>

            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title="Whose Turn in Goal"
                className="max-w-[95vw]"
                footer={
                    <>
                        {onOpenRecords && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mr-auto"
                                onClick={() => {
                                    setOpen(false);
                                    onOpenRecords();
                                }}
                            >
                                Goalkeeper Records
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={isAssigning || isLoadingRanking || !anyAssignable}
                            title={!isLoadingRanking && !anyAssignable ? "Every team already has a goalkeeper - nothing to assign" : undefined}
                            onClick={handleConfirm}
                        >
                            {isAssigning ? "Assigning..." : "Confirm Auto-Assign"}
                        </Button>
                    </>
                }
            >
                <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
                    Ranked by turns owed (attendance-weighted) minus turns served. Resting (kept goal in
                    either of the last two match days) and excluded players are never picked, however
                    much they're owed. <StarFilled className="text-warning-500" /> <span className="font-semibold">Default goalkeepers</span> (players
                    who only ever want to play goalkeeper) get first claim on a team's slot(s) ahead of the balance
                    ranking - if more of them exist on a team than it has slots for, who's picked is a random draw.
                    Only the highlighted <span className="font-semibold">Next Up</span> players
                    per team get assigned (up to the configured minimum goalkeepers per team, see Settings) -
                    teams already at that count are left untouched.
                </p>

                {!isLoadingRanking && !anyAssignable && teams.length > 0 && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5">
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                            {anyCurrentGoalkeepers
                                ? "Every team already has a goalkeeper (see \"Current Goalkeeper\" below) - clear them to assign again."
                                : "No eligible players to assign right now."}
                        </p>
                        {anyCurrentGoalkeepers && (
                            <Button type="button" variant="outline" size="sm" disabled={isClearing} onClick={handleClear} className="shrink-0">
                                {isClearing ? "Clearing..." : "Clear Current Assignments"}
                            </Button>
                        )}
                    </div>
                )}

                {missingDataCount > 0 && (
                    <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-theme-xs text-warning-600 dark:bg-warning-500/10 dark:text-orange-400">
                        {missingDataCount} past match day{missingDataCount > 1 ? "s have" : " has"} no goalkeeper recorded - balances below are partly an estimate.
                    </p>
                )}

                {isLoadingRanking ? (
                    <div className="flex items-center justify-center py-10 text-gray-400">
                        <LoadingOutlined className="mr-2" /> Loading ranking...
                    </div>
                ) : (
                    <div className="flex flex-row flex-wrap gap-4">
                        {teams.map((team) => {
                            const maxAbs = Math.max(1, ...team.players.map((p) => Math.abs(p.balance)));
                            return (
                                <div key={team.teamId} className="min-w-[320px] flex-1">
                                    <h3 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{team.teamName}</h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-[var(--color-rule)]">
                                        <table className="w-full border-collapse text-theme-xs">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-[var(--color-paper-2)]">
                                                    <th className="px-2.5 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">#</th>
                                                    <th className="px-2.5 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                                                    <th className="px-2.5 py-2 text-right font-semibold text-gray-500 dark:text-gray-400">Played</th>
                                                    <th className="px-2.5 py-2 text-right font-semibold text-gray-500 dark:text-gray-400">In Goal</th>
                                                    <th className="px-2.5 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Balance</th>
                                                    <th className="px-2.5 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {team.players.map((p) => (
                                                    <tr key={p.playerId} className={p.status === "NEXT_UP" ? "bg-success-50/40 dark:bg-success-500/10" : ""}>
                                                        <td className="px-2.5 py-2 text-gray-500 dark:text-gray-400">{p.rank}</td>
                                                        <td className="px-2.5 py-2 font-medium text-gray-700 dark:text-gray-300">
                                                            <span className="flex items-center gap-1">
                                                                {p.isDefaultGoalkeeper && (
                                                                    <StarFilled className="text-theme-xs text-warning-500" title="Default goalkeeper" />
                                                                )}
                                                                {p.playerName}
                                                            </span>
                                                        </td>
                                                        <td className="px-2.5 py-2 text-right text-gray-600 dark:text-gray-400">{p.played}</td>
                                                        <td className="px-2.5 py-2 text-right text-gray-600 dark:text-gray-400">{p.inGoal}</td>
                                                        <td className="px-2.5 py-2"><BalanceBar balance={p.balance} maxAbs={maxAbs} /></td>
                                                        <td className="px-2.5 py-2">
                                                            <Badge variant={STATUS_BADGE_VARIANT[p.status]} className="whitespace-normal text-center leading-tight">
                                                                {STATUS_LABEL[p.status]}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {team.players.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-2.5 py-3 text-center text-gray-400">No players on this team</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                        {teams.length === 0 && (
                            <p className="py-10 text-center text-gray-400">No teams yet</p>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
