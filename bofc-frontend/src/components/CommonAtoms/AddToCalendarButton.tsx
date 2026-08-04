import React from "react";
import { CalendarOutlined, DownloadOutlined, GoogleOutlined } from "@ant-design/icons";
import { CalendarEventInput, downloadICS, googleCalendarUrl } from "../../utils/calendarExport";
import Button from "../ui/button";
import { Dropdown, DropdownItem } from "../ui/dropdown";

interface AddToCalendarButtonProps {
  event: CalendarEventInput;
  size?: "sm" | "md";
  /** Extra classes merged onto the trigger button — e.g. dark-card overrides. */
  buttonClassName?: string;
}

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({ event, size = "md", buttonClassName = "" }) => {
  return (
    <Dropdown
      align="right"
      className="w-56"
      trigger={({ toggle }) => (
        <Button variant="outline" size={size} startIcon={<CalendarOutlined />} onClick={toggle} className={`w-full ${buttonClassName}`}>
          Add to Calendar
        </Button>
      )}
    >
      {(close) => (
        <>
          <DropdownItem
            onClick={() => {
              close();
              window.open(googleCalendarUrl(event), "_blank", "noopener,noreferrer");
            }}
          >
            <GoogleOutlined /> Google Calendar
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              close();
              downloadICS(event);
            }}
          >
            <DownloadOutlined /> Download .ics (Outlook/Apple)
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
};

export default AddToCalendarButton;
