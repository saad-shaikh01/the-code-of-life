# Add Upgrade CTA to Header for Free-Tier Users

## Metadata
- **Ticket ID:** TICKET-018
- **Priority:** P3
- **Type:** feature-gap
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
The header (`header.tsx`) already shows Profile, Achievements, and Settings in the authenticated user's dropdown. However, there is no visible "Upgrade" or pricing shortcut for free-tier users in the nav or header. Free users must navigate to `/pricing` manually by knowing the URL — there is no persistent nudge in the navigation.

This is a UX refinement, not a missing feature. The navigation is functional; this ticket improves monetization discoverability.

---

## Why This Matters
`issues.md` line 3: "navbar ma jo buttons ha I don't think so k unki need ha yaha kuch or b display karwa saqte hein hum". For free users, a visible upgrade prompt in the header is a standard monetization pattern that reduces friction to conversion.

---

## Evidence
- `frontend/src/components/layout/header.tsx:120-127` — dropdown already has Profile, Achievements, Settings
- `frontend/src/hooks/use-subscription.ts` — `useSubscriptionStatus()` returns `isFree`, `isPro`, `isPremium`
- No "Upgrade" or pricing link exists anywhere in the main navigation

---

## Scope
In `header.tsx`, for authenticated free-tier users, add a small "Upgrade" badge/button in the header (desktop) and in the mobile menu:

```tsx
const { isFree, isLoading: subscriptionLoading } = useSubscriptionStatus();

// In header nav (desktop), before the user avatar dropdown:
{!subscriptionLoading && isFree && (
  <Link href="/pricing">
    <Button variant="primary" size="sm">
      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
      Upgrade
    </Button>
  </Link>
)}
```

For mobile: add an "Upgrade to PRO" item in the mobile nav menu, also conditional on `isFree`.

---

## Out of Scope
- Redesigning the navigation structure
- Adding more items to the dropdown (already has all needed links)
- Subscription page changes

---

## Implementation Notes
- Use `isFree && !subscriptionLoading` to avoid a flash of the upgrade button for PRO users while subscription loads
- Keep it subtle — a small button, not a banner
- Use the existing `Sparkles` icon from lucide-react (already imported in other components)
- The button should link to `/pricing`, not directly to checkout

---

## Acceptance Criteria
- [ ] Free-tier authenticated users see an "Upgrade" button in the desktop header
- [ ] PRO and PREMIUM users do NOT see the upgrade button
- [ ] Unauthenticated users do NOT see the upgrade button
- [ ] Upgrade button links to `/pricing`
- [ ] Mobile menu also shows upgrade option for free users

---

## Testing Requirements
- **Manual QA:**
  1. Login as free user → verify "Upgrade" button visible in header
  2. Login as PRO user → verify no upgrade button
  3. Check mobile viewport — verify upgrade option in mobile menu

---

## Affected Areas
- `frontend/src/components/layout/header.tsx`

---

## Risks / Edge Cases
- Brief flash during subscription status loading — prevent with `!subscriptionLoading` guard

---

## Open Questions
None.
