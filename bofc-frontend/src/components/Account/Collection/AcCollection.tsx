import { EditOutlined, SearchOutlined, PlusOutlined, CalendarOutlined, ContainerOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { showErrorNotification } from "../../../utils/errorNotification";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import IAcCollection from "../../../interfaces/IAcCollection";
import IPlayer from "../../../interfaces/IPlayer";
import IPaymentAccount from "../../../interfaces/IPaymentAccount";
import { API_URL } from "../../../settings";
import axiosApi from "../../../state/api/axiosBase";
import { acCollectionApi } from "../../../state/features/account/accountSlice";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import PlayerMonthlyAmountChart from "./PlayerMonthlyAmountChart";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";

type SortField = "date" | "monthOfPayment" | "amount" | "totalAmount" | null;
type SortOrder = "asc" | "desc";

function AcCollection() {
    const dispatch = useDispatch();
    const loginInfo = useSelector(selectLoginInfo);
    const canManage = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");
    const [tableLoadingSpin, setTableSpinLoading] = useState(false);
    const [playerApiLoading, setPlayerApiLoading] = useState(false);

    const [acCollections, setAcCollections] = useState<IAcCollection[]>([]);
    const [acCollectionId, setAcCollectionId] = useState<number>();
    const [players, setPlayers] = useState<IPlayer[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<IPaymentAccount[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [searchText, setSearchText] = useState("");
    const [yearFilter, setYearFilter] = useState<string>("");
    const [monthFilter, setMonthFilter] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format("YYYY-MM"));
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
    const [amount, setAmount] = useState<number>(1000);
    const [description, setDescription] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<number | "">("");
    const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

    const [modalState, setModalState] = useState<"CREATE" | "UPDATE">("CREATE");
    const [modalOkButtonText, setModalOkButtonText] = useState("Create");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);
    const [modalLoadingSpin, setModalSpinLoading] = useState(false);
    const [isMultiPlayers, setIsMultiPlayers] = useState(false);

    const getUniqueMonths = () => [...new Set(acCollections.map((item) => dayjs(item.monthOfPayment).format("MMMM")))];
    const getUniqueYears = () => [...new Set(acCollections.map((item) => dayjs(item.date).year()))];

    useEffect(() => {
        getAcCollectionList();
        getPlayers();
        getPaymentAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getAcCollectionList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/collections`)
            .then((response) => {
                setAcCollections(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to load collections") });
                setTableSpinLoading(false);
            });
    };

    useEffect(() => {
        setModalOkButtonText(modalState === "CREATE" ? "Create" : "Change");
    }, [modalState]);

    const clearModalField = () => {
        setTransactionId("");
        setSelectedPlayerIds([]);
        setAmount(1000);
        setDescription("");
        setSelectedDate(dayjs().format("YYYY-MM-DD"));
        setSelectedMonth(dayjs().format("YYYY-MM"));
        setSelectedPaymentAccountId("");
        setFormErrors({});
    };

    const showModal = () => {
        clearModalField();
        setIsMultiPlayers(false);
        setModalOkButtonText("Create");
        setModalOpen(true);
    };

    const showModalForMultiple = () => {
        clearModalField();
        setIsMultiPlayers(true);
        setModalOkButtonText("Create(s)");
        setModalOpen(true);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    const filteredCollections = useMemo(() => {
        let rows = [...acCollections];

        if (searchText) {
            const q = searchText.toLowerCase();
            rows = rows.filter(
                (r) => r.transactionId?.toLowerCase().includes(q) || r.voucherCode?.toLowerCase().includes(q)
            );
        }
        if (yearFilter) {
            rows = rows.filter((r) => dayjs(r.date).year() === Number(yearFilter));
        }
        if (monthFilter) {
            rows = rows.filter((r) => dayjs(r.monthOfPayment).format("MMMM") === monthFilter);
        }
        if (sortField) {
            rows.sort((a, b) => {
                let diff = 0;
                if (sortField === "date") diff = dayjs(a.date).unix() - dayjs(b.date).unix();
                else if (sortField === "monthOfPayment") diff = dayjs(a.monthOfPayment).unix() - dayjs(b.monthOfPayment).unix();
                else if (sortField === "amount") diff = a.amount - b.amount;
                else if (sortField === "totalAmount") diff = a.totalAmount - b.totalAmount;
                return sortOrder === "asc" ? diff : -diff;
            });
        }
        return rows;
    }, [acCollections, searchText, yearFilter, monthFilter, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField !== field) {
            setSortField(field);
            setSortOrder("asc");
        } else if (sortOrder === "asc") {
            setSortOrder("desc");
        } else {
            setSortField(null);
        }
    };

    const validate = () => {
        const errors: Partial<Record<string, string>> = {};
        if (selectedPlayerIds.length === 0) errors.playerIds = "Player can not be null!";
        if (!selectedDate) errors.date = "Date can not be null!";
        if (!amount) errors.amount = "Amount can not be null!";
        if (!selectedMonth) errors.monthOfPayment = "Month can not be null!";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const modalFormSubmit = async () => {
        if (!validate()) return;
        setModalConfirmLoading(true);

        const requestData = {
            playerIds: selectedPlayerIds,
            amount,
            description,
            monthOfPayment: `${selectedMonth}-01`,
            date: selectedDate,
            paymentAccountId: selectedPaymentAccountId || null,
        };

        if (modalState === "CREATE") {
            axiosApi
                .post(`${API_URL}/ac/collections`, requestData)
                .then(() => {
                    setModalOpen(false);
                    clearModalField();
                    setModalConfirmLoading(false);
                    getAcCollectionList();
                    // This page keeps its own local state fresh via getAcCollectionList()
                    // above, but other consumers of this data (e.g. Dashboard's
                    // RecentActivityWidget) read through the RTK Query cache, which this
                    // raw axios call bypasses entirely. Invalidate it so they refetch too.
                    dispatch(acCollectionApi.util.invalidateTags(["acCollection"]));
                    toast.success("Collection created successfully");
                })
                .catch((err) => {
                    showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to create collection") });
                    setModalConfirmLoading(false);
                });
        } else {
            axiosApi
                .put(`${API_URL}/ac/collections/${acCollectionId}`, requestData)
                .then(() => {
                    clearModalField();
                    setModalOpen(false);
                    setModalConfirmLoading(false);
                    getAcCollectionList();
                    dispatch(acCollectionApi.util.invalidateTags(["acCollection"]));
                    setModalState("CREATE");
                    toast.success("Collection updated successfully");
                })
                .catch((err) => {
                    showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to update collection") });
                    setModalConfirmLoading(false);
                });
        }
    };

    const getPlayers = () => {
        setPlayerApiLoading(true);
        axiosApi
            .get(`${API_URL}/players`)
            .then((response) => {
                if (response.data?.content) setPlayers(response.data.content);
                setPlayerApiLoading(false);
            })
            .catch((err) => {
                showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to load players") });
                setPlayerApiLoading(false);
            });
    };

    const getPaymentAccounts = () => {
        axiosApi
            .get(`${API_URL}/payment-accounts`)
            .then((response) => {
                if (response.data?.content) setPaymentAccounts(response.data.content);
            })
            .catch((err) => {
                showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to load payment accounts") });
            });
    };

    const updateAction = (id: number) => {
        setAcCollectionId(id);
        setModalState("UPDATE");
        setModalOpen(true);
        setModalSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/collections/${id}`)
            .then((response) => {
                const c = response.data.content;
                setSelectedDate(dayjs(c.date).format("YYYY-MM-DD"));
                setSelectedMonth(dayjs(c.monthOfPayment).format("YYYY-MM"));
                setTransactionId(c.transactionId || "");
                setAmount(c.amount);
                setDescription(c.description || "");
                setSelectedPaymentAccountId(c.paymentAccountId || "");

                const playerIds = c.playerIds;
                const ids = Array.isArray(playerIds) ? playerIds : [playerIds];
                setSelectedPlayerIds(ids);

                if (ids.length > 1) {
                    setModalOkButtonText("Change(s)");
                    setIsMultiPlayers(true);
                } else {
                    setModalOkButtonText("Change");
                    setIsMultiPlayers(false);
                }

                setModalSpinLoading(false);
            })
            .catch((err) => {
                showErrorNotification({ statusCode: err?.response?.status, message: normalizeErrorMessage(err?.response?.data, "Failed to load collection") });
                setModalSpinLoading(false);
                setModalOpen(false);
            });
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <span className="ml-1 inline-flex flex-col leading-none align-middle">
            <span className={`block h-0 w-0 border-b-[4px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${sortField === field && sortOrder === "asc" ? "border-b-brand-500" : "border-b-gray-300 dark:border-b-gray-600"}`} />
        </span>
    );

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <ContainerOutlined className="text-brand-500 dark:text-brand-400" />
                    Payment Collections
                </h2>
                {canManage && (
                    <div className="flex gap-2">
                        <Button type="button" startIcon={<PlusOutlined />} onClick={showModal}>New Collection</Button>
                        <Button type="button" variant="outline" startIcon={<PlusOutlined />} onClick={showModalForMultiple}>Bulk Collect</Button>
                    </div>
                )}
            </div>

            {acCollections.length > 0 && <PlayerMonthlyAmountChart acCollections={acCollections} />}

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Search TrxID or Voucher"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                    />
                </div>
                <FormSelect className="!h-10 w-[130px]" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} options={[{ value: "", label: "All Years" }, ...getUniqueYears().map((y) => ({ value: y, label: String(y) }))]} />
                <FormSelect className="!h-10 w-[160px]" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} options={[{ value: "", label: "All Months" }, ...getUniqueMonths().map((m) => ({ value: m, label: m }))]} />
            </div>

            {tableLoadingSpin ? (
                <Loader className="py-10" />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">TrxID</th>
                                <th onClick={() => toggleSort("date")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Date<SortIcon field="date" /></th>
                                <th onClick={() => toggleSort("monthOfPayment")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Month Of Payment<SortIcon field="monthOfPayment" /></th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Payer Name</th>
                                <th onClick={() => toggleSort("amount")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Amount<SortIcon field="amount" /></th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Voucher</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Received Into</th>
                                <th onClick={() => toggleSort("totalAmount")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Total Amount<SortIcon field="totalAmount" /></th>
                                {canManage && <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredCollections.map((record) => (
                                <>
                                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                        <td className="px-3 py-2.5">
                                            {record.transactionId ? <Badge variant="light">{record.transactionId}</Badge> : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                                                {dayjs(record.date).format("YYYY-MMM-DD")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{dayjs(record.monthOfPayment).format("MMM YYYY")}</td>
                                        <td className="px-3 py-2.5">
                                            {record.players.length > 1 ? (
                                                <button type="button" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)} className="text-theme-xs font-medium text-brand-500 hover:underline">
                                                    {expandedId === record.id ? "Hide" : "Expand to see"}
                                                </button>
                                            ) : (
                                                <span className="text-gray-700 dark:text-gray-300">{record.allPayersName}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800 dark:text-white/90"><FormatCurrencyWithSymbol amount={record.amount} /></td>
                                        <td className="px-3 py-2.5">
                                            {record.voucherCode ? <Badge variant="light">{record.voucherCode}</Badge> : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                            {record.paymentAccountName || <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-bold text-brand-500 dark:text-brand-400"><FormatCurrencyWithSymbol amount={record.totalAmount} /></td>
                                        {canManage && (
                                            <td className="px-3 py-2.5">
                                                <Button type="button" variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<EditOutlined />} onClick={() => updateAction(record.id)}>Edit</Button>
                                            </td>
                                        )}
                                    </tr>
                                    {expandedId === record.id && record.players.length > 1 && (
                                        <tr>
                                            <td colSpan={canManage ? 9 : 8} className="bg-gray-50 px-3 py-2.5 text-theme-sm text-gray-600 dark:bg-white/[0.02] dark:text-gray-300">
                                                {record.allPayersName}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={handleCancel}
                title="Payment Collection"
                className="max-w-[700px]"
                footer={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                        <Button type="button" size="sm" disabled={modalConfirmLoading} onClick={modalFormSubmit}>{modalOkButtonText}</Button>
                    </>
                }
            >
                {modalLoadingSpin ? (
                    <Loader className="py-8" />
                ) : (
                    <div className="flex flex-col gap-4">
                        {modalState !== "CREATE" && (
                            <FormInput label="Transaction ID" value={transactionId} readOnly />
                        )}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Player{isMultiPlayers ? "s" : ""}</label>
                            <select
                                multiple={isMultiPlayers}
                                value={isMultiPlayers ? selectedPlayerIds.map(String) : (selectedPlayerIds[0] ? String(selectedPlayerIds[0]) : "")}
                                disabled={playerApiLoading}
                                onChange={(e) => {
                                    if (isMultiPlayers) {
                                        const ids = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                                        setSelectedPlayerIds(ids);
                                    } else {
                                        setSelectedPlayerIds(e.target.value ? [Number(e.target.value)] : []);
                                    }
                                }}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 dark:bg-gray-900 ${isMultiPlayers ? "h-40" : "h-11"} ${formErrors.playerIds ? "border-error-500 focus:border-error-300 focus:ring-error-500/10" : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"}`}
                            >
                                {!isMultiPlayers && <option value="" disabled hidden>Select a Player</option>}
                                {players.map((player) => (
                                    <option key={player.id} value={player.id}>{player.name} [{player.employeeId}]</option>
                                ))}
                            </select>
                            {formErrors.playerIds && <p className="mt-1.5 text-theme-xs text-error-500">{formErrors.playerIds}</p>}
                        </div>

                        <FormInput type="date" label="Collection Date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} error={formErrors.date} />

                        <FormInput type="number" label="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} error={formErrors.amount} />

                        <FormInput type="month" label="Month of Collection" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} error={formErrors.monthOfPayment} />

                        <FormSelect
                            label="Received Into (optional)"
                            value={selectedPaymentAccountId}
                            onChange={(e) => setSelectedPaymentAccountId(e.target.value ? Number(e.target.value) : "")}
                            options={[
                                { value: "", label: "Not specified" },
                                ...paymentAccounts.map((a) => ({ value: a.id, label: `${a.accountName} (${a.accountType === "BKASH" ? "bKash" : a.bankName || "Bank"})` })),
                            ]}
                        />

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Comments</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>

                        {selectedPlayerIds.length > 0 && amount > 0 && (
                            <p className="text-theme-sm text-success-600 dark:text-success-500">
                                Total transaction amount is <strong>{selectedPlayerIds.length * amount}</strong> BDT.
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default AcCollection;
