import { BasicResType } from "../../responesTypes";

export enum PrizeType {
  TEAM = "TEAM",
  PLAYER = "PLAYER",
}

export enum PrizeCategory {
  // Team prizes
  CHAMPION = "CHAMPION",
  RUNNER_UP = "RUNNER_UP",
  THIRD_PLACE = "THIRD_PLACE",
  FOURTH_PLACE = "FOURTH_PLACE",

  // Player prizes
  TOP_SCORER = "TOP_SCORER",
  GOLDEN_BOOT = "GOLDEN_BOOT",
  BEST_PLAYER = "BEST_PLAYER",
  PLAYER_OF_MATCH_DAY = "PLAYER_OF_MATCH_DAY",
  TOP_ASSIST_PROVIDER = "TOP_ASSIST_PROVIDER",
  BEST_GOALKEEPER = "BEST_GOALKEEPER",
  BEST_DEFENDER = "BEST_DEFENDER",
  FAIR_PLAY_AWARD = "FAIR_PLAY_AWARD",
  YOUNG_PLAYER_AWARD = "YOUNG_PLAYER_AWARD",

  CUSTOM = "CUSTOM",
}

export interface MatchDayPrize {
  id: number;
  matchDayId: number;
  matchDayName: string;
  prizeType: PrizeType;

  // Team info (if team prize)
  teamId?: number;
  teamName?: string;

  // Player info (if player prize)
  playerId?: number;
  playerName?: string;
  playerEmployeeId?: string;

  positionRank: number;
  prizeAmount?: number;
  prizeCategory: PrizeCategory;
  description?: string;
  imageLinks?: string[];

  createdDate: string;
  updatedDate?: string;
}

export interface MatchDayPrizeRequest {
  matchDayId: number;
  prizeType: PrizeType;
  teamId?: number;
  playerId?: number;
  positionRank: number;
  prizeAmount?: number;
  prizeCategory: PrizeCategory;
  description?: string;
  imageLinks?: string[];
}

export interface GetMatchDayPrizesResponse extends BasicResType {
  content: MatchDayPrize[];
}

export interface GetMatchDayPrizeResponse extends BasicResType {
  content: MatchDayPrize;
}

// Helper type for form data
export interface PrizeFormData {
  prizeType: PrizeType;
  teamId?: number;
  playerId?: number;
  positionRank: number;
  prizeAmount?: number;
  prizeCategory: PrizeCategory;
  description?: string;
  imageLinks?: string[];
}
