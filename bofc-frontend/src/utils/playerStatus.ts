import IPlayer from "../interfaces/IPlayer";

// SPEC: spec-3c0385
export type PlayerStatus = "active" | "paused" | "inactive";
export type PlayerStatusFilter = "all" | PlayerStatus;

/**
 * One status per player, in the order the status badge shows it: Inactive first, then Paused,
 * then Active. Someone who has left is not merely away, so Inactive wins over Paused; a paused
 * player is still active, they are just not being asked. A missing `paused` reads as not paused.
 */
export const getPlayerStatus = (player: Pick<IPlayer, "active" | "paused">): PlayerStatus =>
  !player.active ? "inactive" : player.paused ? "paused" : "active";

export const matchesStatusFilter = (player: Pick<IPlayer, "active" | "paused">, filter: PlayerStatusFilter) =>
  filter === "all" || getPlayerStatus(player) === filter;

/** Counts per filter tab. active + paused + inactive always equals all. */
export const countPlayersByStatus = (players: Array<Pick<IPlayer, "active" | "paused">>) => {
  const counts: Record<PlayerStatusFilter, number> = { all: players.length, active: 0, paused: 0, inactive: 0 };
  players.forEach((player) => {
    counts[getPlayerStatus(player)] += 1;
  });
  return counts;
};
