import { AcNatureType } from "../Enum/AcNatureType";

export default function getEnumKeyByValue(enumObj: any, value: string) {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
}

export const getEnumValueByKey = (key: keyof typeof AcNatureType): string => {
    return AcNatureType[key];
  };
  