export interface JerseyColorOption {
  value: string;
  label: string;
  swatch: string;
}

export const JERSEY_COLOR_PALETTE: JerseyColorOption[] = [
  { value: "red", label: "Red", swatch: "#DC2626" },
  { value: "yellow", label: "Yellow", swatch: "#EAB308" },
  { value: "blue", label: "Blue", swatch: "#2563EB" },
  { value: "green", label: "Green", swatch: "#16A34A" },
  { value: "orange", label: "Orange", swatch: "#EA580C" },
  { value: "purple", label: "Purple", swatch: "#9333EA" },
  { value: "white", label: "White", swatch: "#FFFFFF" },
  { value: "black", label: "Black", swatch: "#000000" },
];

export function getJerseySwatch(color?: string | null): string | undefined {
  if (!color) return undefined;
  return JERSEY_COLOR_PALETTE.find((c) => c.value === color)?.swatch || color;
}

export function getJerseyLabel(color?: string | null): string | undefined {
  if (!color) return undefined;
  return JERSEY_COLOR_PALETTE.find((c) => c.value === color)?.label || color;
}
