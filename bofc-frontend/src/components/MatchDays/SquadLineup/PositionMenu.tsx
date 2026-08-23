import React from "react";
import { MoreOutlined } from "@ant-design/icons";
import { Dropdown, DropdownItem } from "../../ui/dropdown";
import { getPositionAbbreviation, POSITION_OPTIONS } from "../../../utils/footballPositions";

// Hover-revealed "..." trigger + popup menu for changing a player's position, instead of an
// always-visible dropdown taking up space on every pitch token/bench row. Each item leads with
// the short on-pitch code (matches what's shown after picking) with the full name as a smaller
// hint - CENTER_BACK_1/2 both abbreviate to "CB", so the full label stays to tell them apart.
export default function PositionMenu({
  playerId,
  onChangePosition,
  triggerClassName,
  align = "right",
}: {
  playerId: number;
  onChangePosition: (playerId: number, position: string) => void;
  triggerClassName?: string;
  align?: "left" | "right";
}) {
  return (
    <Dropdown
      align={align}
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          className={triggerClassName}
          title="Change position"
        >
          <MoreOutlined />
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-[280px] overflow-y-auto">
          {POSITION_OPTIONS.map((opt) => (
            <DropdownItem
              key={opt.value}
              onClick={() => {
                onChangePosition(playerId, opt.value);
                close();
              }}
            >
              <span className="w-7 shrink-0 font-bold text-gray-700 dark:text-gray-300">{getPositionAbbreviation(opt.value)}</span>
              <span className="text-gray-400 dark:text-gray-500">{opt.label}</span>
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
