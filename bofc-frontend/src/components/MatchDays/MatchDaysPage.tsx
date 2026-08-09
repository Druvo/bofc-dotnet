import React, { useState, useMemo, useEffect } from "react";
import { useGetMatchDaysQuery } from "../../state/features/matchDays/matchDaysSlice";
import { IoMatchDaySingleSummaryType } from "../../state/features/matchDays/matchDayTypes";
import MatchDaysActionDropdown from "./Atoms/MatchDaysActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateMatchDay from "./Atoms/CreateMatchDayModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { showBdLocalTimeRange, getEffectiveMatchDayStatus } from "../../utils/utils";
import { CalendarOutlined, EnvironmentOutlined, SearchOutlined, ThunderboltOutlined, TrophyOutlined } from "@ant-design/icons";
import { canManageMatchDays } from "../../utils/roleUtils";
import Button from "../ui/button";
import Pagination from "../ui/pagination";
import Loader from "../ui/loader";
import VenueLink from "../CommonAtoms/VenueLink";
import EmptyState from "../ui/empty-state";

// Status palette drawn from the club identity so cards read as one matchday product.
// Upcoming = brand, Ongoing = success, Concluded = muted.
const STATUS_CONFIG: Record<string, { classes: string; dot: string; label: string }> = {
  UPCOMING: { classes: "bg-brand-50 text-brand-500 border-brand-500/35 dark:bg-brand-500/15 dark:text-brand-400", dot: "bg-brand-500", label: "Upcoming" },
  ONGOING: { classes: "bg-success-50 text-success-600 border-success-500/35 dark:bg-success-500/15 dark:text-success-500", dot: "bg-success-500", label: "Ongoing" },
  CONCLUDED: { classes: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-white/5 dark:text-gray-400", dot: "bg-gray-400", label: "Concluded" },
  COMPLETED: { classes: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-white/5 dark:text-gray-400", dot: "bg-gray-400", label: "Concluded" },
};

const getStatusConfig = (status?: string) =>
  (status && STATUS_CONFIG[status]) || { classes: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-white/5 dark:text-gray-400", dot: "bg-gray-400", label: status || "Unknown" };

const segmentBtn = (active: boolean) =>
  `px-3.5 py-2 text-theme-sm font-medium transition ${
    active ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;

const MatchDaysPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageMatchDays(loginInfo.roles);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [sorter] = useState<{ sortedBy: string; sortDirection: "ASC" | "DESC" }>({
    sortedBy: "matchDayDate",
    sortDirection: "DESC",
  });

  const navigate = useNavigate();

  // Status filtering happens client-side (the backend has no status-filter query param) — with
  // pure server pagination that meant filtering the current 12-item page down to a couple of
  // matches while the pager still advertised page counts from the server's UNFILTERED total,
  // so a matching MatchDay sitting on a page that was never fetched was simply unreachable.
  // While any filter/search is active, fetch a much larger batch and paginate it client-side
  // instead; with no filter active, fall back to plain server pagination (unchanged, still the
  // efficient path for the common case).
  const hasActiveFilter = statusFilter !== "ALL" || searchText.trim() !== "";

  const { data: matchDaySummaries, isLoading, isError } = useGetMatchDaysQuery({
    offSet: hasActiveFilter ? 0 : currentPage - 1,
    pageSize: hasActiveFilter ? 1000 : pageSize,
    sortedBy: sorter.sortedBy,
    sortDirection: sorter.sortDirection,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchText]);

  const handleMenuClick = (e: any, record: IoMatchDaySingleSummaryType) => {
    if (e.key === "join") {
      navigate(`/match-days/join-match-day/${record.id}`);
    } else if (e.key === "auction-register") {
      navigate(`/auction/register/${record.id}`);
    } else if (e.key === "auction-live") {
      navigate(`/auction/live/${record.id}`);
    } else if (e.key === "team-building" || e.key === "fixtures") {
      navigate(`/match-days/team-building/${record.id}`);
    }
  };

  const matchesFilter = (t: IoMatchDaySingleSummaryType) => {
    const effectiveStatus = getEffectiveMatchDayStatus(t.matchDayStatus, t.matchDayDate, t.durationMinutes);
    const matchStatus =
      statusFilter === "ALL" ||
      effectiveStatus === statusFilter ||
      (statusFilter === "CONCLUDED" && (effectiveStatus === "CONCLUDED" || effectiveStatus === "COMPLETED"));
    const matchSearch = !searchText || t.name.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  };

  const allFilteredMatchDays = useMemo(
    () => (matchDaySummaries?.content?.matchDays ?? []).filter(matchesFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchDaySummaries, statusFilter, searchText]
  );

  // Server pagination already sliced the page when no filter is active — only slice here for
  // the client-paginated (filtered) path, where the query above fetched everything at once.
  const filteredMatchDays = hasActiveFilter
    ? allFilteredMatchDays.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : allFilteredMatchDays;

  const filteredTotalCount = hasActiveFilter
    ? allFilteredMatchDays.length
    : matchDaySummaries?.content?.totalCount ?? 0;

  const segmentedOptions = useMemo(() => {
    const all = matchDaySummaries?.content?.matchDays ?? [];
    const effectiveStatuses = all.map((t) => getEffectiveMatchDayStatus(t.matchDayStatus, t.matchDayDate, t.durationMinutes));
    const opts: { label: string; value: string }[] = [{ label: "All", value: "ALL" }];
    if (effectiveStatuses.some((s) => s === "UPCOMING")) opts.push({ label: "Upcoming", value: "UPCOMING" });
    if (effectiveStatuses.some((s) => s === "ONGOING")) opts.push({ label: "Ongoing", value: "ONGOING" });
    if (effectiveStatuses.some((s) => s === "CONCLUDED" || s === "COMPLETED")) opts.push({ label: "Concluded", value: "CONCLUDED" });
    return opts;
  }, [matchDaySummaries]);

  if (isLoading) {
    return <Loader className="py-20" />;
  }

  if (isError || !matchDaySummaries) {
    return (
      <div className="rounded-2xl border border-error-500/30 bg-error-50 p-5 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-500">
        Failed to load matchDays.
      </div>
    );
  }

  const totalPages = Math.ceil((filteredTotalCount || 0) / pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
          <TrophyOutlined className="text-brand-500 dark:text-brand-400" />
          MatchDays
        </h2>
        {canManage && <CreateMatchDay />}
      </div>

      <div className="h-0.5 w-full rounded bg-gradient-to-r from-brand-500 to-transparent" />

      {/* Filter bar + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap overflow-hidden rounded-lg border border-gray-300 dark:border-[var(--color-rule)]">
          {segmentedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
              className={segmentBtn(statusFilter === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search matchDays..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
          />
        </div>
      </div>

      {/* Card grid */}
      <div style={{ minHeight: "calc(100vh - 320px)" }}>
        {filteredMatchDays.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
            <EmptyState
              icon={<TrophyOutlined />}
              title="No MatchDays yet"
              description="Create a MatchDay to start scheduling fixtures."
            />
            {canManage && (
              <div className="flex justify-center pb-8">
                <CreateMatchDay />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMatchDays.map((t) => {
              const conf = getStatusConfig(getEffectiveMatchDayStatus(t.matchDayStatus, t.matchDayDate, t.durationMinutes));
              const inactive = !t.activeStatus;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (!inactive && t.matchDayDate) navigate(`/match-days/join-match-day/${t.id}`);
                  }}
                  className={`rounded-2xl border border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] ${
                    inactive ? "opacity-50" : "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-theme-sm"
                  }`}
                >
                  <div className={`h-[3px] rounded-t-2xl ${inactive ? "bg-gray-400" : conf.dot}`} />
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-theme-xs font-bold uppercase tracking-wide ${conf.classes}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
                        {conf.label}
                      </span>
                      {t.matchDayDate && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <MatchDaysActionDropdown record={t} onMenuClick={handleMenuClick} matchDayId={t.id} />
                        </div>
                      )}
                    </div>

                    <h4 className="mb-3.5 truncate text-base font-semibold text-gray-800 dark:text-white/90" title={t.name}>
                      {t.name}
                    </h4>

                    <div className="flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                        <CalendarOutlined className="shrink-0 text-brand-500 dark:text-brand-400" />
                        {t.matchDayDate ? showBdLocalTimeRange(t.matchDayDate, t.durationMinutes) : "—"}
                      </span>
                      {t.venueName ? (
                        <VenueLink
                          name={t.venueName}
                          mapLink={t.venueMapLink}
                          className="flex items-center gap-2 truncate text-theme-xs text-gray-500 hover:text-brand-500 hover:underline dark:text-gray-400 dark:hover:text-brand-400"
                          iconClassName="shrink-0 text-brand-500 dark:text-brand-400"
                        />
                      ) : (
                        <span className="flex items-center gap-2 truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          <EnvironmentOutlined className="shrink-0 text-brand-500 dark:text-brand-400" />
                          —
                        </span>
                      )}
                    </div>

                    {t.auctionMode && (
                      <Button
                        size="sm"
                        startIcon={<ThunderboltOutlined />}
                        className="mt-3.5 w-full"
                        onClick={(e) => { e.stopPropagation(); navigate(`/auction/register/${t.id}`); }}
                      >
                        Auction
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-end pb-2">
        <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default MatchDaysPage;
