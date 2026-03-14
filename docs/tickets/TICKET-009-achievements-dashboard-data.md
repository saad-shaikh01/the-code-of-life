# Replace Hardcoded Achievement Placeholders on Dashboard with Real Data

## Metadata
- **Ticket ID:** TICKET-009
- **Priority:** P1
- **Type:** bug
- **Area:** frontend
- **Status:** done
- **Dependencies:** none

---

## Problem
The dashboard's "Achievements" preview section showed hardcoded emoji placeholders (`🏆⭐🔥💎🎯🌟`) with static text "3 of 20 unlocked". This data was never fetched from the API.

The `/achievements` page (`achievements/page.tsx`) is fully implemented and correctly calls `useUserAchievements()`. The profile page (`profile/page.tsx:293-314`) also correctly loads real achievement data. Only the dashboard preview card was stale.

---

## Why This Matters
Users were seeing misleading static data on the dashboard, which is the most visited page in the app. A user with 0 achievements saw "3 of 20 unlocked". A user with 15 achievements also saw "3 of 20 unlocked". This broke trust and made the dashboard feel unfinished.

---

## Evidence
- `frontend/src/app/(main)/dashboard/page.tsx` used a hardcoded emoji array
- `frontend/src/app/(main)/achievements/page.tsx:142` already used `useUserAchievements()`
- `frontend/src/app/(main)/profile/page.tsx:293-314` already contained the real-data preview pattern

---

## Scope
In `dashboard/page.tsx`, replace the hardcoded achievements preview with the same real-data pattern already used on the profile page:

1. Add `useUserAchievements()`
2. Derive the real unlocked and total counts from API data
3. Render the first 6 unlocked achievements
4. Render a loading skeleton while the hook is fetching
5. Render an empty state when the user has not unlocked any achievements
6. Keep the "View All" link to `/achievements`

---

## Out of Scope
- Changes to the `/achievements` page
- Changes to the `/profile` page
- Achievement unlock logic or criteria changes
- Adding new achievement types

---

## Implementation Notes
- `dashboard/page.tsx` now calls `useUserAchievements()` directly
- The dashboard derives `achievements`, `unlockedAchievements`, `unlockedCount`, and `totalCount` from the hook response
- The preview grid now renders the first 6 unlocked achievements using the same fallback icon pattern as the profile page (`achievement.iconUrl || "🏆"`)
- The old hardcoded emoji array and static `"3 of 20 unlocked"` text were removed
- Loading now uses a six-cell `Skeleton` grid plus count placeholder
- Users with no unlocked achievements now see the empty state message `Complete puzzles to earn achievements`

---

## Acceptance Criteria
- [x] Dashboard achievements section shows the actual count of unlocked achievements
- [x] The emoji grid shows real unlocked achievement icons (up to 6)
- [x] A user with 0 achievements sees "0 of X unlocked" and an empty state message
- [x] Loading state shows a skeleton while data is fetching
- [x] Hardcoded `["🏆","⭐","🔥","💎","🎯","🌟"]` array no longer exists in `dashboard/page.tsx`

---

## Testing Requirements
- **Manual QA scenarios to run:**
  1. Log in as a user with 0 achievements and verify the dashboard shows `0 of X unlocked`
  2. Complete a puzzle to unlock a first achievement and verify the dashboard count and icon preview update
- **Regression:** Achievement icons on the profile page should still render correctly

---

## Affected Areas
- `frontend/src/app/(main)/dashboard/page.tsx`

---

## Risks / Edge Cases
- The `useUserAchievements()` hook requires auth; the dashboard is already a protected route, so this remains consistent with existing usage
- If the achievements table is empty, the dashboard now shows `0 of 0 unlocked` gracefully

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/app/(main)/dashboard/page.tsx`
- `docs/tickets/TICKET-009-achievements-dashboard-data.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/app/(main)/dashboard/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Browser manual QA was not executed in this terminal session; the dashboard achievement scenarios above remain the recommended spot-checks.
