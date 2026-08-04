// Central place mapping semantic stat-tile tones (primary/success/error/
// warning/info) to fixed hex values. Introduced because 5 files
// (Players.tsx, LiveAuctionPage.tsx, AuctionTeamBudgetsPage.tsx,
// AuctionResultsPage.tsx, AuctionAdminApprovalPage.tsx) were each importing
// `theme` and destructuring the same 5 token names to color StatTile/segment
// accents — any future re-mapping (e.g. a different token for "warning")
// meant editing all 5. One hook, one place.
export const useStatTones = () => ({
  primary: "#28552B",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#0ba5ec",
});
