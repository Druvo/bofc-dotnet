// Manual Fixture System Types

// ===== Enums =====
export enum RoundType {
  GROUP_BASED = "GROUP_BASED",
  DIRECT_KNOCKOUT = "DIRECT_KNOCKOUT",
}

// RoundFormat enum removed - use FixtureFormat for match generation instead

export enum GroupFormat {
  MANUAL = "MANUAL",
  ROUND_ROBIN_SINGLE = "ROUND_ROBIN_SINGLE",
  ROUND_ROBIN_DOUBLE = "ROUND_ROBIN_DOUBLE",
  CUSTOM_MULTIPLE = "CUSTOM_MULTIPLE",
}

export enum TeamAssignmentType {
  MANUAL = "MANUAL",
  RULE_BASED = "RULE_BASED",
  PLACEHOLDER = "PLACEHOLDER",
}

export enum RoundStatus {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

// ===== Team Related Types =====
export interface TeamInGroupResponse {
  id: number | null;
  teamId?: number | null;
  teamName: string | null;
  isPlaceholder: boolean;
  placeholderName: string | null;
  seedPosition: number | null;
  assignmentType: TeamAssignmentType;
}

export interface GroupStandingResponse {
  id: number;
  groupId: number;
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  yellowCards: number;
  redCards: number;
  /** UEFA fair-play points (deductions; lower/more-negative is worse). */
  fairPlayPoints: number;
  /** Manual penalty-shootout tiebreak order (lower wins; null when unset). */
  tiebreakRank: number | null;
  position: number | null;
  isAdvanced: boolean;
}

// ===== Group Related Types =====
export interface RoundGroupResponse {
  id: number;
  roundId: number;
  parentGroupId?: number | null;
  childGroups?: RoundGroupResponse[] | null;
  groupName: string;
  groupFormat: GroupFormat;
  advancementRule: string | null;
  maxTeams: number | null;
  status: RoundStatus;
  teams: TeamInGroupResponse[];
  standings: GroupStandingResponse[] | null;
  totalMatches: number;
  completedMatches: number;
}

export interface RoundGroupRequest {
  roundId: number;
  parentGroupId?: number;
  groupName: string;
  groupFormat?: string;
  advancementRule?: string;
  maxTeams?: number;
}

// ===== Round Related Types =====
export interface TournamentRoundResponse {
  id: number;
  tournamentId: number;
  roundNumber: number;
  roundName: string;
  roundType: RoundType;
  advancementRule: string | null;
  status: RoundStatus;
  sequenceOrder: number;
  startDate: string | null;
  endDate: string | null;
  groups: RoundGroupResponse[];
  teams: TeamInGroupResponse[] | null;
  totalMatches: number;
  completedMatches: number;
  /**
   * IDs of the rounds that feed into this one (bracket logic-node edges).
   * Empty/absent for an entry round. Used to gate "Start Round" on the real
   * predecessors so parallel brackets (e.g. Cup vs Plate) stay independent.
   */
  sourceRoundIds?: number[];
}

export interface TournamentRoundRequest {
  tournamentId: number;
  roundNumber: number;
  roundName: string;
  roundType: string;
  advancementRule?: string;
  sequenceOrder: number;
  startDate?: string;
  endDate?: string;
}

// ===== Tournament Structure Types =====
export interface TournamentStructureResponse {
  tournamentId: number;
  tournamentName: string;
  sportType: string;
  tournamentType: string;
  status: string;
  rounds: TournamentRoundResponse[];
  totalRounds: number;
  totalMatches: number;
  completedMatches: number;
}

// ===== Team Assignment Types =====
export interface TeamAssignmentRequest {
  teamIds: number[];
}

export interface PlaceholderTeamRequest {
  groupId?: number;
  roundId?: number;
  placeholderName: string;
  sourceRule?: string;
}

// ===== Round Completion Types =====
export interface RoundCompletionRequest {
  roundId: number;
  recalculateStandings?: boolean;
  selectedTeamIds?: number[]; // Manual team selection for advancement (required for team advancement)
}

export interface AdvancedTeamInfo {
  teamId: number;
  teamName: string;
  fromGroup: string;
  position: number;
  points: number;
  assignedToSeed: number | null;
  advancementReason: string;
}

export interface AdvancedTeamsResponse {
  sourceRoundId: number;
  sourceRoundName: string;
  targetRoundId: number | null;
  targetRoundName: string | null;
  teamsAdvanced: number;
  teams: AdvancedTeamInfo[];
}

// ===== API Response Wrapper =====
export interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  content: T;
}

