import React, { useMemo, useState } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import moment from "moment";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetMatchDaySummaryQuery } from "../../state/features/matchDays/matchDaysSlice";
import { useGetMatchDayStructureQuery } from "../../state/features/manualFixtures/manualFixturesSlice";
import type { RoundGroupResponse } from "../../state/features/manualFixtures/manualFixtureTypes";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import MatchCardShell, { matchStatusTag } from "../CommonAtoms/MatchCard";
import VenueLink from "../CommonAtoms/VenueLink";
import styles from "./ViewerFixturesTab.module.css";
import Loader from "../ui/loader";
import useIsMobile from "../../hooks/useIsMobile";

interface ViewerFixturesTabProps {
  matchDayId: number;
}

const buildGroupLabel = (fixture: IFixture, roundNameMap?: Map<number, string>) => {
  if (fixture.groupName) return fixture.groupName;
  if (fixture.round != null) return roundNameMap?.get(fixture.round) || `Round ${fixture.round}`;
  return "To Be Announced";
};

const flattenGroups = (groups: RoundGroupResponse[] = []): RoundGroupResponse[] => {
  const result: RoundGroupResponse[] = [];
  const walk = (items: RoundGroupResponse[]) => {
    items.forEach((group) => {
      result.push(group);
      if (group.childGroups && group.childGroups.length > 0) {
        walk(group.childGroups);
      }
    });
  };
  walk(groups);
  return result;
};

const getLeafGroups = (groups: RoundGroupResponse[] = []): RoundGroupResponse[] =>
  flattenGroups(groups).filter((group) => !group.childGroups || group.childGroups.length === 0);

const buildStageLabel = (label: string) => label.toUpperCase();

const formatMatchDate = (matchDate?: string) => {
  if (!matchDate) return "TO BE ANNOUNCED";

  return moment.utc(matchDate).local().format("DD MMM YYYY, HH:mm");
};

const normalizeFilterLabel = (label: string) => label.toUpperCase();

