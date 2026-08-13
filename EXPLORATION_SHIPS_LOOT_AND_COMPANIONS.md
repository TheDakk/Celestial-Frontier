# Celestial Frontier — Exploration, Ships, Loot & Companions

**STATUS:** approved product direction and implementation contract as of **2026-08-13**.
The current `port/v2` build is still the playable Phase-4 exploration/survey slice; the
Inventory, Shipyard, item-instance loot, capture/acquisition, companion-expedition, breeding, live-combat,
Guardian and full-audio outcomes described here are **not yet implemented** unless a row
below explicitly says otherwise. This document coordinates the existing system specs; it
does not silently promote planned behavior into the in-game Guide.

**Purpose:** turn Celestial Frontier's mature but separate exploration, materials, ship,
creature, breeding and combat systems into one coherent long-term mastery loop. The player
starts with a modest survey ship, learns the universe, gathers increasingly capable
materials, builds a visibly better vessel, raises memorable companions, earns seeded loot,
and reaches places that were previously impossible.

**Related authorities:** `ART_DIRECTION.md` · `AUDIO.md` · `AUDIO_LICENSES.md` ·
`ECONOMY_LOOT_CRAFTING.md` · `MATERIALS_AND_GEAR.md` ·
`CAPTURE_AND_BIOSPHERE.md` ·
`BREEDING_AND_SHARING.md` · `LINEAGE_AND_BREEDING.md` ·
`COMBAT_AND_CONQUEST.md` · `PROGRESSION.md` · `SAVE_SYSTEM.md` ·
`DETERMINISM.md` · `UI_PRESENTATION.md` · `port/DECISIONS.md` ·
`port/RUBRICS.md`.

---

## 1. North star: a universe worth mastering

The desired feeling is the constructive side of Minecraft-style exploration, a transparent
Diablo/Path-of-Exile-style equipment chase, and Pokémon-style collection, breeding and
attachment:

1. **Discover** a place whose address, ecology and dangers are stable and shareable.
2. **Learn** what that place rewards and what preparation it demands.
3. **Gather** finite materials, biological knowledge, blueprints and memorable trophies.
4. **Build** equipment and a visibly more capable ship.
5. **Raise** companions with names, lineage, preferences, victories, wounds and shared history.
6. **Risk** a prepared team in combat or a companion expedition whose terms are shown first.
7. **Return** with deterministic loot, stories and new capability rather than an opaque timer.
8. **Reach farther**, where new combinations—not merely larger numbers—open.

The target is deep fascination, mastery, attachment, replayability and a restorative sense
of discovery. It is **not** compulsion engineering. Celestial Frontier does not use paid
random rewards, streak decay, expiring missions, variable-pressure notifications, hidden
odds, energy sales, punishment for taking a break, or loss designed to manufacture urgency.
Randomized loot is earned through play, its source and ranges are visible, and a player can
stop without forfeiting progress.

### 1.1 Experience priorities before breadth

The next feature batches must prove a complete, understandable **30–60 minute first journey**
before they multiply biomes, item bases, creatures, missions or Guardians. The player should be
able to survey a world, understand a visible opportunity, make a meaningful acquisition or
resource decision, turn that result into a concrete build choice, see the ship or companion
change, and use the new capability to reach a different place. A later companion-return story is
an extension of this loop, not a substitute for its first satisfying cycle.

Every surveyed world eventually needs a legible opportunity map: a truthful combination of
resources, ecology/capture prospects, anomaly or ruin, blueprint/lore lead, hazard and (where
applicable) Guardian lead. It must reveal what the player can pursue and why preparation matters
without inventing availability, concealing odds, or turning every world into the same resource
farm. Survey can reveal a lead; only the owned action and receipt may grant its outcome.

---

## 2. Honest current boundary

