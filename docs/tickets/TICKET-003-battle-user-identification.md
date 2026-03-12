# Fix Hardcoded Player Array Indices in Battle Page

## Metadata
- **Ticket ID:** TICKET-003
- **Priority:** P0
- **Type:** bug
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
The battle page identifies the current player and their game result using hardcoded array indices (`players[0]`, `results[0]`), with explicit TODO comments in the source. This means the game always treats the first player in the lobby array as "the current user" — which is wrong when the current user joined second.

Concretely:
- `lobby.players[0]` is assumed to be the current user
- `gameOver.results[0]` is assumed to be the current user's result

If the current user is `players[1]`, the UI will show the opponent's progress bar as "yours" and vice versa, and the wrong result (win/loss/score) will be displayed at game end.

---

## Why This Matters
Battle mode is the real-time multiplayer feature. A player could be told they won when they lost, or see the opponent's progress displayed as their own. This completely breaks the competitive experience and is an explicitly flagged TODO in the code.

---

## Evidence
- `frontend/src/app/(main)/battle/page.tsx:147`: `const myResult = gameOver.results[0]; // TODO: Get actual user's result`
- `frontend/src/app/(main)/battle/page.tsx:322`: `const currentPlayer = lobby.players[0]; // TODO: Identify current user`
- The authenticated user's ID is available from `useAuthStore`: `const { user } = useAuthStore()`
- The backend sends `players` as an array of objects that include a `userId` field (from `BattleGateway` — each player entry in the lobby includes user data)

---

## Scope
1. **Identify current player correctly:**
   ```typescript
   const { user } = useAuthStore();
   const currentPlayer = lobby.players.find(p => p.userId === user?.id);
   const opponent = lobby.players.find(p => p.userId !== user?.id);
   ```

2. **Identify current user's game result correctly:**
   ```typescript
   const myResult = gameOver.results.find(r => r.userId === user?.id);
   const opponentResult = gameOver.results.find(r => r.userId !== user?.id);
   ```

3. **Verify player object shape from backend:** Read `backend/src/modules/battle/battle.gateway.ts` to confirm that `players` array entries include a `userId` field. If the field is named differently (e.g., `id`, `user.id`), adapt the `.find()` predicate accordingly.

4. **Add null guards:** Both `currentPlayer` and `opponent` can be `undefined` if the lobby only has one player. Render appropriate loading/waiting states in those cases.

---

## Out of Scope
- Battle socket reconnection or heartbeat (TICKET-010)
- Any backend battle logic changes

---

## Implementation Notes
- Import `useAuthStore` at the top of `battle/page.tsx` if not already imported
- The `currentPlayer` identification logic should be extracted early in the component, before any conditional renders
- Anywhere `lobby.players[0]` or `gameOver.results[0]` appears in the file, replace with the `find()` approach
- Check that progress bar comparison UI (side-by-side bars) uses `currentPlayer` vs `opponent` consistently after this fix

---

## Acceptance Criteria
- [ ] No `players[0]` or `results[0]` hardcoded index references remain in `battle/page.tsx`
- [ ] When user A joins first and user B joins second, user B still sees their own progress correctly
- [ ] Game over screen shows the correct win/loss/score for the actual current user
- [ ] Progress bar comparison shows current user on the left (or a consistent position) regardless of join order
- [ ] If only one player is in the lobby, the opponent section shows a "waiting" state rather than crashing

---

## Testing Requirements
- **Manual QA:** Open two browser windows, log in as two different users, join a battle — verify each window shows the correct player info and progress
- **Manual QA:** Complete a battle as the second player to join — verify win/loss is reported correctly
- **Regression:** First player to join should also still see correct UI

---

## Affected Areas
- `frontend/src/app/(main)/battle/page.tsx` (lines ~147, ~322 and wherever `players[0]`/`results[0]` appear)
- `frontend/src/hooks/useBattleSocket.ts` (read to confirm player object shape)
- `backend/src/modules/battle/battle.gateway.ts` (read only — confirm player object shape)

---

## Risks / Edge Cases
- If the backend does not include `userId` in the player object emitted to clients, the `find()` will always return `undefined` — the backend event payload must be audited before implementing
- Edge case: user disconnects mid-game; their entry may be removed from `players` array — handle gracefully

---

## Open Questions
- Does the backend `lobby_joined` / `player_joined` event payload include `userId` directly on each player object? Confirm by reading `battle.gateway.ts` before implementing.
