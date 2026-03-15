# Create Legal Pages + Audit Challenge Mode Page

## Metadata
- **Ticket ID:** TICKET-011
- **Priority:** P2
- **Type:** feature-gap
- **Area:** frontend
- **Status:** done
- **Dependencies:** none

---

## Problem
**Part 1 - Missing legal pages:**
The app linked to `/about`, `/privacy`, and `/terms`, but those pages did not exist.

**Part 2 - Challenge mode not verified:**
`/challenge/page.tsx` existed, but its implementation had not been audited to confirm whether it was real, stubbed, or missing entitlement logic.

---

## Why This Matters
- Stripe-facing products need working Privacy Policy and Terms pages
- Public links that return 404s make the product feel unfinished
- Challenge Mode is listed as a Pro unlock in the pricing page, so the audit needed to confirm whether the implementation actually matched that product claim

---

## Evidence
- `frontend/src/app/page.tsx` includes inline footer links to `/about`, `/privacy`, and `/terms`
- `frontend/src/components/layout/footer.tsx` also defines those legal links
- `frontend/src/app/(main)/challenge/page.tsx` exists and needed direct verification
- `frontend/src/app/(main)/pricing/page.tsx` lists `Challenge Mode unlocked` as a Pro feature

---

## Scope
1. Create public `/about`, `/privacy`, and `/terms` pages with real minimum content
2. Keep those pages visually aligned with the rest of the app's public surfaces
3. Audit `/challenge/page.tsx` and document what it does
4. If challenge mode has confirmed gaps, record them and create a follow-up backlog ticket without expanding this ticket's implementation scope

---

## Out of Scope
- Legal review by counsel
- Rewriting challenge mode itself
- Subscription entitlement implementation for challenge mode
- General challenge-page error/loading-state cleanup already covered by `TICKET-019`

---

## Implementation Notes
- Added three new public pages under `frontend/src/app/`:
  - `/about`
  - `/privacy`
  - `/terms`
- Each page uses the same dark gradient public-shell styling pattern already used by the landing and auth surfaces, with a simple top nav and footer links
- The legal copy is product-specific and minimal, not placeholder lorem ipsum
- Audit result for `frontend/src/app/(main)/challenge/page.tsx`:
  - The page is not a stub
  - It fetches real challenge puzzles via `usePuzzles({ gameMode: "CHALLENGE", limit: 100 })`
  - It fetches real user progress via `useUserProgress()`
  - It computes live stats, client-side difficulty filtering, and passes real puzzle/progress data into `PuzzleCard`
  - It does **not** apply any subscription or Pro entitlement check in the page
  - It passes `isLocked={false}` unconditionally to `PuzzleCard`
  - The backend `GET /puzzles` listing endpoint used by the page is also not protected by `SubscriptionGuard` for `gameMode=CHALLENGE`
- Confirmed challenge gap:
  - Pricing sells Challenge Mode as a Pro unlock, but the current frontend/backend flow exposes challenge puzzles to any authenticated user
- Follow-up created:
  - `TICKET-028-clarify-challenge-mode-entitlement.md`
- Existing gap already tracked elsewhere:
  - The page has no dedicated fetch-error state and falls back to an empty state on query failure; that concern is already covered by `TICKET-019`, so no duplicate ticket was opened for it

---

## Challenge Page Gaps Found
1. **Entitlement mismatch:** `pricing/page.tsx` presents Challenge Mode as a Pro feature, but `challenge/page.tsx` has no subscription gate and the underlying puzzle listing API is not subscription-protected for challenge content.
2. **Error-state gap already tracked:** query failures are not distinguished from empty content, but that is already in scope under `TICKET-019` and was not duplicated here.

---

## Acceptance Criteria
- [x] `/about` renders without 404
- [x] `/privacy` renders without 404 and contains a basic privacy policy
- [x] `/terms` renders without 404 and contains basic terms of service
- [x] All three pages are visually consistent with the rest of the app
- [x] Footer links to all three pages work correctly
- [x] `/challenge/page.tsx` has been read and its status documented (aligned or gap found)
- [x] If challenge mode has gaps, a follow-up ticket has been created

---

## Testing Requirements
- **Manual QA scenarios to run:**
  1. Click the landing page footer links for `/about`, `/privacy`, and `/terms` and verify each page loads
  2. Confirm the new pages render as public pages with no auth requirement
  3. Open `/challenge` while authenticated and confirm it still loads its live puzzle list after this ticket's documentation-only audit

---

## Affected Areas
- `frontend/src/app/about/page.tsx`
- `frontend/src/app/privacy/page.tsx`
- `frontend/src/app/terms/page.tsx`
- Read-only audit: `frontend/src/app/(main)/challenge/page.tsx`
- `docs/tickets/TICKET-028-clarify-challenge-mode-entitlement.md`

---

## Risks / Edge Cases
- The legal text is operational boilerplate and should still be reviewed by counsel before production launch
- The challenge entitlement issue remains unresolved until `TICKET-028` is implemented

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/app/about/page.tsx`
- `frontend/src/app/privacy/page.tsx`
- `frontend/src/app/terms/page.tsx`
- `docs/tickets/TICKET-011-legal-pages-challenge-audit.md`
- `docs/tickets/TICKET-028-clarify-challenge-mode-entitlement.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/app/about/page.tsx" "src/app/privacy/page.tsx" "src/app/terms/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Browser manual QA was not executed in this terminal session; the public-link checks above remain the recommended follow-up.
