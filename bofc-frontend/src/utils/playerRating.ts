import { IPlayerStatistics } from "../state/features/statistics/statisticsTypes";

// Transparent, real-stats-derived score (not fabricated) - a simple weighted
// formula over the same totals shown in the stat tiles, clamped to a
// familiar 0-10 scale.
export const computeRating = (s: IPlayerStatistics): number => {
    const raw = 6 + s.goalsScored * 0.4 + s.assists * 0.25 - s.yellowCards * 0.15 - s.redCards * 0.5;
    return Math.max(0, Math.min(10, raw));
};
