# Claude Ticket Generation Prompt

Copy-paste the block below into Claude.

```text
You are acting as a senior technical auditor and backlog writer for the monorepo at `c:\Users\Saad shaikh\Desktop\portfolio\the-code-of-life`.

Your job in this task is NOT to implement code. Your job is to audit the repo deeply and create implementation-ready tickets inside `docs/tickets/` so future agents can execute them without missing critical details.

Important context:
- The repo owner says `issues.md` only lists some common issues they noticed. It is NOT exhaustive.
- Many features are incomplete, inconsistent, mismatched, or not aligned with the original plan.
- Some status docs claim things are "complete" or "tested", but you must not trust those claims blindly. Verify against the actual codebase.
- You must think in terms of complete end-to-end feature flows, not isolated bugs.
- If one visible bug implies deeper flow problems, you must capture all related gaps in the tickets.
- The output must be detailed enough that another coding agent can later implement the tickets without guessing what was intended.

Primary goal:
1. Audit the repo against the intended product plan, current docs, and actual code.
2. Identify missing, broken, mismatched, incomplete, or under-specified behavior across all major features.
3. Create a structured backlog in `docs/tickets/` with atomic, implementation-ready tickets.
4. Make sure tickets include acceptance criteria, technical scope, affected files/areas, dependencies, and testing requirements.

Repository sources you must review first:
- `issues.md`
- `PROJECT_OVERVIEW.md`
- `CURRENT_STATUS.md`
- `FRONTEND_STATUS.md`
- `BACKEND_STATUS.md`
- `FRONTEND_TASKS.md`
- `TASK.md`
- `TASK2.md`
- `TESTING_STATUS.md`
- `backend_issues.md`
- `package.json`
- `frontend/package.json`
- `backend/package.json`
- `frontend/src/**/*`
- `backend/src/**/*`
- `backend/prisma/**/*`
- `packages/shared/**/*`

Available repo commands and constraints:
- Root: `npm run build`, `npm run lint`, `npm run test`
- Frontend: `npm run build`, `npm run lint`
- Backend: `npm run build`, `npm run test`, `npm run test:cov`, `npm run test:e2e`
- Frontend does not appear to have a dedicated automated test runner configured right now, so if frontend verification is weak, create explicit tickets for test strategy and tooling instead of pretending coverage already exists.

Treat the following as seed examples from the repo owner, not the full issue list:
- Auth/session state mismatch: a logged-in user opening a new tab at `/` still sees Sign In/Register on the landing page, but `/dashboard` knows they are authenticated.
- Landing/navbar CTA behavior seems wrong or not useful.
- Streak logic expectations are unclear and may not match product intent.
- Daily puzzle is a PRO feature, but dashboard messaging/card behavior is inconsistent.
- Battle/multiplayer has many bugs.

You must perform the audit with these rules:
- Do not assume status docs are accurate.
- Do not create vague umbrella tickets like "fix frontend issues".
- Do not skip a feature because it "mostly works".
- Do not only restate symptoms from `issues.md`; find root causes and adjacent gaps.
- Split large problem areas into atomic tickets with clear dependency ordering.
- If functionality is claimed in docs but missing or partial in code, write tickets for the gap.
- If requirements are unclear, create a dedicated product-definition or rule-clarification ticket instead of guessing.
- If testing is missing or unreliable, create explicit testing tickets.
- When a feature cannot be validated confidently with current tooling, create enabling tickets for the missing tooling or test infrastructure.

Audit dimensions you must cover:
- Product-plan alignment
- UX flow completeness
- Frontend/backend contract mismatches
- Auth persistence and route protection
- Subscription/paywall behavior
- Puzzle gameplay completeness
- Decoder correctness vs official concept/docs
- Data model and seed accuracy
- Progress tracking and streak rules
- Achievements and leaderboards behavior
- Daily puzzle flow
- Story/challenge mode progression
- Multiplayer/battle flow
- Landing page, dashboard, and navigation coherence
- Profile/settings completeness
- Error/loading/empty states
- Mobile responsiveness and accessibility gaps
- Test coverage realism
- Developer experience gaps that block reliable implementation/testing

Feature areas that must be audited explicitly:
- Landing page (`frontend/src/app/page.tsx`)
- Auth routes (`frontend/src/app/(auth)`)
- Main app routes (`frontend/src/app/(main)`)
- Layout/navigation components
- Puzzle module/components/hooks/stores
- Battle socket hook and backend battle module
- Billing/subscription frontend and backend
- Progress, users, achievements, leaderboards, puzzles, auth modules
- Shared schemas in `packages/shared`
- Prisma schema, migrations, and seed data

Deliverables you must create:

1. `docs/tickets/README.md`
This file must contain:
- A short audit summary
- A feature-by-feature gap matrix
- Ticket index table
- Recommended implementation order
- Cross-cutting risks
- Notes on assumptions and contradictions found in repo docs

2. `docs/tickets/TICKET-001-...md`, `docs/tickets/TICKET-002-...md`, etc.
Create as many tickets as needed for full coverage. Target atomic tickets, not giant epics. A reasonable result will likely be around 15-30 tickets, but use the number actually required by the repo state.

3. `docs/tickets/_audit-checklist.md`
This file must list every feature/flow you audited and mark whether it is:
- aligned
- partially implemented
- broken
- missing
- unclear/spec-needed

4. `docs/tickets/_ticket-template.md`
Create the template you used so future tickets stay consistent.

Ticket writing rules:
- Each ticket must represent one coherent unit of work.
- Each ticket must be independently understandable.
- Each ticket must include enough context for a future coding agent to execute it safely.
- If a problem spans frontend + backend + schema + tests, either:
  - keep it in one ticket only if it is still an atomic change set, or
  - split it into dependent tickets when the work is too broad.
- Use dependency references between tickets when needed.
- Prefer tickets that can be implemented and verified in a focused pass.

Each ticket file must contain this structure:

# Title

## Metadata
- Ticket ID:
- Priority: P0 | P1 | P2 | P3
- Type: bug | feature-gap | mismatch | refactor | testing | product-definition | tech-debt
- Area: frontend | backend | shared | database | testing | multi-area
- Status: open
- Dependencies:

## Problem
Describe the user-visible and technical problem clearly.

## Why This Matters
State user impact, product impact, and risk.

## Evidence
- Reference relevant files and routes
- Reference relevant docs that conflict or set expectations
- Mention specific mismatches discovered during audit

## Scope
List exactly what this ticket should cover.

## Out of Scope
List what this ticket must not include.

## Implementation Notes
Give enough technical direction that a future agent understands the likely change areas, constraints, and sequencing.

## Acceptance Criteria
Use a checklist of verifiable outcomes.

## Testing Requirements
Specify required validation, for example:
- unit tests
- integration tests
- e2e tests
- manual QA scenarios
- responsive checks
- regression checks

## Affected Areas
List likely files/modules/routes/services/schemas involved.

## Risks / Edge Cases
List known failure modes and edge cases.

## Open Questions
Only include unresolved questions that genuinely need product clarification.

Backlog quality bar:
- Tickets must be implementation-ready.
- Tickets must be specific enough to avoid future guesswork.
- Tickets must cover complete flows, not isolated screens.
- Tickets must include testing expectations.
- Tickets must reflect actual repo structure.
- Tickets must not rely on "trusting previous completion claims".

Special instructions for this repo:
- If auth state is inconsistent between landing page and protected routes, do not create only one tiny UI ticket. Audit session hydration, persisted auth state, route guards, landing CTA logic, and header/nav behavior together, then split into the right tickets.
- If daily puzzle/paywall behavior is inconsistent, audit backend authorization, frontend fetch behavior, dashboard messaging, `/daily` page UX, entitlement checks, and fallback states.
- If streak logic is ambiguous, create one ticket to define the exact product rule if needed, and separate implementation tickets only if appropriate.
- If battle mode is unstable, cover backend gateway/service behavior, socket auth, reconnection/disconnect handling, lobby lifecycle, frontend socket state, loading/error states, and test gaps.
- If the decoder/book logic is still mismatched anywhere, treat it as a critical area and create the necessary tickets across backend, frontend, shared types, seed data, and QA.
- If tests are claimed but not sufficient for confidence, create tickets that close the real testing gaps instead of repeating optimistic status docs.

Process you must follow:
1. Read the docs and inspect the actual source code.
2. Build your own internal feature inventory from the codebase.
3. Compare planned behavior vs implemented behavior vs observed issues.
4. Identify root causes, adjacent gaps, and missing tests.
5. Create `docs/tickets/README.md`, `_audit-checklist.md`, `_ticket-template.md`, and all ticket files.
6. Ensure every major feature area has been audited and accounted for, even if the outcome is "aligned".
7. In the README, include a short section called `What I intentionally did not ticket` for anything that is truly acceptable as-is.

Definition of done for this task:
- `docs/tickets/` exists
- backlog files are created
- tickets are atomic and implementation-ready
- each major feature flow has been audited
- contradictions between docs and code are surfaced
- missing tests are captured
- future implementation agents can pick up tickets without re-discovering requirements

Do not implement application code in this task. Only create the audit and ticket documentation.
```
