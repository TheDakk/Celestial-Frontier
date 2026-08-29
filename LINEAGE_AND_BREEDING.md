# Earth Lineage, Breeding & Replayability

> **2026-08-29 player-live Breed + Recovery correction:** Arc 5 now has a
> versioned domain planner, command-availability/Recovery projector and durable app action over the
> existing V2 ownership, lifted `crossGenome`, F4 SessionRNG/active-play authority and exact-five
> carrier. It accepts two distinct live owned fauna; rejects exhibits, non-owned, mission-assigned,
> still-recovering and Injured/Critical (`hurt >= 0.3`) parents before drawing; and permits any
> eligible fauna pairing without changing the established hybrid/lineage implementation.
>
> The transparent V1 chance is
> `clamp(0.95 - (tierA + tierB) * 0.06 + earnedStardustBonus, 0.08, 0.97)`, with the explicit
> lifetime-earned-Stardust projection capped at `0.15`. Both possible complete-save successors are
> capacity-certified before one persisted `breedOutcome` draw. Every settled attempt retains both
> parents and assigns active-play Recovery: eight minutes on success, two on failure; Recovery blocks
> breed, combat and dispatch and completes at exact `activePlayMs >= readyAtActivePlayMs`. Success
> admits the existing child successor with half the lower parent's bounded `fed`; failure admits no
> child. The newborn receives **+2 XP**, plus the one-time **+5 XP** only when this exact unordered
> pair of canonical parent species has not already paid. New V2 claims are collision-resistant
> SHA-256 digests over the sorted parent `SpeciesId`s. Imported v1.8.9
> `pair|<FNV32-base36>` aliases—derived only from `_earthName || speciesName(seed)`, never a
> nickname—remain read-only paid evidence in either the `xpf` window or `xpa` archive; V2 never
> writes a second alias. The transaction performs one CAS joining the exact-five ownership
> successor, XP/`xpf`, any required `xpa` overflow replacement, F4 advance and receipt, with no wall
> clock, hidden entropy, reroll, optimistic publication or write retry.
> The success successor also banks the canonical Chapter 3 `c3-breed` / **Breed a hybrid
> bloodline** goal inside the same pre-draw-certified complete save. Failure preserves Charter
> progress byte-for-byte, and refusal/stale/storage paths bank nothing. The live app publishes the
> verified detached `ascCh`/`ascProg`, `unlocked`, `xpf` and optional `xpa` projection only after
> durability; an ambiguous postcommit result reloads read-only, so lineage creation, XP-first
> membership and Charter credit cannot separate or apply twice.
>
> The action is now reachable only from a real-fauna Compendium detail. One bounded 24-row selector
> chooses an exact current-species primary and another chooses a distinct exact owned-fauna mate;
> every candidate remains pageable, the chance is shown without exposing raw genes, and refusal
> reasons remain explicit. Back/Close stay safe during the single durable transaction, no child or
> Recovery publishes optimistically, and an unconfirmable commit converges read-only through reload.
> Current Guide, release, Slice and Glass truth contracts cover the live boundary. No art, genome,
> portrait, lineage or hybrid-rendering structure was changed; broader care/bond, Chronicle and
> companion-mission systems remain separate future work.

> **Exact-instance Rename is also player-live without changing lineage authority.** A real-fauna
> detail pages through exact owned companions 24 at a time and settles one sanitized, at-most-24-
> character `nickname` through one immutable receipt and exact-five CAS. Assigned, recovering and
> injured instances may rename because identity alone changes; exhibition, non-owned, protected and
> revision-exhausted rows refuse. Same-species twins remain distinct, the old name stays visible
> while pending, and species/genome/traits/lineage/assignment/condition/bond/catalogue alias remain
> owned by their existing authorities. No RNG, automatic retry or optimistic mutation is involved;
> convergence faults lock read-only and reload.

> **2026-08-26 historical pre-action lineage correction (superseded where the 2026-08-29 overlay
> above differs):** the internal, non-exported exact-five V2
> successor now initializes a newly admitted bred child with
> `fed = 0.5 * min(clamp(parentA.fed, 0..200), clamp(parentB.fed, 0..200))` exactly once. Reversed
> parents agree, missing feeding becomes zero, persistence is exact, and later child feeding is not
> reset. No player capability invokes this successor. Arc 5B odds, eligibility, parent Recovery
> duration/locks, care, capacity, timing, confirmation and every breeding UI/copy decision remain
> product-open.
>
> Raw genetic grade remains mechanics/internal-art data. Any future lineage or breeding surface must
> use the strict ten-name rarity projection (valid raw `0..14`, with `9..14` displayed as
> Transcendent), omit invalid/missing values, and never expose internal grade labels or raw numbers.
> The current Tame-fauna greeting is confined to the exact durable current-system acquisition result;
> no breeding, care, Chronicle or Compendium-audition audio is live. Arc 4's ordinary Slice still
> records `recoveryClaimed:false`, and its pending dedicated 20-minute Biosphere recovery certificate
> does not prove future Arc 5 parent Recovery.

