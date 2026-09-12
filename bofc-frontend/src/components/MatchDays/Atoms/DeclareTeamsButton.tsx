import React, { useRef, useState } from "react";
import {
  LoadingOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  NotificationOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Team } from "../teamBuilderTypes";
import { useGetFixturesQuery } from "../../../state/features/fixtures/fixturesSlice";
import { useDeclareTeamsMutation } from "../../../state/features/matchDays/matchDayTeamSlice";
import { formatMatchTimeRange } from "../../../utils/matchTimeUtils";
import { showBdLocalTimeRange } from "../../../utils/utils";
import { getJerseySwatch, getJerseyLabel } from "../../../utils/jerseyColors";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import companyLogo from "../../../assets/logo.png";
import redGlovesIcon from "../../../assets/red-gloves.png";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";
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

interface DeclareTeamsButtonProps {
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

// Two separate canvases rather than one wide one. The old combined export put teams and
// fixtures side by side at 1600px, which reads fine on a laptop and arrives in an inbox as a
// letterboxed thumbnail nobody can read without tapping through. Each of these is closer to
// portrait and legible at the width an email client actually gives it.
const TEAMS_WIDTH = 1200;
const SCHEDULE_WIDTH = 1000;

// 2, not 3. At 3 a 1200px canvas rasterizes to 3600px, and two of those base64-encoded run
// into nginx's 10MB body cap on the way to the declare endpoint.
const CAPTURE_PIXEL_RATIO = 2;

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

/** Branded frame both exports share, so the schedule image stands on its own in an inbox
 * instead of looking like half of something. */
function CaptureShell({
  innerRef,
  width,
  matchDayName,
  matchDayDate,
  durationMinutes,
  venueName,
  children,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  width: number;
  matchDayName?: string;
  matchDayDate?: string | null;
  durationMinutes?: number | null;
  venueName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={innerRef}
      style={{
        width,
        background: C.bg,
        fontFamily: "Arial, Helvetica, sans-serif",
        color: C.ink,
        // Inherited by every child span below - left at browser-default this is
        // where the row-border-through-text / clipped-letter-tops bug came from.
        lineHeight: 1.4,
      }}
    >
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
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15, whiteSpace: "nowrap" }}>BOFC</div>
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

      <div style={{ padding: "32px 40px" }}>{children}</div>

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
  );
}

/**
 * "Declare Teams" - renders the line-ups and the schedule into two off-screen divs, rasterizes
 * each with html-to-image, and emails both to every confirmed participant as inline images.
 * Manual only: teams are auto-generated hours before kickoff and routinely adjusted afterwards,
 * so firing this automatically would announce a draft roster to the whole club.
 *
 * Plain hex colors throughout (not the app's usual oklch tokens) for broad rasterizer
 * compatibility. Player avatars use the same shared Avatar component as the team-building UI:
 * real photo when uploaded, otherwise a deterministic illustrated placeholder per player.
 */
