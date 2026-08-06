import React from "react";
import { TrophyOutlined } from "@ant-design/icons";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import ViewerPlayersTab from "./ViewerPlayersTab";
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

  if (!tournament) {
    return (
      <div className="p-12 text-center text-theme-sm text-gray-400 dark:text-gray-500">
        MatchDay details not found
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(tournament.season || tournament.description) && (
        <div
          className={styles.heroCard}
          style={{
            border: "1px solid var(--color-rule)",
          }}
        >
          {tournament.season && (
            <span className={styles.heroSeason}>{tournament.season}</span>
          )}

          {tournament.description && (
            <p className={styles.heroDescription}>
              {tournament.description}
            </p>
          )}
        </div>
      )}

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

        <ViewerPlayersTab tournamentId={tournamentId} />
      </div>
    </div>
  );
}
