import { useGetSystemSettingsQuery } from "../state/features/settings/settingsSlice";

/** Defaults to true while settings are loading so the auction UI doesn't flash hidden-then-shown. */
export default function useAuctionEnabled(): boolean {
    const { data } = useGetSystemSettingsQuery();
    return data?.content?.auctionEnabled ?? true;
}
