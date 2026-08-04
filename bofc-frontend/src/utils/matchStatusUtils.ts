import { MatchStatus } from "../state/features/fixtures/fixtureTypes";

/**
 * Get color for match status badge
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case MatchStatus.SCHEDULED:
      return "gold";
    case MatchStatus.ONGOING:
      return "orange";
    case MatchStatus.PAUSED:
      return "purple";
    case MatchStatus.COMPLETED:
      return "green";
    default:
      return "default";
  }
}

/**
 * Check if a status transition is valid
 */
export function canTransitionStatus(
  currentStatus: string,
  targetStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    [MatchStatus.SCHEDULED]: [MatchStatus.ONGOING],
    [MatchStatus.ONGOING]: [MatchStatus.PAUSED, MatchStatus.COMPLETED],
    [MatchStatus.PAUSED]: [MatchStatus.ONGOING, MatchStatus.COMPLETED],
    [MatchStatus.COMPLETED]: [],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Format elapsed time in seconds to MM:SS format
 */
export function formatMatchTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format elapsed time to human readable format
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

/**
 * Get status badge text
 */
export function getStatusText(status: string): string {
  switch (status) {
    case MatchStatus.SCHEDULED:
      return "Scheduled";
    case MatchStatus.ONGOING:
      return "Ongoing";
    case MatchStatus.PAUSED:
      return "Paused";
    case MatchStatus.COMPLETED:
      return "Completed";
    default:
      return status;
  }
}

/**
 * Check if match is in progress
 */
export function isMatchInProgress(status: string): boolean {
  return status === MatchStatus.ONGOING;
}

/**
 * Check if match is paused
 */
export function isMatchPaused(status: string): boolean {
  return status === MatchStatus.PAUSED;
}

/**
 * Check if match is completed
 */
export function isMatchCompleted(status: string): boolean {
  return status === MatchStatus.COMPLETED;
}

/**
 * Check if match is scheduled
 */
export function isMatchScheduled(status: string): boolean {
  return status === MatchStatus.SCHEDULED;
}
