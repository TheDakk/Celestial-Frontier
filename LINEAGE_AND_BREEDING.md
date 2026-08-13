# Earth Lineage, Breeding & Replayability

> **2026-08-13 v2 next-arc overlay — CURRENT versus PLANNED:** Current lineage
> code owns deterministic ancestry, Earth-scaffold inheritance and portrait
> continuity; it does not yet provide v2 living-creature instances, expeditions,
> bond or a Chronicle. The next arc must preserve the central player-respect law
> below by separating `CatalogSpecies` discovery from stable `CreatureInstance`
> ownership before any companion can leave the roster.
>
> **PLANNED, not implemented:** each creature instance carries a stable nickname,
> lineage, assignment, bounded bond state and an append-only/bounded Chronicle of
> meaningful memories such as first landing, first safe return, a notable battle,
> discovery or offspring. Bond never decays, has no daily streak or expiring task,
> and repeated low-effort actions cannot grind it indefinitely. Its mechanical
> effects are small bounded sidegrades—roles, expressions, dialogue and traversal
> specialties—rather than a mandatory power multiplier; any creature can train
> any role. Expeditions cannot kill, delete, breed or replace the companion, and
> an away/favorite guard is enforced below the UI. Normal v2 breeding likewise
> preserves both living parent instances: child creation grants half the lower
> parent's `fed` and atomically assigns both parents to a bounded active-play
> Recovery that blocks breeding, dispatch and combat until complete. Legacy v1
> parent consumption remains historical parity only. Any future irreversible
> **Fusion** is separately named, optional, informed-confirmed and never required
> for progression. The Chronicle must reference stable creature/world/mission ids
> and remain valid across rename, reload and catalogue deduplication. These are
> design contracts only and remain unavailable in the v2 Guide until implemented
> and outcome-tested.
>
> A later **Expedition Museum** is a player-curated, read-only projection over those
> receipt-backed Chronicle memories, named lineages, selected mementos and world records.
> It does not own a second unbounded history, add a reward faucet, or ask players to keep a
> companion active through streaks or expiring tasks. A companion's story must remain its
> story after a rename, a migration or catalogue deduplication; the Museum may reference the
> stable IDs but never becomes the identity authority.

_Design north star + build status. Matches code as of 2026-08-11 (Platinum repair reviewed).
Companion to `ART_DIRECTION.md` and `PROCEDURAL_CHARACTERISTICS.md`._

> **2026-08-11 Platinum correction:** the hash-bound current-generation review of clean
> commit `79ce144` found that correct inheritance fields, distinct stage hashes, and the
> earlier focused Apple/Vanilla judgments did not prove whole-form generational continuity.
> The exact review is preserved at
> `port/v2/reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md`
> (SHA-256 `5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2`).
> Fruit Bat, Eagle, Wolf, Dragonfly and Octopus failed on abrupt scaffold replacement;
> Chameleon remained HOLD, Elephant needed polish, and Apple, Vanilla Orchid and Oyster
> Mushroom lacked meaningful low-anchor drift. Sea Turtle and Great White Shark passed.
> The repair therefore routes only the seven reviewed fauna rows (those five plus
> Chameleon and Elephant) through their modern exact-name owner and applies deterministic,
> anchor-bounded lineage traits before compositing. Sea Turtle and Great White Shark stay
> on their frozen compatibility route. Apple, Vanilla, Oyster and a new principal Amoeba
> row receive anchor-aware bred branches while pure named portraits remain protected.
> Hybrid evidence schema v4 is 13 lineages ×5 stages /251 assets. Clean source
> `03ea297` supplied the sealed successor; its exact external review returned
> **PASS with optional polish only / APPROVE**. That is a package-level human verdict,
> not proof of every possible bloodline or formal 1,250-row certification.

