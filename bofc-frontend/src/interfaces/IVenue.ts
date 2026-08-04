interface IVenue {
    id: number;
    name: string;
    address: string;
    mapLink?: string;
    active: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IVenue;