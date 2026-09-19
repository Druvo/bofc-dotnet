import { BasicResType } from "../../responesTypes";

export interface IoMatchDaySingleSummaryType {
    id: number;
    name: string;
    matchDayDate: string;
    durationMinutes?: number | null;
    venueId?: number;
    venueName: string;
    venueMapLink?: string;
    activeStatus: boolean;
    defaultMatchDay?: boolean;
    matchDayStatus?: string;
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
        durationMinutes?: number | null;
        totalParticipants: number;
        players: MatchDayPlayerInfoType[];
        /** True once voting has closed for this MatchDay (admin-configured lock window before
         * kickoff, see Settings > Voting Lock) - Yes/No is disabled instead of erroring on click. */
        votingLocked?: boolean;
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
            durationMinutes?: number | null;
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
                    guests?: MatchDayGuestInfoType[];
                }
            ];
        }
    ];
}

export interface PlayerListToAddToTeamType extends BasicResType {
    content: MatchDayPlayerInfoType[];
}

/** A guest player: someone playing this one Match Day who is not a club member and has no
 * profile behind the name. teamId null means they are still in the Unassigned Pool. */
export interface MatchDayGuestInfoType {
    guestId: number;
    name: string;
    teamId?: number | null;
    matchDayId?: number;
}

export interface MatchDayGuestListType extends BasicResType {
    content: MatchDayGuestInfoType[];
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
        /** True once voting has closed for this MatchDay (admin-configured lock window before
         * kickoff, see Settings > Voting Lock) - Yes/No is disabled instead of erroring on click. */
        votingLocked?: boolean;
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
