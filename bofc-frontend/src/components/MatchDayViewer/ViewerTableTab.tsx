import { useMemo } from "react";
import { UnorderedListOutlined } from "@ant-design/icons";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetMatchDayStandingsQuery } from "../../state/features/statistics/statisticsSlice";
import { useGetMatchDaySummaryQuery } from "../../state/features/matchDays/matchDaysSlice";
import { useGetMatchDayStructureQuery } from "../../state/features/manualFixtures/manualFixturesSlice";
import type {
  RoundGroupResponse,
  GroupStandingResponse,
} from "../../state/features/manualFixtures/manualFixtureTypes";
import type { IMatchDayStanding } from "../../state/features/statistics/statisticsTypes";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import { rankColor } from "../CommonAtoms/StandingsRow";
import styles from "./ViewerTableTab.module.css";
import Loader from "../ui/loader";
import useIsMobile from "../../hooks/useIsMobile";

const getLeafGroups = (groups: RoundGroupResponse[] = []): RoundGroupResponse[] => {
  const result: RoundGroupResponse[] = [];
  const walk = (items: RoundGroupResponse[]) => {
    items.forEach((g) => {
      if (!g.childGroups || g.childGroups.length === 0) result.push(g);
      else walk(g.childGroups);
    });
  };
  walk(groups);
  return result;
};

interface ViewerTableTabProps {
  matchDayId: number;
}

const leftGridColumns = (isMobile: boolean) =>
  isMobile ? "20px minmax(150px, 1fr)" : "64px minmax(200px, 2.3fr)";

const rightGridColumns = "repeat(10, minmax(52px, 0.7fr))";

const mobileStatsGridColumns = "repeat(10, minmax(38px, 1fr))";

const statHeaderLabels = ["P", "W", "D", "L", "GD", "GF", "GA", "Y", "R", "PTS"];

const CardCell = ({ count, color }: { count?: number; color: string }) => (
  <span
    className={styles.statCell}
    style={count ? { color, fontWeight: 600 } : undefined}
  >
    {count ?? 0}
  </span>
);

function RankAvatar({ rank, size, fontSize }: { rank: number; size: number; fontSize: number }) {
  return (
    <div
      className={`${styles.rankAvatar} flex items-center justify-center rounded-full text-white`}
      style={{ width: size, height: size, backgroundColor: rankColor(rank), fontSize }}
    >
      {rank}
    </div>
  );
}

