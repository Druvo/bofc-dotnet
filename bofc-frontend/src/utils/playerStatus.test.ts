import { countPlayersByStatus, getPlayerStatus, matchesStatusFilter, PlayerStatusFilter } from "./playerStatus";

/**
 * SPEC: spec-3c0385. The bug: the Players tab's Active filter checked only `active`, so a player
 * who was active but paused sat under Active while their badge said Paused, and there was no
 * Paused filter at all.
 */

const players = [
  { name: "active", active: true, paused: false },
  { name: "active, paused undefined", active: true },
  { name: "paused", active: true, paused: true },
  { name: "inactive", active: false, paused: false },
  { name: "inactive and paused", active: false, paused: true },
];

const namesUnder = (filter: PlayerStatusFilter) =>
  players.filter((p) => matchesStatusFilter(p, filter)).map((p) => p.name);

describe("player status filters", () => {
  it("keeps paused players out of Active", () => {
    expect(namesUnder("active")).toEqual(["active", "active, paused undefined"]);
  });

  it("lists only active-and-paused players under Paused", () => {
    expect(namesUnder("paused")).toEqual(["paused"]);
  });

  it("lists every inactive player under Inactive, paused or not", () => {
    expect(namesUnder("inactive")).toEqual(["inactive", "inactive and paused"]);
  });

  it("lists everyone under All", () => {
    expect(namesUnder("all")).toHaveLength(players.length);
  });

  it("resolves status Inactive, then Paused, then Active", () => {
    expect(getPlayerStatus({ active: false, paused: true })).toBe("inactive");
    expect(getPlayerStatus({ active: true, paused: true })).toBe("paused");
    expect(getPlayerStatus({ active: true, paused: false })).toBe("active");
  });

  it("puts each player under exactly the one tab their badge shows", () => {
    players.forEach((p) => {
      const tabs = (["active", "paused", "inactive"] as const).filter((f) => matchesStatusFilter(p, f));
      expect(tabs).toEqual([getPlayerStatus(p)]);
    });
  });

  it("counts add up: active + paused + inactive equals all", () => {
    const counts = countPlayersByStatus(players);
    expect(counts).toEqual({ all: 5, active: 2, paused: 1, inactive: 2 });
    expect(counts.active + counts.paused + counts.inactive).toBe(counts.all);
  });
});
