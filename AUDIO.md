# AUDIO — creature voices, combat, ambience, feedback grammar

**STATUS:** the legacy sections describe immutable production v1.8.9; their last source audit was
2026-07-30. The dated v2 overlay below matches the development boundary and approved direction as
of **2026-08-24**. It distinguishes the stings-only player application from the separate
package-only Arc 7 foundation and the later content, integration and HUMAN work that remain open.
**Shipped (production v1):** v1.8.0 "The Connection" · corrected and widened in v1.8.4
"Clear Ground".

**Purpose:** everything the game makes a sound with. Written after an external round found the
whole layer undocumented despite being the largest single feature of v1.8.

---

## 0. v2.0 overlay — current boundary and approved next-arc direction (2026-08-24)

### 0.1 Truth boundary

The current v2 **player application is stings-only**. `@cf/audio` exports the synthesized rarity,
survey and navigation compatibility facade; the application imports initialization, survey,
navigation and gain operations, calls survey ping and travel whoosh, and leaves the rarity sting as
an exported discovery seam. Current v2 Settings expose only master Sound and volume.

The package facade is safe before application initialization: every exported sting and
`applySfxGain()` is a no-op until `initAudio()` installs the save-backed seam. Initialization itself
does not create a context. Afterward, Sound-off remains a real mute-before-create gate; the first
enabled sting lazily chooses standard `AudioContext` first, falls back to `webkitAudioContext` only
when the standard constructor is absent, and reuses the resulting context. A bounded package suite
exercises import/pre-init safety, all four non-initializer public operations, post-init dispatch,
live mute state, constructor precedence/fallback, unavailable or throwing constructors, and
suspended-context resume rejection. This is contract/lifecycle hardening of the public package seam. During the
awaited save-load, the current app assigns the save and then calls `initAudio()` synchronously,
before later playable scene/input publication; no ordinary current pre-init action route to the
former exception has been reproduced.

Separately, the package now contains a **package-only Arc 7 foundation**: pure resolver-v1
`AudioSignature`/profile/call-plan data over already-normalized inputs; a pinned
1,014-route/1,010-identity coarse kingdom taxonomy and sound-output witness; pure distant-ecology
and settled-expression plan seams; an injected five-category mixer, limiter, meters, lifecycle,
voice/concurrency manager and bounded diagnostics; a pure two-cycle lab audit; and a pinned empty
rights manifest with a pure validator. The committed package policy rejects configured maxima above
eight creature emitters or 120 live nodes before context creation. The compatibility stings deliberately
remain outside that runtime's lifecycle and accounting.

There are still no player-live v2 creature calls, combat or Guardian cues, ambience, music,
recorded assets or asset loader. No canonical app-creature/event adapter, authored voice graph,
app runtime owner or real-browser/device plateau exists. Imported `vce`/`cbx` creature-voice and
battle-sound preferences are preserved by persistence but are not yet live controls. Captions,
mono, dynamic range, reduced intensity, physical-device listening/heat/battery evidence and all
HUMAN appeal/comfort judgments remain open. Arc 7/8 and Gate G are therefore not closed.

The sections below remain the **approved Arc 7/8 contract**. They identify which package
foundations now exist and which product/content/evidence obligations remain. Capability-aware
Guide copy and release notes must continue to describe only the stings that actually work in the
application until a later capability is wired through its owning action and proved truthfully.

### 0.2 Deterministic identity means stable data, not identical rendered bytes

The portable invariant is:

```text
audio-relevant immutable phenotype + exact catalogue owner + surviving lineage
  + audio resolver version -> AudioSignature
AudioSignature -> AudioIdentityProfile + CreatureCallPlan
```

`AudioSignature` is an immutable typed projection, not a copy or hash of the complete mutable
genome/creature record. It contains only fields that can define audible identity: selected stable
phenotype genes, exact catalogue owner, normalized lineage inputs that survive persistence and the
audio resolver version. Mutable progression, condition and relationship fields -- `xp`, `hurt`,
`fed`, `brood`, `assignment` and `bond` -- are excluded. Changing any one of them must leave the
serialized signature, identity profile and call plan exactly unchanged.

