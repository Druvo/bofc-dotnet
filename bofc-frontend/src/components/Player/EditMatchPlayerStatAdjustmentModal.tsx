import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    useGetMatchPlayerStatAdjustmentQuery,
    useUpdateMatchPlayerStatAdjustmentMutation,
} from "../../state/features/statistics/statisticsSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import Modal from "../ui/modal";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import Loader from "../ui/loader";

interface EditMatchPlayerStatAdjustmentModalProps {
    matchId: number;
    playerId: number;
    playerName: string;
    isOpen: boolean;
    onClose: () => void;
}

const FIELDS: { key: "goalsAdjustment" | "assistsAdjustment" | "yellowCardsAdjustment" | "redCardsAdjustment"; label: string }[] = [
    { key: "goalsAdjustment", label: "Goals" },
    { key: "assistsAdjustment", label: "Assists" },
    { key: "yellowCardsAdjustment", label: "Yellow Cards" },
    { key: "redCardsAdjustment", label: "Red Cards" },
];

// Same manual-correction concept as EditPlayerStatAdjustmentModal, but scoped to this one Match
// instead of the player's lifetime total - e.g. to correct a goal that was recorded against the
// wrong player in this specific match. Added on top of what's already computed from this match's
// recorded events, not a replacement. No "Matches" field here - that only makes sense lifetime.
export default function EditMatchPlayerStatAdjustmentModal({ matchId, playerId, playerName, isOpen, onClose }: EditMatchPlayerStatAdjustmentModalProps) {
    const { data, isFetching } = useGetMatchPlayerStatAdjustmentQuery({ matchId, playerId }, { skip: !isOpen });
    const [updateAdjustment, { isLoading: isSaving }] = useUpdateMatchPlayerStatAdjustmentMutation();

    const [values, setValues] = useState({
        goalsAdjustment: 0,
        assistsAdjustment: 0,
        yellowCardsAdjustment: 0,
        redCardsAdjustment: 0,
    });
    const [note, setNote] = useState("");

    useEffect(() => {
        if (!data?.content) return;
        setValues({
            goalsAdjustment: data.content.goalsAdjustment,
            assistsAdjustment: data.content.assistsAdjustment,
            yellowCardsAdjustment: data.content.yellowCardsAdjustment,
            redCardsAdjustment: data.content.redCardsAdjustment,
        });
        setNote(data.content.note || "");
    }, [data]);

    const handleSave = async () => {
        try {
            await updateAdjustment({
                matchId,
                playerId,
                body: { ...values, matchesPlayedAdjustment: 0, note: note.trim() || undefined },
            }).unwrap();
            toast.success(`Updated manual stat adjustment for ${playerName} in this match`);
            onClose();
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to save adjustment"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={<>Adjust Match Stats - <strong>{playerName}</strong></>}
            className="max-w-[440px]"
            footer={
                <>
                    <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" disabled={isSaving || isFetching} onClick={handleSave}>
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </>
            }
        >
            {isFetching ? (
                <Loader className="py-6" />
            ) : (
                <>
                    <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
                        Added on top of what's already computed from this match's recorded events - e.g.
                        entering <strong>+1</strong> here for Goals means this player's total for this match
                        shows 1 more than the recorded events alone add up to. Use negative numbers to
                        correct an over-count. Doesn't touch any recorded event data.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {FIELDS.map((f) => (
                            <FormInput
                                key={f.key}
                                label={f.label}
                                type="number"
                                value={values[f.key]}
                                onChange={(e) =>
                                    setValues((prev) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                                }
                            />
                        ))}
                    </div>
                    <div className="mt-3">
                        <FormInput
                            label="Note (optional, admin-only)"
                            placeholder="e.g. wrong player was credited for this goal"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </>
            )}
        </Modal>
    );
}
