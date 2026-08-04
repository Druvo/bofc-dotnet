# Round Start Validation & Manual Team Advancement Implementation

## Date: December 2024

## Overview
Implemented two key features:
1. **Round Start Validation** - Prevents starting a round until previous round is completed
2. **Manual Team Selection** - Allows admins to manually select which teams advance to next round

---

## ✅ Backend Changes

### 1. Round Start Validation
**File:** `TournamentRoundServiceImpl.java`

**Added validation in `startRound()` method:**
```java
// Check if previous round is completed (if not the first round)
if (round.getSequenceOrder() > 1) {
    TournamentRound previousRound = tournamentRoundRepository
            .findPreviousRoundBySequence(round.getTournament().getId(), round.getSequenceOrder())
            .orElse(null);

    if (previousRound != null && previousRound.getStatus() != RoundStatus.COMPLETED) {
        throw new RoundServiceException(
                String.format("Cannot start round '%s'. Previous round '%s' (Sequence %d) must be completed first.",
                        round.getRoundName(), previousRound.getRoundName(), previousRound.getSequenceOrder()),
                HttpStatus.BAD_REQUEST);
    }
}
```

**Behavior:**
- ✅ First round (sequence 1) can always be started
- ✅ Subsequent rounds require previous round to be COMPLETED
- ❌ Returns 400 Bad Request if previous round is not completed

---

### 2. Manual Team Selection for Advancement
**File:** `RoundCompletionRequest.java`

**Added field:**
```java
/**
 * Manual team selection for advancement
 * If provided, these teams will be advanced instead of using automatic rules
 * Format: List of team IDs to advance to next round
 */
private List<Long> selectedTeamIds;
```

**File:** `TournamentRoundServiceImpl.java`

**New method:** `advanceSelectedTeamsToNextRound()`
- Accepts list of team IDs
- Validates all teams exist
- Assigns teams to next round:
  - Group-based rounds: Assigns to first group (or creates round team entry)
  - Direct knockout: Assigns directly to round
- Returns advancement response with selected teams

**Updated `completeRound()` method:**
```java
// Use manual team selection if provided, otherwise use automatic rules
if (request.getSelectedTeamIds() != null && !request.getSelectedTeamIds().isEmpty()) {
    advancedTeamsResponse = advanceSelectedTeamsToNextRound(round, request.getSelectedTeamIds());
} else {
    advancedTeamsResponse = advanceTeamsToNextRound(round);
}
```

---

## ✅ Frontend Changes

### 1. Updated Types
**File:** `manualFixtureTypes.ts`

```typescript
export interface RoundCompletionRequest {
  roundId: number;
  recalculateStandings?: boolean;
  autoAdvanceTeams?: boolean;
  selectedTeamIds?: number[]; // NEW: Manual team selection
}
```

### 2. Created Team Advancement Modal
**File:** `TeamAdvancementModal.tsx` (NEW)

**Features:**
- Shows all teams from the round (from groups or direct teams)
- Two modes:
  - **Automatic**: Uses advancement rules (default)
  - **Manual**: Admin selects teams via checkboxes
- Displays team standings (position, points, goal difference) for group-based rounds
- Shows team count and selection count
- Select All / Clear buttons
- Validates at least one team selected in manual mode

**UI Components:**
- Team table with checkboxes
- Mode toggle buttons
- Statistics (available teams, selected count)
- Alert messages

### 3. Updated Interactive Tournament Tab
**File:** `InteractiveTournamentTab.tsx`

**Changes:**
1. **Start Round Validation:**
   - Checks if previous round is completed
   - Disables button if previous round not completed
   - Shows warning message with reason

2. **Complete Round Flow:**
   - Opens `TeamAdvancementModal` when completing round
   - Handles both automatic and manual selection
   - Shows modal only if next round exists

3. **State Management:**
   - Added `showTeamAdvancement` state
   - Added `roundToComplete` state
   - Added `handleConfirmAdvancement` callback

---

## 🎯 User Flow

### Starting a Round

1. **First Round:**
   - Click round node → Click "Start Round"
   - ✅ Round starts immediately (no validation needed)

