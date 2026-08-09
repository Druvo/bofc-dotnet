import React, { useMemo } from "react";
import { Card, List, Tag, Space, Typography, theme } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";
import VenueLink from "../../../CommonAtoms/VenueLink";
import { getStatusColor } from "../../../../utils/matchStatusUtils";
import { formatMatchTimeRange } from "../../../../utils/matchTimeUtils";

const { Text } = Typography;
const { useToken } = theme;

interface FixturesListViewProps {
  fixtures: IFixture[];
}

/**
 * Simple list view of fixtures with search and filter
 * Optimized for mobile and quick browsing
 */
export default function FixturesListView({ fixtures }: FixturesListViewProps) {
  const navigate = useNavigate();
  const { token } = useToken();

  // Group fixtures by date
  const fixturesByDate = useMemo(() => {
    // Group by date
    const grouped: Record<string, IFixture[]> = {};
    fixtures.forEach((fixture) => {
      const dateKey = moment(fixture.matchDate).format("YYYY-MM-DD");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(fixture);
    });

    // Sort each group by time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => moment(a.matchDate).diff(moment(b.matchDate)));
    });

    return grouped;
  }, [fixtures]);

  const sortedDates = Object.keys(fixturesByDate).sort();

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Fixtures List */}
      {sortedDates.length > 0 ? (
        <div>
          {sortedDates.map((dateKey) => (
            <div key={dateKey} style={{ marginBottom: 24 }}>
              {/* Date Header */}
              <div
                style={{
                  padding: "8px 12px",
                  background: token.colorPrimary,
                  color: token.colorTextLightSolid,
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                📅 {moment(dateKey).format("dddd, DD MMMM YYYY")}
              </div>

              {/* Matches for this date */}
              <List
                dataSource={fixturesByDate[dateKey]}
                renderItem={(fixture) => (
                  <List.Item
                    key={fixture.id}
                    style={{
                      padding: "12px 16px",
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => navigate(`/fixtures/${fixture.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = token.colorBgTextHover;
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = token.colorBgContainer;
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      {/* Header: Time, Status, Match Number */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Space size="small">
                          <CalendarOutlined style={{ color: token.colorPrimary }} />
                          <Text strong style={{ fontSize: 13 }}>
                            {formatMatchTimeRange(fixture.matchDate, fixture.matchDurationMinutes, "hh:mm a")}
                          </Text>
                          <Tag
                            color={getStatusColor(fixture.matchStatus)}
                            style={{ fontSize: 10, margin: 0 }}
                          >
                            {fixture.matchStatus}
                          </Tag>
                        </Space>
                        <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                          #{fixture.matchOrder}
                        </Text>
                      </div>

                      {/* Teams and Score */}
                      <div style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div style={{ flex: 1, textAlign: "right" }}>
                            <Text strong style={{ fontSize: 14 }}>
                              {fixture.homeTeamName}
                            </Text>
                          </div>

                          <div
                            style={{
                              minWidth: 60,
                              textAlign: "center",
                            }}
                          >
                            {(fixture.matchStatus === "ONGOING" ||
                              fixture.matchStatus === "PAUSED" ||
                              fixture.matchStatus === "COMPLETED") ? (
                              <Text
                                strong
                                style={{ fontSize: 18, color: token.colorPrimary }}
                              >
                                {fixture.homeTeamScore} - {fixture.awayTeamScore}
                              </Text>
                            ) : (
                              <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                vs
                              </Text>
                            )}
                          </div>

                          <div style={{ flex: 1, textAlign: "left" }}>
                            <Text strong style={{ fontSize: 14 }}>
                              {fixture.awayTeamName}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Venue and Additional Info */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Space size="small">
                          {fixture.venueName && (
                            <VenueLink
                              name={fixture.venueName}
                              mapLink={fixture.venueMapLink}
                              iconClassName="mr-1"
                              style={{ fontSize: 11, color: token.colorTextTertiary }}
                              className="hover:underline"
                            />
                          )}
                          {fixture.round && (
                            <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>
                              Round {fixture.round}
                            </Text>
                          )}
                          {fixture.groupName && (
                            <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>
                              {fixture.groupName}
                            </Text>
                          )}
                        </Space>

                        {fixture.matchStatus === "ONGOING" && (
                          <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>
                            🔴 LIVE
                          </Tag>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: token.colorTextSecondary,
          }}
        >
          <SearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>No matches found</div>
        </div>
      )}
    </Card>
  );
}