> **2026-08-25 v2 Arc 5A recorded boundary — CURRENT versus PLANNED at that date:** lineage code owns
> deterministic ancestry, Earth-scaffold inheritance and portrait continuity. Ownership-v1/v2 now
> separates `CatalogSpecies` discovery from stable `CreatureInstance` ownership, and Arc 5A
> reconstructs V2 from one source-bound manifest plus exactly four fixed generic delta shards in app
> boot, genuine legacy Training and every Arc 4 capture successor. The implemented delta carries only
> V2-exclusive or changed rows and keeps unchanged Arc 4 ownership out of Arc 5. That is
> infrastructure only: no player V2-only mutation, expedition, Recovery,
> bond/Chronicle action or companion presentation is live.
>
> **INTERNAL SUCCESSOR SHAPE EXISTS; PLAYER PRODUCT BEHAVIOR remained open at that boundary:** the
> creature schema has stable
> nickname, lineage, assignment and nullable bounded bond fields, but no player writer populates or
> changes the later companion state. The intended Chronicle records
> meaningful memories such as first landing, first safe return, a notable battle,
> discovery or offspring. Bond never decays, has no daily streak or expiring task,
> and repeated low-effort actions cannot grind it indefinitely. Its mechanical
> effects are small bounded sidegrades—roles, expressions, dialogue and traversal
> specialties—rather than a mandatory power multiplier; any creature can train
> any role. Expeditions cannot kill, delete, breed or replace the companion, and
> an away/favorite guard is enforced below the UI. The internal successor now owns
> only the one-time half-lower-clamped-parent child `fed` initialization described
> above. The still-open normal-v2 product contract preserves both living parent
> instances and atomically assigns both to a disclosed bounded active-play Recovery
> that blocks breeding, dispatch and combat until complete. Legacy v1
> parent consumption remains historical parity only. Any future irreversible
> **Fusion** is separately named, optional, informed-confirmed and never required
> for progression. The Chronicle must reference stable creature/world/mission ids
> and remain valid across rename, reload and catalogue deduplication. The implemented fixed-four-shard
> compact V2 delta carrier keeps namespace count and unchanged-state growth O(1), but no app path
> exposed its internal exact-five V2-only successor at that boundary. The 2026-08-29 headless
> backend action now supplies that narrow Breed + Recovery path, and the current Compendium UI,
> Guide and draft release expose it. Broader companion product behaviors remain unavailable until
> separately implemented and outcome-tested.
>
> A later **Expedition Museum** is a player-curated, read-only projection over those
> receipt-backed Chronicle memories, named lineages, selected mementos and world records.
> It does not own a second unbounded history, add a reward faucet, or ask players to keep a
> companion active through streaks or expiring tasks. A companion's story must remain its
> story after a rename, a migration or catalogue deduplication; the Museum may reference the
> stable IDs but never becomes the identity authority.

_Design north star + build status. Matches the current local code boundary as of 2026-08-29.
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
- ✅ The player-facing non-consuming Arc 5 action uses two exact, distinct owned fauna,
  bounded 24-row selectors, established rarity plus lifetime-earned-Stardust odds,
  pre-draw two-successor capacity proof, one receipt/CAS, and 8-minute success or
  2-minute failure active-play Recovery. Both parents survive; Recovery blocks Breed,
  combat and dispatch; wall-clock/closed-game time never advances it.
- ✅ A newly admitted child's `fed` initializes to half the lower clamped parent value
  once, with reversed-parent/round-trip/later-care vectors.
- ✅ A successful child receives +2 XP and the first exact unordered species pairing receives +5;
  the claim shares Breed's one F4 receipt/CAS, survives the 4,000-key `xpf` window through `xpa`,
  and honors—but never newly writes—the immutable legacy v1 pair alias.
- ⬜ Richer offspring-trait preview and broader care/bond/Chronicle work. Keep any
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
