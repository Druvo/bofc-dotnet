import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import styles from "./ViewerRulesTab.module.css";
import Loader from "../ui/loader";

interface ViewerRulesTabProps {
  tournamentId: number;
}

export default function ViewerRulesTab({ tournamentId }: ViewerRulesTabProps) {
  const { data, isLoading } = useGetTournamentSummaryQuery({ tournamentId });

  if (isLoading) {
    return <Loader className="py-12" />;
  }

  const tournament = data?.content?.[0];
  const rules = tournament?.rules;

  if (!rules || !rules.trim()) {
    return (
      <div className="p-12 text-center text-theme-sm text-gray-400 dark:text-gray-500">
        No rules have been added for this MatchDay
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 34,
        border: "1px solid var(--color-rule)",
        padding: "22px 22px 18px",
      }}
    >
      <div className={styles.rulesContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rules}</ReactMarkdown>
      </div>
    </div>
  );
}
