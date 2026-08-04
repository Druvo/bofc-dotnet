import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import Avatar from "./Avatar";

export interface PlayerCardV2Data {
  playerId: number;
  playerName: string;
  photoUrl?: string;
  position?: string | null;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isGoalkeeper?: boolean;
}

interface PlayerCardV2Props {
  player: PlayerCardV2Data;
  size?: "default" | "compact";
}

const roleTagStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: "16px",
  padding: "0 6px",
  borderRadius: 999,
  display: "inline-block",
};

const roleTagTone: Record<string, React.CSSProperties> = {
  default: { background: "rgba(140,140,140,0.14)", color: "#8c8c8c", border: "1px solid rgba(140,140,140,0.3)" },
  gold: { background: "rgba(212,175,55,0.16)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.4)" },
  blue: { background: "rgba(11,165,236,0.14)", color: "#0BA5EC", border: "1px solid rgba(11,165,236,0.35)" },
  green: { background: "rgba(82,196,26,0.14)", color: "#52c41a", border: "1px solid rgba(82,196,26,0.35)" },
};

/**
 * Read-only, visually-forward player card — a real card (photo, name,
 * position, role badges as pills) rather than the compact single-line row
 * ViewerPlayersTab previously rendered inline. Does not touch
 * Tournaments/Atoms/PlayerCard.tsx, which stays the row-style atom the
 * drag-drop team-builder depends on.
 */
export default function PlayerCardV2({ player, size = "default" }: PlayerCardV2Props) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!previewVisible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePreview();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewVisible]);

  const avatarSize = size === "compact" ? 48 : 64;
  const openPreview = () => {
    if (!player.photoUrl) return;
    lastActiveElement.current = document.activeElement as HTMLElement | null;
    setPreviewVisible(true);
  };
  const closePreview = () => {
    setPreviewVisible(false);
    try {
      lastActiveElement.current?.focus();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: size === "compact" ? "12px 8px" : "16px 12px",
          borderRadius: 14,
          background: "color-mix(in oklch, var(--color-ink) 4%, transparent)",
          border: "1px solid color-mix(in oklch, var(--color-ink) 8%, transparent)",
          textAlign: "center",
        }}
      >
        <div
          role={player.photoUrl ? "button" : undefined}
          tabIndex={player.photoUrl ? 0 : -1}
          onClick={openPreview}
          onKeyDown={(e) => {
            if (!player.photoUrl) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPreview();
            }
          }}
          aria-label={player.photoUrl ? `Preview photo of ${player.playerName}` : undefined}
          style={{ cursor: player.photoUrl ? "pointer" : "default" }}
        >
          <Avatar
            src={player.photoUrl}
            name={player.playerName}
            seed={player.playerId}
            size={avatarSize}
            style={{ border: "2px solid color-mix(in oklch, var(--color-ink) 10%, transparent)" }}
          />
        </div>

        <span
          style={{
            fontSize: size === "compact" ? 12 : 13,
            fontWeight: 600,
            color: "var(--color-ink)",
            lineHeight: 1.3,
          }}
        >
          {player.playerName}
        </span>

        {(player.position || player.isCaptain || player.isViceCaptain || player.isGoalkeeper) && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
            {player.position && (
              <span style={{ ...roleTagStyle, ...roleTagTone.default }}>
                {player.position}
              </span>
            )}
            {player.isCaptain && (
              <span style={{ ...roleTagStyle, ...roleTagTone.gold }}>C</span>
            )}
            {player.isViceCaptain && (
              <span style={{ ...roleTagStyle, ...roleTagTone.blue }}>VC</span>
            )}
            {player.isGoalkeeper && (
              <span style={{ ...roleTagStyle, ...roleTagTone.green }}>GK</span>
            )}
          </div>
        )}
      </div>

      {player.photoUrl && previewVisible && (
        <div
          role="dialog"
          aria-modal
          aria-label="Player photo preview"
          className="fixed inset-0 z-modal flex items-center justify-center p-5"
        >
          <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.9)" }} onClick={closePreview} />
          <div
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: Math.min(520, window.innerWidth - 80),
              width: "100%",
            }}
          >
            <button
              onClick={closePreview}
              aria-label="Close photo preview"
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                zIndex: 20,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <CloseOutlined style={{ color: "#fff", fontSize: 16 }} />
            </button>
            <div style={{ padding: 6, width: "100%", display: "flex", justifyContent: "center" }}>
              <img
                src={player.photoUrl}
                alt="Player photo"
                style={{ maxWidth: "100%", maxHeight: "60vh", height: "auto", display: "block", borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
