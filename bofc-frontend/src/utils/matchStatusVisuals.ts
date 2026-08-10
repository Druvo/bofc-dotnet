import { MatchStatus } from "../state/features/fixtures/fixtureTypes";

/**
 * Single source of truth for what each match status looks like - SCHEDULED/ONGOING/PAUSED/
 * COMPLETED previously had 3 independently-hardcoded color mappings (matchStatusUtils.getStatusColor's
 * antd color names, FixturesTable's own ui/Badge variant map, and FixturesCalendarView's/
 * FixturesTimelineView's own hex maps) that disagreed with each other - e.g. ONGOING showed
 * green in the table view but orange everywhere else, and PAUSED showed orange in the table but
 * purple everywhere else. Every consumer should derive from this map instead of hardcoding its
 * own.
 */
export const MATCH_STATUS_VISUALS: Record<
    string,
    { antdColor: string; hex: string; badgeVariant: "primary" | "success" | "error" | "warning" | "info" | "light" }
> = {
    [MatchStatus.SCHEDULED]: { antdColor: "gold", hex: "#faad14", badgeVariant: "info" },
    [MatchStatus.ONGOING]: { antdColor: "orange", hex: "#fa8c16", badgeVariant: "warning" },
    [MatchStatus.PAUSED]: { antdColor: "purple", hex: "#722ed1", badgeVariant: "primary" },
    [MatchStatus.COMPLETED]: { antdColor: "green", hex: "#52c41a", badgeVariant: "success" },
};

const DEFAULT_VISUAL = { antdColor: "default", hex: "#8c8c8c", badgeVariant: "light" as const };

export const getMatchStatusVisual = (status: string) => MATCH_STATUS_VISUALS[status] ?? DEFAULT_VISUAL;