| System | Current v2 executable state | Next owned outcome |
|---|---|---|
| Universe travel, Survey, Planetside | Live, deterministic, save-backed | Complete canonical CF1 hierarchy and richer biome scenes |
| Compendium | Read-only rows, details and deterministic static portraits | Virtualized list, bounded thumbnail work, living selected preview |
| Capture / specimen acquisition | No live v2 Tame, Scavenge, Sample or Biosphere Yield action | Port finite capture writers before owned companions or collection progression |
| Inventory / character portrait | Imported legacy bytes preserved; no live surface | Instance-backed inventory, paper doll and item inspection |
| Shipyard / ship upgrades | Imported items/chapter state can gate reach; no Shipyard or v2 ship portrait | Shared capability/visual state and real research/build outcomes |
| Materials / crafting / loot | Legacy v1.8.9 is mature; v2 preserves data only | Port economy, then migrate slotted gear to real item instances |
| Breeding / care | Domain genetics exists; no live v2 action | Nonlethal breeding with bounded parent Recovery, lineage, care and bond outcomes |
| Combat / conquest / Guardians | Deterministic domain duel exists; no live v2 action | Outcome-driven combat UI, rewards, injury and Guardian encounters |
| Companion expeditions | No committed runtime exists | Active-play missions with sealed exact-once receipts |
| Audio | Whoosh and survey ping only | Versioned mixer, creature identity, combat, ship and biome sound |

The in-game Guide must continue to say these unavailable outcomes are unavailable. It may
describe a new capability only after the action exists, persists, reloads, is reachable by
touch/keyboard, and has a deliberately broken negative control that makes its gate fail.

---

## 3. One capability ladder, not parallel grind bars

Progression is a graph of capabilities. A new material or blueprint matters because it
changes a decision:

- **Reach:** drives, navigation arrays and stabilizers open farther stars and regions.
- **Access:** scanners, landing systems and environmental protection expose new world types.
- **Efficiency:** extractors, cargo systems and labs reduce a known cost; they do not create
  infinite resources.
- **Survivability:** hull, shields, field medicine and companion roles make harder choices
  viable without making all earlier hazards irrelevant.
- **Expression:** chassis, livery, hardpoints, companion roles and gear combinations create
  recognizable builds.

Every unlock has one canonical gameplay owner, one visual projection and one Guide statement.
Art never awards capability, and captions never infer a system that the save does not own.

### 3.1 Bounded places to build a history

After the basic engineering loop is trustworthy, a player may earn a small set of optional,
world-bound projects: a scanner relay, lab, shelter, cargo beacon or biome observatory. These
are creative expressions of explored places and a readable record of progress—not an unattended
income machine, an upkeep chore, a mandatory maintenance schedule or a replacement for travelling.
Each project needs a finite construction receipt, a local visible effect, an explicit capability
owner and a clear limit before implementation. Their exact unlocks remain an open design decision
until the first engineering loop has human evidence.

The same restraint governs the player legacy surface. A bounded **Chronicle / museum** connects
named discoveries, creature lineage and memories, ship stages, authored world projects and
Guardian victories into a personal history. Optional shareable build, ship or companion cards may
follow after ownership and privacy boundaries are proven; they do not imply multiplayer, trading,
network dependence or a social-pressure loop.

---

## 4. Inventory portraits and the character sheet

### 4.1 Three portrait jobs

Do not force one renderer to solve three incompatible workloads:

1. **Catalogue thumbnail:** 132px, fast, static and accessible. Only visible rows plus a small
   overscan window may be mounted or queued.
2. **Inspector portrait:** 440px static deterministic Canvas2D for close reading, lineage and
   equipment comparison.
3. **Living selected preview:** at most one bounded Pixi scene for the selected explorer,
   companion or ship. It pauses while hidden/reduced-motion and is destroyed on close.

The character sheet is a readable paper doll, not a tiny copy of the universe scene. Nine
equipment anchors remain the mature vocabulary. Equipped instances add restrained,
slot-specific layers; stats, provenance and effect text stay legible without relying on color.
Creature list rows never instantiate individual Pixi applications.

### 4.2 Memory contract

The imported Compendium bound is 1,500 entries. Eagerly painting/mounting a 440px source for
every row can exceed a gigabyte of decoded pixels before browser overhead. Therefore:

- virtualize to roughly two visible viewports;
- paint a placeholder first and replace it with the completed 132px thumbnail;
- deduplicate work by a typed **visual signature**, with cancellation/generation tokens;
- bound by decoded bytes/pixels as well as entry count;
- release object URLs, subscribers, Canvas/Pixi resources and stale jobs on close;
- keep the complete genome key until an exhaustive painter-reader audit proves which fields
  are visually irrelevant—past lineage/cache collisions make casual key narrowing unsafe.