> **2026-08-10 reset correction:** the v2 override router had been sending bred
> `_earthBlend` genomes through generic procedural painters before the lineage-aware
> Earth owner could preserve their scaffold. The typed genetics facade now stores
> the selected parent's set-qualified owner as `_earthBlendKingdom` without changing
> the lifted inheritance RNG stream. Fauna returns to the lineage-aware HD renderer;
> flora, fungi and microbe blends use the exact kingdom+name owner with the complete
> child genome unchanged. Portrait and thumbnail caches share a canonical key over
> the complete deterministic genome because `A×B` and `B×A` can share a derived seed
> while inheriting different traits. `npm run hybridcheck` verifies final production
> browser pixels across all four kingdoms, duplicate names, both parent orders,
> multi-generation/cache/repeat cases and injected failures.
>
> **Historical bounded result (superseded for the broader Platinum ruler):** the focused
> Apple and Vanilla continuity blockers were independently closed under their earlier scope.
> Vanilla r6 passes at `floraoverrides2.ts` SHA-256
> `5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`.
> Its pure portrait remains byte-exact to
> `3f6834b7f984b35186fa1c441eeb4537d3e5793d446e447b021a1e3687939a25`;
> five stages are unique, preserve defining Vanilla organs, join continuously,
> and drift progressively farther from pure as the anchor falls. The r6 matrix
> validates 234/234 assets and both browser orders. `npm run hybridcheck` now
> requires five exact ID+kingdom+name focused lineages covering all four kingdoms and rejects fourteen
> injected negative controls, including focused-species substitution, simulated Vanilla stage collapse and protected-route controls.
> Schema v2's Green Algae stop was a real harness contract bug, not transient
> provenance; schema v3 repairs current-catalogue vs retained-legacy-route
> ownership and its sentinels are green. These focused results do not certify
> every possible bloodline; routing correctness and distinct hashes alone still
> do not prove that every graft is seamless.

The central rule (Nick): **never make the player choose between keeping a beloved
Earth creature and participating in the alien progression system — the game lets
them do both.** Earth life gives recognizable ancestry & attachment; pure alien
life gives surprise & evolutionary possibility; breeding connects the two without
making either obsolete. The planned v2 implementation makes that literal: normal
breeding never consumes either living parent; its disclosed, bounded Recovery is a
temporary assignment, not loss. Irreversible Fusion, if it ever exists, is an
optional named side mode and not an alien-progression gate.

## Three creature origins

| origin | how it renders | ancestry |
|---|---|---|
| **Pure Earth** | handcrafted Earth rig (`_earthName` → `_earthArt`) | none |
| **Earth-lineage hybrid** | set-qualified Earth owner/scaffold + child palette/traits + compatible drift (`_earthBlend`, `_earthBlendKingdom`) | ≥1 Earth ancestor |
| **Pure alien** | procedural body-plan + phenotype resolver | none |

Pure alien life must stay genuinely alien — it never needs an Earth ancestor, and
it supplies traits Earth lineages can't easily make (radial symmetry, buoyancy,
crystalline metabolism, extreme limb layouts, exotic senses).

## Breeding model — AS BUILT

- **Dominant anatomical scaffold** (not a 50/50 body average): a bred child of an
  Earth parent records the selected parent's exact catalogue owner (`crossGenome`
  sets `_earthBlend` + `_earthBlendKingdom`). The seven Platinum-reviewed fauna
  rows use their modern exact-name owner; protected Sea Turtle/Great White Shark
  and unreviewed fauna retain the compatibility HD lineage route. Flora/fungi/
  microbe use the exact named owner with the child's palette/genes.
  This set-qualified lineage propagates across generations even when the child's
  gameplay kingdom came from the other parent.
- **Organic generational drift (no toggle — "part of the game"):** the Earth-anchor
  strength is set AT BREEDING by the mate's alienness —
  `_anchorVal = clamp(dom − (0.05 + (1−mate)·0.22), 0.22, 0.9)`, where a pure-Earth
  parent = 1.0, a blend = its stored anchor, a pure alien = 0. So **Earth×Earth ≈
  0.90** (stays Earth-like), **Earth×alien ≈ 0.73**, and it **accumulates** each
  cross with alien blood (→ 0.46, …, floor 0.22). Breeding _choices_ are the drift
  control. `hdBeastBare` grafts the child's own phenotype (crest / tendrils / frill
  / dome + dorsal alien spikes + extra ocelli) onto the Earth rig ∝ (1 − anchor),
  so a lion line keeps its feline rig but grows steadily more alien.
