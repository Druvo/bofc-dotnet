import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageTeams } from "../../../utils/roleUtils";
import { LineupTeam } from "../teamBuilderTypes";
import {
  useGetTeamLineupQuery,
  useUpdateTeamLineupMutation,
  ILineupPlayer,
} from "../../../state/features/matchDays/squadLineupSlice";
import { useUpdatePlayerInTeamMutation } from "../../../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import { FORMATION_PRESETS, validateFormation } from "./pitchLayout";
import PitchCard from "./PitchCard";
import Loader from "../../ui/loader";

/** Which player is currently "armed" for a swap, and which list they came from - tapping any
 * other player (starter or bench) while one is armed completes the swap. Symmetric in both
 * directions (start from a starter or from a bench player, same result) - matches the standard
 * tap-to-select-then-target pattern most mobile squad builders (e.g. Fantasy Premier League) use
 * instead of drag-and-drop. */
type SelectedPlayer = { playerId: number; from: "starter" | "bench" } | null;

const DEFAULT_SQUAD_SIZE = 5;

function buildDefaultLineup(team: LineupTeam): { starters: ILineupPlayer[]; bench: ILineupPlayer[] } {
  const pool: ILineupPlayer[] = team.players.map((p) => ({
    playerId: p.playerId,
    playerName: p.playerName,
    playingPosition: p.playingPosition || "UNASSIGNED",
    availability: "FIT",
    isCaptain: p.isCaptain,
    photoKey: p.photoKey,
    photoUrl: p.photoUrl,
  }));

  const gkIndex = pool.findIndex((p) => p.playingPosition === "GOALKEEPER");
  if (gkIndex > 0) {
    const [gk] = pool.splice(gkIndex, 1);
    pool.unshift(gk);
  }

  return {
    starters: pool.slice(0, DEFAULT_SQUAD_SIZE),
    bench: pool.slice(DEFAULT_SQUAD_SIZE),
  };
}

function rebuildPoolsForSize(starters: ILineupPlayer[], bench: ILineupPlayer[], squadSize: number) {
  const pool = [...starters, ...bench];
  const gkIndex = pool.findIndex((p) => p.playingPosition === "GOALKEEPER");
  if (gkIndex > 0) {
    const [gk] = pool.splice(gkIndex, 1);
    pool.unshift(gk);
  }
  return { starters: pool.slice(0, squadSize), bench: pool.slice(squadSize) };
}

interface SquadLineupTabProps {
  teams: LineupTeam[];
}

