import React from "react";
import { toast } from "react-toastify";
import { useCreateTournamentTeamMutation } from "../../../state/features/tournaments/tournamentTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import Button from "../../ui/button";

export default function CreateTeamComponent({
    tournamentId,
    existingTeams,
    refetchSummary,
}: {
    tournamentId: number;
    existingTeams: string[];
    refetchSummary: () => void;
}) {
    const [createTeam, { isLoading: isCreating }] = useCreateTournamentTeamMutation();

    const getErrorMessage = (error: any) => normalizeErrorMessage(error, "Failed to create team");

    const handleCreateTeam = () => {
        const teamName = `Team ${String.fromCharCode(65 + existingTeams.length)}`;
        const teamData = { tournamentId, teamName };
        createTeam(teamData)
            .unwrap()
            .then(() => {
                toast.success("Team created successfully");
                refetchSummary();
            })
            .catch((error) => {
                toast.error(getErrorMessage(error));
            });
    };

    return (
        <Button type="button" variant="outline" size="sm" disabled={isCreating} onClick={handleCreateTeam}>
            + Add Team
        </Button>
    );
}
