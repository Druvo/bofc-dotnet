export function getPlayerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** First name (or first word) only — pitch tokens show just this under the avatar. */
export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
