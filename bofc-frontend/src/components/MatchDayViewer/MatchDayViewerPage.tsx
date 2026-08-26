import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  HomeOutlined,
  LoginOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import ViewerHomeTab from "./ViewerHomeTab";
import ViewerAuctionTab from "./ViewerAuctionTab";
import ViewerFixturesResultsTab from "./ViewerFixturesResultsTab";
import ViewerTableTab from "./ViewerTableTab";
import ViewerRulesTab from "./ViewerRulesTab";
import ViewerLoginTab from "./ViewerLoginTab";
import StatsLeaderboardPanel from "../MatchDays/Statistics/StatsLeaderboardPanel";
import SquadLineupTab from "../MatchDays/SquadLineup/SquadLineupTab";
import {
  useGetMatchDaysQuery,
  useGetMatchDaySummaryQuery,
  useGetNextActiveMatchDayQuery,
} from "../../state/features/matchDays/matchDaysSlice";
import { showBdLocalTimeRange, getEffectiveMatchDayStatus } from "../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import styles from "./MatchDayViewerPage.module.css";
import VenueLink from "../CommonAtoms/VenueLink";

const VIEWER_CONTENT_MAX_WIDTH = 1180;

const statusOrder: Record<string, number> = {
  ONGOING: 0,
  ACTIVE: 1,
  UPCOMING: 2,
  CONCLUDED: 3,
  INACTIVE: 4,
};

const statusPillClass: Record<string, string> = {
  ONGOING: styles.statusOngoing,
  ACTIVE: styles.statusOngoing,
  UPCOMING: styles.statusUpcoming,
  CONCLUDED: styles.statusConcluded,
  INACTIVE: styles.statusInactive,
};

const isValidViewerTab = (
  tabKey: string | null,
  hasRules: boolean,
  isLoggedIn: boolean,
  hasAuction: boolean = false,
) => {
  if (!tabKey) return false;

  return (
    ["home", "results", "table", "stats", "squad-lineup"].includes(tabKey) ||
    (tabKey === "rules" && hasRules) ||
    (tabKey === "auction" && hasAuction) ||
    (tabKey === "login" && !isLoggedIn)
  );
};

