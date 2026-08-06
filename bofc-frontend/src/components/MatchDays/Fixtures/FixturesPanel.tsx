import ManualFixturePanel from "./ManualFixtures/ManualFixturePanel";

interface FixturesPanelProps {
  matchDayId: number;
  teams: Array<{ teamId: number; teamName: string }>;
}

/**
 * FixturesPanel - Main entry point for matchDay fixture management
 *
 * Now exclusively uses the Manual Fixture System with:
 * - Node-based matchDay visualization
 * - Drag-and-drop team assignment
 * - Visual round/group management
 * - Complete control over matchDay structure
 */
export default function FixturesPanel({
  matchDayId,
  teams,
}: FixturesPanelProps) {
  return <ManualFixturePanel matchDayId={matchDayId} teams={teams} />;
}
