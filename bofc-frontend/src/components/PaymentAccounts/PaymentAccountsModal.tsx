import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  BankOutlined,
  MobileOutlined,
  CopyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Modal from "../ui/modal";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import { Spinner } from "../ui/loader";
import {
  useGetActivePaymentAccountsQuery,
  useGetAllPaymentAccountsQuery,
  useCreatePaymentAccountMutation,
  useUpdatePaymentAccountMutation,
  useDeletePaymentAccountMutation,
} from "../../state/features/paymentAccounts/paymentAccountSlice";
import IPaymentAccount, { PaymentAccountType } from "../../interfaces/IPaymentAccount";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";

interface PaymentAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

const emptyForm = {
  accountType: "BANK" as PaymentAccountType,
  accountName: "",
  accountNumber: "",
  bankName: "",
  branch: "",
  note: "",
  displayOrder: 0,
  isActive: true,
};

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.success("Copied to clipboard");
};

const PaymentAccountsModal: React.FC<PaymentAccountsModalProps> = ({ isOpen, onClose, isAdmin }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Admins see inactive accounts too (so they can re-activate them); everyone
  // else only ever sees the active list.
  const activeQuery = useGetActivePaymentAccountsQuery(undefined, { skip: isAdmin });
  const allQuery = useGetAllPaymentAccountsQuery(undefined, { skip: !isAdmin });
  const { data, isLoading } = isAdmin ? allQuery : activeQuery;
  const accounts = data?.content || [];

  const [createPaymentAccount, { isLoading: isCreating }] = useCreatePaymentAccountMutation();
  const [updatePaymentAccount, { isLoading: isUpdating }] = useUpdatePaymentAccountMutation();
  const [deletePaymentAccount] = useDeletePaymentAccountMutation();

  const isSaving = isCreating || isUpdating;

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (account: IPaymentAccount) => {
    setEditingId(account.id);
    setForm({
      accountType: account.accountType,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName || "",
      branch: account.branch || "",
      note: account.note || "",
      displayOrder: account.displayOrder,
      isActive: account.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim()) {
      toast.error("Account name and number are required");
      return;
    }

    try {
      if (editingId) {
        await updatePaymentAccount({ id: editingId, data: form }).unwrap();
        toast.success("Payment account updated");
      } else {
        await createPaymentAccount(form).unwrap();
        toast.success("Payment account added");
      }
      setIsFormOpen(false);
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Failed to save payment account"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remove this payment account?")) return;
    try {
      await deletePaymentAccount(id).unwrap();
      toast.success("Payment account removed");
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Failed to remove payment account"));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Accounts Information" className="max-w-[560px]">
      {isFormOpen ? (
        <div className="flex flex-col gap-4">
          <FormSelect
            label="Type"
            value={form.accountType}
            onChange={(e) => setForm({ ...form, accountType: e.target.value as PaymentAccountType })}
            options={[
              { value: "BANK", label: "Bank" },
              { value: "BKASH", label: "bKash Personal" },
            ]}
          />
          <FormInput
            label="Account Name"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          />
          <FormInput
            label={form.accountType === "BKASH" ? "bKash Number" : "Account Number"}
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          />
          {form.accountType === "BANK" && (
            <>
              <FormInput
                label="Bank"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
              <FormInput
                label="Branch"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </>
          )}
          <FormInput
            label="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="e.g. Please add withdrawal charge if you send via bKash"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active (visible to players)
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <Spinner className="my-4 text-gray-400" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No payment accounts added yet.</p>
          ) : (
            accounts.map((account, idx) => (
              <div key={account.id}>
                {idx > 0 && <div className="mb-4 border-t border-gray-100 dark:border-gray-800" />}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                      {account.accountType === "BKASH" ? <MobileOutlined /> : <BankOutlined />}
                    </span>
                    <div className="min-w-0">
                      {account.accountType === "BKASH" ? (
                        <>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">bKash Personal</div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(account.accountNumber)}
                            className="mt-0.5 flex items-center gap-1.5 text-theme-sm text-gray-600 hover:text-brand-500 dark:text-gray-300"
                          >
                            {account.accountNumber} <CopyOutlined className="text-theme-xs" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{account.accountName}</div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(account.accountNumber)}
                            className="mt-0.5 flex items-center gap-1.5 text-theme-sm text-gray-600 hover:text-brand-500 dark:text-gray-300"
                          >
                            A/C: {account.accountNumber} <CopyOutlined className="text-theme-xs" />
                          </button>
                          <div className="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
                            {[account.bankName, account.branch].filter(Boolean).join(" — ")}
                          </div>
                        </>
                      )}
                      {account.note && (
                        <div className="mt-1 text-theme-xs italic text-gray-400 dark:text-gray-500">{account.note}</div>
                      )}
                      {isAdmin && !account.isActive && (
                        <div className="mt-1 text-theme-xs font-semibold uppercase text-error-500">Inactive</div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(account)}
                        className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                      >
                        <EditOutlined />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(account.id)}
                        className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/5"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isAdmin && (
            <div className="mt-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button variant="outline" size="sm" startIcon={<PlusOutlined />} onClick={openAddForm}>
                Add Payment Account
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PaymentAccountsModal;
