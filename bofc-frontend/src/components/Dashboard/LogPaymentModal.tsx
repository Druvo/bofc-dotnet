import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { PlusOutlined, StopOutlined, UndoOutlined } from "@ant-design/icons";
import { useGetAcCollectionsQuery, useCreateAcCollectionMutation } from "../../state/features/account/accountSlice";
import { playerCollectionMetricsApi } from "../../state/features/account/playerCollectionMetricsSlice";
import { useGetActivePaymentAccountsQuery } from "../../state/features/paymentAccounts/paymentAccountSlice";
import {
    useGetPaymentWaiversQuery,
    useWaivePaymentMutation,
    useRemovePaymentWaiverMutation,
} from "../../state/features/account/paymentWaiverSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import Avatar from "../CommonAtoms/Avatar";
import Modal from "../ui/modal";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";

interface LogPaymentModalProps {
    playerId: number;
    playerName: string;
    photoUrl?: string;
    /** 1-12 - the month cell that was clicked. */
    month: number;
    year: number;
    onClose: () => void;
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function LogPaymentModal({ playerId, playerName, photoUrl, month, year, onClose }: LogPaymentModalProps) {
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    // No filtered backend endpoint exists for "collections for one player in one month" - this
    // reuses the same unfiltered /ac/collections list the Collections (+) page already fetches
    // in full, filtering client-side. Acceptable at the current data volume (same approach that
    // page already relies on); worth a dedicated filtered endpoint if the collections table grows.
    const { data: collectionsData, isLoading: isLoadingCollections } = useGetAcCollectionsQuery();
    const existingEntries = useMemo(
        () =>
            (collectionsData?.content || []).filter((c) => {
                const d = new Date(c.monthOfPayment);
                return c.playerIds.includes(playerId) && d.getFullYear() === year && d.getMonth() + 1 === month;
            }),
        [collectionsData, playerId, year, month]
    );
    const totalRecorded = existingEntries.reduce((sum, c) => sum + c.amount, 0);

    const { data: paymentAccountsData } = useGetActivePaymentAccountsQuery();
    const paymentAccounts = paymentAccountsData?.content || [];

    const dispatch = useDispatch();
    const [createCollection, { isLoading: isSaving }] = useCreateAcCollectionMutation();
    const [date, setDate] = useState(() => {
        const now = dayjs();
        // Default to today if logging for the current month, otherwise the 1st of the
        // clicked month - "today" would be a confusing default for a past/future month.
        return now.year() === year && now.month() + 1 === month ? now.format("YYYY-MM-DD") : dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("YYYY-MM-DD");
    });
    const [amount, setAmount] = useState(1000);
    const [description, setDescription] = useState("");
    const [paymentAccountId, setPaymentAccountId] = useState<number | "">("");

    const { data: waiversData } = useGetPaymentWaiversQuery({ year });
    const waiver = (waiversData?.content || []).find((w) => w.playerId === playerId && w.month === month);
    const [waivePayment, { isLoading: isWaiving }] = useWaivePaymentMutation();
    const [removeWaiver, { isLoading: isRemovingWaiver }] = useRemovePaymentWaiverMutation();
    const [waiverReason, setWaiverReason] = useState("");

    const handleWaive = async () => {
        try {
            await waivePayment({ playerId, year, month, reason: waiverReason.trim() || undefined }).unwrap();
            toast.success(`${playerName}'s payment for ${monthLabel} omitted`);
            setWaiverReason("");
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to omit the payment"));
        }
    };

    const handleRemoveWaiver = async () => {
        if (!waiver) return;
        try {
            await removeWaiver({ id: waiver.id }).unwrap();
            toast.info(`${playerName} is due for ${monthLabel} again`);
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to undo the omission"));
        }
    };

    const handleSubmit = async () => {
        if (!amount || amount <= 0) {
            toast.error("Enter an amount greater than 0");
            return;
        }
        try {
            await createCollection({
                playerIds: [playerId],
                amount,
                date: new Date(date),
                monthOfPayment: new Date(`${year}-${String(month).padStart(2, "0")}-01`),
                description: description.trim() || undefined,
                paymentAccountId: paymentAccountId || undefined,
            }).unwrap();
            // createAcCollection only declares "acCollection" in invalidatesTags -
            // "playerCollectionMetrics" belongs to a different slice, so the Monthly Payments
            // table's query never gets auto-invalidated by that mutation alone. Same manual
            // dispatch pattern accountSlice.ts's own comment documents for AcCollection.tsx/
            // AcBillPayment.tsx closing this exact cross-slice gap.
            dispatch(playerCollectionMetricsApi.util.invalidateTags(["playerCollectionMetrics"]));
            toast.success(`Logged ${playerName}'s payment for ${monthLabel}`);
            setAmount(1000);
            setDescription("");
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to log the payment"));
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Log a Payment" className="max-w-[520px]">
            <div className="mb-5 flex items-center gap-3">
                <Avatar src={toAbsolutePlayerPhotoUrl(photoUrl)} name={playerName} seed={playerId} size={44} />
                <div>
                    <div className="font-semibold text-gray-800 dark:text-white/90">{playerName}</div>
                    <div className="text-theme-xs text-gray-500 dark:text-gray-400">{monthLabel}</div>
                </div>
            </div>

            <div className="mb-5">
                <h4 className="mb-2 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">Already recorded this month</h4>
                {isLoadingCollections ? (
                    <p className="text-theme-xs text-gray-400 dark:text-gray-500">Loading...</p>
                ) : existingEntries.length === 0 ? (
                    <p className="text-theme-xs text-gray-400 dark:text-gray-500">Nothing recorded yet for {monthLabel}.</p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {existingEntries.map((c) => (
                            <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-theme-xs dark:border-[var(--color-rule)]">
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(c.date).toLocaleDateString()}</span>
                                    {c.description && <span className="ml-2 text-gray-400 dark:text-gray-500">{c.description}</span>}
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-white/90">৳{c.amount.toFixed(0)}</span>
                            </div>
                        ))}
                        <div className="mt-1 flex items-center justify-between border-t border-gray-100 px-3 pt-2 text-theme-xs font-bold text-gray-800 dark:border-[var(--color-rule)] dark:text-white/90">
                            <span>Total</span>
                            <span>৳{totalRecorded.toFixed(0)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Omitting is the alternative to logging a payment: the player is not shown as Due
                for this month and gets no reminder for it. It records no money and posts no
                voucher, so it lives apart from the payment form below. */}
            <div className="mb-5 rounded-lg border border-gray-100 p-3 dark:border-[var(--color-rule)]">
                <h4 className="mb-1 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">Omit this month's payment</h4>
                {waiver ? (
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                            Omitted - not shown as Due and no reminder emails for {monthLabel}.
                            {waiver.reason && <span className="ml-1 text-gray-400 dark:text-gray-500">({waiver.reason})</span>}
                        </p>
                        <Button size="sm" variant="outline" onClick={handleRemoveWaiver} disabled={isRemovingWaiver} startIcon={<UndoOutlined />}>
                            {isRemovingWaiver ? "Undoing..." : "Undo"}
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
                            {playerName} won't be shown as Due for {monthLabel} or emailed a payment reminder for it. No money is recorded.
                        </p>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <FormInput
                                    value={waiverReason}
                                    maxLength={500}
                                    onChange={(e) => setWaiverReason(e.target.value)}
                                    placeholder="Reason (optional), e.g. away all month"
                                />
                            </div>
                            <Button variant="outline" onClick={handleWaive} disabled={isWaiving} startIcon={<StopOutlined />}>
                                {isWaiving ? "Omitting..." : "Omit Payment"}
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <h4 className="mb-3 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">Log a new payment</h4>
            <div className="grid grid-cols-2 gap-3">
                <FormInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <FormInput
                    label="Amount"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
            </div>
            {paymentAccounts.length > 0 && (
                <div className="mt-3">
                    <FormSelect
                        label="Received into (optional)"
                        placeholder="Not specified"
                        value={paymentAccountId}
                        onChange={(e) => setPaymentAccountId(e.target.value ? Number(e.target.value) : "")}
                        options={paymentAccounts.map((a) => ({ value: a.id, label: `${a.accountName}${a.bankName ? ` - ${a.bankName}` : ""}` }))}
                    />
                </div>
            )}
            <div className="mt-3">
                <FormInput label="Note (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Paid via cash" />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={handleSubmit} disabled={isSaving} startIcon={<PlusOutlined />}>
                    {isSaving ? "Logging..." : "Log Payment"}
                </Button>
            </div>
        </Modal>
    );
}
