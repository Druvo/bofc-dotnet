import React, { useState, useEffect } from "react";
import { Card, Row, Col, Tag, Button, Space, Typography, theme } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import VenueLink from "../../../CommonAtoms/VenueLink";
import moment from "moment";
import { IFixture, MatchStatus } from "../../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../../utils/matchStatusUtils";
import { selectLoginInfo } from "../../../../state/slices/loginInfoSlice";
import { useGetMatchByIdQuery } from "../../../../state/features/fixtures/fixturesSlice";

const { Text, Title } = Typography;
const { useToken } = theme;

interface FixtureCardViewProps {
  fixtures: IFixture[];
  onEdit?: (fixture: IFixture) => void;
  onDataChange?: () => void;
}

// Simple Match Clock Component with auto-refresh
const MatchClock: React.FC<{
  fixture: IFixture;
  onStatusChange?: () => void;
}> = ({ fixture, onStatusChange }) => {
  const { token } = useToken();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastStatus, setLastStatus] = useState(fixture.matchStatus);

  // Poll match data every 30 seconds for ongoing/paused matches
  const { data: matchData } = useGetMatchByIdQuery(
    { fixtureId: fixture.id },
    {
      pollingInterval: fixture.matchStatus === MatchStatus.ONGOING || 
                       fixture.matchStatus === MatchStatus.PAUSED 
                       ? 30000 // Poll every 30 seconds
                       : 0,     // No polling for other statuses
      skip: fixture.matchStatus === MatchStatus.SCHEDULED || 
            fixture.matchStatus === MatchStatus.COMPLETED,
    }
  );

  // Update fixture data if it changed
  useEffect(() => {
    if (matchData?.content) {
      const newStatus = matchData.content.matchStatus;
      
      // If status changed, trigger parent refresh
      if (lastStatus !== newStatus) {
        setLastStatus(newStatus);
        onStatusChange?.();
      }
    }
  }, [matchData, lastStatus, onStatusChange]);

  useEffect(() => {
    if (fixture.matchStatus === MatchStatus.ONGOING && fixture.startedAt) {
      // Parse startedAt as UTC and convert to local time
      const startTime = moment.utc(fixture.startedAt).local().valueOf();
      const initialElapsed = fixture.elapsedTimeSeconds || 0;

      const interval = setInterval(() => {
        const now = Date.now();
        const timeSinceStart = Math.floor((now - startTime) / 1000);
        setElapsedTime(initialElapsed + timeSinceStart);
      }, 1000);

      return () => clearInterval(interval);
    } else if (fixture.matchStatus === MatchStatus.PAUSED) {
      // Show frozen time when paused
      setElapsedTime(fixture.elapsedTimeSeconds || 0);
    }
  }, [fixture.matchStatus, fixture.startedAt, fixture.elapsedTimeSeconds]);

  if (fixture.matchStatus !== MatchStatus.ONGOING && 
      fixture.matchStatus !== MatchStatus.PAUSED) {
    return null;
  }

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  return (
    <div style={{
      textAlign: "center",
      marginBottom: 12,
      padding: "8px",
      backgroundColor: fixture.matchStatus === MatchStatus.ONGOING
        ? `${token.colorWarning}15`
        : `${token.colorPrimary}15`,
      border: `1px solid ${fixture.matchStatus === MatchStatus.ONGOING
        ? token.colorWarning
        : token.colorPrimary}`,
      borderRadius: 4,
    }}>
      <Text strong style={{
        color: fixture.matchStatus === MatchStatus.ONGOING ? token.colorWarning : token.colorPrimary,
        fontSize: 18,
        display: "block",
      }}>
        {minutes}':{seconds.toString().padStart(2, "0")}
      </Text>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {fixture.matchStatus === MatchStatus.PAUSED ? "Match Paused" : "Live"}
      </Text>
    </div>
  );
};

export default function FixtureCardView({ fixtures, onEdit, onDataChange }: FixtureCardViewProps) {
  const navigate = useNavigate();
  const { token } = useToken();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  const handleViewDetails = (fixtureId: number) => {
    navigate(`/fixtures/${fixtureId}`);
  };

  const handleStatusChange = () => {
    // Trigger parent component to refresh all fixtures data
    onDataChange?.();
  };

  const getScoreDisplay = (fixture: IFixture) => {
    if (fixture.matchStatus === MatchStatus.COMPLETED) {
      return `${fixture.homeTeamScore ?? 0} - ${fixture.awayTeamScore ?? 0}`;
    }
    if (fixture.matchStatus === MatchStatus.ONGOING || fixture.matchStatus === MatchStatus.PAUSED) {
      return `${fixture.homeTeamScore ?? 0} - ${fixture.awayTeamScore ?? 0}`;
    }
    return "vs";
  };

  return (
    <Row gutter={[16, 16]}>
      {fixtures.map((fixture) => (
        <Col xs={24} sm={12} md={8} lg={6} key={fixture.id}>
          <Card
            hoverable
            style={{
              borderRadius: 8,
              overflow: "hidden",
              height: "100%",
            }}
            bodyStyle={{ padding: 16 }}
          >
            {/* Status Tag */}
            <div style={{ marginBottom: 12 }}>
              <Tag color={getStatusColor(fixture.matchStatus)}>
                {fixture.matchStatus}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Round {fixture.round}
              </Text>
            </div>

            {/* Match Clock for Ongoing/Paused matches */}
            <MatchClock
              fixture={fixture}
              onStatusChange={handleStatusChange}
            />

            {/* Teams */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 14 }}>
                  {fixture.homeTeamName}
                </Text>
              </div>
              <div style={{ margin: "12px 0" }}>
                <Title level={3} style={{ margin: 0, color: token.colorPrimary }}>
                  {getScoreDisplay(fixture)}
                </Title>
              </div>
              <div>
                <Text strong style={{ fontSize: 14 }}>
                  {fixture.awayTeamName}
                </Text>
              </div>
            </div>

            {/* Match Details */}
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <div>
                  <CalendarOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {fixture.matchDate
                      ? moment.utc(fixture.matchDate).local().format("MMM DD, YYYY HH:mm")
                      : "TBD"}
                  </Text>
                </div>
                {fixture.venueName && (
                  <VenueLink
                    name={fixture.venueName}
                    mapLink={fixture.venueMapLink}
                    iconClassName="mr-2"
                    style={{ color: token.colorTextSecondary, fontSize: 12 }}
                    className="hover:underline"
                  />
                )}
              </Space>
            </div>

            {/* Actions */}
            <Space style={{ width: "100%", justifyContent: "center" }}>
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(fixture.id)}
              >
                View
              </Button>
              {isAdmin && onEdit && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(fixture)}
                >
                  Edit
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
