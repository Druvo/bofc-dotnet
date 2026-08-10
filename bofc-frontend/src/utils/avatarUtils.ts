// A small, fixed palette pulled from the app's own design tokens (brand
// green/gold plus the existing semantic colors), used to tint the accent
// (currentColor) parts of the fallback illustration per player.
const AVATAR_PALETTE: { bg: string; fg: string }[] = [
    { bg: "#28552B", fg: "#EAF1EA" }, // brand green
    { bg: "#B69549", fg: "#3A2E12" }, // gold
    { bg: "#0BA5EC", fg: "#04283C" }, // info blue
    { bg: "#7A5AF8", fg: "#F1EEFE" }, // purple
    { bg: "#E0736B", fg: "#3A0F0C" }, // coral
    { bg: "#0D9488", fg: "#DFF7F4" }, // teal
    { bg: "#F59E0B", fg: "#3A2506" }, // amber
    { bg: "#547A55", fg: "#0C170D" }, // soft green
];

// One of these unDraw illustrations is shown per player instead of the same
// generic placeholder icon. Restricted to male-presenting illustrations since
// the roster is all male.
export const AVATAR_ILLUSTRATION_COUNT = 4;

export function getInitials(name?: string | null): string {
    const trimmed = name?.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

// Deterministic hash - same seed (player/team id, or name as a fallback)
// always lands on the same palette/illustration entry, so a given player's
// avatar stays stable across sessions instead of flickering on every render.
function hashSeed(seed: string | number): number {
    const str = String(seed);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export function getAvatarColors(seed: string | number): { bg: string; fg: string } {
    return AVATAR_PALETTE[hashSeed(seed) % AVATAR_PALETTE.length];
}

export function getAvatarIllustrationIndex(seed: string | number): number {
    return hashSeed(seed) % AVATAR_ILLUSTRATION_COUNT;
}
