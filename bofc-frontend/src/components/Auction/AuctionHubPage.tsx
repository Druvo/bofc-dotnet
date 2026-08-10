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
import { useGetMatchDaysQuery } from "../../state/features/matchDays/matchDaysSlice";
import { useGetAuctionSessionQuery, useGetAuctionSettingsQuery, useGetAuctionDashboardQuery } from "../../state/features/auction/auctionSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { IoMatchDaySingleSummaryType } from "../../state/features/matchDays/matchDayTypes";
import { AuctionPage, AuctionHeader, PanelCard, StatusPill, ac } from "./AuctionAtoms";
import Button from "../ui/button";
import Loader from "../ui/loader";
import { Dropdown, DropdownItem } from "../ui/dropdown";
import VenueLink from "../CommonAtoms/VenueLink";

const MatchDayAuctionCard: React.FC<{ matchDay: IoMatchDaySingleSummaryType; isAdmin: boolean }> = ({
  matchDay,
  isAdmin,
}) => {
  const navigate = useNavigate();
  // Poll the session so the hub reflects live state without a manual refresh.
  const { data: session } = useGetAuctionSessionQuery(matchDay.id, { pollingInterval: 15000 });
  const { data: settings } = useGetAuctionSettingsQuery(matchDay.id);
  const isLive = session?.status === "RUNNING" || session?.status === "PAUSED";
  // Only pull live counts while the auction is actually running.
  const { data: dashboard } = useGetAuctionDashboardQuery(matchDay.id, {
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
          <StatusPill status={matchDay.matchDayStatus || "UPCOMING"} />
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
                      navigate(`/auction/${item.key}/${matchDay.id}`);
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
        title={matchDay.name}
      >
        {matchDay.name}
      </div>

      {/* Venue */}
      <div className="flex items-center gap-2">
        {matchDay.venueName ? (
          <VenueLink
            name={matchDay.venueName}
            mapLink={matchDay.venueMapLink}
            iconClassName="text-[13px]"
            style={{ color: ac.textMuted }}
            className="truncate text-[12.5px] hover:underline"
          />
        ) : (
          <>
            <EnvironmentOutlined style={{ color: ac.gold, fontSize: 13 }} />
            <span className="truncate text-[12.5px]" style={{ color: ac.textMuted }}>-</span>
          </>
        )}
      </div>

      {/* Scheduled start (before it begins) */}
      {notStarted && scheduled && (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined style={{ color: ac.gold, fontSize: 13 }} />
          <span className="text-[12.5px]" style={{ color: ac.textMuted }}>
            Starts {scheduled.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
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
          onClick={() => navigate(`/auction/live/${matchDay.id}`)}
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
            onClick={() => navigate(`/auction/register/${matchDay.id}`)}
            disabled={registrationClosed}
          >
            Register
          </Button>
        </span>
        <Button size="sm" variant="outline" startIcon={<TrophyOutlined />} onClick={() => navigate(`/auction/results/${matchDay.id}`)}>
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

  const { data: matchDaysData, isLoading } = useGetMatchDaysQuery({
    offSet: 0,
    pageSize: 50,
    sortedBy: "matchDayDate",
    sortDirection: "DESC",
  });

  const auctionMatchDays =
    matchDaysData?.content?.matchDays?.filter((t: IoMatchDaySingleSummaryType) => t.auctionMode) || [];

  const guideSteps = [
    { title: "Create MatchDay", description: "Toggle 'Auction Mode' ON when creating" },
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
        subtitle="Select a MatchDay to manage or participate in its player auction."
      />

      {/* MatchDays first - the primary content */}
      {auctionMatchDays.length === 0 ? (
        <PanelCard>
          <div className="py-10 text-center text-theme-sm" style={{ color: ac.textMuted }}>
            <FireOutlined className="mb-2 block text-3xl" style={{ opacity: 0.4 }} />
            No auction-mode MatchDays found. Create one from the MatchDays page with 'Auction Mode' enabled.
          </div>
        </PanelCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {auctionMatchDays.map((matchDay: IoMatchDaySingleSummaryType) => (
            <MatchDayAuctionCard key={matchDay.id} matchDay={matchDay} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Admin quick guide - collapsed by default so it stays out of the way */}
      {isAdmin && (
        <div className="auction-guide-collapse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="inline-flex items-center gap-2 font-semibold" style={{ color: ac.textPrimary }}>
              <BulbOutlined style={{ color: ac.gold }} />
              Admin Quick Guide - how to run an auction
            </span>
            <DownOutlined
              style={{ color: ac.textMuted, transition: "transform 0.2s" }}
              className={guideOpen ? "rotate-180" : ""}
            />
          </button>
          {guideOpen && (
            <div className="border-t border-gray-200 px-4 py-4 dark:border-[var(--color-rule)]">
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