// ===== API Request/Response Types =====
export type GetRoundByIdResponse = ApiResponse<TournamentRoundResponse>;
export type GetRoundsByTournamentResponse = ApiResponse<TournamentRoundResponse[]>;
export type GetTournamentStructureResponse = ApiResponse<TournamentStructureResponse>;
export type CreateRoundResponse = ApiResponse<TournamentRoundResponse>;
export type UpdateRoundResponse = ApiResponse<TournamentRoundResponse>;
export type DeleteRoundResponse = ApiResponse<null>;
export type CompleteRoundResponse = ApiResponse<AdvancedTeamsResponse>;
export type GetNextRoundResponse = ApiResponse<TournamentRoundResponse>;
export type GetPreviousRoundResponse = ApiResponse<TournamentRoundResponse>;

export type GetGroupByIdResponse = ApiResponse<RoundGroupResponse>;
export type GetGroupsByRoundResponse = ApiResponse<RoundGroupResponse[]>;
export type CreateGroupResponse = ApiResponse<RoundGroupResponse>;
export type UpdateGroupResponse = ApiResponse<RoundGroupResponse>;
export type DeleteGroupResponse = ApiResponse<null>;
export type AssignTeamsResponse = ApiResponse<null>;
export type CreatePlaceholderResponse = ApiResponse<null>;
export type RemoveTeamResponse = ApiResponse<null>;
export type GetGroupStandingsResponse = ApiResponse<GroupStandingResponse[]>;
export type RecalculateStandingsResponse = ApiResponse<null>;

/** Teams listed in their final finishing order after a penalty shootout. */
export interface GroupTiebreakRequest {
  orderedTeamIds: number[];
}
export type ApplyGroupTiebreakResponse = ApiResponse<GroupStandingResponse[]>;

// ===== Round Match Generation Types =====
export type FixtureFormat = "SINGLE_ELIMINATION" | "ROUND_ROBIN" | "DOUBLE_ROUND_ROBIN";

export interface RoundMatchGenerationRequest {
  fixtureFormat: FixtureFormat;
  startDate: string; // ISO format: YYYY-MM-DDTHH:mm:ss
  matchTimeGapMinutes?: number;
  matchDurationMinutes?: number;
  venueId?: number;
  doubleRoundRobin?: boolean; // Only for ROUND_ROBIN format
}

export type GenerateRoundMatchesResponse = ApiResponse<IMatch[]>;

// ===== Match Related Types (for group fixtures) =====
export interface IMatch {
  id: number;
  tournamentId: number;
  tournamentName: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  venueId: number | null;
  venueName: string | null;
  venueMapLink?: string | null;
  matchDate: string;
  matchStatus: string;
  homeTeamScore: number;
  awayTeamScore: number;
  matchOrder: number;
  round: number | null;
  groupName: string | null;
  matchDurationMinutes?: number;
  elapsedTimeSeconds?: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface GroupMatchGenerationRequest {
  fixtureFormat: FixtureFormat;
  startDate: string;
  matchTimeGapMinutes?: number;
  matchDurationMinutes?: number;
  venueId?: number;
}

export type GenerateGroupMatchesResponse = ApiResponse<IMatch[]>;
export type GetGroupMatchesResponse = ApiResponse<IMatch[]>;
