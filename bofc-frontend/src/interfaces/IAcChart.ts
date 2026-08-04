import IAcNature from "./IAcNature";

interface IAcChart {
    id: number;
    name: string;
    code: number;
    description?: string;
    parent?: IAcChart;
    parentNo?: number;
    nature: IAcNature;
    natureNo: number;
    active: Boolean;

}

export default IAcChart;