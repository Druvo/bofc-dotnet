import React from "react";
import { Guest } from "../teamBuilderTypes";
import { CloseOutlined } from "@ant-design/icons";
import Avatar from "../../CommonAtoms/Avatar";
import Badge from "../../ui/badge";

interface GuestCardProps {
    guest: Guest;
    /** Omitted for viewers who may not manage teams - the card then has no remove control. */
    handleRemoveGuest?: () => void;
}

/**
 * A guest on the Team Building page. Deliberately plainer than PlayerCard: a guest has no
 * profile, so there is no position, jersey, captaincy or edit-details menu to offer - only
 * the name, a badge saying what they are, and a way to take them off the Match Day.
 *
 * The avatar is seeded on the guest id so two guests with the same name still look different,
 * the same way PlayerCard seeds on the player id.
 */
const GuestCard: React.FC<GuestCardProps> = ({ guest, handleRemoveGuest }) => (
    <div className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-theme-sm text-gray-800 dark:text-white/90">
            <Avatar name={guest.name} seed={`guest-${guest.guestId}`} size={28} />
            <span className="truncate font-medium">{guest.name}</span>
            <Badge variant="info">Guest</Badge>
        </span>
        {handleRemoveGuest && (
            <button
                type="button"
                title="Remove guest from this Match Day"
                aria-label={`Remove ${guest.name}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveGuest();
                }}
            >
                <CloseOutlined />
            </button>
        )}
    </div>
);

export default GuestCard;
