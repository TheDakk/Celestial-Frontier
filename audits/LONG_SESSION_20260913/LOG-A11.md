# A11 — Family motion templates beyond quadruped (Claude lane) — 2026-09-13

Status: built and green on the mechanical gates; awaiting Nick's review. Not committed (Nick commits after review). No GitHub step. No `Math.random`, no clock: the only seeded value is the idle/sway period through `mulberry32`.

## What was built

| File | Owns |
|---|---|
| `port/v2/apps/game/src/motion/family-templates.ts` (new) | Nine template registry entries as data (graph, joints, limits in degrees, secondary chains with a §6 `kind`, proportion envelope, `bodyAxis`), `TEMPLATE_BY_FAMILY` + `templateIdForFamily()` (painter/rig family and flora architecture → template). |
| `port/v2/apps/game/src/motion/family-actions.ts` (new) | §4 libraries per template in the same degrees/body-length table style as `actions.ts`; generic phase-shaped builders (melee/cast/hit/dodge/faint/victory/tame/feed/loop4) so each family is one object of joint dictionaries. `ACTIONS_BY_TEMPLATE`, `actionsFor()`, `templateGaits()`, `templateMelees()`, `MELEE_ALIAS`. |
| `templates.ts` | Type widening only (`id: 'quadruped' \| FamilyTemplateId`, optional `bodyAxis`, optional `SecondaryChain.kind`) and the registry spread `{ quadruped, ...FAMILY_TEMPLATES }`. **Quadruped data lines untouched** (snapshot-tested: template JSON fnv1a `1b2c6e05`/2928 chars, actions JSON `477b9ea0`/15155 chars, action id list). |
| `body-card.ts` | Family routing (record `family?` → template; disagreement with `template.id` refuses `family-mismatch`; unroutable family refuses `unsupported-template` with the labelled fallback), exact joint-inventory check in both directions (`missing-landmarks` names the joint and the inventory size; foreign landmark names refuse `joint-inventory`), generic part groups (`wings`, `fins`, `antennae`, `fronds`, `arms` added), body length from the template's `bodyAxis`, template gait from the library's `approach:*` verbs with a per-family fallback map, natural weapons per template, plants carry no weapons and `templateGait: 'none'`. Materials stay record-first (unchanged CONTRACTS §5 path). |
| `secondary.ts` | `CHAIN_RULES` by chain kind (wing/tailfan flutter 60 ms when feathered, fin lag 50 ms + overshoot 0.10, antenna quiver 40 ms, frond lag 50 ms per segment, bell wobble 120 ms, arm lag 60 ms). Rigid materials keep sharp stops (chain lag/overshoot not applied). Medium damping/bob rows unchanged (aquatic ×0.75 + drift, aerial 1400 ms bob). `kind`/`flutterMs` are emitted only when a chain declares a kind, so quadruped timelines are byte-identical. |
| `timing.ts` | Plant verb phases added: `sway` (seeded period, loops), `disturb` recoil 120/settle 260, `harvest` shake 180/detach 90/settle 220, `grow` rise 320/overshoot 120/settle 160 — A11 defaults, not kit rows. |
| `timeline.ts` | Action lookup through `actionsFor(template)`; melee resolution through the template's verbs plus `MELEE_ALIAS`; `sway` uses the seeded period like `idle`. Quadruped resolution order and the "bite used" note are preserved. |
| `tools/motion-proof/synthetic.ts` + `write-synthetic-fixtures.mjs` + `fixtures/*.synthetic.{landmarks,genome}.json` (new) | SYNTHETIC records (hand-placed normalized landmarks that satisfy each envelope; ownerId/speciesVisualKey/cutoutAssetHash all say `synthetic`). The tests assert the JSON on disk equals the generator. |
| `tools/motion-proof/pose-sheet.mjs` | Renders any registered template (chains, fins, wings, antennae, fronds as bones coloured by group); `--actions=` flag; defaults quadruped idle/melee:bite/hit, other fauna idle/approach/melee/hit, plants sway/disturb; per-cell caption now shows dx/dy/root and the two largest joint rotations; synthetic records are labelled in the header. |

Size: 675 lines in new files + 112 inserted / 48 deleted in existing ones (≈ 790 lines of code and tests; fixture JSON is data).

