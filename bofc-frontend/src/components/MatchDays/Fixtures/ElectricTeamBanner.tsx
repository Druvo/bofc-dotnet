import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { IFixture, IMatchEvent } from "../../../state/features/fixtures/fixtureTypes";
import { TrophyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import moment from "moment";
import MatchLivePanel from "./MatchLivePanel";
import VenueLink from "../../CommonAtoms/VenueLink";
import { useNavigate } from "react-router-dom";
import { useGetMatchEventsQuery } from "../../../state/features/fixtures/fixturesSlice";

interface ElectricTeamBannerProps {
  match: IFixture;
  colorBgContainer: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function ElectricTeamBanner({ match, isAdmin = false, onRefresh }: ElectricTeamBannerProps) {
  const navigate = useNavigate();
  const homeScoreRef = useRef<HTMLDivElement>(null);
  const awayScoreRef = useRef<HTMLDivElement>(null);
  const homeGlowRef = useRef<HTMLDivElement>(null);
  const awayGlowRef = useRef<HTMLDivElement>(null);

  // Fetch match events to get goal scorers
  const { data: eventsData } = useGetMatchEventsQuery({ matchId: match.id }, { skip: !match.id });
  const events = eventsData?.content || [];
  
  // Filter goal events and group by team
  const homeGoals = events.filter((e: IMatchEvent) => 
    e.eventType === "GOAL" && e.teamId === match.homeTeamId
  ).sort((a: IMatchEvent, b: IMatchEvent) => (a.eventTime || 0) - (b.eventTime || 0));
  
  const awayGoals = events.filter((e: IMatchEvent) => 
    e.eventType === "GOAL" && e.teamId === match.awayTeamId
  ).sort((a: IMatchEvent, b: IMatchEvent) => (a.eventTime || 0) - (b.eventTime || 0));

  // Timer state
  const [displayTime, setDisplayTime] = useState("00:00");

  // Format time from seconds to MM:SS (capped at 120 minutes)
  const formatTime = (seconds: number): string => {
    // Cap at 120 minutes (7200 seconds) for match duration
    const cappedSeconds = Math.min(seconds, 7200);
    const mins = Math.floor(cappedSeconds / 60);
    const secs = cappedSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Animate score changes
  useEffect(() => {
    if (homeScoreRef.current) {
      gsap.from(homeScoreRef.current, {
        scale: 1.5,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [match.homeTeamScore]);

  useEffect(() => {
    if (awayScoreRef.current) {
      gsap.from(awayScoreRef.current, {
        scale: 1.5,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [match.awayTeamScore]);

  // Pulse animation for ongoing matches
  useEffect(() => {
    if (match.matchStatus === "ONGOING") {
      const pulseTimeline = gsap.timeline({ repeat: -1 });

      if (homeGlowRef.current) {
        pulseTimeline.to(homeGlowRef.current, {
          opacity: 0.8,
          duration: 1.5,
          ease: "sine.inOut",
        }).to(homeGlowRef.current, {
          opacity: 0.3,
          duration: 1.5,
          ease: "sine.inOut",
        });
      }

      if (awayGlowRef.current) {
        gsap.timeline({ repeat: -1 })
          .to(awayGlowRef.current, {
            opacity: 0.8,
            duration: 1.5,
            ease: "sine.inOut",
            delay: 0.75,
          })
          .to(awayGlowRef.current, {
            opacity: 0.3,
            duration: 1.5,
            ease: "sine.inOut",
          });
      }

      return () => {
        pulseTimeline.kill();
      };
    }
  }, [match.matchStatus]);

  // Timer logic for ongoing/paused/completed matches
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (match.matchStatus === "ONGOING" && match.startedAt) {
      const startTime = moment.utc(match.startedAt).local().valueOf();
      const initialElapsed = match.elapsedTimeSeconds || 0;

      const calculateElapsedTime = () => {
        const now = Date.now();
        const timeSinceStart = Math.floor((now - startTime) / 1000);
        const totalElapsed = initialElapsed + timeSinceStart;
        // Cap at 120 minutes (7200 seconds) for match duration
        const cappedElapsed = Math.min(totalElapsed, 7200);
        setDisplayTime(formatTime(cappedElapsed));
      };

      calculateElapsedTime();
      interval = setInterval(calculateElapsedTime, 1000);
    } else if (match.matchStatus === "PAUSED") {
      const pausedTime = match.elapsedTimeSeconds || 0;
      // Cap at 120 minutes
      const cappedPaused = Math.min(pausedTime, 7200);
      setDisplayTime(formatTime(cappedPaused));
    } else if (match.matchStatus === "COMPLETED") {
      let finalTime = match.elapsedTimeSeconds || 0;

      if (match.startedAt && match.completedAt) {
        const startTime = moment.utc(match.startedAt).local().valueOf();
        const endTime = moment.utc(match.completedAt).local().valueOf();
        finalTime = Math.floor((endTime - startTime) / 1000);
      }
      
      // Cap at 120 minutes
      const cappedFinal = Math.min(finalTime, 7200);
      setDisplayTime(formatTime(cappedFinal));
    } else {
      setDisplayTime("00:00");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    match.matchStatus,
    match.startedAt,
    match.elapsedTimeSeconds,
    match.completedAt,
    match.id,
  ]);

  // Helper function to format event time as minutes only
  const formatEventTime = (event: IMatchEvent): string => {
    // eventTime is the source of truth (supports manual/edited minute).
    if (event.eventTime !== undefined && event.eventTime !== null) {
      const minutes = Math.max(0, Math.floor(Number(event.eventTime) || 0));
      return `${minutes}'`;
    }

    // Fallback to createdDate-based calculation for legacy events missing eventTime.
    if (match.startedAt && event.createdDate) {
      try {
        const startTime = new Date(match.startedAt).getTime();
        const eventTime = new Date(event.createdDate).getTime();
        const diffSeconds = Math.floor((eventTime - startTime) / 1000);
        if (diffSeconds >= 0) {
          const minutes = Math.floor(diffSeconds / 60);
          return `${minutes}'`;
        }
      } catch (e) {
        // Fall through to fallback
      }
    }

    // Fallback: eventTime is in minutes
    const minutes = event.eventTime || 0;
    return `${minutes}'`;
  };

  // Group goals by player and collect their formatted times
  const groupGoalsByPlayer = (goals: IMatchEvent[]) => {
    const grouped = goals.reduce((acc: { [key: string]: string[] }, goal: IMatchEvent) => {
      const playerName = goal.playerName || "Unknown";
      if (!acc[playerName]) {
        acc[playerName] = [];
      }
      acc[playerName].push(formatEventTime(goal));
      return acc;
    }, {});

    // Sort times chronologically within each player's goals
    return Object.entries(grouped).map(([playerName, times]) => ({
      playerName,
      times, // Already formatted as strings
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "#b69549";
      case "ONGOING": return "#f04438";
      case "PAUSED": return "#fb8f28";
      case "COMPLETED": return "#12b76a";
      default: return "#8c8c8c";
    }
  };

  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(56, 0, 60, 0.4)",
        background: "linear-gradient(135deg, #38003c 0%, #570a57 100%)",
        position: "relative",
      }}
    >
      {/* Main Score Display */}
      <div style={{ position: "relative" }}>
        {/* Left Side Color Bar */}
        <div
          style={{
            width: 6,
            height: "100%",
            background: "#e90052",
            position: "absolute",
            left: 0,
            top: 0,
          }}
        />

        {/* Right Side Color Bar */}
        <div
          style={{
            width: 6,
            height: "100%",
            background: "#e90052",
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />

        {/* Score Layout */}
        <div
          className="electric-banner-score-layout"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
          }}
        >
          {/* Home Team Section */}
          <div
            className="electric-banner-team-section home-team"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 40,
              paddingRight: 24,
            }}
          >
            {/* Animated Background Glow for Home */}
            <div
              ref={homeGlowRef}
              style={{
                position: "absolute",
                left: "10%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(0, 255, 133, 0.15) 0%, transparent 70%)",
                opacity: 0.3,
                pointerEvents: "none",
                filter: "blur(40px)",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                className="electric-banner-team-name"
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                {match.homeTeamName}
              </div>
              {homeGoals.length > 0 && (
                <div
                  className="electric-banner-goal-scorers"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                    justifyContent: "flex-end",
                  }}
                >
                  {groupGoalsByPlayer(homeGoals).map((player, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: 11,
                        color: "rgba(255, 255, 255, 0.85)",
                        lineHeight: 1.2,
                        textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⚽ {player.playerName} ({player.times.join(", ")})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Score Box with Time */}
          <div
            className="electric-banner-score-box"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Home Score */}
            <div
              className="electric-banner-score-digit-wrapper"
              style={{
                background: "#00ff85",
                padding: "12px 20px",
                borderRadius: "6px 0 0 6px",
              }}
            >
              <div
                ref={homeScoreRef}
                className="electric-banner-score-digit"
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#38003c",
                  lineHeight: 1,
                  minWidth: 32,
                  textAlign: "center",
                  fontFamily: "'Inter', -apple-system, sans-serif",
                }}
              >
                {match.homeTeamScore}
              </div>
            </div>

            {/* Time/Timer in Middle */}
            <div
              className="electric-banner-time-display"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                padding: "8px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 80,
              }}
            >
              {match.matchStatus === "SCHEDULED" ? (
                // Show scheduled time
                <>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#38003c",
                      lineHeight: 1.2,
                    }}
                  >
                    {moment.utc(match.matchDate).local().format("hh:mm A")}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#38003c",
                      opacity: 0.6,
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {moment.utc(match.matchDate).local().format("DD MMM")}
                  </div>
                </>
              ) : (
                // Show match timer for ONGOING, PAUSED, or COMPLETED
                <>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#38003c",
                      lineHeight: 1.2,
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                    }}
                  >
                    {displayTime}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: match.matchStatus === "ONGOING" ? "#fa8c16" :
                             match.matchStatus === "PAUSED" ? "#722ed1" : "#52c41a",
                      textTransform: "uppercase",
                      marginTop: 2,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {match.matchStatus === "ONGOING" && "🔴 LIVE"}
                    {match.matchStatus === "PAUSED" && "⏸️ PAUSED"}
                    {match.matchStatus === "COMPLETED" && "✓ FINAL"}
                  </div>
                </>
              )}
            </div>

            {/* Away Score */}
            <div
              className="electric-banner-score-digit-wrapper"
              style={{
                background: "#00ff85",
                padding: "12px 20px",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <div
                ref={awayScoreRef}
                className="electric-banner-score-digit"
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#38003c",
                  lineHeight: 1,
                  minWidth: 32,
                  textAlign: "center",
                  fontFamily: "'Inter', -apple-system, sans-serif",
                }}
              >
                {match.awayTeamScore}
              </div>
            </div>
          </div>

          {/* Away Team Section */}
          <div
            className="electric-banner-team-section away-team"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 40,
              paddingLeft: 24,
            }}
          >
            {/* Animated Background Glow for Away */}
            <div
              ref={awayGlowRef}
              style={{
                position: "absolute",
                right: "10%",
                top: "50%",
                transform: "translate(50%, -50%)",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(0, 255, 133, 0.15) 0%, transparent 70%)",
                opacity: 0.3,
                pointerEvents: "none",
                filter: "blur(40px)",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                className="electric-banner-team-name"
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                {match.awayTeamName}
              </div>
              {awayGoals.length > 0 && (
                <div
                  className="electric-banner-goal-scorers"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                    justifyContent: "flex-start",
                  }}
                >
                  {groupGoalsByPlayer(awayGoals).map((player, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: 11,
                        color: "rgba(255, 255, 255, 0.85)",
                        lineHeight: 1.2,
                        textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⚽ {player.playerName} ({player.times.join(", ")})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MatchDay & Match Info Footer */}
      <div
        className="electric-banner-footer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left Section: Back Button & MatchDay Info */}
        <div className="electric-banner-left-section" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              borderRadius: 8,
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 15px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
          >
            <ArrowLeftOutlined /> Back
          </button>
          <div
            className="electric-banner-trophy-icon"
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrophyOutlined style={{ fontSize: 16, color: "white" }} />
          </div>
          <div className="electric-banner-matchDay-info">
            <div
              style={{
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {match.matchDayName}
            </div>
            {match.venueName && (
              <VenueLink
                name={match.venueName}
                mapLink={match.venueMapLink}
                iconClassName="text-[11px]"
                className="mt-1 flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "rgba(255, 255, 255, 0.75)" }}
              />
            )}
          </div>
        </div>

        {/* Right Section: Match Details & Admin Controls */}
        <div className="electric-banner-right-section" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Match Number */}
          <div
            className="electric-banner-match-number"
            style={{
              textAlign: "center",
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, marginBottom: 2 }}>
              Match #
            </div>
            <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>
              {match.matchOrder}
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <MatchLivePanel fixture={match} onSuccess={onRefresh} compact />
          )}

          {/* Match Status (only show if not admin) */}
          {!isAdmin && (
            <span
              className={match.matchStatus === "ONGOING" ? "electric-banner-status-pulse" : undefined}
              style={{
                fontSize: 10,
                padding: "4px 12px",
                fontWeight: 700,
                color: "white",
                background: getStatusColor(match.matchStatus),
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "inline-block",
              }}
            >
              {match.matchStatus}
            </span>
          )}
        </div>
      </div>

      {/* Global Animations and Responsive Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        .electric-banner-status-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .electric-banner-status-pulse {
            animation: none;
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .electric-banner-score-layout {
            padding: 12px 16px !important;
            flex-direction: column !important;
            gap: 16px !important;
          }

          .electric-banner-team-section {
            flex: none !important;
            width: 100% !important;
            justify-content: center !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            gap: 12px !important;
          }

          .electric-banner-team-section.home-team {
            order: 1;
          }

          .electric-banner-score-box {
            order: 2;
          }

          .electric-banner-team-section.away-team {
            order: 3;
          }

          .electric-banner-team-name {
            font-size: 18px !important;
            letter-spacing: 1px !important;
            text-align: center;
          }

          .electric-banner-goal-scorers {
            font-size: 10px !important;
            justify-content: center !important;
          }

          .electric-banner-goal-scorers .ant-typography {
            font-size: 10px !important;
          }

          .electric-banner-score-digit-wrapper {
            padding: 10px 16px !important;
          }

          .electric-banner-score-digit {
            font-size: 28px !important;
            min-width: 24px !important;
          }

          .electric-banner-time-display {
            padding: 6px 12px !important;
            min-width: 60px !important;
          }

          .electric-banner-footer {
            padding: 8px 12px !important;
            gap: 8px !important;
          }

          .electric-banner-footer .electric-banner-left-section,
          .electric-banner-footer .electric-banner-right-section {
            flex-wrap: wrap;
            justify-content: center;
          }

          .electric-banner-footer button {
            font-size: 12px !important;
            height: 32px !important;
            padding: 0 12px !important;
          }
        }

        @media (max-width: 480px) {
          .electric-banner-score-layout {
            padding: 8px 8px !important;
            gap: 12px !important;
          }

          .electric-banner-team-name {
            font-size: 14px !important;
            letter-spacing: 0.5px !important;
          }

          .electric-banner-goal-scorers {
            gap: 4px !important;
          }

          .electric-banner-goal-scorers span {
            font-size: 9px !important;
          }

          .electric-banner-score-digit-wrapper {
            padding: 8px 12px !important;
          }

          .electric-banner-score-digit {
            font-size: 24px !important;
            min-width: 20px !important;
          }

          .electric-banner-time-display {
            padding: 4px 8px !important;
            min-width: 50px !important;
          }

          .electric-banner-time-display > div:first-child {
            font-size: 16px !important;
          }

          .electric-banner-time-display > div:last-child {
            font-size: 7px !important;
          }

          .electric-banner-footer {
            flex-direction: column !important;
            padding: 8px !important;
            gap: 8px !important;
          }

          .electric-banner-footer .electric-banner-left-section,
          .electric-banner-footer .electric-banner-right-section {
            width: 100%;
            justify-content: center;
          }

          .electric-banner-footer button {
            font-size: 11px !important;
            height: 28px !important;
            padding: 0 8px !important;
            min-width: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