export default function DeclareTeamsButton({
  matchDayId,
  matchDayName,
  matchDayDate,
  durationMinutes,
  venueName,
  teams,
}: DeclareTeamsButtonProps) {
  const teamsRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [images, setImages] = useState<{ teams: string; schedule: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [declareTeams, { isLoading: isSending }] = useDeclareTeamsMutation();

  const { data: fixturesData } = useGetFixturesQuery({ matchDayId });
  const fixtures = [...(fixturesData?.content || [])].sort((a, b) => a.matchOrder - b.matchOrder);

  const teamCodes = new Map(teams.map((t, i) => [t.teamId, getTeamCode(t.teamName, i)]));
  const fileStem = (matchDayName || "MatchDay").replace(/\s+/g, "_");

  const handleOpen = async () => {
    if (!teamsRef.current || !scheduleRef.current || teams.length === 0) return;
    setIsCapturing(true);
    try {
      // html-to-image serializes the DOM into an SVG <foreignObject> and lets the browser's
      // own engine paint it, instead of html2canvas's approach of reimplementing CSS layout -
      // that's what was behind the icon/avatar drift and dropped photos.
      const { toPng } = await import("html-to-image");
      const options = {
        backgroundColor: C.bg,
        pixelRatio: CAPTURE_PIXEL_RATIO,
        cacheBust: true,
        // A stale/deleted player photo (404) would otherwise reject the whole capture -
        // this makes a single broken image degrade to a blank spot instead of failing
        // the export for every team over one bad photo.
        imagePlaceholder:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      };
      // Sequential, not Promise.all: both captures paint through the same browser engine, and
      // running them together noticeably slows the pair down on a mid-range laptop.
      const teamsPng = await toPng(teamsRef.current, options);
      const schedulePng = await toPng(scheduleRef.current, options);
      setImages({ teams: teamsPng, schedule: schedulePng });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate the images");
    } finally {
      setIsCapturing(false);
    }
  };

  const download = (dataUrl: string, suffix: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileStem}_${suffix}.png`;
    link.click();
  };

  const send = async (asTest: boolean) => {
    if (!images) return;
    if (!asTest && !window.confirm("Email these to every confirmed player? They'll also get an in-app notification.")) {
      return;
    }
    try {
      const { content } = await declareTeams({
        matchDayId,
        teamsImageBase64: images.teams,
        scheduleImageBase64: images.schedule,
        testEmail: asTest ? testEmail.trim() : undefined,
      }).unwrap();

      if (content.sent === 0) {
        // A zero here is a failure with a reason attached, not a quiet success - surfacing the
        // SMTP server's own words is what turned a silent multi-day email outage into a
        // one-line diagnosis last time.
        toast.error(content.errorMessage || "Nothing was sent - check SMTP is enabled in Settings.");
        return;
      }
      toast.success(
        asTest
          ? `Test sent to ${testEmail.trim()}.`
          : `Teams declared - emailed ${content.sent} player${content.sent === 1 ? "" : "s"}.`
      );
      if (!asTest) setImages(null);
    } catch (error: any) {
      toast.error(normalizeErrorMessage(error?.data || error, "Failed to declare the teams"));
    }
  };

  const teamsGrid = (
    <>
      <SectionHeading icon={<TeamOutlined />} label="TODAY'S TEAMS" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start", gap: 15 }}>
        {teams.map((team) => (
          <div key={team.teamId} style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 12, padding: 15 }}>
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
              <span style={{ fontSize: 17, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: "nowrap" }}>{team.teamName}</span>
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
              {team.players.length === 0 && <span style={{ fontSize: 14, color: "#6b8172" }}>No players yet</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const scheduleList = (
    <>
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
    </>
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        startIcon={isCapturing ? <LoadingOutlined /> : <NotificationOutlined />}
        onClick={handleOpen}
        disabled={isCapturing || teams.length === 0}
      >
        {isCapturing ? "Preparing..." : "Declare Teams"}
      </Button>

      <Modal
        isOpen={images !== null}
        onClose={() => setImages(null)}
        title="Declare Teams"
        className="max-w-[760px]"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setImages(null)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              startIcon={<DownloadOutlined />}
              disabled={isSending}
              onClick={() => {
                if (!images) return;
                download(images.teams, "Teams");
                download(images.schedule, "Schedule");
              }}
            >
              Download both
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => send(true)} disabled={isSending || !testEmail.trim()}>
              Send test
            </Button>
            <Button type="button" size="sm" onClick={() => send(false)} disabled={isSending}>
              {isSending ? "Sending..." : "Declare to all participants"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            These two images go to every confirmed player, shown in the email itself. Check them before sending - the
            declaration is the thing players act on.
          </p>
          <img src={images?.teams} alt="Team line-ups preview" className="w-full rounded-xl border border-gray-200 dark:border-[var(--color-rule)]" />
          <img src={images?.schedule} alt="Schedule preview" className="w-full rounded-xl border border-gray-200 dark:border-[var(--color-rule)]" />
          <FormInput
            id="declare-teams-test-email"
            type="email"
            label="Send a test to (optional)"
            placeholder="you@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            hint="Sends the identical email to this one address only - no in-app notifications, nothing to the players."
          />
        </div>
      </Modal>

      {/* Off-screen, not display:none - html-to-image needs real layout to capture. */}
      <div style={{ position: "fixed", top: 0, left: -100000, zIndex: -1 }}>
        <CaptureShell
          innerRef={teamsRef}
          width={TEAMS_WIDTH}
          matchDayName={matchDayName}
          matchDayDate={matchDayDate}
          durationMinutes={durationMinutes}
          venueName={venueName}
        >
          {teamsGrid}
        </CaptureShell>
        <CaptureShell
          innerRef={scheduleRef}
          width={SCHEDULE_WIDTH}
          matchDayName={matchDayName}
          matchDayDate={matchDayDate}
          durationMinutes={durationMinutes}
          venueName={venueName}
        >
          {scheduleList}
        </CaptureShell>
      </div>
    </>
  );
}