export default function SquadLineupTab({ teams }: SquadLineupTabProps) {
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageTeams(loginInfo.roles);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(teams[0]?.teamId ?? null);
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) || null;

  const { data, isLoading } = useGetTeamLineupQuery({ teamId: selectedTeamId ?? 0 }, { skip: !selectedTeamId });
  const [updateTeamLineup] = useUpdateTeamLineupMutation();
  const [updatePlayerInTeam] = useUpdatePlayerInTeamMutation();

  const [squadSize, setSquadSize] = useState(DEFAULT_SQUAD_SIZE);
  const [formation, setFormation] = useState(FORMATION_PRESETS[DEFAULT_SQUAD_SIZE][0]);
  const [starters, setStarters] = useState<ILineupPlayer[]>([]);
  const [bench, setBench] = useState<ILineupPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer>(null);
  const [formationError, setFormationError] = useState<string | null>(null);

  // Every interaction here auto-saves (no Save button) by firing updateTeamLineup immediately,
  // which invalidates and refetches the lineup - if the admin makes a second change before the
  // first save's refetch lands, that refetch's server snapshot would otherwise flow straight
  // through this effect and silently overwrite the second, more-recent local edit. Skip re-
  // syncing from the server while any save is still in flight; local state already reflects the
  // latest edit, so there's nothing useful to sync until every in-flight save has settled.
  const pendingSaveCount = useRef(0);

  useEffect(() => {
    if (!selectedTeam) return;
    if (pendingSaveCount.current > 0) return;
    setSelectedPlayer(null);

    if (data?.content?.squadSize) {
      setSquadSize(data.content.squadSize);
      setFormation(data.content.formation || FORMATION_PRESETS[data.content.squadSize][0]);
      setStarters(data.content.starters);
      setBench(data.content.bench);
    } else if (!isLoading) {
      const defaults = buildDefaultLineup(selectedTeam);
      setSquadSize(DEFAULT_SQUAD_SIZE);
      setFormation(FORMATION_PRESETS[DEFAULT_SQUAD_SIZE][0]);
      setStarters(defaults.starters);
      setBench(defaults.bench);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId, data, isLoading]);

  const persist = async (next: {
    squadSize: number;
    formation: string;
    starters: ILineupPlayer[];
    bench: ILineupPlayer[];
  }) => {
    if (!selectedTeamId) return;
    pendingSaveCount.current += 1;
    try {
      await updateTeamLineup({
        teamId: selectedTeamId,
        squadSize: next.squadSize,
        formation: next.formation,
        starters: next.starters.map((p) => ({ playerId: p.playerId, availability: p.availability })),
        bench: next.bench.map((p) => ({ playerId: p.playerId, availability: p.availability })),
      }).unwrap();
    } catch {
      toast.error("Failed to save lineup change - please retry");
    } finally {
      pendingSaveCount.current -= 1;
    }
  };

  const handleSquadSizeChange = (size: number) => {
    const rebuilt = rebuildPoolsForSize(starters, bench, size);
    const nextFormation = FORMATION_PRESETS[size][0];
    setSquadSize(size);
    setFormation(nextFormation);
    setStarters(rebuilt.starters);
    setBench(rebuilt.bench);
    setFormationError(null);
    persist({ squadSize: size, formation: nextFormation, starters: rebuilt.starters, bench: rebuilt.bench });
  };

  const handleFormationChange = (nextFormation: string) => {
    const error = validateFormation(nextFormation, squadSize);
    setFormationError(error);
    if (error) return;
    setFormation(nextFormation);
    persist({ squadSize, formation: nextFormation, starters, bench });
  };

  // Tap-to-select-then-target, symmetric regardless of which list either player came from:
  // starter+starter swaps their pitch slots, starter+bench subs one in for the other,
  // bench+bench reorders bench order. Tapping the same player again (or tapping empty space
  // via a fresh selection of the same id) just deselects.
  const handleTapPlayer = (playerId: number, from: "starter" | "bench") => {
    if (!selectedPlayer) {
      setSelectedPlayer({ playerId, from });
      return;
    }
    if (selectedPlayer.playerId === playerId) {
      setSelectedPlayer(null);
      return;
    }

    const aIndex = (selectedPlayer.from === "starter" ? starters : bench).findIndex((p) => p.playerId === selectedPlayer.playerId);
    const bIndex = (from === "starter" ? starters : bench).findIndex((p) => p.playerId === playerId);
    if (aIndex === -1 || bIndex === -1) {
      setSelectedPlayer({ playerId, from });
      return;
    }

    let nextStarters = starters;
    let nextBench = bench;

    if (selectedPlayer.from === "starter" && from === "starter") {
      nextStarters = [...starters];
      [nextStarters[aIndex], nextStarters[bIndex]] = [nextStarters[bIndex], nextStarters[aIndex]];
    } else if (selectedPlayer.from === "bench" && from === "bench") {
      nextBench = [...bench];
      [nextBench[aIndex], nextBench[bIndex]] = [nextBench[bIndex], nextBench[aIndex]];
    } else {
      // One starter, one bench player - the actual substitution, regardless of tap order.
      const starterIndex = selectedPlayer.from === "starter" ? aIndex : bIndex;
      const benchIndex = selectedPlayer.from === "bench" ? aIndex : bIndex;
      nextStarters = [...starters];
      nextBench = [...bench];
      const outgoing = nextStarters[starterIndex];
      const incoming = nextBench[benchIndex];
      nextStarters[starterIndex] = incoming;
      nextBench[benchIndex] = outgoing;
    }

    setStarters(nextStarters);
    setBench(nextBench);
    setSelectedPlayer(null);
    persist({ squadSize, formation, starters: nextStarters, bench: nextBench });
  };

  const handleChangePosition = async (playerId: number, playingPosition: string) => {
    if (!selectedTeamId || !selectedTeam) return;
    const rosterPlayer = selectedTeam.players.find((p) => p.playerId === playerId);
    if (!rosterPlayer) return;

    const nextStarters = starters.map((p) => (p.playerId === playerId ? { ...p, playingPosition } : p));
    const nextBench = bench.map((p) => (p.playerId === playerId ? { ...p, playingPosition } : p));
    setStarters(nextStarters);
    setBench(nextBench);

    try {
      // Position lives on the roster (TeamPlayer), not the lineup - reuses the same Team Building
      // update call, so isCaptain/jerseyNumber/role must be carried over explicitly or they'd
      // silently reset to their defaults (isCaptain:false, role:"PLAYER").
      await updatePlayerInTeam({
        teamId: selectedTeamId,
        playerId,
        playingPosition,
        isCaptain: rosterPlayer.isCaptain,
        teamPlayerRole: rosterPlayer.teamPlayerRole,
        jerseyNumber: rosterPlayer.jerseyNumber,
      }).unwrap();
    } catch (error: any) {
      setStarters(starters);
      setBench(bench);
      toast.error(normalizeErrorMessage(error?.data || error, "Failed to change position"));
    }
  };

  const cycleAvailability = (current: ILineupPlayer["availability"]): ILineupPlayer["availability"] => {
    if (current === "FIT") return "DOUBTFUL";
    if (current === "DOUBTFUL") return "INJURED";
    return "FIT";
  };

  const handleCycleAvailability = (playerId: number) => {
    const starterIndex = starters.findIndex((p) => p.playerId === playerId);
    const benchIndex = bench.findIndex((p) => p.playerId === playerId);

    const nextStarters = starterIndex === -1 ? starters : starters.map((p, i) => (i === starterIndex ? { ...p, availability: cycleAvailability(p.availability) } : p));
    const nextBench = benchIndex === -1 ? bench : bench.map((p, i) => (i === benchIndex ? { ...p, availability: cycleAvailability(p.availability) } : p));

    setStarters(nextStarters);
    setBench(nextBench);
    persist({ squadSize, formation, starters: nextStarters, bench: nextBench });
  };

  if (teams.length === 0) {
    return <p className="text-theme-sm text-gray-400 dark:text-gray-500">Add teams in Team Building first.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => (
          <button
            key={team.teamId}
            type="button"
            onClick={() => setSelectedTeamId(team.teamId)}
            className={`rounded-lg border px-3 py-1.5 text-theme-sm font-medium ${
              team.teamId === selectedTeamId
                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            {team.teamName}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader className="py-10" />
      ) : selectedTeam ? (
        <PitchCard
          squadSize={squadSize}
          formation={formation}
          starters={starters}
          selectedPlayerId={selectedPlayer?.playerId ?? null}
          formationError={formationError}
          canManage={canManage}
          onSquadSizeChange={handleSquadSizeChange}
          onFormationChange={handleFormationChange}
          onTapPlayer={(playerId) => handleTapPlayer(playerId, "starter")}
          onChangePosition={handleChangePosition}
          teamName={selectedTeam.teamName}
          bench={bench}
          onTapBenchPlayer={(playerId) => handleTapPlayer(playerId, "bench")}
          onCycleAvailability={handleCycleAvailability}
        />
      ) : null}
    </div>
  );
}
