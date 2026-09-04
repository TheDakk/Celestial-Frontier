# Port decisions — resolutions to `PORT_MASTER_PLAN_v4.0.md` §23

**STATUS:** live record. Appended as decisions are made; nothing here is deleted.

§23 of the master plan lists "Known Decisions and Open Items to Resolve Before Production
Lock". That document is the supplied v4.0 plan and is **not edited** — resolutions live here
instead, so the plan stays the reference it was delivered as and the decisions stay findable.

> ## ⚠ DECIDED ≠ IMPLEMENTED
>
> Phase 0's deliverable is to **decide** the open design items, not to ship them. Every
> decision below is **recorded now and will be implemented only in the port**, not in a v1.8.x
> release. A recorded decision remains planned until its executable outcome and gates land.
> Two reasons, and both matter:
>
> 1. **Implementing now would move fixtures that were just pinned.** A `voiceOf` change
>    invalidates `audio-profiles.json`; a `fed` change moves breeding parity in
>    `golden-seeds.json`. Those corpora are the thing Phase 1 checks itself against —
>    churning them to land a balance tweak trades the port's safety net for a change
>    nobody is waiting on.
> 2. **None of these is a critical fix.** The freeze rule (§20/§23) keeps the HTML build as
>    the reference product until Phase 4 parity and lets it take *critical* fixes. Balance
>    and design changes are not that.
>
> If any of these should land in the live HTML build sooner, that is a separate, deliberate
> call — and it means re-capturing the affected fixture in the same batch.

---

### Current catalogue-count erratum for the supplied master

`PORT_MASTER_PLAN_v4.0.md` is intentionally immutable and twice uses “1,014-entry catalogue.”
Current executable authority distinguishes **1,010 canonical kingdom-qualified identities** from
**1,014 set-qualified compatibility routes**. Implementations, persistence IDs and completion
counts use 1,010 identities; routing/parity coverage may report 1,014 routes. This current-layer
erratum prevents the historical wording from creating four duplicate canonical records.

---

## Decided 2026-07-31 (Nick)

### 1. Bred child inherits `fed` — **YES, 50% of the LOWER parent's `fed`**

*§23 row: "Bred child inherits `fed` — does not inherit; preview/card now honest."*

**Decision:** the child inherits **half of the lower parent's `fed`**.

**Reasoning.** The obvious objection is the `xp` precedent — `normGenome` deletes `xp` with
*"levels are YOUR creature's story — a shared one starts at 1."* But **breeding is not
sharing: both parents are consumed.** Nothing is duplicated; a fraction is carried forward
from something destroyed. Taking the *lower* parent prevents farming the bonus by feeding
one side only, and 50% keeps feeding the child itself worthwhile.

It also answers a measured problem rather than a felt one: the round-8 archetype table shows
the breeder losing on **both** counters (Δcodex −21) against a button-masher at Δ☄ 108. The
archetypes engaging most deeply currently pay for it.

**Port note:** `brood` is already summed across parents; `fed` was the outlier. Implement
both in one place so they cannot drift apart.

### 2. Ambience after tab return — **RESTART**

*§23 row: "Ambience after tab return — stops on hide and stays silent."*

**Decision:** ambience **restarts** when the tab becomes visible again.

**Reasoning.** Silence on return reads as a bug rather than as intent, and Gate G already
requires a clean background / mute / resume lifecycle, so the work is owed regardless.

**Port note:** resume must be gesture-safe — browsers block audible autoplay until a user
interaction, and the existing gesture-resume behaviour is release-blocking per §15.1.

### 3. `legacy` voice family — **FALLBACK ONLY**

*§23 row: "`legacy` voice family — possible procedural family."*

**Decision:** `legacy` is a **fallback only** and is excluded from procedural family selection.

**Reasoning.** It is a first-class family purely because `_VOICE_KEYS` is
`Object.keys(_VOICE)` and `_VOICE` includes `legacy` — 1-in-18 **by construction**, not by
design. Measured at **5.543%** of procedural fauna (`audio-profiles.json`), so roughly one
creature in eighteen speaks with the fallback voice. Almost certainly unintended.

Removing it costs essentially no variety: voices are already **99.855% unique** across
200,000 genomes, so one family out of eighteen is not what is carrying the vocabulary.

**Port note:** cheap to reverse if the listening test says it sounds good. Exclude it from
the selection list rather than deleting the definition — it is still needed as the fallback.

### 4. f0 clamp / the "bat ceiling" — **SOFT SATURATION AT BOTH ENDS**