2. **Subsequent Rounds:**
   - Click round node → See "Start Round" button
   - If previous round not completed:
     - ❌ Button is disabled
     - ⚠️ Warning message: "Previous round 'X' must be completed first"
   - If previous round completed:
     - ✅ Button enabled
     - Click → Round starts

### Completing a Round with Team Advancement

1. **Click "Complete Round" button**
2. **Modal opens with two options:**

   **Option A: Automatic Advancement**
   - Default mode
   - Uses configured advancement rules
   - Click "Complete & Auto-Advance"
   - Teams advanced automatically based on rules

   **Option B: Manual Selection**
   - Click "Manual Selection" button
   - See table of all teams with checkboxes
   - Select teams to advance
   - See selection count
   - Click "Complete & Advance X Teams"
   - Selected teams advanced to next round

3. **Success:**
   - Message: "Round completed! X teams advanced to [Next Round Name]"
   - Tournament structure refreshes
   - Next round becomes available

---

## 📋 API Changes

### Modified Endpoint
| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/rounds/{roundId}/start` | ✅ Added validation: Previous round must be completed |
| POST | `/rounds/complete` | ✅ Added `selectedTeamIds` parameter for manual selection |

### Request Body (Complete Round)
```json
{
  "roundId": 1,
  "recalculateStandings": true,
  "autoAdvanceTeams": true,
  "selectedTeamIds": [1, 2, 3, 4]  // NEW: Optional manual selection
}
```

**Behavior:**
- If `selectedTeamIds` provided and not empty → Use manual selection
- If `selectedTeamIds` not provided or empty → Use automatic rules
- If `autoAdvanceTeams: false` → No advancement (final round)

---

## 🎨 UI Features

### Team Advancement Modal

**Automatic Mode:**
- Shows info alert about automatic rules
- Single "Complete & Auto-Advance" button

**Manual Mode:**
- Team selection table with:
  - Checkbox column
  - Team name with group tag (if group-based)
  - Position (if standings available)
  - Points (if standings available)
  - Goal Difference (if standings available)
- Statistics row:
  - Available teams count
  - Selected teams count
  - Select All / Clear buttons
- Teams sorted by:
  - Position (if available)
  - Points (if available)
  - Goal Difference (if available)
  - Alphabetical (fallback)

### Start Round Validation

**Visual Indicators:**
- Button disabled if previous round not completed
- Tooltip shows reason
- Warning alert below button with explanation

---

## ✅ Validation Rules

### Start Round
1. ✅ Round must exist
2. ✅ Round status must be NOT_STARTED
3. ✅ **NEW:** If sequence > 1, previous round must be COMPLETED
4. ❌ Error if previous round is NOT_STARTED or ONGOING

### Complete Round
1. ✅ Round must exist
2. ✅ All matches in round must be completed
3. ✅ If manual selection: At least 1 team must be selected
4. ✅ If manual selection: All selected team IDs must exist

---

## 🧪 Testing Checklist

### Start Round Validation
- [ ] Start first round (sequence 1) - should work
- [ ] Try to start round 2 before completing round 1 - should fail with error
- [ ] Complete round 1, then start round 2 - should work
- [ ] Verify error message shows previous round name

### Manual Team Advancement
- [ ] Complete round with automatic mode - teams advance by rules
- [ ] Complete round with manual mode - select teams, verify advancement
- [ ] Try to complete without selecting teams in manual mode - should show warning
- [ ] Verify selected teams appear in next round
- [ ] Complete final round - should not show advancement modal

---

## 📝 Notes

1. **Team Assignment Logic:**
   - Manual teams assigned to first group if next round is group-based
   - Can be reassigned to different groups later
   - Assignment type: `MANUAL` (not `RULE_BASED`)

2. **Standings Display:**
   - Modal shows standings if available
   - Falls back to team list if no standings
   - Teams sorted by performance metrics

3. **Final Round:**
   - No advancement modal shown
   - Completes directly without team selection

---

## ✅ Status

**Implementation Complete!**

- ✅ Backend validation for round start
- ✅ Manual team selection API
- ✅ Frontend team selection modal
- ✅ UI validation and error handling
- ✅ Integration with tournament flow

**Ready for testing!**

