# DEVIATIONS.md — the port's improvement ledger

**The rule (plan §20 Gate A): the port is BUG-FOR-BUG parity until a deviation is
approved here.** Every entry below is a place the original does something imperfect
that the port can do better — found while porting, each verified against the source
or caught by a parity instrument. Status: ☐ proposed (parity preserved today) ·
✔ approved by Nick · ★ already structurally better in the port without breaking parity.

Companion to `port/DECISIONS.md` (Nick's §23 design calls). Update IN THE SAME BATCH
as any change that touches an entry.

## Species art — THE MORPHOLOGY PASS (approved by Nick 2026-08-01)

The species-art surface is the one place the verbatim-parity boundary is OPEN, under Nick's
approval after the full-catalog review (`port/ART_REVIEW_SPECIES_2026-08-01.md` +
`audits/species-audit-2026-08-01/`). Corrections live in `packages/art/src/speciesoverrides.ts`
ATOP the verbatim engine (unmatched species stay parity-exact). Plan + waves:
`port/MORPHOLOGY_PASS.md`. Gate: `npm run speciesaudit` (1,254/1,254 every batch).

- ✔ **D-ART-6 — fungi structural families (wave 1).** The 27 Earth fungi were one mushroom
  recolored (release blocker). Now: bracket/shelf · puffball · coral · morel · mold · earthstar
  families, routed by name; true gilled mushrooms fall through verbatim.
- ✔ **D-ART-7 — microbe morphologies (wave 1).** The 22 microbes were one bubble cluster.
  Now: tardigrade (with a contrast guarantee) · diatom · radiolarian · ciliate · amoeba.
- ✔ **D-ART-8 — flora name-seeded anti-duplicate (wave 2).** ROOT CAUSE: the generic leaf
  ladder is deterministic per form and never sees the species name, so 16 groups (38 files)
  rendered byte-identical. Now every named species varies from a hash of its own name.
  16 → 0 duplicate groups; a permanent sentinel in speciesaudit fails on any regression.
- ✔ **D-ART-9 — iconic flora bodies (wave 2).** Rafflesia · Pineapple · Joshua Tree · Cotton ·
  Dragon Fruit · Rhubarb · Tobacco · Cabbage now have real growth forms.
- ☐ **D-ART-1 defining-feature guarantees · D-ART-2 pattern/color legibility · D-ART-3
  contrast floor · D-ART-4 flower-head + remaining fungi/microbe families · D-ART-5 procedural
  depth** — the remaining waves (P1 integrity/dupes/manifest → P2 fauna specialists + iconic
  flora → P3 fauna family polish → P4 procedural). Tracked in MORPHOLOGY_PASS.md.

## Correctness

- ☐ **D-9i — string `maxGen` poisoning.** `_sanitizeSavedGenome` clamps
  brood/fed/xp/hurt but not `gen`; `onSpeciesStored` assigns `entry.gen` raw after a
  coercing comparison, so a hostile save's `gen:'2'` lands in `stats.maxGen` and
  persists into every future save. Found by the importer parity test (fixture pins
  the string). *Port fix:* coerce at the comparison. One line; invisible to honest
  saves.
- ☐ **D-9e — dead biome→fauna filter.** `main.js:11112` reads `wbRoll.fauna` off a
  `BIOME_SETS` entry that has no `fauna` field — a jungle landing can show glacier
  fauna. *Port fix:* wire the filter through the biome profile when Phase 4+ builds
  landing rosters. Gameplay-affecting — needs Nick's call on WHEN (it changes which
  creatures appear).
- ☐ **D-LOC — locale-dependent civilization text.** `civilization()` uses
  `year.toLocaleString()`; two devices in different locales render different
  descriptor text, and fixture parity would break on a non-en-US CI machine.
  *Port fix:* fixed-locale formatting (`toLocaleString('en-US')`) as an approved
  deviation, or a pure formatter. Cosmetic to players, structural for CI.
- ★ **D-NAV — illegal navigation states unrepresentable.** The old build defended
  `st.star.x` against null per frame after a crash shipped; `@cf/scene`'s state
  machine rejects illegal transitions and clears deeper context on ascent, so the
  class cannot exist. No parity cost — same legal states.
