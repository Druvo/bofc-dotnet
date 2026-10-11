import React, { useState } from "react";
import { UserAddOutlined } from "@ant-design/icons";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import { GUEST_RANK_OPTIONS, parseGuestRank } from "../teamBuilderTypes";

interface AddGuestPlayerModalProps {
    /** Resolves to whether the guest was actually added - false leaves the form open with the
     * typed name, since the failure has already been reported by the caller. */
    onAddGuest: (name: string, rank: number | null) => Promise<boolean>;
}

/**
 * "+ Add Guest" on Team Building. A guest is someone playing this one Match Day who is not a
 * club member, so all that is asked for is a name and, optionally, a rank - there is no
 * profile behind it. The guest lands in the Unassigned Pool; "Generate Teams" then deals them
 * in by that rank, or an organiser drags them onto a team like anyone else.
 */
export default function AddGuestPlayerModal({ onAddGuest }: AddGuestPlayerModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [rank, setRank] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const trimmedName = name.trim();

    const close = () => {
        setIsOpen(false);
        setName("");
        setRank("");
    };

    const handleSubmit = async () => {
        if (!trimmedName || isSaving) return;

        setIsSaving(true);
        try {
            if (await onAddGuest(trimmedName, parseGuestRank(rank))) {
                close();
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                startIcon={<UserAddOutlined />}
                onClick={() => setIsOpen(true)}
            >
                Add Guest
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={close}
                title="Add a guest player"
                className="max-w-[420px]"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={close}>
                            Cancel
                        </Button>
                        <Button size="sm" disabled={!trimmedName || isSaving} onClick={handleSubmit}>
                            {isSaving ? "Adding..." : "Add to pool"}
                        </Button>
                    </>
                }
            >
                <FormInput
                    id="guest-player-name"
                    label="Guest name"
                    placeholder="e.g. Rahim (Kamal's friend)"
                    value={name}
                    autoFocus
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    hint="Guests join the Unassigned Pool for this Match Day only. No player profile is created, and they are left out of statistics, attendance and club emails."
                />
                <div className="mt-4">
                    <FormSelect
                        id="guest-player-rank"
                        label="Rank"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        options={GUEST_RANK_OPTIONS}
                        hint="Same 1-10 scale as the player rank board. Generate Teams uses it to balance the teams; unranked guests count as the weakest tier. Only organisers can see it."
                    />
                </div>
            </Modal>
        </>
    );
}
