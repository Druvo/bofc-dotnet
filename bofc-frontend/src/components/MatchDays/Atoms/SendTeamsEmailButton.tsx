import React from "react";
import { toast } from "react-toastify";
import { MailOutlined } from "@ant-design/icons";
import { useSendTeamsGeneratedEmailMutation } from "../../../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import Button from "../../ui/button";

interface SendTeamsEmailButtonProps {
    matchDayId: number;
}

/** Manual-only action - emails every confirmed participant a link to this Team Building page.
 * Never fired automatically when teams/fixtures are generated. */
export default function SendTeamsEmailButton({ matchDayId }: SendTeamsEmailButtonProps) {
    const [sendEmail, { isLoading }] = useSendTeamsGeneratedEmailMutation();

    const handleClick = async () => {
        if (!window.confirm("Email every confirmed player a link to this Team Building page?")) return;
        try {
            const { sent } = (await sendEmail({ matchDayId }).unwrap()).content;
            toast.success(sent === 0 ? "No emails sent - check SMTP is enabled in Settings." : `Sent to ${sent} player${sent === 1 ? "" : "s"}.`);
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to send the teams email"));
        }
    };

    return (
        <Button type="button" variant="outline" size="sm" startIcon={<MailOutlined />} onClick={handleClick} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Teams Email"}
        </Button>
    );
}
