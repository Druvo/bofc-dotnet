import React from "react";
import { ILineupPlayer } from "../../../state/features/matchDays/squadLineupSlice";
import { getPositionAbbreviation } from "../../../utils/footballPositions";
import Avatar from "../../CommonAtoms/Avatar";
import Badge from "../../ui/badge";

const AVAILABILITY_VARIANT: Record<string, "success" | "warning" | "error"> = {
  FIT: "success",
  DOUBTFUL: "warning",
  INJURED: "error",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  FIT: "Fit",
  DOUBTFUL: "Doubtful",
  INJURED: "Injured",
};

interface BenchCardProps {
  teamName: string;
  bench: ILineupPlayer[];
  selectedBenchPlayerId: number | null;
  canManage: boolean;
  onSelectBenchPlayer: (playerId: number) => void;
  onCycleAvailability: (playerId: number) => void;
}

export default function BenchCard({
  teamName,
  bench,
  selectedBenchPlayerId,
  canManage,
  onSelectBenchPlayer,
  onCycleAvailability,
}: BenchCardProps) {
  const hint = selectedBenchPlayerId
    ? "Tap a starter on the pitch to swap"
    : "Tap a player, then tap the pitch slot";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-1 text-theme-sm font-bold text-gray-800 dark:text-white/90">Bench - {teamName}</div>
      <div className="mb-3.5 text-theme-xs text-gray-400 dark:text-gray-500">{canManage ? hint : "Bench"}</div>

      <div className="flex flex-col gap-2">
        {bench.length === 0 ? (
          <p className="text-theme-xs text-gray-400 dark:text-gray-500">No bench players.</p>
        ) : (
          bench.map((player) => {
            const armed = selectedBenchPlayerId === player.playerId;
            return (
              <div
                key={player.playerId}
                onClick={() => canManage && onSelectBenchPlayer(player.playerId)}
                className={`flex items-center gap-2.5 rounded-lg border p-2 ${canManage ? "cursor-pointer" : ""} ${
                  armed
                    ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
                }`}
              >
                <Avatar name={player.playerName} seed={player.playerId} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">{player.playerName}</div>
                  <div className="text-theme-xs text-gray-400 dark:text-gray-500">{getPositionAbbreviation(player.playingPosition)}</div>
                </div>
                <span
                  onClick={(e) => {
                    if (!canManage) return;
                    e.stopPropagation();
                    onCycleAvailability(player.playerId);
                  }}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  <Badge variant={AVAILABILITY_VARIANT[player.availability]}>{AVAILABILITY_LABEL[player.availability]}</Badge>
                </span>
                {armed && <span className="shrink-0 text-theme-xs font-bold text-brand-500 dark:text-brand-400">TAP A SLOT</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
