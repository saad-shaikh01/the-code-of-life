# Implement Growth Avatar Stage Progression Logic

## Metadata
- **Ticket ID:** TICKET-014
- **Priority:** P2
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** open
- **Dependencies:** none

---

## Problem
The `User` Prisma model has `growthPoints` and `growthStage` fields (stages 1–5), and a `GrowthAvatar` component exists in the frontend. However, no backend logic ever updates these fields — `growthPoints` is never incremented and `growthStage` is never advanced.

Currently, the profile page hardcodes the growth calculation client-side:
```typescript
// profile/page.tsx:185
growthPoints={user.totalScore || 0}
growthStage={Math.min(5, Math.floor((user.totalScore || 0) / 1000) + 1)}
```
This is a workaround — `GrowthAvatar` reads `user.totalScore` as a proxy for growth points, which means:
1. `User.growthPoints` DB field is always 0 (unused)
2. `User.growthStage` DB field is always 1 (unused)
3. The growth display is approximate, not the intended game mechanic

---

## Why This Matters
The growth avatar is marketed as a PRO feature (profile page shows it behind `LockedOverlay isLocked={!isPro}`). If PRO users unlock it and see it never progresses because the backend never updates it, the feature is broken as a value proposition.

---

## Evidence
- `backend/prisma/schema.prisma` — `User` model: `growthPoints Int @default(0)`, `growthStage Int @default(1)`
- `frontend/src/app/(main)/profile/page.tsx:183-186` — workaround using `totalScore` instead of `growthPoints`
- No backend code exists that calls `prisma.user.update({ data: { growthPoints: ..., growthStage: ... } })`
- `GrowthAvatar` component exists in `frontend/src/components/zen/`

---

## Scope

### Backend

**1. Define growth thresholds** (add to a constants file or inline):
```typescript
const GROWTH_THRESHOLDS = [0, 50, 150, 350, 700, 1200]; // points to reach each stage
// Stage 1: 0–49, Stage 2: 50–149, Stage 3: 150–349, Stage 4: 350–699, Stage 5: 700+
```

**2. Update `progress.service.ts` — `updateUserStats()` method:**
After updating `totalScore`, also update `growthPoints` and `growthStage`:
```typescript
const newGrowthPoints = user.growthPoints + scoreGained;
const newGrowthStage = GROWTH_THRESHOLDS.findLastIndex(t => newGrowthPoints >= t) + 1;

await prisma.user.update({
  where: { id: userId },
  data: {
    growthPoints: newGrowthPoints,
    growthStage: Math.min(5, newGrowthStage),
  },
});
```

**3. Include `growthPoints` and `growthStage` in user response DTOs:**
Ensure `GET /api/auth/me`, `GET /api/users/profile`, and `GET /api/users/stats` return these fields.

### Frontend

**4. Update `profile/page.tsx`** to use real values:
```typescript
// Before (workaround):
growthPoints={user.totalScore || 0}
growthStage={Math.min(5, Math.floor((user.totalScore || 0) / 1000) + 1)}

// After (real data):
growthPoints={user.growthPoints || 0}
growthStage={user.growthStage || 1}
```

**5. Update `User` type** in `frontend/src/types/api.types.ts` if `growthPoints` and `growthStage` are not already in the interface.

---

## Out of Scope
- The visual design of the GrowthAvatar component (already exists)
- Changing the growth thresholds after initial implementation
- Growth avatar unlocking for free users (already behind PRO paywall on profile page)

---

## Implementation Notes
- `scoreGained` in `updateUserStats()` should be the score from the just-submitted puzzle, not a delta — use `Math.max(0, newScore - previousBestScore)` to only add points for improvements, or add the full score each time (simpler, but allows grinding same puzzle)
- Recommended: add `scoreGained` only for first-time puzzle completion or when score improves (aligned with how `totalScore` is already calculated)
- The `GROWTH_THRESHOLDS` array should be configurable via env or constants — don't hardcode in service logic

---

## Acceptance Criteria
- [ ] `User.growthPoints` is updated in the database when a puzzle is completed
- [ ] `User.growthStage` advances automatically when `growthPoints` crosses a threshold
- [ ] `GET /api/auth/me` response includes `growthPoints` and `growthStage`
- [ ] Profile page uses `user.growthPoints` and `user.growthStage` (not `totalScore` workaround)
- [ ] Completing 5 puzzles advances the avatar from stage 1 to stage 2 (verify with real thresholds)

---

## Testing Requirements
- **Unit test:** `updateUserStats()` — verify `growthPoints` and `growthStage` updated correctly at each threshold boundary
- **Manual QA:** Complete a puzzle → check profile → verify growth avatar stage changed if threshold crossed

---

## Affected Areas
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/users/users.service.ts` (ensure growth fields included in response)
- `backend/prisma/schema.prisma` (no changes needed — fields already exist)
- `frontend/src/app/(main)/profile/page.tsx`
- `frontend/src/types/api.types.ts` (add `growthPoints`, `growthStage` to `User` interface if missing)

---

## Risks / Edge Cases
- If `growthPoints` is initialized to 0 for existing users and we add scores retroactively, users will jump straight to high stages — consider a migration or just start fresh from 0 for all users
- `findLastIndex` is ES2023 — verify Node.js version supports it, otherwise use `reduceRight` or a manual loop

---

## Open Questions
- Should growth points be awarded for every puzzle completion, or only for PRO users? (Current assumption: all users accumulate growth points, but only PRO users can see the avatar)
