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
  NodeIndexOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import ViewerHomeTab from "./ViewerHomeTab";
import ViewerAuctionTab from "./ViewerAuctionTab";
import ViewerFixturesTab from "./ViewerFixturesTab";
import ViewerResultsTab from "./ViewerResultsTab";
import ViewerTableTab from "./ViewerTableTab";
import ViewerPlayersTab from "./ViewerPlayersTab";
import ViewerRulesTab from "./ViewerRulesTab";
import ViewerTournamentFlowTab from "./ViewerTournamentFlowTab";
import ViewerLoginTab from "./ViewerLoginTab";
import StatsLeaderboardPanel from "../Tournaments/Statistics/StatsLeaderboardPanel";
import {
  useGetTournamentsQuery,
  useGetTournamentSummaryQuery,
} from "../../state/features/tournaments/tournamentsSlice";
import { showBdLocalTime, getEffectiveTournamentStatus } from "../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import styles from "./TournamentViewerPage.module.css";
import FormSelect from "../ui/form-select";
import useIsMobile from "../../hooks/useIsMobile";
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
    ["home", "fixtures", "roadmap", "results", "table", "stats", "players"].includes(tabKey) ||
    (tabKey === "rules" && hasRules) ||
    (tabKey === "auction" && hasAuction) ||
    (tabKey === "login" && !isLoggedIn)
  );
};

