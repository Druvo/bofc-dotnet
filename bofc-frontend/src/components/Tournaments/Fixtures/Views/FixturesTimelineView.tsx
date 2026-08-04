import React, { useEffect, useRef, useMemo } from "react";
import { Timeline, Card, Tag, Space, Typography, Empty } from "antd";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";
import { club } from "../../../../theme/clubTheme";
import { getStatusColor } from "../../../../utils/matchStatusUtils";
import VenueLink from "../../../CommonAtoms/VenueLink";

const { Text } = Typography;

interface FixturesTimelineViewProps {
  fixtures: IFixture[];
  onViewDetails?: (fixture: IFixture) => void;
}

/**
 * Timeline view of fixtures with GSAP animations
 * Shows matches in chronological order with smooth entrance effects
 */
export default function FixturesTimelineView({
  fixtures,
  onViewDetails,
}: FixturesTimelineViewProps) {
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sort fixtures chronologically
  const sortedFixtures = [...fixtures].sort((a, b) =>
    moment(a.matchDate).diff(moment(b.matchDate))
  );

  // Animate timeline items on mount
  useEffect(() => {
    if (timelineRef.current && sortedFixtures.length > 0) {
      const items = timelineRef.current.querySelectorAll(".timeline-item");

      // Staggered entrance animation
      gsap.fromTo(
        items,
        {
          opacity: 0,
          x: -30,
          scale: 0.95,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08, // 80ms delay between each item
          ease: "power2.out",
        }
      );
    }
  }, [sortedFixtures.length]);

  // Animate pulsing dot for ONGOING matches
  useEffect(() => {
    const ongoingDots = document.querySelectorAll(".ongoing-dot");
    if (ongoingDots.length > 0) {
      gsap.to(ongoingDots, {
        scale: 1.3,
        opacity: 0.6,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }
  }, [sortedFixtures]);

  const handleViewDetails = (fixture: IFixture) => {
    if (onViewDetails) {
      onViewDetails(fixture);
    } else {
      navigate(`/fixtures/${fixture.id}`);
    }
  };

  // Get color for timeline dot based on status
  const getTimelineDotColor = (status: string): string => {
    switch (status) {
      case "SCHEDULED":
        return club.gold;
      case "ONGOING":
        return club.live;
      case "PAUSED":
        return "#722ed1";
      case "COMPLETED":
        return club.pitch;
      default:
        return "#d9d9d9";
    }
  };

  // Create timeline items
  const timelineItems = useMemo(() => {
    // Sort fixtures by date
    const sortedFixtures = [...fixtures].sort(
      (a, b) => moment.utc(a.matchDate).valueOf() - moment.utc(b.matchDate).valueOf()
    );

    return sortedFixtures.map((fixture) => ({
      color: getTimelineDotColor(fixture.matchStatus),
      dot:
        fixture.matchStatus === "ONGOING" ? (
          <div className="ongoing-dot">
            <ClockCircleOutlined style={{ fontSize: 16, color: club.live }} />
          </div>
        ) : (
          <TrophyOutlined style={{ fontSize: 16 }} />
        ),
      children: (
        <Card size="small">
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 16 }}>
              {fixture.homeTeamName} vs {fixture.awayTeamName}
            </Text>
          </div>
          <Space direction="vertical" size={4}>
            <Text type="secondary">
              <CalendarOutlined /> {moment.utc(fixture.matchDate).local().format("DD MMM YYYY, HH:mm")}
            </Text>
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {moment(fixture.matchDate).format("HH:mm")}
            </Text>
            {fixture.venueName && (
              <Text type="secondary">
                📍 <VenueLink name={fixture.venueName} mapLink={fixture.venueMapLink} showIcon={false} className="hover:underline" />
              </Text>
            )}
            {fixture.round && (
              <Text type="secondary">
                Round {fixture.round}
              </Text>
            )}
            {fixture.groupName && (
              <Text type="secondary">
                {fixture.groupName}
              </Text>
            )}
          </Space>
        </Card>
      ),
    }));
  }, [fixtures]);

  if (sortedFixtures.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
          <TrophyOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>No fixtures to display</div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>
          📅 Match Timeline
        </Text>
        <Text style={{ marginLeft: 12, fontSize: 13, color: "#999" }}>
          {sortedFixtures.length} match{sortedFixtures.length !== 1 ? "es" : ""}
        </Text>
      </div>

      <div ref={timelineRef}>
        <Timeline mode="left" items={timelineItems} />
      </div>
    </Card>
  );
}
