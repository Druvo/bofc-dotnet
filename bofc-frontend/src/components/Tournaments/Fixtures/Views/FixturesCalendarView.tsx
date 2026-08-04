import React, { useMemo } from "react";
import { club } from "../../../../theme/clubTheme";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, Tag, Modal, message } from "antd";
import moment from "moment";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../../utils/matchStatusUtils";
import { useUpdateFixtureMutation } from "../../../../state/features/fixtures/fixturesSlice";
import VenueLink from "../../../CommonAtoms/VenueLink";

interface FixturesCalendarViewProps {
  fixtures: IFixture[];
  onReschedule?: (fixtureId: number, newDate: string) => void;
  isAdmin?: boolean;
}

/**
 * Calendar view of fixtures with drag-and-drop rescheduling
 * Uses FullCalendar for monthly/weekly/daily views
 */
export default function FixturesCalendarView({
  fixtures,
  onReschedule,
  isAdmin = false,
}: FixturesCalendarViewProps) {
  const [updateFixture] = useUpdateFixtureMutation();

  // Convert fixtures to calendar events
  const events = useMemo(() => {
    return fixtures.map((fixture) => {
      // Parse UTC dates and convert to local time
      const matchStart = moment.utc(fixture.matchDate).local();
      const matchEnd = matchStart.clone().add(fixture.matchDurationMinutes || 90, "minutes");

      return {
        id: String(fixture.id),
        title: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
        start: matchStart.toISOString(),
        end: matchEnd.toISOString(),
        backgroundColor: getStatusColorHex(fixture.matchStatus),
        borderColor: getStatusColorHex(fixture.matchStatus),
        textColor: "#ffffff",
        extendedProps: {
          fixture,
        },
        // Only SCHEDULED matches can be dragged
        editable: isAdmin && fixture.matchStatus === "SCHEDULED",
      };
    });
  }, [fixtures, isAdmin]);

  // Handle event drop (drag and drop)
  const handleEventDrop = (info: any) => {
    const fixture: IFixture = info.event.extendedProps.fixture;

    // Prevent rescheduling non-scheduled matches
    if (fixture.matchStatus !== "SCHEDULED") {
      info.revert();
      message.warning("Only SCHEDULED matches can be rescheduled");
      return;
    }

    if (!isAdmin) {
      info.revert();
      message.error("Admin access required to reschedule matches");
      return;
    }

    // Convert local time back to UTC for API
    const newDate = moment(info.event.start).utc().format("YYYY-MM-DDTHH:mm:ss");

    Modal.confirm({
      title: "Reschedule Match",
      content: (
        <div>
          <p>
            <strong>{fixture.homeTeamName}</strong> vs{" "}
            <strong>{fixture.awayTeamName}</strong>
          </p>
          <p style={{ marginTop: 8, color: "#666" }}>
            Move to: <strong>{moment(info.event.start).format("DD MMM YYYY, HH:mm")}</strong>
          </p>
        </div>
      ),
      okText: "Reschedule",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          if (onReschedule) {
            onReschedule(fixture.id, newDate);
          } else {
            await updateFixture({
              matchId: fixture.id,
              matchDate: newDate,
            }).unwrap();
            message.success("Match rescheduled successfully");
          }
        } catch (error) {
          message.error("Failed to reschedule match");
          info.revert();
        }
      },
      onCancel: () => {
        info.revert();
      },
    });
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const fixture: IFixture = info.event.extendedProps.fixture;

    Modal.info({
      title: "Match Details",
      width: 500,
      content: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag color={getStatusColor(fixture.matchStatus)}>
              {fixture.matchStatus}
            </Tag>
            <span style={{ marginLeft: 8, color: "#999", fontSize: 12 }}>
              Match #{fixture.matchOrder}
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {fixture.homeTeamName}
            </div>
            <div style={{ margin: "8px 0", color: "#999" }}>vs</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {fixture.awayTeamName}
            </div>
          </div>

          {(fixture.matchStatus === "ONGOING" ||
            fixture.matchStatus === "PAUSED" ||
            fixture.matchStatus === "COMPLETED") && (
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#c6a15b", marginBottom: 12 }}>
              {fixture.homeTeamScore} - {fixture.awayTeamScore}
            </div>
          )}

          <div style={{ fontSize: 13, color: "#666" }}>
            <p>
              📅 <strong>Date:</strong>{" "}
              {moment.utc(fixture.matchDate).local().format("DD MMM YYYY, HH:mm")}
            </p>
            {fixture.venueName && (
              <p>
                📍 <strong>Venue:</strong>{" "}
                <VenueLink name={fixture.venueName} mapLink={fixture.venueMapLink} showIcon={false} className="hover:underline" />
              </p>
            )}
            {fixture.round && (
              <p>
                🏆 <strong>Round:</strong> {fixture.round}
              </p>
            )}
            {fixture.groupName && (
              <p>
                👥 <strong>Group:</strong> {fixture.groupName}
              </p>
            )}
          </div>
        </div>
      ),
      okText: "Close",
    });
  };

  // Custom event content renderer
  const renderEventContent = (eventInfo: any) => {
    const fixture: IFixture = eventInfo.event.extendedProps.fixture;

    return (
      <div
        style={{
          padding: "2px 4px",
          overflow: "hidden",
          fontSize: 11,
          lineHeight: "1.2",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          {eventInfo.timeText}
        </div>
        <div style={{ fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {eventInfo.event.title}
        </div>
        {fixture.matchStatus === "ONGOING" && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            🔴 LIVE
          </div>
        )}
        {(fixture.matchStatus === "COMPLETED" ||
          fixture.matchStatus === "ONGOING" ||
          fixture.matchStatus === "PAUSED") && (
          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>
            {fixture.homeTeamScore} - {fixture.awayTeamScore}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={isAdmin}
        droppable={isAdmin}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height="auto"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
        nowIndicator={true}
        weekends={true}
        dayMaxEvents={4}
        moreLinkText="more"
        displayEventTime={true}
        displayEventEnd={false}
      />

      {isAdmin && fixtures.some((f) => f.matchStatus === "SCHEDULED") && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#e6f7ff",
            borderRadius: 8,
            fontSize: 12,
            color: "#0050b3",
          }}
        >
          💡 <strong>Tip:</strong> Drag and drop SCHEDULED matches to reschedule them
        </div>
      )}
    </Card>
  );
}

/**
 * Convert status string to hex color for calendar events
 */
function getStatusColorHex(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return club.gold;
    case "ONGOING":
      return club.live;
    case "PAUSED":
      return "#722ed1";
    case "COMPLETED":
      return club.pitch;
    default:
      return "#d9d9d9";
  }
}
