# Harden Battle WebSocket: Heartbeat, Reconnection, Null Guards, Lobby UX

## Metadata
- **Ticket ID:** TICKET-010
- **Priority:** P1
- **Type:** bug
- **Area:** frontend
- **Status:** open
- **Dependencies:** TICKET-003 (user identification fix should be done first)

---

## Problem
The battle mode WebSocket connection and lobby UI have multiple reliability and UX gaps:

1. **No heartbeat/ping-pong:** Socket.IO has built-in ping/pong, but no application-level heartbeat means stale connections go undetected. If a player's connection silently drops and their Socket.IO ping isn't caught, the lobby stays in a broken state.

2. **No reconnection logic:** If the network drops briefly (mobile switching from WiFi to 4G), the socket disconnects. There is no reconnect attempt or "reconnecting..." state shown to the user. The player loses their match with no recovery path.

3. **No null check on `opponentProgress`:** If the opponent hasn't sent any progress updates yet, `opponentProgress` is null/undefined. Any UI access like `opponentProgress.percentage` will throw and potentially crash the component.

4. **No "waiting for opponent" UX state:** After joining a lobby, if only one player is present, there's no clear "waiting for opponent to join..." message. The UI likely shows a broken or empty lobby state.

5. **No forfeit confirmation:** The forfeit button exists but fires immediately without a confirmation dialog. Accidental forfeits are likely.

---

## Why This Matters
Battle mode is a real-time multiplayer feature — any instability or crash here directly kills the competitive experience. A crashed component in a battle could freeze the entire game view. Missing UX states make the waiting period confusing.

---

## Evidence
- `frontend/src/hooks/useBattleSocket.ts` — no heartbeat, no reconnect logic
- `frontend/src/app/(main)/battle/page.tsx` — `opponentProgress` used without null check
- `issues.md` line 9: "battle mode ma multiplayer feature ma buht sare bugs ha"
- Socket.IO client `io()` options: no `reconnection` config explicitly set (defaults may handle basic reconnect, but no UI state for it)

---

## Scope

### 1. Null guards for `opponentProgress`
In `battle/page.tsx`, wherever `opponentProgress` is accessed:
```typescript
// Before:
const percentage = opponentProgress.percentage;

// After:
const percentage = opponentProgress?.percentage ?? 0;
```
Add optional chaining and nullish coalescing on all `opponentProgress` property accesses.

### 2. "Waiting for opponent" lobby state
When `lobby.players.length < 2`, show a waiting state:
```tsx
{lobby.players.length < 2 && (
  <div className="text-center py-12">
    <Spinner />
    <p>Waiting for an opponent to join...</p>
    <p className="text-muted-foreground">Difficulty: {selectedDifficulty}</p>
    <Button variant="ghost" onClick={handleLeaveLobby}>Cancel</Button>
  </div>
)}
```

### 3. Reconnection state and auto-reconnect
Configure socket with explicit reconnection options and show a reconnecting banner:
```typescript
// In useBattleSocket.ts
const socket = io(wsUrl, {
  auth: { token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```
Add state: `isReconnecting: boolean`. Set on `'reconnect_attempt'` event, clear on `'reconnect'`.
In battle page UI, show a toast or banner: "Connection lost. Reconnecting... (attempt X/5)".

### 4. Forfeit confirmation dialog
Wrap the forfeit action in a confirmation dialog:
```tsx
<Dialog open={showForfeitDialog} onOpenChange={setShowForfeitDialog}>
  <DialogContent>
    <DialogTitle>Forfeit match?</DialogTitle>
    <DialogDescription>Your opponent will be declared the winner.</DialogDescription>
    <Button variant="destructive" onClick={confirmForfeit}>Yes, Forfeit</Button>
    <Button variant="ghost" onClick={() => setShowForfeitDialog(false)}>Continue Playing</Button>
  </DialogContent>
</Dialog>
```

### 5. Connection error display
On `'connect_error'` and failed reconnection (`'reconnect_failed'`), show a clear error state with a "Return to Lobby" button rather than leaving the user on a frozen screen.

---

## Out of Scope
- Backend WebSocket changes (TICKET-026 covers WS input validation)
- Battle scoring logic
- Matchmaking improvements

---

## Implementation Notes
- Socket.IO client's default reconnection settings do attempt reconnects, but with no UI indication — the user sees a frozen screen
- The `useBattleSocket` hook should expose `connectionState: 'connected' | 'connecting' | 'reconnecting' | 'disconnected'` for the UI to consume
- Keep socket reconnection attempts bounded (5 max) — after 5 failures, show "Connection failed" with a manual retry button

---

## Acceptance Criteria
- [ ] No crash when `opponentProgress` is null (before opponent sends any updates)
- [ ] "Waiting for opponent" message shown when lobby has only 1 player
- [ ] Disconnecting and reconnecting within 5 attempts shows a reconnecting banner
- [ ] After 5 failed reconnection attempts, shows a "Connection failed" error state with retry option
- [ ] Forfeit button shows a confirmation dialog before executing
- [ ] `useBattleSocket` exposes `connectionState` for UI consumption

---

## Testing Requirements
- **Manual QA:**
  1. Join a battle lobby alone — verify "waiting for opponent" message shown
  2. In a live battle, disable network briefly (airplane mode) — verify reconnecting state shown
  3. Click Forfeit — verify confirmation dialog appears before match ends
- **Null safety test:** Trigger a battle start without sending any `progress_update` events — verify no crash on opponent progress display

---

## Affected Areas
- `frontend/src/hooks/useBattleSocket.ts`
- `frontend/src/app/(main)/battle/page.tsx`

---

## Risks / Edge Cases
- Reconnection during an active match: the server's in-memory lobby may still have the player — reconnecting socket gets a new socket ID, which may not match the lobby entry. This may require a "rejoin lobby" event from the client on reconnect — audit the backend gateway to confirm.
- If the match is in `COMPLETED` state when the player reconnects, show the game over screen (don't start a new game)

---

## Open Questions
- Does the backend `BattleGateway` support a "rejoin" event for reconnecting players? If not, TICKET-010's reconnection handling is UI-only (shows state but cannot truly resume).
