import IAcCollection from "../interfaces/IAcCollection";
import IPlayer from "../interfaces/IPlayer";

// SPEC: spec-334e33 — Payment Collections search by player name / employee ID.

type SearchablePlayer = Partial<Pick<IPlayer, "id" | "name" | "employeeId">>;

type SearchableCollection = Partial<Pick<IAcCollection, "transactionId" | "voucherCode" | "allPayersName">> & {
    players?: SearchablePlayer[] | null;
};

const contains = (value: unknown, q: string) =>
    typeof value === "string" ? value.toLowerCase().includes(q) : value != null && String(value).toLowerCase().includes(q);

/** True when the player's name or employee ID contains the text, ignoring case. */
export const matchesPlayerSearch = (player: SearchablePlayer | null | undefined, text: string): boolean => {
    const q = text.trim().toLowerCase();
    if (!q) return true;
    if (!player) return false;
    return contains(player.name, q) || contains(player.employeeId, q);
};

/**
 * True when the collection's transaction ID, voucher code, or any payer's name or employee ID
 * contains the text, ignoring case. Missing values never match and never throw.
 */
export const matchesCollectionSearch = (collection: SearchableCollection, text: string): boolean => {
    const q = text.trim().toLowerCase();
    if (!q) return true;
    if (contains(collection.transactionId, q) || contains(collection.voucherCode, q)) return true;
    if (contains(collection.allPayersName, q)) return true;
    const players = Array.isArray(collection.players) ? collection.players : [];
    return players.some((p) => matchesPlayerSearch(p, q));
};

/** Players matching the text, plus every already-selected player so a filter never drops a selection. */
export const filterPlayersKeepingSelected = <P extends SearchablePlayer>(players: P[], text: string, selectedIds: number[]): P[] => {
    if (!text.trim()) return players;
    const selected = new Set(selectedIds);
    return players.filter((p) => (p.id != null && selected.has(p.id)) || matchesPlayerSearch(p, text));
};
