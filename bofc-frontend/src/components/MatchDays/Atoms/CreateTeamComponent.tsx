import React from "react";
import { toast } from "react-toastify";
import { useCreateMatchDayTeamMutation } from "../../../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import Button from "../../ui/button";

export default function CreateTeamComponent({
    matchDayId,
    refetchSummary,
}: {
    matchDayId: number;
    refetchSummary: () => void;
}) {
    const [createTeam, { isLoading: isCreating }] = useCreateMatchDayTeamMutation();

    const getErrorMessage = (error: any) => normalizeErrorMessage(error, "Failed to create team");

    const handleCreateTeam = () => {
        // No teamName here on purpose - the server assigns the next "Team {letter}" itself
        // (authoritative COUNT at insert time). Computing it here from an existingTeams prop
        // used to race: two clicks close together could both see the same stale count before
        // either create's list re-fetch landed, and both got e.g. "Team B".
        createTeam({ matchDayId })
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
