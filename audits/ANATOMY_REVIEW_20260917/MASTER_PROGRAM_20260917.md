# Celestial Frontier — the full vision, planned and gated (2026-09-17)

Author: Claude (anthropic lane), from Nick's restated vision of 2026-09-17. Status: **PROPOSED** —
a doability assessment and dependency spine, not an authorization. Nothing here changes kits,
lanes, PR42, hosted authority or the R1b/R2b stop. Decisions D1–D4 are Nick's.

## 0. The vision, distilled (Nick, 2026-09-17)
The best life system in games — flora and fauna beautifully generated in an infinite universe,
infinite combinations, infinitely fun every time. Every anatomy part animates smoothly. Iconic
biomes. Battle scenes with masterfully drawn guardians. Conquest, loot with the best-looking icons,
a balanced stat system, ultimate crafting, breeding as the chef's kiss. Art direction is the holy
grail. AI generation makes the combinations unprecedented and must work no matter the combination.
Phone budget may be exceeded for the finisher (Nick, 2026-09-17).

Standing rules that make "infinite" safe (all already in force): determinism (seed → same
organism, same painting, same rig, same stats, on every device); one painted hand (Art Kit v4.3);
one interpreter per kit (Motion Kit, Sound Kit); the painter owns composition and counts, AI is a
masked low-strength finisher; originals are retained pixels; every instrument carries a negative
control in both directions; Nick's eye on every new image class and every 12-artwork sheet.

## 1. Doability verdict by pillar

| # | Pillar | Proven today | Built, not proven | Not started | Hardest risk → mitigation |
|---|---|---|---|---|---|
| P1 | Life system: infinite flora/fauna | 1,014 Earth names + procedural genome; 14 painter families; 1,250-case raster census; 11 accepted masters; nonlethal breeding rules | 5 crab + 3 flora rigs; 12 observed of 58 missing bodies | Finished (AI) look for *procedural* organisms (R9); 53 unbound bodies | Finisher altering anatomy counts (Sept-10 finding) → painter composition authority + masked 0.35 finisher + silhouette-conservation gate |
| P2 | Every anatomy part animates | Shared skin (ARAP+pins), contact solver, 14 family + 13 specialized templates, 169 actions, count-preserving appendages, seam/shape/root gates | Readable motion (R1b/R2b pending), flora shape, CPU on flora | 53-species roster; view rigs | 2D cut-outs cannot turn or flip out of plane → side-view staging (decided) + mirrored source; out-of-plane only via later view rigs |
| P3 | Iconic biomes | 43 live biomes; painted landfall engine baseline (cd6b609f); Rain E weather; 93+315 Earth biome packs authored | Weather ladder 2; per-biome plates beyond Earth temperate | 43 biome-family plate sets | Cost per plate → library rollout by class, 12-per-sheet gate, retained originals |
| P4 | Battle scenes | Arena v4.2 three-plate proof (Earth temperate) accepted; Effects class; Motion Kit timing (hitstop/flash/shake/numbers); seeded emitter; habitat compiler; anatomy attacks table | Performance owner, contact solver, pinch clip — **zero runtime consumers** (E1) | battle2 integration; 43 arena families; 11 theme effect sequences | The whole rig stack is study-only → E1 is the anthropic lane's next program (Track B) |
| P5 | Guardians | v1 rules: `guardianFor`, apex raw grades 12–14, Paragons, conquest flow; kit THE GUARDIAN RULE (1536 square, fills the screen) | — | No guardian painted or rigged; no boss choreography | A guardian is a source-owned apex creature → same templates at 1536, same pipeline; first one is a proof, not a new system |
| P6 | Loot icons, stats, crafting | v1 economy/crafting/sockets/relics; v2 loot-usability contract (Arc 2 subset); kit classes 4I items, 4J emblems; five-stat budget + abilities | — | Icon library (62 items, 55 abilities, status); balance pass with 11 themes; crafting UI parity | Balance drift when new abilities/effects land → one seeded duel-outcome battery per balance change |
| P7 | Art direction | Kit v4.3 frozen style; 12 masters; engine painting baseline; arena/effects classes | Consistency of finisher output across classes | Guardian class rollout; people (inactive) | Reference-finish leakage (Sept-10) → in-situ references, style-anchor plate; never name illustrators |
| P8 | AI generation, infinite combos | Deterministic painter → masked finisher; seed-bound retention; precomputed text embeddings; 24 s warm desktop | Fidelity at scale (counts) | Phone finisher (now: not required — D1) | Time per organism → finish on first encounter, retain forever; desktop finisher; phones download originals |
| P9 | Breeding | v1 `breedPair` rules; v2 nonlethal individual-parent breeding with recovery (DECISIONS) | — | Offspring through painter → finisher → rig with mixed genomes | Offspring must animate "no matter the combination" → the count-preserving anatomy contracts are exactly this; add a bred-offspring rig proof |
| P10 | Infinitely fun loop | v1.8.9 shipped loop; v2 Phase-4 slice playable | — | — | Not a technical risk; a content-cadence risk — Track C/D |

