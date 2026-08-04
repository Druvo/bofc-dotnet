import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  PlayCircleOutlined, PauseCircleOutlined, StepForwardOutlined,
  DollarOutlined, CloseCircleOutlined, UndoOutlined, TeamOutlined,
  TrophyOutlined, ThunderboltOutlined, ClockCircleOutlined, EyeOutlined,
  ReloadOutlined, UnorderedListOutlined
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetAuctionDashboardQuery,
  useGetAuctionPlayersQuery,
  useGetAuctionSettingsQuery,
  useStartAuctionMutation,
  usePauseAuctionMutation,
  useResumeAuctionMutation,
  useEndAuctionMutation,
  useNextPlayerMutation,
  useNextPlayerRandomMutation,
  useSkipPlayerMutation,
  useMarkSoldMutation,
  useMarkUnsoldMutation,
  useUndoLastSaleMutation,
  useStartUnsoldRoundMutation,
  useRestartBiddingMutation,
  useSelectPlayerForAuctionMutation,
  usePlaceBidMutation,
} from "../../state/features/auction/auctionSlice";
import { AuctionPlayerResponse, AuctionWebSocketMessage, BidResponse, TeamBudgetResponse } from "../../state/features/auction/auctionTypes";
import { useAuctionWebSocket } from "../../hooks/useAuctionWebSocket";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { GoldDivider, StatusPill, StatTile, SignedTile, CategoryPill, metaMuted, teamChip, ac, scoreNum, kicker } from "./AuctionAtoms";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { useStatTones } from "../../hooks/useStatTones";
import { showBrowserNotification } from "../../utils/browserNotifications";
import Button from "../ui/button";
import Modal from "../ui/modal";
import Loader from "../ui/loader";
import Pagination from "../ui/pagination";

const fmt = (n?: number) => n != null ? `৳${n.toLocaleString()}` : "—";
const hasRole = (roles: string[] | undefined, role: string) =>
  !!roles?.some(r => r === role || r === `ROLE_${role}`);

// Navy broadcast panel shell used across the live board.
const boardPanel: React.CSSProperties = {
  background: ac.panel,
  border: `1px solid ${ac.panelBorder}`,
  borderRadius: 14,
  overflow: "hidden",
};

