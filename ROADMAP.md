# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES · EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are
## the SOURCE OF TRUTH we pull from for a full-system review/edit later. RULE: whenever we change a
## system, update its doc IN THE SAME BATCH (and bump its "matches code as of" marker) — the same
## way we run validate and update this roadmap. A change isn't done until its markdown reflects it.
## Also keep celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable.
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · MASTER ARCHITECTURE + 10/10 ACCEPTANCE BAR DEFINED; IMPLEMENTATION NOT STARTED ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`; never commit directly to `develop` or
  `main`. Resolve HEAD, upstream, worktree and PR/check state live before any Git action.
- Clean integration baseline before this docs batch:
  `c20941c5b309f0f7d5160b04f869af85c3b905ba`. At that point
  `openai/mac` equalled both `origin/openai/mac` and `origin/develop` with no
  working-copy changes. The current batch is a documentation/design working copy on top;
  no runtime capability has been implemented.
- Standing proceed authority (Nick, 2026-08-13): once a scoped agent PR is clean,
  mergeable and terminal-green on its required battery, Codex or Claude Code may merge
  that exact head normally into `develop` and monitor the resulting push battery and
  mapped development publication without asking again. Stop for a changed head,
  red/unfinished check, conflict, force action, new destination/key, manual Pages write,
  `develop` → `main`, production version, release, or deployment decision.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `README.md` ·
  `tools/README.md` · `ART_DIRECTION.md` · `UI_PRESENTATION.md` ·
  `PROGRESSION.md` · `MATERIALS_AND_GEAR.md` · `FORGE_AND_DISCOVERY.md` ·
  `AUDIO.md` · `AUDIO_LICENSES.md` · `RARITY_UNIVERSAL.md` · `RARITY_AND_GRADES.md` ·
  `celestial-frontier-codebase-reference.md` · `port/DECISIONS.md` ·
  `port/RUBRICS.md` · `port/DEVELOPMENT_PREVIEW.md` · `port/v2/README.md` ·
  `port/v2/DEVIATIONS.md` · `port/HANDOFF_NEXT_SESSION.md`.

### Verified branch publication baseline

The branch sites intentionally publish different products:

| Branch | Product | Destination |
| --- | --- | --- |
| `main` | immutable root v1.8.9 HTML | `https://celestialfrontier.github.io/` |
| `develop` | tested exact `port/v2` v2.0 development package | `https://dev-celestialfrontier.github.io/` |

The latest verified mapped development publication for the clean baseline came from
publisher run `31688439513`: development job `94409926305` succeeded and production
job `94409927127` skipped. It published source
`c20941c5b309f0f7d5160b04f869af85c3b905ba` as build
`develop-c20941c5b309` to destination commit
`da5dc493ca9daaff6962012056016cb6cfb0e96b` with approved content SHA-256
`69856a51bf2ad702651ac617265832363a0e14b6e50123d97176752c2166a8a0`.
Production remains unchanged v1.8.9 at
`0a5ee134d8e9724fdae909d75b3a5e3811e54166`.

Those facts certify that prior `c20941c` development package only. This architecture
batch has not changed source, run a release, published a candidate or altered either site.
Only a successful push-triggered battery may unlock its mapped publisher; PR, manual-agent
and failed runs have no site-write authority.

### Current executable boundary — do not turn design into a promise

`EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` is the approved cross-system product
direction and implementation contract. It is **not an implementation record**. The current
v2 remains the playable Phase-4 exploration/survey slice:

- deterministic universe travel, Survey and Planetside are live and save-backed;
- Compendium is read-only with deterministic static list/detail/Planetside portraits;
- imported inventory, item, equipment, technology and chapter bytes are preserved, and
  compatible saved drive/chapter state can gate reach;
- whoosh and survey ping are the current audio boundary.

V2 still has no live Inventory/Cargo or paper doll; Shipyard, research, fabrication,
mining/skimming, salvage or ship portrait; item-instance loot; Tame/Scavenge/Sample or
Biosphere Yield acquisition writers; creature care/breeding/
companions; live duel/conquest/Guardians; Companion missions; or full mixer/creature/
combat/ship/biome audio. The in-game Guide and `A New Foundation` remain unchanged
because none of those capabilities landed. This batch changes no player-facing release copy.

### North star and player-respect contract

The mastery loop is **Discover → Learn → Gather → Build → Raise → Risk → Return →
Reach farther**. It unifies exploration, deterministic loot, a visibly more capable ship
and memorable companions without compulsion engineering. There are no paid random rewards,
streak decay, expiring pressure, hidden odds, energy sales or punishment for taking a break.
Sources and ranges are visible; finite resources stay finite; Companion mission terms are
shown before dispatch; deterministic receipts make reloads and double claims inert.