A 1,500-row browser fixture must prove bounded DOM rows/jobs, first/middle/last identity,
keyboard/focus/detail behavior and a warm-memory plateau. Negative controls disable
virtualization, thumbnail replacement and disposal separately.

---

## 5. Shipyard and visible ship progression

Legacy v1.8.9 already has a modest six-state additive ship portrait. V2 must preserve that
mechanical meaning while upgrading readability rather than pretending no prior art exists.

### 5.1 Canonical projection

```text
ShipVisualState = {
  chassisStage: 0 | 1 | 2 | 3,
  hardpoints: { array, extractor, scoop },
  liverySeed,
  provenance: 'owned-items' | 'legacy-charter-refit'
}
```

`ShipVisualState` is derived from normalized save inputs by the same reach-stage selector
used by travel. It is not saved as a second source of truth. Imported veterans whose chapter
state grants reach without the corresponding item receive an honest generic **legacy charter
refit** visual; the UI must not name an item they do not own.

### 5.2 Readable upgrade grammar

- **Stage 0 — Scout/Chemical:** compact survey hull, small cargo and chemical plume.
- **Stage 1 — Jump/Interstellar:** stronger spine, larger drive bell and protected nose.
- **Stage 2 — Survey Cruiser:** changed silhouette, navigation-array/dish language and lab bay.
- **Stage 3 — Frontier/IG:** unmistakable long-range hull, luminous seams and paired drive mass.
- **Hardpoints:** Auto-Extractor and Corona Scoop appear only when actually owned; array state
  is likewise mechanical, not decorative.

Four strong chassis silhouettes plus optional hardpoints are preferable to commissioning 32
nearly identical bit combinations. Build preview shows before/after art beside the exact
installed-system list. The same state/asset graph is reused in the Shipyard, travel and
arrival—three drawings may differ in LOD but never disagree about the vessel.

One disposable Pixi preview may add engine, beacon and dish motion. It owns its filters,
particles and scene-only textures and releases them on close. Repeated travel → Compendium →
Shipyard cycles must plateau after warmup under raw-CDP resource counters.

---

## 6. Loot: deterministic objects with provenance

The legacy `items[baseId]` + `equip[slot]=baseId` + `equipAff[slot]` shape cannot represent
two different copies of the same item. It cannot support a serious loot chase. Do not extend
`equipAff`; migrate slotted gear to stable instances while retaining stacks for materials,
parts and components.

```ts
type GearInstance = {
  schema: number;
  instanceId: string;
  baseId: string;
  itemLevel: number;
  rarity: string;
  quality: number;
  implicits: string[];
  naturalAffixes: Array<{ affixId: string; tier: number; value: number; role: 'prefix'|'suffix' }>;
  craftedModifier?: { affixId: string; tier: number; value: number };
  drawback?: { affixId: string; tier: number; value: number };
  upgrade: number;
  sockets: string[];
  generation: { seed: number; ordinal: number };
  provenance: {
    kind: 'craft'|'conquest'|'guardian'|'expedition'|'discovery'|'legacy-migration';
    sourceActionId: string;
    worldId?: string;
    missionId?: string;
    receiptId?: string;
  };
};
```

`equipment[slot]` points to an `instanceId`. `instanceId` comes from the save-owned immutable
`sourceActionId` plus that source's monotonic generation ordinal—not world/base seed alone and not
an expedition-only identity. Craft, conquest, Guardian, mission and discovery receipts all provide
the same source-action contract. Legacy migration derives its source action from the deterministic
import/migration receipt. Migration
creates instances for gear copies and attaches a valid legacy slot affix only to the instance
equipped in that slot.

### 6.1 Roll grammar

- Authored base family and implicit establish the item's identity.
- Source, reachable depth, hazard and Guardian/mission type choose transparent pools.
- Zero to two compatible prefixes and zero to two compatible suffixes create the chase; one
  explicit crafted modifier and/or drawback may be added only by a named deterministic recipe.
- Rarity, item level, quality, affix tier, upgrade level and visual designation are separate
  axes; none is silently treated as another.
- The inspect card shows source, ranges, roll, tags and incompatibilities.
- Salvage targets the exact instance and produces deterministic, bounded materials.
- Reforging, if added, uses a visible fixed cost and explicit deterministic rule; no paid or
  endlessly random reroll loop.

