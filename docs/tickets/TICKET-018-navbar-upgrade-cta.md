# Add Upgrade CTA to Header for Free-Tier Users

## Metadata
- **Ticket ID:** TICKET-018
- **Priority:** P3
- **Type:** feature-gap
- **Area:** frontend
- **Status:** done
- **Dependencies:** none

---

## Problem
The authenticated header already exposed Profile, Achievements, and Settings through the user dropdown, but free-tier users had no visible pricing shortcut in the main navigation. The only way to reach `/pricing` was by knowing the URL or finding it elsewhere in the app.

---

## Why This Matters
This is a small monetization UX refinement: free users should have a visible, low-friction path to upgrade without adding a banner or cluttering the dropdown.

---

## Evidence
- `frontend/src/components/layout/header.tsx` already handled authenticated navigation and the user dropdown
- `frontend/src/hooks/use-subscription.ts` already exposed `isFree` and loading helpers through `useSubscriptionStatus()`
- no visible upgrade/pricing link existed in the authenticated header before this change

---

## Scope
1. Add a small visible upgrade CTA in the desktop header for authenticated free-tier users
2. Add a matching upgrade entry in the mobile menu
3. Hide both when the user is PRO/PREMIUM or unauthenticated
4. Avoid any flash while subscription status is still loading

---

## Out of Scope
- Navigation redesign
- Adding more items to the user dropdown
- Subscription page or checkout changes

---

## Implementation Notes
- Used `useSubscriptionStatus()` in `header.tsx` to determine `isFree` and `subscriptionLoading`.
- Desktop behavior:
  - shows a small `Upgrade` button with `Sparkles` icon
  - visible only for authenticated free-tier users
  - links to `/pricing`
- Mobile behavior:
  - adds an `Upgrade to Pro` item in the mobile menu
  - also visible only for authenticated free-tier users
  - closes the mobile menu on click
- Guarded both with `!subscriptionLoading` so PRO users do not see a brief flash of the CTA while subscription state is loading.
- No change was made for:
  - PRO/PREMIUM users
  - unauthenticated users
  - the existing dropdown links

---

## Acceptance Criteria
- [x] Free-tier authenticated users see an `Upgrade` button in the desktop header
- [x] PRO and PREMIUM users do not see the upgrade button
- [x] Unauthenticated users do not see the upgrade button
- [x] Upgrade button links to `/pricing`
- [x] Mobile menu also shows an upgrade option for free users

---

## Testing Requirements
- **Automated validation run:**
  - targeted ESLint on `header.tsx`
  - `frontend` production build
- **Manual QA recommended:**
  1. Login as free user and verify the desktop header shows `Upgrade`
  2. Login as PRO user and verify no upgrade CTA appears
  3. Check mobile viewport and verify `Upgrade to Pro` appears only for free users

---

## Affected Areas
- `frontend/src/components/layout/header.tsx`

---

## Risks / Edge Cases
- Manual browser QA is still needed to verify subscription-loading timing in a real session.
- The existing Next.js warning about `middleware.ts` being deprecated in favor of `proxy` remains unrelated to this ticket.

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/components/layout/header.tsx`
- `docs/tickets/TICKET-018-navbar-upgrade-cta.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/components/layout/header.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Manual browser QA was not run in this terminal session.
