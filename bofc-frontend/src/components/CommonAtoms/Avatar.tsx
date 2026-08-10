import React from "react";
import { getAvatarColors, getAvatarIllustrationIndex } from "../../utils/avatarUtils";
import { ReactComponent as MaleAvatar } from "../../assets/avatars/male-avatar.svg";
import { ReactComponent as DeveloperAvatar } from "../../assets/avatars/developer-avatar.svg";
import { ReactComponent as ProfessorAvatar } from "../../assets/avatars/professor-avatar.svg";
import { ReactComponent as FriendlyGuyAvatar } from "../../assets/avatars/friendly-guy-avatar.svg";

const ILLUSTRATIONS = [MaleAvatar, DeveloperAvatar, ProfessorAvatar, FriendlyGuyAvatar];

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  /** Usually the player/team id - keeps the illustration stable even if two players share a name. Falls back to `name`. */
  seed?: string | number | null;
  size?: number;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Shared fallback avatar: real photo when uploaded, otherwise one of a set of
// unDraw illustrations deterministically picked per player/team instead of
// every unphotographed player rendering the same generic gray icon.
const Avatar: React.FC<AvatarProps> = ({ src, name, seed, size = 40, className = "", style }) => {
  if (src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  const key = seed ?? name ?? "?";
  const Illustration = ILLUSTRATIONS[getAvatarIllustrationIndex(key)];
  const colors = getAvatarColors(key);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: "#f2f2f2", color: colors.fg, ...style }}
    >
      <Illustration width="100%" height="100%" />
    </div>
  );
};

export default Avatar;
