import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EditOutlined, PlayCircleOutlined, PlusOutlined, MinusOutlined, DragOutlined, CalendarOutlined } from "@ant-design/icons";
import moment from "moment";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../utils/matchStatusUtils";
import { formatMatchTime, isMatchOngoing } from "../../../utils/matchTimeUtils";
import { useNavigate } from "react-router-dom";
import { useDeleteMatchMutation, useUpdateMatchOrderMutation } from "../../../state/features/fixtures/fixturesSlice";
import AddMatchModal from "./AddMatchModal";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageFixtures } from "../../../utils/roleUtils";
import Button from "../../ui/button";
import Badge from "../../ui/badge";
import Pagination from "../../ui/pagination";
import Loader from "../../ui/loader";
import VenueLink from "../../CommonAtoms/VenueLink";

interface FixturesTableProps {
  fixtures: IFixture[];
  isLoading?: boolean;
  onViewDetails?: (fixture: IFixture) => void;
  onEditFixture?: (fixture: IFixture) => void;
  tournamentId?: number;
  roundId?: number;
  groupId?: number;
  groupName?: string;
  teams?: Array<{ teamId: number; teamName: string }>;
  onRefresh?: () => void;
  enableAddRemove?: boolean;
  enableDragDrop?: boolean;
}

const statusBadgeVariant: Record<string, "primary" | "success" | "error" | "warning" | "info" | "light"> = {
  SCHEDULED: "info",
  ONGOING: "success",
  PAUSED: "warning",
  COMPLETED: "light",
  CANCELLED: "error",
};

