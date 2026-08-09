import React, { useState } from "react";
import { TrophyOutlined, WarningOutlined, CrownOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useGetAuctionResultsQuery, useGetAuctionSessionQuery } from "../../state/features/auction/auctionSlice";
import { TeamSquadResponse, AuctionPlayerResponse } from "../../state/features/auction/auctionTypes";
import { AuctionPage, AuctionHeader, StatTile, StatusPill, SignedTile, PanelCard, metaMuted, ac } from "./AuctionAtoms";
import { useStatTones } from "../../hooks/useStatTones";
import Loader from "../ui/loader";
import Alert from "../ui/alert";
import { formatCurrency } from "../../utils/formatCurrency";

const taka = (v?: number) => formatCurrency(v ?? 0, { decimals: 0 });

const moneyChip = (label: string, color: string) => (
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

const TeamSquadCard: React.FC<{ squad: TeamSquadResponse }> = ({ squad }) => {
  const tones = useStatTones();
  const [open, setOpen] = useState(true);
  const players = squad.players ?? [];

  return (
    <PanelCard accent={ac.gold} bodyStyle={{ padding: 0 }}>
      {/* Header (click to toggle) */}
      <div
        onClick={() => setOpen((o) => !o)}
        className="flex flex-wrap cursor-pointer items-center justify-between gap-2.5 px-3.5 py-3"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {open ? <DownOutlined style={{ color: ac.textMuted, fontSize: 12 }} /> : <RightOutlined style={{ color: ac.textMuted, fontSize: 12 }} />}
          <span className="truncate font-semibold" style={{ color: ac.textPrimary, fontSize: 15 }}>{squad.teamName}</span>
          <span style={metaMuted}>· {squad.ownerName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {moneyChip(`Spent ${taka(squad.totalSpent)}`, tones.primary)}
          {moneyChip(`Left ${taka(squad.remainingBudget)}`, tones.success)}
          {moneyChip(`${players.length} players`, tones.info)}
        </div>
      </div>

      {/* Squad body */}
      {open && (
        <div className="px-3 pb-3">
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 12px" }} />
          {players.length === 0 ? (
            <span style={{ color: ac.textMuted }}>No players bought.</span>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {players.map((p: AuctionPlayerResponse, i: number) => (
                <SignedTile
                  key={p.id}
                  index={i + 1}
                  name={p.playerName}
                  photoUrl={p.photoUrl}
                  category={p.category}
                  price={p.finalPrice}
                  meta={
                    <>
                      {p.playerType && <span style={metaMuted}>{p.playerType}</span>}
                      <span style={metaMuted}>Base {taka(p.basePrice)}</span>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PanelCard>
  );
};

const AuctionResultsPage: React.FC = () => {
  const tones = useStatTones();
  const { matchDayId } = useParams<{ matchDayId: string }>();
  const tid = Number(matchDayId);
  const { data: results, isLoading } = useGetAuctionResultsQuery(tid);
  const { data: session } = useGetAuctionSessionQuery(tid);
  const isInProgress = session && session.status !== "COMPLETED" && session.status !== "NOT_STARTED";

  if (isLoading) return <Loader className="py-24" />;
  if (!results) return (
    <div className="mt-20 text-center text-theme-sm text-gray-400 dark:text-gray-500">No auction results available</div>
  );

  const stats = results.stats;
  const soldCount = (results.teamSquads ?? []).reduce((acc, s) => acc + (s.players?.length ?? 0), 0);
  const unsoldCount = results.unsoldPlayers?.length ?? 0;
  const totalPlayers = soldCount + unsoldCount;
  const totalSpent = (results.teamSquads ?? []).reduce((acc, s) => acc + (s.totalSpent ?? 0), 0);

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<TrophyOutlined />}
        title={`Auction Results — ${results.matchDayName}`}
        backTo="/auction"
        actions={session?.status ? <StatusPill status={session.status} /> : undefined}
      />

      {isInProgress && (
        <Alert variant="warning" title="Auction is still in progress">
          These are partial results. Final results will be available once the auction is completed.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Players" value={totalPlayers} accent={tones.info} />
        <StatTile label="Sold" value={soldCount} accent={tones.success} />
        <StatTile label="Unsold" value={unsoldCount} accent={tones.error} />
        <StatTile label="Total Spent" value={taka(totalSpent)} accent={tones.primary} />
        {stats?.mostExpensivePlayerName && (
          <div className="col-span-2 md:col-span-4">
            <StatTile
              label="Most Expensive Signing"
              accent={tones.primary}
              icon={<CrownOutlined />}
              value={
                <span>
                  {taka(stats.mostExpensivePrice)}{" "}
                  <span style={{ fontSize: 14, color: ac.textMuted, fontWeight: 500 }}>
                    · {stats.mostExpensivePlayerName}
                  </span>
                </span>
              }
            />
          </div>
        )}
      </div>

      {/* Team Squads */}
      <h4 className="mt-2 text-lg font-bold text-gray-800 dark:text-white/90">Team Squads</h4>
      <div className="flex flex-col gap-3">
        {(results.teamSquads ?? []).map((squad: TeamSquadResponse) => (
          <TeamSquadCard key={squad.teamId} squad={squad} />
        ))}
      </div>

      {/* Unsold Players */}
      {(results.unsoldPlayers ?? []).length > 0 && (
        <>
          <h4 className="mt-2 text-lg font-bold text-gray-800 dark:text-white/90">Unsold Players</h4>
          <PanelCard bodyStyle={{ padding: 12 }}>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {(results.unsoldPlayers ?? []).map((p: AuctionPlayerResponse, i: number) => (
                <SignedTile
                  key={p.id}
                  index={i + 1}
                  name={p.playerName}
                  photoUrl={p.photoUrl}
                  category={p.category}
                  price={p.basePrice}
                  priceLabel="Base"
                  priceColor={ac.textMuted}
                  meta={
                    <>
                      {p.playerType && <span style={metaMuted}>{p.playerType}</span>}
                      {p.playingPosition && <span style={metaMuted}>{p.playingPosition}</span>}
                    </>
                  }
                />
              ))}
            </div>
          </PanelCard>
        </>
      )}
    </AuctionPage>
  );
};

export default AuctionResultsPage;
