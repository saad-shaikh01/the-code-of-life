# Add Admin Role and Protect Content Management Endpoints

## Metadata
- **Ticket ID:** TICKET-013
- **Priority:** P2
- **Type:** bug
- **Area:** multi-area
- **Status:** open
- **Dependencies:** none

---

## Problem
Several sensitive API endpoints are accessible to any authenticated user, not just admins:
- `POST /api/puzzles` — any logged-in user can create puzzles
- `PATCH /api/puzzles/:id` — any logged-in user can edit any puzzle
- `DELETE /api/puzzles/:id` — any logged-in user can delete any puzzle
- `POST /api/achievements` — any logged-in user can create achievements
- `POST /api/achievements/seed` — **public endpoint** — anyone (even unauthenticated) can trigger achievement seeding

This means any user who discovers the API can corrupt the game database: delete all puzzles, overwrite achievement criteria, or spam-seed achievements.

---

## Why This Matters
Data integrity of the puzzle and achievement content is critical. A single API call from any authenticated user can destroy all puzzle content. The public `/achievements/seed` endpoint is especially dangerous — it requires no authentication at all.

---

## Evidence
- `backend/src/modules/puzzles/puzzles.controller.ts` — `@Post()`, `@Patch(':id')`, `@Delete(':id')` only require `JwtAuthGuard` (any authenticated user)
- `backend/src/modules/achievements/achievements.controller.ts` — `@Post('seed')` has no guard (public), `@Post()` only requires `JwtAuthGuard`
- `backend/prisma/schema.prisma` — `User` model has no `role` field

---

## Scope

### 1. Add `Role` enum and field to `User` in Prisma schema
```prisma
enum Role {
  USER
  ADMIN
}

model User {
  // ...existing fields...
  role  Role  @default(USER)
}
```
Run: `npx prisma migrate dev --name add-user-role`

### 2. Create `@Roles()` decorator
New file: `backend/src/common/decorators/roles.decorator.ts`
```typescript
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### 3. Create `RolesGuard`
New file: `backend/src/common/guards/roles.guard.ts`
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

Register `RolesGuard` globally in `AppModule` (after `JwtAuthGuard`).

### 4. Apply to sensitive endpoints
```typescript
// puzzles.controller.ts
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async createPuzzle(...) {}

@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async updatePuzzle(...) {}

@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async deletePuzzle(...) {}

// achievements.controller.ts
@Post('seed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async seedAchievements(...) {}

@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async createAchievement(...) {}
```

### 5. Update JWT payload and strategy
The JWT token payload should include the user's `role`. Update `auth.service.ts` where tokens are generated to include `role: user.role`. Update `jwt.strategy.ts` to include `role` in the returned user object.

### 6. Seed an admin user
In `prisma/seed.ts`, add a seeded admin account:
```typescript
await prisma.user.upsert({
  where: { email: 'admin@codeoflife.dev' },
  update: {},
  create: {
    email: 'admin@codeoflife.dev',
    username: 'admin',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12),
    role: 'ADMIN',
  },
});
```

---

## Out of Scope
- Frontend admin panel (out of scope for this game version)
- Role-based UI changes
- Permission levels beyond USER and ADMIN

---

## Implementation Notes
- The `JwtStrategy` must include `role` in the payload so `RolesGuard` can read it from `request.user`
- `GET /api/puzzles` (list), `GET /api/puzzles/:id` (read) remain public — only mutations are protected
- The `@Public()` decorator should override `RolesGuard` the same way it overrides `JwtAuthGuard`

---

## Acceptance Criteria
- [ ] `POST /api/puzzles` returns 403 for non-admin authenticated users
- [ ] `PATCH /api/puzzles/:id` returns 403 for non-admin authenticated users
- [ ] `DELETE /api/puzzles/:id` returns 403 for non-admin authenticated users
- [ ] `POST /api/achievements/seed` returns 403 for unauthenticated requests
- [ ] `POST /api/achievements/seed` returns 403 for non-admin authenticated users
- [ ] Admin user seeded in `seed.ts` can successfully call all protected endpoints
- [ ] Regular user cannot call any mutation endpoints

---

## Testing Requirements
- **Unit test `RolesGuard`:** Test with ADMIN role (passes), USER role (blocked), no role in token (blocked)
- **Integration test:** Register a regular user → attempt `POST /api/puzzles` → verify 403
- **Integration test:** Use admin JWT → `POST /api/puzzles` → verify 201

---

## Affected Areas
- `backend/prisma/schema.prisma`
- `backend/src/modules/auth/auth.service.ts` (add role to JWT payload)
- `backend/src/modules/auth/jwt.strategy.ts` (include role in user object)
- New: `backend/src/common/decorators/roles.decorator.ts`
- New: `backend/src/common/guards/roles.guard.ts`
- `backend/src/modules/puzzles/puzzles.controller.ts`
- `backend/src/modules/achievements/achievements.controller.ts`
- `backend/prisma/seed.ts`
- `backend/src/app.module.ts` (register RolesGuard globally)

---

## Risks / Edge Cases
- Existing JWT tokens in the wild won't have the `role` field — these tokens will fail `RolesGuard` because `user.role` will be `undefined`. Since this is a dev environment with no production users, this is acceptable. Add `role: user.role ?? Role.USER` as fallback in the JWT strategy.
- The admin password should come from an env var, not be hardcoded

---

## Open Questions
None.
