# Design — BOFC (BJIT-2.0 Originals Football Club)

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

**Status: CONFIRMED — rolling out per the phased plan below.**

## Context

- **Audience:** split. Most day-to-day users are club insiders (players,
  coordinators, admins) running tournaments, finance, and auctions — they need
  density and speed, not marketing polish. The public Match Center
  (`/tournament-viewer`, no login required) is seen by outside players and
  fans and gets full expressive treatment.
- **Use case:** not a single-CTA marketing site — a working tournament
  management tool. The "primary action" differs per page (RSVP, record a
  goal, place a bid, approve a payment).
- **Tone:** Broadcast / Sport — scoreboard energy, tabular precision, live-match
  urgency, the club's actual crest colors pushed hard rather than genericised.

## Genre

**modern-minimal** as the base (this is fundamentally a dense SaaS-shaped
management tool — tables, forms, CRUD), with the sport-broadcast character
carried by the custom palette, tabular-numeral type discipline, and motion —
not by switching to a louder genre that would hurt data legibility.

## Why Hallmark's marketing macrostructures don't apply everywhere

Hallmark's 21 macrostructures (Bento Grid, Marquee Hero, Stat-Led, Workbench,
etc.) are built for content/marketing pages with a hero, a narrative, a CTA.
Most of this app is a live CRUD dashboard — an accounts ledger table has no
"hero." Forcing a landing-page shape onto the Finance module would be the
templated-slop failure mode in the other direction.

So this system uses **two page families**:

### Content pages — get a named macrostructure
Pages whose job is to present information to a reader (including a
logged-out one), not run a workflow.

- **Login** — macrostructure **Marquee Hero** (single full-viewport statement:
  crest + tagline + stadium image, no competing content). *Already built* —
  see `src/components/authPages/LoginPage.tsx` / `authStyles.css`.
- **Public Match Center** (`/tournament-viewer`, logged-out) — macrostructure
  **Stat-Led**. "The hero is a giant number; everything after supports it" —
  this is exactly a sports scoreboard page: live score, standings, top
  scorers. Highest-priority next build.
- **Club Rules** (public read) — Stat-Led family, lighter weight (no big
  numeral hero, but same rhythm/typography as the Match Center).

### App pages — get universal component rules, no forced macrostructure
Dashboard, Players, Tournaments admin (team building / fixtures / live
scoring), Finance, Auction admin, Venues. These share:
- the token system below (color, type, spacing, motion)
- a consistent card / table / tab / button voice (see "Component voice")
- the 8-state interaction discipline for every control
- **no** hero, no marketing copy, no invented metrics

## Theme — custom (anchored on the real crest, not a catalog pick)

**Vibe:** "pitch-side broadcast, scoreboard precision, champagne trophy gold."
**Anchor:** the club's own crest colors — not invented. Converted from the
hex already in use (`src/theme/clubTheme.ts`) to OKLCH (verified precisely —
sRGB → linear → OKLab → OKLCH):

| Token source | Hex | OKLCH (verified) |
|---|---|---|
| `navyDeep` | `#0B2417` | `oklch(23.6% 0.040 158.4)` — paper |
| `navy` | `#123524` | `oklch(29.8% 0.051 159.7)` — paper-2 |
| `navySoft` | `#1B4A34` | `oklch(37.0% 0.064 160.4)` — paper-3 |
| `pitch` | `#2E9E5B` | `oklch(62.1% 0.141 152.7)` — success / win state |
| `gold` | `#C6A15B` | `oklch(72.8% 0.099 82.1)` — primary accent (dark mode) |
| `goldSoft` | `#D8BC84` | `oklch(80.6% 0.080 84.2)` — hover step of gold |
| crest red | `#7a1620` | `oklch(38.0% 0.134 21.6)` — danger / loss state |

The existing three-level navy surface (`navyDeep` → `navy` → `navySoft`) maps
directly onto `paper` → `paper-2` → `paper-3` — no new dark value invented,
just formalized as tokens.

