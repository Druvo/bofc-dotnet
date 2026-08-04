# BOFC User Manual

**[BJIT-2.0] Originals Football Club — Tournament Management App**

This guide explains how to use the BOFC web app as an end user: logging in, joining tournaments, following matches, taking part in player auctions, and managing club records if you're a coordinator or admin.

---

## 1. Getting Started

### Accessing the app

Open the app in your browser. If you're not logged in, you'll always land on the **Sign In** page.

### Logging in

1. Enter your **email address** and **password**.
2. Optionally check **Enable Auto Login** — this remembers your login on this device so you're signed in automatically next time you visit. Uncheck it (or use a shared/public computer) if you don't want that.
3. Click **Sign In to Dashboard**.

**First time logging in?** If your account was just created (by an admin, or through auction registration), you'll be asked to set a new password before you can continue:
- Enter the temporary password you were given as "Old Password."
- Choose a **New Password** (must be at least 8 characters with an uppercase letter, a lowercase letter, and a number).

**Forgot your password?** Ask a coordinator or admin to reset it for you from the Players list — there's no self-service "forgot password" link yet. Once reset, you'll go through the same first-time password change above.

**Changing your password anytime:** open your account menu (top-right avatar) → **Settings** → change your password there.

### Your role

What you can see and do depends on your role:

| Role | Can do |
|---|---|
| **Player** | View everything relevant to them; RSVP to tournaments; view their own profile, stats, and match history; manage their own password |
| **Coordinator** | Everything a Player can, plus manage tournaments, fixtures, and teams |
| **Admin** | Everything a Coordinator can, plus manage players, finance, venues, club rules, auctions, and reset other players' passwords |
| **Super Admin** | Everything an Admin can, plus assign roles to other players |

If a button or menu isn't visible to you, it's likely restricted to a higher role.

---

## 2. The Dashboard

After logging in, the **Dashboard** (left sidebar) is your home screen. It shows:
- Total collections, total expenses, and current account balance
- The next upcoming match
- A chart of player contributions/payments by month

---

## 3. Your Profile

Click your name/avatar or a player's name anywhere in the app to open a profile page. It shows:
- Photo, contact details, and playing position
- Stat tiles: Matches, Goals, Assists, Goals+Assists, Yellow/Red cards
- **Match History** — a record of wins/draws/losses and your contribution in each match
- **Goalkeeping History** — a timeline of rounds you played in goal

If it's your own profile, you'll also see tabs to **Edit Profile** and **Change Password**. Admins can edit any player's profile and reset their password from the Players list.

---

## 4. Tournaments

### Browsing tournaments

Go to **Tournaments** in the sidebar. Tournaments are shown as cards, filterable by status (Upcoming / Ongoing / Concluded) and searchable by name. Each card shows the date, venue, and status, with a menu of actions depending on the tournament and your role.

### Joining a tournament (RSVP)

Open a tournament and choose **Join** to go to its RSVP page. Here you can:
- See how many players are confirmed In / Out / still Pending, with a fill-progress bar
- Respond **Yes, I'm in** or **Can't make it**, with an optional comment
- View the current team list once teams are formed

Your response auto-saves as you type a comment — no separate save button needed.

### Following a tournament (Match Center)

The **Match Center** (sidebar) or a tournament's own tabs let you follow everything about a tournament:
- **Fixtures** — the full match schedule, with live score/event updates and timers for matches in progress
- **Roadmap** — a visual bracket/flow of rounds and groups (or an uploaded bracket image)
- **Results** — completed match results
- **Table** — standings per group/round
- **Stats** — top scorers and other leaderboards
- **Players** — team rosters with photos and captain/vice-captain badges
- **Rules** — the tournament's own rules, if the organizer added any
- **Prizes** — prizes on offer (team or individual), with position/category/amount

**No login needed:** anyone can view a tournament's Match Center without an account — share the link with friends, family, or fans. A **Login** tab appears there for anyone who wants to sign in.

---

## 5. Running a Tournament (Coordinators & Admins)

### Creating a tournament