function MatchCard({ fixture, matchDaySummary, isMobile, roundNameMap }: { fixture: IFixture; matchDaySummary?: any; isMobile: boolean; roundNameMap: Map<number, string> }) {
  const groupLabel = buildGroupLabel(fixture, roundNameMap);
  const isAnnounced = Boolean(fixture.matchDate);
  const homeTeamLogoUrl = getTeamLogoUrlFromSummary(matchDaySummary, fixture.homeTeamId);
  const awayTeamLogoUrl = getTeamLogoUrlFromSummary(matchDaySummary, fixture.awayTeamId);

  return (
    <MatchCardShell status={fixture.matchStatus} isMobile={isMobile}>
      <div className={styles.cardTopRow}>
        <span className={styles.stageTag}>
          {buildStageLabel(groupLabel)}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {matchStatusTag(fixture.matchStatus)}
          <span className={styles.cardTopMeta}>
            {isAnnounced ? "MATCH SCHEDULED" : "TO BE ANNOUNCED"}
          </span>
        </div>
      </div>

      <div className={styles.teamsGrid}>
        <div className={`${styles.teamBlock} ${styles.teamHome}`}>
          <span className={styles.teamName} style={{ fontWeight: 700 }}>
            {fixture.homeTeamName || "TBA"}
          </span>
          <div className={styles.teamLogo} style={{ width: isMobile ? 32 : 58, height: isMobile ? 32 : 58, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {homeTeamLogoUrl ? <img src={homeTeamLogoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getTeamInitials(fixture.homeTeamName)}
          </div>
        </div>

        <div className={styles.vsWrap}>
          <span className={styles.vsBadge}>VS</span>
        </div>

        <div className={`${styles.teamBlock} ${styles.teamAway}`}>
          <div className={styles.teamLogo} style={{ width: isMobile ? 32 : 58, height: isMobile ? 32 : 58, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {awayTeamLogoUrl ? <img src={awayTeamLogoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getTeamInitials(fixture.awayTeamName)}
          </div>
          <span className={styles.teamName} style={{ fontWeight: 700 }}>
            {fixture.awayTeamName || "TBA"}
          </span>
        </div>
      </div>

      <div className={styles.cardMetaRow}>
        <span className={styles.metaItem}>
          <CalendarOutlined />
          {formatMatchDate(fixture.matchDate)}
        </span>
        {fixture.venueName && (
          <VenueLink
            name={fixture.venueName}
            mapLink={fixture.venueMapLink}
            className={`${styles.metaItem} hover:underline`}
          />
        )}
      </div>
    </MatchCardShell>
  );
}

export default function ViewerFixturesTab({ matchDayId }: ViewerFixturesTabProps) {
  const isMobile = useIsMobile();
  const { data, isLoading, isFetching } = useGetFixturesQuery({ matchDayId });
  const { data: matchDaySummary } = useGetMatchDaySummaryQuery({ matchDayId });
  const { data: structureData } = useGetMatchDayStructureQuery({ matchDayId });
  const [activeFilter, setActiveFilter] = useState("ALL");

  const roundNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (structureData?.content?.rounds || []).forEach((round) => {
      map.set(round.roundNumber, round.roundName);
    });
    return map;
  }, [structureData]);

  const orderMap = useMemo(() => {
    const map = new Map<string, number>();
    const rounds = [...(structureData?.content?.rounds || [])].sort(
      (a, b) => (a.sequenceOrder ?? a.roundNumber) - (b.sequenceOrder ?? b.roundNumber)
    );
    let index = 0;
    rounds.forEach((round) => {
      const leafGroups = getLeafGroups(round.groups || []);
      if (leafGroups.length > 0) {
        leafGroups.forEach((group) => {
          const key = group.groupName.toUpperCase();
          if (!map.has(key)) map.set(key, index++);
        });
      } else {
        const key = (round.roundName || "").toUpperCase();
        if (!map.has(key)) map.set(key, index++);
      }
    });
    return map;
  }, [structureData]);

  const getOrderIndex = (label: string) => {
    const index = orderMap.get(label.toUpperCase());
    return index === undefined ? Number.MAX_SAFE_INTEGER : index;
  };

  const fixtures = useMemo(
    () => [...(data?.content || [])].sort((left, right) =>
      (left.matchDate ?? "").localeCompare(right.matchDate ?? "")
    ),
    [data]
  );

  const filters = useMemo(() => {
    const labels = Array.from(new Set(fixtures.map((fixture) => buildGroupLabel(fixture, roundNameMap))));
    labels.sort((a, b) => getOrderIndex(a) - getOrderIndex(b));
    return ["ALL", ...labels];
  }, [fixtures, roundNameMap, orderMap]);

  const groups = useMemo(() => {
    const visibleFixtures = activeFilter === "ALL"
      ? fixtures
      : fixtures.filter((fixture) => buildGroupLabel(fixture, roundNameMap) === activeFilter);

    const map = new Map<string, IFixture[]>();
    for (const fixture of visibleFixtures) {
      const key = buildGroupLabel(fixture, roundNameMap);
      const list = map.get(key) || [];
      list.push(fixture);
      map.set(key, list);
    }

    return Array.from(map.entries()).sort(([a], [b]) => getOrderIndex(a) - getOrderIndex(b));
  }, [activeFilter, fixtures, roundNameMap, orderMap]);

  if (isLoading || isFetching) {
    return (
      <div className={styles.loadingWrap}>
        <Loader />
      </div>
    );
  }

  if (groups.length === 0) {
    return <div className={styles.emptyWrap}><div className="text-center text-theme-sm text-gray-400 dark:text-gray-500">No fixtures available</div></div>;
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.contentWrap}>
        <div className={styles.filterBar}>
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterButton} ${isActive ? styles.filterButtonActive : ""}`}
              >
                {normalizeFilterLabel(filter)}
              </button>
            );
          })}
        </div>

        {activeFilter === "ALL" ? (
          <section className={styles.groupSection}>
            {fixtures.map((f) => (
              <MatchCard key={f.id} fixture={f} matchDaySummary={matchDaySummary} isMobile={isMobile} roundNameMap={roundNameMap} />
            ))}
          </section>
        ) : (
          groups.map(([groupName, fixtures]) => (
            <section key={groupName} className={styles.groupSection}>
              <div className={styles.groupHeader}>
                <div className={styles.groupTitleWrap}>
                  <h4 className={styles.groupTitle}>
                    {groupName}
                  </h4>
                  {!isMobile && <div className={styles.groupDivider} />}
                </div>
                <span className={styles.groupCountTag}>
                  {fixtures.length} MATCH{fixtures.length !== 1 ? "ES" : ""}
                </span>
              </div>
              {fixtures.map((f) => (
                <MatchCard key={f.id} fixture={f} matchDaySummary={matchDaySummary} isMobile={isMobile} roundNameMap={roundNameMap} />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
