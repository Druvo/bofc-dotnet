# Handoff: Squad & Lineup (Match Center tab)

## Overview
One tab ("Squad & Lineup") inside the Match Center screen of a football club management app. It lets a coach/admin pick a squad size, choose or type a formation, assign starters on a pitch diagram, and substitute from a bench list. Players also see availability status (Fit/Doubtful/Injured).

## About the Design Files
`squad-lineup-reference.html` is a **static HTML/CSS design reference** — it shows the intended look, layout, and states with real sample data hard-coded in. It is not production code to copy verbatim. Recreate this UI in the target codebase's existing framework and component/state patterns (React, Vue, SwiftUI, etc.), or choose the most suitable framework if none exists yet.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and radii below are final — implement pixel-for-pixel using the codebase's own styling approach (CSS-in-JS, Tailwind, stylesheet, etc.) rather than inline styles if that doesn't match existing conventions.

## Screen / View

**Name:** Squad & Lineup tab (one of 5 tabs inside Match Center: Overview, Live, Squad & Lineup, Polls, Gallery)

**Purpose:** Coach/admin builds the starting lineup and formation for the upcoming match; any user can view it. Players' real-time availability (fit/doubtful/injured) is visible and editable by squad managers.

**Layout:** Two-column grid, `grid-template-columns: 1.3fr 1fr`, `gap: 16px`. Below 900px viewport width, collapses to a single column (`1fr`). Both columns are cards with `background:#151517` (bench) / `#122313` (pitch card — a slightly greener dark shade), `border:1px solid #202022`, `border-radius:16px`, `padding:18px`.

