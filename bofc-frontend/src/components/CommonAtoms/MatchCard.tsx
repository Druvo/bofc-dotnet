import React from "react";
import styles from "../TournamentViewer/ViewerFixturesTab.module.css";

/**
 * Canonical status→class mapper. ViewerFixturesTab and ViewerResultsTab each
 * had their own copy (getMatchCardClassName / getResultCardClassName) with
 * identical bodies — this is the single source of truth now.
 */
export const getMatchCardClassName = (status: string): string => {
  if (status === "COMPLETED") return `${styles.matchCard} ${styles.matchCardCompleted}`;
  if (status === "ONGOING" || status === "PAUSED") return `${styles.matchCard} ${styles.matchCardLive}`;
  return styles.matchCard;
};

const tagToneStyle: Record<string, React.CSSProperties> = {
  purple: { background: "rgba(114,46,209,0.14)", color: "#b37feb", border: "1px solid rgba(114,46,209,0.35)" },
  default: { background: "rgba(140,140,140,0.14)", color: "#bfbfbf", border: "1px solid rgba(140,140,140,0.3)" },
  blue: { background: "rgba(22,119,255,0.14)", color: "#69b1ff", border: "1px solid rgba(22,119,255,0.35)" },
};

const tagPillBase: React.CSSProperties = {
  display: "inline-block",
  borderRadius: 4,
  padding: "0 7px",
  lineHeight: "20px",
};

/**
 * Canonical UPCOMING/LIVE/PAUSED/FT badge, previously private to
 * ViewerFixturesTab. ViewerResultsTab keeps its own richer variant (embeds
 * the live match timer inline) rather than being forced through this one —
 * see that file's status tag for why.
 */
export const matchStatusTag = (status: string): React.ReactNode => {
  switch (status) {
    case "ONGOING":
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#52c41a]" />
          <span className={styles.liveStatusText}>LIVE</span>
        </span>
      );
    case "PAUSED":
      return <span className={styles.statusTag} style={{ ...tagPillBase, ...tagToneStyle.purple }}>PAUSED</span>;
    case "COMPLETED":
      return <span className={styles.statusTag} style={{ ...tagPillBase, ...tagToneStyle.default }}>FT</span>;
    default:
      return <span className={styles.statusTag} style={{ ...tagPillBase, ...tagToneStyle.blue }}>UPCOMING</span>;
  }
};

interface MatchCardShellProps {
  status: string;
  isMobile: boolean;
  children: React.ReactNode;
}

/**
 * The outer card wrapper shared verbatim by every match/result card in the
 * tournament viewer — status-driven className, and the mobile/desktop body
 * padding split. Callers own everything inside (top row, team block, score,
 * event breakdown) since that content differs enough between a fixture and a
 * result to stay bespoke per tab.
 */
export default function MatchCardShell({ status, isMobile, children }: MatchCardShellProps) {
  return (
    <div className={getMatchCardClassName(status)} style={{ padding: isMobile ? "14px 14px 16px" : "20px 22px 24px" }}>
      {children}
    </div>
  );
}
