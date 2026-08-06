import React, { useEffect, useState } from "react";
import { ClockCircleOutlined, TeamOutlined, TrophyOutlined, FireOutlined, DollarOutlined, DownOutlined, RightOutlined, UserOutlined } from "@ant-design/icons";
import {
  useGetAuctionDashboardQuery,
  useGetAuctionSettingsQuery,
  useGetAuctionPlayersQuery,
} from "../../state/features/auction/auctionSlice";
import { AuctionPlayerResponse, TeamBudgetResponse } from "../../state/features/auction/auctionTypes";
import {
  StatusPill,
  SignedTile,
  CategoryPill,
  metaMuted,
  ac,
  scoreNum,
  kicker,
} from "../Auction/AuctionAtoms";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import Loader from "../ui/loader";

const fmt = (n?: number) => (n != null ? `৳${n.toLocaleString()}` : "—");
const panel: React.CSSProperties = {
  background: ac.panel,
  border: `1px solid ${ac.panelBorder}`,
  borderRadius: 14,
  overflow: "hidden",
};
const panelHeader: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: `1px solid ${ac.panelBorder}`,
  ...kicker,
  color: ac.goldSoft,
};
const chip = (label: string, color: string) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 700,
      color,
      background: `${color}22`,
      border: `1px solid ${color}59`,
      borderRadius: 999,
      padding: "2px 10px",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

const segmentBtn = (active: boolean) =>
  `px-3.5 py-1.5 text-theme-sm font-medium transition ${
    active
      ? "bg-brand-500 text-white"
      : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;

// Ticks once a second so countdowns/timers update live.
const useNow = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div style={{ textAlign: "center", minWidth: 64 }}>
    <div style={{ ...scoreNum, fontSize: 40, fontWeight: 900, color: ac.gold, lineHeight: 1 }}>
      {String(value).padStart(2, "0")}
    </div>
    <div style={{ ...kicker, color: ac.textMuted, fontSize: 10, marginTop: 4 }}>{label}</div>
  </div>
);

const ProgressBar: React.FC<{ percent: number; color: string }> = ({ percent, color }) => (
  <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, percent))}%`, background: color, transition: "width 0.3s" }} />
  </div>
);

