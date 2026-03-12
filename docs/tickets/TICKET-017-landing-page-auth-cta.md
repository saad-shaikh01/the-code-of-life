# Show Auth-Conditional CTAs on Landing Page for Logged-In Users

## Metadata
- **Ticket ID:** TICKET-017
- **Priority:** P2
- **Type:** bug
- **Area:** frontend
- **Status:** open
- **Dependencies:** TICKET-002 (auth hydration must be complete first)

---

## Problem
The landing page (`page.tsx:69-74`) always shows "Sign In" and "Get Started" buttons, regardless of whether the user is already logged in. A logged-in user opening the landing page in a new tab sees login CTAs — as if they don't have an account — instead of being directed to their dashboard.

This is closely related to (but distinct from) TICKET-002. TICKET-002 fixes the underlying auth hydration so that `isAuthenticated` is reliable on page load. This ticket uses that reliable state to conditionally render the correct CTA.

**Do not implement this ticket until TICKET-002 is merged**, because without auth hydration, the CTA would flash "Sign In" and then switch to "Go to Dashboard" — worse UX than the current state.

---

## Why This Matters
Reported in `issues.md` line 1. A logged-in user clicking "Sign In" will be sent to the login page unnecessarily. The landing page should serve as a re-entry point for returning users — prominently directing them to continue playing.

---

## Evidence
- `frontend/src/app/page.tsx:69-74` — hardcoded Sign In + Get Started links, no auth check
- `issues.md` line 1: "landing page par phr b signin or register wale buttons display ho rahe ha"
- `frontend/src/stores/auth.store.ts` — `isAuthenticated` and `user` are available

---

## Scope

Make `page.tsx` a client component (add `"use client"` directive) and conditionally render nav CTAs:

```tsx
"use client";

import { useAuthStore } from "@/stores";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    // ...existing layout...
    <nav>
      {/* Logo */}
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="w-24 h-9 bg-white/10 rounded animate-pulse" />
        ) : isAuthenticated ? (
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

Also update any other instances on the landing page where "Sign In" or "Get Started" appear as CTAs (e.g., in the hero section) to use the same conditional logic.

---

## Out of Scope
- Redesigning the landing page
- Navbar changes for authenticated users inside `/(main)/` (that's the header component)
- Landing page content/copy changes

---

## Implementation Notes
- Converting `page.tsx` to `"use client"` means it no longer benefits from server-side rendering for SEO. For a game landing page this is acceptable; if SEO is important in the future, consider splitting the auth-conditional nav into a separate client component and keeping the rest of the page as server-rendered.
- The `isLoading` state from `useAuthStore` should be `true` while `AuthInitializer` (from TICKET-002) runs `refreshUser()`. Show a skeleton/pulse in the CTA area during this window.
- After TICKET-002 is done, `isLoading` transitions from `true` → `false` within one API round-trip. The flash will be minimal (skeleton → correct button).

---

## Acceptance Criteria
- [ ] Logged-in user opening `/` sees "Go to Dashboard" button (not Sign In / Get Started)
- [ ] Logged-out user opening `/` sees Sign In + Get Started buttons
- [ ] During auth check (loading state), CTA area shows a skeleton/pulse placeholder (no flash)
- [ ] "Go to Dashboard" links to `/dashboard` and works correctly

---

## Testing Requirements
- **Manual QA:**
  1. Log in → open `/` in a new tab → verify "Go to Dashboard" shown
  2. Log out → open `/` → verify Sign In / Get Started shown
  3. Observe loading state briefly — verify no jarring flash
- **Regression:** Existing landing page sections (hero, features, pricing preview) must not be affected

---

## Affected Areas
- `frontend/src/app/page.tsx`

---

## Risks / Edge Cases
- If TICKET-002 is not done first, the `isAuthenticated` state will always start as `false` (from SSR), causing the wrong buttons to render initially — hence the dependency
- Adding `"use client"` to `page.tsx` may affect any Metadata exports — move them to a separate `layout.tsx` or keep them as static exports

---

## Open Questions
None after TICKET-002 is complete.