The profile and cue plan must be finite, stable and reproducible without consuming or perturbing
gameplay RNG. The same creature therefore keeps its palette, register, phrase grammar, rhythm,
articulation and event plan across devices and shared expeditions. **Rendered PCM is not promised
to be byte-identical.** Web Audio oscillators, filters, resampling and output hardware differ by
browser/device, and presentation-only noise in v1 is not a cross-engine PCM contract. Tests compare
typed profiles, palette IDs and cue plans; they do not hash browser waveforms. Decorative jitter is
allowed only when it cannot alter identity, simulation, saves or authoritative tests.

The pure resolver-v1 package pipeline now implements this transformation **after** a caller supplies
an exact, already-normalized `AudioIdentityInput`, including its owner and surviving lineage. The
canonical application creature/save → audio-input projector is not implemented, and the player app
does not call the pipeline or render its plans.

### 0.3 Typed runtime, buses and lifecycle

The v2 package grows in stages behind one typed event boundary:

1. Pure `AudioSignature`, `AudioIdentityProfile`, `CreatureCallPlan`, `CombatCuePlan` and
   `AudioEvent` data modules, with no DOM, AudioContext or gameplay-state mutation.
2. A Web Audio engine owning `master -> music | ambience | creature | combat/gameplay | UI` buses,
   a safety limiter and explicit category routing. A narration bus is reserved until narration
   really exists; an empty slider is not a feature.
3. A voice manager with priorities, per-family cooldowns, concurrency groups, voice stealing and
   exact stop/disconnect ownership. Short synthesized layers remain where they are distinctive;
   licensed local source palettes may be layered in later.
4. Gesture-safe context activation, honest blocked/suspended UI state, visible-tab resume,
   context-loss recovery, mute-before-create behavior, loop shutdown, route-transition cleanup and
   explicit `dispose()`. A hidden tab stops long-lived work. The approved ambience policy is
   **RESTART on visibility return**, re-armed safely when a browser requires another gesture.

The injected package runtime now provides the structural mixer/limiter/meter, voice ownership,
priority/cooldown/concurrency/stealing, mute/hidden/restart/context-loss and disposal foundation
behind an injected `AudioContextLike`. It is not constructed or driven by the application, does not
own the compatibility stings, and has no authored synthesis/asset renderer or browser evidence.

The approved v2 settings surface retains master volume and adds category gains only as their buses
become real. It restores independent Creature voices and Battle sound from the existing `vce` and
`cbx` fields, then may add dynamic-range profile, mono output, reduced-intensity/high-frequency
comfort, meaningful-sound captions and mute-when-unfocused. Reduced motion remains a visual choice;
it must not silently infer a hearing preference. No essential state, danger or success may be
audio-only: every meaningful cue has text, icon, animation or another equivalent.

### 0.4 Earth catalogue, kingdoms and hybrids

The current catalogue has **1,010 Earth identities owning 1,014 set-qualified route rows** because
four display names occur in two sets. Audio joins use the exact catalogue set/kingdom + name (or a
stronger stable ID), never a bare display name. A shared pure taxonomy may expose family/rig,
body/movement, habitat and sound-palette IDs to art and audio; audio must not import a private
browser painter or recreate its classifier from memory.

The honest player promise is: **each specimen receives a deterministic sonic signature assembled
from a curated biological/ecological family palette and synthesis.** It is not “every biological
species has its own recorded sample.” Fauna may select vocal/foley families. Flora, fungi and
microbes receive environmental or Compendium sonification appropriate to their kingdom and can
never fall through to a mammal call. Select iconic Earth species may receive an exact licensed
signature override when the rights ledger and listening review support it.

The visual cache may continue to use the complete plain genome as its pixel identity. Audio instead
keys the immutable `AudioSignature` projection defined in §0.2. For Earth-lineage hybrids, that
projection includes the `_earthBlend` name, exact `_earthBlendKingdom` owner and `_anchorVal` blend
already used by the portrait route, plus only selected audio-relevant phenotype and surviving
lineage fields. Reverse-parent children that share a seed but differ in those audible inputs must
not alias; changes only to `xp`, `hurt`, `fed`, `brood`, `assignment` or `bond` must not change the
voice. The current share format does not preserve complete parent objects, so the audio resolver
may rely only on lineage fields that actually survive normalization. If complete parent signatures
become necessary, that requires an explicit versioned sharing/save design.

