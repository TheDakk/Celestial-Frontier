# Earth Lineage, Breeding & Replayability

_Design north star + build status. Matches code as of 2026-08-10 (full-catalogue reset).
Companion to `ART_DIRECTION.md` and `PROCEDURAL_CHARACTERISTICS.md`._

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
> **Overall visual continuity remains OPEN solely for Vanilla Orchid.** Apple's
> continuity repair is independently judged PASS at source SHA-256
> `D3801E5A234D0D58DF6BAD1515D7583D53ED96C1939EABBE8B02376204503624`:
> 58/58 tree rows remain exact at 440/300/132 (174/174 hashes), five stages are
> unique with strictly increasing pure-distance, and schema v3 validates 234/234
> assets with both browser orders stable. Vanilla Orchid alone remains
> `FAIL_BYTE_IDENTICAL_STAGES`. Schema v2's Green Algae stop was a real harness
> contract bug, not transient provenance; schema v3 repairs current-catalogue vs
> retained-legacy-route ownership and its sentinels are green. Routing correctness
> and distinct hashes are necessary and are not proof that every graft is seamless.

The central rule (Nick): **never make the player choose between keeping a beloved
Earth creature and participating in the alien progression system — the game lets
them do both.** Earth life gives recognizable ancestry & attachment; pure alien
life gives surprise & evolutionary possibility; breeding connects the two without
making either obsolete.

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
  sets `_earthBlend` + `_earthBlendKingdom`). Fauna uses the HD lineage rig;
  flora/fungi/microbe use the exact named owner with the child's palette/genes.
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
- 🔶 **Earth-hybrid phenotype adapter** — hybrids currently graft crest/tendrils/
  spikes/eyes; extend to inherit compatible tail-type / limb-count / skin so drift
  reads as "compatible inherited anatomy," not just color + spikes.
- 🔶 **Protected species markers** — guarantee 2–3 iconic markers survive drift
  (feline mane/face, avian beak, moose antler+muzzle) before overlays apply.
- ⬜ **Compatibility translation** for radical crosses (§6.3): jelly tentacles →
  mane filaments, coral branching → antlers, ray wings → gliding membranes, etc.
- ⬜ **Minimum-signature guarantee** at the anchor floor (never fully generic).

### Attachment & progression (§§9, 11–13)
- ⬜ Named bloodlines · lineage history (ancestors, worlds, mutations, offspring).
- ⬜ Lineage archive / genetic vault / family tree (retired creatures preserved).
- ⬜ Signature-trait stabilization (a favored trait passes more reliably).
- ⬜ Role specialization (scout/harvest/traversal/…) so non-combat lineages matter.
- ⬜ Collection goals: family mastery, genetic collection (colors/heads/tails/eyes).
- ⬜ Breeding risk/tradeoffs + no-dead-end recovery (samples, backcross, restoration).

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