*§23 row: "Bat voice hard ceiling — family can still clamp too often."*

**Decision:** replace the hard clamp with **soft saturation at both bounds**. The exact
curve is tuned **after** the human listening test.

**Reasoning.** `voiceOf` clamps `f0` to `[60, 6000]`. Measured over 200,000 genomes:
**0.874% pinned at the ceiling and 0.612% pinned at the floor.** The floor had never been
reported — the item was only ever framed as a ceiling problem. A pinned voice stops varying,
so both ends flatten the vocabulary in the same way. A soft knee compresses toward the bounds
instead of stacking on them.

The direction is settled now; the curve is a listening judgment, not a data one.

### 5. `main.js:14180` — the stale `size` premise — **KEEP BEHAVIOUR, FIX THE COMMENT**

*Not a §23 row; raised during Phase 0 as ROADMAP 9f.*

**Decision:** the load path continues **not** to wrap `size`. Only the justifying comment is
corrected.

**Reasoning.** The comment justified the behaviour with *"speciesGrade/rarityRoll/sapience
read `g.size` RAW (>=3, >=4, >=5)"* — which v1.8.9's own `_szOf` fix made false
(`speciesGrade` 2143–44 and `sapienceTier` 2036 both wrap; `rarityRoll` never reads `size`).
The **conclusion still holds, for a better reason than the one written**: wrapping at load
would rewrite stored data, and since every reader now wraps, it would buy nothing. This is
the field that caused the v1.8.6 save corruption, so the reasoning is worth stating
correctly. Comment-only; no behavioural change.

### 6. Beast placement pass ("weird shading around the animal") — **PORT DELTA ONLY**

*Not a §23 row; raised by Nick reviewing the Phase 0 pipeline spike (2026-07-31).*

**Decision:** the tuned placement pass (tufts alpha 0.92 near-black → ~0.58 green-tinted,
30% fewer, tapered; shadow pool 0.46 → 0.30, tighter) ships **in the port only**. The live
HTML build keeps the shipped pass; `main.js` untouched.

**Reasoning.** Diagnosed by controlled diff: the "weird shading" is the shipped occlusion
tufts + shadow pool at proof scale, not a pipeline bug. It is shipped art, so changing it
live would alter what players see for a change nobody is waiting on — and Phases 5/6 revisit
creature/biome presentation anyway with proper time budgeted. A/B evidence:
`port/spike/placement-ab-zoom.png`; the tuned pass lives in `port/spike/pipeline.cjs`.

---

## Open-item status

| Item | Current status / blocked on |
|---|---|
| Human listening test | 12–24 players. Unblocked by measurement (see `audio-profiles.json`) but not yet run. |
| Gate C — real veteran save | An export of Nick's iPhone save. A synthetic save is generated by the same code that reads it and cannot prove Gate C. |
| Raw/display rarity conversion | **Resolved 2026-08-26.** `rarity-presentation.ts` is the strict integer raw-tier 0–14 → display-tier 0–9 projection; malformed input discloses nothing, and focused tests bind all values plus the live Survey/Compendium consumers. |
| Desktop training rail overlap | **Resolved 2026-08-01.** The v2 desktop shell structurally re-homed Compendium to the left rail and the action cluster to bottom-right, while Training publishes its safe card boundary. Slice's ROADMAP-11 geometry control and the expanded Glass matrix guard the current composition. |
| Archetype economics | The reviewer's §2.3 addition — deep-engagement archetypes lose on both counters. Decision 1 above is a partial answer, not the whole one. |
| Remaining old backlog | Triage into fix-before-port vs inherit-and-fix. |

---

## Implementation resolution 2026-08-27 — master-plan tool roles

`PORT_MASTER_PLAN_v4.0.md` remains the immutable supplied plan and names Playwright,
Zod/JSON Schema, ESLint and Prettier as representative stack components. The executable port uses
the repository's already-adopted equivalents for those roles:

- owned raw CDP browser drivers cover real-browser, mobile, lifecycle, performance and evidence
  collection; repository law forbids a second Playwright/Puppeteer browser authority;
- strict versioned TypeScript codecs, hard bounds, import classifiers and fixed-point tests provide
  runtime data/save validation without adding Zod as a competing schema owner;
- strict TypeScript, `noUnused`, exact authority scanners and `artunused` provide executable static
  checks; review and diff checks own formatting consistency.

This preserves the plan's verification intent while keeping one browser lifecycle, one persistence
schema authority and one dependency surface. It is not permission to omit a gate: each substituted
check must remain fail-closed, source/input-bound and mutation-controlled.