- **Ancestry (Lineage) card:** `crossGenome`'s inheritance coin is keyed — it records
  which parent each trait came from (rng-identical → fingerprint-safe). The specimen
  card carries an expandable **Lineage** panel: "Bred from A (62%) and B (38%)…"
  plus a per-trait lookup (Body plan ← Lion, Tail ← Wolf, …). 10 trait categories.
- Everything is fingerprint-safe (Earth-blend-gated; the determinism probe never
  passes an Earth genome). Determinism flow the doc mandates is honored:
  `parents → deterministic coins → dominant scaffold → anchor → phenotype → portrait`.

## Discoverability — AS BUILT

The full 631-fauna / 334-flora Earth catalog is a **naming pool**, but only ~15–25
species spawn on the cradle per visit. A **rare epoch-rotating "vagrant"** (cradle
survey, gated to `epoch > 0` so epoch-0 stays determinism-baseline-identical) surfaces
a different slice of the pool as the cosmos ages, so any Earth species can eventually
turn up by chance. See the backlog for broadening this beyond one channel.

---

## Backlog — the full vision, sequenced (Nick's design doc §§4–16)

Status: ✅ built · 🔶 partial · ⬜ backlog. Ordered roughly by value.

### Lineage depth
- ✅ Dominant scaffold · organic drift · ancestry card · anchor strength.
- 🔶 **Earth-hybrid phenotype adapter** — the seven reviewed fauna, Apple, Vanilla,
  Oyster and Amoeba now have bounded anchor-aware adapters while their signature
  scaffolds remain owned. Extend the same reviewed pattern to additional fauna and
  compatible tail-type / limb-count / skin traits only after lineage-specific proof.
- 🔶 **Protected species markers** — guarantee 2–3 iconic markers survive drift
  (feline mane/face, avian beak, moose antler+muzzle) before overlays apply.
- ⬜ **Compatibility translation** for radical crosses (§6.3): jelly tentacles →
  mane filaments, coral branching → antlers, ray wings → gliding membranes, etc.
- ⬜ **Minimum-signature guarantee** at the anchor floor (never fully generic).

### Attachment & progression (§§9, 11–13)
- ⬜ Named bloodlines · lineage history (ancestors, worlds, mutations, offspring).
- ⬜ Lineage archive / genetic vault / family tree (retired creatures preserved).
- ⬜ Bounded Companion Chronicle plus player-curated Expedition Museum: receipt-backed
  firsts, returns, discoveries and mementos stay referentially correct across rename,
  migration and duplicate catalogue species; neither surface is a reward faucet or
  retention-pressure dashboard.
- ⬜ Signature-trait stabilization (a favored trait passes more reliably).
- ⬜ Role specialization (scout/harvest/traversal/…) so non-combat lineages matter.
- ⬜ Collection goals: family mastery, genetic collection (colors/heads/tails/eyes).
- ⬜ Implement non-consuming normal breeding, half-lower-parent `fed` inheritance,
  bounded active-play Recovery and reversed-parent outcome vectors; keep any
  irreversible Fusion optional, separately named and outside progression.

### Replayability (§8) & world (§14)
- 🔶 Discoverability breadth — vagrant is one channel; add seasonal/biome-band
  rotation, migration events, **Earth-analog worlds** (Earth-like LOOK, procedural
  NAMES — same "phase" as Earth, not Earth names), fossils/eggs/DNA finds.
- ⬜ Epoch/seasonal world change (spawn tables, blooms, catalysts).
- ⬜ Lineage quests ("keep a pure wolf line 10 gens", "an eagle that survives a gas
  giant"). Trait discovery / fog (learn genes by observation, breeding, research).
- ⬜ World-driven incubation (gravity/radiation/acid/cold shape the mutation pool).

### UI (§16)
- ✅ Ancestry lookup (Lineage card).
- ⬜ Offspring preview (probabilities before you breed).
- ⬜ Full lineage tree view.

_Items Nick previously deprioritized (compat-table, quests/archive/roles, world
incubation) live here as the long-term vision, not committed work._
