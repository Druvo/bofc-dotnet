import {
    EditOutlined,
    SearchOutlined,
    PlusOutlined,
    CalendarOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../../settings";
import dayjs from "dayjs";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import { useDispatch, useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
import ICostType from "../../../interfaces/ICostType";
import IPaymentAccount from "../../../interfaces/IPaymentAccount";
import axiosApi from "../../../state/api/axiosBase";
import { acCollectionApi } from "../../../state/features/account/accountSlice";
import AcBillPaymentGraph from "./AcBillPaymentGraph";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import Badge from "../../ui/badge";
import Loader from "../../ui/loader";

type SortField = "paymentDate" | "amount" | null;

function AcBillPayment() {
    const dispatch = useDispatch();
    const loginInfo = useSelector(selectLoginInfo);
    const canManage = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

    const [tableLoadingSpin, setTableSpinLoading] = useState(false);
    const [costTypeApiLoading, setCostTypeApiLoading] = useState(false);
    const [acBillPayments, setAcBillPayments] = useState<IAcBillPayment[]>([]);
    const [acBillPaymentId, setAcBillPaymentId] = useState<number>();
    const [costTypes, setCostTypes] = useState<ICostType[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<IPaymentAccount[]>([]);

    const [searchText, setSearchText] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const [modalLoadingSpin, setModalSpinLoading] = useState(false);
    const [modalState, setModalState] = useState<"CREATE" | "UPDATE">("CREATE");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

    const [code, setCode] = useState("");
    const [costTypeId, setCostTypeId] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<number | "">("");
    const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

    useEffect(() => {
        getAcBillPaymentList();
        getCostTypes();
        getPaymentAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getAcBillPaymentList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/bill-payments`)
            .then((response) => {
                setAcBillPayments(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                console.log("server error", err);
                setTableSpinLoading(false);
            });
    };

    const getUniqueYears = () => [...new Set(acBillPayments.map((item) => dayjs(item.paymentDate).year()))];
    const getUniqueMonths = () => [...new Set(acBillPayments.map((item) => dayjs(item.paymentDate).format("MMMM")))];

    const clearModalField = () => {
        setCode("");
        setCostTypeId("");
        setAmount(0);
        setDescription("");
        setPaymentDate(dayjs().format("YYYY-MM-DD"));
        setSelectedPaymentAccountId("");
        setFormErrors({});
    };

    const showModal = () => {
        clearModalField();
        setModalOpen(true);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    const filteredPayments = useMemo(() => {
        let rows = [...acBillPayments];
        if (searchText) {
            const q = searchText.toLowerCase();
            rows = rows.filter((r) => r.code?.toLowerCase().includes(q) || r.voucherCode?.toLowerCase().includes(q));
        }
        if (yearFilter) rows = rows.filter((r) => dayjs(r.paymentDate).year() === Number(yearFilter));
        if (monthFilter) rows = rows.filter((r) => dayjs(r.paymentDate).format("MMMM") === monthFilter);
        if (sortField) {
            rows.sort((a, b) => {
                let diff = 0;
                if (sortField === "paymentDate") diff = dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix();
                else if (sortField === "amount") diff = a.amount - b.amount;
                return sortOrder === "asc" ? diff : -diff;
            });
        }
        return rows;
    }, [acBillPayments, searchText, yearFilter, monthFilter, sortField, sortOrder]);

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
        if (!costTypeId) errors.costTypeId = "CostType can not be null!";
        if (!amount) errors.amount = "amount can not be null!";
        if (!paymentDate) errors.paymentDate = "Payment date cannot be null!";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const modalFormSubmit = async () => {
        if (!validate()) return;
        setModalConfirmLoading(true);

        const requestData = {
            costTypeId: Number(costTypeId),
            amount,
            description,
            paymentDate,
            isPaid: true,
            paymentAccountId: selectedPaymentAccountId || null,
        };

        if (modalState === "CREATE") {
            axiosApi
                .post(`${API_URL}/ac/bill-payments`, requestData)
                .then(() => {
                    setModalOpen(false);
                    clearModalField();
                    setModalConfirmLoading(false);
                    getAcBillPaymentList();
                    // This page's own list is refreshed above via getAcBillPaymentList(),
                    // but other consumers (e.g. Dashboard's SpendingBreakdownWidget) read
                    // through the RTK Query cache, which this raw axios call bypasses.
                    // Invalidate it so those consumers refetch too.
                    dispatch(acCollectionApi.util.invalidateTags(["acBillPayment"]));
                })
                .catch(() => {
                    setModalConfirmLoading(false);
                });
        } else {
            axiosApi
                .put(`${API_URL}/ac/bill-payments/${acBillPaymentId}`, requestData)
                .then(() => {
                    clearModalField();
                    setModalOpen(false);
                    setModalConfirmLoading(false);
                    getAcBillPaymentList();
                    dispatch(acCollectionApi.util.invalidateTags(["acBillPayment"]));
                    setModalState("CREATE");
                })
                .catch(() => {
                    setModalConfirmLoading(false);
                });
        }
    };

    const getCostTypes = () => {
        setCostTypeApiLoading(true);
        axiosApi
            .get(`${API_URL}/cost-types`)
            .then((response) => {
                if (response.data?.content) setCostTypes(response.data.content);
                setCostTypeApiLoading(false);
            })
            .catch(() => {
                setCostTypeApiLoading(false);
            });
    };

    const getPaymentAccounts = () => {
        axiosApi
            .get(`${API_URL}/payment-accounts`)
            .then((response) => {
                if (response.data?.content) setPaymentAccounts(response.data.content);
            })
            .catch(() => {});
    };

    const updateAction = (id: number) => {
        setAcBillPaymentId(id);
        setModalState("UPDATE");
        setModalOpen(true);
        setModalSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/bill-payments/${id}`)
            .then((response) => {
                const c = response.data.content;
                setCode(c.code || "");
                setCostTypeId(c.costType?.id ? String(c.costType.id) : "");
                setAmount(c.amount);
                setDescription(c.description || "");
                setPaymentDate(dayjs(c.paymentDate).format("YYYY-MM-DD"));
                setSelectedPaymentAccountId(c.paymentAccountId || "");
                setModalSpinLoading(false);
            })
            .catch(() => {
                setModalSpinLoading(false);
            });
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <WalletOutlined className="text-brand-500 dark:text-brand-400" />
                    Bill Payments
                </h2>
                {canManage && (
                    <Button type="button" startIcon={<PlusOutlined />} onClick={showModal}>New Bill Payment</Button>
                )}
            </div>

            {acBillPayments.length > 0 && <AcBillPaymentGraph acBillPayments={acBillPayments} />}

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Search Bill ID or Voucher"
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
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Bill ID</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Voucher</th>
                                <th onClick={() => toggleSort("paymentDate")} className="cursor-pointer px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Date</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Cost Type</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Paid From</th>
                                <th onClick={() => toggleSort("amount")} className="cursor-pointer px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                                {canManage && <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredPayments.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-3 py-2.5">{record.code ? <Badge variant="light">{record.code}</Badge> : <span className="text-gray-400">—</span>}</td>
                                    <td className="px-3 py-2.5">{record.voucherCode ? <Badge variant="light">{record.voucherCode}</Badge> : <span className="text-gray-400">—</span>}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                            <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                                            {dayjs(record.paymentDate).format("DD-MMM-YYYY")}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {record.costType?.name ? <Badge variant="light">{record.costType.name}</Badge> : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                        {record.paymentAccountName || <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800 dark:text-white/90"><FormatCurrencyWithSymbol amount={record.amount} /></td>
                                    {canManage && (
                                        <td className="px-3 py-2.5">
                                            <Button type="button" variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<EditOutlined />} onClick={() => updateAction(record.id)}>Edit</Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={handleCancel}
                title="Bill Payment"
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
                        {modalState !== "CREATE" && <FormInput label="Bill ID" value={code} readOnly />}

                        <FormSelect
                            label="CostType"
                            placeholder="Select a CostType"
                            value={costTypeId}
                            disabled={costTypeApiLoading}
                            onChange={(e) => setCostTypeId(e.target.value)}
                            error={formErrors.costTypeId}
                            options={costTypes.map((ct) => ({ value: ct.id, label: ct.name }))}
                        />

                        <FormInput type="number" label="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} error={formErrors.amount} />

                        <FormInput type="date" label="Date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} error={formErrors.paymentDate} />

                        <FormSelect
                            label="Paid From (optional)"
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
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default AcBillPayment;
