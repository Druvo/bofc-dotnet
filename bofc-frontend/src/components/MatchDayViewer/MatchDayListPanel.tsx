import React, { useMemo, useState } from "react";
import { SearchOutlined, TrophyOutlined } from "@ant-design/icons";
import { useGetMatchDaysQuery } from "../../state/features/matchDays/matchDaysSlice";
import type { IoMatchDaySingleSummaryType } from "../../state/features/matchDays/matchDayTypes";
import Loader from "../ui/loader";

interface MatchDayListPanelProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const statusOrder: Record<string, number> = {
  ONGOING: 0,
  ACTIVE: 1,
  UPCOMING: 2,
  CONCLUDED: 3,
  INACTIVE: 4,
};

const statusTone: Record<string, React.CSSProperties> = {
  success: { background: "rgba(82,196,26,0.14)", color: "#52c41a", border: "1px solid rgba(82,196,26,0.35)" },
  processing: { background: "rgba(22,119,255,0.14)", color: "#69b1ff", border: "1px solid rgba(22,119,255,0.35)" },
  default: { background: "rgba(140,140,140,0.14)", color: "#bfbfbf", border: "1px solid rgba(140,140,140,0.3)" },
};

const statusColor = (status: string | undefined): "success" | "processing" | "default" => {
  switch (status?.toUpperCase()) {
    case "ONGOING":
    case "ACTIVE":
      return "success";
    case "UPCOMING":
      return "processing";
    default:
      return "default";
  }
};

export default function MatchDayListPanel({
  selectedId,
  onSelect,
}: MatchDayListPanelProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetMatchDaysQuery({
    offSet: 0,
    pageSize: 200,
    sortedBy: "matchDayDate",
    sortDirection: "DESC",
  });

  const matchDays: IoMatchDaySingleSummaryType[] = useMemo(() => {
    const list = data?.content?.matchDays || [];
    return [...list]
      .sort(
        (a, b) =>
          (statusOrder[a.matchDayStatus?.toUpperCase() ?? ""] ?? 5) -
          (statusOrder[b.matchDayStatus?.toUpperCase() ?? ""] ?? 5)
      )
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [data, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 12px 8px" }}>
        <div className="relative">
          <SearchOutlined className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search MatchDays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-gray-300 bg-transparent pl-8 pr-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-white/90"
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {matchDays.length === 0 ? (
            <div className="p-6 text-center text-theme-xs text-gray-400 dark:text-gray-500">
              <TrophyOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
              No MatchDays found
            </div>
          ) : (
            matchDays.map((matchDay) => {
              const isSelected = matchDay.id === selectedId;
              const isLive =
                matchDay.matchDayStatus?.toUpperCase() === "ONGOING" ||
                matchDay.matchDayStatus?.toUpperCase() === "ACTIVE";
              const tone = matchDay.matchDayStatus ? statusColor(matchDay.matchDayStatus) : "default";

              return (
                <div
                  key={matchDay.id}
                  onClick={() => onSelect(matchDay.id)}
                  style={{
                    cursor: "pointer",
                    padding: "10px 14px",
                    background: isSelected
                      ? "rgba(24, 144, 255, 0.12)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "3px solid #c6a15b"
                      : "3px solid transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      {isLive ? (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#52c41a]" />
                      ) : (
                        <TrophyOutlined
                          style={{ fontSize: 12, color: "#888" }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? 700 : 400,
                          color: isSelected ? "#c6a15b" : undefined,
                          wordBreak: "break-word",
                        }}
                      >
                        {matchDay.name}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                        {matchDay.matchDayDate
                          ? new Date(
                              matchDay.matchDayDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {matchDay.matchDayStatus && (
                        <span
                          style={{
                            fontSize: 10,
                            margin: 0,
                            lineHeight: "16px",
                            padding: "0 6px",
                            borderRadius: 4,
                            ...statusTone[tone],
                          }}
                        >
                          {matchDay.matchDayStatus.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
