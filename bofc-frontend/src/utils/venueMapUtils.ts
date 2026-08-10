// Builds a clickable Google Maps URL for a venue. Prefers the admin-supplied
// map link; falls back to a maps search on the venue name alone (e.g.
// https://www.google.com/maps/search/?api=1&query=BJIT%20Turf%20Ground) so
// every venue is clickable even when nobody's added a link yet. Standard
// google.com/maps URLs are universal links - mobile browsers/OS hand off to
// the native Maps app automatically, no extra mobile-specific handling needed.
export function getVenueMapUrl(name?: string | null, address?: string | null, mapLink?: string | null): string {
    const trimmedLink = mapLink?.trim();
    if (trimmedLink) return trimmedLink;

    const query = (name || address || "").trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
