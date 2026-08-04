export interface PlayerStatistics {
    matchesPlayed: number;
    goalsScored: number;
    assists: number;
    goalsAndAssists: number;
    yellowCards: number;
    redCards: number;
}

export interface PlayerStatisticsResponse {
    playerId: number;
    playerName: string;
    position: string;
    statistics: PlayerStatistics;
}

export interface PlayerStatisticsFilterRequest {
    tournamentId?: number;
    position?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
}
