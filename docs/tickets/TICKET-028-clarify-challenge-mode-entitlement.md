# Clarify and Enforce Challenge Mode Entitlement

## Metadata
- **Ticket ID:** TICKET-028
- **Priority:** P1
- **Type:** mismatch
- **Area:** multi-area
- **Status:** open
- **Dependencies:** TICKET-011

---

## Problem
Challenge Mode is currently exposed to authenticated users without any subscription gating, but the pricing page markets `Challenge Mode unlocked` as a Pro plan feature.

This creates both a product mismatch and an entitlement bug:
- free users can currently access challenge puzzles
- the pricing promise and the implementation do not match

---

## Why This Matters
- Paid-feature access needs to match the product and billing surface
- If Challenge Mode is intended to be Pro-only, the current implementation leaks paid content
- If Challenge Mode is intended to be free, the pricing page is misleading

---

## Evidence
- `frontend/src/app/(main)/pricing/page.tsx` lists `Challenge Mode unlocked` under the Pro plan
- `frontend/src/app/(main)/challenge/page.tsx` fetches challenge puzzles directly with no `useSubscriptionStatus()` check or locked state
- `frontend/src/api/services/puzzles.service.ts` uses `GET /puzzles?gameMode=CHALLENGE`
- `backend/src/modules/puzzles/puzzles.controller.ts` protects `/puzzles/daily` with `SubscriptionGuard`, but the general `/puzzles` listing endpoint has no challenge-specific subscription enforcement

---

## Scope
1. Clarify the intended product rule:
   - Challenge Mode is Pro-only, or
   - Challenge Mode is available to all authenticated users
2. Align all affected surfaces to the chosen rule:
   - pricing copy
   - challenge page UI
   - puzzle listing access for challenge content
3. If Challenge Mode is Pro-only:
   - add frontend locked-state handling
   - block or filter challenge content server-side for non-Pro users
   - ensure non-Pro errors are handled as locked-state UX, not generic failures

---

## Out of Scope
- Challenge mode redesign
- New challenge gameplay mechanics
- Generic challenge-page loading/error polish already covered by `TICKET-019`

---

## Acceptance Criteria
- [ ] Challenge Mode entitlement is explicitly defined and documented
- [ ] Pricing copy and product behavior match
- [ ] Free users cannot access Challenge Mode if it remains a Pro feature
- [ ] If Challenge Mode is not Pro-only, pricing and upgrade messaging are corrected accordingly
- [ ] Frontend and backend contract behavior is validated for the final rule

---

## Affected Areas
- `frontend/src/app/(main)/challenge/page.tsx`
- `frontend/src/app/(main)/pricing/page.tsx`
- `frontend/src/hooks/use-puzzles.ts` or related subscription hooks
- `frontend/src/api/services/puzzles.service.ts`
- `backend/src/modules/puzzles/puzzles.controller.ts`
- Possibly `backend/src/modules/puzzles/puzzles.service.ts`

---

## Risks / Edge Cases
- A frontend-only gate is insufficient if challenge content should be paid; the backend contract must also align
- Any change to challenge entitlement can affect seeded progress expectations, pricing copy, and subscription UX

---

## Open Questions
- Is the pricing page the source of truth, or should Challenge Mode be reclassified as a free authenticated mode?