`D-CFB-1` owns the minimum compatibility decision. Preserving its ordered two-uint32 parent-seed
tuple repairs lost lineage and can supply a stable lineage salt, but those seeds cannot reconstruct
both parents' complete audible phenotype/owner profiles. The premium hybrid promise therefore
requires either a versioned bounded parent-audio projection containing the signature inputs needed
for the blend, or conservative wording and a deterministic fallback based on the child's phenotype,
exact surviving owner/blend, anchor and ordered seed tuple. The tuple is never sorted. No
implementation may claim it combines both complete parent voices until the selected representation
round-trips and passes malformed/reverse-order controls.

Of the already-settled voice corrections, resolver-v1 now retains `legacy` as an emergency data
definition while excluding it from ordinary route/sound-witness selection. Replacing both hard f0
clips with a soft-saturation curve remains unimplemented and must be tuned only after HUMAN
listening; no player-live renderer consumes either policy yet.

### 0.5 Combat, Guardians and environmental cues

Combat audio consumes the completed deterministic duel transcript after simulation. A pure
`combatCuePlan(result, participants)` maps existing dodge, stun, damage, critical, first-strike,
execute, thorns, lifesteal, burn/regen and defeat events plus ability theme and body/material weight;
it never changes `runDuel`, advances its RNG or invents an outcome. Every cue owns a matching visual
or caption token. Guardian entrance/phase/victory/defeat motifs derive from the existing planet
seed, tier, epithet and ability fields, without changing `guardianFor`. Combat and Guardians are
not playable in the current v2 slice, so none of those cues may be advertised live yet. The legacy
skip path is silent; v2 must explicitly settle any result-only skip motif before implementing it.

Biome ambience later layers atmosphere, weather, terrain/water, hazard and distant ecology from a
typed environment profile. Silence is a valid layer, especially for vacuum, caves and abyssal
spaces. Environmental sonification must not imply that fauna exists on fauna-free worlds or turn
flora/fungi/microbes into animal calls. See `BIOME_ATLAS.md` and `CAPTURE_AND_BIOSPHERE.md` for the
presentation-only ecology link; it changes no roster, capture odds, yield or epoch rule.

### 0.6 Budgets, cache ownership and acceptance

Initial full-mix active-voice targets are **20–28 low/mobile, 28–40 standard mobile/tablet, 40–56
desktop standard and 56–72 desktop high**. Inside that mix, Gate G begins with at most **8
simultaneous creature-call emitters** and **120 live AudioNodes**. Those scopes are different: an
eight-creature cap is not an eight-voice whole-game mix. Real phones may require lower values.

The committed package policy defaults to 24 full-mix voices, eight creature emitters and 96 nodes,
and fails closed if a caller configures more than eight creature emitters or 120 nodes. Its tests cover
the exact 8/120 boundary, independent 9/121 rejections before context creation, the graph lower
bound and separate creature/node pressure. This is package policy/accounting evidence only: the
application and compatibility stings do not yet use that runtime, and no real-browser plateau has
been measured.

Encoded download bytes and decoded `AudioBuffer` bytes are separate budgets. Their exact tier caps
must be measured and locked in `budgets.json` before recorded media is accepted; there is no
approved byte number today, so this document does not manufacture one. The loader uses in-flight
fetch/decode deduplication and a decoded-buffer LRU capped by **bytes**, not item count. Profile/plan
caches are bounded and keyed by the serialized immutable `AudioSignature` (which includes resolver
version); per-creature rendered PCM is never cached. Travel, combat and background/foreground
cycles must plateau in encoded/decoded bytes, active sources, creature emitters and total nodes,
and every evicted/stopped source must disconnect.