**Verdict:** doable, on the architecture already chosen, with three honest limits:
1. "Every anatomy part" can be *inspected* only per template and per Earth owner; procedural
   coverage is by contract tests + census sampling, never by eye on 3×10⁸ silhouettes.
2. Out-of-plane motion (turns, leaf flips) is not a 2D cut-out capability; side-view battles are
   the design, view rigs are a later program.
3. "Works no matter the combination" holds only while the painter owns composition and the
   finisher is masked and low-strength. A free-form generator would break counts. Keep it.

## 2. Dependency spine (five tracks, one order)

**Track A — Codex lane, rigs and coverage (current):** R1b/R2b (N1–N4, N11, N12) → eight subjects +
Civet sentinel → R3 (pinch reachable) → R4 (frame-refusal policy) → **R9 finished textures for
procedural creatures** (five crabs: masked finisher on painter master, silhouette-conservation gate,
masks transfer, rebind) → R5/R6/R7 integrity → R8 phone tier (per D1) → the 53-body roster in
source-family batches (annelid, bivalve, gastropod, small crustacean, clawed crustacean…) through the
same shared pipeline, each batch ending in a native eight-style capture and Nick's eye.

**Track B — anthropic lane, battle2 integration (E1), after Track A's R3 lands on develop:**
performance owner + contact solver in the battle scene; anatomy attack → damage/effect/audio events
with contact-phase timing; CT/FF6 choreography from Motion Kit constants (timing bar, run-up <0.5 s,
hitstop, flash, shake, numbers, victory/faint); procedural arena (three plates per biome family, seed
from battle context, home/visitor rule); reduced-motion path; cleanup/cancellation; duel-outcome test
that pays (the law: assert the outcome, not the code path). Then **guardians**: first apex at 1536 on
the same rig pipeline, boss choreography as a Motion Kit addition (approved before use).

**Track C — art library, Nick's eye (parallel, kit-owned):** arenas (43 families → 3 plates),
effects (11 themes), items (62), emblems (55 abilities + status), ships (4), first guardians; every
class enters through the 12-per-sheet review stop; retained originals; no illustrator names.

**Track D — systems (parallel, mostly anthropic):** stats balance pass against the 11 themes and
effect timings (seeded duel battery); crafting/loot UI parity with the v2 contract; **bred-offspring
proof**: two rigged parents → deterministic offspring painted, finished and rigged, every count
preserved.

**Track E — delivery:** PR42 split (UI / engine / tools) → develop via merge commits; Compendium
producer certificate refreshed by measurement (never a pin edit); LFS decision; storage durability
(persist + export); one authorized develop → main release with the full chain.

## 3. Gates — what "done" means

| Pillar | Gate (numeric, must pass) | Gate (Nick's eye, must pass) |
|---|---|---|
| P1/P8 | seed → byte-identical painting on two machines; finisher silhouette conservation; anatomy counts equal before/after finish | 12-per-sheet review per class |
| P2 | per-template outcome tests (contacts, readability floors, no folds, exact rest); per-clip p95 < 2 ms desktop; phone tier per D1 | films at 25/50/75 + ten-second continuous, for every Earth owner and one procedural per template |
| P3 | 43 arena/biome sets exist with hashes; weather compiler resolves every profile | plate review per family |
| P4 | duel-outcome test pays; hitstop/flash/shake within kit constants; no exception reaches the scene | one full battle film per biome family |
| P5 | guardian rig passes the P2 gates at 1536 | guardian sheet |
| P6 | balance battery: win-rate spread across themes within budget; crafting round-trip determinism | icon sheets |
| P9 | offspring determinism + count preservation across 1,000 seeded pairs | bred-offspring films |

## 4. Decisions for Nick
- **D1 Phone tier (recorded from today):** finisher may exceed the phone budget. Proposal: phones
  never run inference; finished originals are delivered as retained PNGs (like landfalls), with the
  painter-only cut-out as the fallback when no original exists yet. Desktop finishes on first
  encounter and retains. *(Recommend: yes.)*
- **D2 First guardian:** one Earth-temperate apex at 1536 through the existing pipeline, before any
  guardian-specific system. *(Recommend: yes; it proves P5 is "same pipeline, bigger".)*
- **D3 Arena rollout order:** by the biome *families* that group the 43 live biomes, Earth temperate
  first (already accepted), then the families with the most Earth species. *(Recommend: yes.)*
- **D4 Track B start:** E1 begins in the anthropic lane as a design document now (no code), and as
  code once R3 is on develop. *(Recommend: design now.)*

## 5. Next concrete steps
1. Codex: finish R1b/R2b per the recorded direction; re-capture; stop.
2. Claude: E1 battle2 integration design (Track B) as a document in this folder — no code until
   the merge order allows it.
3. After the re-capture: R3, then R9 on the five crabs (the first procedural creatures in the new
   direction), then Nick sees finished crabs moving.
4. Track C opens with the arena families and the first guardian sheet, at Nick's pace.
