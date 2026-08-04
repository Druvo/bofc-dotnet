import React, { useState, useMemo, useRef, useEffect } from "react";
import { useGetTournamentGoalkeeperHistoryListQuery } from "../../../state/features/tournaments/tournamentsSlice";
import moment from "moment";
import Modal from "../../ui/modal";
import Button from "../../ui/button";

export default function GoalKeeperDrawer({
  tournamentId,
  triggerClassName,
  triggerStyle,
  triggerIcon,
}: {
  tournamentId: number;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  triggerIcon?: React.ReactNode;
}) {
  const { data: tournamentGoalKeeperList, refetch: refetchTournamentGoalKeeperList } = useGetTournamentGoalkeeperHistoryListQuery();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const showDrawer = () => {
    refetchTournamentGoalKeeperList();
    setOpen(true);
  };

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [open]);

  const dataSourceByRound = useMemo(() => {
    if (!tournamentGoalKeeperList?.content) return [];

    return Object.keys(tournamentGoalKeeperList.content)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .map((round) => {
        const rows = tournamentGoalKeeperList.content[round]
          .map((player) => ({
            key: player.playerId,
            playerName: player.playerName,
            playedDate: player?.playedDate,
          }))
          .filter((p) => !searchText || p.playerName.toLowerCase().includes(searchText.toLowerCase()))
          .sort((a, b) => a.playerName.localeCompare(b.playerName));
        return { round, data: rows };
      });
  }, [tournamentGoalKeeperList, searchText]);

  return (
    <>
      <Button type="button" variant="outline" className={triggerClassName} style={triggerStyle} startIcon={triggerIcon} onClick={showDrawer}>
        Goalkeeper Records
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Goalkeeper Records" className="max-w-[95vw]">
        <input
          placeholder="Search Player"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="mb-4 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
        />
        <div ref={scrollRef} className="flex flex-row gap-4 overflow-x-auto pb-4" style={{ maxHeight: "70vh" }}>
          {dataSourceByRound.map((roundData) => (
            <div key={roundData.round} className="min-w-[280px] max-w-[280px] shrink-0">
              <h3 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Round {roundData.round}</h3>
              <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="w-full border-collapse text-theme-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <th className="px-2.5 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                      <th className="px-2.5 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Played Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {roundData.data.map((row) => (
                      <tr key={row.key} className={row.playedDate ? "bg-success-50/40 dark:bg-success-500/10" : ""}>
                        <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{row.playerName}</td>
                        <td className="px-2.5 py-2 text-gray-500 dark:text-gray-400">{row.playedDate ? moment(row.playedDate).format("YYYY-MM-DD") : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