export default function TournamentViewerPage({
  hasHeader = true,
}: {
  hasHeader?: boolean;
}) {
  const isMobile = useIsMobile(768);
  const loginInfo = useSelector(selectLoginInfo);
  const isLoggedIn = Boolean(loginInfo.token);
  const navigate = useNavigate();
  const { tournamentId: tournamentIdParam, tab: tabParam } = useParams();

  // Tab/tournament selection lives in the URL (/tournament-viewer/:tournamentId/:tab)
  // instead of useState+localStorage — makes a specific result/table/fixture
  // view shareable and back-button-navigable. selectedId/activeTab below are
  // pure reads of the URL; the effects further down are what keep the URL
  // itself valid (defaulting to a tournament, correcting an unavailable tab).
  const selectedId = tournamentIdParam ? Number(tournamentIdParam) || null : null;

  const { data: tournamentsData, isLoading: tournamentsLoading } =
    useGetTournamentsQuery({
      offSet: 0,
      pageSize: 200,
      sortedBy: "tournamentDate",
      sortDirection: "DESC",
    });

  const tournaments = useMemo(() => {
    const list = tournamentsData?.content?.tournaments || [];
    return [...list].sort(
      (a, b) =>
        (statusOrder[getEffectiveTournamentStatus(a.tournamentStatus?.toUpperCase(), a.tournamentDate)] ?? 5) -
        (statusOrder[getEffectiveTournamentStatus(b.tournamentStatus?.toUpperCase(), b.tournamentDate)] ?? 5),
    );
  }, [tournamentsData]);

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedId) || null,
    [selectedId, tournaments],
  );

  const selectedTournamentDateTime = selectedTournament?.tournamentDate
    ? showBdLocalTime(selectedTournament.tournamentDate)
    : "Date/time not set";

  const selectedStatus = getEffectiveTournamentStatus(
    (selectedTournament?.tournamentStatus || "").toUpperCase(),
    selectedTournament?.tournamentDate,
  );

  const { data: summaryData } = useGetTournamentSummaryQuery(
    { tournamentId: selectedId ?? 0 },
    { skip: !selectedId },
  );
  const hasRules = Boolean(summaryData?.content?.[0]?.rules?.trim());
  const hasAuction = Boolean(selectedTournament?.auctionMode);

  // Missing tab segment (bare /tournament-viewer/:id) reads as "home" without
  // forcing a redirect — only an actually-invalid tab (e.g. "rules" on a
  // tournament with none, or a stale link to "auction" once it's over)
  // gets corrected below.
  const activeTab =
    tabParam && isValidViewerTab(tabParam, hasRules, isLoggedIn, hasAuction)
      ? tabParam
      : "home";

  // No tournament in the URL yet, or the URL points at one that no longer
  // exists — pick the default/first tournament and settle the URL onto it.
  useEffect(() => {
    if (tournaments.length === 0) return;

    const urlTournamentStillAvailable =
      selectedId != null && tournaments.some((t) => t.id === selectedId);
    if (urlTournamentStillAvailable) return;

    const defaultTournament = tournaments.find((t) => t.defaultTournament);
    const targetId = (defaultTournament ?? tournaments[0]).id;
    navigate(`/tournament-viewer/${targetId}${tabParam ? `/${tabParam}` : ""}`, { replace: true });
  }, [selectedId, tournaments, tabParam, navigate]);

  // The URL's tab segment is present but not valid for this tournament
  // (e.g. deep-linked to "rules" before rules data loaded, or a stale link
  // to a tab that no longer applies) — settle the URL onto "home" instead
  // of silently rendering a tab that doesn't match what's in the address bar.
  useEffect(() => {
    if (!selectedId || !tabParam) return;
    if (isValidViewerTab(tabParam, hasRules, isLoggedIn, hasAuction)) return;
    navigate(`/tournament-viewer/${selectedId}/home`, { replace: true });
  }, [selectedId, tabParam, hasRules, isLoggedIn, hasAuction, navigate]);

  const handleSelect = (id: number) => {
    // Keep whichever tab is currently active — if it isn't valid for the
    // newly-picked tournament, the correction effect above settles it once
    // that tournament's summary data loads (same async pattern as before,
    // now expressed as a URL redirect instead of a state update).
    navigate(`/tournament-viewer/${id}/${activeTab}`);
  };

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
        <ViewerHomeTab tournamentId={selectedId} />
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
              <ViewerRulesTab tournamentId={selectedId} />
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
            children: selectedId ? <ViewerAuctionTab tournamentId={selectedId} /> : null,
          },
        ]
      : []),
    {
      key: "fixtures",
      label: (
        <span>
          <CalendarOutlined style={{ marginRight: 6 }} />
          Fixtures
        </span>
      ),
      children: selectedId ? (
        <ViewerFixturesTab tournamentId={selectedId} />
      ) : null,
    },
    {
      key: "roadmap",
      label: (
        <span>
          <NodeIndexOutlined style={{ marginRight: 6 }} />
          Roadmap
        </span>
      ),
      children: selectedId ? (
        <ViewerTournamentFlowTab
          tournamentId={selectedId}
          isActive={activeTab === "roadmap"}
        />
      ) : null,
    },
    {
      key: "results",
      label: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 6 }} />
          Results
        </span>
      ),
      children: selectedId ? (
        <ViewerResultsTab tournamentId={selectedId} />
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
        <ViewerTableTab tournamentId={selectedId} />
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
          tournamentId={selectedId}
          isActive={activeTab === "stats"}
        />
      ) : null,
    },
    {
      key: "players",
      label: (
        <span>
          <TeamOutlined style={{ marginRight: 6 }} />
          Players
        </span>
      ),
      children: selectedId ? (
        <ViewerPlayersTab tournamentId={selectedId} />
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
              {selectedTournament && (
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
                          <span className={styles.tournamentName}>
                            {selectedTournament?.name || "Select Tournament"}
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

                        {selectedTournament && (
                          <div className={styles.infoMetaRow} style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                            <span className={styles.infoMetaText}>
                              <CalendarOutlined style={{ marginRight: 6 }} />
                              {selectedTournamentDateTime}
                            </span>
                            {selectedTournament.venueName ? (
                              <VenueLink
                                name={selectedTournament.venueName}
                                mapLink={selectedTournament.venueMapLink}
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

                    {/* Right: tournament switcher */}
                    <div className={styles.controlsRow}>
                      <FormSelect
                        className={`tournament-portal-select-custom ${styles.tournamentSelect}`}
                        disabled={tournamentsLoading}
                        value={selectedId ?? ""}
                        onChange={(e) => handleSelect(Number(e.target.value))}
                        style={{
                          width: isMobile ? "100%" : 260,
                          flex: isMobile ? 1 : "none",
                          minWidth: 0,
                        }}
                        options={tournaments.map((t) => ({
                          value: t.id,
                          label: `${t.name} (${getEffectiveTournamentStatus((t.tournamentStatus || "UNKNOWN").toUpperCase(), t.tournamentDate)})`,
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="tournament-viewer-tabs" style={{ marginTop: 6 }}>
                <div className="flex justify-center overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                  <nav className="flex gap-4">
                    {tabItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => selectedId && navigate(`/tournament-viewer/${selectedId}/${item.key}`)}
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
                <div style={{ marginTop: 16 }}>
                  {activeTabItem.children}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyStateWrap}>
            <TrophyOutlined className={styles.emptyIcon} />
            <span className={styles.emptyDescription}>
              Select a tournament from the dropdown to view fixtures,
              results, standings and stats
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
