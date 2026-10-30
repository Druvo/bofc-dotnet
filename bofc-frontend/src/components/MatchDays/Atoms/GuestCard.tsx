import React from "react";
import { Guest, GUEST_RANK_OPTIONS, parseGuestRank } from "../teamBuilderTypes";
import { CloseOutlined } from "@ant-design/icons";
import Avatar from "../../CommonAtoms/Avatar";
import Badge from "../../ui/badge";

interface GuestCardProps {
    guest: Guest;
    /** Omitted for viewers who may not manage teams - the card then has no remove control. */
    handleRemoveGuest?: () => void;
    /** Omitted for viewers who may not manage teams - they never receive a rank anyway. */
    handleSetGuestRank?: (rank: number | null) => void;
}

/**
 * A guest on the Team Building page. Deliberately plainer than PlayerCard: a guest has no
 * profile, so there is no position, jersey, captaincy or edit-details menu to offer - only
 * the name, a badge saying what they are, their rank for the team draft, and a way to take them
 * off the Match Day.
 *
 * The avatar is seeded on the guest id so two guests with the same name still look different,
 * the same way PlayerCard seeds on the player id.
 */
const GuestCard: React.FC<GuestCardProps> = ({ guest, handleRemoveGuest, handleSetGuestRank }) => (
    <div className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-theme-sm text-gray-800 dark:text-white/90">
            <Avatar name={guest.name} seed={`guest-${guest.guestId}`} size={28} />
            <span className="truncate font-medium">{guest.name}</span>
            <Badge variant="info">Guest</Badge>
        </span>
        {handleSetGuestRank && (
            // A native select is one of the elements react-beautiful-dnd treats as interactive,
            // so picking a rank does not start a drag of the card it sits on.
            // SPEC: spec-6d7e9b
            // py-0 and pr-7, not py-2/px-1.5: @tailwindcss/forms gives a select 0.5rem of vertical
            // padding and draws its arrow up to 1.625rem in from the right. At h-7 that padding left
            // 10px for an 18px line, and px-1.5 put the label under the arrow - both clipped it.
            <select
                title="Rank used by Generate Teams (1 = strongest)"
                aria-label={`Rank for ${guest.name}`}
                className="h-7 shrink-0 rounded-md border border-gray-200 bg-transparent py-0 pl-1.5 pr-7 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-none dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] dark:text-white/80"
                value={guest.rank == null ? "" : String(guest.rank)}
                onChange={(e) => handleSetGuestRank(parseGuestRank(e.target.value))}
            >
                {GUEST_RANK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.value === "" ? "Rank -" : `Rank ${opt.value}`}
                    </option>
                ))}
            </select>
        )}
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
