import { useGetAuctionEnabledQuery } from "../state/features/settings/settingsSlice";

/** Defaults to true while settings are loading so the auction UI doesn't flash hidden-then-shown.
 * Uses the any-authenticated-user "auction-enabled" endpoint, not the admin-only GET /settings -
 * this hook runs unconditionally (e.g. Sidebar) for every logged-in user, so hitting the admin-only
 * endpoint 403'd on every page load for regular players. */
export default function useAuctionEnabled(): boolean {
    const { data } = useGetAuctionEnabledQuery();
    return data?.content ?? true;
}
