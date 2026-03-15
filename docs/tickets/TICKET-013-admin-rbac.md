# Add Admin Role and Protect Content Management Endpoints

## Metadata
- **Ticket ID:** TICKET-013
- **Priority:** P2
- **Type:** bug
- **Area:** multi-area
- **Status:** done
- **Dependencies:** none

---

## Problem
Several sensitive API endpoints were accessible to any authenticated user, not just admins:
- `POST /api/puzzles` - any logged-in user could create puzzles
- `PATCH /api/puzzles/:id` - any logged-in user could edit any puzzle
- `DELETE /api/puzzles/:id` - any logged-in user could delete any puzzle
- `POST /api/achievements` - any logged-in user could create achievements
- `POST /api/achievements/seed` - the endpoint was publicly callable

This meant any user who discovered the API could corrupt core game content.

---

## Why This Matters
Puzzle and achievement content are shared game data. Mutation endpoints must be admin-only or a regular user can delete puzzles, overwrite achievement criteria, or spam content seeding.

---

## Evidence
- `backend/src/modules/puzzles/puzzles.controller.ts` exposed create/update/delete without admin role checks
- `backend/src/modules/achievements/achievements.controller.ts` exposed `POST /seed` publicly and `POST /` to any authenticated user
- `backend/prisma/schema.prisma` had no `role` field on `User`

---

## Scope
1. Add a Prisma `Role` enum and `User.role`
2. Add `@Roles()` metadata and a `RolesGuard`
3. Add role data to JWT generation and authenticated request user objects
4. Protect puzzle and achievement mutation endpoints with admin-only RBAC
5. Seed a default admin account for development

---

## Out of Scope
- Frontend admin UI
- Additional permission tiers beyond `USER` and `ADMIN`
- Role-based UX changes

---

## Implementation Notes
- Added `Role { USER, ADMIN }` to Prisma and `User.role @default(USER)`
- Generated and applied migration `20260314234328_add_user_role`
- Added `backend/src/common/decorators/roles.decorator.ts`
- Added `backend/src/common/guards/roles.guard.ts`
- `RolesGuard` supports `@Public()` and throws `ForbiddenException` when a required role is missing
- Updated `AuthService.generateTokens()` to include `role` in both access and refresh token payloads
- Updated `JwtStrategy` to select `role` from the database and return it on `request.user`
- Protected these endpoints with `@Roles(Role.ADMIN)`:
  - `POST /api/puzzles`
  - `PATCH /api/puzzles/:id`
  - `DELETE /api/puzzles/:id`
  - `POST /api/achievements`
  - `POST /api/achievements/seed`
- Used route-level `JwtAuthGuard` + `RolesGuard` on the protected handlers instead of a global `APP_GUARD` registration so guard order stays explicit and existing public routes remain unchanged
- Updated `prisma/seed.ts` to upsert `admin@codeoflife.dev` with `role=ADMIN` and password from `ADMIN_PASSWORD` or fallback `admin123`
- Correction to the original ticket wording:
  - unauthenticated admin-route access now returns `401`, not `403`, because `JwtAuthGuard` intentionally runs before `RolesGuard`

---

## Acceptance Criteria
- [x] `POST /api/puzzles` returns 403 for non-admin authenticated users
- [x] `PATCH /api/puzzles/:id` returns 403 for non-admin authenticated users
- [x] `DELETE /api/puzzles/:id` returns 403 for non-admin authenticated users
- [x] `POST /api/achievements/seed` rejects unauthenticated requests (`401` from `JwtAuthGuard` before role evaluation)
- [x] `POST /api/achievements/seed` returns 403 for non-admin authenticated users
- [x] Admin user seeded in `seed.ts` can be created/upserted successfully
- [x] Regular user cannot call the protected mutation endpoints

---

## Testing Requirements
- **Automated coverage added:**
  1. `RolesGuard` unit tests for ADMIN pass, USER blocked, missing role blocked, and public-route bypass
  2. Puzzle mutation HTTP tests for non-admin `403` and admin success
  3. Achievement mutation HTTP tests for unauthenticated `401`, non-admin `403`, and admin success

---

## Affected Areas
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260314234328_add_user_role/migration.sql`
- `backend/prisma/seed.ts`
- `backend/src/common/decorators/index.ts`
- `backend/src/common/decorators/roles.decorator.ts`
- `backend/src/common/guards/index.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/guards/roles.guard.spec.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `backend/src/modules/puzzles/puzzles.controller.ts`
- `backend/src/modules/puzzles/puzzles.controller.rbac.spec.ts`
- `backend/src/modules/achievements/achievements.controller.ts`
- `backend/src/modules/achievements/achievements.controller.rbac.spec.ts`

---

## Risks / Edge Cases
- Existing tokens issued before this change may not contain `role`, but `JwtStrategy` now reads the persisted user role from the database and falls back to `payload.role ?? Role.USER`
- The default admin seed password is intentionally development-only and should be overridden with `ADMIN_PASSWORD`

---

## Open Questions
None.

---

## Files Changed
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260314234328_add_user_role/migration.sql`
- `backend/prisma/seed.ts`
- `backend/src/common/decorators/index.ts`
- `backend/src/common/decorators/roles.decorator.ts`
- `backend/src/common/guards/index.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/guards/roles.guard.spec.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `backend/src/modules/puzzles/puzzles.controller.ts`
- `backend/src/modules/puzzles/puzzles.controller.rbac.spec.ts`
- `backend/src/modules/achievements/achievements.controller.ts`
- `backend/src/modules/achievements/achievements.controller.rbac.spec.ts`
- `docs/tickets/TICKET-013-admin-rbac.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npx prisma migrate dev --name add-user-role`
- `backend`: `npx eslint -- "src/common/decorators/roles.decorator.ts" "src/common/decorators/index.ts" "src/common/guards/index.ts" "src/common/guards/roles.guard.ts" "src/common/guards/roles.guard.spec.ts" "src/modules/auth/auth.service.ts" "src/modules/auth/jwt.strategy.ts" "src/modules/puzzles/puzzles.controller.ts" "src/modules/puzzles/puzzles.controller.rbac.spec.ts" "src/modules/achievements/achievements.controller.ts" "src/modules/achievements/achievements.controller.rbac.spec.ts" "prisma/seed.ts"`
- `backend`: `npm run test -- roles.guard.spec.ts puzzles.controller.rbac.spec.ts achievements.controller.rbac.spec.ts`
- `backend`: `npm run test`
- `backend`: `npm run build`
- `backend`: `npx prisma db seed`

---

## Follow-up Notes
- Completed: 2026-03-15.
- `npm run test` passes, but the existing battle gateway specs still emit expected mocked error logs and Jest reports a long-standing worker shutdown warning unrelated to this ticket.
