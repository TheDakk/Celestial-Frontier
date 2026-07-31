# Fixed-seed golden screens — v1.8.9

**Port Phase 0 / Gate A deliverable:** *"capture fixed-seed visual golden screens and proof
sheets."* These are the visual reference Gate F's art rubric is judged against.

28 screens · 6.2 MB · generated `node tools/uishot.js <dir>` against the v1.8.9 build.
`MANIFEST.json` records each shot's id, viewport, save type, byte size and sha256.

---

## ⚠ THESE ARE A HUMAN REFERENCE, NOT AN AUTOMATED DIFF GATE

**Do not build a pixel-comparison gate on these.** A browser screenshot is not
byte-reproducible: it varies with browser revision, GPU and driver, font rasterisation,
sub-pixel antialiasing, and DPR. The pinned Edge revision (`tools/deps.pinned.json`) makes
them *comparable*, not *identical*.

The sha256 in `MANIFEST.json` exists to detect **file corruption in git**, not to compare
renders. A hash mismatch after a browser update is expected and means nothing.

This matters because the rest of this directory *is* hash-compared — `golden-seeds.json`,
`code-fixtures.json` and `audio-profiles.json` all fail loudly on a single changed byte.
These do not, and someone will eventually try. Gate F is explicitly a **human** judgment:
*"fixed-seed screens pass art rubric"* — approved by eye, against `ART_DIRECTION.md`.

## What is fixed, and what is not

**Fixed:** the save state. Every shot is seeded with a deterministic save so the UI boots
past training with known contents — a minimal veteran save (`me`, `tut:1`, `rn`) for 21 of
them, and a **populated** one for the **7** `full:1` shots (Shipyard ×2, inventory materials
×2, craftables ×1, gear ×2), because those screens are meaningless empty. World and creature
content is seed-derived, so identical inputs give identical layouts.

**Not fixed:** the rendering environment. See the warning above.

## Coverage

| Group | Shots |
|---|---|
| Main view | desktop 1440×900 · phone 390×844 · tablet 834×1112 (landscape + portrait) |
| Panels | Settings · Charters · Compendium · Atlas · Records · Prime Codex · Guide · notification tray |
| Populated | Shipyard · inventory (materials / craftables / gear) — desktop and phone |
| Search | `search-earth-desktop` — the search-results surface |

Most panels are captured at **both** desktop and phone widths. That pairing is deliberate:
this project's UI defects have overwhelmingly been mobile-only, and a desktop-only proof set
would have missed every one of them — the buried training card, the dock behind the board,
the training rail overlap.

## What is NOT here

**Art proof sheets** (`tools/sheets/*.js` — creatures, flora, biome vistas, gear tiers,
planets, star surfaces). There are 60+ scene scripts and they render at far higher weight
than UI screens; `tools/sheets/*.png` is gitignored today. Capturing a curated set is worth
doing before Phase 5's creature-quality gate, but Gate F's *screen* requirement is satisfied
by the set here, and committing 60 art sheets now would add far more weight than judgment.

**Landing vistas and encounter screens** are not in `uishot.js`'s target list — they need a
world to be landed on rather than a panel to be clicked. Worth adding when the Canvas/Pixi
spike needs a before/after comparison.

## Regenerating

```sh
node tools/uishot.js <outDir>
```

⚠ Requires the pinned browser — `npm run preflight` first. Regenerating on a different Edge
revision produces valid screens that will not hash-match these; that is expected, and the new
revision should be recorded in `tools/deps.pinned.json` if it becomes the reference.
