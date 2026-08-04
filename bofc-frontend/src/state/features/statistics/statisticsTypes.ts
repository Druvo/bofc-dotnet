// Statistics API Response Types

export interface IMatchStatistics {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goalsScored: number;
  assists: number;
  redCards: number;
  yellowCards: number;
  substitutionIn: number;
  substitutionOut: number;
  minutesPlayed: number;
}

export interface ITournamentStanding {
  teamId: number;
  teamName: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  yellowCards?: number;
  redCards?: number;
}

// Response wrappers
export interface IGetTournamentStandingsResponse {
  status: string;
  message: string;
  content: ITournamentStanding[];
}

export interface ITournamentTopScorer {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  position: string;
  goalsScored: number;
  assists: number;
  matchesPlayed: number;
}

export interface IGetTopScorersResponse {
  status: string;
  message: string;
  content: ITournamentTopScorer[];
}

export interface IGetTopAssistsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetTopCardsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetMatchStatisticsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetPlayerTournamentStatisticsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IPlayerStatistics {
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  goalsAndAssists: number;
  yellowCards: number;
  redCards: number;
}

export interface IPlayerStatisticsData {
  playerId: number;
  playerName: string;
  position: string;
  statistics: IPlayerStatistics;
}

export interface IGetPlayerStatisticsResponse {
  timeStamp: number;
  statusCode: number;
  status: string;
  message: string;
  content: IPlayerStatisticsData[];
}

export interface IPlayerMatchHistory {
  matchId: number;
  matchDate: string;
  tournamentName?: string;
  teamId?: number;
  teamName?: string;
  opponentTeamName?: string;
  teamScore: number;
  opponentScore: number;
  result: "WIN" | "DRAW" | "LOSS";
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

export interface IGetPlayerMatchHistoryResponse {
  timeStamp: number;
  statusCode: number;
  status: string;
  message: string;
  content: IPlayerMatchHistory[];
}
