# Add Zod Validation to Battle Gateway WebSocket Message Bodies

## Metadata
- **Ticket ID:** TICKET-026
- **Priority:** P3
- **Type:** bug
- **Area:** backend
- **Status:** done
- **Dependencies:** none

---

## Problem
The battle gateway accepted raw `@MessageBody()` payloads for every Socket.IO event with no schema validation. Malformed bodies could reach the battle service layer, produce inconsistent match state, or throw runtime errors deep in the handler flow.

Example: `join_lobby` expects `{ lobbyId?: string, puzzleDifficulty?: BattleDifficulty }`. A payload like `{ lobbyId: 12345 }` previously bypassed validation and reached the service layer unchanged.

---

## Why This Matters
WebSocket endpoints need the same input hardening as REST endpoints. Without it, malformed messages can:
- Crash or destabilize battle state
- Produce invalid lobby or progress data
- Increase the blast radius of malicious or buggy clients

---

## Evidence
- `backend/src/modules/battle/battle.gateway.ts` originally accepted raw `@MessageBody()` values for `ping`, `join_lobby`, `leave_lobby`, `player_ready`, `progress_update`, and `submit_solution`
- `packages/shared/src/schemas/` did not include body-level schemas for those incoming gateway payloads

---

## Scope

### 1. Define Zod schemas for each incoming WebSocket event body

Create `packages/shared/src/schemas/battle.schema.ts` with schemas for the actual gateway payloads:

```typescript
import { z } from "zod";

export const battleDifficultySchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "MASTER",
]);

export const pingMessageSchema = z
  .object({
    timestamp: z.number().int().nonnegative().optional(),
  })
  .strict();

export const joinLobbyMessageSchema = z
  .object({
    lobbyId: z.string().min(1).optional(),
    puzzleDifficulty: battleDifficultySchema.optional(),
  })
  .strict();

export const leaveLobbyMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
  })
  .strict();

export const playerReadyMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
    isReady: z.boolean(),
  })
  .strict();

export const progressUpdateMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
    progress: z.number().min(0).max(100),
    correctCharacters: z.number().int().min(0),
    totalCharacters: z.number().int().min(0),
    hintsUsed: z.number().int().min(0).max(3),
  })
  .strict();

export const submitSolutionMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
    solution: z.string().min(1).max(5000),
    timeElapsed: z.number().int().min(0),
  })
  .strict();
```

### 2. Apply validation in gateway handlers

Validate inline at the top of each handler and stop on failure:

```typescript
@SubscribeMessage("join_lobby")
async handleJoinLobby(
  @ConnectedSocket() client: Socket,
  @MessageBody() payload: unknown,
) {
  const parsed = joinLobbyMessageSchema.safeParse(payload);
  if (!parsed.success) {
    client.emit("error", {
      message: "Invalid payload",
      errors: parsed.error.issues,
    });
    client.emit("battle_error", {
      code: "INVALID_PAYLOAD",
      message: "Invalid payload",
    });
    return;
  }

  const data = parsed.data;
  // continue with validated data
}
```

### 3. Handle validation errors gracefully

Do not throw from WebSocket handlers for malformed payloads. Emit a client-visible error and return:

```typescript
client.emit("error", {
  message: "Invalid payload",
  errors: issues,
});
client.emit("battle_error", {
  code: "INVALID_PAYLOAD",
  message: "Invalid payload",
});
```

---

## Out of Scope
- Changing battle game logic
- Adding rate limiting to WS events
- Reworking Socket.IO room persistence

---

## Implementation Notes
- Added `packages/shared/src/schemas/battle.schema.ts` for the actual incoming Socket.IO payload shapes:
  - `ping`
  - `join_lobby`
  - `leave_lobby`
  - `player_ready`
  - `progress_update`
  - `submit_solution`
- Exported the new schemas from `packages/shared/src/schemas/index.ts`, which is already re-exported by the shared package root.
- Implemented a shared `validatePayload()` helper inside `BattleGateway` and switched each handler to `@MessageBody() payload: unknown`.
- Invalid payloads now emit both:
  - `error` with `{ message: 'Invalid payload', errors: issues }`
  - `battle_error` with `{ code: 'INVALID_PAYLOAD', message: 'Invalid payload' }`
- No `WsValidationPipe` was added because this gateway did not already use Nest WebSocket pipes, and the backlog prompt explicitly preferred inline validation when no existing pipe pattern was present.
- Correction to the older audit draft:
  - the final schemas live in the shared package, not `backend/src/modules/battle/dto/`
  - the actual field is `puzzleDifficulty`, not `difficulty`

---

## Acceptance Criteria
- [x] `join_lobby` with invalid `difficulty` value emits `battle_error` instead of crashing
- [x] `submit_solution` with missing `solution` field emits `battle_error`
- [x] `progress_update` with `progress: 150` (out of range) emits `battle_error`
- [x] Valid messages continue to work correctly
- [x] Server does not throw unhandled exceptions for any malformed WS message

---

## Testing Requirements
- **Automated coverage added:**
  - invalid `join_lobby` payload emits validation errors and skips `battleService.joinLobby`
  - invalid `player_ready` payload emits validation errors and skips `battleService.setPlayerReady`
  - invalid `progress_update` payload emits validation errors and skips `battleService.updateProgress`
  - invalid `submit_solution` payload emits validation errors and skips `battleService.submitSolution`
- **Manual QA recommended:**
  1. Connect a WS client to `/battle` and send malformed `join_lobby`, `progress_update`, and `submit_solution` payloads
  2. Verify the server responds with `battle_error` instead of disconnecting or crashing
  3. Verify valid join, ready, progress, and submit flows still behave normally

---

## Affected Areas
- `packages/shared/src/schemas/battle.schema.ts`
- `packages/shared/src/schemas/index.ts`
- `backend/src/modules/battle/battle.gateway.ts`
- `backend/src/modules/battle/battle.gateway.spec.ts`

---

## Risks / Edge Cases
- This ticket only validates message shape. Battle state still depends on the existing in-memory room model and business rules in `BattleService`.
- The gateway currently emits both `error` and `battle_error` for invalid payloads to satisfy the backlog prompt and preserve the existing battle error contract.

---

## Open Questions
None.

---

## Files Changed
- `packages/shared/src/schemas/battle.schema.ts`
- `packages/shared/src/schemas/index.ts`
- `backend/src/modules/battle/battle.gateway.ts`
- `backend/src/modules/battle/battle.gateway.spec.ts`
- `docs/tickets/TICKET-026-websocket-input-validation.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `packages/shared`: `npm run build`
- `repo root`: `npx eslint -c backend/eslint.config.mjs "packages/shared/src/schemas/battle.schema.ts" "packages/shared/src/schemas/index.ts" "packages/shared/src/index.ts"`
- `backend`: `npx eslint -- "src/modules/battle/battle.gateway.ts" "src/modules/battle/battle.gateway.spec.ts"`
- `backend`: `npm run test -- battle.gateway.spec.ts --runInBand`
- `backend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- The targeted gateway spec still prints the existing mocked `BattleGateway` error logs from negative-path tests; the suite passes and no new unhandled exception path was introduced.
- `ts-jest` warns about compiling `packages/shared/dist/*.js` after the shared build because backend Jest still matches `.js` files with `ts-jest`. That warning did not block this ticket.