## Joint names (stable strings for Codex's observer)

All templates: `root` is implicit and is the whole-body pivot. Graph pairs are `[child, parent]`, parents first. A pose key names the bone by its child joint; + is clockwise for a right-facing body (a backward-pointing wing therefore LIFTS with +).

| Template | clipSetId | Joints (count incl. root) |
|---|---|---|
| hopper | hopper-land-v1 | the quadruped inventory verbatim (31): pelvis spine chest neck head jaw · {hind,fore}{Far,Near}{Root,Knee,Ankle,Paw} · tail0..3 · ear{Far,Near}{Root,Tip}. Hind Knee/Ankle limits ±110 (fold and fire), root ±30. |
| biped-bird | biped-bird-v1 | (19) pelvis spine chest neck0 neck1 head beak · leg{Far,Near}{Knee,Ankle,Foot} (knee hangs from pelvis; three bones) · wing{Far,Near}{Root,Tip} (from chest) · tailFan (from pelvis) |
| fish | fish-aquatic-v1 | (14) head jaw · spine0..spine5 (spine0 from root, running tail-ward) · caudal (from spine5) · dorsal (from spine1) · pectoralFar pectoralNear (from root) |
| insect | insect-v1 | (21) thorax head mandible abdomen · leg{Front,Mid,Hind}{Far,Near}{Knee,Foot} (from thorax) · antennaFar antennaNear (from head) · wingFar wingNear (from thorax) |
| serpent | serpent-v1 | (13) head jaw · seg0..seg9 (seg0 from root; seg7..9 are the lagging tail chain) |
| arachnid | arachnid-v1 | (22) cephalothorax abdomen sting · cheliceraFar cheliceraNear · leg{1,2,3,4}{Far,Near}{Knee,Foot} (from cephalothorax) |
| radial | radial-v1 | (21) centre bell · arm{0..5}Seg{0,1,2} (from centre; arms 0/2/4 hang right of centre, 1/3/5 left, so `splay(+)` opens all six) |
| plant-woody | plant-woody-v1 | (11) trunk · branch{0,1,2}{Base,Tip} (from trunk; branch1 grows left) · leaf{0,1,2} (from the branch tips) |
| plant-herb | plant-herb-v1 | (17) stem{0..3}Seg{0,1,2} (from root; even stems lean right, odd left) · frond{0..3} (from Seg2) |