Progression is one capability graph, not parallel grind bars: reach, access, efficiency,
survivability and expression each have one gameplay owner, one visual projection and one
Guide statement. Art never awards capability, captions never infer unowned systems, rarity
never substitutes for item level/quality/affix/upgrade, and veterans never re-earn access.
Automated gates prove identity, bounds, receipts and cleanup; attachment, readability,
sound quality, excitement without fatigue and overall respect remain explicit human gates.

### 10/10 product completion bar — planned, not live

The following are committed roadmap acceptance outcomes, **not** current v2 capabilities or
Guide promises. They keep the broad product vision focused on one satisfying loop rather than
adding disconnected systems:

| Product proof | Planned outcome | Acceptance lens |
| --- | --- | --- |
| First complete journey | A fresh Expedition can Survey an opportunity, Gather, Build, Tame, improve its ship, reach a new place and Return with a meaningful result in roughly 30–60 minutes | No wall-clock wait, hidden prerequisite or fake progress; a first-time human can explain why the next place matters |
| World opportunity model | Every destination visibly and deterministically signals some mix of materials, creatures, ruins/anomalies, blueprints, hazards, lore or Guardian leads | Scanning informs a choice without spoiling everything; opportunity claims agree with the seeded world and available actions |
| Loot and economy readability | Build tags, compare/inspect, visible source/range, deterministic targeted crafting, filter/salvage rules and aspirational chase items serve distinct playstyles | A player can trace sources, sinks and upgrade pacing; random drops never obscure the route to a useful build |
| Combat choices before combat spectacle | Party roles, telegraphed intent, preparation, counterplay, retreat and settlement terms are defined before battle UI is expanded | Representative encounters reward readable decisions, not opaque counters or a larger-number stat check |
| Constructive legacy | A later, bounded frontier-project layer (scanner relays, labs, shelters, cargo beacons, observatories) and a player legacy layer (Chronicle, museum, ship/discovery history, Guardian trophies and share cards) | Projects use finite, visible inputs, never decay, demand maintenance or create mandatory offline income; history is earned and player-owned |
| Human playtest cadence | Recurring first-30-minute, first-three-session and long-session tests assess delight, comprehension, agency, attachment, fatigue, accessibility, heat and pacing | Reports are committed against exact previews and never substituted by automated personas or retention-pressure metrics |

The first journey is the product's primary integration gate. Deeper breadth, passive systems
and content volume wait until that journey is understandable, exciting and respectful.

### Open P1/P2 findings

**P1 — fix before expanding the loop:**

1. Charter data/copy exposes mining, fabrication and Shipyard goals whose actions/writers do
   not exist in v2. A fresh expedition can reach an impossible live objective. Project only
   actionable goals/copy until the full engineer outcome exists.
2. The possible 1,500-row Compendium eagerly paints/mounts full 440px sources while 132px
   thumbnails are derived later. Mounted decoded images can exceed a gigabyte before browser
   overhead; entry-count caches do not bound them. Virtualization, cancellation, replacement
   and a deliberately failing memory-plateau control precede richer portrait work.
3. Companion identity/missions require an acquisition owner: Survey alone cannot create a
   catalogue page or living instance. Port finite Tame/Scavenge/Sample receipt writers before
   presenting collection, breeding or dispatch as reachable.

**P2 — retain in the implementation queue:**

- ordinary Pixi/Canvas scene texture ownership and `_rgCache` remain unbounded beyond the
  explicit reload teardown; small galaxy/planet/thumb caches have off-by-one caps;
- the complete portrait key correctly prevents lineage collisions but includes nonvisual
  progression such as `g.xp`, creating future byte-identical churn; narrow it only after
  an exhaustive painter-reader/hash audit;
- legacy Auto-Extractor wall-clock accrual permits clock-wind ore;
- the legacy biome-fauna reader references a missing `BIOME_SETS.fauna` route;
- the legacy affix formula and five-system/62-item documentation drift was corrected in this
  batch; executable golden vectors and complete economy-manifest parity remain open;
- the conquest-loss XP key can let the earlier +3 award foreclose the advertised near-brink +5;
- a generated HD-art compatibility cluster appears unreferenced, but removal requires
  lifter ownership plus parity/pixel proof—no visual/history/fixture code is deleted by hunch.

### Staged implementation and required proof