All tables validate duplicate IDs, tag compatibility, reachable pools, bounds and dead rows.
A claimed receipt, destroyed instance or equipped instance cannot be claimed/salvaged twice.
Inventory-full rewards remain pending; they are never silently dropped.

### 6.2 Readable chase, healthy economy

The loot chase earns anticipation through legible combinations, not volume or obscurity. Players
need concise tags, role and source comparisons, compatible-synergy explanations, saved filters
and salvage rules, and deterministic targeted crafting paths alongside rare discoveries. A chase
item should answer: what it does, which build wants it, where it came from, what can improve it,
and what trade-off it carries. No system may make a player keep junk solely because its identity is
ambiguous.

Before expanding base families or affix pools, maintain an executable economy model covering each
material/gear source, finite limit or cadence, intended sink, target time-to-first meaningful
upgrade, new-player and veteran paths, and recovery from a bad choice. Deterministic simulations
and human runs must reject dead-end resource states, invisible bottlenecks, infinite dominant
farms and one objectively mandatory build. The goal is many understandable routes to stronger or
more expressive ships and companions, not an infinite treadmill.

---

## 7. Companion attachment and expeditions

A catalogue discovery and a living owned creature are different records. The legacy Codex
conflates them, so consuming/breeding/losing the one specimen can erase the catalogue row and
cannot represent two individuals of the same species. V2 must split them before attachment:

```ts
type CatalogSpecies = {
  speciesId: string;
  genomeIdentity: string;
  firstSeen: string;
  source?: string;
  location?: string;
};

type CreatureInstance = {
  creatureId: string;
  speciesId: string;
  genome: Record<string, unknown>;
  nickname?: string;
  origin: 'wild'|'bred'|'guardian'|'legacy';
  xp: number;
  hurt: number;
  fed: number;
  brood: number;
  lineage: { parentCreatureIds: string[]; generation: number };
  bond: CompanionBond;
  protection: { favorite: boolean; locked: boolean };
  assignment?: { kind: 'mission'; missionId: string }
    | { kind: 'recovery'; readyAtActivePlayMs: number };
};
```

Legacy migration creates one stable `legacy:<oldCodexId>` individual for an owned fauna row
while retaining the catalogue discovery. Non-fauna consumption needs an explicit specimen/
resource migration decision; the catalogue must no longer be the consumable object.

A companion is not disposable inventory. Its identity includes its stable owned-creature ID,
name, lineage, explicit origin, current condition and a compact Chronicle of meaningful shared firsts. Bond
rewards varied care, difficult returns and new experiences—not repetitive clicking or daily
attendance.

Suggested bounded state:

```ts
type CompanionBond = {
  level: number;
  memories: Array<{ id: string; kind: string; worldId?: string; atActivePlayMs: number }>;
  preferredRole?: string;
  worldsSurvived: number;
  guardianVictories: number;
  mementoIds: string[];
};
```

Bond mostly unlocks expression and sidegrades: greeting/voice nuances, role mastery, Chronicle
entries, poses, livery tokens, recovery options and situational teamwork. It does not become
an unlimited multiplier that makes genes, gear and tactics irrelevant.

`CompanionBond.memories` is the bounded Chronicle owner; there is no second unbounded Chronicle
array. Lineage keeps bounded parent references and generation, while deeper ancestry is resolved
through the catalogue/lineage graph. Protection flags have real command-layer guards and cannot be
bypassed by hiding a confirmation button.

### 7.1 Acquisition contract

Survey reveals a roster; it does not silently create a catalogue page or owned companion. The
future Tame, Scavenge and Sample outcomes in `CAPTURE_AND_BIOSPHERE.md` are the acquisition writers:
a successful action creates or updates `CatalogSpecies`; successful fauna Tame may also create a
stable `CreatureInstance`, while Scavenge/Sample create bounded specimens/resources rather than
counterfeit living companions. Attempt cost, odds, finite Biosphere Yield, active-play recovery and
genuinely-new discovery rewards settle in one receipt. Miss/reload/two-tab controls must prove no
free page, duplicate creature, reroll or double-spend.

