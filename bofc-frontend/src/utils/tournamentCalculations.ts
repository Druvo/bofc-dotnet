import { TournamentType } from "../state/features/fixtures/fixtureTypes";

/**
 * Match pairing structure for tournament generation
 */
export interface MatchPairing {
  homeTeamId: number;
  awayTeamId: number;
  round?: number;
  groupName?: string;
}

/**
 * Tournament duration estimation result
 */
export interface TournamentDuration {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  matchesPerDay: number;
}

/**
 * Calculate the number of matches for a given tournament type
 *
 * @param teamCount - Number of teams participating
 * @param tournamentType - Type of tournament format
 * @returns Total number of matches
 */
export function calculateMatchCount(
  teamCount: number,
  tournamentType: TournamentType
): number {
  const n = teamCount;

  if (n < 2) return 0;

  switch (tournamentType) {
    case TournamentType.ROUND_ROBIN:
      // Each team plays every other team once
      // Formula: n × (n-1) / 2
      return (n * (n - 1)) / 2;

    case TournamentType.DOUBLE_ROUND_ROBIN:
      // Each team plays every other team twice (home and away)
      // Formula: n × (n-1)
      return n * (n - 1);

    case TournamentType.GROUP_STAGE:
      // Assume 4 groups with round-robin within each group
      const groupCount = Math.min(4, Math.floor(n / 2)); // At least 2 teams per group
      const teamsPerGroup = Math.ceil(n / groupCount);
      const matchesPerGroup = (teamsPerGroup * (teamsPerGroup - 1)) / 2;
      return groupCount * matchesPerGroup;

    case TournamentType.KNOCKOUT:
      // Single elimination: n-1 matches total
      return n - 1;

    default:
      return 0;
  }
}

/**
 * Generate match pairings for round-robin tournament
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
 * Generate match pairings for double round-robin tournament
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
 * Generate match pairings for group stage tournament
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
 * Generate match pairings for knockout (single elimination) tournament
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
 * Estimate tournament duration based on match count and scheduling parameters
 *
 * @param matchCount - Total number of matches
 * @param timeGapMinutes - Minutes between the start of consecutive matches
 * @param matchDurationMinutes - Duration of each match in minutes
 * @returns Tournament duration estimation
 */
export function estimateTournamentDuration(
  matchCount: number,
  timeGapMinutes: number,
  matchDurationMinutes: number
): TournamentDuration {
  // Total time needed for all matches (based on time gap between starts)
  const totalMinutes = matchCount * timeGapMinutes;
  const totalHours = totalMinutes / 60;

  // Assume maximum 12 hours of play per day (reasonable operational hours)
  const maxMinutesPerDay = 12 * 60;
  const matchesPerDay = Math.floor(maxMinutesPerDay / timeGapMinutes);

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
 * Check if scheduling parameters are valid and safe
 *
 * @param timeGapMinutes - Minutes between matches
 * @param matchDurationMinutes - Duration of each match
 * @returns Object with validation result and warning message
 */
export function validateSchedulingParameters(
  timeGapMinutes: number,
  matchDurationMinutes: number
): { isValid: boolean; warning?: string } {
  // Warning if time gap is less than match duration (matches will overlap)
  if (timeGapMinutes < matchDurationMinutes) {
    return {
      isValid: false,
      warning: `Time gap (${timeGapMinutes} min) is less than match duration (${matchDurationMinutes} min). Matches will overlap!`,
    };
  }

  // Warning if very short time gap (less than match duration + 15 min buffer)
  if (timeGapMinutes < matchDurationMinutes + 15) {
    return {
      isValid: true,
      warning: `Very short time gap. Consider allowing at least 15 minutes between matches for setup and breaks.`,
    };
  }

  return { isValid: true };
}

/**
 * Get tournament type display name
 *
 * @param tournamentType - Tournament type enum value
 * @returns Human-readable tournament type name
 */
export function getTournamentTypeName(tournamentType: TournamentType): string {
  switch (tournamentType) {
    case TournamentType.ROUND_ROBIN:
      return "Round Robin";
    case TournamentType.DOUBLE_ROUND_ROBIN:
      return "Double Round Robin";
    case TournamentType.GROUP_STAGE:
      return "Group Stage";
    case TournamentType.KNOCKOUT:
      return "Knockout";
    default:
      return "Unknown";
  }
}

/**
 * Get tournament type description
 *
 * @param tournamentType - Tournament type enum value
 * @returns Description of the tournament format
 */
export function getTournamentTypeDescription(tournamentType: TournamentType): string {
  switch (tournamentType) {
    case TournamentType.ROUND_ROBIN:
      return "Each team plays every other team exactly once";
    case TournamentType.DOUBLE_ROUND_ROBIN:
      return "Each team plays every other team twice (home and away)";
    case TournamentType.GROUP_STAGE:
      return "Teams are divided into groups, playing round-robin within each group";
    case TournamentType.KNOCKOUT:
      return "Single elimination - losers are eliminated, winners advance";
    default:
      return "";
  }
}
