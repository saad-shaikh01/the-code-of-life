# Add Symbol/Number Reference Panel to Puzzle Solver

## Metadata
- **Ticket ID:** TICKET-012
- **Priority:** P2
- **Type:** feature-gap
- **Area:** frontend
- **Status:** done
- **Dependencies:** TICKET-001 (cipher must be correct before building the UI for it)

---

## Problem
During puzzle solving, players see an encrypted pattern (either Unicode symbols or, after TICKET-001, numbers like "8 5 12 12 15"). There is no in-game reference showing what each symbol/number maps to. Players are expected to memorize or guess the mapping.

The `useGameStore` already has `symbolMap` and `userSymbolMap` state fields defined, indicating this feature was planned but never built. No component renders a decoder reference panel.

---

## Why This Matters
Without a reference panel, the puzzle is not solvable unless the player already memorized the cipher. For a game designed around decoding encrypted messages, the decoder tool is a core mechanic, not a hint. New players cannot engage with the game at all without it.

The "Zen" experience requires the player to feel empowered and in control of the decoding process. A hidden cipher breaks this completely.

---

## Evidence
- `frontend/src/stores/useGameStore.ts` - `symbolMap` and `userSymbolMap` fields defined but never populated or rendered
- `frontend/src/app/(main)/puzzle/[id]/page.tsx` - no decoder panel component rendered
- `PROJECT_OVERVIEW.md` - "Decoder Engine" is described as a core feature
- After TICKET-001: encrypted pattern will be space-separated numbers ("8 5 12 12 15"); reference panel should show "1=A, 2=B ... 26=Z"

---

## Scope

### 1. Create `DecoderPanel` component
New file: `frontend/src/modules/puzzles/components/DecoderPanel.tsx`

The panel should display a grid of number-to-letter mappings:
```text
1=A  2=B  3=C  4=D  5=E  6=F  7=G
8=H  9=I  10=J 11=K 12=L 13=M 14=N
...
26=Z
```

Layout: collapsible panel. On mobile: collapsed by default. On desktop: expanded by default in a sidebar.

### 2. Fetch symbol map from API
On puzzle page mount, call `GET /api/decoder/symbol-map` and store in `useGameStore.symbolMap`.

### 3. Wire symbol map into `DecoderPanel`
Use the store-backed symbol map in the panel, with the canonical frontend cipher map as a local fallback.

### 4. Integrate into puzzle page
In `frontend/src/app/(main)/puzzle/[id]/page.tsx`:
- Render `<DecoderPanel>` adjacent to the encrypted pattern display
- Keep it visible during active solving
- Do not render it on the results/completion state

### 5. Audit daily page integration
Check whether `frontend/src/app/(main)/daily/page.tsx` contains an active solving view before adding the panel there.

---

## Out of Scope
- The encrypted pattern rendering itself (that was part of TICKET-001)
- User-customizable symbol maps
- Hint system changes

---

## Implementation Notes
- Added `frontend/src/modules/puzzles/components/DecoderPanel.tsx` as a collapsible cipher reference panel using the numeric map from `frontend/src/lib/cipher.ts`
- `DecoderPanel` uses a mobile-safe default of collapsed, then expands automatically on desktop via `window.matchMedia("(min-width: 1024px)")`
- The panel renders the full ordered token map, including letters and punctuation, and highlights tokens that appear in the active puzzle's `encryptedPattern`
- `frontend/src/app/(main)/puzzle/[id]/page.tsx` now fetches `GET /api/decoder/symbol-map` with React Query, stores the response in `useGameStore.symbolMap`, and renders the panel beside the active puzzle card while solving
- `frontend/src/lib/cipher.ts` now exports the canonical `CIPHER_MAP` plus ordered-entry helpers so the puzzle page and decoder panel use the same token definitions
- `frontend/src/app/(main)/daily/page.tsx` was audited as requested and was intentionally left unchanged because it does not contain an active solving view; it only previews the daily puzzle and links into `/puzzle/[id]`

---

## Acceptance Criteria
- [x] Puzzle page shows a toggle button "Cipher Key" or "Show Decoder"
- [x] Clicking it reveals a panel with the full number-to-letter mapping (after TICKET-001: 1=A through 26=Z plus punctuation)
- [x] Panel is collapsed by default on mobile, expanded by default on desktop
- [x] Symbol map is fetched from `GET /api/decoder/symbol-map` (not hardcoded)
- [x] `useGameStore.symbolMap` is populated from the API response
- [x] Panel renders without errors when `symbolMap` is loading (show skeleton)

---

## Testing Requirements
- **Manual QA:**
  1. Open a puzzle and verify the Cipher Key button is visible
  2. Toggle it open and verify all letter and punctuation mappings are shown
  3. Test on a mobile viewport and verify the panel starts collapsed but can be opened
  4. Test on a desktop viewport and verify the panel starts expanded
- **Regression:** Existing puzzle solving flow (input, submit, score) must not be affected

---

## Affected Areas
- `frontend/src/modules/puzzles/components/DecoderPanel.tsx`
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`
- `frontend/src/lib/cipher.ts`
- Read-only audit: `frontend/src/app/(main)/daily/page.tsx`

---

## Risks / Edge Cases
- If `GET /api/decoder/symbol-map` is called on every puzzle mount, it adds an extra API request. `staleTime: Infinity` and React Query caching keep that stable after the first load.
- The panel must remain accessible when collapsed or expanded and should not interfere with existing submit/hint flows.

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`
- `frontend/src/lib/cipher.ts`
- `frontend/src/modules/puzzles/components/DecoderPanel.tsx`
- `docs/tickets/TICKET-012-puzzle-decoder-ui.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/lib/cipher.ts" "src/modules/puzzles/components/DecoderPanel.tsx" "src/app/(main)/puzzle/[id]/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- `frontend/src/app/(main)/daily/page.tsx` was audited and intentionally not changed because the page has no inline puzzle-solving state where the decoder panel would render.
- Browser manual QA was not executed in this terminal session; the mobile collapsed-state and desktop expanded-state checks remain the recommended follow-up.
