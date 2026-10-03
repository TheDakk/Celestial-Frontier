# D31 cast attack for limbless / sessile families — 2026-10-02

Decision D31 (Dakk, 2026-10-02, `audits/MAILBOX/DECISIONS.md`): annelid, sessile-filter, gastropod
(and bivalve, same gap) fight with a CAST attack — the ability-theme effect launched from the body,
no melee lunge, a small whole-body pulse as the attack. Branch `anthropic/next-cast-attack`
(side branch; not merged into `anthropic/mac`, not pushed).

## What was broken

The C186 films (`audits/FILMS_C186_20261002/{01-earthworm-direct,02-sponge-direct,04-banana-slug-visible-mouth}.log`)
threw `motion: no admitted <family> melee for weapons []`: a melee theme (wild/stone/sand) made
`buildTurnPlan` ask `makeClip(attacker, 'melee')`, and these families have no melee verb.

## What changed (code)

- `port/v2/apps/game/src/motion/cast-attack.ts` (new): `CAST_ATTACK_FAMILIES` (annelid → body centre;
  sessile-filter → `aperture`; gastropod → `mouth`; bivalve → `siphon`), `castAttackOf(card)` (null for
  every other family, a portrait, or a card with an admitted melee verb), `castAttackAction(card, action)`
  (the pulse; identity for every other action/family).
- `motion/timeline.ts`: `buildTimeline` runs `castAttackAction` after the sprawler/axial authors; note
  `cast-attack:d31-body-pulse-v1` when it applies.
- `battle2/choreography.ts`: with no anatomy attack and a D31 attacker, the plan's delivery is `cast`
  whatever the theme (the melee clip is never looked up); `plan.castAttack` is present only then;
  anchoring labels `cast-emitter` / `body-centre`.
- `battle2/stage.ts`: `#anchoredPlan` probes the declared emitter on the posed rig at the launch beat,
  else the painted box centre carried by the stage displacement; reasons are labelled.
- `battle2-wiring.ts`: the side's attack label reads `cast body pulse (D31 cast: …)` instead of the
  generic family-delivery label.

The pulse: kit §5 cast phases (rise 180 / hold 120 / release 90 / settle 220, × mass class, bounded
0.6×..2.0× by the existing `phaseDurations`); kit §6 by body material (slick/warty → 12° gather spread so
the whole chain turns ≈ 24°, release by the 4 % stretch, .15 overshoot on settle; translucent two damped
wobbles; rigid materials no stretch, dead stop). The rig pose has no scale channel, so "squash" is the
gathered curl plus a root lift of half the stretch (mobile bodies only; anchored root/base stay fixed).
Directions come from the record's landmarks (first-order kinematics), never a species name: mobile
bodies gather UP; the upright anchored sponge leans away from the target, then through rest toward it.
All values stay inside existing limits (`tl.clamped` is empty on all three fits). No outcome, reward,
RNG, weapon, melee row or limit changed.

## Tests (`port/v2`)

- New `apps/game/src/battle2/cast-attack-d31.test.ts` (7 tests) on the three real C186 fits through the
  real transcript adapter + stage + choreography + effect schedule: the wild (melee-theme) turn plays as
  a cast, no throw; `buildTimeline(card,'melee')` still refuses (nothing invented); outcome/number
  unchanged; impact − action start = scaled rise+hold+release; launch within 3 px of the DRAWN mouth /
  aperture joint, or of the drawn keyed-alpha box centre for the worm (independent of the stage's own
  centre code); impact on the target body; the travel slides; drawn-rig pulse direction and size;
  every sample inside limits, rigid joints still, anchored root still; mass scaling for all six classes;
  material settle variants; every non-D31 family/action returns the authored clip object.
- Before/after fingerprint (`fingerprint/fp-before.json` at the parent commit's sources,
  `fingerprint/fp-after.json` with D31): 362 entries (every action of every specialized synthetic
  template, Civet, five crabs, plant fixtures, the three D31 fits, plus Civet/portrait turn plans for
  melee and cast). Exactly 7 differ: the `cast` of synthetic bivalve/gastropod/annelid/sessile-filter
  and of the three D31 fits. Every other family is byte-identical.
- `npm run typecheck`: clean. motion + battle2 + wiring + anatomy-attacks: 43 files, 470 passed + 2
  expected fail. Whole `apps/game/src`: 118 files passed (1 skipped), 994 passed + 2 expected fail + 1 skipped.

### Negative controls (code broken on purpose, then restored byte-for-byte)

| Break | Result |
| --- | --- |
| Plan keeps `input.delivery` (no D31 switch) | 4 tests fail with the exact C186 error `no admitted annelid/sessile-filter/gastropod melee` |
| Pulse direction sign flipped | pulse test fails: the worm's joints sink (mean y 0.556 vs rest 0.502 of the cut-out) |
| Stage cast-launch branch disabled | 4 tests fail: launch `fallback` (legacy stand point) |
| Wrong anchors (emitter probe on `root`; body centre at the ground line) | 4 tests fail: launch 48.6 / 189.6 / 158.6 px from the drawn emitter/body |
| `castAttackAction` always identity (old clip) | 6 tests fail; with the old generic cast the worm's body moved DOWN (mean y 0.536) |