### Left column — Lineup card
1. **Header row** (`flex`, `justify-content:space-between`): "Starting Lineup" (14px/700/#f5f5f0) + a right-aligned hint text (11px/#5c5c60) — "Select a bench player to substitute" (default) or "Tap a pitch slot to sub in" (once a bench player is selected).
2. **Squad size row**: label "SQUAD SIZE" (10.5px/700/#5c5c60/letter-spacing 0.4px), then a wrapping row of pill buttons: `5-a-side`, `7-a-side`, `9-a-side`, `11-a-side`. Pill: `border-radius:20px`, `padding:6px 12px`, `font-size:11.5px`, `font-weight:700`. Selected pill: `border:1px solid #c6ff5c`, `background:#1a2612`, `color:#c6ff5c`. Unselected: `border:1px solid #272729`, `background:#151517`, `color:#8b8b90`.
3. **Formation row**: label "FORMATION" same style, then formation preset pills (options depend on squad size, e.g. for 5-a-side: `2-1-1`, `1-2-1`, `1-1-2`, `2-2`) using the same pill styling, plus a free-text input (`placeholder="Custom e.g. 4-3-2"`, 130px wide, dark input styling: `background:#0f0f11`, `border:1px solid #272729`, `border-radius:20px`, `padding:6px 12px`) and an "Apply" button (`border:1px solid #22c55e`, transparent bg, `color:#6ee7a0`). A validation error (e.g. "Must total 4 outfield players") renders below in `#ff5470`, 11px.
4. **Pitch diagram**: a `460px` tall, full-width rounded rect (`border-radius:8px`) with a **striped mowed-grass pattern** — `repeating-linear-gradient(0deg, #1b3a1d 0, #1b3a1d 40px, #183317 40px, #183317 80px)` — and a `2px solid rgba(255,255,255,0.35)` border. Standard pitch markings drawn as absolutely-positioned divs, all using `rgba(255,255,255,0.35)` (lines) / `rgba(255,255,255,0.5)` (spots): halfway line, center circle (110px) + center spot, a penalty box + six-yard box mirrored at both the top (opponent) and bottom (own) ends, penalty spots, and a small dark goal-frame rectangle (`background:#0b0b0d`) sitting on each goal line. Four small quarter-circle corner arcs sit just outside the four corners.
5. **Player tokens** on the pitch: one per starter, absolutely positioned via percentage `left`/`top` (computed from the formation — see Interactions below) with `transform:translate(-50%,-50%)`. Each token = a 44px circle (`background:#c6ff5c`, `border:2px solid #0b0b0d`, initials in 12px/700/#0b0b0d) with a name+position tag below it (`background:#0b0b0d`, `border-radius:5px`, `padding:2px 7px`; first name 10.5px/#dedee0, position abbreviation on its own line at 9px/#8b8b90).

### Right column — Bench card
Header "Bench — Team C" (14px/700/#f5f5f0) + hint text (11.5px/#5c5c60): "Tap a player, then tap the pitch slot" default, or "Tap a starter on the pitch to swap" once a bench player is selected. Below: a vertical list (`gap:8px`) of bench-player rows, each a `flex` row (`padding:9px 10px`, `border-radius:10px`):
- 30px circular avatar with initials (`background:#1c1c1f`, 11px/700/#c9c9cc)
- Name (12.5px/600/#dedee0) + position (10.5px/#5c5c60) stacked, `flex:1`
- **Availability badge** — small pill (9.5px/700, `padding:2px 7px`, `border-radius:5px`): `Fit` = `background:#16261a`/`color:#6ee7a0`; `Doubtful` = `background:#241f13`/`color:#ffb26b`; `Injured` = `background:#2a1516`/`color:#ff8a94`. Clicking it (if the viewer can manage the squad) cycles fit → doubtful → injured → fit.
- Row default: `background:#0f0f11`, `border:1px solid #202022`. Selected (armed for substitution): `background:#1a2612`, `border:1px solid #c6ff5c`, plus a "TAP A SLOT" label (10px/700/#c6ff5c) appended on the right.

## Interactions & Behavior
- **Squad size** buttons: switching size rebuilds the starter/bench pools (goalkeeper always first/fixed) and resets formation to that size's first preset.
- **Formation** buttons/custom input: recompute pitch layout. Layout rule — first line of outfield players = "DEF", last line = "FWD", any line(s) in between = "MID"; lines are stacked evenly in the vertical space between the two goals, and players within a line are spaced evenly across the width. The goalkeeper is always fixed at the bottom-center slot (`left:50%, top:88%`).
- **Substitution flow** (2-step, tap-to-swap — no drag-and-drop): tap a bench row → it highlights (armed state) and shows "TAP A SLOT"/hint updates. Tap any starter token on the pitch → the two players swap between starters and bench; armed state clears.
- **Availability cycling**: clicking a badge advances that player's status one step (fit → doubtful → injured → fit), for squad managers only.
- **Permissions**: squad-size buttons, formation controls (preset buttons, custom input, Apply), substitution (tapping bench/pitch), and availability cycling are all only interactive for users who can manage the squad (Admin or Coach role in the source app) — visible to everyone, but clicks no-op for a plain Player/other-role viewer. The right-aligned hint text next to "Starting Lineup" is admin/coach-only.
- No animation on swap in the source (instant re-render); a subtle transition is fine if the target stack supports it easily, but not required.

## State Management
- `squadSize`: one of 5 / 7 / 9 / 11 (outfield count = squadSize − 1)
- `formation`: string like `"2-1-1"` — dash-separated integers, one per outfield line, summing to squadSize − 1
- `starters`: ordered array of player IDs, length = squadSize, index 0 = goalkeeper
- `bench`: array of remaining player IDs
- `selectedBenchPlayerId`: id or null (armed-for-substitution state)
- `availability`: map of playerId → `'fit' | 'doubtful' | 'injured'` (defaults to `'fit'` if absent)
- `customFormationInput`: string, `formationError`: string or null (validation message)
- Derived: pitch layout (role label + x/y % per slot) computed from `formation`; bench-row order is whatever order players are in the `bench` array.

## Design Tokens
- Backgrounds: page/pitch-card `#122313`, bench-card/panel `#151517`, inset fields `#0f0f11`, chip/avatar bg `#1c1c1f`
- Borders: `#202022` (cards), `#272729` (inputs/inactive pills)
- Text: primary `#f5f5f0`, body `#dedee0`, muted `#8b8b90`, faint `#5c5c60`
- Accent green (brand/primary): `#22c55e`; light accent (links/active text): `#6ee7a0`; lineup/success green: `#c6ff5c`
- Status: fit `#6ee7a0` on `#16261a`; doubtful `#ffb26b` on `#241f13`; injured `#ff8a94` on `#2a1516`; error `#ff5470`
- Pitch line color: `rgba(255,255,255,0.35)`; pitch spots: `rgba(255,255,255,0.5)`
- Radius: 16px (cards), 20px (pills), 10px (bench rows), 8px (pitch), 5px (small tags)
- Font: headings/labels use a geometric sans (source used "Space Grotesk" for numerals/headers, "Manrope" for body) — substitute the codebase's existing type system if it has one
- Sizes: pitch card fixed height 460px; player token 44px circle; bench avatar 30px circle

## Assets
No images/icons beyond inline SVG-free CSS shapes — the entire pitch (lines, boxes, arcs, goal frames) is built from plain `<div>`s with borders/backgrounds, no SVG or image assets. Player avatars are initials-in-a-circle, not photos.

## Files
- `squad-lineup-reference.html` — static reference render of this tab with representative sample data (5-a-side, 2-1-1 formation, Team A starters, Team C bench, one doubtful and one injured player shown).

The live source of truth this was extracted from is a single-file interactive prototype (`Football Club App.dc.html`) where this tab is one of several inside a larger app; only this tab's markup/styling is included here.