| Arc | Deliverable | Proof before advancing |
| --- | --- | --- |
| 0 — current truth | Actionable Charter projection/copy; canonical CF1 galaxy → star → planet identity proof; deterministic world-opportunity and first-journey contracts; source/doc table corrections | Fresh save cannot receive an impossible live goal; every surfaced opportunity maps to a real action; no world-bound ownership receipt/writer exists before the canonical identity seam is proven; Guide remains honest |
| 1 — portrait/ship foundation | Virtualized async 132px thumbnails, 440px detail service, pure reach-shared `ShipVisualState`, static four-chassis/hardpoint proof | 1,500-row bound, all ship states, phone/desktop human review, warm memory plateau with negative controls |
| 2 — item instances and readable economy | Versioned schema/migration, Inventory, equip/salvage/inspect, deterministic tables, build tags/comparison and source/sink/pacing ledger | Fixed-point migration, exact-instance mutation, no duplicate/reroll/overflow loss; sources, ranges and targeted-crafting/salvage paths are inspectable |
| 3 — engineering | Mining/skimming/research/fabrication and visible ship-build outcomes | Real-action rewards, finite veins, active-play extraction, reach/visual/Guide agreement |
| 4 — capture/ownership | Finite Tame/Scavenge/Sample writers, Biosphere Yield and catalogue/owned split | Real-action page/specimen creation, attempt spend/recovery, no duplicate/reroll/two-tab grant |
| 4.5 — first complete journey | Fresh-start Survey → opportunity → Gather → Build → Tame → ship upgrade → farther reach → meaningful Return | First-time 30–60-minute human path proves comprehension, agency and satisfying pacing without idle waits or a scripted fake reward |
| 5 — companions | Nonlethal breeding/recovery, care/bond/Chronicle, named memories and active-play missions | Fed inheritance, recovery/away locks, exact-once return, save-failure/two-tab controls |
| 5.5 — combat decision model | Role, preparation, telegraphing, counterplay, retreat and settlement rules are specified and scenario-proven before battle UI expands | Humans can choose and explain a viable response; no opaque hard-counter or stat-only outcome passes as strategy |
| 6 — combat/Guardians | Transcript-driven duel/conquest party UI and receipt rewards | Every XP/loot/injury/settlement faucet tested through the real action |
| 7 — audio foundation | Versioned mixer/lifecycle, procedural voice parity, audio lab and accessibility | Deterministic signatures/profiles, node/voice budgets, visibility resume, human listening gate |
| 8 — HD audio/content | Rights-ledgered Earth/family/hybrid voice plus combat/Guardian/ship/biome layers | Route/rights coverage, family distinction, real-device heat and listening |
| 9 — frontier legacy and projects | Chronicle/museum, ship/discovery/Guardian history, share cards and optional bounded frontier projects | Finite visible inputs; no decay, mandatory maintenance or offline-income loop; every legacy record has a real action owner |
| 10 — integration beta | Living selected previews, travel reuse, balance and complete Guide/Training | Full battery, save migration, long-session memory/audio plateau, and recurring first-30-minute/first-three-session/long-session human play |

Ship visuals derive from the exact reach decision: Scout/Chemical, Jump/Interstellar,
Array/Survey Cruiser and Intergalactic/Frontier chassis, with real owned extractor/scoop
hardpoints. A legacy `ascCh`-complete save without drive items gets an honest generic
charter-refit provenance, never a bare full-reach scout or a falsely named installed drive.
At most one selected Shipyard/companion Pixi preview exists; it pauses hidden/reduced-motion
and destroys its owned resources on close. Dense lists remain static DOM images.

### Full unfinished-system inventory

**Product systems still open in v2:**

- full Inventory/Cargo, explorer paper doll, item inspection and equipment actions;
- Shipyard, mining, skimming, research, fabrication, salvage and visual ship progression;
- deterministic world-opportunity discovery that connects location, reward family, hazard and
  available action without promising an unavailable system;
- stable item-instance loot, affix pools, build tags/comparison, source/range inspection,
  source/sink/pacing review, atomic reward receipts, deterministic targeted craft/salvage/reforge
  rules and Guardian drops;
- Tame/Scavenge/Sample acquisition, finite Biosphere Yield and catalogue/specimen ownership;
- catalogue/owned-creature split, feeding, injury care, breeding, lineage, XP/classes,
  Companion bond, Chronicle and safe legacy migration;
- the first complete fresh-start 30–60-minute journey and its honest Guide/Training path;
- combat decision rules, then friendly duels, conquest, Apex Guardians, settlement and
  Binder/Paragon outcomes;
