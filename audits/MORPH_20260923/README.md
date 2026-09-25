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

---

# The painted LIBRARY on the card — all 17 archetypes after the sprint merge (2026-09-23, later)

Nick accepted Codex's archetype-sprint art. Merged locally (`openai/mac` `236b9846`), then wired into the card:
`port/v2/tools/morph/build-card-masters.mjs` now lists all 17 archetypes (the Python at its open-pose correction
`candidate-02/fit-01`, record `b287ddc5…`; the Salmon with its six masks from the separate `13-fish-markings/` packet, bound
to its record — a mask set sealed for another record is refused), writes ONLY into the shipped mirror inside `port/v2`
(never into another owner's evidence folder), and **generates** the app registry (`morph/card-archetypes.ts`) and the
explicit `?url` asset map (`painted-cards.assets.ts`) from that one list. Control: re-running it left the six existing
archetypes' shipped files byte-identical.

**Bug found and fixed (mine): the painted markings never reached the APP card.** The hand-kept asset map in
`painted-cards.ts` listed card/record/master/labels only, so `PaintedCardSource`'s `markings.json` fetch threw, was
swallowed, and every in-app card rendered plain — while every sheet (fed from disk) showed the masks. The new OUTCOME test
in `painted-cards.test.ts` goes through `createPaintedCardsForApp` and requires a striped individual to differ from the plain
one for every archetype that ships masks (and refuses to pass over zero archetypes); it failed on the old wiring (the
striped crab equalled the plain crab) and passes now for the crab, the Civet and the Salmon.

**Also fixed (mine): the root `tsc` project was red** since the card path landed — `morph-markings.ts` imported one TYPE
from the Pixi-bound `creature-rig.ts`, which dragged Pixi's DOM/WebGPU declarations into the node-only root program (184
`node_modules` errors). The binding shape it reads is now declared structurally; all three typecheck projects pass.

`library-card-sheet-01.png` (+ `.json`, `library-card-sheet.mjs`): one row per archetype through the card source — as
painted · three palette morphs · striped. Every archetype renders; the four tiles of every row are distinct; masks land
wherever they ship. **Three look findings for Nick, measured on the card masters:**

| finding | measured | affected |
|---|---|---|
| near-grey paintings barely morph (the remap moves hue/chroma; a grey has neither) | share of opaque pixels with saturation < 0.15 | Salmon **74 %**, Vent Crab **73 %**, Chimpanzee **63 %** (the rest ≤ 24 %) |
| the head/body graft (finding 1 above) is not Civet-specific | visible on the sheet | Eagle, Beetle, Fruit Bat, Chimpanzee — same fix (head group on the base coat) |
| long bodies read tiny on a square card (the crop is the alpha box, squared) | fill of the square | Python **8 %** (aspect 0.21), Centipede 9 %, Vent Crab 9 % |

Options for the grey ones: a chroma floor in the remap for low-saturation archetypes, or let those species vary by marking
(the Salmon already has six masks) rather than palette. For the long ones: a card crop that follows the body's long axis.
Nothing is changed until Nick picks.

## Built — Nick's #4 (2026-09-23, latest): the three look findings, answered and shipped

Nick asked for Claude's best suggestions and for no more per-step stops, so the recommendations are built (each reversible,
each one constant or one table row):

1. **The accent is trim, per body plan** — `ACCENT_GROUPS` (`morph-palette.ts`). Finding 1 above is closed: the Civet
   reads as one animal with ears and ringed tail in the accent. The primate row is EMPTY because
   `library-card-sheet-02.png` showed the chimpanzee's head as a graft.
2. **Near-grey paintings tint** (`LOW_CHROMA_ROLE` 0.18, `TINT_SATURATION` 0.3): the Salmon, Vent Crab and Chimpanzee
   now visibly take a colour gene; luminance stays exact (≤ 2/255 measured).
3. **Long bodies on the diagonal** (`LONG_BODY_ASPECT` 0.42, `diagonalLongBodyV1`, exact √½ — no trig): Python, Centipede
   and Salmon turn 45°, head end up, each > 1.15× larger on the card; no other archetype turns.

`library-card-sheet-03.png` is the result (`-01` before, `-02` the intermediate that showed the primate graft).
`morph-library.test.ts` pins all three as outcomes over every shipped archetype, with the old Civet split as the failing
control, and asserts CARD = STAGE: per role, the card master and the real atlas make the same tint decision (non-vacuous:
every archetype compared, the tint branch exercised). A slip of mine caught by that test before commit: a trailing comment
swallowed three table rows (radial/arachnid/cephalopod fell back to the old default — the Starfish measured 98 % accent).

Lumin (finding 2 above) is unchanged: the gene stays inert on lumin-painted archetypes — the painting wins, as with colour.
