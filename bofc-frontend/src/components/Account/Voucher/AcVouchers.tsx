import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import IAcVoucher from "../../../interfaces/IAcVoucher";
import IPlayer from "../../../interfaces/IPlayer";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import { showErrorNotification } from "../../../utils/errorNotification";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import axiosApi from "../../../state/api/axiosBase";
import { SearchOutlined, PlusOutlined, CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";
import { formatCurrency } from "../../../utils/formatCurrency";

type SortField = "voucherDate" | "amount" | null;

function AcVouchers() {
    const loginInfo = useSelector(selectLoginInfo);

    const [tableLoadingSpin, setTableSpinLoading] = useState(false);
    const [playerApiLoading, setPlayerApiLoading] = useState(false);

    const [acVouchers, setAcVouchers] = useState<IAcVoucher[]>([]);
    const [acVoucherId, setAcVoucherId] = useState<number>();
    const [playerListSize, setPlayerListSize] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState(1000);
    const [players, setPlayers] = useState<IPlayer[]>([]);

    const [searchText, setSearchText] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const [modalLoadingSpin, setModalSpinLoading] = useState(false);
    const [modalState, setModalState] = useState<"CREATE" | "UPDATE">("CREATE");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

    const [transactionId, setTransactionId] = useState("");
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
    const [monthOfPayment, setMonthOfPayment] = useState(dayjs().format("YYYY-MM"));
    const [description, setDescription] = useState("");
    const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

    useEffect(() => {
        getAcVoucherList();
        getPlayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getAcVoucherList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`ac/vouchers`)
            .then((response) => {
                setAcVouchers(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to load vouchers") });
                setTableSpinLoading(false);
            });
    };

    const getUniqueMonths = () => [...new Set(acVouchers.map((item) => dayjs(item.voucherDate).format("MMMM")))];
    const getUniqueYears = () => [...new Set(acVouchers.map((item) => dayjs(item.voucherDate).year()))];

    const clearModalField = () => {
        setTransactionId("");
        setSelectedPlayerIds([]);
        setPaymentAmount(1000);
        setMonthOfPayment(dayjs().format("YYYY-MM"));
        setDescription("");
        setFormErrors({});
    };

    const showModal = () => {
        clearModalField();
        setModalState("CREATE");
        setModalOpen(true);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    const filteredVouchers = useMemo(() => {
        let rows = [...acVouchers];
        if (searchText) {
            const q = searchText.toLowerCase();
            rows = rows.filter((r) => r.code?.toLowerCase().includes(q));
        }
        if (yearFilter) rows = rows.filter((r) => dayjs(r.voucherDate).year() === Number(yearFilter));
        if (monthFilter) rows = rows.filter((r) => dayjs(r.voucherDate).format("MMMM") === monthFilter);
        if (sortField) {
            rows.sort((a, b) => {
                let diff = 0;
                if (sortField === "voucherDate") diff = dayjs(a.voucherDate).unix() - dayjs(b.voucherDate).unix();
                else if (sortField === "amount") diff = a.amount - b.amount;
                return sortOrder === "asc" ? diff : -diff;
            });
        }
        return rows;
    }, [acVouchers, searchText, yearFilter, monthFilter, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField !== field) { setSortField(field); setSortOrder("asc"); }
        else if (sortOrder === "asc") setSortOrder("desc");
        else setSortField(null);
    };

    useEffect(() => {
        setPlayerListSize(selectedPlayerIds.length);
    }, [selectedPlayerIds]);

    const validate = () => {
        const errors: Partial<Record<string, string>> = {};
        if (selectedPlayerIds.length === 0) errors.playerIds = "Player can not be null!";
        if (!paymentAmount) errors.amount = "amount can not be null!";
        if (!monthOfPayment) errors.monthOfPayment = "amount can not be null!";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const modalFormSubmit = async () => {
        if (!validate()) return;
        setModalConfirmLoading(true);

        const payload = {
            playerIds: selectedPlayerIds,
            amount: paymentAmount,
            description,
            monthOfPayment,
        };

        if (modalState === "CREATE") {
            axiosApi
                .post(`ac/vouchers`, payload)
                .then(() => {
                    setModalOpen(false);
                    clearModalField();
                    setModalConfirmLoading(false);
                    getAcVoucherList();
                })
                .catch((err) => {
                    showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to create voucher") });
                    setModalConfirmLoading(false);
                });
        } else {
            axiosApi
                .put(`ac/vouchers/${acVoucherId}`, payload)
                .then(() => {
                    clearModalField();
                    setModalOpen(false);
                    setModalConfirmLoading(false);
                    getAcVoucherList();
                    setModalState("CREATE");
                })
                .catch((err) => {
                    showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to update voucher") });
                    setModalConfirmLoading(false);
                });
        }
    };

    const getPlayers = () => {
        setPlayerApiLoading(true);
        axiosApi
            .get(`players`)
            .then((response) => {
                if (response.data?.content) setPlayers(response.data.content);
                setPlayerApiLoading(false);
            })
            .catch((err) => {
                showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to load players") });
                setPlayerApiLoading(false);
            });
    };

    const canManage = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <FileTextOutlined className="text-brand-500 dark:text-brand-400" />
                    Vouchers
                </h2>
                {canManage && (
                    <Button type="button" startIcon={<PlusOutlined />} onClick={showModal}>New Voucher</Button>
                )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Search Voucher No"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
                    />
                </div>
                <FormSelect className="!h-10 w-[130px]" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} options={[{ value: "", label: "All Years" }, ...getUniqueYears().map((y) => ({ value: y, label: String(y) }))]} />
                <FormSelect className="!h-10 w-[160px]" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} options={[{ value: "", label: "All Months" }, ...getUniqueMonths().map((m) => ({ value: m, label: m }))]} />
            </div>

            {tableLoadingSpin ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Voucher No</th>
                                <th onClick={() => toggleSort("voucherDate")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Date</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Type</th>
                                <th onClick={() => toggleSort("amount")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredVouchers.map((record) => {
                                const ref = record.collection ? record.collection.transactionId : record.billPayment ? record.billPayment.code : "";
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                        <td className="px-3 py-2.5"><Badge variant="light">{record.code}</Badge></td>
                                        <td className="px-3 py-2.5">
                                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                                                {moment.utc(record.voucherDate).local().format("YYYY-MMM-DD")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5"><Badge variant="light">{record.voucherType.name}</Badge></td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800 dark:text-white/90"><FormatCurrencyWithSymbol amount={record.amount} /></td>
                                        <td className="px-3 py-2.5">{ref ? <Badge variant="light">{ref}</Badge> : <span className="text-gray-400">-</span>}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={handleCancel}
                title="Monthly Voucher"
                className="max-w-[700px]"
                footer={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                        <Button type="button" size="sm" disabled={modalConfirmLoading} onClick={modalFormSubmit}>{modalState === "CREATE" ? "Create" : "Change"}</Button>
                    </>
                }
            >
                {modalLoadingSpin ? (
                    <Loader className="py-8" />
                ) : (
                    <div className="flex flex-col gap-4">
                        {modalState !== "CREATE" && <FormInput label="Transaction ID" value={transactionId} readOnly />}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Player</label>
                            <select
                                multiple
                                value={selectedPlayerIds.map(String)}
                                disabled={playerApiLoading}
                                onChange={(e) => setSelectedPlayerIds(Array.from(e.target.selectedOptions).map((o) => Number(o.value)))}
                                className={`h-40 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 dark:bg-[var(--color-paper-3)] ${formErrors.playerIds ? "border-error-500 focus:border-error-300 focus:ring-error-500/10" : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"}`}
                            >
                                {players.map((player) => (
                                    <option key={player.id} value={player.id}>{player.name} [{player.employeeId}]</option>
                                ))}
                            </select>
                            {formErrors.playerIds && <p className="mt-1.5 text-theme-xs text-error-500">{formErrors.playerIds}</p>}
                        </div>

                        <FormInput type="number" label="Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} error={formErrors.amount} />

                        <FormInput type="month" label="Month of Voucher" value={monthOfPayment} onChange={(e) => setMonthOfPayment(e.target.value)} error={formErrors.monthOfPayment} />

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Comments</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
                            />
                        </div>

                        {playerListSize > 0 && (
                            <p className="text-theme-sm text-success-600 dark:text-success-500">
                                Total transaction amount is <strong>{formatCurrency(playerListSize * paymentAmount, { decimals: 0 })}</strong>.
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default AcVouchers;
