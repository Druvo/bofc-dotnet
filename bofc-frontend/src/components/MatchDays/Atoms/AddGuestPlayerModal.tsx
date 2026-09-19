import React, { useState } from "react";
import { UserAddOutlined } from "@ant-design/icons";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";

interface AddGuestPlayerModalProps {
    /** Resolves to whether the guest was actually added - false leaves the form open with the
     * typed name, since the failure has already been reported by the caller. */
    onAddGuest: (name: string) => Promise<boolean>;
}

/**
 * "+ Add Guest" on Team Building. A guest is someone playing this one Match Day who is not a
 * club member, so the only thing asked for is a name - there is no profile behind it and
 * nothing else to fill in. The guest lands in the Unassigned Pool; an organiser then drags
 * them onto a team like anyone else.
 */
export default function AddGuestPlayerModal({ onAddGuest }: AddGuestPlayerModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const trimmedName = name.trim();

    const close = () => {
        setIsOpen(false);
        setName("");
    };

    const handleSubmit = async () => {
        if (!trimmedName || isSaving) return;

        setIsSaving(true);
        try {
            if (await onAddGuest(trimmedName)) {
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
            </Modal>
        </>
    );
}
