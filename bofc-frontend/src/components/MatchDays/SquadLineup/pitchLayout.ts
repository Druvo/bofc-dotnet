/** Pure layout math for the Squad & Lineup pitch — no React/DOM here, just the
 * formula derived from design_handoff_squad_lineup's worked example (5-a-side,
 * "2-1-1": lines at top 62/38/14%, a 2-player line at left 25/75%). */

export interface PitchSlot {
  left: number;
  top: number;
}

export const SQUAD_SIZES = [5, 7, 9, 11] as const;

export const FORMATION_PRESETS: Record<number, string[]> = {
  5: ["2-1-1", "1-2-1", "1-1-2", "2-2"],
  7: ["3-2-1", "2-3-1", "2-2-2", "3-1-2"],
  9: ["3-3-2", "4-2-2", "3-2-3", "4-3-1"],
  11: ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1"],
};

export function parseFormation(formation: string): number[] {
  return formation
    .split("-")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function validateFormation(formation: string, squadSize: number): string | null {
  const lines = parseFormation(formation);
  if (lines.length === 0) return "Enter a formation like 4-3-2";
  const total = lines.reduce((sum, n) => sum + n, 0);
  const outfield = squadSize - 1;
  if (total !== outfield) return `Must total ${outfield} outfield players`;
  return null;
}

/** Goalkeeper is always slot 0, fixed at the bottom-center. Every other starter's
 * slot is derived purely from squadSize + formation (not from the player's real
 * position) — same manual-arrangement flexibility as the design doc. */
export function computeSlots(squadSize: number, formation: string): PitchSlot[] {
  const lines = parseFormation(formation);
  const slots: PitchSlot[] = [{ left: 50, top: 88 }]; // goalkeeper

  const lineCount = lines.length;
  lines.forEach((count, lineIndex) => {
    const top = lineCount === 1 ? 38 : 62 - lineIndex * (48 / (lineCount - 1));
    for (let j = 0; j < count; j++) {
      const left = count === 1 ? 50 : 25 + j * (50 / (count - 1));
      slots.push({ left, top });
    }
  });

  return slots.slice(0, squadSize);
}
