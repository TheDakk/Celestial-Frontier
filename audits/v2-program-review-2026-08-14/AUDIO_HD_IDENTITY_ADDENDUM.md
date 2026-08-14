# HD Audio Identity — approved direction addendum (Nick, 2026-08-14)

**STATUS:** approved product direction, not yet placed in the repository. This file is written to
be folded into `AUDIO.md`'s v2 next-arc overlay (new subsections under §0) during the next
implementation batch's same-batch doc refresh, with the roadmap cross-references below updated in
the same commit. Until placed, it is a design record only — nothing here is implemented, and no
Guide copy may describe it as live.

**Owner arcs:** Arc 7 (platform) and Arc 8 (content) in `port/V2_PROGRAM_ROADMAP.md` §5.8–5.9.
**Binding laws unchanged:** deterministic identity (AUDIO.md §0.2), rights ledger
(`AUDIO_LICENSES.md`), Guide truth, deep-play/no-dark-patterns, and Gate G human listening.

---

## 1. Confirmed intent (already contracted — recorded here for one-place reference)

These three are Nick's stated goals. All three are already covered by the existing documents;
the anchors are listed so nobody re-derives or accidentally weakens them.

### 1.1 Earth creatures sound like their real-life counterparts and are strictly identifiable

- Every one of the 1,010 kingdom-qualified Earth identities receives an **intentional** mapping:
  licensed/owned/CC0 signature recordings where rights and biology support them, then curated
  family palettes and synthesis (EXPLORATION §9 · DECISIONS §12 · V2_PROGRAM_ROADMAP §5.9).
- "Strictly identifiable" is a formal human gate, not a vibe: Gate G requires **blinded
  specimen-to-call matching** on phone speaker, headphones, and mono (RUBRICS Gate G ·
  AUDIO.md:147–151).
- Honest boundaries that stand: no scraped/unlicensed recordings, ever (`AUDIO_LICENSES.md`);
  organisms that are silent in life — flora, fungi, microbes — receive ecological/scientific
  sonification (wind, water, growth, spore, habitat texture), never counterfeit animal calls
  (AUDIO.md:119–122 · EXPLORATION §9).

### 1.2 Breeding folds into voice: hybrids have unique, lineage-derived voices

- `AudioSignature` already keys on **surviving lineage** plus immutable phenotype and exact
  catalogue owner; a hybrid's voice combines its parents' audible traits, and reverse-parent
  children that differ in audible inputs must sound different (AUDIO.md §0.2, §0.4).
- Mutable fields (`xp`, `hurt`, `fed`, `brood`, `assignment`, `bond`) never change identity —
  a creature you raised for fifty hours still sounds like itself (AUDIO.md:40–45).
- **Dependency Nick owns:** hybrid voices can only use lineage data that survives save/share.
  CFB codes currently lose parent identity — open decision `D-CFB-1` (DEVIATIONS:1256, placed in
  Arc 0 with the rule "before audio identity relies on it"). The resolution that serves this
  feature is **preserve the parent tuple**. Until decided, the deterministic fallback in
  AUDIO.md §0.4 applies.

### 1.3 Environment/biome sound, appropriate for every biome screen

- Biome ambience layers atmosphere, weather, terrain/water, hazard, and distant ecology per
  biome (AUDIO.md:119), on the dedicated ambience bus (master → music | ambience | creature |
  combat/gameplay | UI).
- The "appropriate for **every** screen" guarantee is structural: one versioned `BiomeProfile`
  drives visual, ecological, and audio presentation together, so sound cannot drift from what the
  screen shows, and the 43-profile coverage is an executable check (V2_PROGRAM_ROADMAP §6.5 ·
  BIOME_ATLAS.md).
- Silence remains an intentional authored layer for vacuum, caves, and abyssal spaces
  (V2_PROGRAM_ROADMAP §7.3). The v1.8 per-biome ambience bed (ice, tundra, desert, glass, ocean,
  coral, lava, magmasea, swamp, …) is the baseline to exceed, and the approved
  hidden-tab/mute/resume lifecycle rules apply unchanged (AUDIO.md §0.3 · DECISIONS §2).

---

## 2. New additions (approved 2026-08-14 — to be written into AUDIO.md §0 when placed)

### 2.1 Distant calls as a discovery layer ("you hear the biosphere before you meet it")

**Player promise:** approaching or surveying a living world lets faint, distance-filtered creature
calls drift up from its biosphere — an audio *hint* of what lives there, before landing. Discovery
anticipation becomes audible: an unfamiliar call on an unexplored world is a reason to land.

**Contract:**

- **Presentation-only, deterministic.** The hinted calls derive from the world's real deterministic
  roster (the same ecology output the survey card reads) and each creature's existing
  `AudioSignature`/call plan. No new gameplay RNG, no second roster roll, no reveal of anything the
  survey/opportunity system does not already own. Hearing a call never creates a catalogue page,
  reward, or claim — acquisition writers stay the only writers (EXPLORATION §7.1).
