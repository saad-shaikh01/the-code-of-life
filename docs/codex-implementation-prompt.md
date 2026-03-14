# Codex Implementation Prompt

Copy-paste the block below into Codex.

```text
You are the implementation agent for the monorepo at `c:\Users\Saad shaikh\Desktop\portfolio\the-code-of-life`.

Your job is to implement the existing backlog in `docs/tickets/` exactly and completely. Do not regenerate the plan. Do not re-audit the project from scratch unless a ticket explicitly requires verification. Follow the backlog as the source of truth.

Core rules:
- Do not skip any acceptance criteria, dependency, or testing requirement from the ticket files.
- Do not silently narrow scope.
- Do not mark work complete unless code changes, validation, and ticket updates are all done.
- Do not batch unrelated tickets together just to move faster.
- Work ticket-by-ticket in the order defined by `docs/tickets/README.md`, unless a ticket explicitly depends on another unfinished ticket.
- If a ticket is blocked by missing product clarification or a real repo contradiction, stop and explain the blocker clearly.

Backlog files to use:
- `docs/tickets/README.md`
- `docs/tickets/_audit-checklist.md`
- `docs/tickets/_ticket-template.md`
- `docs/tickets/TICKET-001-cipher-system-rewrite.md` through `docs/tickets/TICKET-027-email-verification-password-reset.md`

Execution mode:
- Start with `TICKET-001`.
- Before implementing a ticket, read:
  1. the ticket file
  2. `README.md` for ordering/context
  3. any dependency ticket(s)
  4. the relevant source files named in the ticket
- Implement only one primary ticket at a time.
- Finish the current ticket end-to-end before starting the next one.

Definition of done for each ticket:
1. All scoped code changes are implemented.
2. Relevant tests are added or updated.
3. Relevant validation commands are run.
4. Manual QA notes are recorded when automated coverage is not enough.
5. The ticket file is updated with:
   - Status: done
   - Implementation notes
   - Files changed
   - Validation performed
   - Follow-up notes if any remain
6. `docs/tickets/README.md` is updated to reflect ticket status/progress.

Testing and validation rules:
- Backend tickets:
  - run relevant backend unit tests
  - run `npm run build` in `backend` when backend code changes
  - run `npm run test` in `backend` when business logic changes
  - run targeted `npm run test -- <spec>` where appropriate
- Frontend tickets:
  - run `npm run build` in `frontend`
  - run `npm run lint` in `frontend`
  - if frontend automated tests exist for the touched area, run them
  - if frontend automated tests do not yet exist, record manual QA scenarios explicitly
- Shared/schema/database tickets:
  - run relevant backend tests and builds
  - run Prisma generate/migration steps when required
  - verify API/frontend contract impact
- Cross-cutting tickets:
  - run the smallest complete set of commands needed to prove the change works

Current repo command baseline:
- Root: `npm run build`, `npm run lint`, `npm run test`
- Frontend: `npm run build`, `npm run lint`
- Backend: `npm run build`, `npm run test`, `npm run test:cov`, `npm run test:e2e`

Important testing policy:
- The existence of separate testing tickets does NOT mean feature tickets can ship without testing.
- Every implemented ticket must include validation now.
- `TICKET-023` and `TICKET-024` strengthen testing infrastructure and coverage, but they do not replace ticket-level validation.
- If you touch frontend before `TICKET-023` is done, use build + lint + documented manual QA.
- If you touch backend logic, add or update automated tests immediately where practical.

Implementation discipline:
- Read the ticket carefully and follow its dependencies.
- Preserve unrelated existing code and user changes.
- Use the existing repo patterns and architecture.
- Keep changes minimal but complete.
- Prefer fixing root causes over superficial UI patches.
- When a ticket mentions "verify first, then fix if confirmed", do that explicitly and document the result.

Progress reporting format after each ticket:
- Ticket completed:
- Summary of what changed:
- Files changed:
- Tests/validation run:
- Remaining risks:
- Next recommended ticket:

Failure handling:
- If a command fails because of environment/setup/network issues, report the exact blocker and continue with all local work still possible.
- If you discover the ticket is inaccurate, do not ignore it. Update the ticket with corrected notes and explain the adjustment.
- If implementing one ticket reveals a missing prerequisite not captured in the backlog, add a concise note to the current ticket and `README.md`, then stop and ask before inventing a new large scope.

Strict no-skip rule:
- Do not say "done" if acceptance criteria are partially complete.
- Do not skip tests because separate testing tickets exist.
- Do not move to the next ticket while known failures from the current ticket remain unresolved.
- Do not skip documentation updates in the ticket files.

Start now with:
1. Read `docs/tickets/README.md`
2. Read `docs/tickets/TICKET-001-cipher-system-rewrite.md`
3. Inspect the referenced source files
4. Implement `TICKET-001` fully
5. Run validation
6. Update the ticket and README
7. Summarize results
```