Automation must cover resolver determinism/ranges, the complete 1,010-identity/1,014-route join,
non-fauna routing, profile collisions, lifecycle, settings defaults, manifest integrity, cache
plateaus, concurrency stealing, transcript-to-cue coverage and Guardian stability. Every new
instrument needs a deliberate failing control. Identity tests also require negative controls that
mutate `xp`, `hurt`, `fed`, `brood`, `assignment` and `bond` one at a time and prove the serialized
`AudioSignature`, `AudioIdentityProfile` and `CreatureCallPlan` remain exactly unchanged; paired
positive controls vary representative audio-relevant phenotype, exact-owner and lineage inputs.
Automation can prove structure and cleanup, not appeal.
**Human listening remains the quality gate:** headphones, phone speaker, mono, low volume,
reduced-intensity mix and long sessions, including blinded specimen-to-call matching for Earth,
procedural and hybrid examples. Profile uniqueness alone is not perceptual identification.

### 0.7 Rights, privacy and delivery

Future source palettes may contain project-owned recordings, CC0/public-domain material, or media
with explicit commercial modification and redistribution rights. No scraping, vague “fair use,”
unlicensed biological catalogue, human/celebrity voice cloning or biometric likeness is accepted.
The root code license does not automatically license third-party media.

`AUDIO_LICENSES.md` is the current empty human-readable rights ledger. `@cf/audio` now also pins an
empty versioned machine-readable authority and a pure fail-closed validator with negative controls.
That proves the zero-asset state and intake data contract; it does not inspect repository files or
media bytes and approves no asset. Before the first media asset lands, populate both ledgers and add
the concrete file/media observation and proof boundary. Each asset record carries stable ID,
creator/source, license and stored proof, commercial/derivative/redistribution/attribution terms,
acquisition date, processing chain,
original + runtime SHA-256, version, codec, duration, loop points, loudness, peak and tags. CI fails
closed on a missing/incompatible right, hash drift, missing file or orphan asset.

Runtime audio stays local/offline or same-origin with a silent/local fallback. It never needs a
microphone, `getUserMedia`, uploads, remote TTS, behavioural telemetry or third-party call-home, and
it must not disclose a genome/share identity through a network request.

### 0.8 Distant biosphere calls as a discovery layer

**Player promise:** while approaching or surveying a living world, once the owning approach/survey
surface has already presented a biosphere lead, faint distance-filtered calls can make that same
lead audible before landing. The player hears that a place is worth investigating without audio
becoming a hidden acquisition or spoiler channel.

The deterministic contract is:

```text
canonicalWorldKey + already surfaced opportunity/survey-roster projection + audio resolver version
  -> DistantEcologyHintPlan
```

The pure `createDistantEcologyHintPlan()` seam now implements this data contract and its hidden,
wrong-owner, silent/non-fauna and determinism controls. No approach/survey owner supplies it in the
application, and it performs no playback, ducking or lifecycle work.

The plan consumes the canonical world and the exact lead/roster projection the approach,
survey, or opportunity owner has already made player-visible. It never keys on a bare planet seed,
generates a second roster, selects a hidden/absent species, consumes gameplay RNG, or creates a
catalogue page, reward, claim, save mutation or acquisition outcome. A recognizable species call requires equivalent visual
information at the same semantic granularity; a generic life icon is not sufficient. Otherwise the
audio hint must stay at the already-visible family/category level.

Within this distant-discovery layer, eligible fauna-call stems route through the creature bus and
habitat/ecological beds route through ambience. Explicit organism-identity auditions remain governed
by the Creature voices control, including scientific/environmental identities for non-fauna. A mixed
authored stem must preserve those category controls rather than making Creature voices an inert
switch. Clustered/premixed layers stay inside the full-mix voice,
emitter and node budgets; not every distant organism becomes a spatial node. The layer ducks below
higher-priority UI/combat cues and honors the audio reduced-intensity setting. Route transition,
hidden-tab shutdown and `dispose()` release every owned layer.

A “silent world” control means the distant-call plan has no eligible call. It does not suppress an
honest biome ambience bed or non-fauna ecological sonification. Acceptance requires same-world
determinism, same-seed/different-canonical-world separation, a wrong/hidden-species failure, silent
and non-fauna controls, gameplay-RNG before/after equality, resource plateau, matching visual
information, priority-ducking/reduced-intensity controls and human listening for anticipation rather
than noise.

### 0.9 Expression on a stable audible identity

