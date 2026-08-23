import React, { useState } from "react";
import { ILineupPlayer } from "../../../state/features/matchDays/squadLineupSlice";
import { getPositionAbbreviation } from "../../../utils/footballPositions";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import { getFirstName } from "./initials";
import { SQUAD_SIZES, FORMATION_PRESETS, computeSlots } from "./pitchLayout";
import PlayerAvatar from "../../CommonAtoms/Avatar";
import PositionMenu from "./PositionMenu";
import BenchCard from "./BenchCard";
import redGlovesIcon from "../../../assets/red-gloves.png";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-theme-xs font-bold ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          : "border-gray-200 bg-transparent text-gray-500 dark:border-[var(--color-rule)] dark:text-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

interface PitchCardProps {
  squadSize: number;
  formation: string;
  starters: ILineupPlayer[];
  selectedPlayerId: number | null;
  formationError: string | null;
  canManage: boolean;
  onSquadSizeChange: (size: number) => void;
  onFormationChange: (formation: string) => void;
  onTapPlayer: (playerId: number) => void;
  onChangePosition: (playerId: number, position: string) => void;
  teamName: string;
  bench: ILineupPlayer[];
  onTapBenchPlayer: (playerId: number) => void;
  onCycleAvailability: (playerId: number) => void;
}

