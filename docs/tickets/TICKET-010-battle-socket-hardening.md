# Harden Battle WebSocket: Heartbeat, Reconnection, Null Guards, Lobby UX

## Metadata
- **Ticket ID:** TICKET-010
- **Priority:** P1
- **Type:** bug
- **Area:** frontend
- **Status:** done
- **Dependencies:** TICKET-003 (user identification fix should be done first)

---

## Problem
Battle mode had multiple reliability and UX gaps:

1. No application-level heartbeat to detect stale connections
2. No reconnect state or room rejoin flow after a network drop
3. `opponentProgress` could be `null` before the opponent sent updates
4. Lobby waiting state was weak and easy to confuse with a broken UI
5. The forfeit button executed immediately without confirmation

---

## Why This Matters
Battle mode is a real-time multiplayer feature. A stale socket, a missing null guard, or a silent reconnect failure can freeze or crash the whole battle screen and leave players with no clear recovery path.

---

## Evidence
- `frontend/src/hooks/useBattleSocket.ts` had no heartbeat, reconnect state, or room rejoin logic
- `frontend/src/app/(main)/battle/page.tsx` directly rendered opponent progress with no meaningful waiting-state fallback
- `backend/src/modules/battle/battle.gateway.ts` had no app-level `ping` / `pong` handler for the client heartbeat

---

## Scope
1. Add heartbeat / stale-connection detection in the battle socket hook
2. Add bounded reconnect handling and room rejoin behavior
3. Null-guard all opponent progress rendering
4. Improve lobby waiting UX and disable readiness until both players are present
5. Add a forfeit confirmation dialog
6. Surface reconnecting and reconnect-failed UI states

---

## Out of Scope
- Battle scoring logic changes
- Matchmaking redesign
- WebSocket payload schema validation (`TICKET-026`)

---

## Implementation Notes
- `useBattleSocket()` now exposes:
  - `connectionState`
  - `reconnectAttempt`
  - `retryConnection()`
- The hook now stores the last `join_lobby` payload and re-emits it after reconnect so the player rejoins the battle room automatically
- Added an app-level heartbeat:
  - emits `ping` every 25 seconds
  - expects `pong` within 5 seconds
  - triggers one manual reconnect cycle if the connection goes stale
- Socket.IO client reconnect settings are now explicit:
  - `reconnection: true`
  - `reconnectionAttempts: 5`
  - `reconnectionDelay: 2000`
- `BattleGateway` now responds to `ping` with `pong`
- The battle page now:
  - guards all opponent progress access with null-safe fallbacks
  - shows `Waiting...` / `0` placeholders before opponent updates arrive
  - shows a reconnecting banner while reconnect attempts are in progress
  - shows a connection-failed error card with retry and return-to-lobby actions after reconnect failure
  - shows a clear lobby waiting panel when only one player is present
  - keeps the Ready button disabled until both players are in the lobby
  - requires confirmation before forfeiting

---

## Acceptance Criteria
- [x] No crash when `opponentProgress` is null (before opponent sends any updates)
- [x] "Waiting for opponent" message shown when lobby has only 1 player
- [x] Disconnecting and reconnecting within 5 attempts shows a reconnecting banner
- [x] After 5 failed reconnection attempts, shows a "Connection failed" error state with retry option
- [x] Forfeit button shows a confirmation dialog before executing
- [x] `useBattleSocket` exposes `connectionState` for UI consumption

---

## Testing Requirements
- **Manual QA scenarios to run:**
  1. Join a battle lobby alone and verify the waiting message and disabled Ready button
  2. Start a battle, briefly drop the network, and verify the reconnecting banner appears
  3. Keep the network down through all retries and verify the connection-failed card appears with retry / return actions
  4. Open a live battle before any opponent progress event and verify the page renders without crashing
  5. Click `Forfeit` and verify the confirmation dialog appears before leaving the battle

---

## Affected Areas
- `frontend/src/hooks/useBattleSocket.ts`
- `frontend/src/app/(main)/battle/page.tsx`
- `backend/src/modules/battle/battle.gateway.ts`

---

## Risks / Edge Cases
- Rejoining an in-progress match still depends on the backend lobby still existing in memory; the client now rejoins the room, but long disconnects can still lose the session if the lobby disappears
- The reconnect banner and retry UI are frontend-only recovery states; they do not change battle scoring or server-side winner resolution

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/hooks/useBattleSocket.ts`
- `frontend/src/app/(main)/battle/page.tsx`
- `backend/src/modules/battle/battle.gateway.ts`
- `docs/tickets/TICKET-010-battle-socket-hardening.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/hooks/useBattleSocket.ts" "src/app/(main)/battle/page.tsx"`
- `backend`: `npx eslint -- "src/modules/battle/battle.gateway.ts"`
- `backend`: `npm run build`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Browser manual QA was not executed in this terminal session; the battle reconnect and solo-lobby scenarios above remain the required follow-up checks.
