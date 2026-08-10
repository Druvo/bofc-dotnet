import type { CSSProperties } from 'react';

// BOFC crest palette - deep shield green + champagne gold, pixel-sampled
// from the real club logo (src/assets/logo.png: #28552B / #B69549 / #E6DFBA).
// Matches the brand-* Tailwind scale (tailwind.config.js) and the
// --color-accent/--color-paper* tokens (styles/tokens.css) - this file, the
// Tailwind config, and tokens.css should always describe the same identity.
export const club = {
  // Primary accent - brand-500
  navy: '#28552B',
  navyDeep: '#092C0D',    // brand-700, deep accent
  navySoft: '#547A55',    // brand-400, lighter/hover accent
  gold: '#B69549',        // logo-exact gold
  goldSoft: '#D8BC84',    // lighter gold, for hover/soft accents

  // Theme-adaptive accent for TEXT/icons on panel surface
  accent: 'var(--color-accent)',
  accentSoft: 'var(--color-accent-hover)',

  // Broadcast-style surfaces - token-driven
  panel: 'var(--color-paper-2)',
  panelBorder: 'var(--color-rule)',

  pitch: '#4D9A53',       // brighter shield green (success), distinct from navy
  danger: '#EF4444',      // red-500
  live: '#EF4444',

  // Surfaces
  tileBg: 'color-mix(in oklch, var(--color-ink) 4%, transparent)',
  tileBorder: '1px solid color-mix(in oklch, var(--color-ink) 8%, transparent)',
  textPrimary: 'var(--color-ink)',
  textMuted: 'var(--color-muted)',
};

// Uppercase, tracked "broadcast label" used on stat tiles.
export const kicker: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  fontWeight: 700,
  fontSize: 11,
};

// Tabular figures so numbers line up like a scoreboard.
export const scoreNum: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};
