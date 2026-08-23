import React from "react";
import { ILineupPlayer } from "../../../state/features/matchDays/squadLineupSlice";
import { getPositionAbbreviation } from "../../../utils/footballPositions";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import Avatar from "../../CommonAtoms/Avatar";
import Badge from "../../ui/badge";
import PositionMenu from "./PositionMenu";
import redGlovesIcon from "../../../assets/red-gloves.png";

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
  selectedPlayerId: number | null;
  canManage: boolean;
  onTapPlayer: (playerId: number) => void;
  onCycleAvailability: (playerId: number) => void;
  onChangePosition: (playerId: number, position: string) => void;
}

export default function BenchCard({
  teamName,
  bench,
  selectedPlayerId,
  canManage,
  onTapPlayer,
  onCycleAvailability,
  onChangePosition,
}: BenchCardProps) {
  const hint = selectedPlayerId
    ? "Tap a starter (or another bench player) to swap"
    : "Tap a player, then tap another to swap or sub";

  return (
    <div>
      <div className="mb-1 text-theme-sm font-bold text-gray-800 dark:text-white/90">Bench - {teamName}</div>
      <div className="mb-3.5 text-theme-xs text-gray-400 dark:text-gray-500">{canManage ? hint : "Bench"}</div>

      <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
        {bench.length === 0 ? (
          <p className="text-theme-xs text-gray-400 dark:text-gray-500">No bench players.</p>
        ) : (
          bench.map((player) => {
            const selected = selectedPlayerId === player.playerId;
            const isGoalkeeper = player.playingPosition === "GOALKEEPER";
            return (
              <div
                key={player.playerId}
                onClick={() => canManage && onTapPlayer(player.playerId)}
                className={`group flex items-center gap-2.5 rounded-lg border p-2 ${canManage ? "cursor-pointer" : ""} ${
                  selected
                    ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
                }`}
              >
                <div className="relative h-8 w-8 shrink-0">
                  <Avatar name={player.playerName} seed={player.playerId} size={32} src={toAbsolutePlayerPhotoUrl(player.photoUrl)} />
                  {player.isCaptain && (
                    <span
                      title="Captain"
                      className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-[#d69a2f] text-[7px] font-bold leading-none text-white dark:border-[var(--color-paper-2)]"
                    >
                      C
                    </span>
                  )}
                  {isGoalkeeper && (
                    <img
                      src={redGlovesIcon}
                      alt="Goalkeeper"
                      title="Goalkeeper"
                      className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full border border-white bg-white p-[1px] dark:border-[var(--color-paper-2)]"
                    />
                  )}
                </div>
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
                {canManage && (
                  <PositionMenu
                    playerId={player.playerId}
                    onChangePosition={onChangePosition}
                    triggerClassName="shrink-0 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-white/10"
                  />
                )}
                {selected && <span className="shrink-0 text-theme-xs font-bold text-brand-500 dark:text-brand-400">TAP TARGET</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
