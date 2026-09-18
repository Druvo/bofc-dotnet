interface IPlayer {
    id: number;
    name: string;
    email: string;
    employeeId: string;
    fullName: string;
    teamsId: string;
    mobileNo: string;
    profilePhoto?: string;
    active: Boolean;
    /** Temporarily away - keeps their history and their place in this list, but is not counted
     *  in a Match Day's expected turnout and receives no reminders. */
    paused?: boolean;
    playingPosition?: string;
    jerseyNumber?: number;
    createdDate: Date;
    updatedDate: Date;
    roles?: Array<{
        id: number;
        name: string;
    }>;
    photoKey?: string;
    photoUrl?: string;
    themePreference?: "light" | "dark" | null;
    emailNotificationsEnabled: boolean;
}

export default IPlayer;