- ★ **D-CLOCK — no wall-clock in the domain.** COSMIC_EPOCH's port takes an injected
  play-seconds source; the harvestclock invariant holds by construction. The no-DOM
  lint enforces `Math.random`/`Date.now` absence across every domain package —
  the original could only enforce this by grep + discipline.

## Architecture / layering

- ☐ **D-HAZE — `galaxyHaze` lives inside WorldGen [domain]** and draws a 2048px
  canvas (the source violates its own architecture comment; it is the no-DOM lint's
  documented exception). *Port fix:* render-layer ownership in Phase 3/4 scenes.
  Also a candidate one-move cleanup upstream in main.js.
- ☐ **D-ST — `describePick` reads app globals inside a [domain] module.**
  The card router (Descriptors, main.js ~3035) reads `st` (nav state) and
  `customNames` (rename map) as FREE identifiers — exported by the lift but
  throwing on first call until the slice installed a seam (2026-07-31; same
  green-while-broken shape as worldgen's GAL_SPRITES). The slice keeps the
  seam true from its nav state; *port fix:* pass state as parameters when
  Phase 4 rebuilds the card layer. ⚠ Same find surfaced a STALE-LIFT hazard:
  re-lifting Descriptors after the strays registry row grew `regionAt` added
  a previously-missing import (the old lift left `regionAt` free — guarded by
  `typeof st`, so capture-green). Re-lift after any registry change.
- ☐ **D-STRAYS — domain-pure functions scattered through app sections**
  (biomeFor, hdGenesFor, where-codecs, winEstimate, floraStat, cleanName,
  `_sanitizeSavedGenome`, the ring-grade chain). The port already homes them in
  `@cf/domain-strays`; the *upstream* cleanup (moving them into [domain] modules in
  main.js) is optional and cosmetic.
- ★ **D-STORE — one localStorage blob → §19.3 split stores.** The repository
  separates meta/player/creatures/catalog/inventory/settings/journal/assetcache with
  atomic transactions and typed recovery — the single-blob format survives via
  import/export for compatibility, but new-format persistence can be incremental
  and partial-failure-safe.

## Determinism / replayability

- ☐ **D-RNG — the 11 bare `Math.random()` outcome rolls** (tryCapture, openPicker,
  _descRoll, attemptContact, hazardFlavor, _tutGrant, _tutDuel…) become
  `@cf/domain-sessionrng` calls in Phase 4+ wiring — outcomes replayable per
  (seed, domain, n), state in the save + diagnostics export. Reviewer §2.1;
  package built, wiring pending. Player-visible behavior: none (still unpredictable).
- ☐ **D-NOTIF-T — notification fallback stamps.** `pushNotif`/load fall back to
  `Date.now()` for invalid stamps. *Port fix:* the injected clock everywhere
  (already true in importSaveV2's signature).

## Coverage the original never had (already landed — no approval needed)

- ★ Golden corpus extensions: `makeNoise` ×10k and `crossGenome_uncorrelated` ×10k
  (the consecutive-seed recipe never executed the size-mutation branch once in 10k
  cases — input correlation zeroed a branch's coverage).
- ★ Real-input tests behind the vacuous probes (planetSpecies `[]`, galaxyDescriptor,
  moonDescriptor, empty-cell galaxiesInCell — which hid a would-be crash on every
  populated cell).
- ★ The save-fixture harness (10 real-boot fixtures incl. recovery and the
  arrays-as-objects gate quirk) + content-registry gate + round-trip fixed point.
- ★ The 9g rarity-collapse guard, data-level and end-to-end through speciesGrade.

## Phase 7 pre-commitments (from Phase 0 measurements, so they aren't rediscovered)

- ☐ **D-AUDIO-CAP — no audio concurrency bound exists anywhere** (10 AudioNodes per
  utterance, unbounded in-flight). §15 requires mobile budgets; the port's mixer
  must ship one. Measured during Phase 0; do not let the port inherit the absence.
- ☐ **D-LEGACY-VOICE / D-F0** — already decided in `port/DECISIONS.md` (fallback-only;
  soft saturation tuned after the listening test). Listed here only for completeness.
