import React, { useMemo, useState, useEffect } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import {
  useGetFixturesQuery,
  useGetMatchEventsQuery,
} from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetTournamentStructureQuery } from "../../state/features/manualFixtures/manualFixturesSlice";
import { MatchEventType } from "../../state/features/fixtures/fixtureTypes";
import type {
  IFixture,
  IMatchEvent,
} from "../../state/features/fixtures/fixtureTypes";
import { calculateElapsedTime, formatElapsedTime } from "../../utils/matchTimeUtils";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import MatchCardShell from "../CommonAtoms/MatchCard";
import VenueLink from "../CommonAtoms/VenueLink";
import styles from "./ViewerFixturesTab.module.css";
import yellowCardIcon from "../../assets/matchDetails/yolo_card.png";
import redCardIcon from "../../assets/matchDetails/red_card.png";
import { API_URL } from "../../settings";
import Alert from "../ui/alert";
import Loader from "../ui/loader";
import useIsMobile from "../../hooks/useIsMobile";

interface ViewerResultsTabProps {
  tournamentId: number;
}

const LIVE_RESULTS_POLLING_INTERVAL_MS = 20000;
const LIVE_MATCH_EVENTS_POLLING_INTERVAL_MS = 10000;
const LIVE_SSE_RECONNECT_DELAY_MS = 3000;

const buildLiveStreamUrl = (tournamentId: number) => {
  const normalizedBaseUrl = API_URL.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/matches/live/tournaments/${tournamentId}/stream`;
};

const formatGoalMinute = (
  event: IMatchEvent,
  matchStartedAt?: string | null,
) => {
  // eventTime is the source of truth (supports manual/edited minute).
  if (event.eventTime !== undefined && event.eventTime !== null) {
    const minutes = Number(event.eventTime) || 0;
    return `${Math.max(0, Math.floor(minutes))}'`;
  }

  // Fallback to createdDate for legacy events missing eventTime.
  if (matchStartedAt && event.createdDate) {
    try {
      const startMs = new Date(matchStartedAt).getTime();
      const eventMs = new Date(event.createdDate).getTime();
      const diffSeconds = Math.floor((eventMs - startMs) / 1000);
      if (Number.isFinite(diffSeconds) && diffSeconds >= 0) {
        return `${Math.floor(diffSeconds / 60)}'`;
      }
    } catch {
      // Fallback to eventTime value.
    }
  }

  // In this app, eventTime is stored as match minute.
  const minutes = Number(event.eventTime) || 0;
  return `${Math.floor(minutes)}'`;
};

const buildGoalEvents = (
  events: IMatchEvent[] = [],
  teamId: number,
  matchStartedAt?: string | null,
): Array<{ key: string; playerName: string; minute: string }> => {
  const goalEvents = events
    .filter(
      (event) =>
        event.eventType === MatchEventType.GOAL &&
        event.teamId === teamId &&
        event.playerId,
    )
    .sort((left, right) => (left.eventTime || 0) - (right.eventTime || 0));

  return goalEvents.map((event, index) => ({
    key: `${teamId}-${event.playerId}-${event.eventTime}-${index}`,
    playerName: event.playerName || "Unknown",
    minute: formatGoalMinute(event, matchStartedAt),
  }));
};

const buildCardEvents = (
  events: IMatchEvent[] = [],
  teamId: number,
  cardType: MatchEventType.YELLOW_CARD | MatchEventType.RED_CARD,
  matchStartedAt?: string | null,
): Array<{ key: string; playerName: string; minute: string }> => {
  return events
    .filter(
      (event) =>
        event.eventType === cardType &&
        event.teamId === teamId &&
        event.playerId,
    )
    .sort((a, b) => (a.eventTime || 0) - (b.eventTime || 0))
    .map((event, index) => ({
      key: `${teamId}-${cardType}-${event.playerId}-${event.eventTime}-${index}`,
      playerName: event.playerName || "Unknown",
      minute: formatGoalMinute(event, matchStartedAt),
    }));
};

const buildStageLabel = (label: string) => label.toUpperCase();