export default function FixturesTable({
  fixtures,
  onEditFixture,
  tournamentId,
  roundId,
  groupId,
  groupName,
  teams = [],
  onRefresh,
  enableAddRemove = false,
  enableDragDrop = false,
  isLoading = false,
}: FixturesTableProps) {
  const navigate = useNavigate();
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageFixtures(loginInfo.roles);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [deleteMatch, { isLoading: isDeleting }] = useDeleteMatchMutation();
  const [updateMatchOrder, { isLoading: isUpdatingOrder }] = useUpdateMatchOrderMutation();
  const [localFixtures, setLocalFixtures] = useState(fixtures);
  const [fixturesCurrentPage, setFixturesCurrentPage] = useState(1);
  const fixturesPageSize = 10;
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    setLocalFixtures(fixtures);
  }, [fixtures]);

  useEffect(() => {
    const hasOngoingMatches = fixtures.some((f) => isMatchOngoing(f.matchStatus));
    if (!hasOngoingMatches) {
      setCurrentTime(Date.now());
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [fixtures]);

  const handleDeleteMatch = async (matchId: number) => {
    try {
      await deleteMatch({ matchId }).unwrap();
      toast.success("Match deleted successfully");
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete match");
    }
    setConfirmDeleteId(null);
  };

  const handleAddMatch = () => {
    if (!tournamentId || teams.length === 0) {
      toast.warning("Tournament ID and teams are required to add matches");
      return;
    }
    setIsAddModalVisible(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localFixtures);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalFixtures(items);

    const matchOrders = items.map((fixture, index) => ({
      matchId: fixture.id,
      matchOrder: index + 1,
    }));

    try {
      await updateMatchOrder({ matchOrders }).unwrap();
      toast.success("Match order updated successfully");
      onRefresh?.();
    } catch (error: any) {
      setLocalFixtures(fixtures);
      toast.error(error?.data?.message || "Failed to update match order");
    }
  };

  const displayFixtures = enableDragDrop ? localFixtures : fixtures;
  const totalPages = Math.ceil(displayFixtures.length / fixturesPageSize);
  const pagedFixtures = displayFixtures.slice((fixturesCurrentPage - 1) * fixturesPageSize, fixturesCurrentPage * fixturesPageSize);

  const renderRowCells = (fixture: IFixture) => {
    const _ = currentTime;
    const matchTime = formatMatchTime(fixture.matchStatus, fixture.startedAt, fixture.elapsedTimeSeconds, fixture.completedAt);
    const isOngoing = isMatchOngoing(fixture.matchStatus);
    const venue = fixture.venueName || "";
    return (
      <>
        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{fixture.matchOrder}</td>
        <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-white/90">{fixture.homeTeamName}</td>
        <td className="px-3 py-2.5 text-center font-bold text-gray-800 dark:text-white/90">{fixture.homeTeamScore} - {fixture.awayTeamScore}</td>
        <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-white/90">{fixture.awayTeamName}</td>
        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">
          {venue ? (
            <VenueLink name={fixture.venueName} mapLink={fixture.venueMapLink} showIcon={false} className="hover:text-brand-500 hover:underline" title={venue}>
              {venue.length > 15 ? `${venue.substring(0, 15)}...` : venue}
            </VenueLink>
          ) : "—"}
        </td>
        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{moment.utc(fixture.matchDate).local().format("DD/MM/YYYY, hh:mm a")}</td>
        <td className="px-3 py-2.5">
          <div className="flex flex-col gap-1">
            <Badge variant={statusBadgeVariant[fixture.matchStatus] || "light"}>
              {isOngoing && <PlayCircleOutlined />} {fixture.matchStatus}
            </Badge>
            {isOngoing && matchTime && <Badge variant="success">{matchTime}</Badge>}
          </div>
        </td>
        {canManage && (
          <td className="px-3 py-2.5" data-no-click="true">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEditFixture?.(fixture); }}
                className="flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:underline"
              >
                <EditOutlined /> Edit
              </button>
              {enableAddRemove && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(fixture.id); }}
                  className="flex items-center gap-1 text-theme-xs font-medium text-error-500 hover:underline disabled:opacity-50"
                >
                  <MinusOutlined /> Remove
                </button>
              )}
            </div>
          </td>
        )}
      </>
    );
  };

  return (
    <>
      {(isLoading || isUpdatingOrder) && <Loader className="py-4" />}
      {enableAddRemove && canManage && (
        <div className="mb-4 flex justify-end">
          <Button type="button" size="sm" startIcon={<PlusOutlined />} disabled={!tournamentId || teams.length === 0} onClick={handleAddMatch}>
            Add Match
          </Button>
        </div>
      )}
      {displayFixtures.length === 0 ? (
        <div className="py-6 text-center">
          <CalendarOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
          <p className="text-theme-sm text-gray-400 dark:text-gray-500">No fixtures found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-max border-collapse text-theme-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                {enableDragDrop && <th className="w-10 px-3 py-2.5" />}
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Match #</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Home Team</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-gray-400">Score</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Away Team</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Venue</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Date & Time</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                {canManage && <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>}
              </tr>
            </thead>
            {enableDragDrop ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fixtures-list">
                  {(provided) => (
                    <tbody ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-gray-100 dark:divide-gray-800">
                      {pagedFixtures.map((fixture, index) => (
                        <Draggable key={fixture.id} draggableId={String(fixture.id)} index={index}>
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (!target.closest("button") && !target.closest("[data-no-click]")) navigate(`/fixtures/${fixture.id}`);
                              }}
                              className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] ${snapshot.isDragging ? "bg-gray-100 dark:bg-white/5" : ""}`}
                            >
                              <td {...provided.dragHandleProps} data-no-click="true" className="px-3 py-2.5 text-center text-gray-400">
                                <DragOutlined className="cursor-grab" />
                              </td>
                              {renderRowCells(fixture)}
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pagedFixtures.map((fixture) => (
                  <tr
                    key={fixture.id}
                    onClick={() => navigate(`/fixtures/${fixture.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    {renderRowCells(fixture)}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={fixturesCurrentPage} totalPages={totalPages} onChange={setFixturesCurrentPage} />
        </div>
      )}
      {enableAddRemove && canManage && tournamentId && teams.length > 0 && (
        <AddMatchModal
          tournamentId={tournamentId}
          roundId={roundId}
          groupId={groupId}
          groupName={groupName}
          teams={teams}
          isModalVisible={isAddModalVisible}
          handleSetIsModalVisible={setIsAddModalVisible}
          onSuccess={() => {
            onRefresh?.();
          }}
        />
      )}

      <ConfirmDeleteModal
        open={confirmDeleteId !== null}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId !== null && handleDeleteMatch(confirmDeleteId)}
      />
    </>
  );
}

function ConfirmDeleteModal({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-5">
      <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[2px] dark:bg-gray-900/50" onClick={onCancel} />
      <div className="relative w-full max-w-[380px] rounded-2xl bg-white p-6 dark:bg-gray-900">
        <h4 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">Delete this match?</h4>
        <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this match? This action cannot be undone.</p>
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>No</Button>
          <Button type="button" variant="danger" size="sm" onClick={onConfirm}>Yes</Button>
        </div>
      </div>
    </div>
  );
}
