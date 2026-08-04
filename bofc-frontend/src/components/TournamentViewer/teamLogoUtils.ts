import { API_URL } from "../../settings";

export const toAbsoluteLogoUrl = (logoUrl?: string | null) => {
  if (!logoUrl) return undefined;
  if (logoUrl.startsWith("http")) return logoUrl;
  return `${API_URL}${logoUrl}`;
};

export const getTeamInitials = (teamName?: string | null, fallback = "?") => {
  if (!teamName) return fallback;

  return (
    teamName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || fallback
  );
};

export const getTeamLogoUrlFromSummary = (tournamentSummary: any, teamId?: number) => {
  if (!tournamentSummary?.content?.[0]?.teams || teamId == null) {
    return undefined;
  }

  const team = tournamentSummary.content[0].teams.find((item: any) => item.teamId === teamId);
  return toAbsoluteLogoUrl(team?.logoUrl);
};
