# Celestial Frontier v2 — the TypeScript port (Phase 1+)

**Status: ★★★ PR #7 MERGED · GP7.1 STRICT-CONFORMITY REMEDIATION IN PROGRESS** (2026-08-09).
**Port milestone record (2026-08-01):** ★★★ PHASES 1–3 COMPLETE (automatable) · PHASE 4 SHELL RUNNING.
**Phase 4 so far — the slice wears the game's face at the GOLDEN SCREENS' exact geometry**
(floating-pill topbar: player chip + HP bar + Prime pill + trail · objective chip fed by the
Ascent chapters as pure data, landfalls BANK for real · caption + hint bottom-center · round
dock ≤900px / left+right RAILS >900px, per ROADMAP #11) — with the panel system (one-panel
law, sticky ✕, tap-empty-close, focus restoration), SETTINGS (every control a real save
field: sound/volume/charts/motion/glass tint), the COMPENDIUM (list + detail cards:
describeSpecies prose, battleStats bars in STAT_HUES, grade badge), RECORDS (counts +
journal), the SEARCH bar (CF1 code-paste TRAVEL through the charter gates, or a codex
filter), the CMB band-pick, and the Escape-order law. The smoke carries a GEOMETRY CONTRACT
(real bounding boxes vs the goldens, desktop AND phone, self-controlled) plus 15 standing
negative controls. `npm run proofsheet` bakes the art/sound verdict sheet.

## Current GP7 species-art status (2026-08-09)

The current renderer covers all **1,250** catalogue identities (631 fauna, 332 flora,
27 fungi, 20 microbes, 240 procedural). **GP7 is the frozen baseline; GP7.1 is the live
remediation pass.** GP7 measured **503 changed rows / 95 strips**
(165 PASS, 37 POLISH, 301 FAIL) plus **62 unchanged controls / 39 strips** (11 PASS,
4 POLISH, 47 FAIL). The procedural correction subset is **57/57 PASS**. The paired control
shows the new ruler is materially harsher on unchanged art: eligible-row demotions are
38.8% for drift versus 65.6% for control (−26.8 points). Therefore the carried full-catalogue
merge — 217 PASS / 415 POLISH / 618 FAIL — is inventory state across mixed rulers, **not a
catalogue score**. GP7 is frozen as evidence; GP7.1 permits named fixes only, never a global
body pass. Its literal fresh-PASS contract is recorded in
`reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md`.

GP7.1 has now completed its **first all-fresh review baseline**: 1,250 current
440x440 portraits and 196 hash-bound packets, independently collected as
**318 FAIL / 301 POLISH / 631 PASS**, with zero carried rows. This is an honest
repair baseline, not a completion claim; the 619 fresh non-PASS rows require
named repairs followed by another all-fresh render and review before
`--certify` can pass.

The first post-baseline r2 delta pass independently reviewed all 362 changed
pixels: fauna 46 PASS / 42 POLISH / 10 FAIL (98), flora+fungi 56 / 62 / 49
(167), and procedural 76 / 21 / 0 (97). The remaining 888 portraits retained
their exact baseline bytes. This is progress evidence only, not a replacement
1,250-row ledger. The second narrow repair pass is now captured as r3 (1,250
portraits / 196 packets); it differs from r2 in 106 hashes and deliberately
has no verdict ledger yet. It must be independently reviewed before any
literal certification can be attempted.

The GP7/GP7.1 review/export workflow is fail-closed and runs from this directory:

| Tool | Role |
|---|---|
| `node tools/proceduralnames.mjs --selftest` | Proves the exact 240-row bridge among full, drift, and render procedural identities. |
| `node tools/rejudgecards.mjs --drift=<file> --out=<dir> [--control] [--full]` | Builds indexed drift, unchanged-control, or full-catalogue review strips and packets from the current renderer. |
| `node tools/speciesstrip.mjs "<name,...>" [out.png]` | Renders a small named Earth/procedural strip for targeted visual diagnosis; `npm run stripcheck` exercises its positive and rejection controls. |
| `node tools/gp7collect.mjs` | Validates packet completeness, schema, exact names/order, bands, and reasons before writing the canonical GP7 drift/control records. |
| `npm run gp7conformity -- --input <extracted-recheck-dir>` | Validates a 1,250-row ledger/manifest/results/index join and reports direct vs carried remediation work. `--certify` rejects every carried or non-PASS row; it guards ledger provenance and never substitutes for rendering or visual review. |
| `node tools/gp71rejudge.mjs --prepare --out=gp71-rejudge --date=2026-08-09` | Builds the separate GP7.1 all-fresh 1,250-portrait / 196-packet evidence set, with no generated verdicts. `--collect` refuses partial, stale, or misaligned packet verdicts. |
| `node tools/gp71package-2026-08-09.mjs ...` | Creates a separate dated GP7.1 image-inclusive ZIP only after `gp7conformity --certify` accepts the fresh ledger; it rejects legacy/overlapping targets. |
| `node tools/rejudgemerge.mjs --fresh=<file> --base=<file> --control=<file> --out=<file>` | Folds fresh drift verdicts into the carried baseline and reports paired control calibration; it will not claim a delta without control. |
| `npm run speciesexport` | Rebuilds and verifies the 1,250 native 440×440 portraits and per-set ZIPs. |
| `npm run cataloguecards` | Alias for `rejudgecards --full`; generates the family-grouped complete-catalogue contact sheets and packets. |
| `npm run gp7package` | Verifies portrait/contact coverage, records SHA-256 hashes, and assembles the dated complete-review ZIP. |

