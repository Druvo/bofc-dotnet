import React, { useState } from "react";
import {
  FireOutlined,
  TeamOutlined,
  SettingOutlined,
  UserAddOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  EnvironmentOutlined,
  SolutionOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetAuctionSessionQuery, useGetAuctionSettingsQuery, useGetAuctionDashboardQuery } from "../../state/features/auction/auctionSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import { AuctionPage, AuctionHeader, PanelCard, StatusPill, ac } from "./AuctionAtoms";
import Button from "../ui/button";
import Loader from "../ui/loader";
import { Dropdown, DropdownItem } from "../ui/dropdown";
import VenueLink from "../CommonAtoms/VenueLink";

const TournamentAuctionCard: React.FC<{ tournament: IoTournamentSingleSummaryType; isAdmin: boolean }> = ({
  tournament,
  isAdmin,
}) => {
  const navigate = useNavigate();
  // Poll the session so the hub reflects live state without a manual refresh.
  const { data: session } = useGetAuctionSessionQuery(tournament.id, { pollingInterval: 15000 });
  const { data: settings } = useGetAuctionSettingsQuery(tournament.id);
  const isLive = session?.status === "RUNNING" || session?.status === "PAUSED";
  // Only pull live counts while the auction is actually running.
  const { data: dashboard } = useGetAuctionDashboardQuery(tournament.id, {
    skip: !isLive,
    pollingInterval: isLive ? 10000 : 0,
  });

  const registrationClosed = session?.status === "COMPLETED";
  const notStarted = !session?.status || session.status === "NOT_STARTED";
  const scheduled = settings?.scheduledStartTime ? new Date(settings.scheduledStartTime) : null;
  const accent = session?.status === "RUNNING" ? ac.pitch : ac.gold;

  const adminMenuItems = [
    { key: "settings", icon: <SettingOutlined />, label: "Settings" },
    { key: "players", icon: <TeamOutlined />, label: "Player Pool" },
    { key: "team-budgets", icon: <TrophyOutlined />, label: "Team Budgets" },
    { key: "registrations", icon: <SolutionOutlined />, label: "Registrations" },
  ];

  return (
    <PanelCard accent={accent} bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Status row + admin menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={tournament.tournamentStatus || "UPCOMING"} />
          {session?.status === "RUNNING" ? (
            <span className="auction-live-chip">Live</span>
          ) : (
            session?.status && <StatusPill status={session.status} />
          )}
        </div>
        {isAdmin && (
          <Dropdown
            align="right"
            className="w-48"
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label="Manage auction"
                className="flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-gray-100 dark:hover:bg-white/5"
                style={{ color: ac.textMuted }}
              >
                <MoreOutlined />
              </button>
            )}
          >
            {(close) => (
              <>
                {adminMenuItems.map((item) => (
                  <DropdownItem
                    key={item.key}
                    onClick={() => {
                      close();
                      navigate(`/auction/${item.key}/${tournament.id}`);
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </DropdownItem>
                ))}
              </>
            )}
          </Dropdown>
        )}
      </div>

      {/* Name */}
      <div
        className="truncate text-[17px] font-semibold leading-tight"
        style={{ color: ac.textPrimary }}
        title={tournament.name}
      >
        {tournament.name}
      </div>

      {/* Venue */}
      <div className="flex items-center gap-2">
        {tournament.venueName ? (
          <VenueLink
            name={tournament.venueName}
            mapLink={tournament.venueMapLink}
            iconClassName="text-[13px]"
            style={{ color: ac.textMuted }}
            className="truncate text-[12.5px] hover:underline"
          />
        ) : (
          <>
            <EnvironmentOutlined style={{ color: ac.gold, fontSize: 13 }} />
            <span className="truncate text-[12.5px]" style={{ color: ac.textMuted }}>—</span>
          </>
        )}
      </div>

      {/* Scheduled start (before it begins) */}
      {notStarted && scheduled && (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined style={{ color: ac.gold, fontSize: 13 }} />
          <span className="text-[12.5px]" style={{ color: ac.textMuted }}>
            Starts {scheduled.toLocaleString()}
          </span>
        </div>
      )}

      {/* Live mini-stats */}
      {isLive && dashboard && (
        <div className="flex flex-wrap gap-3.5 text-xs">
          <span style={{ color: ac.textMuted }}>Round <span className="font-semibold" style={{ color: ac.gold }}>{session?.roundNumber ?? 1}</span></span>
          <span style={{ color: ac.textMuted }}>Sold <span className="font-semibold" style={{ color: ac.pitch }}>{dashboard.soldCount ?? 0}</span></span>
          <span style={{ color: ac.textMuted }}>Left <span className="font-semibold" style={{ color: ac.info }}>{dashboard.remainingCount ?? 0}</span></span>
        </div>
      )}

      {/* Primary actions */}
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          startIcon={<PlayCircleOutlined />}
          onClick={() => navigate(`/auction/live/${tournament.id}`)}
          className={isLive ? "!bg-[var(--pitch,#2f9e63)]" : undefined}
          style={isLive ? { background: ac.pitch, borderColor: ac.pitch } : undefined}
        >
          {isLive ? "Watch Live" : "Live Auction"}
        </Button>
        <span title={registrationClosed ? "Auction is completed. Registration is closed." : undefined}>
          <Button
            size="sm"
            variant="outline"
            startIcon={<UserAddOutlined />}
            onClick={() => navigate(`/auction/register/${tournament.id}`)}
            disabled={registrationClosed}
          >
            Register
          </Button>
        </span>
        <Button size="sm" variant="outline" startIcon={<TrophyOutlined />} onClick={() => navigate(`/auction/results/${tournament.id}`)}>
          Results
        </Button>
      </div>
    </PanelCard>
  );
};

const AuctionHubPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");
  const [guideOpen, setGuideOpen] = useState(false);

  const { data: tournamentsData, isLoading } = useGetTournamentsQuery({
    offSet: 0,
    pageSize: 50,
    sortedBy: "tournamentDate",
    sortDirection: "DESC",
  });

  const auctionTournaments =
    tournamentsData?.content?.tournaments?.filter((t: IoTournamentSingleSummaryType) => t.auctionMode) || [];

  const guideSteps = [
    { title: "Create Tournament", description: "Toggle 'Auction Mode' ON when creating" },
    { title: "Configure Settings", description: "Set team budget, timer, bid increment, squad size" },
    { title: "Open Registrations", description: "Share the registration link with players" },
    { title: "Approve & Build Pool", description: "Approve registrations → Add to player pool" },
    { title: "Set Team Budgets", description: "Assign teams, owners, and budgets" },
    { title: "Start Live Auction", description: "Go to Live Auction and click Start" },
  ];

  if (isLoading) return <Loader className="py-24" />;

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<FireOutlined />}
        title="Auction Hub"
        subtitle="Select a tournament to manage or participate in its player auction."
      />

      {/* Tournaments first — the primary content */}
      {auctionTournaments.length === 0 ? (
        <PanelCard>
          <div className="py-10 text-center text-theme-sm" style={{ color: ac.textMuted }}>
            <FireOutlined className="mb-2 block text-3xl" style={{ opacity: 0.4 }} />
            No auction-mode tournaments found. Create one from the Tournaments page with 'Auction Mode' enabled.
          </div>
        </PanelCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {auctionTournaments.map((tournament: IoTournamentSingleSummaryType) => (
            <TournamentAuctionCard key={tournament.id} tournament={tournament} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Admin quick guide — collapsed by default so it stays out of the way */}
      {isAdmin && (
        <div className="auction-guide-collapse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="inline-flex items-center gap-2 font-semibold" style={{ color: ac.textPrimary }}>
              <BulbOutlined style={{ color: ac.gold }} />
              Admin Quick Guide — how to run an auction
            </span>
            <DownOutlined
              style={{ color: ac.textMuted, transition: "transform 0.2s" }}
              className={guideOpen ? "rotate-180" : ""}
            />
          </button>
          {guideOpen && (
            <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
              <div className="flex flex-col gap-4">
                {guideSteps.map((step, i) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ color: ac.gold, border: `1px solid ${ac.panelBorder}` }}
                      >
                        {i + 1}
                      </div>
                      {i < guideSteps.length - 1 && (
                        <div className="mt-1 w-px flex-1" style={{ background: ac.panelBorder, minHeight: 16 }} />
                      )}
                    </div>
                    <div className="pb-1">
                      <div className="text-theme-sm font-semibold" style={{ color: ac.textPrimary }}>{step.title}</div>
                      <div className="text-theme-xs" style={{ color: ac.textMuted }}>{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AuctionPage>
  );
};

export default AuctionHubPage;
