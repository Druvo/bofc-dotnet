import { OrderedListOutlined } from "@ant-design/icons";
import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import { useGetPlayerRanksQuery, useSetPlayerRankMutation, PlayerRankListItem } from "../../state/features/player/playerSlice";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import Avatar from "../CommonAtoms/Avatar";
import Badge from "../ui/badge";
import Loader from "../ui/loader";
import EmptyState from "../ui/empty-state";

const RANK_COUNT = 10;
const UNRANKED_ID = "unranked";
const rankDroppableId = (rank: number) => `rank-${rank}`;
const rankFromDroppableId = (id: string) => (id === UNRANKED_ID ? null : Number(id.replace("rank-", "")));

function PlayerChip({ player, index, isDisabled }: { player: PlayerRankListItem; index: number; isDisabled: boolean }) {
  return (
    <Draggable draggableId={String(player.playerId)} index={index} isDragDisabled={isDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex cursor-grab items-center gap-2 rounded-lg border p-2 pr-3 active:cursor-grabbing ${
            snapshot.isDragging
              ? "border-brand-300 bg-brand-50 shadow-lg dark:border-brand-500/40 dark:bg-brand-500/10"
              : "border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
          } ${isDisabled ? "opacity-70" : ""}`}
        >
          <Avatar src={toAbsolutePlayerPhotoUrl(player.photoUrl)} name={player.name} seed={player.playerId} size={28} />
          <span className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{player.name}</span>
          {player.jerseyNumber != null && <Badge variant="light">#{player.jerseyNumber}</Badge>}
          {!player.isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" title="Inactive" />}
        </div>
      )}
    </Draggable>
  );
}

// Admin-only drag-and-drop rank board — a tier board, not a single ordered list: many players
// can share the same rank (1-10), so it's two panels (an unranked pool + 10 rank rows) rather
// than one reorderable list. Separate from the plain Player List/edit pages, which don't expose
// this at all.
function PlayerRankBoard() {
  const { data, isLoading } = useGetPlayerRanksQuery();
  const [setPlayerRank, { isLoading: isSaving }] = useSetPlayerRankMutation();
  const [players, setPlayers] = useState<PlayerRankListItem[]>([]);

  useEffect(() => {
    if (data?.content) setPlayers(data.content);
  }, [data]);

  const { unranked, byRank } = useMemo(() => {
    const grouped: { unranked: PlayerRankListItem[]; byRank: Record<number, PlayerRankListItem[]> } = {
      unranked: [],
      byRank: Object.fromEntries(Array.from({ length: RANK_COUNT }, (_, i) => [i + 1, []])),
    };
    players.forEach((p) => {
      if (p.rank && p.rank >= 1 && p.rank <= RANK_COUNT) grouped.byRank[p.rank].push(p);
      else grouped.unranked.push(p);
    });
    return grouped;
  }, [players]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceRank = rankFromDroppableId(result.source.droppableId);
    const destRank = rankFromDroppableId(result.destination.droppableId);
    if (sourceRank === destRank) return; // Reordering within the same bucket has nothing to save — rank has no internal order.

    const playerId = Number(result.draggableId);
    const previous = players;
    setPlayers((prev) => prev.map((p) => (p.playerId === playerId ? { ...p, rank: destRank } : p)));

    setPlayerRank({ playerId, rank: destRank })
      .unwrap()
      .catch((err) => {
        setPlayers(previous);
        toast.error(normalizeErrorMessage(err?.data || err, "Failed to save rank"));
      });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white/90">
            <OrderedListOutlined className="text-brand-500 dark:text-brand-400" />
            Rank Players
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Drag players from the pool into a rank row (1 = strongest). Several players can share a rank. Saved automatically on drop.
          </p>
        </div>
        {!isLoading && <Badge variant="light">{players.length} players</Badge>}
      </div>

      {isLoading ? (
        <Loader className="py-10" />
      ) : !players.length ? (
        <EmptyState icon={<OrderedListOutlined />} title="No players yet" description="Players will show up here once they're added." />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <div>
              <div className="mb-2 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">
                Unranked Pool <Badge variant="light">{unranked.length}</Badge>
              </div>
              <Droppable droppableId={UNRANKED_ID}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex max-h-[70vh] min-h-[120px] flex-col gap-2 overflow-y-auto rounded-xl border-2 border-dashed p-2.5 ${
                      snapshot.isDraggingOver
                        ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5"
                        : "border-gray-200 dark:border-[var(--color-rule)]"
                    }`}
                  >
                    {unranked.map((player, index) => (
                      <PlayerChip key={player.playerId} player={player} index={index} isDisabled={isSaving} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            <div className="flex flex-col gap-2.5">
              {Array.from({ length: RANK_COUNT }, (_, i) => i + 1).map((rank) => (
                <div key={rank} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    {rank}
                  </div>
                  <Droppable droppableId={rankDroppableId(rank)} direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex min-h-[52px] flex-1 flex-wrap gap-2 rounded-xl border-2 border-dashed p-2.5 ${
                          snapshot.isDraggingOver
                            ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5"
                            : "border-gray-200 dark:border-[var(--color-rule)]"
                        }`}
                      >
                        {byRank[rank].map((player, index) => (
                          <PlayerChip key={player.playerId} player={player} index={index} isDisabled={isSaving} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

export default PlayerRankBoard;
