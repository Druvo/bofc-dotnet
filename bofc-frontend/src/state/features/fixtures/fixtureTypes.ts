import { BasicResType } from "../../responesTypes";

// Enums for match and event types
export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  ONGOING = "ONGOING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
}

export enum MatchEventType {
  GOAL = "GOAL",
  ASSIST = "ASSIST",
  RED_CARD = "RED_CARD",
  YELLOW_CARD = "YELLOW_CARD",
  SUBSTITUTION = "SUBSTITUTION",
  INJURY = "INJURY",
  MATCH_STARTED = "MATCH_STARTED",
  MATCH_COMPLETED = "MATCH_COMPLETED",
}

export enum TournamentType {
  ROUND_ROBIN = "ROUND_ROBIN",
  DOUBLE_ROUND_ROBIN = "DOUBLE_ROUND_ROBIN",
  GROUP_STAGE = "GROUP_STAGE",
  KNOCKOUT = "KNOCKOUT",
}

// Fixture/Match Types
export interface IFixture {
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
  endTime?: string | null;
  matchStatus: MatchStatus | string;
  homeTeamScore: number;
  awayTeamScore: number;
  homeJerseyColor?: string | null;
  awayJerseyColor?: string | null;
  homeYellowCards?: number;
  homeRedCards?: number;
  awayYellowCards?: number;
  awayRedCards?: number;
  matchOrder: number;
  round: number | null; // This is the roundNumber
  roundNumber?: number | null; // Explicit roundNumber field (if backend provides it separately)
  groupName: string | null;
  matchDurationMinutes?: number;
  elapsedTimeSeconds?: number;
  startedAt: string | null;
  completedAt: string | null;
  createdDate?: string;
  updatedDate?: string;
}

// Fixture List Response
export interface IGetFixturesResponse extends BasicResType {
  content: IFixture[];
  numberOfElement: number;
}

// Match Details Response
export interface IGetMatchResponse extends BasicResType {
  content: IFixture;
}

// Fixture Generation Request - Simplified API
export interface IFixtureGenerationRequest {
  tournamentId: number;
  teamIds: number[];
  matchDates: string[];
  timeGapMinutes?: number;
  matchDurationMinutes?: number;
  venueId?: number;
  tournamentType?: TournamentType;
  /** 1-based match number after which a one-time break is inserted. */
  breakAfterMatchNumber?: number;
  /** Length of that one-time break, in minutes. Ignored unless breakAfterMatchNumber is set. */
  breakDurationMinutes?: number;
}

// Match Statistics
export interface IMatchStatistics {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goalsScored: number;
  assists: number;
  redCards: number;
  yellowCards: number;
  substitutionIn?: number;
  substitutionOut?: number;
  minutesPlayed?: number;
}

// Match Statistics Response
export interface IGetMatchStatisticsResponse extends BasicResType {
  content: IMatchStatistics[];
  numberOfElement: number;
}

// Match Events Response
export interface IGetMatchEventsResponse extends BasicResType {
  content: IMatchEvent[];
  numberOfElement: number;
}

// Elapsed Time Response
export interface IGetElapsedTimeResponse extends BasicResType {
  content: {
    matchId: number;
    elapsedTimeSeconds: number;
    elapsedTimeMinutes: number;
    matchStatus: string;
  };
}

// Match Event Types
export interface IMatchEvent {
  id: number;
  matchId: number;
  eventType: MatchEventType | string;
  playerId?: number | null;  // Optional for system events (MATCH_STARTED, MATCH_COMPLETED)
  playerName?: string | null;  // Optional for system events
  teamId?: number | null;  // Optional for system events
  teamName?: string | null;  // Optional for system events
  eventTime: number;
  description?: string;
  relatedPlayerId?: number;
  relatedPlayerName?: string;
  details?: string;
  createdDate?: string;
}

// Match Event Request
export interface IRecordMatchEventRequest {
  matchId: number;
  eventType: MatchEventType | string;
  playerId: number;
  teamId: number;
  eventTime: number;
  description?: string;
  relatedPlayerId?: number;
  details?: string;
}

// Match Event Response
export interface IRecordMatchEventResponse extends BasicResType {
  content: IMatchEvent;
}

// Match Event Update Request
export interface IUpdateMatchEventRequest {
  eventTime: number;
  description?: string;
  details?: string;
}

// Match Event Update Response
export interface IUpdateMatchEventResponse extends BasicResType {
  content: IMatchEvent;
}

// Bulk Match Update
export interface IBulkMatchUpdateRequest {
  matchStatus?: MatchStatus | string;
  homeTeamScore?: number;
  awayTeamScore?: number;
  elapsedTimeSeconds?: number;
}

// Match Status Update Responses
export interface IStartMatchRequest {
  matchId: number;
  venueId?: number;
  matchDurationMinutes?: number;
}

export interface IStartMatchResponse extends BasicResType {
  content: IFixture;
}

export interface IPauseMatchResponse extends BasicResType {
  content: IFixture;
}

export interface IResumeMatchResponse extends BasicResType {
  content: IFixture;
}

export interface ICompleteMatchRequest {
  matchId: number;
  matchDurationMinutes?: number;
}

export interface ICompleteMatchResponse extends BasicResType {
  content: IFixture;
}

export interface IUpdateMatchResponse extends BasicResType {
  content: IFixture;
}

// Elapsed Time Update Response
export interface IUpdateElapsedTimeResponse extends BasicResType {}

// Score Update Response
export interface IUpdateScoreResponse extends BasicResType {}

// Update Fixture Response
export interface IUpdateFixtureResponse extends BasicResType {
  content: IFixture;
}

// Clear Fixtures Response
export interface IClearFixturesResponse extends BasicResType {}

// Delete Event Response
export interface IDeleteEventResponse extends BasicResType {}

// Create Match Request
export interface ICreateMatchRequest {
  tournamentId: number;
  roundId?: number;
  groupId?: number;
  homeTeamId: number;
  awayTeamId: number;
  matchDate: string;
  venueId?: number;
  matchOrder?: number;
  matchDurationMinutes?: number;
  groupName?: string;
  homeJerseyColor?: string;
  awayJerseyColor?: string;
}

// Create Match Response
export interface ICreateMatchResponse extends BasicResType {
  content: IFixture;
}

// Delete Match Response
export interface IDeleteMatchResponse extends BasicResType {}

// Match Order Update Request
export interface IMatchOrderUpdateRequest {
  matchOrders: Array<{
    matchId: number;
    matchOrder: number;
  }>;
}

// Match Order Update Response
export interface IMatchOrderUpdateResponse extends BasicResType {}

// If your API returns { content: IFixture }, you may need:
// export interface IFixtureResponse {
//   content: IFixture;
// }

// And update the query type in fixturesSlice.ts to:
// getFixtureById: builder.query<IFixtureResponse, { fixtureId: number }>({

// But based on the error, it seems the API returns IFixture directly, so the above changes should work.
