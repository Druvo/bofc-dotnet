import React, { useMemo } from "react";
import { Card, Row, Col, Empty } from "antd";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";
import { club } from "../../../../theme/clubTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface MatchStatisticsChartProps {
  fixtures: IFixture[];
}

export default function MatchStatisticsChart({ fixtures }: MatchStatisticsChartProps) {
  // Status Distribution Data
  const statusData = useMemo(() => {
    const scheduled = fixtures.filter(f => f.matchStatus === 'SCHEDULED').length;
    const ongoing = fixtures.filter(f => f.matchStatus === 'ONGOING').length;
    const paused = fixtures.filter(f => f.matchStatus === 'PAUSED').length;
    const completed = fixtures.filter(f => f.matchStatus === 'COMPLETED').length;

    return {
      labels: ['Scheduled', 'Ongoing', 'Paused', 'Completed'],
      datasets: [{
        label: 'Match Status',
        data: [scheduled, ongoing, paused, completed],
        backgroundColor: [club.gold, club.live, '#722ed1', club.pitch],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };
  }, [fixtures]);

  // Goals per Match Data (for completed matches)
  const goalsData = useMemo(() => {
    const completedMatches = fixtures.filter(f => f.matchStatus === 'COMPLETED');
    
    if (completedMatches.length === 0) return null;

    const matchLabels = completedMatches.map((f, idx) => `Match ${idx + 1}`);
    const homeGoals = completedMatches.map(f => f.homeTeamScore);
    const awayGoals = completedMatches.map(f => f.awayTeamScore);

    return {
      labels: matchLabels,
      datasets: [
        {
          label: 'Home Team Goals',
          data: homeGoals,
          backgroundColor: club.gold,
        },
        {
          label: 'Away Team Goals',
          data: awayGoals,
          backgroundColor: '#52c41a',
        },
      ],
    };
  }, [fixtures]);

  // Tournament Progress Data
  const progressData = useMemo(() => {
    // Group matches by date
    const matchesByDate = fixtures.reduce((acc, fixture) => {
      const date = fixture.matchDate.split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, completed: 0 };
      }
      acc[date].total++;
      if (fixture.matchStatus === 'COMPLETED') {
        acc[date].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const sortedDates = Object.keys(matchesByDate).sort();
    const cumulativeCompleted: number[] = [];
    let runningTotal = 0;

    sortedDates.forEach(date => {
      runningTotal += matchesByDate[date].completed;
      cumulativeCompleted.push(runningTotal);
    });

    return {
      labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Completed Matches',
          data: cumulativeCompleted,
          borderColor: club.pitch,
          backgroundColor: 'rgba(46, 158, 91, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [fixtures]);

  if (fixtures.length === 0) {
    return <Empty description="No fixture data to display" />;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Match Status Distribution" bordered={false}>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Pie data={statusData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Tournament Progress Over Time" bordered={false}>
            <div style={{ height: '300px' }}>
              <Line data={progressData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        {goalsData && (
          <Col xs={24}>
            <Card title="Goals per Match (Completed)" bordered={false}>
              <div style={{ height: '300px' }}>
                <Bar data={goalsData} options={chartOptions} />
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
