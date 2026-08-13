import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useJoinMatchDay from "../../hooks/useJoinMatchDay";
import { MatchDayPlayerInfoType } from "../../state/features/matchDays/matchDayTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./matchDay.css";
import {
  CheckCircleOutlined, CloseCircleOutlined, SearchOutlined,
  ClockCircleOutlined, TeamOutlined, StarFilled, CalendarOutlined,
  CheckCircleFilled, TrophyOutlined,
} from "@ant-design/icons";
import { showBdLocalTimeRange } from "./../../utils/utils";
import { canManageTeams } from "../../utils/roleUtils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import GoalKeeperDrawer from "./Atoms/GoalKeeperDrawer";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import useIsMobile from "../../hooks/useIsMobile";
import Button from "../ui/button";
import Badge from "../ui/badge";
import Modal from "../ui/modal";
import FormSelect from "../ui/form-select";
import Loader from "../ui/loader";
import Avatar from "../CommonAtoms/Avatar";

type ParticipationFilter = "all" | "participating" | "not-participating" | "pending";
type SortOption = "name" | "status" | "employeeId";
interface TableRow extends MatchDayPlayerInfoType { key: number; }

const PlayerAvatar = ({
  src, size, highlight, name, seed,
}: { src?: string | null; size: number; highlight: boolean; name?: string | null; seed?: string | number | null }) => (
  <Avatar
    src={src}
    name={name}
    seed={seed}
    size={size}
    className={`border-2 ${highlight ? "border-brand-500" : "border-warning-500/60"}`}
  />
);

