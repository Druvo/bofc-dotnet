import React from "react";
import { TrophyOutlined } from "@ant-design/icons";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { getTeamInitials, toAbsoluteLogoUrl } from "./teamLogoUtils";
import styles from "./ViewerHomeTab.module.css";
import Loader from "../ui/loader";

interface ViewerHomeTabProps {
  tournamentId: number;
}

export default function ViewerHomeTab({ tournamentId }: ViewerHomeTabProps) {
  const { data, isLoading } = useGetTournamentSummaryQuery({ tournamentId });

  if (isLoading) {
    return <Loader className="py-12" />;
  }

  const tournament = data?.content?.[0];
  const teams = tournament?.teams || [];

  if (!tournament) {
    return (
      <div className="p-12 text-center text-theme-sm text-gray-400 dark:text-gray-500">
        Tournament details not found
      </div>
    );
  }

  const displayTitle =
    tournament.title || tournament.name || tournament.tournamentName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        className={styles.heroCard}
        style={{
          border: "1px solid var(--color-rule)",
        }}
      >
        <span className={styles.heroBadge}>OFFICIAL TOURNAMENT</span>

        <div className={styles.heroTitleRow}>
          <div className={styles.heroTitleWrapper}>
            <div className={styles.titleReveal}>
              <h1 className={styles.heroTitle}>
                {displayTitle}
              </h1>
            </div>
          </div>
        </div>

        {tournament.season && (
          <span className={styles.heroSeason}>{tournament.season}</span>
        )}

        {tournament.description && (
          <p className={styles.heroDescription}>
            {tournament.description}
          </p>
        )}
      </div>

      <div
        style={{
          borderRadius: 20,
          border: "1px solid var(--color-rule)",
          padding: "22px 22px 18px",
        }}
      >
        <h4 style={{ margin: "0 0 16px", color: "var(--color-ink)", fontSize: 18, fontWeight: 700 }}>
          <TrophyOutlined style={{ marginRight: 8, color: "var(--color-accent)" }} />
          Participants
        </h4>

        {teams.length === 0 ? (
          <div className="p-6 text-center text-theme-sm text-gray-400 dark:text-gray-500">No participating teams yet</div>
        ) : (
          <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {teams.map((team) => {
              const logoUrl = toAbsoluteLogoUrl(team.logoUrl);
              return (
                <div
                  key={team.teamId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 10,
                    padding: "16px 8px",
                    borderRadius: "var(--radius-card)",
                    border: "1px solid var(--color-rule)",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{
                      width: 56,
                      height: 56,
                      color: "var(--color-accent)",
                      fontWeight: 900,
                      fontSize: 20,
                      border: "3px solid var(--color-rule)",
                    }}
                  >
                    {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : getTeamInitials(team.teamName)}
                  </div>
                  <span
                    style={{ color: "var(--color-ink)", fontWeight: 600, fontSize: 13 }}
                  >
                    {team.teamName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