### Root Gate-A browser authority — **VERSION-INDEPENDENT WITH FAIL-CLOSED CAPABILITIES**

**Decision (Nick, 2026-08-27):** routine Edge updates do not require a root rebaseline. Root
preflight accepts a canonical compatible Chromium-family product at CDP `1.3` only after exercising
the exact method inventory derived from `tools/uilayout.js` and `tools/bootperf.js`, and it retains
complete executable/product/version/revision/user-agent/JavaScript/protocol provenance for the run.
Family, protocol, provenance, capability, response-sentinel, lifecycle, geometry, behavior or real
budget failures remain red; point version alone is not a verdict key and moves no threshold.

The exact Edge build recorded under `port/baseline-v1.8.9/` remains truthful historical v1.8.9
capture evidence, not the active root authority. The isolated Compendium workflow's exact
Microsoft package installation remains separate reproducible provisioning; its ruler, and the
separate SceneMemory ruler, continue to own their own version-tolerant Edge-family capability/profile
contracts and exact per-run provenance.

---

## Decided 2026-08-13 (Nick) — exploration, ships, loot, companions and HD audio

These are product-direction decisions. They are recorded now and implemented only through
the staged gates in `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`; they do not make the current
Phase-4 slice feature-complete.

### 7. Core progression — **CAPABILITY-BUILDING EXPLORATION**

Celestial Frontier grows from a basic explorer into a universe-conquering expedition through
materials, crafting, increasingly capable ships and wider reach. The useful comparison is the
constructive exploration/building loop of Minecraft: learn a place, gather what it offers,
build a capability, and use that capability to reach a qualitatively new place.

### 8. Loot — **DETERMINISTIC EARNED ITEM INSTANCES**

The equipment chase takes inspiration from Diablo and Path of Exile, but rewards are earned
in play, source/ranges are transparent, and reload cannot reroll them. Stable item instances,
provenance and exact-once reward receipts replace deeper use of legacy slot-scoped `equipAff`.
Paid random rewards, hidden odds, expiring rewards and engagement-pressure rerolls are out.

### 9. Creature ownership — **CATALOGUE SPECIES ≠ LIVING COMPANION**

The port separates a discovered species record from owned living creature instances so two
individuals can share a species while retaining their own nickname, lineage, XP, care,
injury, bond, memories and assignment. Breeding/feeding/combat/dispatch target the individual;
the catalogue discovery is not the consumable object. Finite Tame/Scavenge/Sample outcomes are
the acquisition writers: every success creates/updates the catalogue identity, fauna Tame may
create a living instance, and non-fauna verbs create specimens/resources.

Normal v2 companion breeding is nonlethal. Both parent instances remain owned and enter a bounded
active-play Recovery assignment that temporarily blocks breeding, combat and dispatch. The child
inherits half of the lower parent's `fed` value, with reversed-parent vectors proving symmetry.
Legacy v1 parent consumption remains historical behavior; any future irreversible Fusion is
separately named, optional, expressly confirmed and never required for alien progression.

### 10. Companion missions — **ACTIVE-PLAY, EXACT-ONCE, NONLETHAL BY DEFAULT**

Companions may be dispatched on visible-risk missions and return with deterministic materials,
gear, blueprints, lore and mementos. The receipt is sealed and persisted at dispatch, progress
uses a dedicated persisted visible-and-answerable active-play millisecond clock rather than the
wall clock or capped ecology epoch, and claim is transactional/idempotent. One repository lease
advances time; every reward-bearing/destructive mutation—not claim alone—is revision checked.
Dispatch does not permanently kill a bonded companion; any separately named irreversible
combat mode requires explicit informed consent.

### 11. Ship presentation — **MECHANICS AND SILHOUETTE SHARE ONE STATE**

The Shipyard must visibly improve the vessel as real research/items land. A pure visual state
uses the same reach selector as travel: four strongly readable chassis stages plus installed
hardpoints, with an honest generic legacy-refit state for veteran chapter fallback. Art never
awards progression and three views may not disagree about the ship.

### 12. Audio — **FULL LOCAL HD IDENTITY, WITH HONEST BIOLOGICAL COVERAGE**

Every kingdom-qualified Earth catalogue row receives an intentional sound mapping and every
procedural/hybrid creature receives a recognizable deterministic profile. This means curated
family palettes, synthesis and selectively licensed signature recordings—not scraping or
claiming an authentic recording exists for every organism. Flora, fungi and microbes receive
ecological/interaction sonification, not counterfeit animal calls. Combat, Guardians, ships,
biomes and UI share a bounded accessible mixer. Profile/cue identity is deterministic; rendered
PCM is not promised byte-identical across browsers/hardware.

