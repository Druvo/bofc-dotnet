import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetLatestMatchDayWithUserStatusQuery } from "../../state/features/matchDays/matchDaysSlice";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";

/**
 * Small header pill that surfaces "there's a live match right now" from
 * anywhere in the app — added so an admin buried in Finance work doesn't
 * have to navigate away to notice. Renders nothing when there's no active
 * matchDay or no match currently ONGOING/PAUSED.
 */
export default function LiveMatchIndicator({ isMobile }: { isMobile: boolean }) {
  const navigate = useNavigate();
  const { data: latest } = useGetLatestMatchDayWithUserStatusQuery();
  const matchDayId = latest?.content?.matchDay?.id;

  const { data: fixturesResponse } = useGetFixturesQuery(
    { matchDayId: matchDayId as number },
    { skip: !matchDayId }
  );

  const hasLiveMatch = useMemo(
    () =>
      (fixturesResponse?.content || []).some(
        (fixture) => fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED"
      ),
    [fixturesResponse]
  );

  if (!hasLiveMatch) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/match-day-viewer")}
      title="A match is live right now"
      className="relative flex h-16 items-center"
      style={{ padding: isMobile ? "0 10px" : "0 14px" }}
    >
      <span className="absolute -right-0.5 top-3.5 h-2 w-2 rounded-full bg-[#52c41a]" />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: "#52c41a" }}>LIVE</span>
    </button>
  );
}
