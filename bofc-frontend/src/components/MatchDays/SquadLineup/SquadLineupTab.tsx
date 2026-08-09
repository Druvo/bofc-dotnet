import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageTeams } from "../../../utils/roleUtils";
import { Team } from "../teamBuilderTypes";
import {
  useGetTeamLineupQuery,
  useUpdateTeamLineupMutation,
  ILineupPlayer,
} from "../../../state/features/matchDays/squadLineupSlice";
import { FORMATION_PRESETS, validateFormation } from "./pitchLayout";
import PitchCard from "./PitchCard";
import BenchCard from "./BenchCard";
import Loader from "../../ui/loader";

const DEFAULT_SQUAD_SIZE = 5;

function buildDefaultLineup(team: Team): { starters: ILineupPlayer[]; bench: ILineupPlayer[] } {
  const pool: ILineupPlayer[] = team.players.map((p) => ({
    playerId: p.playerId,
    playerName: p.playerName,
    playingPosition: p.playingPosition || "UNASSIGNED",
    availability: "FIT",
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
  teams: Team[];
}

export default function SquadLineupTab({ teams }: SquadLineupTabProps) {
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageTeams(loginInfo.roles);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(teams[0]?.teamId ?? null);
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) || null;

  const { data, isLoading } = useGetTeamLineupQuery({ teamId: selectedTeamId ?? 0 }, { skip: !selectedTeamId });
  const [updateTeamLineup] = useUpdateTeamLineupMutation();

  const [squadSize, setSquadSize] = useState(DEFAULT_SQUAD_SIZE);
  const [formation, setFormation] = useState(FORMATION_PRESETS[DEFAULT_SQUAD_SIZE][0]);
  const [starters, setStarters] = useState<ILineupPlayer[]>([]);
  const [bench, setBench] = useState<ILineupPlayer[]>([]);
  const [selectedBenchPlayerId, setSelectedBenchPlayerId] = useState<number | null>(null);
  const [formationError, setFormationError] = useState<string | null>(null);

  // Every interaction here auto-saves (no Save button) by firing updateTeamLineup immediately,
  // which invalidates and refetches the lineup — if the admin makes a second change before the
  // first save's refetch lands, that refetch's server snapshot would otherwise flow straight
  // through this effect and silently overwrite the second, more-recent local edit. Skip re-
  // syncing from the server while any save is still in flight; local state already reflects the
  // latest edit, so there's nothing useful to sync until every in-flight save has settled.
  const pendingSaveCount = useRef(0);

  useEffect(() => {
    if (!selectedTeam) return;
    if (pendingSaveCount.current > 0) return;
    setSelectedBenchPlayerId(null);

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
      toast.error("Failed to save lineup change — please retry");
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

  const handleSelectBenchPlayer = (playerId: number) => {
    setSelectedBenchPlayerId((prev) => (prev === playerId ? null : playerId));
  };

  const handleSlotTap = (starterPlayerId: number) => {
    if (!selectedBenchPlayerId) return;
    const starterIndex = starters.findIndex((p) => p.playerId === starterPlayerId);
    const benchIndex = bench.findIndex((p) => p.playerId === selectedBenchPlayerId);
    if (starterIndex === -1 || benchIndex === -1) return;

    const nextStarters = [...starters];
    const nextBench = [...bench];
    const outgoing = nextStarters[starterIndex];
    const incoming = nextBench[benchIndex];
    nextStarters[starterIndex] = incoming;
    nextBench[benchIndex] = outgoing;

    setStarters(nextStarters);
    setBench(nextBench);
    setSelectedBenchPlayerId(null);
    persist({ squadSize, formation, starters: nextStarters, bench: nextBench });
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
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[1.3fr_1fr]">
          <PitchCard
            squadSize={squadSize}
            formation={formation}
            starters={starters}
            selectedBenchPlayerId={selectedBenchPlayerId}
            formationError={formationError}
            canManage={canManage}
            onSquadSizeChange={handleSquadSizeChange}
            onFormationChange={handleFormationChange}
            onSlotTap={handleSlotTap}
          />
          <BenchCard
            teamName={selectedTeam.teamName}
            bench={bench}
            selectedBenchPlayerId={selectedBenchPlayerId}
            canManage={canManage}
            onSelectBenchPlayer={handleSelectBenchPlayer}
            onCycleAvailability={handleCycleAvailability}
          />
        </div>
      ) : null}
    </div>
  );
}