function HeroAvatar({ src, initials }: { src?: string; initials: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: 72, height: 72, border: `2px solid ${ac.gold}`, background: "rgba(198,161,91,0.14)", color: ac.goldSoft, fontSize: 26, fontWeight: 700 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

// A team card (collapsible) showing the squad it has bought.
const TeamCard: React.FC<{ team: TeamBudgetResponse; players: AuctionPlayerResponse[] }> = ({ team, players }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={panel}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {open ? <DownOutlined style={{ color: ac.textMuted, fontSize: 12 }} /> : <RightOutlined style={{ color: ac.textMuted, fontSize: 12 }} />}
          <span className="truncate" style={{ fontWeight: 700, color: ac.textPrimary, fontSize: 15 }}>{team.teamName}</span>
          {team.ownerName && <span style={metaMuted}>· {team.ownerName}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {chip(`Spent ${fmt(team.totalSpent)}`, ac.gold)}
          {chip(`Left ${fmt(team.remainingBudget)}`, ac.pitch)}
          {chip(`${players.length} players`, ac.info)}
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 12px" }} />
          {players.length === 0 ? (
            <span style={{ color: ac.textMuted }}>No players bought yet.</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {players.map((p, i) => (
                <SignedTile
                  key={p.id}
                  index={i + 1}
                  name={p.playerName}
                  photoUrl={p.photoUrl}
                  category={p.category}
                  price={p.finalPrice}
                  meta={<span style={metaMuted}>Base {fmt(p.basePrice)}</span>}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  matchDayId: number;
}

const ViewerAuctionTab: React.FC<Props> = ({ matchDayId }) => {
  const now = useNow();
  const [playerTab, setPlayerTab] = useState<"available" | "sold" | "unsold">("available");

  const { data: dashboard, isLoading } = useGetAuctionDashboardQuery(matchDayId, { pollingInterval: 8000 });
  const { data: settings } = useGetAuctionSettingsQuery(matchDayId);
  const { data: allPlayers = [] } = useGetAuctionPlayersQuery(matchDayId, { pollingInterval: 8000 });

  const session = dashboard?.session;
  const status = session?.status || "NOT_STARTED";
  const currentPlayer = dashboard?.currentPlayer;
  const teamBudgets = dashboard?.teamBudgets || [];
  const soldPlayers = dashboard?.soldPlayers || [];
  const unsoldPlayers = dashboard?.unsoldPlayers || [];
  const bids = dashboard?.currentPlayerBids || [];

  // Players still waiting to go up (not sold yet).
  const availablePlayers = [...allPlayers]
    .filter((p) => p.status === "AVAILABLE" || p.status === "ON_AUCTION")
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  if (isLoading) return <Loader className="py-20" />;

  // ── Not started → countdown / status ──────────────────────────────────────
  if (status === "NOT_STARTED") {
    const target = settings?.scheduledStartTime ? new Date(settings.scheduledStartTime).getTime() : null;
    const diff = target ? Math.max(0, target - now) : null;
    const totalPlayers = dashboard?.totalPlayers ?? 0;

    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ ...panel, textAlign: "center", padding: "36px 24px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "radial-gradient(ellipse at 50% 0%, rgba(198,161,91,0.16), transparent 72%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <FireOutlined style={{ fontSize: 40, color: ac.gold, marginBottom: 12 }} />
            <h3 style={{ margin: 0, color: ac.textPrimary, fontSize: 22, fontWeight: 700 }}>Player Auction</h3>

            {diff != null && diff > 0 ? (
              <>
                <span style={{ color: ac.textMuted, display: "block", margin: "6px 0 22px" }}>Starts in</span>
                <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
                  <CountdownUnit value={Math.floor(diff / 86400000)} label="Days" />
                  <CountdownUnit value={Math.floor((diff / 3600000) % 24)} label="Hours" />
                  <CountdownUnit value={Math.floor((diff / 60000) % 60)} label="Min" />
                  <CountdownUnit value={Math.floor((diff / 1000) % 60)} label="Sec" />
                </div>
                {settings?.scheduledStartTime && (
                  <span style={{ color: ac.textMuted, fontSize: 12, display: "block", marginTop: 18 }}>
                    {new Date(settings.scheduledStartTime).toLocaleString()}
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: ac.textMuted, display: "block", marginTop: 10 }}>
                {target ? "Starting any moment now…" : "The auction hasn't started yet. Check back soon!"}
              </span>
            )}

            {totalPlayers > 0 && (
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
                <span style={{ color: ac.textMuted }}><TeamOutlined style={{ color: ac.gold, marginRight: 6 }} />{teamBudgets.length} teams</span>
                <span style={{ color: ac.textMuted }}><FireOutlined style={{ color: ac.gold, marginRight: 6 }} />{totalPlayers} players in the pool</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Shared pieces (running & completed) ───────────────────────────────────
  const teamsSection = teamBudgets.length > 0 && (
    <div>
      <h4 style={{ margin: "0 0 10px", color: ac.textPrimary, fontSize: 16, fontWeight: 700 }}>
        <TeamOutlined style={{ marginRight: 8, color: ac.gold }} />
        Teams
      </h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {teamBudgets.map((tb) => (
          <TeamCard key={tb.teamId} team={tb} players={soldPlayers.filter((p) => p.soldToTeamId === tb.teamId)} />
        ))}
      </div>
    </div>
  );

  // Only show tabs that actually have players; pick a valid active tab.
  const playerTabDefs = [
    { key: "available" as const, label: "Available", list: availablePlayers },
    { key: "sold" as const, label: "Sold", list: soldPlayers },
    { key: "unsold" as const, label: "Unsold", list: unsoldPlayers },
  ].filter((t) => t.list.length > 0);

  const activeTabKey = playerTabDefs.some((t) => t.key === playerTab) ? playerTab : playerTabDefs[0]?.key;
  const activeList = playerTabDefs.find((t) => t.key === activeTabKey)?.list ?? [];

  const playersSection = playerTabDefs.length > 0 && (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <h4 style={{ margin: 0, color: ac.textPrimary, fontSize: 16, fontWeight: 700 }}>
          <UserOutlined style={{ marginRight: 8, color: ac.gold }} />
          Players
        </h4>
        <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
          {playerTabDefs.map((t) => (
            <button key={t.key} type="button" onClick={() => setPlayerTab(t.key)} className={segmentBtn(activeTabKey === t.key)}>
              {t.label} ({t.list.length})
            </button>
          ))}
        </div>
      </div>
      <div style={{ ...panel, padding: 12 }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeList.map((p, i) => (
            <SignedTile
              key={p.id}
              index={i + 1}
              name={p.playerName}
              photoUrl={p.photoUrl}
              category={p.category}
              price={activeTabKey === "sold" ? p.finalPrice : p.basePrice}
              priceLabel={activeTabKey === "sold" ? "Sold" : "Base"}
              priceColor={activeTabKey === "sold" ? ac.pitch : ac.textMuted}
              meta={
                activeTabKey === "sold" ? (
                  p.soldToTeamName ? <span style={metaMuted}>{p.soldToTeamName}</span> : undefined
                ) : p.status === "ON_AUCTION" ? (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: ac.pitch, textTransform: "uppercase", letterSpacing: 0.4 }}>On Auction</span>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Completed → summary ───────────────────────────────────────────────────
  if (status === "COMPLETED") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...panel, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <TrophyOutlined style={{ fontSize: 22, color: ac.gold }} />
          <span style={{ fontWeight: 700, color: ac.textPrimary, fontSize: 16 }}>Auction Completed</span>
          <StatusPill status="COMPLETED" />
        </div>
        {teamsSection}
        {playersSection}
      </div>
    );
  }

  // ── Live (RUNNING / PAUSED) → spectator board ─────────────────────────────
  const endsAt = session?.currentTimerEndsAt
    ? new Date(session.currentTimerEndsAt.endsWith("Z") ? session.currentTimerEndsAt : session.currentTimerEndsAt + "Z").getTime()
    : null;
  const secondsLeft = endsAt ? Math.max(0, Math.floor((endsAt - now) / 1000)) : 0;
  const timerColor = secondsLeft > 30 ? ac.pitch : secondsLeft > 10 ? ac.amber : ac.red;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const heroPhoto = currentPlayer?.photoUrl ? toAbsolutePlayerPhotoUrl(currentPlayer.photoUrl) : undefined;
  const heroInitials = currentPlayer
    ? currentPlayer.playerName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "";
  const heroPosition =
    currentPlayer && currentPlayer.playingPosition && String(currentPlayer.playingPosition) !== "UNASSIGNED"
      ? String(currentPlayer.playingPosition).replace(/_/g, " ")
      : "Player";

  // One row per team — their highest (current) bid — leader first.
  const feedBids = Array.from(
    bids
      .reduce((map, b) => {
        const cur = map.get(b.teamId);
        if (!cur || b.bidAmount > cur.bidAmount) map.set(b.teamId, b);
        return map;
      }, new Map<number, (typeof bids)[number]>())
      .values()
  ).sort((a, b) => b.bidAmount - a.bidAmount);
  const showBidFeed = feedBids.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h4 style={{ margin: 0, color: ac.textPrimary, display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700 }}>
          <FireOutlined style={{ color: ac.gold }} /> Live Auction
        </h4>
        <StatusPill status={status} />
      </div>

      {/* On the block + bid feed — only when a player is actually up */}
      {currentPlayer && (
        <div className={`grid grid-cols-1 gap-3.5 ${showBidFeed ? "lg:grid-cols-[16fr_8fr]" : ""}`}>
          <div style={{ ...panel, textAlign: "center", position: "relative" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${ac.gold}, ${ac.goldSoft})` }} />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                <HeroAvatar src={heroPhoto} initials={heroInitials} />
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <div style={{ ...kicker, color: ac.goldSoft, fontSize: 10, marginBottom: 4 }}>On The Block</div>
                  <h3 style={{ margin: 0, color: ac.textPrimary, lineHeight: 1.15, fontSize: 22, fontWeight: 700 }}>{currentPlayer.playerName}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <CategoryPill category={currentPlayer.category} />
                    <span style={{ color: ac.textMuted, fontSize: 12, fontWeight: 600 }}>{heroPosition}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0 0", flexWrap: "wrap" }}>
                <div style={{ background: ac.tileBg, border: ac.tileBorder, borderRadius: 10, padding: "8px 18px", minWidth: 130 }}>
                  <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>Base Price</div>
                  <div style={{ ...scoreNum, fontSize: 20, fontWeight: 800, color: ac.textPrimary }}>{fmt(currentPlayer.basePrice)}</div>
                </div>
                <div style={{ background: currentPlayer.currentBid ? "rgba(46,158,91,0.14)" : ac.tileBg, border: `1px solid ${currentPlayer.currentBid ? ac.pitch : "rgba(255,255,255,0.09)"}`, borderRadius: 10, padding: "8px 18px", minWidth: 150 }}>
                  <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>
                    {currentPlayer.currentHighestTeamName ? `Leading · ${currentPlayer.currentHighestTeamName}` : "Current Bid"}
                  </div>
                  <div style={{ ...scoreNum, fontSize: 28, fontWeight: 900, color: currentPlayer.currentBid ? ac.pitch : ac.goldSoft }}>
                    {fmt(currentPlayer.currentBid ?? currentPlayer.basePrice)}
                  </div>
                </div>
              </div>

              {status === "RUNNING" && endsAt && secondsLeft > 0 && (
                <div style={{ margin: "16px auto 4px", maxWidth: 240 }}>
                  <div style={{ ...scoreNum, fontSize: 34, fontWeight: 900, color: timerColor, lineHeight: 1, letterSpacing: 3 }}>
                    <ClockCircleOutlined style={{ fontSize: 20, marginRight: 8, verticalAlign: "middle" }} />
                    {mm}:{ss}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar percent={Math.min(100, (secondsLeft / 120) * 100)} color={timerColor} />
                  </div>
                </div>
              )}
              {status === "PAUSED" && (
                <div style={{ marginTop: 14 }}><StatusPill status="PAUSED" label="Auction Paused" /></div>
              )}
            </div>
          </div>

          {/* Bid feed — only when there are bids */}
          {showBidFeed && (
            <div style={panel}>
              <div style={panelHeader}><DollarOutlined /> Bid Feed</div>
              <div style={{ padding: 8, maxHeight: 340, overflowY: "auto" }}>
                {feedBids.map((bid) => (
                  <div key={bid.id} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 8, background: bid.isWinning ? "rgba(46,158,91,0.16)" : ac.tileBg, border: bid.isWinning ? `1px solid ${ac.pitch}` : ac.tileBorder }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: ac.textPrimary }}>{bid.teamName}</span>
                      <span style={{ ...scoreNum, color: ac.pitch, fontWeight: 700 }}>{fmt(bid.bidAmount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: ac.textMuted }}>{bid.bidderName}</span>
                      {bid.isWinning && <span style={{ fontSize: 10, fontWeight: 700, color: ac.pitch, textTransform: "uppercase", letterSpacing: 0.4 }}>Leading</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {teamsSection}
      {playersSection}
    </div>
  );
};

export default ViewerAuctionTab;
