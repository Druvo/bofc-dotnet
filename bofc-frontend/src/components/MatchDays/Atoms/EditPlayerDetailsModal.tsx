import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Player } from "../teamBuilderTypes";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";

interface EditPlayerDetailsModalProps {
    visible: boolean;
    player: Player | null;
    onClose: () => void;
    onSave: (
        playerId: number,
        teamId: number,
        playingPosition: string,
        id: number,
        isCaptain: boolean,
        teamPlayerRole: string,
        jerseyNumber?: number
    ) => void;
}

const EditPlayerDetailsModal: React.FC<EditPlayerDetailsModalProps> = ({ visible, player, onClose, onSave }) => {
    const [jerseyNumber, setJerseyNumber] = useState<string>("");
    const [teamPlayerRole, setTeamPlayerRole] = useState<"PLAYER" | "CAPTAIN">("PLAYER");
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        if (player && visible) {
            setJerseyNumber(player.jerseyNumber ? String(player.jerseyNumber) : "");
            setTeamPlayerRole((player.teamPlayerRole as "PLAYER" | "CAPTAIN") || "PLAYER");
            setError(undefined);
        }
    }, [player, visible]);

    const handleSubmit = () => {
        if (jerseyNumber) {
            const n = Number(jerseyNumber);
            if (Number.isNaN(n) || n < 1 || n > 99) {
                setError("Jersey number must be between 1 and 99");
                return;
            }
        }
        if (!player?.id || !player?.teamId) {
            toast.error("Invalid player data");
            return;
        }

        const isCaptain = teamPlayerRole === "CAPTAIN";
        onSave(
            player.playerId,
            player.teamId,
            player.playingPosition || "UNASSIGNED",
            player.id,
            isCaptain,
            teamPlayerRole,
            jerseyNumber ? Number(jerseyNumber) : undefined
        );
        onClose();
    };

    return (
        <Modal
            isOpen={visible}
            onClose={onClose}
            title={`Edit Player Details - ${player?.playerName}`}
            className="max-w-[420px]"
            footer={
                <>
                    <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={handleSubmit}>Save</Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <FormInput
                    label="Jersey Number"
                    type="number"
                    placeholder="Enter jersey number"
                    min={1}
                    max={99}
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    error={error}
                />
                <FormSelect
                    label="Team Role"
                    value={teamPlayerRole}
                    onChange={(e) => setTeamPlayerRole(e.target.value as "PLAYER" | "CAPTAIN")}
                    options={[
                        { value: "PLAYER", label: "Player" },
                        { value: "CAPTAIN", label: "Captain" },
                    ]}
                />
                <p className="text-theme-xs text-gray-400 dark:text-gray-500">
                    Captain flag is set automatically to {teamPlayerRole === "CAPTAIN" ? "on" : "off"} based on the role above.
                </p>
            </div>
        </Modal>
    );
};

export default EditPlayerDetailsModal;
