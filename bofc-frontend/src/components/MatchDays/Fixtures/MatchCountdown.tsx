import { useState, useEffect } from "react";
import { Typography } from "antd";
import moment from "moment";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { club } from "../../../theme/clubTheme";

const { Text } = Typography;

interface MatchCountdownProps {
  fixture: IFixture;
}

export default function MatchCountdown({ fixture }: MatchCountdownProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [displayTime, setDisplayTime] = useState("00:00");
  const totalDuration = fixture.matchDurationMinutes || 90;

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Calculate elapsed time based on match status and start time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (fixture.matchStatus === "ONGOING" && fixture.startedAt) {
      const startTime = moment.utc(fixture.startedAt).local().valueOf();
      const initialElapsed = fixture.elapsedTimeSeconds || 0;

      const calculateElapsedTime = () => {
        const now = Date.now();
        const timeSinceStart = Math.floor((now - startTime) / 1000);
        // Cap at 120 minutes, matching ElectricTeamBanner/QuickEventRecorder's clocks for the
        // same match — without this cap, a match left ONGOING past 120 minutes shows a
        // different elapsed time here than on those other views of the same match.
        const totalElapsed = Math.min(initialElapsed + timeSinceStart, 7200);
        setElapsedTime(totalElapsed);
        setDisplayTime(formatTime(totalElapsed));
      };

      calculateElapsedTime();
      interval = setInterval(calculateElapsedTime, 1000);
    } else if (fixture.matchStatus === "PAUSED") {
      const pausedTime = fixture.elapsedTimeSeconds || 0;
      setElapsedTime(pausedTime);
      setDisplayTime(formatTime(pausedTime));
    } else if (fixture.matchStatus === "COMPLETED") {
      // Calculate actual time played from startedAt to completedAt
      let finalTime = fixture.elapsedTimeSeconds || 0;

      if (fixture.startedAt && fixture.completedAt) {
        const startTime = moment.utc(fixture.startedAt).local().valueOf();
        const endTime = moment.utc(fixture.completedAt).local().valueOf();
        finalTime = Math.floor((endTime - startTime) / 1000);
      }

      setElapsedTime(finalTime);
      setDisplayTime(formatTime(finalTime));
    } else {
      setElapsedTime(0);
      setDisplayTime("00:00");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    fixture.matchStatus,
    fixture.startedAt,
    fixture.elapsedTimeSeconds,
    fixture.completedAt,
    fixture.id,
    totalDuration,
  ]);

  const statusColor =
    fixture.matchStatus === "ONGOING"
      ? club.live
      : fixture.matchStatus === "PAUSED"
      ? "#722ed1"
      : fixture.matchStatus === "COMPLETED"
      ? club.pitch
      : club.gold;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 12px",
        background: `${statusColor}15`,
        borderRadius: 6,
        border: `1px solid ${statusColor}40`,
      }}
    >
      <Text
        strong
        style={{
          color: statusColor,
          fontSize: 16,
          fontFamily: "monospace",
          letterSpacing: "1px",
        }}
      >
        {displayTime}
      </Text>
      {fixture.matchStatus === "ONGOING" && (
        <span style={{ fontSize: 10, color: statusColor }}>🔴 LIVE</span>
      )}
      {fixture.matchStatus === "PAUSED" && (
        <span style={{ fontSize: 10, color: statusColor }}>⏸️</span>
      )}
    </div>
  );
}
