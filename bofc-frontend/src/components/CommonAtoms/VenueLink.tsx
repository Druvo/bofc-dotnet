import React from "react";
import { EnvironmentOutlined } from "@ant-design/icons";
import { getVenueMapUrl } from "../../utils/venueMapUtils";

interface VenueLinkProps {
  name?: string | null;
  address?: string | null;
  mapLink?: string | null;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  style?: React.CSSProperties;
  /** Tooltip text — defaults to "Open location in Maps". */
  title?: string;
  /** Override the displayed text — defaults to name, falling back to address. */
  children?: React.ReactNode;
}

// Opens the venue's location in Google Maps, in a new tab — mobile OS/browsers
// hand `google.com/maps` links off to the native Maps app on their own.
// `stopPropagation` matters here: this is almost always rendered inside a
// clickable card/row (tournament card, fixture row), and without it, clicking
// the venue link would also fire the card's own onClick navigation.
const VenueLink: React.FC<VenueLinkProps> = ({
  name,
  address,
  mapLink,
  className = "",
  iconClassName = "",
  showIcon = true,
  style,
  title = "Open location in Maps",
  children,
}) => {
  if (!name && !address) return null;

  return (
    <a
      href={getVenueMapUrl(name, address, mapLink)}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={style}
    >
      {showIcon && <EnvironmentOutlined className={iconClassName} />}
      {children ?? name ?? address}
    </a>
  );
};

export default VenueLink;