In-test controls: a forged stand launch is caught by the same mouth check; the same worm body under a
non-D31 family (larva) still throws the C186 error; a sponge record without `aperture` falls back to
the body centre with a labelled reason.

## Native films (`CF_CPU_THROTTLE=4`, C186 fits and scripts; script themes A wild, B stone)

| Film | Status | Capture | Notes |
| --- | --- | --- | --- |
| `01-earthworm-direct` | DIAGNOSTIC_PASS, refusals 0/0 | 713 frames, cpu p95 2.1 ms, frame Δ p95 16.8 ms | effect impact at 390 ms after action start |
| `02-sponge-direct` | DIAGNOSTIC_PASS, refusals 0/0 | 713 frames, cpu p95 2.2 ms, frame Δ p95 16.8 ms | lake world (placement routes the sponge to water) |
| `04-banana-slug-visible-mouth` | DIAGNOSTIC_PASS, refusals 0/0 | 713 frames, cpu p95 2.4 ms, frame Δ p95 16.8 ms | |

The runner prints its own `attacks` label ("family delivery clip (Attack anatomy: no admitted move)")
from its harness code; the turn itself is the D31 cast. The runner loads only the wild effect, so stone
turns (turn 1, B) draw no effect. Report paths were rewritten repo-relative. As with the C186 films,
only report.json and the read stills are tracked; the webm and the other stills stay local (`.gitignore`).

Full frames read:
- Earthworm `turn1-hit-reaction-50`: the right worm has advanced (stage run-up) almost to the left
  worm; the left worm is mid hit-reaction, its far end flicked up; faint particles around its tail;
  damage "6" sits high above the left worm. Both bodies are whole, no seams or detached segments.
  `turn3-hit-idle-90`: both worms back at their stands, lying in gentle S-curves on the mud, whole.
  `turn0-hit-impact` (extra): the white flash with the wild burst landing on the right worm's body.
- Sponge `turn1-hit-reaction-50`: lake world, both sponges mid-water; the right sponge has slid across
  to the left one (the stage's existing caster run-up — see below); bubble particles around the left
  sponge; damage "6" above. `turn3-hit-idle-90`: both upright at their stands, intact.
- Banana Slug `turn1-hit-reaction-50`: the right slug has advanced with its head and eye stalks raised;
  the left slug is in its hit reaction, head pitched down-forward, particles near its mouth; whole
  bodies. `turn3-hit-idle-90`: both slugs at rest facing each other, heads up, intact.

These are diagnostic films, not visual acceptance.

## Follow-up: anchored casters cast from their stand (main lane decision, 2026-10-02)

The main lane accepted the recommendation: an ANCHORED caster gets no run-up and casts from its stand,
because fixed organisms never move (CREATURE_ANIMATION.md). Mobile casters (worm, slug) keep the
stage's existing run-up. `castAttackOf` now carries `anchored` (from the specialized template). With it,
`buildTurnPlan` sets the run-up to 0, so approach, action and return add no displacement. The reason
label adds "anchored: casts from its stand, no run-up". Commit `dd9668e83`.

- New test (8th in `cast-attack-d31.test.ts`): it samples 201 frames through the whole turn on the real stage.
  The sponge's holder stays within 0.5 px of its stand, and its drawn `root`/`base` joints stay within 0.5 px.
  `plan.runUp` is 0. The worm and slug still travel (run-up 0.05 of the frame, holder moves > 20 px).
- Negative controls:
  - Ignoring `anchored` fails the test with runUp 0.145.
  - With the runUp assertion also removed, the drawn-position check alone still fails: the holder moves
    148.7 px.
- Fingerprint re-run (`fingerprint/fp-anchored.json`): identical to `fp-after.json`. Against the parent
  sources only the same seven D31 `cast` rows differ.
- Typecheck clean. Motion + battle2 + wiring + anatomy-attacks: 43 files, 471 passed + 2 expected fail.
- Film `02-sponge-direct-anchored` (same command, `CF_CPU_THROTTLE=4`): DIAGNOSTIC_PASS, refusals 0/0,
  713 frames, cpu p95 2.0 ms, frame Δ p95 16.7 ms. runUp 0 on all four turns, and the effect impact
  is 390 ms after the action start.
  - `turn1-hit-reaction-50`: lake world. The right sponge (attacker) stays upright at its own stand.
    The two sponges are now a full stand-width apart, where the earlier film had them touching. The
    left sponge is mid hit-reaction, ringed by bubble particles, with a "6" above it.
  - `turn3-hit-idle-90`: both sponges upright at their stands, intact, nothing detached.

## Unfinished / for Dakk

- The anchored-approach question above is resolved: the sponge no longer slides. The original
  `02-sponge-direct` film is kept as the before state.
- No bivalve fit exists. Bivalve is covered by synthetic contract tests only.
- The native runner's `attacks` label does not use the wiring's new cast label.
- The runner films only the wild effect, so these films do not show the stone theme.
