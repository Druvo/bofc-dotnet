import React, { useState, useMemo } from "react";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { showBdLocalTime, getEffectiveTournamentStatus } from "../../utils/utils";
import { CalendarOutlined, EnvironmentOutlined, SearchOutlined, ThunderboltOutlined, TrophyOutlined } from "@ant-design/icons";
import { canManageTournaments } from "../../utils/roleUtils";
import Button from "../ui/button";
import Pagination from "../ui/pagination";
import Loader from "../ui/loader";
import VenueLink from "../CommonAtoms/VenueLink";

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

const TournamentsPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageTournaments(loginInfo.roles);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [sorter] = useState<{ sortedBy: string; sortDirection: "ASC" | "DESC" }>({
    sortedBy: "tournamentDate",
    sortDirection: "DESC",
  });

  const navigate = useNavigate();

  const { data: tournamentSummaries, isLoading, isError } = useGetTournamentsQuery({
    offSet: currentPage - 1,
    pageSize,
    sortedBy: sorter.sortedBy,
    sortDirection: sorter.sortDirection,
  });

  const handleMenuClick = (e: any, record: IoTournamentSingleSummaryType) => {
    if (e.key === "join") {
      navigate(`/tournaments/join-tournament/${record.id}`);
    } else if (e.key === "auction-register") {
      navigate(`/auction/register/${record.id}`);
    } else if (e.key === "auction-live") {
      navigate(`/auction/live/${record.id}`);
    } else if (e.key === "team-building" || e.key === "fixtures") {
      navigate(`/tournaments/team-building/${record.id}`);
    }
  };

  const filteredTournaments = useMemo(() => {
    const all = tournamentSummaries?.content?.tournaments ?? [];
    return all.filter((t) => {
      const effectiveStatus = getEffectiveTournamentStatus(t.tournamentStatus, t.tournamentDate);
      const matchStatus =
        statusFilter === "ALL" ||
        effectiveStatus === statusFilter ||
        (statusFilter === "CONCLUDED" && (effectiveStatus === "CONCLUDED" || effectiveStatus === "COMPLETED"));
      const matchSearch = !searchText || t.name.toLowerCase().includes(searchText.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tournamentSummaries, statusFilter, searchText]);

  const segmentedOptions = useMemo(() => {
    const all = tournamentSummaries?.content?.tournaments ?? [];
    const effectiveStatuses = all.map((t) => getEffectiveTournamentStatus(t.tournamentStatus, t.tournamentDate));
    const opts: { label: string; value: string }[] = [{ label: "All", value: "ALL" }];
    if (effectiveStatuses.some((s) => s === "UPCOMING")) opts.push({ label: "Upcoming", value: "UPCOMING" });
    if (effectiveStatuses.some((s) => s === "ONGOING")) opts.push({ label: "Ongoing", value: "ONGOING" });
    if (effectiveStatuses.some((s) => s === "CONCLUDED" || s === "COMPLETED")) opts.push({ label: "Concluded", value: "CONCLUDED" });
    return opts;
  }, [tournamentSummaries]);

  if (isLoading) {
    return <Loader className="py-20" />;
  }

  if (isError || !tournamentSummaries) {
    return (
      <div className="rounded-2xl border border-error-500/30 bg-error-50 p-5 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-500">
        Failed to load tournaments.
      </div>
    );
  }

  const totalPages = Math.ceil((tournamentSummaries?.content?.totalCount || 0) / pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
          <TrophyOutlined className="text-brand-500 dark:text-brand-400" />
          Tournaments
        </h2>
        {canManage && <CreateTournament />}
      </div>

      <div className="h-0.5 w-full rounded bg-gradient-to-r from-brand-500 to-transparent" />

      {/* Filter bar + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
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
            placeholder="Search tournaments..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
          />
        </div>
      </div>

      {/* Card grid */}
      <div style={{ minHeight: "calc(100vh - 320px)" }}>
        {filteredTournaments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <TrophyOutlined className="mb-3 block text-5xl text-brand-300 dark:text-brand-500/40" />
            <p className="text-theme-sm text-gray-400 dark:text-gray-500">No tournaments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTournaments.map((t) => {
              const conf = getStatusConfig(getEffectiveTournamentStatus(t.tournamentStatus, t.tournamentDate));
              const inactive = !t.activeStatus;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (!inactive && t.tournamentDate) navigate(`/tournaments/join-tournament/${t.id}`);
                  }}
                  className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${
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
                      {t.tournamentDate && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <TournamentsActionDropdown record={t} onMenuClick={handleMenuClick} tournamentId={t.id} />
                        </div>
                      )}
                    </div>

                    <h4 className="mb-3.5 truncate text-base font-semibold text-gray-800 dark:text-white/90" title={t.name}>
                      {t.name}
                    </h4>

                    <div className="flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                        <CalendarOutlined className="shrink-0 text-brand-500 dark:text-brand-400" />
                        {t.tournamentDate ? showBdLocalTime(t.tournamentDate) : "—"}
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

export default TournamentsPage;