export default function JoinMatchDay() {
  const loginInfo = useSelector(selectLoginInfo);
  const { id = "" } = useParams();
  const matchDayId = Number(id);
  const navigate = useNavigate();
  const { players, isLoading, isUpdating, handleUpdate, nextMatchDay } = useJoinMatchDay(matchDayId);

  const [editedComments, setEditedComments] = useState<{ [key: number]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"in" | "out" | "pending" | null>(null);
  const isMobileTable = useIsMobile(768);

  const loggedInPlayer = players.find((p) => p.playerId === Number(loginInfo.userId));

  // Fresh matchDay = zero participant rows, so the current user won't be in
  // `players` yet. Fall back to a pending stand-in so they can still submit
  // their first response instead of the "Your Response" card just not
  // rendering (see useJoinMatchDay.handleUpdate for the matching backend-side fix).
  const myParticipation: MatchDayPlayerInfoType | undefined =
    loggedInPlayer ??
    (loginInfo.userId
      ? {
          playerId: Number(loginInfo.userId),
          playerName: loginInfo.username || "You",
          employeeId: "",
          participationStatus: null as unknown as boolean,
          comments: "",
          matchDayParticipantId: undefined as unknown as number,
        }
      : undefined);

  const { participatingPlayers, notParticipatingPlayers, pendingPlayers, filteredTableData } = useMemo(() => {
    let filtered = [...players];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (participationFilter !== "all") {
      filtered = filtered.filter((p) =>
        participationFilter === "participating"
          ? p.participationStatus === true
          : participationFilter === "not-participating"
          ? p.participationStatus === false
          : p.participationStatus == null
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (a.playerId === Number(loginInfo.userId)) return -1;
      if (b.playerId === Number(loginInfo.userId)) return 1;
      if (sortBy === "name") return a.playerName.localeCompare(b.playerName);
      if (sortBy === "employeeId") return a.employeeId.localeCompare(b.employeeId);
      const rank = (s: boolean | null) => (s === true ? 0 : s === null ? 1 : 2);
      return rank(a.participationStatus) - rank(b.participationStatus);
    });

    return {
      participatingPlayers: players.filter((p) => p.participationStatus === true),
      notParticipatingPlayers: players.filter((p) => p.participationStatus === false),
      pendingPlayers: players.filter((p) => p.participationStatus == null),
      filteredTableData: sorted.map((p) => ({ ...p, key: p.playerId })) as TableRow[],
    };
  }, [players, searchTerm, participationFilter, sortBy, loginInfo.userId]);

  const openStatusModal = (status: "in" | "out" | "pending") => {
    setSelectedStatus(status);
    setIsStatusModalOpen(true);
  };

  const selectedPlayers =
    selectedStatus === "in" ? participatingPlayers : selectedStatus === "out" ? notParticipatingPlayers : selectedStatus === "pending" ? pendingPlayers : [];

  const getModalTitle = () =>
    selectedStatus === "in" ? "Participating Players" : selectedStatus === "out" ? "Not Participating Players" : selectedStatus === "pending" ? "Pending Players" : "";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]"><Loader className="py-6" /></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]"><Loader className="py-10" /></div>
      </div>
    );
  }

  const statBoxes: { value: number; classes: string; label: string; status: "in" | "out" | "pending" | null }[] = [
    { value: players.length, classes: "bg-blue-light-500/10 text-blue-light-500 border-blue-light-500/30", label: "Total", status: null },
    { value: participatingPlayers.length, classes: "bg-success-500/10 text-success-600 border-success-500/30 dark:text-success-500", label: "In", status: "in" },
    { value: notParticipatingPlayers.length, classes: "bg-error-500/10 text-error-600 border-error-500/30 dark:text-error-500", label: "Out", status: "out" },
    { value: pendingPlayers.length, classes: "bg-warning-500/10 text-warning-600 border-warning-500/30 dark:text-orange-400", label: "Pending", status: "pending" },
  ];

  const fillPercent = players.length > 0 ? Math.round((participatingPlayers.length / players.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Match Day Summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
          <div className="mb-3">
            <div className="mb-0.5 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">⚽ Match Day</div>
            <h4 className="mb-0.5 text-lg font-bold text-gray-800 dark:text-white/90">{nextMatchDay?.matchDayName}</h4>
            <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
              {nextMatchDay?.matchDayDate && showBdLocalTimeRange(nextMatchDay.matchDayDate, nextMatchDay.durationMinutes)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {statBoxes.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={!s.status}
                onClick={s.status ? () => openStatusModal(s.status!) : undefined}
                className={`rounded-lg border px-1 py-2 text-center transition ${s.classes} ${s.status ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="block text-xl font-bold leading-none">{s.value}</span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide">{s.label}</span>
              </button>
            ))}
          </div>

          {players.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">Squad Filled</span>
                <span className="text-theme-xs text-gray-700 dark:text-gray-300">{participatingPlayers.length} / {players.length}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-success-500 transition-all duration-500" style={{ width: `${fillPercent}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Your Response */}
        {myParticipation && (
          <div className="rounded-2xl border border-brand-500/30 bg-white p-4 dark:border-brand-500/30 dark:bg-[var(--color-paper-3)]">
            <div className="mb-2 flex items-center gap-3">
              <PlayerAvatar src={toAbsolutePlayerPhotoUrl(myParticipation.photoUrl)} size={46} highlight name={myParticipation.playerName} seed={myParticipation.playerId} />
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                  {myParticipation.playerName} <StarFilled className="text-theme-xs text-brand-500 dark:text-brand-400" />
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  {myParticipation.employeeId && <span className="text-theme-xs text-gray-400 dark:text-gray-500">ID: {myParticipation.employeeId}</span>}
                  {myParticipation.participationStatus === true && <Badge variant="success">Confirmed</Badge>}
                  {myParticipation.participationStatus === false && <Badge variant="error">Declined</Badge>}
                  {myParticipation.participationStatus == null && <Badge variant="warning">Pending</Badge>}
                </div>
              </div>
            </div>

            <div className="my-2.5 h-px bg-gray-100 dark:bg-[var(--color-paper-2)]" />

            <div className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">Are you participating?</div>

            <div className="mb-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdate(myParticipation.playerId, editedComments[myParticipation.playerId] ?? myParticipation.comments ?? "", true)}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-theme-sm font-semibold transition disabled:opacity-60 ${
                  myParticipation.participationStatus === true
                    ? "border-success-500 bg-success-500 text-white"
                    : "border-success-500/40 bg-transparent text-success-600 dark:text-success-500"
                }`}
              >
                <CheckCircleOutlined /> Yes, I'm in
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdate(myParticipation.playerId, editedComments[myParticipation.playerId] ?? myParticipation.comments ?? "", false)}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-theme-sm font-semibold transition disabled:opacity-60 ${
                  myParticipation.participationStatus === false
                    ? "border-error-500 bg-error-500 text-white"
                    : "border-gray-300 bg-transparent text-gray-500 dark:border-[var(--color-rule)] dark:text-gray-400"
                }`}
              >
                <CloseCircleOutlined /> Can't make it
              </button>
            </div>

            <DebouncedInput
              isDisabled={false}
              placeholder="Leave a comment (optional)..."
              debounceDuration={1000}
              onChange={(value) => {
                setEditedComments((prev) => ({ ...prev, [myParticipation.playerId]: value }));
                handleUpdate(myParticipation.playerId, value, myParticipation.participationStatus);
              }}
              value={editedComments[myParticipation.playerId] ?? myParticipation.comments ?? ""}
            />
          </div>
        )}

        {/* Card 3: Your Team */}
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
              <TrophyOutlined /> Your Team
            </span>
            {myParticipation?.participationStatus === true && <Badge variant="success"><CheckCircleFilled /> Attending</Badge>}
            {myParticipation?.participationStatus === false && <Badge variant="error"><CloseCircleOutlined /> Not Attending</Badge>}
            {(myParticipation?.participationStatus == null) && <Badge variant="warning"><ClockCircleOutlined /> Pending</Badge>}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
            <GoalKeeperDrawer matchDayId={matchDayId} triggerIcon={<TrophyOutlined />} />
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {myParticipation?.participationStatus === true
                ? "You're confirmed - check back here for your team assignment."
                : myParticipation?.participationStatus === false
                ? "You are currently marked as unavailable for this Match Day."
                : "Awaiting your response - let us know if you're in."}
            </p>
          </div>

          <Button startIcon={<TeamOutlined />} className="mt-2.5 w-full" onClick={() => navigate(`/match-days/team-building/${matchDayId}`)}>
            View Team
          </Button>
        </div>
      </div>

      {/* Participants panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <TeamOutlined className="text-brand-500 dark:text-brand-400" />
            <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">Match Day Participants</h4>
            <Badge variant="light">{players.length}</Badge>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <FormSelect
              className="!h-9 w-[140px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              options={[
                { value: "name", label: "Sort by Name" },
                { value: "employeeId", label: "Sort by ID" },
                { value: "status", label: "Sort by Status" },
              ]}
            />
            <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-[var(--color-rule)]">
              {([
                { label: "All", value: "all" },
                { label: "In", value: "participating" },
                { label: "Pending", value: "pending" },
                { label: "Out", value: "not-participating" },
              ] as { label: string; value: ParticipationFilter }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setParticipationFilter(opt.value)}
                  className={`px-2.5 py-1.5 text-theme-xs font-medium transition ${
                    participationFilter === opt.value ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-[360px] flex-1">
            <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
            />
          </div>
          {searchTerm && <span className="text-theme-xs text-gray-400 dark:text-gray-500">{filteredTableData.length} result(s)</span>}
        </div>

        {filteredTableData.length === 0 ? (
          <div className="py-6 text-center">
            <TeamOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
            <p className="text-theme-sm text-gray-400 dark:text-gray-500">No players found</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-2.5 ${isMobileTable ? "" : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
            {filteredTableData.map((r) => {
              const isMe = r.playerId === Number(loginInfo.userId);
              // COORDINATOR manages this MatchDay's teams/lineup/fixtures/prizes elsewhere in the
              // app - excluding it here was an arbitrary gap for editing another player's RSVP.
              const canEdit = canManageTeams(loginInfo.roles) || isMe;
              const photoUrl = toAbsolutePlayerPhotoUrl(r.photoUrl);
              return (
                <div
                  key={r.key}
                  className={`rounded-xl border bg-gray-50 p-2.5 dark:bg-[var(--color-paper-2)] ${isMe ? "border-l-[3px] border-l-brand-500" : "border-l-[3px] border-l-warning-500"} border-gray-100 dark:border-[var(--color-rule)]`}
                >
                  <div className={`flex items-center gap-2 ${isMobileTable ? "" : "mb-2"}`}>
                    <PlayerAvatar src={photoUrl} size={isMobileTable ? 40 : 34} highlight={isMe} name={r.playerName} seed={r.playerId} />
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                        {r.playerName}
                        {isMe && <StarFilled className="text-[10px] text-warning-500" />}
                        {r.isCaptain && <Badge variant="warning" className="!px-1 !py-0 !text-[9px]">C</Badge>}
                      </span>
                      <span className="block text-[11px] text-gray-400 dark:text-gray-500">ID: {r.employeeId}</span>
                    </div>
                    {isMobileTable && (
                      canEdit ? (
                        <FormSelect
                          className="!h-9 w-[92px] !py-1 !text-theme-xs"
                          placeholder="Pending"
                          value={r.participationStatus === true ? "true" : r.participationStatus === false ? "false" : ""}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdate(r.playerId, editedComments[r.playerId] ?? r.comments ?? "", e.target.value === "true")}
                          options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]}
                        />
                      ) : (
                        <Badge variant={r.participationStatus === true ? "success" : r.participationStatus === false ? "error" : "warning"}>
                          {r.participationStatus === true ? "Yes" : r.participationStatus === false ? "No" : "Pending"}
                        </Badge>
                      )
                    )}
                  </div>

                  {!isMobileTable && (
                    canEdit ? (
                      <>
                        <FormSelect
                          className="!h-9 mb-2 !py-1 !text-theme-xs"
                          placeholder="Pending"
                          value={r.participationStatus === true ? "true" : r.participationStatus === false ? "false" : ""}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdate(r.playerId, editedComments[r.playerId] ?? r.comments ?? "", e.target.value === "true")}
                          options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]}
                        />
                        <DebouncedInput
                          isDisabled={false}
                          placeholder="Comment..."
                          debounceDuration={1000}
                          autoSize
                          maxRows={2}
                          onChange={(value) => {
                            setEditedComments((prev) => ({ ...prev, [r.playerId]: value }));
                            handleUpdate(r.playerId, value, r.participationStatus);
                          }}
                          value={editedComments[r.playerId] ?? r.comments ?? ""}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={r.participationStatus === true ? "success" : r.participationStatus === false ? "error" : "warning"} className="w-fit">
                          {r.participationStatus === true ? "Yes" : r.participationStatus === false ? "No" : "Pending"}
                        </Badge>
                        {r.comments && <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">{r.comments}</p>}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stat-box player list modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={getModalTitle()} className="max-w-[900px]">
        {selectedPlayers.length === 0 ? (
          <p className="text-theme-sm text-gray-400 dark:text-gray-500">No players found for this status.</p>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {selectedPlayers.map((player) => (
              <div key={player.playerId} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-[var(--color-rule)]">
                <PlayerAvatar src={toAbsolutePlayerPhotoUrl(player.photoUrl)} size={32} highlight={false} name={player.playerName} seed={player.playerId} />
                <div className="min-w-0">
                  <div className="truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">{player.playerName}</div>
                  <div className="text-theme-xs text-gray-400 dark:text-gray-500">ID: {player.employeeId}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