The GP7 baseline packaging sequence (`speciesexport` → `cataloguecards` → `gp7package`) completed.
The package gate accepted all review records and emitted
`apps/game/smoke/Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip`
(305,291,135 bytes; SHA-256
`47B730C0323241F8E171DC3A96D4EFD5C67FA0C3CA12333CA17EBE10540D398F`).

The Phase 1–3 record below stands as history:

**Phase 2 was** (2026-07-31): Phase 2 so far: `@cf/domain-progression` (COSMIC_EPOCH clock + harvest readiness — injected play-time source, so the harvestclock invariant holds by construction; bodies mirror v1.8.9) and `@cf/persistence` (§19.3 stores · repository with the CF-RR-002 recovery semantics · in-memory + IndexedDB backends; IDB's end-to-end proof lands with Phase 3's browser slice). ⚠ The reset-law test was REWRITTEN after its own negative control passed with the defect live — recover() short-circuits on a missing primary, so the vacuous assertion never saw a surviving backup; the test now drives the real resurrection scenario (reset → new corrupt write → recover must find nothing). ★★★ **PHASE 2 AUTOMATABLE SIDE COMPLETE.** importSaveV2 (11/11 parity over the 72-field surface vs real-boot fixtures; found ROADMAP 9i — string maxGen poisoning, reproduced bug-for-bug) · exportSaveV2 (doSave mirror) · **the round-trip fixed point** (stable from round two; round one moves exactly what a live doSave moves) · repository flow end-to-end (corrupt → recover → veteran survives byte-identical). Root gates: `npm run savefixtures` (9 real-boot fixtures) + `contentregistry` (validation surface). Gate C blocked solely on Nick's real save (tools/savefixtures.js takes it verbatim). **★★★ PHASE 3 IS RUNNING: the Pixi vertical slice (apps/game) drives Gate D's core loop in a real browser** — universe → Milky Way → Sol → Earth surface, painterly art via @cf/art (GalaxyArt/ThumbArt/renderer painters lifted verbatim), the game's ZOOM-DRIVEN transitions (checkTransitions semantics, camT-intent based), Renderer LOD gates (fine-star resolve layer, Sun marker at SOL_POS, baseR star sizing), painterly system view (corona/BH/NS primaries, live orbit angles, terminator, banded rings, typed moons, belt/kuiper rocks, dwarfs), pinch + cursor-anchored wheel, SURVEY-FIRST input (one tap = the describePick card + sonar ping, double-tap dives), a STREAMING universe (camera-windowed cells; the wormhole's seeded jump works, reach-clamped) with the full deep-sky population (cosmic web + captions, quasars/blazars, radio-galaxy lobes, tidal bridges, galaxy names, the charter ring/veil/fog, the OBS_R edge), **the CHARTER/ASCENT GATES live and pure** (@cf/scene/charter.ts — stage 0 Sol-only → 3 everywhere, reach by REGIONS; blocked dives toast the build that opens the ring), comets + the interstellar visitor in system view, COSMIC_EPOCH running on play time (@cf/domain-progression's clock; supernova sites render epoch-anchored), the game's shipped stings via **@cf/audio** (whoosh/ping over the save's own sndOn/sfxVol; §15 voice scope stays gated behind the listening test), **and THE REAL SAVE LOOP: the slice boots through importSaveV2 and persists through exportSaveV2 over IndexedDB — nav rides the save's `view` (viewToNav ⇄ navToView through the real _sanitizeView), landings ride `land`, EPOCH_BASE accumulates.** `npm run smoke` (tools/slicesmoke.mjs, headless Edge/CDP) is the standing gate: the full loop + the zoom ladder with an empty-space negative control + the real-save assertions, zero console errors. See ROADMAP's Phase 3 blocks for the batch history and NEXT.

Phase 1 record:
16 test files · 161 tests · 200,000+ golden cases + the 50-probe fingerprint surface, all green from TypeScript; `npx tsc --noEmit` strict clean.

Gate B deliverables, all landed:
- **`tests/sweep.test.ts`** — the full **27-generator sweep** (was 25; see extensions) from TS in one file, with a completeness assertion that fails if the fixture gains a generator without a TS recipe.
- **`tests/nodom.test.ts`** — the no-DOM / no-nondeterminism lint over every domain source, exceptions explicit and reasoned (2: combatcore's app-coupled avatar painters; worldgen's `galaxyHaze` — ★ a layering violation in the SOURCE, canvas art inside a [domain] module, flagged for upstream relocation).
- **`@cf/domain-sessionrng`** — reviewer §2.1: replayable player outcomes. Counter-per-domain design so UI interleaving never shifts another domain's sequence; state serializes into the save/diagnostics; seed creation is explicitly the app layer's job. Wiring the 11 `Math.random()` call sites happens in Phase 2+.
- **`@cf/domain-strays`** — the domain-pure functions living outside the 14 modules: cleanName, `_r2`+where-codecs, winEstimate, STAT_KEYS+floraStat, BIOME_SETS+biomeFor, hdGenesFor, `_sanitizeSavedGenome`. Closes the remaining code-fixtures buckets (whereCodes, sanitizeSavedGenome incl. the v1.8.7 `sizePreserved` invariant ×23) and the biomeFor/hdGenesFor golden ×1k. (`hdGenesFor`'s Earth-bestiary branch needs `_earthArt` — SpeciesArt, Phase 4; recorded in the d.ts.)
- **Corpus extensions, addition-only and diff-verified** (all 25 pre-existing generators byte-identical, seeds identical): `makeNoise` ×10k (closes the module-1 recorded gap) and `crossGenome_uncorrelated` ×10k (closes the module-11 blind spot — the size-mutation branch is finally value-pinned). Root gate `npm run goldenseeds`: PASS, 27 generators / 198,000 cases. This workspace is the
port itself; everything else under `port/` is plan, evidence, and decisions.

```
npx vitest run        # the parity suite — ~72,000 golden cases + fingerprint probes
npx tsc --noEmit      # strict typecheck (also run in apps/game for the slice)
npm run smoke         # the slice in a REAL browser — Gate D loop, zoom ladder,
                      #   charter gate, Gate-C import rehearsal, the PHONE leg
npm run proofsheet    # the art+sound verdict sheet (golden vs slice, one page)
```

Layout per `PORT_MASTER_PLAN_v4.0.md` §18: `packages/domain/<module>/`. Toolchain pinned
exact: typescript 7.0.2 · vitest 4.1.10 · @types/node. Isolated from the game's dependency
set — `tools/deps.pinned.json` stays acorn + jsdom.

## The port rule (Gate B: "preserve exact JavaScript numeric semantics")

**Function bodies are v1.8.9 source VERBATIM; only types are added.** `|0`, `Math.imul`,
`>>>`, `/4294967296` are the determinism contract. A "cleanup" that passes typecheck can
still shift every world in the universe. When in doubt, don't touch the body — the fixtures,
not the type system, are what pin behaviour.

## Two ways a module gets here

| | When | How |
|---|---|---|
| **Hand-port** | Small modules (≲100 lines) | TS directly in `src/index.ts`, bodies verbatim + annotations |
| **Lift** | Everything else | `node tools/lift.mjs <ModuleName> packages/domain/<name>/src` — byte-verbatim extraction with auto-detected imports, source line range + body sha in the header, **DO NOT EDIT** marker. Typed surface = `index.ts` + hand-written `.verbatim.d.ts` |

⚠ **Register each new package's exports in `lift.mjs`'s `REGISTRY`** — auto-import detection
depends on it, and several rows are still placeholders.

## Parity: two fixture sources, one rule

- **`tests/parity.ts`** — golden-seeds (`port/baseline-v1.8.9/golden-seeds.json`): volume.
  canon + FNV implemented from the fixture's *own documented spec*; if this file and the
  capture probe ever disagree, **the fixture wins**.
- **`tests/baseline.ts`** — the 50-probe fingerprint (`tools/baseline.json`): breadth.
  ⚠ Values are stored as **JSON strings** of the sanitized value — compare
  `canon(ours) === storedString`, never deep-equal.

Test recipes must mirror `tools/probe.js` / `tools/goldenseeds-probe.js` **exactly** — the
call shapes are part of the fixture contract.

**Negative-control every new module once**: perturb a constant → parity must fail *naming
seeds* → revert → green. This caught two lifter bugs and one false "10 passed" (a
syntax-broken test file is silently not collected — **count the test files, not the tests**).

## Module status

| # | Module | Parity | Notes |
|---|---|---|---|
| 1 | rand | 30,000 golden | makeNoise/clamp/mix not fixture-covered (recorded) |
| 2 | worldconfig | constants probe 0–6 | indices 7–9 are app-layer, later |
| 3 | naming | names probe ×7 groups | speciesName slot closed by module 8 |
| 4 | starcatalog | starClass ×10k + probe | |
| 5 | planetgen | planetParams ×10k + probe | surfaceColor pinned transitively via Descriptors |
| 6 | worldgen | systemFor ×1k + 6 probes | ⚠ `systemSol` probe **deferred**: fingerprint value encodes probe-order mutation (`_pal` cached by descriptor probes onto memoized P). Descriptors owes the replay. `slimGal` carried here temporarily (main.js:3014). |
| 7 | surveyphrases | climateBand ×1k | phrase builders pinned via planetDescriptor later |
| 8 | speciestraits | 30k golden + 3 probes + **the 9g invariant guard** | GRADE_TIERS collapse finally has a test |
| 9 | genome | 71k golden (makeGenome ×4 kingdoms, speciesGrade, sapienceTier, classifyRealm, guardianFor, describeSpecies) + 7 probes | **9g part 2**: the collapse now guarded END-TO-END through speciesGrade incl. forced apex tiers 12–14. lift.mjs REGISTRY rows for surveyphrases/speciestraits/genome filled (were placeholders) |
| 10 | encutil | independent-truth (Node Buffer b64 as second implementation + hand-computed shade values) | ⚠ no fixture samples EncUtil directly — recorded in src; b64 pinned transitively when CombatCore's codec probes land |
| 11 | genetics | crossGenome ×10k + crossGenome/evolveGenome probes + outcome invariants | ⚠ **NEW FIXTURE BLIND SPOT FOUND**: the golden recipe's consecutive parent seeds (s, s+1) collapse the mutation draw — the size-mutation branch is NEVER executed across all 10k cases (color 80% · trait 12.5% · size 0). Uniform with uncorrelated parents, so the game is fine; the corpus is not. Remedy queued for Gate B: ADD an uncorrelated-pair generator (never re-capture). Until then the invariant suite covers the branch with hashed-seed pairs |
| 12 | ecology | planetSpecies probe (⚠ VACUOUS BY CAPTURE — probe.js passes level=2 vs string levels, stored value is literally `[]` since v1.0) + outcome invariants | ⚠ salt-perturbation negative control PASSES today (measured — no value pinning until planetDescriptor ×1k lands with module 13). COSMIC_EPOCH reads 0 in the lift (= capture condition); app layer wires the real epoch in Phase 2+. ★ `biomeFor` (golden ×1k) lives at main.js:10824 OUTSIDE the 14 domain modules — slimGal-style relocation, queued for Gate B |
| 13 | descriptors | planetDescriptor + starDescriptor ×1k each (heavy) + 6 probes + **★ the systemSol REPLAY (deferred since module 6, now closed byte-for-byte)** | App hooks: `installCaptureHooks()` installs the capture-environment stand-ins (thumb stubs pinned to jsdom's `data:image/png;base64,`; planetThumb replays the `_pal` gas-palette cache; verbatim carries of `_cardFactsSet`, `_EARTH_NAMES`/`_earthNamePass` (631/334/27/22 roster), GAL_KIND — machine-extracted by `tools/lift-apphooks.mjs`). slimGal RELOCATED here from worldgen (thread closed). ★ FOUND: worldgen's `galaxiesInCell` read free `GAL_SPRITES` — no fixture cell is populated, so it was green while every REAL cell threw; hooked + real-input test added. Ecology's salt hole VERIFIED closed (0xB105 perturbation now fails 2 tests here) |
| 14 | combatcore | battleStats ×1k + 6 probes + **code-fixtures**: share/champion codes over the 23-genome adversarial corpus, normGenome hardener, cleanName | `@cf/domain-strays` founded (`tools/lift-strays.mjs`): cleanName carried verbatim (decodeCreature calls it; code-fixtures pins it). App-coupled exports (playerAvatar/statBlockHTML/…) documented as needing hooks. ⚠ whereCodes + sanitizeSavedGenome fixture buckets await the Gate B strays (encodeWhere/_sanitizeSavedGenome) — recorded in the test file |

**Then Gate B close-out:** no-DOM-imports lint · SessionRNG (reviewer §2.1) · extend the
golden corpus with a noise generator (an intended *addition*, never re-capture-to-pass) ·
full 25-generator sweep from TS.

## The port lesson worth carrying

Memoized generators make **call order observable state** — the fingerprint's `systemSol`
proves it. The TS port should either not share cached objects across callers or never
mutate them after creation.
