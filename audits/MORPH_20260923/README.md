# The SECOND painted archetype on the card — the Civet's sheets (2026-09-23)

Claude's step 7 of the morph program: now that Codex's six Civet marking masks (`f25098fa`) are merged and
shipped, the quadruped archetype gets the sheets the crab got on 2026-09-22 — and, because one generator now
serves every registered archetype, the crab is re-run through the **same instrument** as the control.

`archetype-sheet.mjs <EarthName> <slug>` renders through the REAL shipped card path (`PaintedCardSource` →
`renderCardIndividualV1` on the sealed 512² card master). Nothing in `port/v2/apps/game/src` changed in this
batch; this packet is evidence and a decision page.

| Sheet | What | Result |
|---|---|---|
| `civet-palette-sheet-01.png` (+ `civet-sheet-01.json`) | the Civet as painted + 12 palette morphs from 12 seeds, portrait tiles (440) | the painted finish survives — fur, spots and the ringed tail are intact, only hue/chroma move. **But see the finding below.** |
| `civet-markings-sheet-01.png` | the eight v1 patterns × three rows through the real card source | Codex's six masks all land; every masked pattern differs from plain in every row |
| `crab-palette-sheet-01.png` · `crab-markings-sheet-01.png` (+ `crab-sheet-01.json`) | the crab through the identical generator | the control — same five gates, all green |
| `civet-accent-option-sheet-01.png` (+ `.json`, `accent-option-sheet.mjs`) | **one page for Nick** — the base/accent split as shipped (row 0) vs the head group on the base coat (row 1), on the four individuals with the widest base↔accent hue gap (176° / 169° / 154° / 91°) | row 1 reads as ONE animal in all four; row 0 grafts a differently-coloured head on at the shoulder |
| `civet-label-roles.png` · `crab-label-roles.png` | the card label map coloured by palette role (blue = base, red = accent) | the measurement behind the finding |

Controls on both archetypes, green: the archetype's own genome renders **IDENTITY** (the card composite is
byte-identical to the sealed master); the 12 palette tiles are pairwise distinct; every masked pattern differs
from plain; the iridescent column (emissive, no mask) differs from plain in every row; the M1 proportion row
differs from row 0 on every pattern.

## Finding 1 — the base/accent split is right for the crab and wrong for the quadruped (Nick's open question (2))

`paletteRoleOfGroup` sends every group that is not `body`/`legs` to **accent**. Measured on the shipped card
label maps:

| archetype | accent parts | accent share of labelled pixels |
|---|---|---|
| Crab | `clawFar/NearElbow`, `clawFar/NearDactylRoot` | **5.6 %** (318 of 5,679) — reads as trim |
| Civet | `head`, `jaw`, `neck`, `earFar/NearTip`, `tail1..3` | **38.1 %** (32,846 of 86,141) — reads as a second animal |

The head/neck cut is a straight vertical seam across the shoulder (see `civet-label-roles.png`), so a strong
accent does not read as marking — it reads as a graft. `civet-accent-option-sheet-01.png` renders the same four
individuals with the **head group declared on the base coat** (ears and tail keep the accent) through the same
renderer, by declaring the variant on the body card. Both-way control in the JSON: the variant changes every
Civet tile, and is a **byte-identical no-op on the crab** (which has no `head` group), so a decision for it
cannot disturb the five shipped crab archetypes.

**Claude's recommendation: row 1** — either as a change to `paletteRoleOfGroup` (head → base) or, per Nick's own
framing, as a per-archetype declaration on the painting side. It is Nick's call; nothing is shipped until he says.

## Finding 2 — the 2026-09-22 sheet's "lumin (emissive)" row was inert, and is retained as the failing control

`audits/MORPH_20260922/card-markings-sheet-01.png` row 1 is labelled *"same, lumin (emissive)"* and is
**byte-identical to row 0** — 0 differing bytes of 595,584, while row 2 differs by 73,057, so the comparison
itself works. Cause: **both** painted archetypes' own genomes carry `lumin: true`, so by the (correct, tested)
rule that the painting is its own genome, the lumin gene is an identity channel for them. The system is right —
`morph-markings.test.ts` says so in as many words — the *sheet row* claimed to show M4 and showed nothing.

The corrected sheets drop that row (M4 is demonstrated by the **iridescent** column, which is emissive without
depending on the lumin gene) and spend it on **M1 proportion**, which no sheet had shown. The inert case is kept
as a first-class control in `*-sheet-01.json` → `luminFinding`: inert on every pattern against the archetype's
own lumin genome, and live on every pattern against a non-lumin archetype genome.

**The product question this leaves for Nick:** for a lumin-painted archetype the lumin gene can neither add glow
(already painted) nor remove it, so an individual *without* the gene still looks lumin. With both painted
archetypes painted lumin, the gene is today inert on the card and the stage. Options: accept it (the painting
wins, as with colour), or have the kit paint non-lumin masters and let the gene add the lift.

## Reproduce
```
cd port/v2
node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260923/archetype-sheet.mjs Civet civet
node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260923/archetype-sheet.mjs Crab crab
node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/MORPH_20260923/accent-option-sheet.mjs
```