**Player promise:** a companion always sounds like itself, but a completed care or adventure event
can change how it expresses that identity. Injury can soften or shorten a call; feeding can select a
contented articulation; earned bond can support a greeting. Recognizability is never traded for a
mutable mood system.

Identity and expression are separate contracts:

```text
immutable inputs -> AudioSignature -> AudioIdentityProfile + CreatureCallPlan
CreatureCallPlan + settled AudioEvent -> CreatureExpressionCue
```

The package now implements the pure settled-event/caption-gated expression resolver and rejects
absence/polling, missing-counterpart and mutated-plan inputs. No live care, capture, companion or
combat writer emits these events, and no player playback path consumes the resulting cue.

`CreatureCallPlan` is an invariant repertoire. `hurt`, `fed`, `bond`, care and assignment state do
not change its serialized bytes, the signature or the identity profile. A separate pure resolver
selects one transient cue from stable signature + stable completed-event identity + resolver
version. Expression retains the creature's palette, register and phrase grammar; it changes only
articulation inside that identity. It never reads SessionRNG, wall clock, AudioContext state, an
idle-polled creature object, or an unsettled gameplay outcome.

Expression attaches only to completed typed events such as feed outcome, injury applied, care,
taming success, explicit selection, or companion-mission return. “Return greeting” never means
returning to the app after an absence. There are no absence-triggered distress calls, attendance
summons or pressure loops. Every meaningful expression has a text/visual/caption counterpart.

Acceptance includes deterministic `(signature,event)` vectors; byte-equality of signature,
identity profile and call plan across every mutable-state control; signature-drift, state-polling,
absence-trigger and missing-caption controls; and blinded listening that still matches one creature
across different expression states without long-session fatigue.

---

## 1. The production-v1 architectural rule

**Every sound is synthesised at runtime. There is never a sample.**

Zero `.mp3`/`.ogg`/`.wav`/`.m4a` references, zero `decodeAudioData`, zero audio bytes in the
payload. This is not an aesthetic preference — it is what protects the game's defining property:
one file, one link, instant. An externally measured paired A/B on an idle host put the whole v1.8
arc at **+8 ms load / +3 ms DOMContentLoaded**, and the arc's payload cost at **+2.4% gzip** for
*all* of v1.8, audio included.

> ⚠ Do not describe this as "zero added payload" — an external round correctly called that an
> overstatement. It is zero *audio-media* payload.

A second consequence: **a voice is a parameter set, not a recording.** The same genome resolves to
the same v1 profile parameters through every shared creature code. It does **not** render
byte-identical PCM on every device: Web Audio rendering is browser/hardware dependent, and v1's
presentation-noise buffers are not seeded identity data. Stable profile/cue-plan data—not PCM
hashes—is the portable determinism guarantee.

---

## 2. Plumbing

| Function | Role |
|---|---|
| `ac()` | The AudioContext accessor. **Returns `null` when `sndOn` is false** — this is the master gate for everything *new*. Resumes a suspended context (iOS suspends on background). |
| `sfxOut(a)` | The single shared gain bus every synth exits through, so one slider rules them all. |
| `applySfxGain()` | Squared taper — the slider tracks how loud it *feels*, not raw amplitude. |

### The `ac()` gate and its one exception

Because `ac()` returns `null` while muted, no *new* sound can start. **The biome ambience bed is
the only voice that outlives its trigger** — it is an already-running looped `BufferSource` with a
live LFO — so it is the only thing that must be told about a mute explicitly.

This was a real defect (round 7, CF1802-19): `sndopt` flipped `sndOn` and nothing else, so the bed
sang on after the player asked for silence, and kept the AudioContext alive. `ambienceStop()` is
now called from the toggle. **Rule: if you add a looping or long-lived node, it must have an
explicit stop path — the `ac()` gate will not save you.**

### Toggles

| Setting | Flag | Save field | Absent ⇒ |
|---|---|---|---|
| Sound (master) | `sndOn` | `snd` | on |
| Volume | `sfxVol` | `vol` | 100 |
| Creature voices | `voiceOn` | `vce` | **on** |
| Battle sound | `combatSfxOn` | `cbx` | **on** |

Voices and battle sound are independent by design (Nick): someone may want the fight loud and the
menagerie quiet, or the reverse. With voices off, **zero oscillators are created** — the gate is
real, not a volume trim (externally verified).

