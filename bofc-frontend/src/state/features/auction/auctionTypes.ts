// === Enums ===
export type AuctionStatus = 'NOT_STARTED' | 'REGISTRATION_OPEN' | 'POOL_READY' | 'LIVE' | 'PAUSED' | 'COMPLETED';
export type AuctionPlayerStatus = 'AVAILABLE' | 'ON_AUCTION' | 'SOLD' | 'UNSOLD' | 'WITHDRAWN';
export type AuctionPlayerType = 'EXISTING' | 'OUTSIDE';
export type AuctionPlayerCategory = 'ICON' | 'A_GRADE' | 'B_GRADE' | 'EMERGING' | 'OUTSIDE';
export type AuctionSessionStatus = 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type FootballPosition = string;

// === Request Types ===
export interface AuctionSettingsRequest {
  teamBudget: number;
  minSquadSize: number;
  maxSquadSize: number;
  auctionTimerSeconds: number;
  bidIncrement: number;
  unsoldReauctionEnabled?: boolean;
  timerExtensionSeconds?: number;
  extendIfBidWithinLastSeconds?: number;
  minRoleRequirements?: string;
  scheduledStartTime?: string;
}

export interface AuctionRegistrationRequest {
  tournamentId: number;
  name: string;
  email: string;
  employeeId: string;
  teamsId?: string;
  mobileNo?: string;
  playingPosition?: string;
  availabilityStatus?: string;
  previousExperience?: string;
  profilePhoto?: string;
}

export interface AuctionPlayerRequest {
  playerId?: number;
  category: AuctionPlayerCategory;
  basePrice?: number;
}

export interface ApproveAndPoolRequest {
  category: AuctionPlayerCategory;
  basePrice: number;
}

export interface TeamBudgetRequest {
  teamId: number;
  ownerId: number;
  totalBudget?: number;
}

export interface BidRequest {
  auctionPlayerId: number;
  teamId: number;
  bidAmount: number;
}

// === Response Types ===
export interface AuctionSettingsResponse {
  id: number;
  tournamentId: number;
  teamBudget: number;
  minSquadSize: number;
  maxSquadSize: number;
  auctionTimerSeconds: number;
  bidIncrement: number;
  unsoldReauctionEnabled: boolean;
  timerExtensionSeconds: number;
  extendIfBidWithinLastSeconds: number;
  minRoleRequirements?: string;
  auctionStatus: AuctionStatus;
  scheduledStartTime?: string;
}

export interface AuctionRegistrationResponse {
  id: number;
  tournamentId: number;
  tournamentName: string;
  name: string;
  email: string;
  employeeId: string;
  teamsId?: string;
  mobileNo?: string;
  playingPosition?: FootballPosition;
  battingStyle?: string;
  bowlingStyle?: string;
  previousExperience?: string;
  availabilityStatus?: string;
  profilePhoto?: string;
  emergencyContact?: string;
  preferredBasePrice?: number;
  approvalStatus: ApprovalStatus;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdDate: string;
  createdPlayerId?: number;
  inAuctionPool: boolean;
}

export interface AuctionPlayerResponse {
  id: number;
  tournamentId: number;
  playerId: number;
  playerName: string;
  playerEmail?: string;
  photoUrl?: string;
  playingPosition?: FootballPosition;
  playerType: AuctionPlayerType;
  category: AuctionPlayerCategory;
  basePrice: number;
  currentBid?: number;
  currentHighestTeamId?: number;
  currentHighestTeamName?: string;
  soldToTeamId?: number;
  soldToTeamName?: string;
  finalPrice?: number;
  status: AuctionPlayerStatus;
  auctionRound?: number;
  playerRating?: number;
  sequenceOrder?: number;
}

export interface TeamBudgetResponse {
  id: number;
  tournamentId: number;
  teamId: number;
  teamName: string;
  ownerId: number;
  ownerName: string;
  totalBudget: number;
  remainingBudget: number;
  totalSpent: number;
  playersBought: number;
}

export interface BidResponse {
  id: number;
  auctionPlayerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  bidderId: number;
  bidderName: string;
  bidAmount: number;
  bidTime: string;
  isWinning: boolean;
}

export interface AuctionSessionResponse {
  id: number;
  tournamentId: number;
  status: AuctionSessionStatus;
  currentPlayer?: AuctionPlayerResponse;
  roundNumber: number;
  startedAt?: string;
  currentTimerEndsAt?: string;
  remainingSeconds?: number;
}

export interface AuctionStatsResponse {
  mostExpensivePlayerName?: string;
  mostExpensivePrice?: number;
  cheapestSoldPlayerName?: string;
  cheapestSoldPrice?: number;
  averageSalePrice?: number;
  totalMoneySpent: number;
  mostActiveBiddingTeam?: string;
  highestBidWarCount?: number;
  highestBidWarPlayerName?: string;
}

export interface AuctionDashboardResponse {
  session: AuctionSessionResponse;
  currentPlayer?: AuctionPlayerResponse;
  currentPlayerBids: BidResponse[];
  teamBudgets: TeamBudgetResponse[];
  soldPlayers: AuctionPlayerResponse[];
  unsoldPlayers: AuctionPlayerResponse[];
  statistics: AuctionStatsResponse;
  totalPlayers: number;
  soldCount: number;
  unsoldCount: number;
  remainingCount: number;
}

export interface AuctionResultResponse {
  tournamentId: number;
  tournamentName: string;
  teamSquads: TeamSquadResponse[];
  unsoldPlayers: AuctionPlayerResponse[];
  stats: AuctionStatsResponse;
}

export interface TeamSquadResponse {
  teamId: number;
  teamName: string;
  ownerName: string;
  totalSpent: number;
  remainingBudget: number;
  players: AuctionPlayerResponse[];
}

// === WebSocket Message ===
export interface AuctionWebSocketMessage {
  type: 'BID_PLACED' | 'PLAYER_SOLD' | 'PLAYER_UNSOLD' | 'NEXT_PLAYER' | 'AUCTION_STARTED' | 'AUCTION_PAUSED' | 'AUCTION_RESUMED' | 'AUCTION_ENDED' | 'TIMER_UPDATE' | 'PLAYER_SKIPPED' | 'BIDDING_RESTARTED' | 'SALE_UNDONE' | 'UNSOLD_ROUND_STARTED';
  tournamentId: number;
  payload: any;
}
