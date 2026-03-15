# Show Auth-Conditional CTAs on Landing Page for Logged-In Users

## Metadata
- **Ticket ID:** TICKET-017
- **Priority:** P2
- **Type:** bug
- **Area:** frontend
- **Status:** done
- **Dependencies:** TICKET-002

---

## Problem
The landing page still showed logged-out CTAs to authenticated users. Even after auth hydration was fixed, returning users could still land on `/` and see register-style calls to action instead of a direct path back into the game.

---

## Why This Matters
The landing page is a re-entry point for returning users. Once authentication state is hydrated, logged-in users should be directed to continue playing instead of being prompted to sign in or register again.

---

## Evidence
- `frontend/src/app/page.tsx` used `LandingAuthActions` in the nav, but the authenticated state still rendered multiple buttons instead of the required single dashboard CTA
- the hero and lower CTA sections still hardcoded register buttons
- `frontend/src/components/layout/landing-auth-actions.tsx` already had hydration-aware placeholder logic from `TICKET-002`, so this ticket only needed to extend that component and reuse it consistently

---

## Scope
1. Keep landing CTA rendering hydration-aware
2. Show a single `Go to Dashboard` action for authenticated users
3. Keep logged-out users on the existing register/sign-in flow
4. Reuse the same auth-aware CTA behavior across all landing-page CTA areas

---

## Out of Scope
- Landing page redesign
- Header behavior inside protected routes
- Landing page copy changes beyond the CTA swap

---

## Implementation Notes
- `page.tsx` was already a client component, so no conversion was needed.
- Reused the existing `LandingAuthActions` component instead of adding new page-level auth conditionals.
- Updated `LandingAuthActions` to support:
  - `mode="nav"` for the top-right navigation area
  - `mode="single"` for the hero and lower CTA sections
- Hydration behavior remains unchanged:
  - while auth is not ready, CTA areas render neutral skeleton placeholders
- Authenticated behavior is now consistent across the landing page:
  - authenticated users see a single `Go to Dashboard` button
  - logged-out users still see `Sign In + Get Started` in the nav
  - logged-out users still see the register-style CTAs in the hero and lower CTA sections
- Removed the authenticated `Profile` button from the landing-nav CTA component because the ticket required a single dashboard CTA for logged-in users.

---

## Acceptance Criteria
- [x] Logged-in user opening `/` sees `Go to Dashboard` instead of `Sign In / Get Started`
- [x] Logged-out user opening `/` sees `Sign In + Get Started` in the nav
- [x] During auth check, the CTA area shows skeleton placeholders with no unauthenticated flash
- [x] `Go to Dashboard` links to `/dashboard`
- [x] Other landing-page register CTAs now follow the same authenticated/dashboard behavior

---

## Testing Requirements
- **Automated validation run:**
  - targeted ESLint on touched landing-page files
  - `frontend` production build
- **Manual QA recommended:**
  1. Log in, open `/` in a new tab, and confirm all primary landing CTAs resolve to `Go to Dashboard`
  2. Log out, open `/`, and confirm the logged-out CTA set returns
  3. Refresh during hydration and confirm only placeholders show before auth resolves

---

## Affected Areas
- `frontend/src/app/page.tsx`
- `frontend/src/components/layout/landing-auth-actions.tsx`

---

## Risks / Edge Cases
- The build still carries the existing Next.js warning that `middleware.ts` is deprecated in favor of `proxy`, but this ticket does not alter routing behavior.
- Manual browser QA is still needed to verify the exact perceived hydration timing on a cold load.

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/app/page.tsx`
- `frontend/src/components/layout/landing-auth-actions.tsx`
- `docs/tickets/TICKET-017-landing-page-auth-cta.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/app/page.tsx" "src/components/layout/landing-auth-actions.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Manual browser QA was not run in this terminal session.
