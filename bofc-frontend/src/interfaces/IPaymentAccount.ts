type PaymentAccountType = "BANK" | "BKASH";

interface IPaymentAccount {
  id: number;
  accountType: PaymentAccountType;
  accountName: string;
  accountNumber: string;
  bankName?: string | null;
  branch?: string | null;
  note?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export type { PaymentAccountType };
export default IPaymentAccount;