export default function PitchCard({
  squadSize,
  formation,
  starters,
  selectedPlayerId,
  formationError,
  canManage,
  onSquadSizeChange,
  onFormationChange,
  onTapPlayer,
  onChangePosition,
  teamName,
  bench,
  onTapBenchPlayer,
  onCycleAvailability,
}: PitchCardProps) {
  const [customFormationInput, setCustomFormationInput] = useState("");
  const slots = computeSlots(squadSize, formation);
  const hint = canManage
    ? selectedPlayerId
      ? "Tap another player to swap"
      : "Tap a player, then tap another to swap or sub"
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Controls + bench - kept narrow and fixed-width on wide screens so the pitch on the
            right gets the rest of the space instead of splitting evenly. */}
        <div className="flex flex-col lg:w-[280px] lg:shrink-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-theme-sm font-bold text-gray-800 dark:text-white/90">Starting Lineup</div>
            {hint && <div className="text-theme-xs text-gray-400 dark:text-gray-500">{hint}</div>}
          </div>

          <div className="mb-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Squad Size</div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SQUAD_SIZES.map((size) => (
              <Pill key={size} active={size === squadSize} onClick={() => canManage && onSquadSizeChange(size)}>
                {size}-a-side
              </Pill>
            ))}
          </div>

          <div className="mb-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Formation</div>
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            {(FORMATION_PRESETS[squadSize] || []).map((preset) => (
              <Pill key={preset} active={preset === formation} onClick={() => canManage && onFormationChange(preset)}>
                {preset}
              </Pill>
            ))}
            {canManage && (
              <>
                <input
                  placeholder="Custom e.g. 4-3-2"
                  value={customFormationInput}
                  onChange={(e) => setCustomFormationInput(e.target.value)}
                  className="w-[130px] rounded-full border border-gray-300 bg-transparent px-3 py-1.5 text-theme-xs text-gray-800 outline-none placeholder:text-gray-400 focus:border-brand-300 dark:border-[var(--color-rule)] dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customFormationInput.trim()) onFormationChange(customFormationInput.trim());
                  }}
                  className="rounded-full border border-brand-500 bg-transparent px-3 py-1.5 text-theme-xs font-bold text-brand-600 dark:text-brand-400"
                >
                  Apply
                </button>
              </>
            )}
          </div>
          {formationError && <div className="mb-2.5 text-theme-xs text-error-500">{formationError}</div>}

          <div className="my-3 h-px bg-gray-100 dark:bg-[var(--color-rule)]" />

          <BenchCard
            teamName={teamName}
            bench={bench}
            selectedPlayerId={selectedPlayerId}
            canManage={canManage}
            onTapPlayer={onTapBenchPlayer}
            onCycleAvailability={onCycleAvailability}
            onChangePosition={onChangePosition}
          />
        </div>

        {/* Pitch - deliberately kept as a fixed dark-green field with bright markers regardless
            of app theme (a football pitch illustration, not theme-reactive chrome) - the neon
            accent on player tokens is a genuine contrast/visibility choice against the dark
            field, not just styling, so it's left as-is while the surrounding card was reskinned. */}
        <div
          // Standard FIFA pitch is 105m x 68m - drawn goal-to-goal vertically, that's a
          // height:width ratio of ~1.54:1, not the near-square box a plain h-[460px]/w-full
          // produced on wide containers. Capping the width and deriving height from
          // aspect-ratio keeps it looking like an actual slim, tall field at any screen size.
          // Wider cap than before (320->520) now that it's not sharing a row with a sibling
          // bench card - it's the sole content of the right column, so it can fill more of it.
          className="relative mx-auto w-full max-w-[520px] flex-1 overflow-hidden rounded-[8px] border-2 border-white/35"
          style={{
            aspectRatio: "68 / 105",
            background: "repeating-linear-gradient(0deg,#1b3a1d 0,#1b3a1d 40px,#183317 40px,#183317 80px)",
          }}
        >
        {/* Halfway line + center circle */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/35" />
        <div className="absolute left-1/2 top-1/2 h-[110px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
        <div className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />

        {/* Own (bottom) penalty area */}
        <div className="absolute bottom-0 left-1/2 h-[100px] w-[62%] -translate-x-1/2 border-2 border-b-0 border-white/35" />
        <div className="absolute bottom-0 left-1/2 h-[42px] w-[30%] -translate-x-1/2 border-2 border-b-0 border-white/35" />
        <div className="absolute bottom-[58px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-white/50" />
        <div className="absolute bottom-0 left-1/2 h-[14px] w-[26%] translate-x-[-50%] translate-y-[60%] rounded-t-[3px] border-2 border-b-0 border-white/40 bg-[#0b0b0d]" />

        {/* Opponent (top) penalty area */}
        <div className="absolute left-1/2 top-0 h-[100px] w-[62%] -translate-x-1/2 border-2 border-t-0 border-white/35" />
        <div className="absolute left-1/2 top-0 h-[42px] w-[30%] -translate-x-1/2 border-2 border-t-0 border-white/35" />
        <div className="absolute left-1/2 top-[58px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-white/50" />
        <div className="absolute left-1/2 top-0 h-[14px] w-[26%] translate-x-[-50%] translate-y-[-60%] rounded-b-[3px] border-2 border-t-0 border-white/40 bg-[#0b0b0d]" />

        {/* Corner arcs */}
        <div className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-2 border-white/35" />
        <div className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border-2 border-white/35" />
        <div className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full border-2 border-white/35" />
        <div className="absolute -bottom-2.5 -right-2.5 h-5 w-5 rounded-full border-2 border-white/35" />

        {slots.map((slot, index) => {
          const player = starters[index];
          if (!player) return null;
          const selected = selectedPlayerId === player.playerId;
          const isGoalkeeper = player.playingPosition === "GOALKEEPER";
          return (
            <div
              key={player.playerId}
              onClick={() => canManage && onTapPlayer(player.playerId)}
              style={{ left: `${slot.left}%`, top: `${slot.top}%` }}
              className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 ${
                canManage ? "cursor-pointer" : ""
              }`}
            >
              <div className="relative h-11 w-11">
                <PlayerAvatar
                  name={player.playerName}
                  seed={player.playerId}
                  size={44}
                  src={toAbsolutePlayerPhotoUrl(player.photoUrl)}
                  className={`border-2 ${selected ? "border-white ring-2 ring-brand-400" : "border-[#0b0b0d]"}`}
                />
                {player.isCaptain && (
                  <span
                    title="Captain"
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#0b0b0d] bg-[#d69a2f] text-[8px] font-bold leading-none text-white"
                  >
                    C
                  </span>
                )}
                {isGoalkeeper && (
                  <img
                    src={redGlovesIcon}
                    alt="Goalkeeper"
                    title="Goalkeeper"
                    className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full border border-[#0b0b0d] bg-white p-[1px]"
                  />
                )}
                {canManage && (
                  <PositionMenu
                    playerId={player.playerId}
                    onChangePosition={onChangePosition}
                    triggerClassName="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#0b0b0d] bg-white text-[9px] leading-none text-[#0b0b0d] opacity-0 shadow transition-opacity group-hover:opacity-100"
                  />
                )}
              </div>
              <div className="whitespace-nowrap rounded-[5px] bg-[#0b0b0d] px-[7px] py-[2px] text-center text-[10.5px] text-[#dedee0]">
                {getFirstName(player.playerName)}
                <br />
                <span className="text-[9px] text-[#8b8b90]">{getPositionAbbreviation(player.playingPosition)}</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