Normal v2 companion breeding is nonlethal: both parent instances remain owned but enter a bounded
active-play **Recovery** assignment that blocks breeding, dispatch and combat until complete. The
child inherits half of the lower parent's `fed` value. Legacy v1 parent consumption remains
historical behavior; any future irreversible Fusion must be separately named, optional, expressly
confirmed and never required for alien progression.

### 7.2 Dispatch/return contract

Companion missions use a dedicated persisted **visible-and-answerable active-play millisecond
clock**, never `Date.now()` and never the capped ecology `COSMIC_EPOCH` counter:

```ts
type CompanionMission = {
  schema: number;
  missionId: string;
  state: 'away'|'ready'|'claimed'|'recalled';
  missionType: string;
  target: {
    galaxy: { seed: number; x: number; y: number };
    star: { seed: number; x: number; y: number };
    planet: { seed: number };
  };
  companionIds: string[];
  dispatchedAtActivePlayMs: number;
  readyAtActivePlayMs: number;
  receipt: {
    receiptId: string;
    rngDomain: string;
    ordinal: number;
    materials: Record<string, number>;
    gear: GearInstance[];
    xp: number;
    bondEvents: string[];
    injury?: string;
    storyId: string;
  };
};
```

Only the tab holding the repository lease advances the monotonic clock; handoff/rebase stores the
last committed value and rejects stale-tab deltas, so time neither freezes at 10,000 ecology epochs
nor advances twice. The complete receipt is rolled and committed atomically at dispatch. Return only reveals and
claims it; reloading cannot reroll it. While away, a creature cannot simultaneously breed,
feed, duel, conquer, be deleted/salvaged, or be assigned elsewhere. Claim applies loot, XP,
bond/injury and assignment release in one revision-checked transaction. Double-click,
back/forward, two tabs and crash/reload produce one result.

Missions show active-play duration, environment, role fit, possible reward families and risk
before dispatch. A normal failure returns a wounded companion, partial reward or story—not
silent permanent loss. Any optional irreversible mode must be separately named and expressly
confirmed; it is never the default dispatch rule.

### 7.3 A record worth keeping

The Chronicle/museum is a player-facing read model of bounded canonical facts, not an additional
reward writer. It may connect a first world, a recovered companion, a notable craft, a ship refit,
an authored project, a Guardian result and a memento into a coherent personal history. It must
never become a checklist that pressures daily attendance or a substitute for the underlying
receipt. A player can preserve or share a selected story later, but no external identity, network
service, trading market or public ranking is a prerequisite for a complete solo legacy.

---

## 8. Combat, Guardians and return loot

### 8.1 Decide the game of battle before drawing the battle screen

The existing deterministic duel transcript is a valuable outcome seam; it is not yet a complete
combat decision model. Before a live combat UI is authorized, the design must specify and test:

- the player's repeatable decisions, their timing and their costs;
- companion/ship roles, readable enemy intent and meaningful counterplay;
- how preparation, gear, terrain and team composition create alternatives rather than a single
  dominant stat check;
- defeat, retreat, injury, recovery and Guardian stakes in language a player can evaluate before
  committing.

Whether the final interaction is paced turns, tactical commands, a real-time command layer or a
hybrid remains intentionally open until paper/interactive prototypes and human tests identify the
clearest, most satisfying model. No battle UI should imply agency that the simulation does not
actually own.

The deterministic `runDuel` transcript is the combat event source. Presentation consumes its
stun, dodge, critical, status, execute, thorn, lifesteal and damage events without drawing new
combat RNG. XP, loot, injury, settlement and Companion Chronicle writes occur through one
post-combat receipt, not scattered helper calls.

- Friendly duels teach builds and strengthen bonds without conquest stakes.
- Field missions test a small party's role coverage and return with materials/gear/lore.
- Conquest retains an explicit high-stakes choice and mercy/depth rules.
- Apex Guardians have stable world identity, authored encounter rules, a seeded motif and a
  distinctive reward family; they are not ordinary enemies with larger numbers.
- Guardian rewards can include a bounded item instance, blueprint, memento, Compendium claim
  and story receipt. Every faucet has an outcome test through the real action.

The existing conquest-loss XP key must be split or delta-paid so an earlier +3 loss cannot
permanently foreclose the advertised later near-brink +5. Affix consumers must cap compatible
stacking—especially damage reduction—before deeper loot increases the number of modifiers.

