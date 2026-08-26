import React from "react";
import { toast } from "react-toastify";
import { BellOutlined } from "@ant-design/icons";
import { useSendMatchDayReminderEmailMutation } from "../../../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import Button from "../../ui/button";

interface SendMatchDayReminderButtonProps {
    matchDayId: number;
}

/** Manual-only action - emails every active, email-notifications-on player who hasn't voted
 * yet the Upcoming Match Day Reminder, right now. Same send the hourly scheduler does
 * automatically, just triggered on demand instead of waiting for the next tick. */
export default function SendMatchDayReminderButton({ matchDayId }: SendMatchDayReminderButtonProps) {
    const [sendReminder, { isLoading }] = useSendMatchDayReminderEmailMutation();

    const handleClick = async () => {
        if (!window.confirm("Send the Upcoming Match Day Reminder now to every player who hasn't voted yet?")) return;
        try {
            const { sent } = (await sendReminder({ matchDayId }).unwrap()).content;
            toast.success(sent === 0 ? "No emails sent - everyone's already voted, or SMTP isn't enabled in Settings." : `Sent to ${sent} player${sent === 1 ? "" : "s"}.`);
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to send the reminder email"));
        }
    };

    return (
        <Button type="button" variant="outline" size="sm" startIcon={<BellOutlined />} onClick={handleClick} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Match Day Reminder"}
        </Button>
    );
}
