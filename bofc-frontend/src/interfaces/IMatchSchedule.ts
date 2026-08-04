import IVenue from "./IVenue";

interface IMatchSchedule {
    id: number;
    name: string;
    isActive: Boolean;
    dateTime: Date;
    venue: IVenue;
    createdDate: Date;
    updatedDate: Date;
}

export default IMatchSchedule;