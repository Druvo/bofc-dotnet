import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { HomeFilled, BarChartOutlined, MailOutlined } from "@ant-design/icons";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { isAdmin } from "../../utils/roleUtils";
import { useSendPaymentDueReminderNowMutation } from "../../state/features/settings/settingsSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import Button from "../ui/button";
import Modal from "../ui/modal";
import FormInput from "../ui/form-input";
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";

const currentYearMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

function SendReminderModal({ onClose }: { onClose: () => void }) {
    const [yearMonth, setYearMonth] = useState(currentYearMonth());
    const [sendReminder, { isLoading: isSending }] = useSendPaymentDueReminderNowMutation();

    const handleSend = async () => {
        const [year, month] = yearMonth.split("-").map(Number);
        if (!year || !month) {
            toast.error("Pick a month first");
            return;
        }
        try {
            const { due, sent } = (await sendReminder({ year, month }).unwrap()).content;
            if (due === 0) {
                toast.success("Everyone's already paid up for that month - nobody to email.");
            } else if (sent === 0) {
                toast.error(`${due} player${due === 1 ? "" : "s"} still owe, but no email was sent - check SMTP is enabled in Settings.`);
            } else if (sent < due) {
                toast.success(`Sent to ${sent} of ${due} players due - some failed, check server logs.`);
            } else {
                toast.success(`Sent to ${sent} player${sent === 1 ? "" : "s"}.`);
            }
            onClose();
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to send the reminder"));
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Send Payment Due Email"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isSending} startIcon={<MailOutlined />}>
                        {isSending ? "Sending..." : "Send"}
                    </Button>
                </>
            }
        >
            <p className="mb-4 text-theme-sm text-gray-500 dark:text-gray-400">
                Emails every active player who has no club-dues payment recorded for the month you pick below - except anyone whose payment for that month has been omitted.
            </p>
            <FormInput label="Month" type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        </Modal>
    );
}

/** Every player's club-dues collection status, month by month - click any cell to see what's
 * recorded for that player/month and log a new payment on any date, without leaving the page. */
export default function MonthlyPaymentsPage() {
    const loginInfo = useSelector(selectLoginInfo);
    const admin = isAdmin(loginInfo.roles);
    const [showSendReminder, setShowSendReminder] = useState(false);

    if (!admin) {
        return <p className="text-theme-sm text-gray-400 dark:text-gray-500">Admins only.</p>;
    }

    return (
        <div className="mx-auto max-w-7xl">
            <nav className="mb-4 flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-brand-500"><HomeFilled /></Link>
                <span>/</span>
                <Link to="/players" className="hover:text-brand-500">Player</Link>
                <span>/</span>
                <span className="text-gray-800 dark:text-white/90">Player Monthly Payments</span>
            </nav>

            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <BarChartOutlined className="text-brand-500 dark:text-brand-400" />
                    Player Monthly Payments
                </h1>
                <Button onClick={() => setShowSendReminder(true)} startIcon={<MailOutlined />}>
                    Send Payment Due Email
                </Button>
            </div>
            <p className="mb-6 text-theme-sm text-gray-500 dark:text-gray-400">
                Every player's club-dues collection status, month by month. "Due" marks an active player with nothing recorded for the current month.
                Click any cell to see what's already recorded, log a payment for that player on any date, or omit that month's payment so they are neither shown as Due nor sent a reminder for it.
            </p>

            <PlayerCollectionMetrics />

            {showSendReminder && <SendReminderModal onClose={() => setShowSendReminder(false)} />}
        </div>
    );
}