const formatPlayedDate = (value?: string | null) => {
  if (!value) return "DATE N/A";
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const statusTagTone: Record<string, React.CSSProperties> = {
  green: { background: "rgba(82,196,26,0.16)", color: "#52c41a", border: "1px solid rgba(82,196,26,0.4)" },
  purple: { background: "rgba(114,46,209,0.14)", color: "#b37feb", border: "1px solid rgba(114,46,209,0.35)" },
  default: { background: "rgba(140,140,140,0.14)", color: "#bfbfbf", border: "1px solid rgba(140,140,140,0.3)" },
};

const goalMinuteTagStyle: React.CSSProperties = {
  ...statusTagTone.green,
  borderRadius: 4,
  display: "inline-block",
};

function TeamAvatar({ src, initials, size, fontSize }: { src?: string; initials: string; size: number; fontSize: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        color: "var(--color-accent)",
        fontWeight: 800,
        fontSize,
        border: "2px solid var(--color-rule)",
      }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

function ResultCard({
  fixture,
  tournamentSummary,
  isMobile,
  streamTick,
  roundNameMap,
}: {
  fixture: IFixture;
  tournamentSummary?: any;
  isMobile: boolean;
  streamTick: number;
  roundNameMap: Map<number, string>;
}) {
  const homeWin = fixture.homeTeamScore > fixture.awayTeamScore;
  const awayWin = fixture.awayTeamScore > fixture.homeTeamScore;
  const isLive =
    fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED";
  const { data: eventsResponse, refetch: refetchEvents } = useGetMatchEventsQuery(
    { matchId: fixture.id },
    {
      skip: fixture.matchStatus === "SCHEDULED",
      pollingInterval: isLive ? LIVE_MATCH_EVENTS_POLLING_INTERVAL_MS : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  useEffect(() => {
    if (fixture.matchStatus === "SCHEDULED" || streamTick === 0) {
      return;
    }

    void refetchEvents();
  }, [fixture.matchStatus, refetchEvents, streamTick]);

  const homeScorers = useMemo(
    () =>
      buildGoalEvents(
        eventsResponse?.content,
        fixture.homeTeamId,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.homeTeamId, fixture.startedAt],
  );
  const awayScorers = useMemo(
    () =>
      buildGoalEvents(
        eventsResponse?.content,
        fixture.awayTeamId,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.awayTeamId, fixture.startedAt],
  );
  const homeYellowCards = useMemo(
    () =>
      buildCardEvents(
        eventsResponse?.content,
        fixture.homeTeamId,
        MatchEventType.YELLOW_CARD,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.homeTeamId, fixture.startedAt],
  );
  const awayYellowCards = useMemo(
    () =>
      buildCardEvents(
        eventsResponse?.content,
        fixture.awayTeamId,
        MatchEventType.YELLOW_CARD,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.awayTeamId, fixture.startedAt],
  );
  const homeRedCards = useMemo(
    () =>
      buildCardEvents(
        eventsResponse?.content,
        fixture.homeTeamId,
        MatchEventType.RED_CARD,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.homeTeamId, fixture.startedAt],
  );
  const awayRedCards = useMemo(
    () =>
      buildCardEvents(
        eventsResponse?.content,
        fixture.awayTeamId,
        MatchEventType.RED_CARD,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.awayTeamId, fixture.startedAt],
  );
  const hasCardEvents =
    homeYellowCards.length > 0 ||
    awayYellowCards.length > 0 ||
    homeRedCards.length > 0 ||
    awayRedCards.length > 0;

  const [liveTime, setLiveTime] = useState(() =>
    formatElapsedTime(
      calculateElapsedTime(
        fixture.matchStatus,
        fixture.startedAt,
        fixture.elapsedTimeSeconds,
        fixture.completedAt,
      ),
    ),
  );

  useEffect(() => {
    if (fixture.matchStatus !== "ONGOING") return;
    const tick = () =>
      setLiveTime(
        formatElapsedTime(
          calculateElapsedTime(
            fixture.matchStatus,
            fixture.startedAt,
            fixture.elapsedTimeSeconds,
            fixture.completedAt,
          ),
        ),
      );
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fixture.matchStatus, fixture.startedAt, fixture.elapsedTimeSeconds, fixture.completedAt]);

  const homeRecordedGoals = useMemo(() => homeScorers.length, [homeScorers]);
  const awayRecordedGoals = useMemo(() => awayScorers.length, [awayScorers]);
  const hasScorerMismatch =
    (fixture.matchStatus === "COMPLETED" &&
      homeRecordedGoals !== fixture.homeTeamScore) ||
    (fixture.matchStatus === "COMPLETED" &&
      awayRecordedGoals !== fixture.awayTeamScore);

  const competitionLabel = fixture.groupName
    ? fixture.groupName.toUpperCase()
    : fixture.round != null
      ? (roundNameMap.get(fixture.round) ?? `ROUND ${fixture.round}`).toUpperCase()
      : "RESULT";
  const playedDate = fixture.completedAt || fixture.matchDate;
  const homeTeamLogoUrl = getTeamLogoUrlFromSummary(
    tournamentSummary,
    fixture.homeTeamId,
  );
  const awayTeamLogoUrl = getTeamLogoUrlFromSummary(
    tournamentSummary,
    fixture.awayTeamId,
  );

  return (
    <MatchCardShell status={fixture.matchStatus} isMobile={isMobile}>
      <div className={styles.cardTopRow} style={{ position: "relative" }}>
        <span className={styles.stageTag}>
          {buildStageLabel(competitionLabel)}
        </span>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {fixture.matchStatus === "ONGOING" && (
            <span className={styles.statusTag} style={{ ...goalMinuteTagStyle, padding: "1px 8px" }}>
              LIVE{liveTime && <> | <span style={{ fontVariantNumeric: "tabular-nums" }}>{liveTime}</span></>}
            </span>
          )}
          {fixture.matchStatus === "PAUSED" && (
            <span className={styles.statusTag} style={{ ...statusTagTone.purple, borderRadius: 4, padding: "1px 8px", display: "inline-block" }}>
              PAUSED{liveTime && <> | <span style={{ fontVariantNumeric: "tabular-nums" }}>{liveTime}</span></>}
            </span>
          )}
          {fixture.matchStatus === "COMPLETED" && (
            <span className={styles.statusTag} style={{ ...statusTagTone.default, borderRadius: 4, padding: "1px 8px", display: "inline-block" }}>
              FT
            </span>
          )}
        </div>
        <div>
          {playedDate && fixture.matchStatus === "COMPLETED" && (
            <span className={styles.statusTag} style={{ ...statusTagTone.default, borderRadius: 4, padding: "1px 8px", display: "inline-block" }}>
              {formatPlayedDate(playedDate)}
            </span>
          )}
        </div>
      </div>

      <div>
        {hasScorerMismatch && (
          <Alert
            variant="warning"
            title="Scorer breakdown incomplete"
            className="mb-[18px]"
          >
            The final score is saved, but not every goal has a recorded scorer event yet. Open the match details and record the missing goal events to complete the breakdown.
          </Alert>
        )}

        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 6,
              }}
            >
              <span
                className={styles.teamName}
                style={{
                  fontWeight: 700,
                  color: homeWin ? "var(--color-ink)" : "color-mix(in oklch, var(--color-ink) 88%, transparent)",
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                  wordBreak: "break-word",
                }}
              >
                {fixture.homeTeamName}
              </span>
              <TeamAvatar src={homeTeamLogoUrl} initials={getTeamInitials(fixture.homeTeamName, "T")} size={40} fontSize={11} />
            </div>

            <div
              style={{
                minWidth: 68,
                textAlign: "center",
                padding: "4px 6px",
                borderRadius: 10,
                background:
                  "linear-gradient(180deg, color-mix(in oklch, var(--color-ink) 8%, transparent) 0%, color-mix(in oklch, var(--color-ink) 4%, transparent) 100%)",
                border: "1px solid color-mix(in oklch, var(--color-ink) 10%, transparent)",
                flexShrink: 0,
              }}
            >
              <span
                style={{ fontWeight: 700, fontSize: 13, lineHeight: 1, color: "var(--color-ink)" }}
              >
                {fixture.homeTeamScore}
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 10, margin: "0 3px", opacity: 0.5 }}
              >
                -
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 13, lineHeight: 1, color: "var(--color-ink)" }}
              >
                {fixture.awayTeamScore}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
              }}
            >
              <TeamAvatar src={awayTeamLogoUrl} initials={getTeamInitials(fixture.awayTeamName, "T")} size={40} fontSize={11} />
              <span
                className={styles.teamName}
                style={{
                  fontWeight: 700,
                  color: awayWin ? "var(--color-ink)" : "color-mix(in oklch, var(--color-ink) 88%, transparent)",
                  lineHeight: 1.3,
                  textAlign: "left",
                  wordBreak: "break-word",
                }}
              >
                {fixture.awayTeamName}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[9fr_6fr_9fr]">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 16,
              }}
            >
              <span
                className={styles.teamName}
                style={{
                  fontWeight: 700,
                  color: homeWin ? "var(--color-ink)" : "color-mix(in oklch, var(--color-ink) 88%, transparent)",
                }}
              >
                {fixture.homeTeamName}
              </span>
              <TeamAvatar src={homeTeamLogoUrl} initials={getTeamInitials(fixture.homeTeamName, "T")} size={58} fontSize={24} />
            </div>

            <div
              style={{
                margin: "0 auto",
                minWidth: 160,
                maxWidth: 200,
                textAlign: "center",
                padding: "4px 16px",
                borderRadius: 16,
                background:
                  "linear-gradient(180deg, color-mix(in oklch, var(--color-ink) 8%, transparent) 0%, color-mix(in oklch, var(--color-ink) 4%, transparent) 100%)",
                border: "1px solid color-mix(in oklch, var(--color-ink) 10%, transparent)",
              }}
            >
              <span
                style={{ fontWeight: 700, fontSize: 40, lineHeight: 1, color: "var(--color-ink)" }}
              >
                {fixture.homeTeamScore}
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 26, margin: "0 10px", opacity: 0.5 }}
              >
                -
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 40, lineHeight: 1, color: "var(--color-ink)" }}
              >
                {fixture.awayTeamScore}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 16,
              }}
            >
              <TeamAvatar src={awayTeamLogoUrl} initials={getTeamInitials(fixture.awayTeamName, "T")} size={58} fontSize={24} />
              <span
                className={styles.teamName}
                style={{
                  fontWeight: 700,
                  color: awayWin ? "var(--color-ink)" : "color-mix(in oklch, var(--color-ink) 88%, transparent)",
                }}
              >
                {fixture.awayTeamName}
              </span>
            </div>
          </div>
        )}

        {(homeScorers.length > 0 || awayScorers.length > 0) && (
          <>
            <div
              style={{
                margin: isMobile ? "14px 0 12px" : "24px 0 18px",
                height: 1,
                background: "color-mix(in oklch, var(--color-ink) 6%, transparent)",
              }}
            />
            {isMobile ? (
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                {/* Home scorers - left side */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-start",
                  }}
                >
                  {homeScorers.map((scorer) => (
                    <div
                      key={scorer.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        minWidth: 0,
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          color: "#fadb14",
                          fontSize: 13,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        ⚽
                      </span>
                      <span
                        style={{
                          ...goalMinuteTagStyle,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: "0 5px",
                          flexShrink: 0,
                        }}
                      >
                        {scorer.minute}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          wordBreak: "break-word",
                        }}
                      >
                        {scorer.playerName}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Divider */}
                <div
                  style={{
                    width: 1,
                    background: "color-mix(in oklch, var(--color-ink) 8%, transparent)",
                    flexShrink: 0,
                  }}
                />
                {/* Away scorers - right side */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-end",
                  }}
                >
                  {awayScorers.map((scorer) => (
                    <div
                      key={scorer.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        minWidth: 0,
                        width: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          wordBreak: "break-word",
                          textAlign: "right",
                        }}
                      >
                        {scorer.playerName}
                      </span>
                      <span
                        style={{
                          ...goalMinuteTagStyle,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: "0 5px",
                          flexShrink: 0,
                        }}
                      >
                        {scorer.minute}
                      </span>
                      <span
                        style={{
                          color: "#fadb14",
                          fontSize: 13,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        ⚽
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[11fr_2fr_11fr]">
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", alignItems: "flex-end" }}>
                  {homeScorers.map((scorer) => (
                    <div key={scorer.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 600 }}>
                        {scorer.playerName}
                      </span>
                      <span
                        style={{
                          ...goalMinuteTagStyle,
                          fontWeight: 700,
                          minWidth: 46,
                          textAlign: "center",
                          padding: "1px 8px",
                        }}
                      >
                        {scorer.minute}
                      </span>
                      <span
                        style={{
                          color: "#fadb14",
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        ⚽
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <div
                    style={{
                      height: "100%",
                      minHeight: 56,
                      width: 1,
                      background: "color-mix(in oklch, var(--color-ink) 8%, transparent)",
                      margin: "0 auto",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", alignItems: "flex-start" }}>
                  {awayScorers.map((scorer) => (
                    <div key={scorer.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          color: "#fadb14",
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        ⚽
                      </span>
                      <span
                        style={{
                          ...goalMinuteTagStyle,
                          fontWeight: 700,
                          minWidth: 46,
                          textAlign: "center",
                          padding: "1px 8px",
                        }}
                      >
                        {scorer.minute}
                      </span>
                      <span style={{ fontSize: 17, fontWeight: 600 }}>
                        {scorer.playerName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {hasCardEvents && (
          <>
            <div
              style={{
                margin: isMobile ? "14px 0 12px" : "20px 0 14px",
                height: 1,
                background: "color-mix(in oklch, var(--color-ink) 6%, transparent)",
              }}
            />
            {isMobile ? (
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    alignItems: "flex-start",
                  }}
                >
                  {[...homeYellowCards.map((c) => ({ ...c, type: "yellow" })), ...homeRedCards.map((c) => ({ ...c, type: "red" }))].map((card) => (
                    <div
                      key={card.key}
                      style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, width: "100%" }}
                    >
                      <img
                        src={card.type === "yellow" ? yellowCardIcon : redCardIcon}
                        alt={card.type === "yellow" ? "Yellow card" : "Red card"}
                        style={{ width: 12, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, wordBreak: "break-word" }}>
                        {card.playerName}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ width: 1, background: "color-mix(in oklch, var(--color-ink) 8%, transparent)", flexShrink: 0 }} />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    alignItems: "flex-end",
                  }}
                >
                  {[...awayYellowCards.map((c) => ({ ...c, type: "yellow" })), ...awayRedCards.map((c) => ({ ...c, type: "red" }))].map((card) => (
                    <div
                      key={card.key}
                      style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, width: "100%", justifyContent: "flex-end" }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, wordBreak: "break-word", textAlign: "right" }}>
                        {card.playerName}
                      </span>
                      <img
                        src={card.type === "yellow" ? yellowCardIcon : redCardIcon}
                        alt={card.type === "yellow" ? "Yellow card" : "Red card"}
                        style={{ width: 12, height: 16, flexShrink: 0 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[11fr_2fr_11fr]">
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", alignItems: "flex-end" }}>
                  {[...homeYellowCards.map((c) => ({ ...c, type: "yellow" })), ...homeRedCards.map((c) => ({ ...c, type: "red" }))].map((card) => (
                    <div key={card.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{card.playerName}</span>
                      <img
                        src={card.type === "yellow" ? yellowCardIcon : redCardIcon}
                        alt={card.type === "yellow" ? "Yellow card" : "Red card"}
                        style={{ width: 14, height: 18 }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ height: "100%", minHeight: 40, width: 1, background: "color-mix(in oklch, var(--color-ink) 8%, transparent)", margin: "0 auto" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", alignItems: "flex-start" }}>
                  {[...awayYellowCards.map((c) => ({ ...c, type: "yellow" })), ...awayRedCards.map((c) => ({ ...c, type: "red" }))].map((card) => (
                    <div key={card.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img
                        src={card.type === "yellow" ? yellowCardIcon : redCardIcon}
                        alt={card.type === "yellow" ? "Yellow card" : "Red card"}
                        style={{ width: 14, height: 18 }}
                      />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{card.playerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {fixture.venueName && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <VenueLink
              name={fixture.venueName}
              mapLink={fixture.venueMapLink}
              iconClassName="mr-1"
              style={{ fontSize: 12, color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}
              className="hover:underline"
            />
          </div>
        )}
      </div>
    </MatchCardShell>
  );
}

export default function ViewerResultsTab({
  tournamentId,
}: ViewerResultsTabProps) {
  const isMobile = useIsMobile();
  const [streamTick, setStreamTick] = useState(0);
  const { data, isLoading, refetch } = useGetFixturesQuery(
    { tournamentId },
    {
      pollingInterval: LIVE_RESULTS_POLLING_INTERVAL_MS,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: tournamentSummary } = useGetTournamentSummaryQuery({
    tournamentId,
  });
  const { data: structureData } = useGetTournamentStructureQuery({ tournamentId });

  const roundNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (structureData?.content?.rounds || []).forEach((round) => {
      if (round.roundName) map.set(round.roundNumber, round.roundName);
    });
    return map;
  }, [structureData]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeoutId: number | null = null;
    let isClosed = false;

    const connect = () => {
      if (isClosed) {
        return;
      }

      const streamUrl = buildLiveStreamUrl(tournamentId);
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = () => {
        setStreamTick((previous) => previous + 1);
        void refetch();
      };

      eventSource.onerror = () => {
        eventSource?.close();
        if (!isClosed) {
          reconnectTimeoutId = window.setTimeout(connect, LIVE_SSE_RECONNECT_DELAY_MS);
        }
      };
    };

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }
      eventSource?.close();
    };
  }, [tournamentId, refetch]);

  const sections = useMemo(() => {
    const fixtures = data?.content || [];
    const liveFixtures = fixtures
      .filter(
        (fixture) =>
          fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED",
      )
      .sort((left, right) =>
        (left.matchDate ?? "").localeCompare(right.matchDate ?? ""),
      );

    const completedFixtures = fixtures
      .filter((fixture) => fixture.matchStatus === "COMPLETED")
      .sort((left, right) =>
        (right.completedAt ?? right.matchDate ?? "").localeCompare(
          left.completedAt ?? left.matchDate ?? "",
        ),
      );

    return [
      {
        key: "live",
        title: "Live Results",
        fixtures: liveFixtures,
        tagColor: "green" as const,
        tagLabel: "live",
      },
      {
        key: "completed",
        title: "Completed Results",
        fixtures: completedFixtures,
        tagColor: "default" as const,
        tagLabel: "result",
      },
    ].filter((section) => section.fixtures.length > 0);
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className={styles.loadingWrap}>
        <Loader />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <div className="text-center text-theme-sm text-gray-400 dark:text-gray-500">No live or completed results yet</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.contentWrap}>
        {sections.map((section) => (
          <section key={section.key} className={styles.groupSection}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitleWrap}>
                <h5 className={styles.groupTitle}>
                  {section.title}
                </h5>
                {!isMobile && <div className={styles.groupDivider} />}
              </div>
              <span className={styles.groupCountTag} style={{ ...statusTagTone[section.tagColor], borderRadius: 4, padding: "0 8px" }}>
                {section.fixtures.length} {section.tagLabel}
                {section.fixtures.length !== 1 ? "s" : ""}
              </span>
            </div>
            {section.fixtures.map((f) => (
              <ResultCard
                key={f.id}
                fixture={f}
                tournamentSummary={tournamentSummary}
                isMobile={isMobile}
                streamTick={streamTick}
                roundNameMap={roundNameMap}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
