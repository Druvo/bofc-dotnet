import ManualFixturePanel from "./ManualFixtures/ManualFixturePanel";

interface FixturesPanelProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
}

/**
 * FixturesPanel - Main entry point for tournament fixture management
 *
 * Now exclusively uses the Manual Fixture System with:
 * - Node-based tournament visualization
 * - Drag-and-drop team assignment
 * - Visual round/group management
 * - Complete control over tournament structure
 */
export default function FixturesPanel({
  tournamentId,
  teams,
}: FixturesPanelProps) {
  return <ManualFixturePanel tournamentId={tournamentId} teams={teams} />;
}