---

## 9. HD audio identity

`AUDIO.md` owns the detailed architecture. This cross-system contract requires:

- a versioned `AudioProfile` derived from an immutable typed `AudioSignature` containing only
  audio-relevant phenotype, exact catalogue owner, surviving lineage/resolved parent traits
  where available, and resolver version, with a deterministic fallback while CFB parent
  preservation remains open;
- stable identity across Compendium audition, travel, expedition return and combat;
- combat cues mapped from the existing duel transcript, never from a second outcome roll;
- a unique Guardian motif layered over the creature voice and encounter acoustics;
- local/offline assets only, with an auditable rights ledger.

“Every Earth creature has a sound” means every set-qualified catalogue row has an intentional
audio mapping. It does **not** mean scraping or pretending an authentic recording exists for
every organism. Fauna may use owned/CC0 signature recordings where rights and biology support
them, then curated family foley/synthesis. Flora, fungi and microbes receive habitat,
interaction and scientific sonification rather than animal noises. Hybrids combine anatomy,
locomotion, respiration, size, temperament, biome, element and lineage into a recognizable
profile. Mutable XP, hurt, fed, brood, assignment and bond state are not signature fields; changing
each one independently must leave voice identity stable, while representative phenotype/lineage
changes must change it.

---

## 10. Save, determinism and exploit boundary

- Roll outcome receipts from a stored save-lifetime RNG domain/ordinal; never fresh page-session
  entropy and never at reveal/claim time.
- Use optimistic save `revision` compare-and-swap or one authoritative serialized coordinator
  plus a cross-tab lease before every reward-bearing or destructive mutation. Current
  last-writer-wins blob persistence is insufficient for exact-once ownership or loot.
- Keep ecology `COSMIC_EPOCH` semantics separate from the uncapped dedicated active-play
  millisecond clock used by missions/recovery. The legacy Auto-Extractor's wall-clock accrual is a
  known clock-wind exploit and must migrate to that active-play authority before it returns.
- Reject arrays where object maps are expected and bound every counter used to derive rewards.
- Replace the legacy `xpFirsts` last-4,000 serialization cap with durable typed award state;
  dropping old keys can otherwise re-arm supposedly one-time XP after reload.
- Version new mission, item-instance, bond and audio-profile records; unknown future schemas
  remain protected, not silently coerced.
- Import/migration is fixed-point tested and cannot partially consume a legacy inventory.

Required adversarial outcomes include reload-reroll, duplicate claim, two-tab stale revision,
wrong companion unlock, breed-while-away, delete-while-away, wall-clock wind, inventory-full
claim, incompatible/over-cap affixes, corrupt rows, future schemas and save-write failure.

Revision checking covers **every** reward-bearing or destructive mutation—not just Inventory and
mission claim—including capture attempt/success, craft/salvage/equip, feed/breed/recovery, dispatch/
recall, duel/conquest/Guardian settlement and creature deletion. Same-parent double breed,
same-world double settlement and stale-tab replay are mandatory failing controls.

---

## 11. Performance, bug and dead-code discipline

Every implementation batch audits:

1. all readers/writers/importers/exporters of each changed field;
2. all UI and Guide claims that consume the outcome;
3. CPU, decoded-pixel, Pixi texture, AudioBuffer and live AudioNode ownership;
4. duplicate reward paths, replay/reroll/clock/two-tab exploits and save failure;
5. unreachable imports/exports and dormant generated freight.

No code is deleted because it “looks old.” Before removal, prove zero runtime callers,
dynamic imports, generated-lifter ownership, save migration/compatibility uses, fixture uses,
Guide/release-history references and planned lazy-module ownership. Immutable v1 history,
legacy voice fallback, deterministic Spectral internals, dormant Guide topic IDs and
fixture-pinned helpers are not dead code merely because the current slice does not render them.

Known audit queue:

- Charter goals/copy currently expose unimplemented mining/fabrication/Shipyard paths.
- Compendium virtualization and decoded-image plateau are release prerequisites.
- ordinary scene textures and `_rgCache` need bounded ownership; small art caches have
  off-by-one caps;
- Auto-Extractor wall-clock accrual permits clock-wind ore;
- the legacy biome fauna reader uses a missing `BIOME_SETS.fauna` instead of the profile;
- this review corrected the legacy affix formula and five-system/62-item documentation drift;
  executable golden vectors and complete economy-manifest parity remain open;