Landmark records must carry exactly this inventory (Codex's `checkGeometry` already enforces exact inventory for quadruped; the compiler now enforces it for every template and names the offenders).

## Action verbs per template

Fauna (all seven): `idle` (loop, seeded period), `alert`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, plus:
hopper `approach:hop`, `melee:kick` / `melee:bite` · biped-bird `approach:walk` / `approach:flight`, `melee:peck` / `melee:claw` · fish `approach:swim`, `melee:bite` · insect `approach:crawl` / `approach:flight`, `melee:mandible` · serpent `approach:slither`, `melee:strike` / `melee:constrict` · arachnid `approach:scuttle`, `melee:sting` / `melee:bite` · radial `approach:drift` / `approach:pulse`, `melee:sting-arms`.
Plants: `sway` (loop), `disturb`, `harvest`, `grow`.
Weapon aliases (card weapon → verb): insect bite→mandible, serpent bite→strike, radial sting/tail/bite→sting-arms, hopper claw→kick. FA_LOCO gait fallbacks: glide/fly→flight (bird, insect), jet/swim→pulse (radial), jet/drift→swim (fish), crawl/swim→slither (serpent), crawl/walk/cling-crawl→scuttle (arachnid); anything else falls to the library's first gait with a note.

Strong poses (tested): hopper kick fires the near hind chain −105°/+95°; bird peck drives neck0/neck1 +35°/+30° at 0.30 BL; serpent strike opens the jaw 42° at 0.48 BL; arachnid sting curls abdomen 62°/sting 68°; hop launches at −0.18 BL with hind knees −70°; bird flight flaps wingRoot +65°/−45°.

## Tests — `port/v2/tests/motion-families.test.ts` (17) + retargeted controls in `motion-body-card.test.ts`

Registry completeness for the A11 scope and an explicit gap assertion (kit §4 `myriapod`, `cephalopod`, `flyer-membrane`, `primate` still resolve to the labelled fallback); closed joint inventories (limits for every joint, parents first, chains and body axis inside, ≤ 32 bones); quadruped JSON snapshot; family routing table; fixture-vs-generator equality; every template compiles inside its envelope with the expected gait/weapons/material/part count and budget; family routing without `template`, `family-mismatch`, unroutable family; inventory refusals by name in both directions; one negative control per template (the next template's landmarks relabelled are refused) plus the one legal cross-family case (civet record as hopper) and its kind check; verb sets per template; every key of every action names only inventory joints, uses frozen eases, sits inside limits at its extremes, builds with zero clamps, is deterministic (same JSON and hash twice) and samples finite; clock negative control (spies throw); approach/melee resolution incl. aliases and the "bite used" note; strong-pose numbers; seeded non-integer idle/sway periods differing across two seeds for every template; mass scaling exactly `clamp(mass, 0.6, 2.0)` for all six classes; §6 chain-kind numbers and a quadruped no-`kind` control; the pose sheet renders a plant and a fauna template from the fixtures.
Two existing negative controls used `serpent`/`hopper` as *unknown* templates; they now use `myriapod`/`primate` with identical assertions (no assertion weakened).

## Gates

- `cd port/v2 && npm run typecheck` — exit 0.
- `npx vitest run tests/motion-` — 54/54 (5 files).
- root `node tools/validate.js` — PASS (render audit 1010 clean, boot errors 0, fingerprint 50/50).

## Evidence

`audits/LONG_SESSION_20260913/a11-family-sheets/<template>.pose-sheet.svg` (+ `.body-card.json`, `.timelines.json`) for all nine templates; byte-identical on re-run (sha256 checked for serpent). Timeline hashes: hopper idle 45eac3c7 hop 988f582d bite 51a63f42 hit d003485d · biped-bird 01379fab / flight bd1bac20 / peck 4e1d556c / 3eb2477a · fish 4d3d7d3a / swim 1e06ce9a / bite 864ff036 / c6595ba9 · insect 746ec4ca / crawl d94f4c81 / mandible 81ed144c / 6f10a4d7 · serpent aa02fbb7 / slither 0833e37e / strike f47963de / 3ac699fd · arachnid ef9a3d22 / scuttle bed7fa27 / sting 11e44a45 / 39db0764 · radial 080a47bc / drift 507b14d7 / sting-arms 39777606 / 984f2e40 · plant-woody sway 49f6e561 / disturb 0cc5389e · plant-herb sway 28db9aaa / disturb ca75639e.
Quadruped regression: re-running the civet sheet gives `.timelines.json` byte-identical to the committed A1 evidence; the `.body-card.json` differs only by the five added material-group keys. The A1 *procedural* timelines differ, but that predates A11 — they were captured before A6 (26cae070) made the record the material owner (`fur` now wins over the genome's `translucent`, as `motion-body-card.test.ts` already asserts).

## What is approximate / open

- Landmarks are SYNTHETIC: hand-placed to satisfy the envelopes so the libraries could be proven mechanically. They are not painter output and prove nothing about anatomy fit; each template still needs its proof creature plus two reuse controls (kit §4) once Codex's observer emits these names.
- Plant materials: the kit has no bark/leaf material, so the fixtures use `warty` (bark) and `slick and wet` (herb). Rigid materials (plated/chitinous/crystalline) on a plant would suppress frond lag by design.
- Plant verb durations, hopper/insect/arachnid gait timings (all on the 420 ms stride) and every pose number are A11 defaults for Nick to tune in the one table; nothing is visually accepted.
- Chain rotations accumulate base→tip, so authored coil/curl numbers on long chains (serpent, radial arms, herb stems) read larger than any single key; the serpent anticipation was softened once for this.
- `templateGait`/`gait` for plants: `gait` still reports the genome-derived value ('walk' by default) while `templateGait` is `'none'`; harmless but worth a glance.
- Four kit §4 templates remain unbuilt and labelled: myriapod, cephalopod, flyer-membrane, primate.
- The pose sheet's per-cell caption changed (top-two joints instead of jaw/head/tail0); the committed A1 SVGs are not regenerated.