### Dark mode (primary — matches the app's existing default)

```css
--color-paper:      oklch(23.6% 0.040 158.4);  /* navyDeep */
--color-paper-2:    oklch(29.8% 0.051 159.7);  /* navy — raised surface (cards) */
--color-paper-3:    oklch(37.0% 0.064 160.4);  /* navySoft — further raised (modals) */
--color-ink:        oklch(96% 0.010 160);
--color-ink-2:      oklch(74% 0.012 160);
--color-rule:       oklch(34% 0.040 160);
--color-muted:      oklch(58% 0.015 160);
--color-accent:     oklch(72.8% 0.099 82.1);   /* gold, brand-exact */
--color-accent-ink: oklch(23.6% 0.040 158.4);  /* dark text on gold fill */
--color-focus:      oklch(78% 0.160 82);       /* gold, boosted chroma for visibility */
--color-live:       oklch(55% 0.180 22);       /* boosted from crest red — needs to pop for urgency */
--color-success:    oklch(62.1% 0.141 152.7);  /* pitch green, brand-exact */
--color-danger:     oklch(38.0% 0.134 21.6);   /* crest red, brand-exact */
```

### Light mode (secondary — the app's existing toggle stays)

```css
--color-paper:      oklch(97% 0.012 90);    /* warm near-white */
--color-paper-2:    oklch(94% 0.014 90);
--color-paper-3:    oklch(91% 0.016 90);
--color-ink:        oklch(20% 0.030 160);
--color-ink-2:      oklch(40% 0.020 160);
--color-rule:       oklch(85% 0.015 90);
--color-muted:      oklch(48% 0.018 160);
--color-accent:     oklch(35% 0.075 160);   /* deep pitch green, not gold —
                                                gold-on-white fails contrast */
--color-accent-ink: oklch(97% 0.012 90);
--color-focus:      oklch(45% 0.100 160);
--color-live:       oklch(48% 0.190 25);
--color-success:    oklch(45% 0.130 152);
--color-danger:     oklch(48% 0.200 25);
```

This dark/light accent-swap (gold on dark, deep green on light) already
exists as a pattern in `clubTheme.ts` (`colorPrimary: isDarkMode ? club.gold
: club.navy`) — this system formalizes and extends it, doesn't invent it.

**Axes:** dark (primary) / grotesk-sans / chromatic-other (chromatic-gold ~82°,
swaps to chromatic-green ~160° in light mode).

## Typography

- **Display:** Space Grotesk, weight 700/900 — scoreboard-style headings and
  big numerals (match scores, stat tiles). Free, variable, geometric
  confidence without being a banned default.
- **Body:** IBM Plex Sans, weight 400/500/600 — the actual legibility
  workhorse for dense tables, forms, finance ledgers. Free.
- **Mono:** JetBrains Mono, weight 500 — match clocks, scores, tabular
  finance figures. Always paired with `font-variant-numeric: tabular-nums`.
- Display tracking: -0.01em (tight, confident). Body: normal.
- Type scale anchor: `--text-display: clamp(2.5rem, 5vw, 4.5rem)` for the two
  content-page heroes only; app pages never use anything above
  `--text-2xl` (1.75rem) — a dashboard has no business shouting.

## Spacing

4-point scale, named tokens only (`var(--space-md)`, never raw px):
`--space-3xs: 0.25rem` · `--space-2xs: 0.5rem` · `--space-xs: 0.75rem` ·
`--space-sm: 1rem` · `--space-md: 1.5rem` · `--space-lg: 2rem` ·
`--space-xl: 3rem` · `--space-2xl: 4.5rem` · `--space-3xl: 7rem`.

## Motion

- Easings: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (the only one most
  interactions need), `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` for
  reversible things (tab switches, drawer open/close).
