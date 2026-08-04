import ICostType from "./ICostType";

interface IAcBillPayment {
    id: number;
    code: string;
    amount: number;
    paymentDate: Date;
    description?: string;
    voucherCode?: string;
    voucherId?: number;
    paymentAccountId?: number;
    paymentAccountName?: string;
    costType: ICostType;
    paid: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IAcBillPayment;