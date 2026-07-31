# Port decisions — resolutions to `PORT_MASTER_PLAN_v4.0.md` §23

**STATUS:** live record. Appended as decisions are made; nothing here is deleted.

§23 of the master plan lists "Known Decisions and Open Items to Resolve Before Production
Lock". That document is the supplied v4.0 plan and is **not edited** — resolutions live here
instead, so the plan stays the reference it was delivered as and the decisions stay findable.

> ## ⚠ DECIDED ≠ IMPLEMENTED
>
> Phase 0's deliverable is to **decide** the open design items, not to ship them. Every
> decision below is **recorded now and implemented in the port**, not in a v1.8.x release.
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

---

## Still open

| Item | Blocked on |
|---|---|
| Human listening test | 12–24 players. Unblocked by measurement (see `audio-profiles.json`) but not yet run. |
| Gate C — real veteran save | An export of Nick's iPhone save. A synthetic save is generated by the same code that reads it and cannot prove Gate C. |
| Raw/display rarity conversion | §16.3 — the port should make it an explicit function; today the collapse lives in the `GRADE_TIERS` data with no test guarding it (ROADMAP 9g). |
| Desktop training rail overlap | ROADMAP 11 — decide desktop behaviour before the Phase 4 UI parity gate. |
| Archetype economics | The reviewer's §2.3 addition — deep-engagement archetypes lose on both counters. Decision 1 above is a partial answer, not the whole one. |
| Remaining old backlog | Triage into fix-before-port vs inherit-and-fix. |