- Durations: `--dur-short: 150ms` (hover/focus), `--dur-med: 220ms` (reveals),
  `--dur-long: 400ms` (page-level transitions only).
- Reveal pattern: none on app pages (data should just be there). Content
  pages (Match Center, Login) get a single orchestrated fade+slide on first
  paint, never per-card scroll reveals — this is a tool, not a scroll story.
- `prefers-reduced-motion: reduce` → everything collapses to opacity-only,
  ≤150ms.
- Live-match elements (score ticking, countdown) are the one place
  continuous animation is earned — a subtle pulse on `--color-live`, nothing
  else moves on its own.

## Microinteractions stance

- Silent success, not celebratory toasts (recording a goal shouldn't
  confetti).
- Optimistic update + Undo over confirmation dialogs, wherever the backend
  supports it.
- Hover-tooltip delay 800ms, focus-tooltip delay 0ms.
- `:focus-visible` ring uses `--color-focus`, shows instantly, never
  animated in.

## Component voice (app pages)

- **Cards:** `--radius-card: 10px`, `1px solid var(--color-rule)`, background
  `var(--color-paper-2)`. No drop-shadow soup — one soft shadow max, on
  raised/modal surfaces only.
- **Tables:** row height comfortable (44px desktop / 40px mobile per existing
  responsive rules), tabular-nums on every numeric column, zebra-striping
  via `--color-paper` / `--color-paper-2` alternation instead of borders.
- **Tabs:** pill-shaped active state in `--color-accent`, matches the
  existing `.tournament-viewer-tabs` pattern already in `index.css` — that
  pattern is good, it just needs the neon `#10ff87` swapped for the system's
  actual gold/green tokens instead of an ad-hoc third color.
- **Buttons:** primary = filled `--color-accent` / `--color-accent-ink` text,
  `--radius-input: 8px`. Secondary = outline, `--color-rule` border.
- **Live/urgent state:** `--color-live` badge + subtle pulse, used for
  ongoing matches, overdue payments, pending approvals — one visual language
  for "this needs attention now" everywhere in the app.

## CTA voice

- Primary: filled gold pill/rect, verb-first copy ("Sign In to Dashboard",
  "Record Goal", "Place Bid") — never "Submit" or "Click Here."
- Secondary: outline, same shape family.
- Content pages get exactly one primary CTA in the fold; app pages don't
  have "CTAs" in the marketing sense — every button just does its one job.

## What pages MUST share
- The token system above (colors/type/spacing/motion) — no page invents its
  own accent or font.
- The crest wordmark treatment.
- The `--color-live` / `--color-success` / `--color-danger` semantic-state
  language — consistent everywhere a status is shown (match status, payment
  status, approval status).
- Button shape, border-radius, and CTA copy voice.

## What pages MAY differ on
- Content pages (Login, Match Center, Club Rules) may use a named
  macrostructure and hero enrichment; app pages never do.
- Individual app pages vary in layout density (a finance ledger is denser
  than the dashboard overview) but not in token usage.

## Per-page allowances
- Content pages MAY use hero enrichment (Tier-A CSS art, Tier-B SVG — no
  invented stock photography).
- App pages MUST NOT use enrichment — function carries the page.

## Rollout plan (phased, per sign-off)

1. ✅ **Login** — redesigned earlier this session (transparent glass panel,
   stadium hero, top-anchored crest), now also converted from ad-hoc hex to
   `tokens.css` variables. Found and fixed a real visible bug along the way:
   `.login-btn` had a hardcoded `background: #1e3c72` (old blue) that was
   winning over Ant's themed primary color — the Sign In button was rendering
   blue, not brand gold, confirmed against the earlier screenshot. Also
   removed ~90 lines of dead CSS (`.mobile-logo-section`, `.club-logo`,
   `.login-left-section`, etc.) left over from removing that JSX earlier.