### 13. Player relationship — **MASTERY AND ATTACHMENT, NEVER DARK PATTERNS**

The game may be deep, surprising and highly replayable. It must not create compulsion through
streak decay, FOMO, punishment for taking a break, paid random rewards, hidden odds, expiring
missions, energy sales or manipulative notifications. Bond grows from varied meaningful play,
not attendance maintenance. Automated retention is never a release criterion.

---

## Decided 2026-08-14 (Nick) — HD audio discovery and expression

These two additions are approved product direction for Arcs 7–8. They do not change the current
stings-only v2 slice, Guide availability, release identity, or production version.

### 14. Distant biosphere calls — **PRESENTATION-ONLY, CANONICAL-ROSTER-BACKED DISCOVERY**

While approaching or surveying, once that owning surface has presented a biosphere lead, a world
may present faint distant calls from the same canonical, already player-visible lead/roster
projection. The layer uses no second roster generation or
gameplay RNG, never reveals an absent/hidden species, and cannot create a catalogue page, reward,
claim, acquisition, or save mutation. A recognizable species hint requires equivalent visual
information at the same semantic granularity. Arc 7 owns the typed hint plan, bus/lifecycle,
accessibility, diagnostics, priority ducking, audio reduced-intensity behavior and budgets; Arc 8
owns the authored roster-backed content and listening evidence.

### 15. Companion expression — **EVENT-OWNED VARIANTS WITHIN IMMUTABLE AUDIBLE IDENTITY**

Care, feeding, injury, taming, explicit selection and companion-mission return may select a
different articulation from one creature's stable call-plan repertoire. A separate pure expression
resolver consumes the settled event; `AudioSignature`, `AudioIdentityProfile` and
`CreatureCallPlan` remain byte-identical across mutable state. No idle polling, wall clock,
SessionRNG, app-return greeting, absence-triggered distress, attendance summons or pressure loop is
allowed, and every meaningful cue has a text/visual/caption counterpart. Arc 7 owns the expression
event seam and invariants; Arc 8 owns the authored variants and same-creature/different-state human
listening gate.

`D-CFB-1` remains an explicit compatibility decision. An ordered parent-seed tuple is the minimum
lineage bridge and may act as a deterministic salt, but it cannot reconstruct both parents' complete
audible traits. A true parent-voice blend needs a versioned bounded parent-audio projection; until
that representation is selected and proven, the documented deterministic fallback applies.

---

## Decided and implemented locally 2026-08-29 (Nick) — Arc 5 companion breeding V1

### 16. Normal companion breeding — **TRANSPARENT, NONLETHAL, ACTIVE-PLAY RECOVERY**

Arc 5 V1 accepts two distinct, living, owned fauna companion instances. Any two eligible fauna may
pair, preserving the legacy hybrid fantasy through the existing deterministic `crossGenome`
successor; this policy does not add a second genetics, lineage or ownership authority. Imported
exhibits, absent/non-owned creatures, mission-assigned or still-recovering companions, and parents
at Injured/Critical condition (`hurt >= 0.3`) are ineligible. A missing legacy `hurt` value is
healthy. A Recovery whose boundary has been reached is available at exact equality.

The public success chance remains the transparent legacy formula
`clamp(0.95 - (tierA + tierB) * 0.06 + earnedStardustBonus, 0.08, 0.97)`.
`earnedStardustBonus` is the audited projection of lifetime earned Stardust, increases by `0.01`
per complete 50, and is capped at `0.15`. The exact parent eligibility, both possible ownership
successors and complete-save capacity are proved before the one SessionRNG `breedOutcome` value is
exposed. A capacity or product refusal consumes no draw, receipt, revision or Recovery time.

Normal breeding never consumes or kills either parent. Every settled attempt places both parents
into F4 active-play Recovery: eight minutes on success and two minutes on failure. Recovery blocks
breed, combat and dispatch, does not advance from wall time, and projects to available when
`activePlayMs >= readyAtActivePlayMs`. Success admits the existing deterministic child successor,
including exactly half of the lower parent's bounded `fed`; failure creates no child. Either result
is one exact-five Arc 5 persistence transaction with one CAS, no hidden entropy, reroll, optimistic
publication or write retry.

This is now a local player-live capability from real-fauna Compendium detail. The primary and mate
selectors page exact instances 24 at a time, keep every eligible candidate reachable, show the
published chance without raw genes, and retain Back/Close during settlement. Guide, draft release,
Slice and Glass contracts name the live boundary and negative-control missing or contradictory
copy. No art, portrait, genome, genetics or lineage-rendering implementation changed.

