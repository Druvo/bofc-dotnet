import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { PlusOutlined, ThunderboltOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import {
  useGetFixturesQuery,
  useDeleteMatchMutation,
} from "../../../state/features/fixtures/fixturesSlice";
import { IFixture, MatchStatus } from "../../../state/features/fixtures/fixtureTypes";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { getStatusText } from "../../../utils/matchStatusUtils";
import { showBdLocalTime } from "../../../utils/utils";
import { getJerseySwatch } from "../../../utils/jerseyColors";
import Button from "../../ui/button";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";
import TabsNav from "../../ui/tabs";
import FixtureGenerationModal from "./FixtureGenerationModal";
import AddMatchModal from "./AddMatchModal";
import EditFixtureModal from "./EditFixtureModal";

interface SimpleMatchesPanelProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  tournamentStartDate?: string;
}

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "info" | "light"> = {
  [MatchStatus.SCHEDULED]: "warning",
  [MatchStatus.ONGOING]: "info",
  [MatchStatus.PAUSED]: "light",
  [MatchStatus.COMPLETED]: "success",
};

function JerseyDot({ color }: { color?: string | null }) {
  const swatch = getJerseySwatch(color);
  if (!swatch) return null;
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600"
      style={{ backgroundColor: swatch }}
    />
  );
}

function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function TeamAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-50 text-theme-xs font-bold text-success-600 dark:bg-success-500/15 dark:text-success-500">
      {getTeamInitials(name)}
    </span>
  );
}

export default function SimpleMatchesPanel({ tournamentId, teams, tournamentStartDate }: SimpleMatchesPanelProps) {
  const navigate = useNavigate();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin =
    loginInfo.roles.includes("ADMIN") ||
    loginInfo.roles.includes("SUPERADMIN") ||
    loginInfo.roles.includes("COORDINATOR");

  const { data, isLoading } = useGetFixturesQuery({ tournamentId });
  const [deleteMatch] = useDeleteMatchMutation();

  const [filter, setFilter] = useState<"all" | "upcoming" | "ended">("all");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingFixture, setEditingFixture] = useState<IFixture | null>(null);

  const filteredFixtures = useMemo(() => {
    const fixtures = data?.content || [];
    const sorted = [...fixtures].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    if (filter === "ended") return sorted.filter((f) => f.matchStatus === MatchStatus.COMPLETED);
    if (filter === "upcoming") return sorted.filter((f) => f.matchStatus !== MatchStatus.COMPLETED);
    return sorted;
  }, [data, filter]);

  const handleDelete = async (matchId: number) => {
    if (!window.confirm("Delete this match?")) return;
    try {
      await deleteMatch({ matchId }).unwrap();
      toast.success("Match deleted");
    } catch {
      toast.error("Failed to delete match");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsNav
          active={filter}
          onChange={(key) => setFilter(key as "all" | "upcoming" | "ended")}
          items={[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
            { key: "ended", label: "Ended" },
          ]}
        />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" startIcon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              Add Match
            </Button>
            <Button type="button" size="sm" startIcon={<ThunderboltOutlined />} onClick={() => setGenerateModalOpen(true)} disabled={teams.length < 2}>
              Generate Matches
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Loader className="py-10" />
      ) : filteredFixtures.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-theme-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-500">
          No matches found. {isAdmin && "Add teams above, then use \"Generate Matches\"."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredFixtures.map((fixture) => (
            <div
              key={fixture.id}
              onClick={() => navigate(`/fixtures/${fixture.id}`)}
              className="relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
            >
              <div className="absolute right-4 top-4 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Badge variant={STATUS_BADGE_VARIANT[fixture.matchStatus] || "light"}>
                  {getStatusText(fixture.matchStatus)}
                </Badge>
                {isAdmin && (
                  <>
                    <Button type="button" variant="outline" size="sm" className="!px-2 !py-1.5" onClick={() => setEditingFixture(fixture)}>
                      <EditOutlined />
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="!px-2 !py-1.5 text-error-500" onClick={() => handleDelete(fixture.id)}>
                      <DeleteOutlined />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-theme-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90">
                  <JerseyDot color={fixture.homeJerseyColor} /> {fixture.homeTeamName}
                  <TeamAvatar name={fixture.homeTeamName} />
                </span>

                {(fixture.matchStatus === MatchStatus.ONGOING || fixture.matchStatus === MatchStatus.PAUSED || fixture.matchStatus === MatchStatus.COMPLETED) ? (
                  <span className="flex h-8 min-w-[2.5rem] shrink-0 items-center justify-center rounded-full bg-gray-800 px-2 text-theme-xs font-bold text-white dark:bg-white/10">
                    {fixture.homeTeamScore} - {fixture.awayTeamScore}
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-theme-xs font-semibold text-white dark:bg-white/10">
                    vs
                  </span>
                )}

                <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90">
                  <TeamAvatar name={fixture.awayTeamName} />
                  {fixture.awayTeamName} <JerseyDot color={fixture.awayJerseyColor} />
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-theme-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <CalendarOutlined /> {showBdLocalTime(fixture.matchDate)}
                  {fixture.endTime && ` – ${showBdLocalTime(fixture.endTime).split(", ").pop()}`}
                </span>
                {fixture.venueName && (
                  <span className="flex items-center gap-1"><EnvironmentOutlined /> {fixture.venueName}</span>
                )}
                <span>#{fixture.matchOrder}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FixtureGenerationModal
        tournamentId={tournamentId}
        isModalVisible={generateModalOpen}
        handleSetIsModalVisible={setGenerateModalOpen}
        teams={teams}
        tournamentStartDate={tournamentStartDate}
      />

      <AddMatchModal
        tournamentId={tournamentId}
        teams={teams}
        isModalVisible={addModalOpen}
        handleSetIsModalVisible={setAddModalOpen}
      />

      <EditFixtureModal
        fixture={editingFixture}
        isModalVisible={editingFixture !== null}
        handleSetIsModalVisible={(visible) => {
          if (!visible) setEditingFixture(null);
        }}
      />
    </div>
  );
}