2. ✅ **Public Match Center** (`/tournament-viewer`) — Stat-Led macrostructure
   built: shell (`TournamentViewerPage.tsx`/`.module.css`) and the Home tab
   (`ViewerHomeTab.tsx`/`.module.css`) fully on tokens, plus the global
   `.tournament-viewer-tabs` / `.tournament-portal-select` rules in
   `index.css`. Two real fixes made along the way, not just recolors:
   - The identity/stat header was previously gated to `isLoggedIn` only —
     guests (the exact audience this page exists for) saw no hero at all.
     Now shown to everyone.
   - `ViewerHomeTab`'s title reveal + flying-football decoration looped
     forever with no `prefers-reduced-motion` guard. Replaced with a single
     one-time fade-in per the system's motion stance.
   ✅ **Update:** all remaining tabs now clean. Turned out only 3 of the 9
   files had *local* neon-green (the shared `.tournament-viewer-tabs` /
   `.tournament-subtabs` / `.tournament-portal-select` fix in `index.css`
   already covered the rest via the shared classes):
   `ViewerTournamentFlowTab.module.css` (segmented-control toggle),
   `ViewerPlayersTab.module.css` (filter select, team logo avatar — same
   white/lime mismatch pattern as the Home tab's team avatars), and
   `ViewerRulesTab.module.css` (link color). Confirmed via grep: zero
   `#10ff87`/`#00d66b`/`#18ff98`/etc. occurrences left under
   `TournamentViewer/`.
3. ✅ **Dashboard** — turned out to need less rework than expected:
   `clubTheme.ts` (the `club.*` constants already used by `AnalyticsCard`,
   `LatestTournamentCard`, `PlayerCollectionMetricsTable`, the sidebar, and
   `App.tsx`'s menu theme) was **already numerically identical** to
   `tokens.css` — both were derived from the same real crest colors, so most
   of the Dashboard was already on-system. What actually needed fixing:
   - Ant Design's semantic tokens (`colorSuccess`/`colorError`) were never
     themed — every status badge/tag app-wide was on Ant's stock green/red,
     not the brand's pitch-green/crest-red. Fixed once in `App.tsx`'s
     `ConfigProvider`, cascades everywhere automatically (`LatestTournamentCard`'s
     Confirmed/Pending/Not-Joining pills already reference `token.colorSuccess`
     etc., so they picked this up with zero direct edits).
   - A stray un-themed `colorPrimary: "#1890ff"` (Ant's default blue) on the
     public auction-registration route — now uses the real brand primary.
   - **Real leftover bug, not just recoloring:** `PlayerCollectionMetricsTable`'s
     table header and the sidebar's panel background were both hardcoded to
     `#14213D`/`#0E1830` — the *pre-rebrand navy-blue* palette, with a comment
     literally claiming they "match the menu's navy" when they didn't (the
     menu itself already uses the correct `#0B2417`). Fixed both to the
     actual current brand hex.
   - Added `club.danger` / `club.live` so the semantic-state language has a
     red, not just gold/green.
4. ✅ **Players (admin)** — already largely on-brand (`.bofc-players-table`
   etc. use the correct tokens post-fix). Fixed the roles-modal "selected"
   section off Ant-default blue onto brand gold, and the password-strength
   meter's weak/strong colors onto `club.danger`/`club.pitch`.
5. ✅ **Venues** — found and fixed the same pre-rebrand navy bug in
   `Venue.css`'s table header (`#14213d`, lowercase — my first sweep only
   grepped uppercase `#14213D` and missed it; re-swept case-insensitively
   after this).
6. ✅ **Club Rules (admin edit)** — found the same bug hiding behind a CSS
   custom property: `var(--cr-navy-deep, #0e1830)` — the property itself is
   never defined anywhere, so the stale fallback was always what rendered.
   Fixed the fallback value; otherwise this page was already clean.
7. ✅ **Finance (6 pages)** — fully clean with **zero direct edits**. Every
   page already imports the shared `clubTable.css` (`.bofc-club-table`,
   `.bofc-page`, `.bofc-status`, etc.), so fixing that one shared file (which
   had the *same* stale-navy bug — `#14213d`/`#1b2a4a`) fixed every Finance
   page at once. This is the payoff of the shared-class pattern already
   being in place.
8. ✅ **Auction (7 pages)** — checked thoroughly, genuinely clean. The
   category color-coding (`ICON`/`A_GRADE`/`B_GRADE`/`EMERGING`/`OUTSIDE` in
   `AuctionAtoms.tsx`) intentionally uses a wider palette than gold/green/red
   — 5 categories need more distinguishable hues than the core brand
   semantics provide, and it was clearly designed deliberately (not leftover
   ad-hoc color). Left as-is.
9. ✅ **Tournaments admin (team building/fixtures)** — case-insensitive sweep
   (my Dashboard-era grep was case-sensitive and missed lowercase hits) found
   the same stale navy in 6 more files: `PlayerCard.tsx`, `CanvasBuilder.tsx`,
   `GroupCard.tsx`, `GroupMatchesView.tsx`, `StatisticsTab.tsx` (also had an
   Ant-default-green top-3 ranking color, fixed to `club.pitch`), and
   `TournamentStructureView.tsx`. All fixed.

10. ✅ **Match-status semantic remap** — done, not deferred. Unified the
    4-state match-status color (`SCHEDULED`/`ONGOING`/`PAUSED`/`COMPLETED`)
    across all 7 files that had it (`MatchCountdown.tsx`,
    `MatchEventTimeline.tsx`, `FixturesTimelineView.tsx`,
    `FixturesCalendarView.tsx`, `MatchStatisticsChart.tsx`,
    `InteractiveTournamentTab.tsx`, `GroupNode.tsx`) onto one mapping:
    - `SCHEDULED` → `club.gold` (matches the "UPCOMING" pill already used in
      the Match Center)
    - `ONGOING` → `club.live` — this fixes the real inconsistency found while
      surveying: `ONGOING` rendered **orange** in most files but **blue** in
      `GroupNode.tsx` (both its group-level and match-level status
      functions). Same status, two different colors depending which screen
      you were on.
    - `COMPLETED` → `club.pitch`
    - `PAUSED` → left as the existing purple (`#722ed1`) — genuinely distinct
      state, no brand token for it, not a mismatch.
    Also remapped `MatchEventTimeline.tsx`'s match-event-type colors:
    `GOAL`/`MATCH_COMPLETED` → `club.pitch`, `MATCH_STARTED` → `club.live`
    (a match starting *is* the live/ongoing signal), `ASSIST` → `club.gold`,
    `RED_CARD` → `club.danger`. Left `YELLOW_CARD` (real card-color
    convention) and `SUBSTITUTION`/`INJURY` (neutral, non-brand-clashing) as
    they were.
    **Deliberately left alone:** `StatisticsTab.tsx`'s top-3 rank/medal colors
    (Gold/Silver/Bronze/blue-for-4th — a universal medal convention, not a
    status color) and `MatchStatisticsChart.tsx`'s Home-vs-Away-goals bar
    colors (blue/green as a two-series comparison, not status). Neither had
    the cross-file inconsistency the status system did.

**Rollout status: all ~20 routes now on the design system, including the
match-status semantic remap.** `toastStyles.css` still has one `#1890ff`
(a generic toast accent, not a brand mismatch) — low priority, left for a
future pass if ever.

**Verification note:** these builds were checked via clean TypeScript/webpack
compilation (`Compiled successfully`, no errors) and manual code review.
Live browser click-through was unreliable in this session (login clicks and
screenshots weren't registering consistently, likely tied to a platform
availability blip) — worth a quick visual pass in your own browser.

## Exports

`tokens.css` will be emitted at the project root once this system is
confirmed, containing every token above in copy-paste-ready CSS custom
property form.
