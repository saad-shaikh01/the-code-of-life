# Add Symbol/Number Reference Panel to Puzzle Solver

## Metadata
- **Ticket ID:** TICKET-012
- **Priority:** P2
- **Type:** feature-gap
- **Area:** frontend
- **Status:** open
- **Dependencies:** TICKET-001 (cipher must be correct before building the UI for it)

---

## Problem
During puzzle solving, players see an encrypted pattern (either Unicode symbols or, after TICKET-001, numbers like "8 5 12 12 15"). There is no in-game reference showing what each symbol/number maps to. Players are expected to memorize or guess the mapping.

The `useGameStore` already has `symbolMap` and `userSymbolMap` state fields defined, indicating this feature was planned but never built. No component renders a decoder reference panel.

---

## Why This Matters
Without a reference panel, the puzzle is not solvable unless the player already memorized the cipher. For a game designed around decoding encrypted messages, the decoder tool is a core mechanic — not a hint. New players cannot engage with the game at all without it.

The "Zen" experience requires the player to feel empowered and in control of the decoding process. A hidden cipher breaks this completely.

---

## Evidence
- `frontend/src/stores/useGameStore.ts` — `symbolMap` and `userSymbolMap` fields defined but never populated or rendered
- `frontend/src/app/(main)/puzzle/[id]/page.tsx` — no decoder panel component rendered
- `PROJECT_OVERVIEW.md` — "Decoder Engine" is described as a core feature
- After TICKET-001: encrypted pattern will be space-separated numbers ("8 5 12 12 15"); reference panel should show "1=A, 2=B ... 26=Z"

---

## Scope

### 1. Create `DecoderPanel` component
New file: `frontend/src/components/puzzle/DecoderPanel.tsx`

The panel should display a grid of number-to-letter mappings:
```
1=A  2=B  3=C  4=D  5=E  6=F  7=G
8=H  9=I  10=J 11=K 12=L 13=M 14=N
...
26=Z
```

Layout: collapsible panel (toggle button "Show/Hide Cipher Key"). On mobile: modal or bottom sheet. On desktop: sidebar or collapsible section above the input.

### 2. Fetch symbol map from API
On puzzle page mount, call `GET /api/decoder/symbol-map` and store in `useGameStore.symbolMap`:
```typescript
const { data: symbolMapData } = useQuery({
  queryKey: ['symbol-map'],
  queryFn: () => decoderService.getSymbolMap(),
  staleTime: Infinity, // Symbol map never changes
});

// Store in game store
useEffect(() => {
  if (symbolMapData?.data) {
    setSymbolMap(symbolMapData.data);
  }
}, [symbolMapData]);
```

### 3. Wire symbol map into `DecoderPanel`
```tsx
const { symbolMap } = useGameStore();

<DecoderPanel symbolMap={symbolMap} isOpen={showDecoder} onToggle={() => setShowDecoder(!showDecoder)} />
```

### 4. Integrate into puzzle page
In `frontend/src/app/(main)/puzzle/[id]/page.tsx`:
- Add `showDecoder` state (default `true` on desktop, `false` on mobile)
- Render `<DecoderPanel>` adjacent to the encrypted pattern display
- Add a "Cipher Key" toggle button in the puzzle header toolbar

---

## Out of Scope
- The encrypted pattern rendering itself (that's part of TICKET-001)
- User-customizable symbol maps
- Hint system changes

---

## Implementation Notes
- After TICKET-001, the symbol map is `{ "1": "A", "2": "B", ..., "26": "Z", "27": " ", ... }` — render it as "1→A", "2→B", etc.
- The panel should be visually consistent with the dark theme — use `Card` component with glass variant
- On the `GET /api/decoder/symbol-map` response, the map is an object with encoded values as keys and letters as values (or vice versa — check the exact response format from the backend)
- `staleTime: Infinity` is correct since the cipher map is static

---

## Acceptance Criteria
- [ ] Puzzle page shows a toggle button "Cipher Key" or "Show Decoder"
- [ ] Clicking it reveals a panel with the full number-to-letter mapping (after TICKET-001: 1=A through 26=Z plus punctuation)
- [ ] Panel is collapsed by default on mobile, expanded by default on desktop
- [ ] Symbol map is fetched from `GET /api/decoder/symbol-map` (not hardcoded)
- [ ] `useGameStore.symbolMap` is populated from the API response
- [ ] Panel renders without errors when `symbolMap` is loading (show skeleton)

---

## Testing Requirements
- **Manual QA:**
  1. Open a puzzle → verify Cipher Key button visible
  2. Click it → verify all 26+ mappings shown correctly
  3. Test on mobile viewport → verify panel is collapsible/accessible
- **Regression:** Existing puzzle solving flow (input, submit, score) must not be affected

---

## Affected Areas
- New: `frontend/src/components/puzzle/DecoderPanel.tsx`
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`
- `frontend/src/stores/useGameStore.ts` (populate symbolMap)
- `frontend/src/api/services/decoder.service.ts` (getSymbolMap already exists — verify)

---

## Risks / Edge Cases
- If `GET /api/decoder/symbol-map` is called on every puzzle mount, it adds an extra API request. Use `staleTime: Infinity` and React Query's caching to avoid repeated fetches.
- The panel must be accessible (keyboard navigable, screen reader friendly)

---

## Open Questions
- Should the cipher key be visible before the player starts the timer? Or only after first input? (Current assumption: always visible as a reference tool, not a hint.)
