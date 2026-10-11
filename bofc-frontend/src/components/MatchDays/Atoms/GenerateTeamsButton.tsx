import React, { useState } from "react";
import { toast } from "react-toastify";
import { ThunderboltOutlined } from "@ant-design/icons";
import { useGenerateTeamsByRankMutation } from "../../../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";

// Only rendered while the MatchDay has zero teams - WeeklyMatchDayTeamGenerator.GenerateAsync
// (the same snake-draft-by-rank logic the weekly scheduler uses) refuses outright once any
// team exists, manual or auto-generated, so there's no "regenerate"/"top up" mode to offer here.
export default function GenerateTeamsButton({
    matchDayId,
    refetchSummary,
}: {
    matchDayId: number;
    refetchSummary: () => void;
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(6);
    const [generateTeams, { isLoading }] = useGenerateTeamsByRankMutation();

    const handleGenerate = async () => {
        try {
            const result = await generateTeams({ matchDayId, maxPlayersPerTeam }).unwrap();
            if (result.content.success) {
                toast.success(`Generated teams by rank (max ${maxPlayersPerTeam} players each)`);
                setModalOpen(false);
                refetchSummary();
            } else {
                toast.error(result.content.reason || "Could not generate teams");
            }
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to generate teams"));
        }
    };

    return (
        <>
            <Button type="button" variant="outline" size="sm" startIcon={<ThunderboltOutlined />} onClick={() => setModalOpen(true)}>
                Generate Teams
            </Button>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Generate Teams by Rank"
                className="max-w-[420px]"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button size="sm" disabled={isLoading} onClick={handleGenerate}>
                            {isLoading ? "Generating..." : "Generate"}
                        </Button>
                    </>
                }
            >
                <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
                    Drafts confirmed participants and guests in the Unassigned Pool into balanced
                    teams using each player's admin-set rank and each guest's rank (snake draft -
                    strongest and weakest spread evenly across teams), then
                    schedules their round-robin matches and assigns jerseys. The number of teams is
                    worked out automatically from turnout - e.g. 13 confirmed at a cap of 6 makes 3
                    teams - rather than chosen directly.
                </p>
                <FormInput
                    label="Players per team (max, including goalkeeper)"
                    type="number"
                    min={2}
                    max={11}
                    value={maxPlayersPerTeam}
                    onChange={(e) => setMaxPlayersPerTeam(Math.max(2, Number(e.target.value) || 6))}
                />
            </Modal>
        </>
    );
}
