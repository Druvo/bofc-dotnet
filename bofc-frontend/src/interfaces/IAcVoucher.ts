import IAcBillPayment from "./IAcBillPayment";
import IAcCollection from "./IAcCollection";
import IAcVoucherType from "./IAcVoucherType";
import IPlayer from "./IPlayer";

interface IAcVoucher {
    id: number;
    code: string;
    voucherDate: Date;

    narration?: string;
    postFlag?: Boolean;
    amount: number;
    postedBy?: IPlayer;
    postDate: Date;
    createdDate: Date;
    updatedDate: Date;
    voucherType: IAcVoucherType;
    collection?: IAcCollection;
    billPayment?: IAcBillPayment;
}

export default IAcVoucher;

    // private List<AcVoucherDetailResponse> details;