**Tournaments → New Tournament**. Fill in name, date/time, venue, season, description, and rules (supports rich text). Turn on **Auction Mode** if teams should be formed through a player auction instead of manual assignment (see [Section 6](#6-player-auctions)). You can also mark a tournament as the "default" one and upload a roadmap/bracket image.

### Building teams

Open a tournament's **Team Building** tab to:
- Create teams and upload team logos
- Drag and drop players from the unassigned pool into teams
- Use the **Picker Wheel** to randomly decide something (e.g. captain toss order) — it's pre-loaded with team captains
- **Export** the roster to Excel

### Setting up rounds, groups, and fixtures

Once teams exist, the **Fixtures** tab unlocks the Manual Fixture System:
1. **Tournament** tab — build the structure: create rounds (Group-Based or Direct Knockout), add groups within a round, assign teams, and generate matches automatically. Set advancement rules for which group positions move on to the next round.
2. **Matches** tab — see and edit the full schedule; add/edit individual fixtures (teams, venue, date/time); switch between calendar, list, card, or timeline views.
3. **Overview** tab — round/group/team/match counts, completion progress, top scorers, and live matches.

### Running a live match

From a fixture, click **Start Match** and pick the venue/duration. While the match is live, record events as they happen — **Goal, Assist, Yellow Card, Red Card, Substitution, Injury** — tied to a team, player, and match minute. The running score updates automatically. When finished, click **Complete Match**.

### Prizes

Add prizes under a tournament's **Prizes** tab: choose Team or Player type, the position it's for (1st, 2nd, 3rd, etc.), category, amount, and an optional description/image.

---

## 6. Player Auctions

Some tournaments use an **auction** to form teams instead of manual assignment. Open **Auction** in the sidebar to see all auction tournaments as cards, with live status (Not Started / Running / Paused / Completed).

### Registering for an auction

- **Already have an account?** Click **Register Me for This Auction** — it's instant, using your existing profile.
- **New to the club?** Use the public registration form (name, email, employee ID, phone, preferred position, availability, experience, photo). Your registration goes to an admin for approval; once approved, an account is created for you automatically with a default password (you'll be asked to change it on first login).

### Watching a live auction

Click **Live Auction** (or **Watch Live**) to follow along in real time: the player currently up for bid, a countdown timer, bid history, and each team's remaining budget.

### If you're a team owner

You can place bids in preset increments while a player is up for auction. You'll also be able to view your team's purchased squad and remaining budget at any point.

### Admin auction management

Admins configure auction **Settings** (starting budget, bid increments, timer length, squad size limits), manage the **Player Pool** and price categories, set up **Team Budgets** and owners, review and approve registrations, and run the live auction (start/pause/next/sell/mark unsold/skip/end).

---

## 7. Finance (Accounts)

Everyone can view financial records; only Admins/Super Admins can create or edit them.

- **Collections (+)** — payments received from players, with monthly filters and a per-player collection chart
- **Bill Payment (-)** — club expenses by cost type
- **Voucher Register** — a combined ledger of transactions
- **Accounts Reports** — Accounts Report, Balances Summary, and Balances Sheet (read-only financial statements)
- **Configuration** (admin only) — Voucher Types, AC Natures, and Chart of Account reference tables used across the finance section

---

## 8. Venues & Club Rules

- **Venues** — list of grounds/venues used for matches; admins can add or edit them.
- **Club Rules** — the club's official rules, readable by everyone; admins can add or edit entries.

---

## 9. Account Settings

From your avatar menu (top-right), you can:
- Switch between **dark mode** and **light mode** (🌙/☀️) — your choice is remembered on this device
- Open **Settings** to change your password or update basic profile info
- View your **Goalkeeping History**
- **Log out**

---

## 10. Roles & Permissions Reference

| Feature | Player | Coordinator | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|
| View dashboard, tournaments, players, finance, venues, rules | ✅ | ✅ | ✅ | ✅ |
| RSVP to tournaments | ✅ | ✅ | ✅ | ✅ |
| Edit own profile & password | ✅ | ✅ | ✅ | ✅ |
| Create/manage tournaments, rounds, fixtures, teams | ❌ | ✅ | ✅ | ✅ |
| Run live matches (record events) | ❌ | ✅ | ✅ | ✅ |
| Create/edit players, reset other players' passwords | ❌ | ❌ | ✅ | ✅ |
| Create/edit finance entries, venues, club rules | ❌ | ❌ | ✅ | ✅ |
| Manage auctions (settings, pool, budgets, approvals) | ❌ | ❌ | ✅ | ✅ |
| Assign roles to other players | ❌ | ❌ | ❌ | ✅ |

---

## 11. Troubleshooting & FAQ

**I can't see a button/menu I expected.**
It's likely restricted to a role above yours — see the table above. Ask an admin if you believe you need access.

**I forgot my password.**
Ask an admin or coordinator to reset it from the Players list. You'll be asked to set a new one on your next login.

**A tournament isn't showing fixtures yet.**
Fixtures only appear once teams have been built and matches generated by a coordinator/admin.

**I don't have an account yet but want to join an auction.**
Use the public registration form linked from the auction page — no login required to apply.

**Can I share a tournament with someone who doesn't have an account?**
Yes — the tournament's Match Center (fixtures, results, standings, stats, players, rules) is public. Just share the link.
