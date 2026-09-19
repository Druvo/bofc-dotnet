// types.ts or types.d.ts

// Player Type
export interface Player {
    id?: number;
    playerId: number;
    playerName: string;
    playingPosition?: string;
    teamId?: number;
    isCaptain?: boolean;
    teamPlayerRole?: string;
    jerseyNumber?: number;
    photoUrl?: string;
    photoKey?: string;
}

// Guest Type - a name on the team sheet with no player profile behind it. Kept separate
// from Player rather than faked as one, so nothing that consumes Player (squad lineup,
// goalkeeper assignment, statistics, the edit-details modal) has to know guests exist.
export interface Guest {
    guestId: number;
    name: string;
    teamId?: number | null;
}

// Team Type
export interface Team {
    teamId: number;
    teamName: string;
    logoKey?: string;
    logoUrl?: string;
    players: Player[];
    guests: Guest[];
}

/** What the squad/line-up builder needs from a team. Guests never appear in a line-up, so
 * this deliberately stops short of the full Team: callers that read teams straight off the
 * Match Day summary (the public viewer) have no guest list to hand over and do not need one. */
export type LineupTeam = Pick<Team, "teamId" | "teamName" | "players">;

// DropResult Type (from react-beautiful-dnd)
export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    reason: "DROP" | "CANCEL";
    destination?: DraggableLocation;
    combine?: {
        draggableId: string;
        droppableId: string;
    };
    mode: "FLUID" | "SNAP";
}

export interface DraggableLocation {
    droppableId: string;
    index: number;
}