function TeamLogoAvatar({ src, initials, size }: { src?: string; initials: string; size: number }) {
  return (
    <div
      className={`${styles.teamLogo} flex shrink-0 items-center justify-center overflow-hidden rounded-full`}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

export default function ViewerTableTab({ matchDayId }: ViewerTableTabProps) {
  const { data, isLoading } = useGetMatchDayStandingsQuery({ matchDayId });
  const { data: fixturesResponse, isLoading: fixturesLoading } =
    useGetFixturesQuery({ matchDayId });
  const { data: matchDaySummary } = useGetMatchDaySummaryQuery({
    matchDayId,
  });
  const { data: structureData } = useGetMatchDayStructureQuery({ matchDayId });
  const isMobile = useIsMobile(768);

  const standings = data?.content || [];
  const fixtures = fixturesResponse?.content || [];
  const leftGridCols = leftGridColumns(isMobile);
  const rightGridCols = isMobile ? mobileStatsGridColumns : rightGridColumns;

  const roundNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (structureData?.content?.rounds || []).forEach((round) => {
      if (round.roundName) map.set(round.roundNumber, round.roundName);
    });
    return map;
  }, [structureData]);

  // Build order map from matchDay structure (same logic as ViewerFixturesTab)
  // then reverse it so the latest stage comes first
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
    // Reverse: highest original index → lowest sort value (latest stage first)
    const maxIndex = index - 1;
    const reversed = new Map<string, number>();
    map.forEach((val, key) => reversed.set(key, maxIndex - val));
    return reversed;
  }, [structureData]);

  const getSectionOrder = (title: string) => {
    const idx = orderMap.get(title.toUpperCase());
    return idx === undefined ? Number.MAX_SAFE_INTEGER : idx;
  };

  // Authoritative group standings from the backend, keyed by group name.
  // These already encode the full ranking sequence (points -> GD -> GF ->
  // head-to-head -> fair play -> penalty tiebreak) and the disciplinary cards.
  const groupStandingsByName = useMemo(() => {
    const map = new Map<string, GroupStandingResponse[]>();
    (structureData?.content?.rounds || []).forEach((round) => {
      getLeafGroups(round.groups || []).forEach((group) => {
        if (group.standings && group.standings.length > 0) {
          map.set(group.groupName.toUpperCase(), group.standings);
        }
      });
    });
    return map;
  }, [structureData]);

  const sectionedRows = useMemo(() => {
    const rows = standings.map((team, index) => ({
      ...team,
      rank: index + 1,
      key: String(team.teamId),
    }));

    if (!fixtures.length) {
      return [
        {
          key: "all",
          title: "Match Day Standings",
          meta: "Overall Table",
          rows,
        },
      ];
    }

    const displaySectionTitle = (fixture: IFixture) => {
      if (fixture.groupName) return fixture.groupName;
      if (fixture.round != null) {
        return roundNameMap.get(fixture.round) ?? `Round ${fixture.round}`;
      }
      return "Match Day Stage";
    };

    const displayMeta = (fixture: IFixture) => {
      const left =
        fixture.round != null ? `Round ${fixture.round}` : "Round TBD";
      const right = fixture.groupName
        ? fixture.groupName.toUpperCase()
        : "DIRECT KNOCKOUT";
      return `${left} • ${right}`;
    };

    const sectionsMap = new Map<
      string,
      { title: string; meta: string; groupName: string | null; fixtures: IFixture[] }
    >();

    fixtures.forEach((fixture) => {
      const key = fixture.groupName
        ? `group-${fixture.groupName}`
        : fixture.round != null
          ? `round-${fixture.round}`
          : "stage-default";

      if (!sectionsMap.has(key)) {
        sectionsMap.set(key, {
          title: displaySectionTitle(fixture),
          meta: displayMeta(fixture),
          groupName: fixture.groupName,
          fixtures: [],
        });
      }

      sectionsMap.get(key)!.fixtures.push(fixture);
    });

    const teamNameMap = new Map<number, string>();
    standings.forEach((team) => teamNameMap.set(team.teamId, team.teamName));

    const sections = Array.from(sectionsMap.entries())
      .map(([key, section]) => {
        // Prefer the authoritative backend group standings when available, so the
        // public table always matches the official ranking (fair play + penalty
        // tiebreak included) instead of recomputing locally from fixtures.
        const backendStandings = section.groupName
          ? groupStandingsByName.get(section.groupName.toUpperCase())
          : undefined;

        if (backendStandings && backendStandings.length > 0) {
          // Live card totals from this section's fixtures, so disciplinary
          // counts show immediately without waiting for a standings recalc.
          // (The order still comes from the authoritative backend position.)
          const liveCards = new Map<number, { yellow: number; red: number }>();
          section.fixtures.forEach((fixture) => {
            const home = liveCards.get(fixture.homeTeamId) ?? { yellow: 0, red: 0 };
            home.yellow += fixture.homeYellowCards ?? 0;
            home.red += fixture.homeRedCards ?? 0;
            liveCards.set(fixture.homeTeamId, home);

            const away = liveCards.get(fixture.awayTeamId) ?? { yellow: 0, red: 0 };
            away.yellow += fixture.awayYellowCards ?? 0;
            away.red += fixture.awayRedCards ?? 0;
            liveCards.set(fixture.awayTeamId, away);
          });

          const rows = [...backendStandings]
            .sort(
              (a, b) =>
                (a.position ?? Number.MAX_SAFE_INTEGER) -
                (b.position ?? Number.MAX_SAFE_INTEGER),
            )
            .map((s, index) => ({
              teamId: s.teamId,
              teamName: s.teamName,
              points: s.points,
              goalsFor: s.goalsFor,
              goalsAgainst: s.goalsAgainst,
              matches: s.matchesPlayed,
              wins: s.wins,
              draws: s.draws,
              losses: s.losses,
              goalDifference: s.goalDifference,
              yellowCards: liveCards.get(s.teamId)?.yellow ?? s.yellowCards,
              redCards: liveCards.get(s.teamId)?.red ?? s.redCards,
              rank: s.position ?? index + 1,
              key: `${key}-${s.teamId}`,
            }));

          return { key, title: section.title, meta: section.meta, rows };
        }

        const statsByTeam = new Map<number, IMatchDayStanding>();

        const ensureTeam = (teamId: number, teamName: string) => {
          let team = statsByTeam.get(teamId);
          if (!team) {
            team = {
              teamId,
              teamName: teamNameMap.get(teamId) || teamName,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              matches: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalDifference: 0,
              yellowCards: 0,
              redCards: 0,
            };
            statsByTeam.set(teamId, team);
          }
          return team;
        };

        section.fixtures.forEach((fixture) => {
          const home = ensureTeam(fixture.homeTeamId, fixture.homeTeamName);
          const away = ensureTeam(fixture.awayTeamId, fixture.awayTeamName);

          if (fixture.matchStatus !== "COMPLETED") return;

          const homeScore = fixture.homeTeamScore ?? 0;
          const awayScore = fixture.awayTeamScore ?? 0;

          home.matches += 1;
          away.matches += 1;
          home.goalsFor += homeScore;
          home.goalsAgainst += awayScore;
          away.goalsFor += awayScore;
          away.goalsAgainst += homeScore;

          home.yellowCards = (home.yellowCards ?? 0) + (fixture.homeYellowCards ?? 0);
          home.redCards = (home.redCards ?? 0) + (fixture.homeRedCards ?? 0);
          away.yellowCards = (away.yellowCards ?? 0) + (fixture.awayYellowCards ?? 0);
          away.redCards = (away.redCards ?? 0) + (fixture.awayRedCards ?? 0);

          if (homeScore > awayScore) {
            home.wins += 1;
            home.points += 3;
            away.losses += 1;
          } else if (homeScore < awayScore) {
            away.wins += 1;
            away.points += 3;
            home.losses += 1;
          } else {
            home.draws += 1;
            away.draws += 1;
            home.points += 1;
            away.points += 1;
          }

          home.goalDifference = home.goalsFor - home.goalsAgainst;
          away.goalDifference = away.goalsFor - away.goalsAgainst;
        });

        // Head-to-head between two teams from this section's completed fixtures.
        // Returns <0 if `aId` ranks higher, >0 if lower, 0 if level.
        const headToHead = (aId: number, bId: number) => {
          let aPts = 0;
          let bPts = 0;
          let aGoals = 0;
          let bGoals = 0;
          section.fixtures.forEach((fixture) => {
            if (fixture.matchStatus !== "COMPLETED") return;
            const isAvB =
              fixture.homeTeamId === aId && fixture.awayTeamId === bId;
            const isBvA =
              fixture.homeTeamId === bId && fixture.awayTeamId === aId;
            if (!isAvB && !isBvA) return;
            const homeScore = fixture.homeTeamScore ?? 0;
            const awayScore = fixture.awayTeamScore ?? 0;
            const aScore = isAvB ? homeScore : awayScore;
            const bScore = isAvB ? awayScore : homeScore;
            aGoals += aScore;
            bGoals += bScore;
            if (aScore > bScore) aPts += 3;
            else if (aScore < bScore) bPts += 3;
            else {
              aPts += 1;
              bPts += 1;
            }
          });
          if (aPts !== bPts) return bPts - aPts;
          return bGoals - aGoals; // h2h goal difference (and goals for) reduce to this for a pair
        };

        // Fair-play score from disciplinary cards; fewer (lower) ranks higher.
        const fairPlay = (team: IMatchDayStanding) =>
          (team.yellowCards ?? 0) + (team.redCards ?? 0) * 3;

        const scopedRows = Array.from(statsByTeam.values())
          .sort((left, right) => {
            // Points -> Goal Difference -> Goals For -> Head-to-Head -> Fair Play -> name
            if (right.points !== left.points) return right.points - left.points;
            if (right.goalDifference !== left.goalDifference) return right.goalDifference - left.goalDifference;
            if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
            const h2h = headToHead(left.teamId, right.teamId);
            if (h2h !== 0) return h2h;
            const fp = fairPlay(left) - fairPlay(right);
            if (fp !== 0) return fp;
            return left.teamName.localeCompare(right.teamName);
          })
          .map((team, index) => ({
            ...team,
            rank: index + 1,
            key: `${key}-${team.teamId}`,
          }));

        return {
          key,
          title: section.title,
          meta: section.meta,
          rows: scopedRows,
        };
      })
      .filter((section) => section.rows.length > 0)
      .sort((left, right) => getSectionOrder(left.title) - getSectionOrder(right.title));

    return sections.length
      ? sections
      : [
          {
            key: "all",
            title: "Match Day Standings",
            meta: "Overall Table",
            rows,
          },
        ];
  }, [fixtures, standings, orderMap, roundNameMap, groupStandingsByName]);

  if (isLoading || fixturesLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader />
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <div className="text-center text-theme-sm text-gray-400 dark:text-gray-500">No standings data available</div>
      </div>
    );
  }

  const HeaderRow = () =>
    isMobile ? (
      <>
        <div
          className={styles.headerRow}
          style={{ gridTemplateColumns: leftGridCols }}
        >
          {["#", "Team"].map((label) => (
            <span
              key={label}
              className={`${styles.headerCell} ${label === "Team" ? styles.headerCellTeam : ""}`}
            >
              {label}
            </span>
          ))}
        </div>
        <div
          className={styles.headerRowScrollable}
          style={{ gridTemplateColumns: rightGridCols }}
        >
          {statHeaderLabels.map((label) => (
            <span key={label} className={styles.headerCell}>
              {label}
            </span>
          ))}
        </div>
      </>
    ) : (
      <div
        className={styles.headerRow}
        style={{
          gridTemplateColumns: `${leftGridCols} ${rightGridCols}`,
        }}
      >
        {["#", "Team", ...statHeaderLabels].map(
          (label) => (
            <span
              key={label}
              className={`${styles.headerCell} ${label === "Team" ? styles.headerCellTeam : ""}`}
            >
              {label}
            </span>
          ),
        )}
      </div>
    );

  const DataRow = ({
    row,
    isEven,
  }: {
    row: IMatchDayStanding & { rank: number; key: string };
    isEven: boolean;
  }) =>
    isMobile ? (
      <>
        <div
          className={`${styles.dataRow} ${isEven ? styles.dataRowEven : ""}`}
          style={{ gridTemplateColumns: leftGridCols }}
        >
          <div className={styles.rankCell}>
            <RankAvatar rank={row.rank} size={16} fontSize={8} />
          </div>

          <div className={styles.teamCell}>
            <TeamLogoAvatar
              src={getTeamLogoUrlFromSummary(matchDaySummary, row.teamId)}
              initials={getTeamInitials(row.teamName, "T")}
              size={24}
            />
            <span className={styles.teamName}>{row.teamName}</span>
          </div>
        </div>
        <div
          className={`${styles.dataRowScrollable} ${isEven ? styles.dataRowEven : ""}`}
          style={{ gridTemplateColumns: rightGridCols }}
        >
          <span className={styles.statCell}>{row.matches}</span>
          <span className={styles.statCell}>{row.wins}</span>
          <span className={styles.statCell}>{row.draws}</span>
          <span className={styles.statCell}>{row.losses}</span>

          <span
            className={`${styles.gdCell} ${
              row.goalDifference > 0
                ? styles.gdPositive
                : row.goalDifference < 0
                  ? styles.gdNegative
                  : styles.gdNeutral
            }`}
          >
            {row.goalDifference > 0
              ? `+${row.goalDifference}`
              : row.goalDifference}
          </span>

          <span className={styles.statCell}>{row.goalsFor}</span>
          <span className={styles.statCell}>{row.goalsAgainst}</span>

          <CardCell count={row.yellowCards} color="#fadb14" />
          <CardCell count={row.redCards} color="#f5222d" />

          <span className={styles.ptsCell}>{row.points}</span>
        </div>
      </>
    ) : (
      <div
        className={`${styles.dataRow} ${isEven ? styles.dataRowEven : ""}`}
        style={{
          gridTemplateColumns: `${leftGridCols} ${rightGridCols}`,
        }}
      >
        <div className={styles.rankCell}>
          <RankAvatar rank={row.rank} size={32} fontSize={14} />
        </div>

        <div className={styles.teamCell}>
          <TeamLogoAvatar
            src={getTeamLogoUrlFromSummary(matchDaySummary, row.teamId)}
            initials={getTeamInitials(row.teamName, "T")}
            size={36}
          />
          <span className={styles.teamName}>{row.teamName}</span>
        </div>

        <span className={styles.statCell}>{row.matches}</span>
        <span className={styles.statCell}>{row.wins}</span>
        <span className={styles.statCell}>{row.draws}</span>
        <span className={styles.statCell}>{row.losses}</span>

        <span
          className={`${styles.gdCell} ${
            row.goalDifference > 0
              ? styles.gdPositive
              : row.goalDifference < 0
                ? styles.gdNegative
                : styles.gdNeutral
          }`}
        >
          {row.goalDifference > 0
            ? `+${row.goalDifference}`
            : row.goalDifference}
        </span>

        <span className={styles.statCell}>{row.goalsFor}</span>
        <span className={styles.statCell}>{row.goalsAgainst}</span>

        <CardCell count={row.yellowCards} color="#fadb14" />
        <CardCell count={row.redCards} color="#f5222d" />

        <span className={styles.ptsCell}>{row.points}</span>
      </div>
    );

  return (
    <div className={styles.pageWrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          MatchDay Standings
        </h2>
        <span className={styles.subtitle}>Final Leaderboard & Rankings</span>
      </div>

      <div className={styles.contentWrap}>
        {sectionedRows.map((section) => (
          <div
            key={section.key}
            className={styles.sectionCard}
            style={{ padding: isMobile ? "14px 12px" : "18px 22px" }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.headerLeft}>
                <h4 className={styles.sectionTitle}>
                  {section.title}
                </h4>
                <span className={styles.statusTag}>STANDINGS</span>
              </div>
              <span className={styles.headerRight}>{section.meta}</span>
            </div>

            {isMobile ? (
              <div className={styles.tableWrapperMobile}>
                <div className={styles.tableFixedLeft}>
                  <div
                    className={styles.headerRow}
                    style={{ gridTemplateColumns: leftGridCols }}
                  >
                    {["#", "Team"].map((label) => (
                      <span
                        key={label}
                        className={`${styles.headerCell} ${label === "Team" ? styles.headerCellTeam : ""}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  {section.rows.map((row, index) => (
                    <div
                      key={row.key}
                      className={`${styles.dataRow} ${index % 2 === 1 ? styles.dataRowEven : ""}`}
                      style={{ gridTemplateColumns: leftGridCols }}
                    >
                      <div className={styles.rankCell}>
                        <RankAvatar rank={row.rank} size={16} fontSize={8} />
                      </div>

                      <div className={styles.teamCell}>
                        <TeamLogoAvatar
                          src={getTeamLogoUrlFromSummary(matchDaySummary, row.teamId)}
                          initials={getTeamInitials(row.teamName, "T")}
                          size={24}
                        />
                        <span className={styles.teamName}>
                          {row.teamName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.tableScrollableRight}>
                  <div
                    className={styles.headerRow}
                    style={{ gridTemplateColumns: mobileStatsGridColumns }}
                  >
                    {statHeaderLabels.map(
                      (label) => (
                        <span key={label} className={styles.headerCell}>
                          {label}
                        </span>
                      ),
                    )}
                  </div>
                  {section.rows.map((row, index) => (
                    <div
                      key={row.key}
                      className={`${styles.dataRow} ${index % 2 === 1 ? styles.dataRowEven : ""}`}
                      style={{ gridTemplateColumns: mobileStatsGridColumns }}
                    >
                      <span className={styles.statCell}>{row.matches}</span>
                      <span className={styles.statCell}>{row.wins}</span>
                      <span className={styles.statCell}>{row.draws}</span>
                      <span className={styles.statCell}>{row.losses}</span>

                      <span
                        className={`${styles.gdCell} ${
                          row.goalDifference > 0
                            ? styles.gdPositive
                            : row.goalDifference < 0
                              ? styles.gdNegative
                              : styles.gdNeutral
                        }`}
                      >
                        {row.goalDifference > 0
                          ? `+${row.goalDifference}`
                          : row.goalDifference}
                      </span>

                      <span className={styles.statCell}>{row.goalsFor}</span>
                      <span className={styles.statCell}>
                        {row.goalsAgainst}
                      </span>

                      <CardCell count={row.yellowCards} color="#fadb14" />
                      <CardCell count={row.redCards} color="#f5222d" />

                      <span className={styles.ptsCell}>{row.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <HeaderRow />
                {section.rows.map((row, index) => (
                  <DataRow key={row.key} row={row} isEven={index % 2 === 1} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
