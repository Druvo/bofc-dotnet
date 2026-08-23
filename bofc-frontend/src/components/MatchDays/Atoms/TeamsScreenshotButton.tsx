import React, { useRef, useState } from "react";
import {
  CameraOutlined,
  LoadingOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Team } from "../teamBuilderTypes";
import { useGetFixturesQuery } from "../../../state/features/fixtures/fixturesSlice";
import { formatMatchTimeRange } from "../../../utils/matchTimeUtils";
import { showBdLocalTimeRange } from "../../../utils/utils";
import { getJerseySwatch, getJerseyLabel } from "../../../utils/jerseyColors";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import companyLogo from "../../../assets/logo.png";
import redGlovesIcon from "../../../assets/red-gloves.png";
import Button from "../../ui/button";
import JerseyIcon from "../../CommonAtoms/JerseyIcon";
import PlayerAvatar from "../../CommonAtoms/Avatar";
import { toast } from "react-toastify";

// AntD icons render as <span><svg width="1em" height="1em"></span> - the glyph's actual
// pixel size depends on whatever font-size it inherits, which was never pinned here, so it
// could come out smaller or larger than the box that's supposed to contain it (looking
// "off-center" even though it's flex-centered). Setting fontSize:size on the box makes the
// icon's 1em resolve to exactly the intended size; lineHeight:0 removes any text-baseline
// contribution from the AntD wrapper span.
function IconBox({ children, size, color }: { children: React.ReactNode; size: number; color?: string }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 0,
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

interface TeamsScreenshotButtonProps {
  matchDayId: number;
  matchDayName?: string;
  matchDayDate?: string | null;
  durationMinutes?: number | null;
  venueName?: string | null;
  teams: Team[];
}

// Reused palette across the export - mirrors the login page's gold/sage
// tokens (authStyles.css) instead of inventing a separate color scheme, so
// this export reads as the same club identity rather than a mismatched one.
const C = {
  bg: "#0a0f0c",
  panel: "#12241a",
  card: "#16281c",
  rowBg: "#0f1f16",
  rule: "#2a3d31",
  ink: "#f2f5f0",
  ink2: "#9fb3a5",
  gold: "#c9a34a",
  goldBright: "#e0bd63",
  sage: "#7a9a82",
  sageBright: "#a9c7ae",
};

function getTeamCode(name: string, index: number): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (name.trim().length >= 2) return name.trim().slice(0, 2).toUpperCase();
  return `T${index + 1}`;
}

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "rgba(201, 163, 74, 0.18)",
        }}
      >
        <IconBox size={17} color={C.goldBright}>{icon}</IconBox>
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.08em", color: C.ink, lineHeight: 1 }}>{label}</span>
    </div>
  );
}

/**
 * Renders the match day's teams (2-per-row mini grid, left) + fixtures (right) into an
 * off-screen div, then rasterizes it with html-to-image into a downloadable PNG. Plain hex
 * colors throughout (not the app's usual oklch tokens) for broad rasterizer compatibility.
 * Player avatars use the same shared Avatar component as the team-building UI: real photo
 * when uploaded, otherwise a deterministic illustrated placeholder per player. A static
 * render, not the draggable team-building UI. Layout follows a reference club-branded
 * matchday graphic
 * the user supplied: branded header with tagline + date, teams grid, fixtures list,
 * branded footer. Sized up (wider canvas, larger type, scale:3 capture) so text stays
 * legible when the PNG is viewed at typical fit-to-window zoom on a laptop screen -
 * matching resolution alone to the original 1400px design left text proportionally tiny.
 */
