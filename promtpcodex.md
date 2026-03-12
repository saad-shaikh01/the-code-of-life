You are a Senior Technical Writer and QA Architect working on the monorepo at:
  C:\Users\Saad shaikh\Desktop\portfolio\the-code-of-life

  YOUR ONLY JOB IN THIS TASK: Create the complete ticket backlog documentation in `docs/tickets/`.
  Do NOT modify any application code. Do NOT skip any ticket. Do NOT create placeholders.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 0 — READ THESE FILES FIRST (mandatory, in order)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. C:\Users\Saad shaikh\.claude\plans\cuddly-moseying-nest.md   ← master plan
  2. issues.md
  3. PROJECT_OVERVIEW.md
  4. CURRENT_STATUS.md
  5. backend_issues.md
  6. FRONTEND_STATUS.md / BACKEND_STATUS.md
  Only after reading all six, proceed to Step 1.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1 — CREATE THE DIRECTORY STRUCTURE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Create the following files. Every file must be created before moving to Step 2.
  - docs/tickets/README.md
  - docs/tickets/_audit-checklist.md
  - docs/tickets/_ticket-template.md
  - TICKET-001 through TICKET-027 (filenames exact as listed in plan)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2 — REQUIRED CONTENT RULES (apply to EVERY ticket)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Every ticket file MUST contain ALL of the following sections.
  Missing any section = incomplete ticket. Do not submit until every section is present.

  # [Title]
  ## Metadata
  - Ticket ID: TICKET-XXX
  - Priority: P0 | P1 | P2 | P3
  - Type: bug | feature-gap | mismatch | refactor | testing | product-definition | tech-debt
  - Area: frontend | backend | shared | database | testing | multi-area
  - Status: open
  - Dependencies: [list ticket IDs or "none"]

  ## Problem
  ## Why This Matters
  ## Evidence
  (list exact file paths, line numbers where possible, quote short code excerpts)
  ## Scope
  ## Out of Scope
  ## Implementation Notes
  (technical direction, constraints, existing patterns to reuse)
  ## Acceptance Criteria
  (checklist format)
  ## Testing Requirements
  ## Affected Areas
  (exact file/module paths)
  ## Risks / Edge Cases
  ## Open Questions
  (only genuine product ambiguities)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 3 — README.md REQUIRED SECTIONS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  docs/tickets/README.md must contain:
  1. Audit Summary (2-3 paragraphs)
  2. Feature-by-Feature Gap Matrix (table: Feature | Status | Tickets)
  3. Ticket Index Table (ID | Title | Priority | Type | Dependencies)
  4. Recommended Implementation Order (phases, with reasoning)
  5. Cross-Cutting Risks
  6. Assumptions and Contradictions Found
  7. Section: "What I Intentionally Did Not Ticket" (from plan)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 4 — AUDIT CHECKLIST RULES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  docs/tickets/_audit-checklist.md must list EVERY feature/flow and mark each as:
  - ✅ aligned
  - ⚠️ partially implemented
  - 🔴 broken
  - ❌ missing
  - ❓ unclear/spec-needed

  Minimum features to cover (do not omit any):
  Landing page, Auth (login/register/session), Route guards, Daily puzzle + paywall,
  Story mode, Challenge mode, Puzzle solver, Decoder UI, Battle/multiplayer,
  Progress tracking, Streak logic, Achievements, Leaderboards, Billing/subscription,
  Profile, Settings, Admin controls, Shared cipher/schemas, Prisma schema + seed data,
  Error/loading/empty states, Frontend tests, Backend tests

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXECUTION RULES — NON-NEGOTIABLE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Complete TICKET-001 fully before starting TICKET-002. Do not batch.
  - Each ticket must reference actual file paths from the codebase (read files if needed).
  - Do not write "TBD", "TODO", or vague placeholders in any ticket.
  - If a ticket depends on reading a source file for accuracy, READ THAT FILE before writing.
  - After creating all 27 tickets, verify: every ticket in the plan index has a corresponding file.
  - The plan file (cuddly-moseying-nest.md) is your source of truth for ticket scope and priority.
  - If anything in the plan contradicts the actual code, the actual code wins — note the discrepancy in the ticket's Evidence section.        

  Definition of done for this task:
  ✅ docs/tickets/ directory exists
  ✅ README.md + _audit-checklist.md + _ticket-template.md created
  ✅ All 27 TICKET-XXX files created with complete sections
  ✅ No ticket has a missing section
  ✅ No ticket references a file without verifying it exists in the codebase
