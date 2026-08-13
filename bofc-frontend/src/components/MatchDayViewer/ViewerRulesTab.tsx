import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGetMatchDaySummaryQuery } from "../../state/features/matchDays/matchDaysSlice";
import styles from "./ViewerRulesTab.module.css";
import Loader from "../ui/loader";

interface ViewerRulesTabProps {
  matchDayId: number;
}

export default function ViewerRulesTab({ matchDayId }: ViewerRulesTabProps) {
  const { data, isLoading } = useGetMatchDaySummaryQuery({ matchDayId });

  if (isLoading) {
    return <Loader className="py-12" />;
  }

  const matchDay = data?.content?.[0];
  const rules = matchDay?.rules;

  if (!rules || !rules.trim()) {
    return (
      <div className="p-12 text-center text-theme-sm text-gray-400 dark:text-gray-500">
        No rules have been added for this Match Day
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
