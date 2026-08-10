import { MatchDayType } from "../state/features/fixtures/fixtureTypes";

/**
 * Match pairing structure for matchDay generation
 */
export interface MatchPairing {
  homeTeamId: number;
  awayTeamId: number;
  round?: number;
  groupName?: string;
}

/**
 * MatchDay duration estimation result
 */
export interface MatchDayDuration {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  matchesPerDay: number;
}

/**
 * Calculate the number of matches for a given matchDay type
 *
 * @param teamCount - Number of teams participating
 * @param matchDayType - Type of matchDay format
 * @returns Total number of matches
 */
export function calculateMatchCount(
  teamCount: number,
  matchDayType: MatchDayType
): number {
  const n = teamCount;

  if (n < 2) return 0;

  switch (matchDayType) {
    case MatchDayType.ROUND_ROBIN:
      // Each team plays every other team once
      // Formula: n × (n-1) / 2
      return (n * (n - 1)) / 2;

    case MatchDayType.DOUBLE_ROUND_ROBIN:
      // Each team plays every other team twice (home and away)
      // Formula: n × (n-1)
      return n * (n - 1);

    case MatchDayType.GROUP_STAGE:
      // Assume 4 groups with round-robin within each group
      const groupCount = Math.min(4, Math.floor(n / 2)); // At least 2 teams per group
      const teamsPerGroup = Math.ceil(n / groupCount);
      const matchesPerGroup = (teamsPerGroup * (teamsPerGroup - 1)) / 2;
      return groupCount * matchesPerGroup;

    case MatchDayType.KNOCKOUT:
      // Single elimination: n-1 matches total
      return n - 1;

    default:
      return 0;
  }
}

/**
 * Generate match pairings for round-robin matchDay
 * Each team plays every other team exactly once
 *
 * @param teamIds - Array of team IDs
 * @returns Array of match pairings
 */
export function generateRoundRobinPairings(teamIds: number[]): MatchPairing[] {
  const pairings: MatchPairing[] = [];

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairings.push({
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
      });
    }
  }

  return pairings;
}

/**
 * Generate match pairings for double round-robin matchDay
 * Each team plays every other team twice (home and away)
 *
 * @param teamIds - Array of team IDs
 * @returns Array of match pairings with round indicators
 */
export function generateDoubleRoundRobinPairings(teamIds: number[]): MatchPairing[] {
  const pairings: MatchPairing[] = [];

  // First leg (round 1) - Team A home
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairings.push({
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        round: 1,
      });
    }
  }

  // Second leg (round 2) - Team B home (reverse fixtures)
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairings.push({
        homeTeamId: teamIds[j],
        awayTeamId: teamIds[i],
        round: 2,
      });
    }
  }

  return pairings;
}

/**
 * Generate match pairings for group stage matchDay
 * Teams are divided into groups and play round-robin within each group
 *
 * @param teamIds - Array of team IDs
 * @param groupCount - Number of groups (default: 4)
 * @returns Array of match pairings with group names
 */