- active-play Companion mission dispatch/away/return and exact-once loot;
- complete creature/biome/combat/Guardian/ship/music audio, rights ledger and accessible mixer;
- live Field Training, tooltip/Advanced Briefing and Guide coverage as each system lands;
- achievements, complete Charter writers/rewards, Stardust economy and endings;
- player legacy: named companion memories, ship history, discovery/Guardian museum and
  shareable build/discovery cards;
- optional bounded frontier projects (scanner relays, labs, shelters, cargo beacons and
  observatories), explicitly without decay, mandatory maintenance or offline-income pressure.

**Foundation and quality work still open:**

- canonical CF1 galaxy → star → planet hierarchy;
- protected legacy `tsnap` restoration and complete CFB parent identity;
- Compendium virtualization, bounded thumbnail/audio work and explicit resource ownership;
- Pixi/Canvas texture ownership plus long-session travel/Compendium/Shipyard plateau;
- live HD planet replacement, living organism rigs and biome/ecology scenes;
- epoch invalidation and hidden-tab/reduced-motion policy;
- split-store/CAS or a serialized cross-tab coordinator for exact-once mutations;
- remaining Gate-B parity, ≤1-second answerability, whole-app accessibility and PWA/offline/
  rollback work, and formal 1,250-row/all-bloodline art certification;
- real veteran-save Gate C, human listening Gate G, physical-mobile Gate I and sustained heat QA;
- recurring exact-preview human playtests: first 30 minutes, first three sessions and long
  sessions, covering delight, comprehension, agency, attachment, fatigue, accessibility and pacing.

Trustworthy identity, ownership, migration and atomic receipts precede high-volume content.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`. The clean pre-batch
integration baseline was `c20941c5b309f0f7d5160b04f869af85c3b905ba`,
equal to `origin/develop`. The current working copy is a docs/design-only architecture
batch; no source, test or player capability changed.

**GitHub step:** after the scoped documentation diff-check, commit and push the exact
`openai/mac` head and open a new PR to `develop`. Under standing authority, only that
unchanged clean, mergeable, terminal-green head may merge normally; then monitor its
resulting push battery and mapped development publication.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `Define the 10/10 exploration, ships, loot, companions, and audio roadmap`
- Copy-ready description:

  > Defines the docs-only master architecture and 10/10 acceptance bar for the next Celestial
  > Frontier mastery loop: a first complete 30–60-minute journey, deterministic world
  > opportunities, bounded portrait delivery, visible ship progression, readable item-instance
  > loot/economy, companions and active-play missions, combat counterplay before battle UI,
  > later frontier projects/player legacy, recurring human playtests, and rights-ledgered HD
  > audio. Refreshes the relevant system references, decisions, rubrics, codebase/readme maps
  > and live handoffs; records the P1 Charter/Compendium findings and the full P2 ownership,
  > clock, reward and stale-contract queue. Current v2 boundaries remain explicit. No gameplay
  > capability, in-game Guide/release bulletin, source, test,
  > production version, `develop` → `main` merge, manual release or deployment is included.
  > Verification: `git diff --check` and changed-Markdown local-link scan; verbatim ROADMAP
  > archive proof and byte-exact HANDOFF historical tail; root golden seeds 198,000/198,000,
  > code fixtures 108/108 with 6 invariants, audio profiles 200/200, rarity 60,000,000 with
  > zero downgrades and dead-code scan with only 3 tooling-owned references; v2 Vitest
  > 274 pass/1 skip, Guide 17/17, both TypeScript programs, unused-symbol check, spec
  > 454/0/0, override routes 1,014/1,014, coverage 1,010/1,010, and glass/smoke-report/
  > preview/persona selftests. Root validate and smoke also passed; the attempted local root
  > layout run produced no product evidence because sandbox Edge SIGABRTed before CDP startup.
  > The PR's required real-browser battery remains authoritative. After merge, Anthropic/Claude Code may
  > synchronize from the then-current `origin/develop`.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not
need to be opened now. This architecture batch is not in `develop` until its PR merges.
At its next coding batch after merge, from a clean worktree, fetch and merge the then-current
`origin/develop`; if dirty, finish or commit its own work first. Never copy files manually.

**Release status:** no source, capability, production version, release or deployment was
performed by this batch. The last verified development publication remains publisher
`31688439513` / job `94409926305` at source `c20941c5b309f0f7d5160b04f869af85c3b905ba`,
destination `da5dc493ca9daaff6962012056016cb6cfb0e96b`, content SHA-256
`69856a51bf2ad702651ac617265832363a0e14b6e50123d97176752c2166a8a0` and build
`develop-c20941c5b309`; production job `94409927127` skipped and production remains
v1.8.9 at `0a5ee134d8e9724fdae909d75b3a5e3811e54166`.
