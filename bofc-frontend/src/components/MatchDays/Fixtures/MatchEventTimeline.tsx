import React, { useState } from "react";
import { toast } from "react-toastify";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { IMatchEvent } from "../../../state/features/fixtures/fixtureTypes";
import { club } from "../../../theme/clubTheme";
import { useGetMatchEventsQuery, useDeleteMatchEventMutation, useUpdateMatchEventMutation } from "../../../state/features/fixtures/fixturesSlice";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import Badge from "../../ui/badge";
import FormInput from "../../ui/form-input";
import Loader from "../../ui/loader";

// Import event images
import goalIcon from "../../../assets/matchDetails/goal.png";
import assistIcon from "../../../assets/matchDetails/assist.png";
import yellowCardIcon from "../../../assets/matchDetails/yolo_card.png";
import redCardIcon from "../../../assets/matchDetails/red_card.png";
import substituteIcon from "../../../assets/matchDetails/substitute.png";
import injuryIcon from "../../../assets/matchDetails/injury.png";

interface MatchEventTimelineProps {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  matchDurationMinutes?: number;
  elapsedTimeSeconds?: number;
  startedAt?: string | null;
  completedAt?: string | null;
}

export default function MatchEventTimeline({
  matchId,
  homeTeamId,
  awayTeamId,
  matchDurationMinutes,
  elapsedTimeSeconds,
  startedAt,
  completedAt,
}: MatchEventTimelineProps) {
  const { data: eventsData, isLoading, refetch } = useGetMatchEventsQuery({ matchId });
  const [deleteMatchEvent] = useDeleteMatchEventMutation();
  const [updateMatchEvent, { isLoading: isUpdating }] = useUpdateMatchEventMutation();
  const [editingEvent, setEditingEvent] = useState<IMatchEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMinute, setEditMinute] = useState("");
  const [editError, setEditError] = useState<string | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  const events = eventsData?.content || [];

  const formatEventTime = (event: IMatchEvent): string => {
    if (event.eventType === "MATCH_STARTED") {
      return "0:00";
    }

    if (event.eventType === "MATCH_COMPLETED") {
      if (startedAt && completedAt) {
        try {
          const startTime = new Date(startedAt).getTime();
          const endTime = new Date(completedAt).getTime();
          const diffSeconds = Math.floor((endTime - startTime) / 1000);
          if (diffSeconds >= 0) {
            const minutes = Math.floor(diffSeconds / 60);
            const seconds = diffSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        } catch (e) {
          // Fall through to other methods
        }
      }
      if (matchDurationMinutes) {
        const minutes = matchDurationMinutes;
        const seconds = 0;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else if (elapsedTimeSeconds !== undefined && elapsedTimeSeconds !== null) {
        const minutes = Math.floor(elapsedTimeSeconds / 60);
        const seconds = elapsedTimeSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else if (event.eventTime > 0) {
        const minutes = event.eventTime;
        return `${minutes}:00`;
      }
      return "0:00";
    }

    if (event.eventTime !== undefined && event.eventTime !== null) {
      const minutes = Math.max(0, Math.floor(Number(event.eventTime) || 0));
      return `${minutes}:00`;
    }

    if (startedAt && event.createdDate) {
      try {
        const startTime = new Date(startedAt).getTime();
        const eventTime = new Date(event.createdDate).getTime();
        const diffSeconds = Math.floor((eventTime - startTime) / 1000);
        if (diffSeconds >= 0) {
          const minutes = Math.floor(diffSeconds / 60);
          const seconds = diffSeconds % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      } catch (e) {
        // Fall through to default
      }
    }

    const minutes = event.eventTime || 0;
    return `${minutes}:00`;
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteMatchEvent({ matchId, eventId }).unwrap();
      toast.success("Event deleted successfully");
      refetch();
    } catch (error: any) {
      console.error("Delete event error:", error);
      let errorMessage = "Failed to delete event";

      try {
        const errorData = error?.data || error?.error || error;
        const status = error?.status || errorData?.statusCode || errorData?.status;

        if (status === 409 || status === "CONFLICT") {
          errorMessage = errorData?.message ||
                        errorData?.detail ||
                        errorData?.error ||
                        "Cannot delete events from completed matches. The match has already been completed.";
        } else if (status === 404 || status === "NOT_FOUND") {
          errorMessage = errorData?.message ||
                        errorData?.detail ||
                        "Event not found. It may have already been deleted.";
        } else {
          errorMessage = errorData?.message ||
                       errorData?.detail ||
                       errorData?.error ||
                       error?.message ||
                       (typeof errorData === 'string' ? errorData : "Failed to delete event");
        }
      } catch (parseError) {
        console.error("Error parsing error object:", parseError);
        errorMessage = "Failed to delete event. The match may have been completed.";
      }

      toast.error(errorMessage);
    }
    setConfirmDeleteId(null);
  };

  const openEditModal = (event: IMatchEvent) => {
    setEditingEvent(event);
    setEditMinute(String(event.eventTime ?? ""));
    setEditError(undefined);
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    if (editMinute === "" || Number.isNaN(Number(editMinute))) {
      setEditError("Minute is required");
      return;
    }

    try {
      await updateMatchEvent({
        matchId,
        eventId: editingEvent.id,
        body: {
          eventTime: Math.max(0, Math.min(150, Math.floor(Number(editMinute)))),
        },
      }).unwrap();

      toast.success("Event updated successfully");
      setIsEditModalOpen(false);
      setEditingEvent(null);
    } catch (error: any) {
      const errorData = error?.data || error?.error || error;
      const errorMessage =
        errorData?.message ||
        errorData?.detail ||
        errorData?.error ||
        "Failed to update event";
      toast.error(errorMessage);
    }
  };

  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case "GOAL":
        return goalIcon;
      case "ASSIST":
        return assistIcon;
      case "YELLOW_CARD":
        return yellowCardIcon;
      case "RED_CARD":
        return redCardIcon;
      case "SUBSTITUTION":
        return substituteIcon;
      case "INJURY":
        return injuryIcon;
      case "MATCH_STARTED":
      case "MATCH_COMPLETED":
        return goalIcon;
      default:
        return goalIcon;
    }
  };

  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case "GOAL":
        return club.pitch;
      case "ASSIST":
        return club.gold;
      case "YELLOW_CARD":
        return "#faad14";
      case "RED_CARD":
        return club.danger;
      case "SUBSTITUTION":
        return "#722ed1";
      case "INJURY":
        return "#fa8c16";
      case "MATCH_STARTED":
        return club.live;
      case "MATCH_COMPLETED":
        return club.pitch;
      default:
        return "#8c8c8c";
    }
  };

  if (isLoading) {
    return <Loader className="py-20" />;
  }

  if (events.length === 0) {
    return <p className="flex h-[500px] items-center justify-center text-theme-sm text-gray-400 dark:text-gray-500">No events recorded yet</p>;
  }

  const AdminActions = ({ event, side }: { event: IMatchEvent; side: "left" | "right" }) => {
    if (!isAdmin) return null;
    return (
      <div className={`absolute top-1 z-10 flex gap-1 ${side === "left" ? "left-1" : "right-1"}`}>
        <button
          type="button"
          title="Edit Event"
          onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
          className="flex h-8 w-8 items-center justify-center rounded bg-white/95 text-gray-700 shadow"
        >
          <EditOutlined />
        </button>
        <button
          type="button"
          title="Delete Event"
          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(event.id); }}
          className="flex h-8 w-8 items-center justify-center rounded bg-white/95 text-error-500 shadow"
        >
          <DeleteOutlined />
        </button>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-[var(--color-rule)]">
        <span className="text-base font-semibold text-gray-800 dark:text-white/90">Match Events Timeline</span>
        <Badge variant="info">{events.length} events</Badge>
      </div>

      <div className="relative max-h-[540px] overflow-y-auto overflow-x-hidden pb-5">
        <div className="relative min-h-full">
          <div
            className="absolute left-1/2 hidden -translate-x-1/2 border-l-[3px] border-dotted border-gray-200 dark:border-[var(--color-rule)] md:block"
            style={{ top: 115, height: "calc(100% - 200px)" }}
          />

          {events.map((event: IMatchEvent) => {
            const isSystemEvent = event.eventType === "MATCH_STARTED" || event.eventType === "MATCH_COMPLETED";
            const isHomeTeam = event.teamId != null && event.teamId === homeTeamId;
            const eventColor = getEventColor(event.eventType);

            if (isSystemEvent) {
              return (
                <div key={event.id} className="relative mb-6 mt-3 flex min-h-[80px] items-center justify-center px-6">
                  <div className="absolute left-1/2 top-0 z-[2] -translate-x-1/2">
                    <div
                      className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-4 border-white text-theme-xs font-bold text-white dark:border-gray-900"
                      style={{ background: eventColor, boxShadow: `0 2px 8px ${eventColor}40` }}
                    >
                      {formatEventTime(event)}
                    </div>
                  </div>

                  <div
                    className="relative mt-[30px] mb-5 w-3/4 max-w-[500px] rounded-xl border-2 px-5 py-4 transition"
                    style={{ background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`, borderColor: `${eventColor}50`, boxShadow: `0 4px 12px ${eventColor}20` }}
                  >
                    <AdminActions event={event} side="right" />
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: eventColor }}>
                        {event.eventType === "MATCH_STARTED" ? "🚀 Match Started" : "🏁 Match Completed"}
                      </div>
                      {event.description && (
                        <div className="mt-1.5 text-theme-xs text-gray-400">{event.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            const cardBody = (
              <div className="flex min-h-[70px] items-stretch">
                {isHomeTeam ? (
                  <>
                    <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3 text-right">
                      <span className="text-theme-sm font-bold" style={{ color: eventColor }}>
                        {event.eventType === "MATCH_STARTED" ? "Match Started" : event.eventType === "MATCH_COMPLETED" ? "Match Completed" : event.eventType.replace("_", " ")}
                      </span>
                      {event.eventType !== "MATCH_STARTED" && event.eventType !== "MATCH_COMPLETED" && (
                        <span className="text-theme-base font-bold text-gray-800 dark:text-white/90">{event.playerName}</span>
                      )}
                      {event.eventType === "GOAL" && event.relatedPlayerName && (
                        <span className="mt-0.5 text-theme-xs italic" style={{ color: club.gold }}>🎯 Assist: {event.relatedPlayerName}</span>
                      )}
                      {event.description && <span className="mt-1 text-theme-xs italic text-gray-400">{event.description}</span>}
                    </div>
                    <div className="flex w-20 shrink-0 items-center justify-center border-l-2" style={{ background: `linear-gradient(135deg, ${eventColor}25 0%, ${eventColor}15 100%)`, borderColor: `${eventColor}30` }}>
                      <img src={getEventIcon(event.eventType)} alt={event.eventType} className="h-12 w-12 object-contain" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex w-20 shrink-0 items-center justify-center border-r-2" style={{ background: `linear-gradient(135deg, ${eventColor}25 0%, ${eventColor}15 100%)`, borderColor: `${eventColor}30` }}>
                      <img src={getEventIcon(event.eventType)} alt={event.eventType} className="h-12 w-12 object-contain" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3 text-left">
                      <span className="text-theme-sm font-bold" style={{ color: eventColor }}>
                        {event.eventType === "MATCH_STARTED" ? "Match Started" : event.eventType === "MATCH_COMPLETED" ? "Match Completed" : event.eventType.replace("_", " ")}
                      </span>
                      {event.eventType !== "MATCH_STARTED" && event.eventType !== "MATCH_COMPLETED" && (
                        <span className="text-theme-base font-bold text-gray-800 dark:text-white/90">{event.playerName}</span>
                      )}
                      {event.eventType === "GOAL" && event.relatedPlayerName && (
                        <span className="mt-0.5 text-theme-xs italic" style={{ color: club.gold }}>🎯 Assist: {event.relatedPlayerName}</span>
                      )}
                      {event.description && <span className="mt-1 text-theme-xs italic text-gray-400">{event.description}</span>}
                    </div>
                  </>
                )}
              </div>
            );

            return (
              <div key={event.id} className={`relative mb-4 flex items-center px-4 ${isHomeTeam ? "md:justify-start" : "md:justify-end"}`}>
                {isHomeTeam && (
                  <>
                    <div className="w-full text-right md:w-[45%] md:pr-3">
                      <div className="relative overflow-hidden rounded-xl border-2 transition" style={{ background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`, borderColor: `${eventColor}50`, boxShadow: `0 4px 12px ${eventColor}20` }}>
                        <AdminActions event={event} side="left" />
                        {cardBody}
                      </div>
                    </div>
                    <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-[11px] font-bold text-white dark:border-gray-900"
                        style={{ background: eventColor, boxShadow: `0 2px 8px ${eventColor}40` }}
                      >
                        {formatEventTime(event)}
                      </div>
                    </div>
                  </>
                )}

                {!isHomeTeam && (
                  <>
                    <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-[11px] font-bold text-white dark:border-gray-900"
                        style={{ background: eventColor, boxShadow: `0 2px 8px ${eventColor}40` }}
                      >
                        {formatEventTime(event)}
                      </div>
                    </div>
                    <div className="w-full text-left md:w-[45%] md:pl-3">
                      <div className="relative overflow-hidden rounded-xl border-2 transition" style={{ background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`, borderColor: `${eventColor}50`, boxShadow: `0 4px 12px ${eventColor}20` }}>
                        <AdminActions event={event} side="right" />
                        {cardBody}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingEvent(null); }}
        title="Edit Match Event"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsEditModalOpen(false); setEditingEvent(null); }}>Cancel</Button>
            <Button type="button" size="sm" disabled={isUpdating} onClick={handleUpdateEvent}>Save</Button>
          </>
        }
      >
        <FormInput
          type="number"
          label="Event Minute"
          min={0}
          max={150}
          step={1}
          value={editMinute}
          onChange={(e) => setEditMinute(e.target.value)}
          error={editError}
        />
      </Modal>

      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Event"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => confirmDeleteId !== null && handleDeleteEvent(confirmDeleteId)}>Yes, Delete</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this event? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
