import {
  countPlayersByStatus,
  getPlayerStatus,
  matchesStatusFilter,
  playersForCollectionPicker,
  PlayerStatusFilter,
} from "./playerStatus";

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

/**
 * SPEC: spec-648c30. The bug: the payment collection form offered every player from
 * GET /players, inactive and paused ones included.
 */
describe("collection form player picker", () => {
  const roster = [
    { id: 1, name: "active", active: true, paused: false },
    { id: 2, name: "active, paused undefined", active: true },
    { id: 3, name: "paused", active: true, paused: true },
    { id: 4, name: "inactive", active: false, paused: false },
    { id: 5, name: "inactive and paused", active: false, paused: true },
  ];
  const offered = (selected: number[]) => playersForCollectionPicker(roster, selected).map((p) => p.name);

  it("offers only Active players on a new collection", () => {
    expect(offered([])).toEqual(["active", "active, paused undefined"]);
  });

  it("keeps an edited collection's payers even when they are now paused or inactive", () => {
    expect(offered([3, 5])).toEqual(["active", "active, paused undefined", "paused", "inactive and paused"]);
  });
});