const ProgressBar: React.FC<{ percent: number; color: string }> = ({ percent, color }) => (
  <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, percent))}%`, background: color, transition: "width 0.3s" }} />
  </div>
);

const REMAINING_PAGE_SIZE = 12;

const LiveAuctionPage: React.FC = () => {
  const tones = useStatTones();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = hasRole(loginInfo.roles, "ADMIN") || hasRole(loginInfo.roles, "SUPERADMIN");
  const isTeamOwner = hasRole(loginInfo.roles, "TEAM_OWNER") || isAdmin;
  const myUserId = Number(loginInfo.userId);

  // --- Countdown timer state ---
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Modal state ---
  const [unsoldModal, setUnsoldModal] = useState(false);
  const [remainingModal, setRemainingModal] = useState(false);
  const [remainingPage, setRemainingPage] = useState(1);
  const [squadModal, setSquadModal] = useState<{ open: boolean; team: TeamBudgetResponse | null }>({
    open: false, team: null,
  });
  const [endAuctionModal, setEndAuctionModal] = useState(false);

  const [pollingActive, setPollingActive] = useState(true);
  // WebSocket push is the primary update signal; polling is only a slow fallback
  // in case the socket drops, so it runs at a relaxed interval to avoid load.
  const { data: dashboard, refetch: refetchDashboard, isLoading } = useGetAuctionDashboardQuery(tid, {
    pollingInterval: pollingActive ? 20000 : 0,
  });
  const { data: allAuctionPlayers = [], refetch: refetchPlayers } = useGetAuctionPlayersQuery(tid, {
    pollingInterval: pollingActive ? 20000 : 0,
  });
  const { data: auctionSettings } = useGetAuctionSettingsQuery(tid);

  const session = dashboard?.session;
  const currentPlayer = dashboard?.currentPlayer;
  const bids = dashboard?.currentPlayerBids || [];
  const teamBudgets = dashboard?.teamBudgets || [];
  const soldPlayers = dashboard?.soldPlayers || [];
  const remainingPlayers = useMemo(
    () => allAuctionPlayers
      .filter((p: AuctionPlayerResponse) => p.status === "AVAILABLE" || p.status === "ON_AUCTION")
      .sort((a: AuctionPlayerResponse, b: AuctionPlayerResponse) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)),
    [allAuctionPlayers]
  );
  const remainingPageCount = Math.max(1, Math.ceil(remainingPlayers.length / REMAINING_PAGE_SIZE));
  const remainingPageItems = remainingPlayers.slice((remainingPage - 1) * REMAINING_PAGE_SIZE, remainingPage * REMAINING_PAGE_SIZE);

  const myTeam = teamBudgets.find(tb => Number(tb.ownerId) === myUserId);
  const canParticipateInBidding = isTeamOwner || !!myTeam;

  // --- Live countdown ---
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const endsAt = session?.currentTimerEndsAt;
    if (!endsAt || session?.status !== "RUNNING" || !currentPlayer) {
      setSecondsLeft(0);
      return;
    }

    const calcRemaining = () => {
      const end = new Date(endsAt.endsWith("Z") ? endsAt : endsAt + "Z");
      return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
    };

    setSecondsLeft(calcRemaining());
    timerRef.current = setInterval(() => {
      const r = calcRemaining();
      setSecondsLeft(r);
      if (r <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.currentTimerEndsAt, session?.status, currentPlayer?.id]);

  // --- Stop polling when auction is completed ---
  useEffect(() => {
    if (dashboard?.session?.status === "COMPLETED") {
      setPollingActive(false);
    }
  }, [dashboard?.session?.status]);

  // --- WebSocket ---
  // Coalesce bursts of socket events (e.g. rapid bids from many owners) into a
  // single dashboard/players refetch so one bid doesn't trigger a reload storm.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWsMessage = useCallback((msg: AuctionWebSocketMessage) => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => {
      refetchDashboard();
      refetchPlayers();
    }, 300);

    // Only notify while the tab is backgrounded — visible bid feed / hero
    // panel already surfaces this live, a duplicate notification would be noise.
    if (!document.hidden) return;
    const p = msg.payload || {};
    const playerName = p.playerName || p.currentPlayer?.playerName;
    switch (msg.type) {
      case "BID_PLACED":
        showBrowserNotification(
          playerName ? `New bid on ${playerName}` : "New bid placed",
          { body: p.bidAmount ? `৳${Number(p.bidAmount).toLocaleString()}${p.teamName ? ` by ${p.teamName}` : ""}` : undefined, tag: "auction-bid" }
        );
        break;
      case "PLAYER_SOLD":
        showBrowserNotification(
          playerName ? `${playerName} sold!` : "Player sold",
          { body: p.teamName ? `To ${p.teamName}${p.finalPrice ? ` for ৳${Number(p.finalPrice).toLocaleString()}` : ""}` : undefined, tag: "auction-sold" }
        );
        break;
      case "NEXT_PLAYER":
        showBrowserNotification(
          playerName ? `${playerName} is up for auction` : "Next player up for auction",
          { tag: "auction-next" }
        );
        break;
      default:
        break;
    }
  }, [refetchDashboard, refetchPlayers]);
  useEffect(() => () => { if (refetchTimer.current) clearTimeout(refetchTimer.current); }, []);
  const { connected } = useAuctionWebSocket({ tournamentId: tid, onMessage: onWsMessage, enabled: true });

  // --- Mutations ---
  const [startAuction, { isLoading: starting }] = useStartAuctionMutation();
  const [pauseAuction] = usePauseAuctionMutation();
  const [resumeAuction] = useResumeAuctionMutation();
  const [endAuction] = useEndAuctionMutation();
  const [nextPlayer, { isLoading: loadingNext }] = useNextPlayerMutation();
  const [nextPlayerRandom, { isLoading: loadingRandom }] = useNextPlayerRandomMutation();
  const [skipPlayer] = useSkipPlayerMutation();
  const [markSold] = useMarkSoldMutation();
  const [markUnsold] = useMarkUnsoldMutation();
  const [undoLastSale] = useUndoLastSaleMutation();
  const [startUnsoldRound] = useStartUnsoldRoundMutation();
  const [restartBidding] = useRestartBiddingMutation();
  const [placeBid, { isLoading: bidding }] = usePlaceBidMutation();
  const [selectPlayerForAuction] = useSelectPlayerForAuctionMutation();

  const run = async (fn: () => Promise<any>, successMsg?: string) => {
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const handleBid = async (amount: number) => {
    if (!myTeam || !currentPlayer) return;
    await run(
      () => placeBid({ tournamentId: tid, body: { auctionPlayerId: currentPlayer.id, teamId: myTeam.teamId, bidAmount: amount } }).unwrap(),
      `Bid ${fmt(amount)} placed!`
    );
  };

  // Bid button amounts — respect configured bidIncrement
  const bidIncrement = auctionSettings?.bidIncrement ?? 5000;
  const currentBid = currentPlayer?.currentBid;
  const basePrice = currentPlayer?.basePrice ?? 0;
  const bidBase = currentBid ?? basePrice;
  const bidAmounts = [
    bidBase + bidIncrement,
    bidBase + bidIncrement * 2,
    bidBase + bidIncrement * 4,
  ];

  // Timer color
  const timerColor = secondsLeft > 30 ? ac.pitch : secondsLeft > 10 ? ac.amber : ac.red;
  const timerPercent = session?.currentTimerEndsAt
    ? Math.min(100, (secondsLeft / 120) * 100)
    : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // Current-player hero details
  const heroPhoto = currentPlayer?.photoUrl ? toAbsolutePlayerPhotoUrl(currentPlayer.photoUrl) : undefined;
  const heroInitials = currentPlayer
    ? currentPlayer.playerName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "";
  const heroPosition =
    currentPlayer && currentPlayer.playingPosition && String(currentPlayer.playingPosition) !== "UNASSIGNED"
      ? String(currentPlayer.playingPosition).replace(/_/g, " ")
      : "Player";

  if (isLoading) return <Loader className="mx-auto max-w-[1180px] py-24" />;

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", width: "100%" }}>
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="m-0 flex items-center gap-2.5 text-xl font-bold" style={{ color: ac.textPrimary }}>
            <TrophyOutlined style={{ color: ac.gold }} /> Live Auction
          </h3>
          <StatusPill status={session?.status || "NOT_STARTED"} />
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: 0.4, textTransform: "uppercase", padding: "2px 10px", borderRadius: 999,
              background: `${connected ? ac.pitch : ac.red}22`, border: `1px solid ${connected ? ac.pitch : ac.red}59`,
              color: connected ? ac.pitch : ac.red,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? ac.pitch : ac.red }} />
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" startIcon={<EyeOutlined />} onClick={() => setUnsoldModal(true)} className="!px-3 !py-1.5 text-theme-xs">
            Unsold ({dashboard?.unsoldPlayers?.length ?? 0})
          </Button>
          <Button size="sm" variant="outline" startIcon={<UnorderedListOutlined />} onClick={() => { setRemainingPage(1); setRemainingModal(true); }} className="!px-3 !py-1.5 text-theme-xs">
            Remaining ({remainingPlayers.length})
          </Button>
        </div>
      </div>

      <GoldDivider style={{ margin: "10px 0 14px" }} />

      {/* ── Stat strip ─────────────────────────────── */}
      <div className="mb-3.5 grid grid-cols-4 gap-3">
        <StatTile label="Round" value={session?.roundNumber ?? 1} accent={tones.primary} />
        <StatTile label="Remaining" value={dashboard?.remainingCount ?? 0} accent={tones.info} />
        <StatTile label="Sold" value={dashboard?.soldCount ?? 0} accent={tones.success} />
        <StatTile label="Unsold" value={dashboard?.unsoldCount ?? 0} accent={tones.error} />
      </div>

      {/* ── Admin controls ─────────────────────────── */}
      {isAdmin && (
        <div className="mb-3.5 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-2">
            {(!session || session.status === "COMPLETED") && (
              <span title={teamBudgets.length === 0 ? "Add at least one team budget before starting the auction" : undefined}>
                <Button
                  size="sm"
                  startIcon={<PlayCircleOutlined />}
                  onClick={() => run(() => startAuction(tid).unwrap(), "Auction started!")}
                  disabled={starting || teamBudgets.length === 0}
                >
                  Start Auction
                </Button>
              </span>
            )}
            {session?.status === "RUNNING" && (
              <>
                <Button size="sm" variant="outline" startIcon={<PauseCircleOutlined />} onClick={() => run(() => pauseAuction(tid).unwrap())}>Pause</Button>
                <Button size="sm" startIcon={<StepForwardOutlined />} disabled={loadingNext} onClick={() => run(() => nextPlayer(tid).unwrap())}>Next</Button>
                <Button size="sm" variant="outline" disabled={loadingRandom} onClick={() => run(() => nextPlayerRandom(tid).unwrap())}>🎲 Random</Button>
                {currentPlayer && (
                  <>
                    <Button
                      size="sm"
                      startIcon={<DollarOutlined />}
                      style={{ background: ac.pitch, borderColor: ac.pitch }}
                      onClick={() => run(() => markSold(tid).unwrap(), "Player sold!")}
                      disabled={!currentPlayer.currentBid}
                    >
                      Sell
                    </Button>
                    <Button size="sm" variant="danger" startIcon={<CloseCircleOutlined />} onClick={() => run(() => markUnsold(tid).unwrap(), "Marked unsold")}>
                      Unsold
                    </Button>
                    <Button size="sm" variant="outline" startIcon={<CloseCircleOutlined />} onClick={() => run(() => skipPlayer(tid).unwrap())}>Skip</Button>
                    <span title="Reset bids and restart timer for this player">
                      <Button size="sm" variant="outline" startIcon={<ReloadOutlined />} onClick={() => run(() => restartBidding(tid).unwrap(), "Bidding restarted!")}>Restart Timer</Button>
                    </span>
                  </>
                )}
                <Button size="sm" variant="outline" startIcon={<UndoOutlined />} onClick={() => run(() => undoLastSale(tid).unwrap(), "Sale undone!")}>Undo</Button>
              </>
            )}
            {session?.status === "PAUSED" && (
              <Button size="sm" startIcon={<PlayCircleOutlined />} onClick={() => run(() => resumeAuction(tid).unwrap())}>Resume</Button>
            )}
            {session && session.status !== "NOT_STARTED" && session.status !== "COMPLETED" && (
              <span title={(dashboard?.unsoldPlayers?.length ?? 0) === 0 ? "No unsold players" : undefined}>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={(dashboard?.unsoldPlayers?.length ?? 0) === 0}
                  onClick={() => run(() => startUnsoldRound(tid).unwrap(), "Re-auction started!")}
                >
                  Re-auction Unsold ({dashboard?.unsoldPlayers?.length ?? 0})
                </Button>
              </span>
            )}
            {session && session.status !== "NOT_STARTED" && session.status !== "COMPLETED" && (
              <Button size="sm" variant="danger" startIcon={<CloseCircleOutlined />} onClick={() => setEndAuctionModal(true)}>
                End Auction
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[5fr_14fr_5fr]">
        {/* ── Left: Team Budgets ───────────────────── */}
        <div style={boardPanel}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${ac.panelBorder}`, ...kicker, color: ac.goldSoft }}>
            <TeamOutlined /> Teams
          </div>
          <div style={{ padding: 8 }}>
            {teamBudgets.length === 0 ? (
              <div className="py-6 text-center text-theme-xs" style={{ color: ac.textMuted }}>No teams</div>
            ) : (
              teamBudgets.map(tb => {
                const mine = tb.ownerId === myUserId;
                const low = tb.remainingBudget < 10000;
                return (
                  <div
                    key={tb.teamId}
                    onClick={() => setSquadModal({ open: true, team: tb })}
                    style={{
                      padding: "8px 10px", marginBottom: 6, borderRadius: 8,
                      background: mine ? "rgba(46,158,91,0.14)" : ac.tileBg,
                      border: mine ? `1px solid ${ac.pitch}` : ac.tileBorder,
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 13, fontWeight: 700, color: ac.textPrimary }}>{tb.teamName}</span>
                      {mine && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: ac.pitch, background: "rgba(46,158,91,0.18)", border: `1px solid ${ac.pitch}`, borderRadius: 999, padding: "0 6px" }}>YOU</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: ac.textMuted }}>{tb.playersBought} players</span>
                      <span style={{ fontSize: 12, ...scoreNum, color: low ? ac.red : ac.pitch }}>
                        {fmt(tb.remainingBudget)}
                      </span>
                    </div>
                    <div style={{ marginTop: 2 }}>
                      <ProgressBar percent={(tb.remainingBudget / tb.totalBudget) * 100} color={low ? ac.red : ac.pitch} />
                    </div>
                    <span style={{ fontSize: 10, marginTop: 2, display: "block", color: ac.textMuted }}>
                      <EyeOutlined /> View squad
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Center: Current Player + Timer + Bid ── */}
        <div>
          {!session && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="m-0 text-theme-sm text-gray-600 dark:text-gray-300">Auction not started yet.</p>
              {isAdmin && (
                <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                  {teamBudgets.length === 0
                    ? "Go to Team Budgets to add teams before starting the auction."
                    : `Ensure the player pool and teams are set up (${teamBudgets.length} team${teamBudgets.length !== 1 ? "s" : ""} ready), then click "Start Auction".`}
                </p>
              )}
            </div>
          )}

          {session && !currentPlayer && session.status === "RUNNING" && (
            <div className="rounded-xl border border-blue-light-500/30 bg-blue-light-50 p-4 text-theme-sm text-blue-light-800 dark:border-blue-light-500/30 dark:bg-blue-light-500/15 dark:text-blue-light-500">
              <div className="font-semibold">No player on auction</div>
              <div className="mt-1">{isAdmin ? 'Click "Next" or "Random" to bring up the next player.' : "Waiting for admin to put up the next player..."}</div>
            </div>
          )}

          {session && !currentPlayer && session.status === "PAUSED" && (
            <div className="rounded-xl border border-warning-500/30 bg-warning-50 p-4 text-theme-sm font-semibold text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-orange-400">
              Auction is paused
            </div>
          )}

          {session && !currentPlayer && session.status === "COMPLETED" && (
            <div className="rounded-xl border border-success-500/30 bg-success-50 p-4 text-theme-sm font-semibold text-success-800 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-500">
              Auction completed!
            </div>
          )}

          {currentPlayer && (
            <div style={{ ...boardPanel, textAlign: "center", position: "relative" }}>
              {/* Gold "on the block" accent strip */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${ac.gold}, ${ac.goldSoft})` }} />
              {/* Soft spotlight behind the player */}
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: 0,
                  right: 0,
                  height: 140,
                  background: "radial-gradient(ellipse at 50% 0%, rgba(198,161,91,0.16), transparent 72%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ padding: "14px 20px 16px", position: "relative" }}>
                {/* Identity row: photo + name/meta side by side (compact) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "left", flexWrap: "wrap" }}>
                  <div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{
                      width: 72,
                      height: 72,
                      border: `2px solid ${ac.gold}`,
                      boxShadow: "0 6px 18px rgba(198,161,91,0.3)",
                      background: "rgba(198,161,91,0.14)",
                      color: ac.goldSoft,
                      fontSize: 26,
                      fontWeight: 700,
                    }}
                  >
                    {heroPhoto ? <img src={heroPhoto} alt="" className="h-full w-full object-cover" /> : heroInitials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...kicker, color: ac.goldSoft, fontSize: 10, marginBottom: 4 }}>On The Block</div>
                    <h3 style={{ margin: 0, color: ac.textPrimary, lineHeight: 1.15, fontSize: 22, fontWeight: 700 }}>{currentPlayer.playerName}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <CategoryPill category={currentPlayer.category} />
                      <span style={{ color: ac.textMuted, fontSize: 12, fontWeight: 600 }}>{heroPosition}</span>
                      {currentPlayer.playerEmail && (
                        <span style={{ color: ac.textMuted, fontSize: 12 }}>· {currentPlayer.playerEmail}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "12px 0" }} />

                {/* Base price + current bid — compact scoreboard tiles */}
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ background: ac.tileBg, border: ac.tileBorder, borderRadius: 10, padding: "8px 18px", minWidth: 130 }}>
                    <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>Base Price</div>
                    <div style={{ ...scoreNum, fontSize: 20, fontWeight: 800, color: ac.textPrimary }}>{fmt(currentPlayer.basePrice)}</div>
                  </div>
                  <div
                    style={{
                      background: currentPlayer.currentBid ? "rgba(46,158,91,0.14)" : ac.tileBg,
                      border: `1px solid ${currentPlayer.currentBid ? ac.pitch : "rgba(255,255,255,0.09)"}`,
                      borderRadius: 10,
                      padding: "8px 18px",
                      minWidth: 150,
                    }}
                  >
                    <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>
                      {currentPlayer.currentHighestTeamName ? `Leading · ${currentPlayer.currentHighestTeamName}` : "Current Bid"}
                    </div>
                    <div style={{ ...scoreNum, fontSize: 28, fontWeight: 900, color: currentPlayer.currentBid ? ac.pitch : ac.goldSoft }}>
                      {fmt(currentPlayer.currentBid ?? currentPlayer.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Countdown timer */}
                {session?.status === "RUNNING" && session?.currentTimerEndsAt && secondsLeft > 0 && (
                  <div style={{ margin: "0 auto 14px", maxWidth: 240 }}>
                    <div style={{
                      ...scoreNum, fontSize: 38, fontWeight: 900, color: timerColor,
                      lineHeight: 1, letterSpacing: 3, transition: "color 0.5s",
                    }}>
                      <ClockCircleOutlined style={{ fontSize: 22, marginRight: 8, verticalAlign: "middle" }} />
                      {mm}:{ss}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ProgressBar percent={timerPercent} color={timerColor} />
                    </div>
                  </div>
                )}

                {/* Timer expired — player still on screen, admin decides */}
                {session?.status === "RUNNING" && !session?.currentTimerEndsAt && (
                  <div style={{ margin: "0 auto 12px", maxWidth: 320, textAlign: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "3px 14px", borderRadius: 20, background: `${ac.red}22`, border: `1px solid ${ac.red}59`, color: ac.red, fontWeight: 700 }}>
                      <ClockCircleOutlined /> Time's Up!
                    </span>
                    {isAdmin
                      ? <div style={{ marginTop: 8 }}><span style={{ color: ac.textMuted }}>Click <span style={{ fontWeight: 700, color: ac.textPrimary }}>Sell</span> to confirm or <span style={{ fontWeight: 700, color: ac.textPrimary }}>Unsold</span> to pass.</span></div>
                      : <div style={{ marginTop: 8 }}><span style={{ color: ac.textMuted }}>Waiting for admin decision...</span></div>
                    }
                  </div>
                )}

                {/* Bid section — shown to all TEAM_OWNERs */}
                {canParticipateInBidding && (
                  <>
                    {myTeam ? (
                      <>
                        {/* Bid buttons — only while timer is actively running */}
                        {session?.status === "RUNNING" && session?.currentTimerEndsAt && secondsLeft > 0 ? (
                          <>
                            <div style={{ marginTop: 8 }} className="flex flex-wrap items-center justify-center gap-3">
                              {bidAmounts.map((amt, i) => {
                                const canAfford = amt <= myTeam.remainingBudget;
                                return (
                                  <Button
                                    key={i}
                                    startIcon={<ThunderboltOutlined />}
                                    onClick={() => handleBid(amt)}
                                    disabled={bidding || !canAfford}
                                    style={{ minWidth: 108, ...scoreNum }}
                                  >
                                    {fmt(amt)}
                                  </Button>
                                );
                              })}
                            </div>
                            {/* Explain why bidding is unavailable instead of silently disabling */}
                            {bidAmounts[0] > myTeam.remainingBudget && (
                              <div className="mt-3 rounded-xl border border-warning-500/30 bg-warning-50 p-3 text-left text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-orange-400">
                                <div className="font-semibold">Not enough budget to bid on this player</div>
                                <div className="mt-1">{`The minimum bid is ${fmt(bidAmounts[0])} but your team has only ${fmt(myTeam.remainingBudget)} left. Ask the admin to raise your team budget, or this player is out of your range.`}</div>
                              </div>
                            )}
                            {bidAmounts[0] <= myTeam.remainingBudget && myTeam.playersBought >= (auctionSettings?.maxSquadSize ?? Infinity) && (
                              <div className="mt-3 rounded-xl border border-warning-500/30 bg-warning-50 p-3 text-left text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-orange-400">
                                <div className="font-semibold">Squad is full</div>
                                <div className="mt-1">{`Your team has reached the maximum squad size (${auctionSettings?.maxSquadSize}). You cannot bid for more players.`}</div>
                              </div>
                            )}
                          </>
                        ) : (
                          session?.status === "RUNNING" && !session?.currentTimerEndsAt && (
                            <span style={{ marginTop: 8, display: "inline-block", fontSize: 12, color: ac.textMuted, background: ac.tileBg, border: ac.tileBorder, borderRadius: 999, padding: "2px 10px" }}>Bidding closed — time expired</span>
                          )
                        )}
                        <div style={{ marginTop: 12 }}>
                          <span style={{ fontSize: 12, color: ac.textMuted }}>
                            Your budget: <span style={{ fontWeight: 700, ...scoreNum, color: myTeam.remainingBudget < 10000 ? ac.red : ac.pitch }}>
                              {fmt(myTeam.remainingBudget)}
                            </span> remaining • {myTeam.playersBought} player(s) bought
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="mt-3 rounded-xl border border-warning-500/30 bg-warning-50 p-3 text-left text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-orange-400">
                        <div className="font-semibold">No team budget registered for you in this auction.</div>
                        <div className="mt-1">Ask the admin to set up your team budget to enable bidding.</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Live Bid Feed ─────────────────── */}
        <div style={boardPanel}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${ac.panelBorder}`, ...kicker, color: ac.goldSoft }}>
            <DollarOutlined /> Bid Feed
          </div>
          <div style={{ padding: 8, maxHeight: 520, overflowY: "auto" }}>
            {bids.length === 0 ? (
              <div className="py-6 text-center text-theme-xs" style={{ color: ac.textMuted }}>No bids yet</div>
            ) : (
              [...bids].reverse().map((bid: BidResponse) => (
                <div key={bid.id} style={{
                  padding: "8px 10px",
                  marginBottom: 6,
                  borderRadius: 8,
                  background: bid.isWinning ? "rgba(46,158,91,0.16)" : ac.tileBg,
                  border: bid.isWinning ? `1px solid ${ac.pitch}` : ac.tileBorder,
                }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 700, color: ac.textPrimary }}>{bid.teamName}</span>
                    <span style={{ color: ac.pitch, fontWeight: "bold", ...scoreNum }}>{fmt(bid.bidAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 11, color: ac.textMuted }}>{bid.bidderName}</span>
                    {bid.isWinning && <span style={{ fontSize: 10, fontWeight: 700, color: ac.pitch, background: "rgba(46,158,91,0.18)", border: `1px solid ${ac.pitch}`, borderRadius: 999, padding: "0 6px" }}>Leading</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Sold Players board ───────────────────── */}
      {soldPlayers.length > 0 && (
        <div style={{ ...boardPanel, marginTop: 14 }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${ac.panelBorder}`, ...kicker, color: ac.goldSoft, display: "flex", alignItems: "center", gap: 8 }}>
            <TrophyOutlined /> Sold Players ({soldPlayers.length})
          </div>
          <div style={{ padding: 12 }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {soldPlayers.map((p: AuctionPlayerResponse, i: number) => (
              <SignedTile
                key={p.id}
                index={i + 1}
                name={p.playerName}
                photoUrl={p.photoUrl}
                category={p.category}
                price={p.finalPrice}
                meta={
                  <>
                    <span style={metaMuted}>Base {fmt(p.basePrice)}</span>
                    {p.soldToTeamName && <span style={teamChip}>{p.soldToTeamName}</span>}
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Remaining Players Modal ──────────────── */}
      <Modal
        isOpen={remainingModal}
        onClose={() => setRemainingModal(false)}
        title={<span className="inline-flex items-center gap-2"><UnorderedListOutlined style={{ color: ac.info }} /><span>Remaining Players ({remainingPlayers.length})</span></span>}
        className="max-w-[760px]"
      >
        {remainingPlayers.length === 0 ? (
          <div className="py-8 text-center text-theme-sm text-gray-400 dark:text-gray-500">No remaining players</div>
        ) : (
          <>
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full min-w-[640px] border-collapse text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Grade</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Position</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Base Price</th>
                    {isAdmin && <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {remainingPageItems.map((r: AuctionPlayerResponse, index: number) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{r.sequenceOrder ?? (remainingPage - 1) * REMAINING_PAGE_SIZE + index + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{r.playerName}</td>
                      <td className="px-3 py-2.5"><CategoryPill category={r.category} /></td>
                      <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{r.playingPosition || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{fmt(r.basePrice)}</td>
                      {isAdmin && (
                        <td className="px-3 py-2.5">
                          <Button
                            size="sm"
                            className="!px-2.5 !py-1.5 text-theme-xs"
                            onClick={async () => {
                              await run(
                                () => selectPlayerForAuction({ tournamentId: tid, playerId: r.id }).unwrap(),
                                `${r.playerName} selected for auction!`
                              );
                              setRemainingModal(false);
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {remainingPageCount > 1 && (
              <div className="mt-4">
                <Pagination page={remainingPage} totalPages={remainingPageCount} onChange={setRemainingPage} />
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        isOpen={unsoldModal}
        onClose={() => setUnsoldModal(false)}
        title={<span className="inline-flex items-center gap-2"><CloseCircleOutlined style={{ color: ac.red }} /><span>Unsold Players ({dashboard?.unsoldPlayers?.length ?? 0})</span></span>}
        className="max-w-[700px]"
      >
        {(dashboard?.unsoldPlayers?.length ?? 0) === 0 ? (
          <div className="py-8 text-center text-theme-sm text-gray-400 dark:text-gray-500">No unsold players</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full min-w-[560px] border-collapse text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Grade</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Base Price</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Position</th>
                  {isAdmin && <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {dashboard!.unsoldPlayers.map((record: AuctionPlayerResponse, i: number) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{record.playerName}</td>
                    <td className="px-3 py-2.5"><CategoryPill category={record.category} /></td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{fmt(record.basePrice)}</td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{record.playingPosition || "—"}</td>
                    {isAdmin && (
                      <td className="px-3 py-2.5">
                        <Button
                          size="sm"
                          className="!px-2.5 !py-1.5 text-theme-xs"
                          onClick={async () => {
                            await run(
                              () => selectPlayerForAuction({ tournamentId: tid, playerId: record.id }).unwrap(),
                              `${record.playerName} selected for auction!`
                            );
                            setUnsoldModal(false);
                          }}
                        >
                          Select
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ── Team Squad Modal ─────────────────────── */}
      <Modal
        isOpen={squadModal.open}
        onClose={() => setSquadModal({ open: false, team: null })}
        title={
          <div className="flex flex-wrap items-center gap-2">
            <TeamOutlined />
            <span>{squadModal.team?.teamName} — Squad</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tones.info, background: `${tones.info}22`, border: `1px solid ${tones.info}59`, borderRadius: 999, padding: "1px 8px" }}>{squadModal.team?.playersBought ?? 0} players</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tones.success, background: `${tones.success}22`, border: `1px solid ${tones.success}59`, borderRadius: 999, padding: "1px 8px" }}>Budget left: {fmt(squadModal.team?.remainingBudget)}</span>
          </div>
        }
        className="max-w-[680px]"
      >
        {(() => {
          const teamPlayers = soldPlayers.filter(
            (p: AuctionPlayerResponse) => p.soldToTeamId === squadModal.team?.teamId
          );
          const total = teamPlayers.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0);
          return teamPlayers.length === 0 ? (
            <div className="py-8 text-center text-theme-sm text-gray-400 dark:text-gray-500">No players bought yet</div>
          ) : (
            <div style={{ ...boardPanel, padding: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamPlayers.map((p: AuctionPlayerResponse, i: number) => (
                  <SignedTile
                    key={p.id}
                    index={i + 1}
                    name={p.playerName}
                    photoUrl={p.photoUrl}
                    category={p.category}
                    price={p.finalPrice}
                    meta={
                      <>
                        {p.playingPosition && <span style={metaMuted}>{p.playingPosition}</span>}
                        <span style={metaMuted}>Base {fmt(p.basePrice)}</span>
                      </>
                    }
                  />
                ))}
              </div>
              {/* Total spent bar */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(198,161,91,0.12)",
                  border: `1px solid ${ac.panelBorder}`,
                }}
              >
                <span style={{ ...kicker, color: ac.goldSoft }}>Total Spent</span>
                <span style={{ ...scoreNum, color: ac.pitch, fontWeight: 800, fontSize: 18 }}>{fmt(total)}</span>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── End Auction confirm ──────────────────── */}
      <Modal
        isOpen={endAuctionModal}
        onClose={() => setEndAuctionModal(false)}
        title="End Auction?"
        className="max-w-[440px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEndAuctionModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await run(() => endAuction(tid).unwrap(), "Auction ended!");
                setEndAuctionModal(false);
              }}
            >
              End Auction
            </Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          This will mark the auction as COMPLETED and notify all participants. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default LiveAuctionPage;
