# Handoff: BOFC Club App — UI/UX Fixes

## Overview
This package documents a set of UI/UX fixes and additions applied to the BOFC (club management) app, covering the Login screen and eight authenticated pages: Dashboard, Next Match, MatchDays, Venues, Players, Player Profile, Player Statistics, and Club Rules. The fixes address inconsistencies found in the existing app (mismatched icons, currency-symbol/layout bugs, theme inconsistency, unclear labels) and add two new UX patterns (an "actionable metric" treatment and an empty state).

## About the Design Files
The file in this bundle (`Club Rules App - Fixes.dc.html`) is a **design reference built in HTML** — a clickable prototype showing intended look and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (whatever framework/component library the BOFC app is actually built in) using its established patterns — not to ship the HTML file itself. If you are unsure what the current codebase's stack is, check its package.json / existing components before starting.

## Fidelity
**High-fidelity.** Colors, spacing, typography, and copy are intended to be final for this pass. Recreate pixel-close using the target codebase's existing component library where one exists (buttons, tables, cards, etc.) — don't reinvent primitives if the app already has them; just apply the corrected values below.

## What changed vs. the current app (fix list)

1. **Login screen** — unified the accent color and the "Enable Auto Login" control between light/dark variants (previously button color and checkbox presence differed between modes). One dark theme now, gold (#c9a24b) accent, real checkbox.
2. **Currency symbol** — fixed mojibake; use the Taka glyph `৳` (or HTML entity `&#2547;`) everywhere a currency value is shown, not the previous garbled `à§³`.
3. **Dashboard grid overflow** — stat card grid must not overflow horizontally at any width. Use `grid-template-columns: minmax(0,Nfr) ...` (not plain `fr`) plus `min-width: 0` and `overflow: hidden` on grid cells, and `overflow-x: hidden` on the page wrapper as a backstop.
4. **Sidebar icons** — corrected icon-to-label mismatches (e.g. "Next Match" and "Match Management" both showed a pie-chart icon; now calendar and whistle respectively). See Design Tokens → Icon map below.
5. **"Payment Due" card** — relabeled from an ambiguous number ("26") to "26 players / have unpaid dues this month", and restyled as an **actionable metric**: amber left border (`#d69a2f`, 3px), warning icon next to the label, amber-tinted value text. This "actionable" treatment (amber accent + icon) should be applied to any dashboard metric that implies the user needs to act, distinct from purely informational metrics (Total Collections, etc.) which stay neutral.
6. **Squad Filled progress bar** — increased track/fill contrast so a low percentage (7%) is still visible against the track.
7. **Topbar restored** — hamburger, search bar, theme toggle, bell, and user menu (avatar + name + chevron) present on every authenticated page, not just some.
8. **User profile dropdown** — clicking the avatar/name opens a menu: name + email, Edit profile, My Goalkeeping History, Notifications toggle, Sign out. **Settings is intentionally NOT duplicated here** — it lives only in the main sidebar nav, to avoid two entry points to the same place.
9. **Empty state (Venues)** — added a designed empty state (icon + "No venues yet" + explanatory line + primary CTA) for when a club has zero venues, instead of an unstyled blank table. Apply the same empty-state pattern (icon in a circular badge, one-line title, one-line explanation, single primary CTA) to any other list/table screen that can be empty (Players, MatchDays, Club Rules).
10. **Avatar consistency** — standardized on colored initials circles (`background:#2a3d31; color:#cfe0d4`) as the placeholder avatar everywhere a player is shown without a real photo, replacing a previous mix of illustrated portraits and blank circles.
11. **Player Statistics card grid** — the per-player stat mini-grid (Matches/Goals/Assists/Rating) needs enough card width to not truncate labels; use 3 cards per row (not 4) at this content density, with `min-width:0` on grid cells and `text-overflow: ellipsis` + `white-space: nowrap` on the name/position line only (numbers/labels should never truncate — widen instead).
12. **Theme toggle** — Dashboard supports a light/dark toggle; both palettes are defined below and should stay driven by shared tokens (see Design Tokens) rather than one-off hex values per component.

## Screens / Views

### Login
- **Purpose**: authenticate into the dashboard.
- **Layout**: full-bleed dark gradient background; crest + tagline block and the login card sit side-by-side, centered as a flex row with `gap`, wrapping on narrow viewports (avoid absolute positioning for this pair — it caused overlap in an earlier pass).
- **Components**: card (bg `#12241a`, border `#2a3d31`, radius 20px, padding 44/48px), heading "Welcome Back" (30px/800), subhead with 3px gold left rule, email/password fields (underline style, no boxed input), "Enable Auto Login" checkbox, primary button "Sign In to Dashboard" (gold `#c9a24b` bg, dark text).

### Dashboard
- **Purpose**: at-a-glance club financials + next match status.
- **Layout**: 240px fixed sidebar + fluid content. Content: a stat grid (Account Balance card spans 2 rows in column 1 via `grid-row: span 2`; Total Collections/Total Expenses in row 1 columns 2–3; This Month's Collections/Payment Due in row 2 columns 2–3) — matches the original app's card arrangement. Below: Next Match card (match info + 4 RSVP-count tiles + Yes/No call-to-action + kickoff/calendar/details column). Below that: a 3-up row (Payments Due list / Monthly Contributions mini-calendar / Match Calendar) and a Monthly Contributions data table with filter/view controls.
- **Components/content**: see fix list above for exact copy and styling per card.

### Next Match
- **Purpose**: detail view for a specific MatchDay, with Home/Results/Table/Stats tabs.
- **Layout**: match-day header card (big teams-count numeral, title, CONCLUDED/UPCOMING badge, date/venue) → underlined tab row (Home, Results, Table, Stats) → tab content.
  - **Home**: "Participants" heading, ALL/TEAM A/B/C filter chips, 3-column team cards each listing players in a 2-col grid of avatar+name tiles.
  - **Results**: Fixtures/Results sub-tabs, "COMPLETED RESULTS" list of match-result cards (badge, FT tag, date, team vs team with score).
  - **Table**: "MatchDay Standings" — full standings table (#, Team, P, W, D, L, GD, GF, GA, Y, R, PTS).
  - **Stats**: Top Scorers / Most Assists leaderboard blocks (icon badge + leader row + Sync Stats action).

### MatchDays
- **Purpose**: list/manage all match days.
- **Layout**: header with trophy icon + title + "+ New MatchDay" button; All/Upcoming/Concluded filter pills + search box; 3-column card grid. Each card: status badge (color-coded — neutral for Concluded, green for Upcoming), kebab menu, title, date, venue.

### Venues
- **Purpose**: list/manage grounds.
- **Layout**: card containing a simple table (Venue Name, Address, Status, Action) + "+ Add Venue" button. See fix #9 for the empty state.

### Players
- **Purpose**: club roster management.
- **Layout**: header + search + "+ Add Player"; All/Active/Inactive filter pills with counts; table (Player [avatar+name], Employee ID, Status badge, Role badge, View/Edit actions).

### Player Profile ("My Player Profile")
- **Purpose**: view/edit the signed-in player's info.
- **Layout**: header card (avatar, name, email, role badges, 4 stat pills each with a distinct top-accent color: Matches/Goals/Assists/G+A) → two-column body: left "Player Details" read-only list (email, mobile, employee ID, jersey number, status), right tabbed panel (Edit Profile / Change Password / Match History / Goalkeeping History) with a 2-column form and "Save Changes" button.

### Player Statistics
- **Purpose**: cross-MatchDay leaderboards and per-player stat cards.
- **Layout**: filter row (Season/MatchDay/Position/Goals dropdowns + Reset) → left: 3-column grid of player stat cards (avatar+name+position, then a 2×2 Matches/Goals/Assists/Rating mini-grid); right column: "Top 3 Players (G+A)" podium + "Player Spotlight" card.

### Club Rules
- **Purpose**: display club conduct rules.
- **Layout**: hero banner (dark green gradient, book icon, "Club Rules" title, one-line subhead) → "N RULES" counter + "+ Add Rule" button → numbered rule cards (circular number badge + rule text, stacked vertically).

## Interactions & Behavior
- Login: checkbox toggles auto-login state; password field has a show/hide affordance (not wired in the prototype).
- Dashboard/Next Match/etc: sidebar items navigate between screens; nested sidebar items (MatchDays/Venues under Match Management, Player List/My Profile/Statistics under Player) expand under their parent.
- Next Match: clicking a tab (Home/Results/Table/Stats) switches content with an underline + green text indicating the active tab.
- MatchDays: filter pills (All/Upcoming/Concluded) filter the card grid.
- Players: filter pills (All/Active/Inactive) filter the table.
- Venues: "Preview empty state" link toggles between the populated table and the empty state — this toggle is a prototype-only affordance to show both states; in production the empty state should simply render when the venues list is empty.
- Topbar: clicking avatar+name+chevron opens/closes the profile dropdown (chevron rotates 180° when open); clicking the Notifications switch inside it toggles on/off.
- Theme toggle button (Dashboard) switches all Dashboard colors between the light and dark token sets below.

## State Management
- `screen` — which page is active (login / dashboard / nextmatch / matchdays / venues / players / playerprofile / playerstats / clubrules).
- `theme` — 'light' | 'dark' (Dashboard).
- `autoLogin` — boolean (Login).
- `userMenuOpen`, `notifications` — booleans (topbar profile dropdown).
- `nmTab` — 'home' | 'results' | 'table' | 'stats' (Next Match).
- `teamFilter` — 'ALL' | 'TEAM A' | 'TEAM B' | 'TEAM C' (Next Match → Home).
- `mdFilter` — 'All' | 'Upcoming' | 'Concluded' (MatchDays).
- `playerFilter` — 'All' | 'Active' | 'Inactive' (Players).
- `showEmptyVenues` — boolean, prototype-only (Venues) — replace with "is venues list empty" derived state in production.

## Design Tokens

### Dark theme
- Page bg `#0a0f0c` · Sidebar bg `#0e1c14` · Sidebar/card border `#1c2b21` / `#2a3d31`
- Card bg `#12241a` · Inner/well bg `#0e1c14`
- Text primary `#f2f5f0` · Text secondary `#9fb3a5` · Text muted `#6b8172`
- Nav active bg `#16281c` · Nav active text `#7fd99a` · Nav inactive text `#9fb3a5`
- Status tints: confirmed/positive bg `#123322` text `#2f8a52` · pending/warning bg `#332c14` text `#a07a1f` (accent border `#b08a2f`) · negative bg `#331717` text `#c04a3a` (accent border `#b0402f`)

### Light theme
- Page bg `#f7f8f6` · Sidebar/card bg `#ffffff` · Border `#eceee9` / `#e7ebe4`
- Inner/well bg `#f4f6f2`
- Text primary `#16241a` · Text secondary `#6b7d70` · Text muted `#8a988d`
- Nav active bg `#eaf3ec` · Nav active text `#2f6b45`
- Status tints: confirmed bg `#e6f5ea` · pending bg `#fbf1de` · negative bg `#fbe9e6` (text colors same as dark theme)

### Shared accents (both themes)
- Brand gold `#c9a24b` (primary buttons on Login, "View Details", crest border)
- Primary green `#2f6b45` (primary action buttons, active tab underline, confirmed states)
- Warning amber `#d69a2f` (actionable-metric accent, e.g. Payment Due)
- Danger red `#c04a3a` (not-joining / inactive / negative deltas)
- Currency glyph: `৳` (Taka) — never render as `à§³`.

### Type & spacing
- Font: Helvetica/Arial (system sans), no custom webfont loaded.
- Card radius: 14px (large cards), 10px (nested tiles/wells), 8px (buttons/pills), 50% (avatars/badges).
- Card padding: 20–28px depending on card size. Grid gaps: 16–20px.
- Minimum body text: 12–14px; card headline numbers: 22–34px/800 weight.

### Icon map (sidebar)
Dashboard → grid/4-square icon · Next Match → calendar icon · Match Management → whistle icon · Player → person icon · Finance → ledger/table icon · Club Rules → document/lines icon · Settings → gear icon.
(Previously Next Match and Match Management both incorrectly used a pie-chart icon — this map is the corrected version.)

## Assets
No photographic/illustrated assets are used — all avatars are colored-initial placeholders (see fix #10), and all icons are simple inline stroke-style SVGs (calendar, whistle, user, grid, gear, document, search, bell, sun/moon, chevron, warning triangle, trophy, home, checkmark, list, fire, trend-up, building, book). If the target app has an existing icon set (e.g. an icon font or SVG library), swap these for the equivalent icons from that set rather than importing new ones.

## Files
- `Club Rules App - Fixes.dc.html` — the full interactive prototype covering all 9 screens/states described above. Open in a browser to click through it; view its source for exact markup/inline-style values per element.
