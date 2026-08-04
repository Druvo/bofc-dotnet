import { AcNatureType } from "../components/Enum/AcNatureType";

interface IAcNature {
    id: number;
    name: string;
    code: number;
    // type: string;
    type: AcNatureType;
    slNo: number;

}

export default IAcNature;