---

## 3. Creature voices

### The model

`voiceOf(g)` resolves a genome to `{kind, f0, rich, nz, vib, vibD, dur, sweep}`, deterministically.

1. **A named Earth animal selects its classified rig-family archetype.** `_earthArt(name).rig`
   selects a coarse `_VOICE` family — it is not a recording or exact biological-species call.
   The reveal path also calls `playVoice` for every kingdom while `_earthArt` falls back to mammal,
   so production v1 can give flora, fungi or microbes an animal-like call. That is a documented
   legacy flaw, not a behavior to port.
2. **A hybrid drifts.** `_blendVoice(base, alien, 1-anchor)` uses the renderer's own
   `_anchorVal` law, so a bloodline's voice drifts alien at exactly the rate its body does. Earth ×
   Earth pins at anchor 0.90 forever; each alien cross weakens it.
3. **A wholly procedural creature** picks its family by hash of `g.seed`.

### The 18 archetypes

`mammal · primate · bird · bat · reptile · serpent · amphibian · turtle · fish · marine · ceph ·
insect · arachnid · crust · gastropod · jelly · sessile · legacy`

A wolf roars (mammal, 148 Hz), a sparrow chirps (bird, 2068 Hz), a blue whale sings (marine,
187 Hz over 1.20 s), a rattlesnake hisses (serpent, 630 Hz, noise 0.95).

`legacy` is documented as the fallback for a genome with no rig, but it is in `_VOICE_KEYS`, so
~5.5% of procedural creatures roll it as a first-class 18th family in production v1.8.9. The port
decision is settled: keep the definition as a fallback but exclude it from ordinary procedural
selection. The package-only resolver-v1 now implements that correction: it retains `legacy` as
emergency data and excludes it from ordinary route/sound-witness selection. The player application
remains stings-only and has no canonical creature adapter or renderer consuming the resolver.

### Genes the voice reads (v1.8.4)

Originally **three**: family (hash of seed), `size % 6`, and temperament. That is a closed set of
18 × 6 × 5 = **540 possible voices, 533 distinct after clamping** — and an external 200,000-genome
run measured a **91.3% chance that two creatures in a collection of fifty share an identical
voice.** The portrait reads fifteen-plus genes; the voice read two and a hash.

