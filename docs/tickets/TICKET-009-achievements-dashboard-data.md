# Replace Hardcoded Achievement Placeholders on Dashboard with Real Data

## Metadata
- **Ticket ID:** TICKET-009
- **Priority:** P1
- **Type:** bug
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
The dashboard's "Achievements" preview section shows hardcoded emoji placeholders (🏆⭐🔥💎🎯🌟) with static text "3 of 20 unlocked". This data is never fetched from the API.

The `/achievements` page (`achievements/page.tsx`) is fully implemented and correctly calls `useUserAchievements()`. The profile page (`profile/page.tsx:293-314`) also correctly loads real achievement data. Only the dashboard preview card remains stale.

---

## Why This Matters
Users see misleading static data on the dashboard — the most visited page in the app. A user with 0 achievements sees "3 of 20 unlocked". A user with 15 achievements also sees "3 of 20 unlocked". This breaks trust and makes the dashboard feel unfinished.

---

## Evidence
- `frontend/src/app/(main)/dashboard/page.tsx` — achievements section uses a hardcoded array
- `frontend/src/app/(main)/achievements/page.tsx:142` — `useUserAchievements()` correctly implemented
- `frontend/src/app/(main)/profile/page.tsx:293-314` — real data loaded pattern to mirror

---

## Scope
In `dashboard/page.tsx`, find the achievements preview card and:

1. **Add the hook call:**
   ```typescript
   import { useUserAchievements } from "@/hooks";
   const { data: achievementsData, isLoading: achievementsLoading } = useUserAchievements();
   ```

2. **Replace hardcoded values:**
   ```typescript
   const achievements = achievementsData?.data || [];
   const unlockedCount = achievements.filter(a => a.isUnlocked).length;
   const totalCount = achievements.length;
   ```

3. **Replace hardcoded emoji grid** with real unlocked achievements (mirror `profile/page.tsx:293-314`):
   ```typescript
   {achievementsLoading ? (
     <Skeleton className="h-12" />
   ) : unlockedCount > 0 ? (
     achievements.filter(a => a.isUnlocked).slice(0, 6).map(a => (
       <div key={a.id} title={a.name}>
         {a.iconUrl || "🏆"}
       </div>
     ))
   ) : (
     <p>No achievements yet. Start solving puzzles!</p>
   )}
   ```

4. **Update the count text:** Replace `"3 of 20 unlocked"` with `"{unlockedCount} of {totalCount} unlocked"`.

---

## Out of Scope
- Changes to the `/achievements` page (already correct)
- Achievement unlock logic or criteria changes
- Adding new achievement types

---

## Implementation Notes
- The `useUserAchievements()` hook is already defined in `frontend/src/hooks/` — just import and call it
- The pattern in `profile/page.tsx:293-314` is the exact reference implementation; copy it
- The dashboard preview shows max 6 achievements (same as profile page)
- Achievement `iconUrl` can be null — fall back to `"🏆"` emoji (same as profile page does)

---

## Acceptance Criteria
- [ ] Dashboard achievements section shows the actual count of unlocked achievements
- [ ] The emoji grid shows real unlocked achievement icons (up to 6)
- [ ] A user with 0 achievements sees "0 of X unlocked" and an empty state message
- [ ] Loading state shows a skeleton while data is fetching
- [ ] Hardcoded `["🏆","⭐","🔥","💎","🎯","🌟"]` array no longer exists in `dashboard/page.tsx`

---

## Testing Requirements
- **Manual QA:**
  1. Log in as a user with 0 achievements — verify dashboard shows "0 of X unlocked"
  2. Complete a puzzle to unlock a first achievement — verify dashboard count updates
- **Regression:** Achievement icons on the profile page must continue working correctly

---

## Affected Areas
- `frontend/src/app/(main)/dashboard/page.tsx`

---

## Risks / Edge Cases
- The `useUserAchievements()` hook requires auth — it will return empty/error if called without a valid token. The dashboard is a protected route, so this should be fine.
- If the achievements DB is empty (no seed run), `totalCount` = 0 — show "0 of 0 unlocked" gracefully

---

## Open Questions
None.
