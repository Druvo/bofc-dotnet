import { BasicResType } from "../../responesTypes";

export interface IoMatchDaySingleSummaryType {
    id: number;
    name: string;
    matchDayDate: string;
    durationMinutes?: number | null;
    venueName: string;
    venueMapLink?: string;
    activeStatus: boolean;
    defaultMatchDay?: boolean;
    matchDayStatus?: string;
    auctionMode?: boolean;
    season?: string;
    description?: string;
    rules?: string;
    roadmapImageUrl?: string;
    isWeeklyMatchDay?: boolean;
}

export interface getSingleMatchDayInfoType extends BasicResType {
    content: IoMatchDaySingleSummaryType;
}

export interface MatchDayPlayerInfoType {
    id?: number;
    playerId: number;
    playerName: string;
    employeeId: string;
    participationStatus: boolean;
    comments: string;
    matchDayParticipantId: number;
    playingPosition?: string;
    matchDayStatus?: string;
    isCaptain?: boolean;
    teamPlayerRole?: string;
    jerseyNumber?: number;
    photoUrl?: string;
    photoKey?: string;
}

export interface IoMatchDaySummaryResType extends BasicResType {
    content: {
        matchDays: IoMatchDaySingleSummaryType[];
        totalCount: number;
    };
}

export interface NextMatchDayResType {
    timeStamp: string;
    statusCode: number;
    status: boolean;
    message: string;
    content: {
        matchDayId: number;
        matchDayName: string;
        matchDayDate: string;
        totalParticipants: number;
        players: MatchDayPlayerInfoType[];
    };
}

export interface MatchDaySummeryResType {
    timeStamp: string;
    statusCode: number;
    status: boolean;
    message: string;
    content: [
        {
            id: number;
            matchDayName: string;
            name?: string;
            title?: string;
            season?: string;
            description?: string;
            rules?: string;
            roadmapImageUrl?: string;
            matchDayDate: string;
            venueName: string;
            venueMapLink?: string;
            activeStatus: boolean;
            isWeeklyMatchDay?: boolean;
            teams: [
                {
                    teamId: number;
                    teamName: string;
                    logoKey?: string;
                    logoUrl?: string;
                    players: MatchDayPlayerInfoType[];
                }
            ];
        }
    ];
}

export interface PlayerListToAddToTeamType extends BasicResType {
    content: MatchDayPlayerInfoType[];
}

export interface MatchDayGoalKeeperInfoType extends BasicResType {
    content: [
        {
            playerId: number;
            playerName: string;
            goalkeeperCount: number;
        }
    ];
}

export interface MatchDayGoalKeeperHistoryInfoType extends BasicResType {
    content: {
        [key: string]: [
            {
                playerId: number;
                playerName: string;
                roundNumber: number | null;
                playedDate: string | null;
            }
        ]; 
    };
}

export interface LatestMatchDayWithUserStatusType extends BasicResType {
    content: {
        matchDay: {
            id: number;
            name: string;
            matchDayDate: string;
            durationMinutes?: number | null;
            venueName: string;
            venueMapLink?: string;
            activeStatus: boolean;
            matchDayStatus: string;
        };
        totalParticipant: number;
        remainParticipant: number;
        totalPlayer: number;
        isUserParticipated: boolean | null;
        matchDayParticipantId?: number;
    };
}

export interface MatchDaySessionsResType extends BasicResType {
    content: string[];
}

export interface MatchDayListItemType {
    id: number;
    name: string;
    matchDayDate: string;
}

export interface MatchDayListResType extends BasicResType {
    content: MatchDayListItemType[];
}

export interface CurrentMatchDayType {
    id: number;
    name: string;
    matchDayDate: string;
    durationMinutes?: number | null;
    venueName: string;
    venueMapLink?: string;
    activeStatus: boolean;
    matchDayStatus: string;
    isWeeklyMatchDay: boolean;
}

export interface CurrentMatchDayResType extends BasicResType {
    content: CurrentMatchDayType | null;
}
