import IPlayer from "./IPlayer";

interface IMonthlyCollection {
    id: number;
    player: IPlayer;
    name: string;
    description: string;
    amount: number;
    monthOfPayment: Date;
    isPaid: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IMonthlyCollection;