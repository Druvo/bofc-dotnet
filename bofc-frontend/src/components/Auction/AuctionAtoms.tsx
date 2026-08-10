import React from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { formatCurrency } from "../../utils/formatCurrency";

// ── Club palette shortcuts (kept local so pages read cleanly) ────────────────
export const ac = {
  gold: club.gold,
  goldSoft: club.goldSoft,
  pitch: club.pitch,
  amber: "#E6A23C",
  red: "#E0736B",
  info: "#5B8DEF",
  muted: "#8792A8",
  panel: club.panel,
  panelBorder: club.panelBorder,
  tileBg: club.tileBg,
  tileBorder: club.tileBorder,
  textPrimary: club.textPrimary,
  textMuted: club.textMuted,
};

// Status → accent colour, covering every auction/session/approval/player state.
const STATUS_COLORS: Record<string, string> = {
  LIVE: ac.pitch, RUNNING: ac.pitch, ON_AUCTION: ac.pitch, ONGOING: ac.pitch,
  PAUSED: ac.amber, PENDING: ac.amber,
  COMPLETED: ac.gold, ENDED: ac.gold,
  NOT_STARTED: ac.muted, WITHDRAWN: ac.muted, DEFAULT: ac.muted,
  REGISTRATION_OPEN: ac.info, POOL_READY: ac.info, AVAILABLE: ac.info,
  SOLD: ac.pitch, APPROVED: ac.pitch,
  UNSOLD: ac.red, REJECTED: ac.red,
};

export const statusColor = (status?: string): string =>
  (status && STATUS_COLORS[status]) || STATUS_COLORS.DEFAULT;

export const prettyStatus = (status?: string): string =>
  (status || "Unknown").replace(/_/g, " ");

// ── Gold divider used under every page header ────────────────────────────────
export const GoldDivider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      height: 2,
      borderRadius: 2,
      background: `linear-gradient(90deg, ${ac.gold} 0%, rgba(198,161,91,0) 60%)`,
      ...style,
    }}
  />
);

// ── Page wrapper: consistent vertical rhythm, full-width like every other page ──
export const AuctionPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col gap-4">{children}</div>
);

// ── Flush page header (title + optional back, subtitle, actions) + divider ───
interface AuctionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
}
export const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  backTo,
}) => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="flex min-w-0 items-center gap-3">
          {backTo !== undefined && (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <ArrowLeftOutlined />
            </button>
          )}
          <div className="min-w-0">
            <h3 className="m-0 flex items-center gap-2.5 text-xl font-bold leading-tight text-gray-800 dark:text-white/90">
              {icon && <span style={{ color: ac.gold }} className="inline-flex">{icon}</span>}
              <span className="truncate">{title}</span>
            </h3>
            {subtitle && <p className="mt-0.5 text-theme-sm text-gray-400 dark:text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <GoldDivider style={{ marginTop: 10 }} />
    </div>
  );
};

// ── Status pill (broadcast-style) ────────────────────────────────────────────
export const StatusPill: React.FC<{ status?: string; label?: string }> = ({ status, label }) => {
  const color = statusColor(status);
  return (
    <span
      style={{ background: `${color}22`, border: `1px solid ${color}59`, color }}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide leading-[18px]"
    >
      <span style={{ background: color }} className="h-1.5 w-1.5 rounded-full" />
      {label || prettyStatus(status)}
    </span>
  );
};

// ── Category pill (player grade: ICON / A_GRADE / …) ─────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  ICON: ac.gold,
  A_GRADE: ac.info,
  B_GRADE: ac.pitch,
  EMERGING: "#38BDB8",
  OUTSIDE: "#A78BFA",
};
export const CategoryPill: React.FC<{ category?: string }> = ({ category }) => {
  const color = (category && CATEGORY_COLORS[category]) || ac.muted;
  return (
    <span
      style={{ background: `${color}22`, border: `1px solid ${color}66`, color }}
      className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide leading-4"
    >
      {(category || "-").replace(/_/g, " ")}
    </span>
  );
};

// ── Panel card shell (navy broadcast surface with gold accent strip) ─────────
interface PanelCardProps {
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  hoverable?: boolean;
  onClick?: () => void;
}
export const PanelCard: React.FC<PanelCardProps> = ({
  children,
  accent,
  style,
  bodyStyle,
  hoverable,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] ${hoverable ? "hover:-translate-y-0.5 hover:shadow-theme-sm" : ""} ${onClick ? "cursor-pointer" : ""}`}
    style={style}
  >
    {accent && <div style={{ height: 3, background: accent }} />}
    <div style={{ padding: 16, ...bodyStyle }}>{children}</div>
  </div>
);

// ── Form card: theme-adaptive surface with a gold top accent ─────────────────
export const FormCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}> = ({ children, style, bodyStyle }) => (
  <div
    className="overflow-hidden rounded-2xl"
    style={{ borderTop: `3px solid ${ac.gold}`, ...style }}
  >
    <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]" style={{ padding: 24, ...bodyStyle }}>
      {children}
    </div>
  </div>
);

// ── Stat tile (kicker label + scoreboard figure) ─────────────────────────────
export const StatTile: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}> = ({ label, value, accent = ac.gold, icon }) => (
  <div className="h-full rounded-xl px-3.5 py-3" style={{ border: ac.tileBorder }}>
    <div style={{ ...kicker, color: ac.textMuted }} className="flex items-center gap-1.5">
      {icon && <span style={{ color: accent }}>{icon}</span>}
      {label}
    </div>
    <div style={{ ...scoreNum, color: accent, fontSize: 24, fontWeight: 800, marginTop: 4, lineHeight: 1.1 }}>
      {value}
    </div>
  </div>
);

// ── Signing tile (shared by the live board, squad modal & results) ───────────
const taka = (v?: number) => (v != null ? formatCurrency(v, { decimals: 0 }) : "-");

export const metaMuted: React.CSSProperties = { fontSize: 11, color: ac.textMuted, whiteSpace: "nowrap" };
export const teamChip: React.CSSProperties = {
  fontSize: 10.5,
  color: ac.goldSoft,
  background: "rgba(198,161,91,0.12)",
  border: "1px solid rgba(198,161,91,0.3)",
  borderRadius: 6,
  padding: "1px 7px",
  whiteSpace: "nowrap",
};

export const SignedTile: React.FC<{
  index: number;
  name: string;
  category?: string;
  price?: number;
  meta?: React.ReactNode;
  priceLabel?: string;
  priceColor?: string;
  photoUrl?: string;
}> = ({ index, name, category, price, meta, priceLabel = "Sold", priceColor = ac.pitch, photoUrl }) => {
  const src = photoUrl ? toAbsolutePlayerPhotoUrl(photoUrl) : undefined;
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className="flex h-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5"
      style={{ border: ac.tileBorder }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold"
          style={{ border: `1px solid ${ac.panelBorder}`, color: ac.goldSoft }}
        >
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ ...scoreNum, color: ac.gold, fontSize: 12, fontWeight: 800 }}>#{index}</span>
            <span className="truncate text-sm font-semibold" style={{ color: ac.textPrimary }}>{name}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <CategoryPill category={category} />
            {meta}
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>{priceLabel}</div>
        <div style={{ ...scoreNum, color: priceColor, fontWeight: 800, fontSize: 18 }}>{taka(price)}</div>
      </div>
    </div>
  );
};

export { kicker, scoreNum };
