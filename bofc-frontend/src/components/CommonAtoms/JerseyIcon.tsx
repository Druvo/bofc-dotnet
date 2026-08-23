import React from "react";

interface JerseyIconProps {
  color: string;
  size?: number;
  outline?: string;
}

export default function JerseyIcon({ color, size = 18, outline = "#0a1410" }: JerseyIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        fill={color}
        stroke={outline}
        strokeWidth={2}
        strokeLinejoin="round"
        d="M22 4 L8 12 L2 24 L12 30 L14 24 L14 58 Q14 60 16 60 L48 60 Q50 60 50 58 L50 24 L52 30 L62 24 L56 12 L42 4
           Q42 12 32 12 Q22 12 22 4 Z"
      />
    </svg>
  );
}