---

## Implemented locally 2026-08-29 — exact-instance companion Rename

### 17. Companion nickname — **IDENTITY-ONLY, SANITIZED, ONE DURABLE WRITE**

Rename is available only from a real-fauna Compendium detail and targets one exact owned companion
from bounded 24-row pages. Stable instance identity keeps same-species twins separate. Because the
action changes identity only, assigned, recovering and injured companions remain eligible;
exhibition, non-owned, protected and revision-exhausted rows refuse.

The shipped name policy strips angle brackets, ampersands, quotation marks and apostrophes, trims
whitespace and caps the result at 24 characters. A cleaned-empty or unchanged result consumes no
receipt or write. One immutable receipt and exact-five CAS change only the chosen `nickname`; species,
genome, traits, lineage, assignment, condition, bond, catalogue alias and every other instance remain
unchanged. The old name remains visible until durability is verified. There is no RNG, automatic
retry or optimistic publication; stale, storage and unconfirmable postcommit results converge
read-only through reload so a rename cannot apply twice.

---

## Decided 2026-08-29 (Nick) — exceptional-craft player name

### 18. Fully exceptional fixed craft — **PUREFORGED**

The player-facing name for a supported slotted item crafted entirely from exceptional direct
materials is **Pureforged**. “Exceptional” remains the material grade and internal
provenance vocabulary; existing `exceptional-v1` identifiers, receipts and save identities do not
change. Current v2 Guide, release and evidence copy uses Pureforged for the gear/modifier outcome.
The frozen v1.8.9 Guide literal remains historical shipped wording. This naming decision does not
authorize new affix pools, rerolls, upgrades, sockets, vendors or disconnected effects.

---

## Decided 2026-09-04 (Nick) — feature-complete beta scope

### 19. Existing research consequences — **RESTORE, DO NOT OMIT FOR BETA**

Nick's direction is “We want everything implemented for the beta.” The five remaining research
rows are therefore implementation work, not features to leave disabled for a reduced beta:
Reinforced Hull consumes hostile-bioscan damage, Xenobotany Lab consumes explorer flora
nourishment, and Fusion/Antimatter/Warp Fold consume distance-derived travel presentation.
Preserve their authored costs, prerequisites and effects; do not substitute companion Feed,
ordinary combat damage or permanent travel reach for those original consumers. Presentation must
not delay durable navigation or manufacture waiting solely to sell a speed upgrade.

This resolves inclusion, not unimplemented numeric content tables or conflicting legacy/v2
creature stakes. Existing nonlethal ownership decisions and the named Arc 6 decisions below still
govern implementation. A pure resolver is not completion: keep each status partial until its real
action, persistence, UI and focused outcome evidence are connected. Human/device acceptance and
new GitHub/release authority remain separate.

---

## Open implementation decisions exposed 2026-08-29 — Arc 6 reward carriers

These are not new requests for numeric tuning. Source review proved the legacy inputs but found no
authoritative v2 coexistence policy, so implementation stops fail-closed until Nick resolves them.

### D-ARC6-AFFIX-1 — post-construction conquest imbue coexistence

The preserved oracle already fixes occurrence and result: canonical worn-slot order, 40% seeded
gate, seeded selected slot, one of the six legacy effect keys/magnitudes, and
`replace-slot-bound-affix`. Legacy had one role-less affix attached to the worn slot/base. A v2
`GearInstance` can independently carry natural prefix/suffix affixes and one Pureforged crafted
modifier. Decide which explicit new carrier owns conquest imbues, whether it replaces or coexists
with each existing axis, which gameplay-effect projector reads it, and what v4 `equipAff`
compatibility projection is authoritative. Do not relabel it prefix/suffix/crafted or stack it by
default. Until decided, a conquest whose exact gate plans an imbue refuses before CAS.

### D-ARC6-GUARDIAN-REWARD-1 — authored Guardian Gear/material reward

Legacy specifies Guardian capture, +40 guarded-world Stardust, scaled XP, Prime/Titan claims and
ordinary conquest affix behavior, but no separate authored one-time Guardian Gear/material table.
The v4 master plan promises a receipt-bound deterministic reward without choosing its contents,
pool, occurrence, scaling or capacity fallback. Those values require an authored loot/progression
decision. Until decided, the settlement records `guardianAuthoredReward:unsupported-open` and mints
no extra item or material; all source-specified capture/Prime/Stardust outcomes still settle.