export function generateGroupStagePairings(
  teamIds: number[],
  groupCount: number = 4
): MatchPairing[] {
  const pairings: MatchPairing[] = [];

  // Ensure at least 2 teams per group
  const actualGroupCount = Math.min(groupCount, Math.floor(teamIds.length / 2));

  if (actualGroupCount < 1) return [];

  // Create group containers
  const groups: number[][] = Array.from({ length: actualGroupCount }, () => []);

  // Distribute teams into groups (snake draft style for fairness)
  teamIds.forEach((teamId, index) => {
    const groupIndex = index % actualGroupCount;
    groups[groupIndex].push(teamId);
  });

  // Generate pairings within each group
  groups.forEach((group, groupIndex) => {
    const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`; // 'A', 'B', 'C', 'D'

    // Round-robin within the group
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        pairings.push({
          homeTeamId: group[i],
          awayTeamId: group[j],
          groupName,
        });
      }
    }
  });

  return pairings;
}

/**
 * Generate match pairings for knockout (single elimination) matchDay
 * Losers are eliminated, winners advance to the next round
 *
 * @param teamIds - Array of team IDs
 * @returns Array of match pairings with round indicators
 */
export function generateKnockoutPairings(teamIds: number[]): MatchPairing[] {
  const pairings: MatchPairing[] = [];

  if (teamIds.length < 2) return [];

  // Find the nearest power of 2 (for bracket size)
  const nearestPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamIds.length)));

  // Calculate number of first-round byes
  const byeCount = nearestPowerOf2 - teamIds.length;
  const firstRoundMatches = (teamIds.length - byeCount) / 2;

  // First round pairings (excluding teams with byes)
  for (let i = 0; i < firstRoundMatches * 2; i += 2) {
    pairings.push({
      homeTeamId: teamIds[i],
      awayTeamId: teamIds[i + 1],
      round: 1,
    });
  }

  // Calculate subsequent rounds
  // Round 1: First round matches
  // Round 2: Quarter-finals (if applicable)
  // Round 3: Semi-finals
  // Round 4: Final

  let currentRoundTeams = Math.ceil(teamIds.length / 2); // Winners from round 1 + teams with byes
  let currentRound = 2;

  // Generate placeholder pairings for subsequent rounds
  while (currentRoundTeams > 1) {
    const matchesInRound = Math.floor(currentRoundTeams / 2);

    // Note: Actual team IDs will be determined after previous round completes
    // For now, we just create the structure with placeholders (-1)
    for (let i = 0; i < matchesInRound; i++) {
      pairings.push({
        homeTeamId: -1, // TBD: Winner of previous match
        awayTeamId: -1, // TBD: Winner of previous match
        round: currentRound,
      });
    }

    currentRoundTeams = matchesInRound;
    currentRound++;
  }

  return pairings;
}

/**
 * Estimate matchDay duration based on match count and scheduling parameters.
 *
 * Mirrors FixtureGenerationService.GenerateFixturesAsync on the backend: each match
 * occupies a slot of (duration + gap) minutes - timeGapMinutes is the time AFTER one
 * match ends and BEFORE the next starts, not the full start-to-start interval.
 *
 * @param matchCount - Total number of matches
 * @param timeGapMinutes - Minutes between the end of one match and the start of the next
 * @param matchDurationMinutes - Duration of each match in minutes
 * @param breakDurationMinutes - Extra one-time break inserted into the schedule, if any
 * @returns MatchDay duration estimation
 */
export function estimateMatchDayDuration(
  matchCount: number,
  timeGapMinutes: number,
  matchDurationMinutes: number,
  breakDurationMinutes = 0
): MatchDayDuration {
  const slotMinutes = matchDurationMinutes + timeGapMinutes;
  const totalMinutes = matchCount * slotMinutes + breakDurationMinutes;
  const totalHours = totalMinutes / 60;

  // Assume maximum 12 hours of play per day (reasonable operational hours)
  const maxMinutesPerDay = 12 * 60;
  const matchesPerDay = Math.max(1, Math.floor(maxMinutesPerDay / slotMinutes));

  // Calculate number of days needed
  const totalDays = Math.ceil(matchCount / matchesPerDay);

  return {
    totalMinutes,
    totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    totalDays,
    matchesPerDay,
  };
}

/**
 * Check if scheduling parameters are valid and safe. With the corrected model, the gap
 * is purely the breather AFTER a match - any non-negative value is valid; this only
 * nudges towards leaving at least a couple of minutes for teams to swap onto the pitch.
 *
 * @param timeGapMinutes - Minutes between the end of one match and the start of the next
 * @param matchDurationMinutes - Duration of each match
 * @returns Object with validation result and warning message
 */
export function validateSchedulingParameters(
  timeGapMinutes: number,
  matchDurationMinutes: number
): { isValid: boolean; warning?: string } {
  if (timeGapMinutes < 0 || matchDurationMinutes < 1) {
    return { isValid: false, warning: "Match duration and gap must be positive." };
  }

  if (timeGapMinutes === 0) {
    return {
      isValid: true,
      warning: "No gap between matches - the next match starts the instant the previous one ends.",
    };
  }

  return { isValid: true };
}

/**
 * A single generated match with computed start/end, matching the backend's
 * round-robin pairing + slot + one-time-break formula exactly (kept in sync with
 * FixtureGenerationService.GenerateFixturesAsync).
 */
export interface ScheduledMatch extends MatchPairing {
  matchNumber: number;
  start: Date;
  end: Date;
}

/**
 * Compute the real per-match schedule for a round-robin MatchDay - same formula as
 * FixtureGenerationService.GenerateFixturesAsync, so the preview always matches what
 * generation will actually produce.
 *
 * @param targetMatchCount - When larger than one full round-robin cycle, the cycle is repeated
 * to reach it - mirrors the backend's repeat-to-fill-the-MatchDay's-duration behavior instead
 * of previewing only the first (shorter) cycle.
 */
export function generateRoundRobinSchedule(
  teamIds: number[],
  startDateTime: Date,
  matchDurationMinutes: number,
  timeGapMinutes: number,
  breakAfterMatchNumber?: number,
  breakDurationMinutes = 0,
  targetMatchCount?: number
): ScheduledMatch[] {
  const basePairings = generateRoundRobinPairings(teamIds);
  const slotMinutes = matchDurationMinutes + timeGapMinutes;

  let pairings = basePairings;
  if (targetMatchCount && targetMatchCount > basePairings.length && basePairings.length > 0) {
    pairings = [];
    while (pairings.length < targetMatchCount) {
      pairings.push(...basePairings);
    }
    pairings = pairings.slice(0, targetMatchCount);
  }

  return pairings.map((pairing, index) => {
    const matchNumber = index + 1;
    const breakOffset = breakAfterMatchNumber && matchNumber > breakAfterMatchNumber ? breakDurationMinutes : 0;
    const offsetMinutes = index * slotMinutes + breakOffset;
    const start = new Date(startDateTime.getTime() + offsetMinutes * 60_000);
    const end = new Date(start.getTime() + matchDurationMinutes * 60_000);
    return { ...pairing, matchNumber, start, end };
  });
}

/**
 * Get matchDay type display name
 *
 * @param matchDayType - MatchDay type enum value
 * @returns Human-readable matchDay type name
 */
export function getMatchDayTypeName(matchDayType: MatchDayType): string {
  switch (matchDayType) {
    case MatchDayType.ROUND_ROBIN:
      return "Round Robin";
    case MatchDayType.DOUBLE_ROUND_ROBIN:
      return "Double Round Robin";
    case MatchDayType.GROUP_STAGE:
      return "Group Stage";
    case MatchDayType.KNOCKOUT:
      return "Knockout";
    default:
      return "Unknown";
  }
}

/**
 * Get matchDay type description
 *
 * @param matchDayType - MatchDay type enum value
 * @returns Description of the matchDay format
 */
export function getMatchDayTypeDescription(matchDayType: MatchDayType): string {
  switch (matchDayType) {
    case MatchDayType.ROUND_ROBIN:
      return "Each team plays every other team exactly once";
    case MatchDayType.DOUBLE_ROUND_ROBIN:
      return "Each team plays every other team twice (home and away)";
    case MatchDayType.GROUP_STAGE:
      return "Teams are divided into groups, playing round-robin within each group";
    case MatchDayType.KNOCKOUT:
      return "Single elimination - losers are eliminated, winners advance";
    default:
      return "";
  }
}