- **Honest hinting.** The layer may bias toward audible fauna actually present; it must never play
  a species the world does not host, and silent-biosphere worlds stay silent (which is itself
  information). It reveals a *lead*, in the same spirit as the world-opportunity map (EXPLORATION
  §1.1): survey reveals, actions grant.
- **Mix discipline.** Distant ecology uses clustered/premixed layers on the ambience/creature buses
  within the existing active-voice and emitter budgets (AUDIO.md §0.6); it ducks under UI/combat
  cues and respects reduced-intensity settings. Not every distant creature is a spatial node.
- **Accessibility.** An equivalent visual affordance accompanies the hint (e.g., the survey card's
  existing life indicators) — no information is audio-only.
- **Evidence:** deterministic hint-selection vectors (same world → same hint set), a
  wrong-species negative control (a call from a creature not in the roster must fail the gate), a
  silent-world control, budget/plateau coverage in the Arc 8 cycles, and [HUMAN] listening for
  whether the layer creates anticipation rather than noise.

### 2.2 Expression on a stable identity (bond/care/state call variants)

**Player promise:** your companion always sounds like *itself*, but not always the *same* — a hurt
creature sounds hurt, a freshly fed one content, a bonded one greets you. Attachment becomes
audible without ever breaking recognizability.

**Contract:**

- **Identity is immutable; expression selects within it.** The `AudioSignature` and
  `AudioIdentityProfile` remain untouched by mutable fields (AUDIO.md §0.2 law). Expression is a
  **variant selection inside the creature's existing `CreatureCallPlan`** — same palette, register,
  and phrase grammar; different articulation (softer attack, shorter phrases, lowered intensity).
  Changing `hurt`/`fed`/`bond` still leaves the serialized signature byte-identical; the
  mutable-field controls in Gate G keep proving that.
- **Event-owned, never state-polled.** Variants attach to completed game events (feed outcome,
  injury applied, care action, taming success, greeting on selection/return) — consuming settled
  outcomes exactly as combat audio consumes the duel transcript (EXPLORATION §8.1). No idle loop
  interrogates creature state to emote continuously.
- **Bond grammar respects the deep-play law.** Bond-expression variants are earned expression
  (EXPLORATION §7's bond-unlocks-expression rule), never a pressure mechanic: no distress audio
  designed to summon the player back, no absence-triggered vocalizations, nothing that punishes
  time away.
- **Blind-matching still passes.** The Gate G specimen-to-call test must succeed *across* a
  creature's expression variants — if a tester can't recognize a hurt wolf as the same wolf, the
  variant is too far from the identity. Add one blinded same-creature/different-state trial to the
  listening protocol.
- **Evidence:** deterministic variant-selection vectors per (signature, event) pair; a
  signature-drift control (an expression change that mutates the serialized signature must fail);
  caption/visual counterparts for every meaningful expressive cue; [HUMAN] listening for warmth vs.
  fatigue over long sessions.

---

## 3. Already-covered features worth remembering (no new work to record)

- **Compendium audition** — play a creature's voice from its detail card; identity stable across
  audition, travel, expedition return, and combat (EXPLORATION §9).
- **Guardian motifs** — a unique musical motif layered over the creature voice and encounter
  acoustics; derived from stable world/ability data (EXPLORATION §8.1 · V2_PROGRAM_ROADMAP §7.3).
- **Adaptive music** and ship/material/crafting/capture layers (Arc 8 scope, §5.9).
- **Ambience restarts on tab return**, gesture-safe (DECISIONS §2).
- **`legacy` voice = fallback only; soft-saturation pitch bounds tuned after the human listening
  test** (DECISIONS §3–4).
- **Device heat/battery and long-session comfort** are Gate G acceptance, not optional polish.

## 4. Placement instructions (for the batch that lands this file)

1. Fold §2.1 and §2.2 into `AUDIO.md` §0 as new numbered subsections of the v2 overlay, and add
   one line each to `port/V2_PROGRAM_ROADMAP.md` §5.9 (Arc 8 scope) and §7.3 (event ownership).
2. Add the same-creature/different-state blinded trial to the Gate G listening protocol row in
   `port/RUBRICS.md`.
3. Record the direction decision in `port/DECISIONS.md` (dated, Nick, 2026-08-14): distant-call
   discovery layer approved; expression-variant grammar approved; both presentation-only.
4. Cross-reference `D-CFB-1` from §1.2 so the parent-tuple decision cites hybrid voice as a
   consumer.
5. Update the affected "matches code as of" markers only when the systems actually land (Arc 7/8);
   this addendum itself is direction, not current behavior — the Guide continues to describe
   stings only until then.