export default function TeamsScreenshotButton({ matchDayId, matchDayName, matchDayDate, durationMinutes, venueName, teams }: TeamsScreenshotButtonProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Fetched eagerly (not just on click) so the export div can be measured/laid out
  // ahead of time - fine either way since this list is already cached once the
  // Fixtures/Matches tab has been visited, and is small even on first load.
  const { data: fixturesData } = useGetFixturesQuery({ matchDayId });
  const fixtures = [...(fixturesData?.content || [])].sort((a, b) => a.matchOrder - b.matchOrder);

  const teamCodes = new Map(teams.map((t, i) => [t.teamId, getTeamCode(t.teamName, i)]));

  const handleScreenshot = async () => {
    if (!captureRef.current || teams.length === 0) return;
    setIsCapturing(true);
    try {
      // html-to-image serializes the DOM into an SVG <foreignObject> and lets the browser's
      // own engine paint it, instead of html2canvas's approach of reimplementing CSS layout -
      // that's what was behind the icon/avatar drift and dropped photos: html2canvas's own
      // layout pass doesn't perfectly reproduce flexbox centering for replaced elements
      // (SVGs, <img>) or resolve AntD icons' 1em sizing the same way the real browser does.
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(captureRef.current, {
        backgroundColor: C.bg,
        pixelRatio: 3,
        cacheBust: true,
        // A stale/deleted player photo (404) would otherwise reject the whole capture -
        // this makes a single broken image degrade to a blank spot instead of failing
        // the export for every team over one bad photo.
        imagePlaceholder:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${(matchDayName || "MatchDay").replace(/\s+/g, "_")}_Teams.png`;
      link.click();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate screenshot");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        startIcon={isCapturing ? <LoadingOutlined /> : <CameraOutlined />}
        onClick={handleScreenshot}
        disabled={isCapturing || teams.length === 0}
      >
        Screenshot
      </Button>

      {/* Off-screen, not display:none - html2canvas needs real layout to capture. */}
      <div style={{ position: "fixed", top: 0, left: -100000, zIndex: -1 }}>
        <div
          ref={captureRef}
          style={{
            width: 1600,
            background: C.bg,
            fontFamily: "Arial, Helvetica, sans-serif",
            color: C.ink,
            // Inherited by every child span below - left at browser-default this is
            // where the row-border-through-text / clipped-letter-tops bug came from
            // (compounds with foreignObjectRendering above for a bigger safety margin).
            lineHeight: 1.4,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              padding: "32px 40px",
              borderBottom: `3px solid ${C.gold}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
              <img src={companyLogo} alt="" style={{ height: 78, width: 78, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15, whiteSpace: "nowrap" }}>
                  BOFC
                </div>
                <div style={{ fontSize: 15, color: C.ink2, marginTop: 4 }}>Pride. Passion. Football.</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              {venueName && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: C.card,
                    border: `1px solid ${C.rule}`,
                    borderRadius: 14,
                    padding: "13px 22px",
                    flexShrink: 0,
                  }}
                >
                  <IconBox size={24} color={C.gold}><EnvironmentOutlined /></IconBox>
                  <div>
                    <div style={{ fontSize: 14, color: C.ink2, fontWeight: 600 }}>Venue</div>
                    <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{venueName}</div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: C.card,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 14,
                  padding: "13px 22px",
                  flexShrink: 0,
                }}
              >
                <IconBox size={24} color={C.gold}><CalendarOutlined /></IconBox>
                <div>
                  <div style={{ fontSize: 14, color: C.ink2, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {matchDayName || "Match Day"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {matchDayDate ? showBdLocalTimeRange(matchDayDate, durationMinutes) : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: "flex", gap: 34, padding: "32px 40px", alignItems: "flex-start" }}>
            {/* Teams - 2 per row */}
            <div style={{ flex: "0 0 57%" }}>
              <SectionHeading icon={<TeamOutlined />} label="TODAY'S TEAMS" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start", gap: 15 }}>
                {teams.map((team) => (
                  <div
                    key={team.teamId}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.rule}`,
                      borderRadius: 12,
                      padding: 15,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: C.rowBg,
                          border: `1px solid ${C.rule}`,
                          color: C.ink2,
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {teamCodes.get(team.teamId)}
                      </span>
                      <span style={{ fontSize: 17, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: "nowrap" }}>
                        {team.teamName}
                      </span>
                      <span
                        style={{
                          background: "rgba(201, 163, 74, 0.14)",
                          color: C.goldBright,
                          borderRadius: 22,
                          padding: "3px 13px",
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {team.players.length}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {team.players.map((player, pIndex) => (
                        <div
                          key={player.playerId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "5px 3px",
                            borderBottom: pIndex < team.players.length - 1 ? `1px solid rgba(255,255,255,0.06)` : "none",
                          }}
                        >
                          <PlayerAvatar name={player.playerName} seed={player.playerId} size={22} src={toAbsolutePlayerPhotoUrl(player.photoUrl)} />
                          <span
                            style={{
                              fontSize: 14,
                              minWidth: 0,
                              flexShrink: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {player.playerName}
                          </span>
                          {player.jerseyNumber != null && (
                            <span
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                color: "#dcdfe3",
                                borderRadius: 999,
                                padding: "2px 9px",
                                fontSize: 11,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              #{player.jerseyNumber}
                            </span>
                          )}
                          {player.isCaptain && (
                            <span
                              title="Captain"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: "#d69a2f",
                                color: "#fff",
                                fontSize: 9,
                                fontWeight: 700,
                                lineHeight: 1,
                                flexShrink: 0,
                              }}
                            >
                              C
                            </span>
                          )}
                          {player.playingPosition === "GOALKEEPER" && (
                            <img src={redGlovesIcon} alt="Goalkeeper" title="Goalkeeper" style={{ width: 14, height: 14, flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                      {team.players.length === 0 && (
                        <span style={{ fontSize: 14, color: "#6b8172" }}>No players yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matches */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <SectionHeading icon={<ThunderboltOutlined />} label="TODAY'S MATCHES" />
              {fixtures.length === 0 ? (
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.rule}`,
                    borderRadius: 12,
                    padding: 24,
                    textAlign: "center",
                    fontSize: 15,
                    color: C.ink2,
                  }}
                >
                  No matches scheduled yet.
                </div>
              ) : (
                <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 12, padding: "2px 20px" }}>
                  {fixtures.map((fixture, i) => {
                    const isLive = fixture.matchStatus === "COMPLETED" || fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED";
                    const homeSwatch = getJerseySwatch(fixture.homeJerseyColor);
                    const awaySwatch = getJerseySwatch(fixture.awayJerseyColor);
                    const homeLabel = getJerseyLabel(fixture.homeJerseyColor);
                    const awayLabel = getJerseyLabel(fixture.awayJerseyColor);
                    return (
                      <div
                        key={fixture.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          padding: "17px 0",
                          borderBottom: i < fixtures.length - 1 ? `1px solid ${C.rule}` : "none",
                          fontSize: 15,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <span style={{ color: C.gold, fontWeight: 700, width: 27, flexShrink: 0 }}>#{i + 1}</span>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", fontWeight: 600 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                              {homeLabel && <span style={{ color: C.ink2, fontSize: 12 }}>({homeLabel})</span>}
                              {homeSwatch && <IconBox size={19}><JerseyIcon color={homeSwatch} size={19} /></IconBox>}
                              {fixture.homeTeamName}
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: "rgba(201, 163, 74, 0.15)",
                                  color: C.goldBright,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {teamCodes.get(fixture.homeTeamId) || getTeamCode(fixture.homeTeamName, 0)}
                              </span>
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: C.rowBg,
                                border: `1px solid ${C.rule}`,
                                color: C.ink,
                                fontSize: 12,
                                fontWeight: 800,
                                letterSpacing: "0.02em",
                                flexShrink: 0,
                              }}
                            >
                              {isLive ? `${fixture.homeTeamScore}-${fixture.awayTeamScore}` : "VS"}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: "rgba(201, 163, 74, 0.15)",
                                  color: C.goldBright,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {teamCodes.get(fixture.awayTeamId) || getTeamCode(fixture.awayTeamName, 0)}
                              </span>
                              {fixture.awayTeamName}
                              {awayLabel && <span style={{ color: C.ink2, fontSize: 12 }}>({awayLabel})</span>}
                              {awaySwatch && <IconBox size={19}><JerseyIcon color={awaySwatch} size={19} /></IconBox>}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: C.ink2, fontSize: 15 }}>
                          <IconBox size={15} color={C.gold}><ClockCircleOutlined /></IconBox>
                          {formatMatchTimeRange(fixture.matchDate, fixture.matchDurationMinutes).replace(/^[^,]*,\s*/, "")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "0 40px 34px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: C.card,
                border: `1px solid ${C.rule}`,
                borderRadius: 16,
                padding: "17px 27px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: C.ink2 }}>
                <IconBox size={16} color={C.gold}><TrophyOutlined /></IconBox> Let's play hard, have fun, and make BOFC proud!
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