- a small generated HD-art compatibility cluster appears unreferenced, but removal must happen
  through its lifter with parity/pixel proof.

---

## 12. Guide and language contract

The player's language is concrete:

- **Cargo** for material stacks; **Inventory** for owned item instances.
- **Shipyard** owns Research, Fabrication and vessel comparison.
- **Companion** is an owned creature with history; **species** is a catalogue identity.
- **Expedition** is reserved for the player's overall save only where already established;
  dispatched activities use **Companion mission** until UX testing proves a clearer term.
- **Rarity**, item level, quality, affix tier, upgrade and designation remain separate labels.
- **Apex Guardian** remains the authored ruler vocabulary.
- no player-facing **Spectral class**; real stellar spectral class remains scientific identity.

The Guide capability map is the gate. Each implementation arc updates its topic body,
unavailable/current summary, cross-links, Training/tooltip path and release draft in the same
batch. Planned systems live here and in their system docs, not in player-visible promises.

---

## 13. Implementation arcs and acceptance

| Arc | Deliverable | Required proof before the next arc |
|---|---|---|
| 0 — repair/current truth | Actionable Charter projection/copy; canonical CF1 galaxy → star → planet identity proof; deterministic world-opportunity and first-journey contracts; source/doc table corrections | fresh save can never receive an impossible live goal; every surfaced opportunity maps to a real action; no world-bound ownership receipt/writer exists before the canonical identity seam is proven; Guide remains honest |
| 1 — portrait/ship foundation | virtualized thumbnails, character portrait service, pure `ShipVisualState`, static Shipyard proof | 1,500-row bound, all ship states/permutations, phone/desktop human review, memory plateau |
| 2 — item instances and readable economy | schema/migration, inventory, equip/salvage/inspect, deterministic tables, build tags/comparison and source/sink/pacing ledger | fixed-point migration, exact-instance mutation, no duplicate/reroll/overflow loss; sources, ranges and targeted-crafting/salvage paths are inspectable |
| 3 — engineering loop | mining/skimming/research/fabrication and visible build outcomes | real-action rewards, finite veins, active-play extraction, reach/visual/Guide agreement |
| 4 — capture/ownership | finite Tame/Scavenge/Sample acquisition, catalogue/owned-instance split and Biosphere Yield | real-action page/specimen creation, attempt spend/recovery, no duplicate/reroll/two-tab grant |
| 4.5 — first complete journey | Fresh-start Survey → opportunity → Gather → Build → Tame → ship upgrade → farther reach → meaningful Return | first-time 30–60-minute human path proves comprehension, agency and satisfying pacing without idle waits or a scripted fake reward |
| 5 — companions | nonlethal breeding/recovery, care/bond/Chronicle and active-play missions | fed inheritance, recovery/away locks, exact-once return, save-failure/two-tab controls |
| 5.5 — combat decision model | role, preparation, telegraphing, counterplay, retreat and settlement rules are specified and scenario-proven before battle UI expands | humans can choose and explain a viable response; no opaque hard-counter or stat-only outcome passes as strategy |
| 6 — combat/Guardians | live duel/conquest party presentation and receipt rewards | transcript-driven presentation; every reward/injury/settlement outcome tested |
| 7 — audio foundation | mixer/lifecycle, current procedural voice parity, audio lab, accessibility | deterministic signatures/profiles, node/voice budgets, visibility resume, human listening gate |
| 8 — HD audio/content | Earth mapping, hybrid voice, combat/Guardian/ship/biome layers | complete rights manifest and route coverage, family distinctness, real-device heat/listening |
| 9 — frontier legacy and projects | Chronicle/museum, ship/discovery/Guardian history, share cards and optional bounded frontier projects | finite visible inputs; no decay, mandatory maintenance or offline-income loop; every legacy record has a real action owner |
| 10 — integration beta | living previews, travel reuse, balance and complete Guide/Training | full battery, save migration, long-session memory/audio plateau, multi-lens human play |

Automated checks can prove determinism, bounds, reachability, receipts and resource cleanup.
They cannot certify whether a creature feels lovable, a ship upgrade reads as powerful, a
Guardian is memorable, a mix is exciting without fatigue, or the loop remains respectful.
Those are explicit `[HUMAN]` gates, not gaps to disguise with another metric.

