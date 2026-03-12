# Add Zod Validation to Battle Gateway WebSocket Message Bodies

## Metadata
- **Ticket ID:** TICKET-026
- **Priority:** P3
- **Type:** bug
- **Area:** backend
- **Status:** open
- **Dependencies:** none

---

## Problem
The battle gateway (`battle.gateway.ts`) receives WebSocket message bodies via `@MessageBody()` without any schema validation. A malformed payload (e.g., missing required fields, wrong types) will either cause a runtime error deep in the service logic or silently produce wrong game state.

Example: `join_lobby` event expects `{ lobbyId?: string, difficulty?: string }`. If a client sends `{ lobbyId: 12345 }` (number instead of string), the service may crash or produce a TypeError.

---

## Why This Matters
WebSocket endpoints are as exposed as REST endpoints. Without validation, the server is vulnerable to:
- Crashes from unexpected payload shapes
- Invalid game state from malformed data
- Potential DoS via carefully crafted payloads that trigger expensive operations

---

## Evidence
- `backend/src/modules/battle/battle.gateway.ts` — `@MessageBody()` used with no pipes or validation schemas
- NestJS supports `ZodValidationPipe` via `nestjs-zod` (already installed: `nestjs-zod ^5.1.1` in `backend/package.json`)

---

## Scope

### 1. Define Zod schemas for each incoming WebSocket event

Create `backend/src/modules/battle/dto/battle-ws.schemas.ts`:

```typescript
import { z } from 'zod';

export const joinLobbySchema = z.object({
  lobbyId: z.string().uuid().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER']).optional(),
});

export const playerReadySchema = z.object({
  isReady: z.boolean(),
});

export const progressUpdateSchema = z.object({
  progress: z.number().min(0).max(100),
  currentInput: z.string().max(500).optional(),
});

export const submitSolutionSchema = z.object({
  solution: z.string().min(1).max(1000),
  timeElapsed: z.number().min(0),
  hintsUsed: z.number().min(0).max(3),
});
```

### 2. Apply validation in gateway handlers

Using `ZodValidationPipe` from `nestjs-zod`:
```typescript
@SubscribeMessage('join_lobby')
async handleJoinLobby(
  @ConnectedSocket() client: Socket,
  @MessageBody(new ZodValidationPipe(joinLobbySchema)) data: JoinLobbyDto,
) {
  // data is guaranteed to match schema
}
```

Repeat for each `@SubscribeMessage` handler.

### 3. Handle validation errors gracefully
When validation fails, emit a `battle_error` event back to the client (rather than crashing):
```typescript
// In a WS exception filter or within the handler:
client.emit('battle_error', { message: 'Invalid message format' });
```

---

## Out of Scope
- Changing battle game logic
- Adding rate limiting to WS events

---

## Implementation Notes
- `nestjs-zod` is already installed — use `ZodValidationPipe` directly
- NestJS WS exception handling: use `@UseFilters()` with a custom `WsExceptionFilter` to catch validation errors and emit them as `battle_error` events rather than disconnecting the socket
- Type the `data` parameter using the inferred Zod type: `z.infer<typeof joinLobbySchema>`

---

## Acceptance Criteria
- [ ] `join_lobby` with invalid `difficulty` value emits `battle_error` instead of crashing
- [ ] `submit_solution` with missing `solution` field emits `battle_error`
- [ ] `progress_update` with `progress: 150` (out of range) emits `battle_error`
- [ ] Valid messages continue to work correctly
- [ ] Server does not throw unhandled exceptions for any malformed WS message

---

## Testing Requirements
- **Unit test `battle.gateway.ts`:** Send malformed payloads — verify `battle_error` emitted, no exception thrown
- **Manual QA:** Use a WebSocket client (e.g., Postman or wscat) to send malformed messages — verify error response

---

## Affected Areas
- `backend/src/modules/battle/battle.gateway.ts`
- New: `backend/src/modules/battle/dto/battle-ws.schemas.ts`

---

## Risks / Edge Cases
- If `ZodValidationPipe` throws a HTTP exception class for WS context, it may not be automatically converted to a WS error — test this and add an explicit filter if needed

---

## Open Questions
None.