v1.8.4 folds in five more as **bounded multipliers** (`_vw(v, n, amt)` returns `1 ± amt/2` across
the gene's range, so nothing can escape the clamps):

| Gene | Affects | Amount | Modulus | Vocabulary |
|---|---|---|---|---|
| `trait` | `f0` | 0.20 | `FA_TRAIT.length` | 25 |
| `body` | `f0` | 0.14 | `FA_BODY.length` | 16 |
| `loco` | `dur` | 0.18 | `FA_LOCO.length` | 18 |
| `diet` | `rich` | 0.22 | `FA_DIET.length` | 6 |
| `sense` | `nz`, `vib` | 0.12 | `FA_SENSE.length` | 10 |

No new branching, no payload, determinism untouched.

> ⚠ **v1.8.6 (CF1805-03) — all five moduli were wrong when this shipped**, and the table above
> records the corrected form. v1.8.4 hand-typed `7 / 9 / 6 / 5 / 6`, and not one of them matched
> its array. The effects were not uniform: `trait` folded **25** values onto 7 non-uniformly, so
> traits 0–3 were four times as common in the voice as 4–6; `diet`'s `%5` against **6** values made
> omnivore sound identical to herbivore. The vocabulary genuinely widened — CF1802-20 was
> substantially fixed — but it was not the clean traversal the design intended.
>
> The correct idiom (`% FA_TEMPER.length`) sat **three lines above** the wrong ones, on the
> temperament fix that landed in the same release. That is the lesson worth keeping: a
> hand-typed modulus is a silent, self-consistent lie. **Read the length from the array**, so a
> gene can never drift out of step with its own vocabulary.
>
> Fingerprint-safe: `voiceOf` is not one of the 50 determinism probes. Voices are derived, never
> persisted — so the vocabulary can be corrected without a re-pin. A creature's voice changes; its
> identity does not. See DETERMINISM.md's 2026-07-30 addendum.

### Size and temperament

- **Size → pitch**, monotone: `sizeF = 1/(0.55 + (g.size % 6) * 0.22)`, tiny ≈ 363 Hz down to
  titanic ≈ 121 Hz. The `% 6` matches `FA_SIZE`/`FA_SIZE_M` exactly, so the voice always agrees
  with the size the card prints. (This looked like a wrap bug to an external reviewer and was
  checked and cleared — it is correct.)
- **Temperament → boldness.** `bold = _TEMPER_BOLD[g.temper % FA_TEMPER.length]`, moving `f0` 33%,
  `rich` 47% and `dur` 21%.

  > ⚠ Until v1.8.4 this read `(g.behavior % 5) / 4` — **the wrong gene, under the wrong modulus.**
  > `behavior` is the behaviour line ("hunting in coordinated packs"), not temperament, and
  > `FA_BEHAVIOR` has 12 entries. Distinct behaviours collapsed onto one tilt in arbitrary order:
  > "ambushing from camouflage" carried the boldest voice and "fiercely territorial" nearly the
  > meekest. `_TEMPER_BOLD` is now an explicit value per `FA_TEMPER` entry, in that array's order.

### Clamps

`f0` is clamped to 60–6000 Hz. Sitting *on* a clamp is a bug, not a safety net: at the clamp,
size and temperament stop changing the voice, so those creatures are audibly identical. An
external run found **1.98% of 200,000 creatures pinned at 6000 Hz, every one of them a bat**
(f0 was 5200, within one size step of the ceiling) and 0.93% at the 60 Hz floor (sessile, jelly).
Bat is now 3600, and `playVoice` tapers gain above 4 kHz — equal amplitude is not equal loudness
in the shrillest band of human hearing.

> ⚠ **STILL OPEN as of v1.8.6 — the population number hid it.** Across the whole 200,000-genome
> run the ceiling rate fell from 1.98% to about 0.80%, which reads like a fix. A **focused sample
> of 10,000 named Bats** does not: **14.38% still land exactly on 6000 Hz** and 38.73% sit above
> 4 kHz (mean f0 ≈ 3,779). The rig is still frequently hard-clamped, so different Bat genomes
> converge on the same voice.
>
> Two things to carry forward. First, `_hiTaper` makes the pinned voices **quieter, not distinct** —
> it is an amplitude taper, so it improves comfort and does nothing for identity. Second, and more
> useful: **test each named Earth rig family independently, not only the global population.** A
> per-family defect is invisible in an aggregate where that family is 4 of 631 classified fauna.
> The port decision is now settled at **soft saturation at both bounds** so the extremes compress
> rather than collapse. The exact curve still waits for the human listening test, and the change is
> not implemented in the current player or package renderer foundation.

---

## 4. Combat

`playHit(frac, crit, ability)` — one sound per blow, wired into duel playback:

```js
playHit(L.dmg / Math.max(1, _mx), !!L.crit, !!(L.fs || L.ex || L.stp));
```

`frac` is the blow's damage as a fraction of the target's max HP, and it drives everything: the
body thump (`220 - heavy*120` Hz), the impact band (`900 + heavy*700`), the envelope and the tail.
Crits ring separately at 1760 → 2640 Hz; ability procs are a 330 → 880 Hz saw through a Q-4
bandpass. **Skipped playback is silent by design** (`!_skip`). Gated on `combatSfxOn`.

Before v1.8 a whole duel played exactly one sound, at the very end.

---

## 5. Planetfall and ambience

- `playArrival(tier)` — an arrival chord on planetfall, root pitched by world tier.
- `ambienceStart(key)` / `ambienceStop()` — a biome bed: two seconds of pink-ish noise, looped,
  through a bandpass whose frequency is swept by a slow LFO so it never sits flat. `_AMB` holds
  per-biome `{f, q, g, lfo}` for ice, tundra, desert, glass, ocean, coral, lava, magmasea, swamp,
  jungle, gas, carbon, plus `_def`.

**Lifecycle — the bed must never outlive its reason to exist.** It stops on: vista close
(`_vistaDismiss`), `visibilitychange` → hidden, master Sound off, and any `ambienceStart` (which
stops the previous bed first). Ramped down over 0.5 s, nodes stopped 700 ms later.

**Production v1.8.9 behavior:** nothing restarts the bed when the tab becomes visible again, so
returning to a vista leaves it silent. The port decision is now settled at **RESTART**, with a
gesture-safe re-arm when the browser blocks automatic resume. The injected v2 runtime implements
and tests the package-level hidden/restart/context-recovery policy, but the application does not
drive it and has no v2 ambience bed; compatibility stings remain outside its ownership.

---

## 6. The feedback grammar

The claim this layer makes is about a **contrast**: a blocked action must sound unmistakably
unlike a successful one, so a dead tap is recognisable before the words are read.

| Function | Meaning |
|---|---|
| `playDeny()` | 200 Hz → 150 Hz triangle pair. Refusal. |
| `playConfirm()` | 660 Hz → 990 Hz sine pair. Success. |
| `_denyPress()` / `_okPress()` | The **press-level** wrappers. Call these, not the raw tones. |

> ⚠ Two defects here are worth remembering because both were invisible to testing:
>
> 1. **`playConfirm` was defined, exported, destructured — and called from nowhere.** A grammar
>    built on a contrast shipped with one side wired. Nothing failed; the sound was simply never
>    heard.
> 2. **`playDeny` fired from inside `_denialHTML`, a markup builder.** Safe only by accident of
>    there being one call site outside a re-render loop — any future render path would have played
>    a refusal with no player action behind it.
>
> Hence `_denyPress`/`_okPress`: **a tone belongs to a press, never to a render.**

### Scope-trap warning

`_denyPress`/`_okPress` are defined at **true top level, after the `Fx` destructure** — not inside
the `Fx` module. The first cut put them next to `playDeny` inside the IIFE and every app-layer
caller threw `ReferenceError`. The export comment three lines above literally warns about this
trap ("the module-scope trap that cost rounds 4 and 5") and it still happened.

**Rule: a helper belongs in the scope of its callers, not its callees.**

### Where refusals sound

Specimen-card shortfall buttons (`.needs`, delegated) · the Fabricator shortfall button
(`.bclaim.need`) · the empty-picker denial · lesson-blocked verbs during training (`_tutRefuse`,
throttled to 600 ms so a mashed button cannot machine-gun).

---

## 7. Code anchors

`ac` 13516 · `sfxOut` 13485 · `_blendVoice` 13558 · `voiceOf` 13564 · `playVoice` 13609 ·
`playRaritySting` 13654 · `playFanfare` 16019 · `playHit` 16035 · `playArrival` 16082 ·
`ambienceStart` 16111 · `ambienceStop` 16132 · `playBlip` 16146 · `playDeny`/`playConfirm` 16162 ·
`_VOICE` 13526 · `_TEMPER_BOLD` just above it · `_AMB` near `ambienceStart`.

---

## 8. Testing

Audio is hard to gate and most of it is **not** covered by assertions on sound itself. What *is*
gated (smoke): the toggles round-trip; `_TEMPER_BOLD` has one entry per `FA_TEMPER` entry and the
most aggressive temperament is the boldest; two genomes differing only in `trait`/`diet`/`loco`
produce different voices; a bat-family voice still moves with size rather than pinning at the
clamp; `ambienceStop` exists and is callable.

The separate v2 package suites now exercise sting initialization, pure identity/lineage/mutable-field
contracts, the full set-qualified route inventory and sound witness, static purity, distant ecology,
settled expression, injected runtime lifecycle/ownership/budgets, pure lab accounting, and the empty
rights authority plus hypothetical intake failures. They do not listen, render through the player
application, inspect real media bytes, or measure a browser/device audio graph.

**What no harness here can do is judge whether any of it sounds good.** The repository has no
audio-capture or perceptual oracle, and no external persona fleet hears an audio signal, so a flat
A/B from one is meaningless rather than reassuring — an external round said exactly this and
declined to score it.

**A human listening test is the only instrument that can answer it.** The legacy lifecycle and
profile corrections make the test useful, but it has not been run and the clamp curve still must be
tuned from its evidence. Gate G therefore remains open before any large v2 audio expansion can be
called complete.