### 13.1 Human experience and pacing gates

At every meaningful loop milestone, run and record three deliberately different human sessions:

1. **First 30 minutes:** Can a new player understand where to go, what the surveyed opportunity
   means, and the next useful choice without external explanation?
2. **First three sessions:** Do discoveries, ship changes, companion care and loot comparisons
   create anticipation and ownership rather than confusion, grinding or fear of missing out?
3. **Long session:** Do audio, visual density, menus, fatigue, accessibility and device heat stay
   comfortable while the player still has meaningful choices?

Record comprehension, delight, attachment, agency, fatigue/confusion and accessibility—not
engagement pressure or session-length targets. Pair these sessions with deterministic economy
simulations for time-to-upgrade, source/sink coverage, recovery from a bad allocation and the
absence of dominant farms. A feature may be technically green and still remain unready if people
cannot understand, enjoy or comfortably use it.

---

## 14. Unfinished-system inventory

### Product systems still open in v2

- full Inventory/Cargo, explorer paper doll and equipment actions;
- Shipyard, mining, skimming, research, fabrication, salvage and visual vessel progression;
- true item-instance loot, deeper affix pools, reward receipts and Guardian drops;
- a truthful world-opportunity map, readable loot comparison/filter/salvage paths and an
  executable economy source/sink/pacing model;
- Tame/Scavenge/Sample acquisition, finite Biosphere Yield and catalogue/specimen ownership;
- feeding, injury care, breeding, lineage actions, creature XP/classes and Companion bond;
- friendly duels, conquest, Apex Guardians, settlement rewards and Binder/Paragons;
- Companion missions/return loot;
- optional bounded world projects/outposts plus a personal Chronicle/museum and later private
  shareable build/ship/companion stories;
- complete creature/biome/combat/ship/music audio and accessibility mixer;
- live Field Training/tooltip/Advanced Briefing coverage for those systems;
- achievement shelves, complete Charter writers/rewards, Stardust loop and endings.

### Foundation and quality work still open

- canonical CF1 galaxy → star → planet hierarchy;
- imported legacy full-expedition training snapshot restore and CFB parent identity;
- Compendium virtualization and bounded art/audio work;
- Pixi/Canvas texture ownership and long-session memory plateau;
- live HD planet textures, living organism rigs and biome/ecology scenes;
- epoch invalidation and hidden-tab/reduced-motion policy;
- split-store/CAS or serialized cross-tab persistence;
- real veteran-save Gate C, human listening Gate G, physical mobile Gate I and sustained heat QA;
- remaining Gate-B domain/economy parity, the ≤1-second answerability target, whole-app
  accessibility, PWA/offline/rollback work, and formal 1,250-row/all-bloodline visual certification.
- recurring first-30-minute, first-three-session and long-session human experience evidence for
  comprehension, delight, attachment, fatigue and accessibility.

The sequence is intentional: build trustworthy identity, ownership and save receipts before
adding the high-volume loot, companion and audio content that depend on them.

### Deliberately deferred until the core solo loop is proven

Do not use multiplayer, a player trade market, global rankings, unattended/offline resource
generation, mandatory base maintenance, social pressure or monetized rerolls to paper over an
unproven loop. The first goal is a complete solo journey that makes exploration, craftsmanship,
companionship and discovery intrinsically worth returning to. Creative sharing can follow as an
optional, privacy-respecting expression layer once ownership, receipts and player legacy are safe.

---

## 15. Implementation references

Use current primary documentation when the corresponding arc begins:

- PixiJS Assets manifests/bundles and background loading:
  <https://pixijs.com/8.x/guides/components/assets> and
  <https://pixijs.com/8.x/guides/components/assets/background-loader>.
- PixiJS texture/resource lifetime and garbage collection:
  <https://pixijs.com/8.x/guides/components/textures> and
  <https://pixijs.com/8.x/guides/concepts/garbage-collection>.
- MDN AudioWorklet guidance for custom off-main-thread Web Audio processing:
  <https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet>.

These references inform implementation mechanics; they do not replace Celestial Frontier's
stricter ownership, determinism, offline, rights, accessibility and negative-control laws.
