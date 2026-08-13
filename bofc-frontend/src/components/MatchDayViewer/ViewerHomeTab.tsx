import React from "react";
import { TrophyOutlined } from "@ant-design/icons";
import { useGetMatchDaySummaryQuery } from "../../state/features/matchDays/matchDaysSlice";
import ViewerPlayersTab from "./ViewerPlayersTab";
import styles from "./ViewerHomeTab.module.css";
import Loader from "../ui/loader";

interface ViewerHomeTabProps {
  matchDayId: number;
}

export default function ViewerHomeTab({ matchDayId }: ViewerHomeTabProps) {
  const { data, isLoading } = useGetMatchDaySummaryQuery({ matchDayId });

  if (isLoading) {
    return <Loader className="py-12" />;
  }

  const matchDay = data?.content?.[0];

  if (!matchDay) {
    return (
      <div className="p-12 text-center text-theme-sm text-gray-400 dark:text-gray-500">
        Match Day details not found
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(matchDay.season || matchDay.description) && (
        <div
          className={styles.heroCard}
          style={{
            border: "1px solid var(--color-rule)",
          }}
        >
          {matchDay.season && (
            <span className={styles.heroSeason}>{matchDay.season}</span>
          )}

          {matchDay.description && (
            <p className={styles.heroDescription}>
              {matchDay.description}
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

        <ViewerPlayersTab matchDayId={matchDayId} />
      </div>
    </div>
  );
}
