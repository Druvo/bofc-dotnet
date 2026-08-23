/** Short on-pitch labels for the backend's 12-value FootballPosition enum
 * (Domain/Enums/FootballPosition.cs) - used on Squad & Lineup pitch tokens and
 * bench rows instead of a generic GK/DEF/MID/FWD line label. */
const POSITION_ABBREVIATIONS: Record<string, string> = {
  UNASSIGNED: "-",
  GOALKEEPER: "GK",
  RIGHT_BACK: "RB",
  LEFT_BACK: "LB",
  CENTER_BACK_1: "CB",
  CENTER_BACK_2: "CB",
  DEFENSIVE_MIDFIELD: "DM",
  CENTRAL_MIDFIELD: "CM",
  ATTACKING_MIDFIELD: "AM",
  RIGHT_WING_FORWARD: "RW",
  LEFT_WING_FORWARD: "LW",
  STRIKER: "ST",
};

export function getPositionAbbreviation(position?: string | null): string {
  if (!position) return "-";
  return POSITION_ABBREVIATIONS[position] || "-";
}

/** Mirrors FootballPositionExtensions.BuildDescriptions() on the backend - kept as a static
 * list (not fetched from GET /football-positions) since this enum is a fixed, rarely-changed
 * set and the Squad & Lineup position picker needs it synchronously alongside pitch tokens. */
export const POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "UNASSIGNED", label: "Unassigned" },
  { value: "GOALKEEPER", label: "Goalkeeper" },
  { value: "RIGHT_BACK", label: "Right Back" },
  { value: "LEFT_BACK", label: "Left Back" },
  { value: "CENTER_BACK_1", label: "Center Back" },
  { value: "CENTER_BACK_2", label: "Center Back" },
  { value: "DEFENSIVE_MIDFIELD", label: "Defensive Midfield" },
  { value: "CENTRAL_MIDFIELD", label: "Central Midfield" },
  { value: "ATTACKING_MIDFIELD", label: "Attacking Midfield" },
  { value: "RIGHT_WING_FORWARD", label: "Right Wing/Forward" },
  { value: "LEFT_WING_FORWARD", label: "Left Wing/Forward" },
  { value: "STRIKER", label: "Striker" },
];
