import ICostType from "./ICostType";

interface IMonthlyCost {
    id: number;
    name: string;
    description: string;
    costType: ICostType;
    amount: number;
    monthOfCost: Date;
    createdDate: Date;
    updatedDate: Date;
}

export default IMonthlyCost;