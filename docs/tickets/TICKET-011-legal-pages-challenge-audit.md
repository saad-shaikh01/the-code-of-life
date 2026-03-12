# Create Legal Pages + Audit Challenge Mode Page

## Metadata
- **Ticket ID:** TICKET-011
- **Priority:** P2
- **Type:** feature-gap
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
**Part 1 — Missing legal pages:**
The app footer links to `/about`, `/privacy`, and `/terms`. These pages do not exist — clicking any footer link returns a 404. For any app collecting user data or offering paid subscriptions, a Privacy Policy and Terms of Service are legally required.

**Part 2 — Challenge mode not verified:**
`/challenge/page.tsx` exists but has not been audited for completeness. The frontend agent report did not read this file. It may be fully implemented, partially implemented, or a stub. This ticket covers auditing it and documenting any gaps.

---

## Why This Matters
- Legal pages: Stripe requires T&S and Privacy Policy links for payment acceptance. Missing them could violate Stripe's acceptable use policy and leave the product without legal protection.
- Challenge mode: It is a paid feature (PRO tier). If it's a stub, PRO subscribers are not getting what they paid for.

---

## Evidence
- Footer component links to `/about`, `/privacy`, `/terms` — all return 404
- `PROJECT_OVERVIEW.md` — mentions Challenge Mode as a core game mode (PRO feature)
- `frontend/src/app/(main)/challenge/` directory exists; `page.tsx` content unknown

---

## Scope

### Part 1 — Create legal pages

**`/about`** (`frontend/src/app/about/page.tsx`):
- Brief description of the game and its purpose
- Contact information (placeholder email)
- Doesn't need to be in the `(main)` layout group — can be a standalone page

**`/privacy`** (`frontend/src/app/privacy/page.tsx`):
- Privacy Policy covering:
  - What data is collected (email, username, game progress)
  - How it's used (gameplay, leaderboards, billing via Stripe)
  - Third-party services: Stripe (payment processing)
  - Data retention and deletion (account deletion available in settings)
  - Contact for data requests

**`/terms`** (`frontend/src/app/terms/page.tsx`):
- Terms of Service covering:
  - User accounts and age requirement
  - Subscription billing terms
  - Acceptable use
  - Limitation of liability
  - Governing law

All three pages should use the same visual layout as other public pages (consistent header/footer). They do NOT need to be in the `/(main)/` route group (no sidebar needed).

### Part 2 — Audit `/challenge/page.tsx`

**Action: Read the file first.** Before implementing anything:
1. Read `frontend/src/app/(main)/challenge/page.tsx`
2. Check if it has real data loading, correct API calls, paywall gating
3. If functional: document it as aligned in the audit checklist, no code change needed
4. If stub/incomplete: open a follow-up ticket with specific gaps (do NOT expand this ticket's scope)

---

## Out of Scope
- Designing full legal text from scratch — use standard SaaS boilerplate adjusted for this product
- Any challenge mode implementation (if gaps found, create a new ticket)
- GDPR compliance measures beyond basic privacy policy

---

## Implementation Notes
- Legal pages can use a simple layout without the sidebar: create a `(public)` route group or nest under `app/` directly
- Reuse the same `ThemeProvider` and header component for visual consistency
- Add the correct footer links — verify footer component links to `/about`, `/privacy`, `/terms` (not some other path)
- The legal content doesn't need to be stored in a CMS; hardcoded MDX or JSX is fine

---

## Acceptance Criteria
- [ ] `/about` renders without 404
- [ ] `/privacy` renders without 404 and contains a basic privacy policy
- [ ] `/terms` renders without 404 and contains basic terms of service
- [ ] All three pages are visually consistent with the rest of the app
- [ ] Footer links to all three pages work correctly
- [ ] `/challenge/page.tsx` has been read and its status documented (aligned or gap found)
- [ ] If challenge mode has gaps, a follow-up ticket has been created

---

## Testing Requirements
- **Manual QA:** Click each footer link — verify pages load with correct content
- **Regression:** Footer must still show all existing links

---

## Affected Areas
- New: `frontend/src/app/about/page.tsx`
- New: `frontend/src/app/privacy/page.tsx`
- New: `frontend/src/app/terms/page.tsx`
- Read-only: `frontend/src/app/(main)/challenge/page.tsx`
- Footer component (verify link paths)

---

## Risks / Edge Cases
- Legal text should be reviewed by a lawyer before going live — the boilerplate in this ticket is a placeholder
- Stripe may require specific language in the terms about subscription billing

---

## Open Questions
- Is challenge mode a PRO-only feature? Confirm from `PROJECT_OVERVIEW.md` before auditing the page.
