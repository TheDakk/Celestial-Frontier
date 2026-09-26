# D16 final parity items (Claude, 2026-09-26)

Branch `claude/d16-compendium-postcard`, cut from `anthropic/mac` `832dc18b`. Each item has its own signed commit and a browser-free outcome test. Those tests press real controls in JSDOM, run the exact `main.ts` sections, and carry mutation controls that break the wiring, not the assertion.

| Item | INVENTORY | Commit | Test |
|---|---|---|---|
| Compendium kingdom + rarity chips, opt-in shelves | #36, #37 | `16153d0d` | `tests/d16-compendium-chips-outcome.test.ts` (6) |
| Compendium origin travel | #38 | `8657bac8` | `tests/d16-compendium-origin-outcome.test.ts` (5) |
| Compendium specimen reveal + queue | #39 | `3bc18d84` | `tests/d16-compendium-reveal-outcome.test.ts` (7) |
| Landing vista ⛶ view + ⇪ postcard (ledger A6 share card) | #9, #10 | `14f8026f` | `tests/d16-vista-postcard-outcome.test.ts` (6) |

## Parity calls (each reversible, one line)
- **Shelves are an opt-in "▦ Shelves" chip, off by default.** v1 opened the Compendium grouped, with every shelf closed. v2 keeps the flat virtual list as the default because the I5 memory epoch and Glass measure it. With shelves on, v1's rules hold: nothing opens itself, and a chip filter lays every shelf open.
- **Chips are one horizontally scrolling 44 px row** instead of v1's two rows, so a phone keeps its list height. The scrollport gives up exactly that row (52 px) in both height owners.
- **"Skip all" is a second real 44 px button** instead of v1's "hold to skip all" on the Continue element (iPhone/accessibility-first). Escape also skips all.
- **The reveal fires on NEW pages only**, from a page diff around the capture and breed commits (a first catch, a bred hybrid). It queues behind any open modal or Field Training (v1's "one voice") and flushes on the next input pulse.
- **The vista "full screen" is a view mode.** v2's vista is the full-stage surface background, so the pill row (⛶ Vista, ⇪ Postcard) sits over the stage, outside the survey card, and the measured default card is unchanged. In the view, any tap or Escape steps back without acting on the world.
- **Postcard delivery.** It goes to the Web Share API as a file when the device can share files (the iPhone share sheet: Save Image, Messages…); otherwise it downloads. A dismissed sheet is "cancelled", never a surprise download. The composition is v1's exact layout, capped at 1,600 px wide.

## For Codex's I5 epoch (render-cost changes)
- **Compendium list.**
  - The chip bar (10 buttons) is added above the scrollport once the Compendium has a species. The default view shows the same species rows.
  - The scrollport is 52 px shorter in both height rules, so each window mounts slightly fewer rows at a given viewport.
  - The fixture install and reset (your instrument path) now also reset the chips and shelves to the default, so the measured scene opens flat and unfiltered.
- **Shelf mode (opt-in)** mounts fold-header button rows (logical ids `shelf:<name>`, `sourceIndex -1`) in the same virtual list. Only open shelves mount species rows.
- **The reveal** holds at most one extra 440 px portrait request (owner `compendium-reveal`). It is cancelled when that specimen leaves, so `paintedArt` leases stay truthful.
- **The postcard** allocates one extra canvas (the vista size plus 86 px, at most 1,600 px wide) per press, released after delivery. The vista pixels come from the existing stage texture resource; nothing is re-rendered.
- **Settings/Glass.** No Settings rows changed. The vista pill row is new fixed chrome on the surface, while a vista shows. The `body.vista-view` mode hides the survey card, panels and HUD.

## Bug found and fixed
The reveal test caught a real controller bug: a page that arrived while a reveal was showing re-rendered the card, so the portrait landed on a detached `<img>`. The portrait URL is now reapplied by every render.

## Test-harness edits
- `a5-breed-outcome` and `a5-scavenge-outcome` gain an inert `compendiumRevealPages` in their env (their runners now snapshot and reveal).
- `evidence-build-runtime` gains `syncVistaPills` (and asserts the pills resync on a visibility change).
- `inventory-narrow-reflow` (the Compendium heading Close-row contract) passes because `fillCodex` keeps the `<h3>Compendium` fill adjacent to `panel.classList.add`.

## Proposed release bullets (for Codex's batched C17/D19 re-measure; the sealed inventory was not edited)
- **UI Enhancements:** "📚 COMPENDIUM FILTERS AND SHELVES — sift the Compendium by kingdom (Fauna, Flora, Fungi, Microbes) and rarity (Rare+, Legendary+, Mythic+), or turn on ▦ Shelves to fold it by habitat."
- **New Features & Systems:** "✨ SPECIMEN REVEALS — every new Compendium page is revealed with its painted portrait; several at once queue up, with Continue and Skip all."
- **UI Enhancements:** "↗ ORIGIN TRAVEL — a wild catch's page flies you back to the world where you first catalogued it."
- **New Features & Systems:** "⇪ VISTA POSTCARDS — step into a landing vista with ⛶ Vista, then save or share it as a postcard with the world's name and share code."

## Still open (outside this directive)
The Guide browse tour (D19, batched with Codex's C17 re-measure).
