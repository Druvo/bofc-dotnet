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
    /** 1-10, 1 = strongest; null = unranked. Only sent to organisers - always null otherwise. */
    rank?: number | null;
}

/** Same 1-10 tier scale as the player rank board, so "Generate Teams" can weigh guests and
 * members against each other. The empty value is "unranked", which the draft treats as the
 * weakest tier. */
export const GUEST_RANK_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Unranked" },
    ...Array.from({ length: 10 }, (_, i) => ({
        value: String(i + 1),
        label: i === 0 ? "1 (strongest)" : i === 9 ? "10 (weakest)" : String(i + 1),
    })),
];

export const parseGuestRank = (value: string): number | null => (value === "" ? null : Number(value));

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