export default function MatchDayViewerPage({
  hasHeader = true,
}: {
  hasHeader?: boolean;
}) {
  const loginInfo = useSelector(selectLoginInfo);
  const isLoggedIn = Boolean(loginInfo.token);
  const navigate = useNavigate();
  const { matchDayId: matchDayIdParam, tab: tabParam } = useParams();

  // Tab/matchDay selection lives in the URL (/match-day-viewer/:matchDayId/:tab)
  // instead of useState+localStorage - makes a specific result/table/fixture
  // view shareable and back-button-navigable. selectedId/activeTab below are
  // pure reads of the URL; the effects further down are what keep the URL
  // itself valid (defaulting to a matchDay, correcting an unavailable tab).
  const selectedId = matchDayIdParam ? Number(matchDayIdParam) || null : null;

  const { data: matchDaysData } =
    useGetMatchDaysQuery({
      offSet: 0,
      pageSize: 200,
      sortedBy: "matchDayDate",
      sortDirection: "DESC",
    });

  const { data: nextActiveData, isFetching: nextActiveLoading } = useGetNextActiveMatchDayQuery(undefined, {
    skip: selectedId != null,
  });

  const matchDays = useMemo(() => {
    const list = matchDaysData?.content?.matchDays || [];
    return [...list].sort(
      (a, b) =>
        (statusOrder[getEffectiveMatchDayStatus(a.matchDayStatus?.toUpperCase(), a.matchDayDate, a.durationMinutes)] ?? 5) -
        (statusOrder[getEffectiveMatchDayStatus(b.matchDayStatus?.toUpperCase(), b.matchDayDate, b.durationMinutes)] ?? 5),
    );
  }, [matchDaysData]);

  const selectedMatchDay = useMemo(
    () => matchDays.find((t) => t.id === selectedId) || null,
    [selectedId, matchDays],
  );

  const selectedMatchDayDateTime = selectedMatchDay?.matchDayDate
    ? showBdLocalTimeRange(selectedMatchDay.matchDayDate, selectedMatchDay.durationMinutes)
    : "Date/time not set";

  const selectedStatus = getEffectiveMatchDayStatus(
    (selectedMatchDay?.matchDayStatus || "").toUpperCase(),
    selectedMatchDay?.matchDayDate,
    selectedMatchDay?.durationMinutes,
  );

  const { data: summaryData } = useGetMatchDaySummaryQuery(
    { matchDayId: selectedId ?? 0 },
    { skip: !selectedId },
  );
  const hasRules = Boolean(summaryData?.content?.[0]?.rules?.trim());
  const hasAuction = Boolean(selectedMatchDay?.auctionMode);

  // Missing tab segment (bare /match-day-viewer/:id) reads as "home" without
  // forcing a redirect - only an actually-invalid tab (e.g. "rules" on a
  // matchDay with none, or a stale link to "auction" once it's over)
  // gets corrected below.
  const activeTab =
    tabParam && isValidViewerTab(tabParam, hasRules, isLoggedIn, hasAuction)
      ? tabParam
      : "home";

  // No matchDay in the URL yet, or the URL points at one that no longer
  // exists - pick the next non-concluded match (same "ONGOING-not-stale,
  // else soonest UPCOMING" pick as the Dashboard's Next Match card), falling
  // back to the most recent match overall if nothing qualifies (e.g. every
  // match has already concluded), and settle the URL onto it. The viewer's
  // own dropdown lets the user switch to any other match afterward.
  useEffect(() => {
    if (matchDays.length === 0) return;
    if (selectedId != null && matchDays.some((t) => t.id === selectedId)) return;
    if (nextActiveLoading) return;

    const targetId = nextActiveData?.content?.id ?? matchDays[0].id;
    navigate(`/match-day-viewer/${targetId}${tabParam ? `/${tabParam}` : ""}`, { replace: true });
  }, [selectedId, matchDays, tabParam, navigate, nextActiveData, nextActiveLoading]);

  // The URL's tab segment is present but not valid for this matchDay
  // (e.g. deep-linked to "rules" before rules data loaded, or a stale link
  // to a tab that no longer applies) - settle the URL onto "home" instead
  // of silently rendering a tab that doesn't match what's in the address bar.
  useEffect(() => {
    if (!selectedId || !tabParam) return;
    if (isValidViewerTab(tabParam, hasRules, isLoggedIn, hasAuction)) return;
    navigate(`/match-day-viewer/${selectedId}/home`, { replace: true });
  }, [selectedId, tabParam, hasRules, isLoggedIn, hasAuction, navigate]);

  const tabItems = [
    {
      key: "home",
      label: (
        <span>
          <HomeOutlined style={{ marginRight: 6 }} />
          Home
        </span>
      ),
      children: selectedId ? (
        <ViewerHomeTab matchDayId={selectedId} />
      ) : null,
    },
    {
      key: "squad-lineup",
      label: (
        <span>
          <TeamOutlined style={{ marginRight: 6 }} />
          Squad &amp; Lineup
        </span>
      ),
      children: selectedId ? (
        <SquadLineupTab teams={summaryData?.content?.[0]?.teams || []} />
      ) : null,
    },
    ...(hasRules
      ? [
          {
            key: "rules",
            label: (
              <span>
                <BookOutlined style={{ marginRight: 6 }} />
                Rules
              </span>
            ),
            children: selectedId ? (
              <ViewerRulesTab matchDayId={selectedId} />
            ) : null,
          },
        ]
      : []),
    ...(hasAuction
      ? [
          {
            key: "auction",
            label: (
              <span>
                <FireOutlined style={{ marginRight: 6 }} />
                Auction
              </span>
            ),
            children: selectedId ? <ViewerAuctionTab matchDayId={selectedId} /> : null,
          },
        ]
      : []),
    {
      key: "results",
      label: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 6 }} />
          Results
        </span>
      ),
      children: selectedId ? (
        <ViewerFixturesResultsTab matchDayId={selectedId} />
      ) : null,
    },
    {
      key: "table",
      label: (
        <span>
          <UnorderedListOutlined style={{ marginRight: 6 }} />
          Table
        </span>
      ),
      children: selectedId ? (
        <ViewerTableTab matchDayId={selectedId} />
      ) : null,
    },
    {
      key: "stats",
      label: (
        <span>
          <BarChartOutlined style={{ marginRight: 6 }} />
          Stats
        </span>
      ),
      children: selectedId ? (
        <StatsLeaderboardPanel
          matchDayId={selectedId}
          isActive={activeTab === "stats"}
        />
      ) : null,
    },
    ...(!isLoggedIn
      ? [
          {
            key: "login",
            label: (
              <span>
                <LoginOutlined style={{ marginRight: 6 }} />
                Login
              </span>
            ),
            children: <ViewerLoginTab />,
          },
        ]
      : []),
  ];

  const activeTabItem = tabItems.find((t) => t.key === activeTab) ?? tabItems[0];

  return (
    <div
      className={styles.viewerLayout}
      style={{
        minHeight: hasHeader ? "calc(100vh - 64px)" : "100vh",
      }}
    >
      {/* Content */}
      <div className={styles.viewerContent}>
        {selectedId ? (
          <div className={styles.tabsOuter}>
            <div
              className={styles.tabsInner}
              style={{ maxWidth: VIEWER_CONTENT_MAX_WIDTH }}
            >
              {selectedMatchDay && (
                <div className={styles.commandBar}>
                  <div className={styles.commandBarTop}>
                    {/* Left: real stat-led figure (team count) + identity */}
                    <div className={styles.identity}>
                      <div className={styles.statFigure}>
                        <span className={styles.statFigureNum}>
                          {summaryData?.content?.[0]?.teams?.length ?? 0}
                        </span>
                        <span className={styles.statFigureLabel}>Teams</span>
                      </div>
                      <div className={styles.identityText}>
                        <div className={styles.titleLine}>
                          <span className={styles.matchDayName}>
                            {selectedMatchDay?.name || "Select Match Day"}
                          </span>
                          {selectedStatus && (
                            <span
                              className={`${styles.statusPill} ${
                                statusPillClass[selectedStatus] ??
                                styles.statusInactive
                              }`}
                            >
                              {selectedStatus}
                            </span>
                          )}
                        </div>

                        {selectedMatchDay && (
                          <div className={styles.infoMetaRow} style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                            <span className={styles.infoMetaText}>
                              <CalendarOutlined style={{ marginRight: 6 }} />
                              {selectedMatchDayDateTime}
                            </span>
                            {selectedMatchDay.venueName ? (
                              <VenueLink
                                name={selectedMatchDay.venueName}
                                mapLink={selectedMatchDay.venueMapLink}
                                className={`${styles.infoMetaText} hover:underline`}
                                iconClassName="mr-1.5"
                              />
                            ) : (
                              <span className={styles.infoMetaText}>
                                <EnvironmentOutlined style={{ marginRight: 6 }} />
                                Venue not set
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div
                className="match-day-viewer-tabs rounded-2xl p-4 md:p-5"
                style={{ marginTop: 6 }}
              >
                <div className="mb-4 flex justify-center overflow-x-auto border-b border-gray-200 dark:border-[var(--color-rule)]">
                  <nav className="flex gap-4">
                    {tabItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => selectedId && navigate(`/match-day-viewer/${selectedId}/${item.key}`)}
                        className={`shrink-0 whitespace-nowrap border-b-2 px-1 py-2.5 text-sm font-medium ${
                          activeTab === item.key
                            ? "border-brand-500 text-brand-500"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>
                {activeTabItem.children}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyStateWrap}>
            <TrophyOutlined className={styles.emptyIcon} />
            <span className={styles.emptyDescription}>
              Select a Match Day from the dropdown to view fixtures,
              results, standings and stats
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
