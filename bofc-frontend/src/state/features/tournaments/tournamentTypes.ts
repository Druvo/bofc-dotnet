import { BasicResType } from "../../responesTypes";

export interface IoTournamentSingleSummaryType {
    id: number;
    name: string;
    tournamentDate: string;
    venueName: string;
    venueMapLink?: string;
    activeStatus: boolean;
    defaultTournament?: boolean;
    tournamentStatus?: string;
    auctionMode?: boolean;
    season?: string;
    description?: string;
    rules?: string;
    roadmapImageUrl?: string;
}

export interface getSingleTournamentInfoType extends BasicResType {
    content: IoTournamentSingleSummaryType;
}

export interface TournamentPlayerInfoType {
    id?: number;
    playerId: number;
    playerName: string;
    employeeId: string;
    participationStatus: boolean;
    comments: string;
    tournamentParticipantId: number;
    playingPosition?: string;
    tournamentStatus?: string;
    isCaptain?: boolean;
    teamPlayerRole?: string;
    jerseyNumber?: number;
    photoUrl?: string;
    photoKey?: string;
}

export interface IoTournamentSummaryResType extends BasicResType {
    content: {
        tournaments: IoTournamentSingleSummaryType[];
        totalCount: number;
    };
}

export interface NextTournamentResType {
    timeStamp: string;
    statusCode: number;
    status: boolean;
    message: string;
    content: {
        tournamentId: number;
        tournamentName: string;
        tournamentDate: string;
        totalParticipants: number;
        players: TournamentPlayerInfoType[];
    };
}

export interface TournamentSummeryResType {
    timeStamp: string;
    statusCode: number;
    status: boolean;
    message: string;
    content: [
        {
            id: number;
            tournamentName: string;
            name?: string;
            title?: string;
            season?: string;
            description?: string;
            rules?: string;
            roadmapImageUrl?: string;
            tournamentDate: string;
            venueName: string;
            venueMapLink?: string;
            activeStatus: boolean;
            teams: [
                {
                    teamId: number;
                    teamName: string;
                    logoKey?: string;
                    logoUrl?: string;
                    players: TournamentPlayerInfoType[];
                }
            ];
        }
    ];
}

export interface PlayerListToAddToTeamType extends BasicResType {
    content: TournamentPlayerInfoType[];
}

export interface TournamentGoalKeeperInfoType extends BasicResType {
    content: [
        {
            playerId: number;
            playerName: string;
            goalkeeperCount: number;
        }
    ];
}

export interface TournamentGoalKeeperHistoryInfoType extends BasicResType {
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

export interface LatestTournamentWithUserStatusType extends BasicResType {
    content: {
        tournament: {
            id: number;
            name: string;
            tournamentDate: string;
            venueName: string;
            venueMapLink?: string;
            activeStatus: boolean;
            tournamentStatus: string;
        };
        totalParticipant: number;
        remainParticipant: number;
        totalPlayer: number;
        isUserParticipated: boolean | null;
        tournamentParticipantId?: number;
    };
}

export interface TournamentSessionsResType extends BasicResType {
    content: string[];
}

export interface TournamentListItemType {
    id: number;
    name: string;
    tournamentDate: string;
}

export interface TournamentListResType extends BasicResType {
    content: TournamentListItemType[];
}
