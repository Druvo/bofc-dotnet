import IVenue from "../../../interfaces/IVenue";
import { BasicResType } from "../../responesTypes";

export interface AllVenueResType extends BasicResType {
    content: IVenue[];
}
