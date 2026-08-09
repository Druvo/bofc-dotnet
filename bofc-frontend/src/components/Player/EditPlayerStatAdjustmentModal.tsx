import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    useGetPlayerStatAdjustmentQuery,
    useUpdatePlayerStatAdjustmentMutation,
} from "../../state/features/statistics/statisticsSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import Modal from "../ui/modal";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import Loader from "../ui/loader";

interface EditPlayerStatAdjustmentModalProps {
    playerId: number;
    playerName: string;
    isOpen: boolean;
    onClose: () => void;
}

const FIELDS: { key: "goalsAdjustment" | "assistsAdjustment" | "yellowCardsAdjustment" | "redCardsAdjustment" | "matchesPlayedAdjustment"; label: string }[] = [
    { key: "matchesPlayedAdjustment", label: "Matches" },
    { key: "goalsAdjustment", label: "Goals" },
    { key: "assistsAdjustment", label: "Assists" },
    { key: "yellowCardsAdjustment", label: "Yellow Cards" },
    { key: "redCardsAdjustment", label: "Red Cards" },
];

// A player's goals/assists/cards/matches-played are always computed live from recorded match
// events (see PlayerStatisticsService) — there's no other field to type a number into directly.
// This adds a flat correction on top of that computed total (e.g. to backfill history from
// before this app tracked matches), rather than replacing it — so "+3" here means "3 more than
// whatever the matches say", not "exactly 3".
export default function EditPlayerStatAdjustmentModal({ playerId, playerName, isOpen, onClose }: EditPlayerStatAdjustmentModalProps) {
    const { data, isFetching } = useGetPlayerStatAdjustmentQuery({ playerId }, { skip: !isOpen });
    const [updateAdjustment, { isLoading: isSaving }] = useUpdatePlayerStatAdjustmentMutation();

    const [values, setValues] = useState({
        goalsAdjustment: 0,
        assistsAdjustment: 0,
        yellowCardsAdjustment: 0,
        redCardsAdjustment: 0,
        matchesPlayedAdjustment: 0,
    });
    const [note, setNote] = useState("");

    useEffect(() => {
        if (!data?.content) return;
        setValues({
            goalsAdjustment: data.content.goalsAdjustment,
            assistsAdjustment: data.content.assistsAdjustment,
            yellowCardsAdjustment: data.content.yellowCardsAdjustment,
            redCardsAdjustment: data.content.redCardsAdjustment,
            matchesPlayedAdjustment: data.content.matchesPlayedAdjustment,
        });
        setNote(data.content.note || "");
    }, [data]);

    const handleSave = async () => {
        try {
            await updateAdjustment({
                playerId,
                body: { ...values, note: note.trim() || undefined },
            }).unwrap();
            toast.success(`Updated manual stat adjustment for ${playerName}`);
            onClose();
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to save adjustment"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={<>Adjust Stats — <strong>{playerName}</strong></>}
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
                        Added on top of what's already computed from recorded matches — e.g. entering{" "}
                        <strong>+3</strong> here for Goals means this player's total shows 3 more than what
                        their matches alone add up to. Use negative numbers to correct an over-count.
                        Doesn't touch any match or event data.
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
                            placeholder="e.g. carried over from the old spreadsheet"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </>
            )}
        </Modal>
    );
}
