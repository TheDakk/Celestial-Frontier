# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## ▶▶▶ SESSION HANDOFF — 2026-08-31 · A046 CHAIN STOP PRESERVED · COLLISION CONTROL REPAIR DEVELOP GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Retained exact clean SSH-signed browser source
  **a0460c6aca37ca923768828cde876e449a76cff8** is **61 commits ahead** of the remote agent branch.
  Exact SSH-signed implementation/evidence commit
  **23eb6dabeaf40cf0bc7878272b4f4893ad422113** is its **62-ahead** child and contains the bounded
  collision-control repair plus retained a046 carriers. This handoff's documentation-only
  descendant becomes the next browser candidate only after its signature and clean exact-source
  preflight are verified.
- **Immutable Compendium PASS:** Edge preflight passed on `152.0.4191.53` / CDP `1.3`.
  Compendium (**catalog/art stress**) run `20260831155807329-24237-1c6d2e89d5` passed **78/78**
  once/no-retry with zero findings in **64,166 ms**, and its exact named verifier passed.
- **Immutable Slice stop:** exact unchanged-source develop Slice run
  `20260831155943782-24588-a98f13f2c7b7` stored terminal `fail` once/no-retry after
  **359,647 ms** with exactly **1 finding / 1 scope**
  (`world-identity-collision-controls-failed`). Its named verifier correctly exited 2 because the
  predecessor was not PASS. Glass did not run; a0460c6 will not be retried or relabelled.
- **Authority:** no push, hosted run, PR Ready transition, merge, release, version bump, preview
  publication or deployment is authorized. `develop`, `main` and the live site are unchanged.

### What the retained red proved

The real collision assessment and **15/16** mutation controls passed. Atlas receipt/travel evidence
was fixture action order **[Alpha, Beta]**, while durable/rendered Atlas rows were newest-first
**[Beta, Alpha]**. The pointer control mutated Alpha's receipt using rendered row 1—which was also
Alpha—so its assignment changed nothing and correctly failed the instrument's “every control must
turn red” contract. This was an instrument ordering/alias defect, not a product identity defect.

### Bounded successor repair

- The pointer mutant now chooses the distinct measured sibling from the same `atlasTravel` carrier,
  requires both identities to be nonempty and different, and throws before assessment if assignment
  is inert.
- A red base collision assessment now causal-stops before controls and all later collision origins.
- The focused test executes the actual inline mutation against reversed display rows
  **[Beta, Alpha]** and action receipts **[Alpha, Beta]**, proves Alpha changes to Beta while rows
  remain untouched, proves the assessor red, and proves an equal-sibling mutant throws.
- Direct target travel/row and pointer travel/row/identity mutations remain independently red.
- No product source, save schema, migration, timeout, retry, browser threshold, Edge baseline,
  gameplay balance, creature/genome/biome/plant/fauna/Guardian structure, art, audio or deterministic
  generation changed.

### Verification so far

- Focused boundary: **1 file / 6 tests passed**.
- All three strict TypeScript programs passed; `node --check` and `git diff --check` passed.
- Independent review of this exact diff and retained evidence is **CLEAR**; the reviewer reran the
  focused and static checks.
- The complete develop profile is green at **253 files / 2,561 passed / 1 skipped**, all three
  TypeScript programs, **34** art sources, **1,014/1,014** routes and **454** non-inert fields.
  Current Compendium producer/budget authority remains
  `8d0600bbe98ff786818f05d3dff4f1b8da7dd9703863a9575df026b91755ca2b` /
  `e9c978bfdb885da8cbc6002c0f9af416d96120ca26a617b3758b898652b85a01`. No browser-green claim is
  made yet for the repaired candidate.
- Retained a046 carriers under `audits/` pass gzip integrity checks and preserve the exact
  Compendium PASS plus Slice JSON/log RED bytes and hashes. Exact implementation/evidence commit
  `23eb6dabeaf40cf0bc7878272b4f4893ad422113` carries an embedded Ed25519 SSH signature.
- The superseded a9d handoff is archived byte-verbatim at **7,761 bytes** / SHA-256
  `b14e8088871129e7c783cdd6151ffe43b379c3c52b36e66a348daaef6aca1159`.

### Exact remaining local sequence

1. Create the reviewed SSH-signed documentation descendant; verify clean source, the 23eb and docs
   embedded signatures, and tracked-input preflight. Browser-path, Compendium-instrument and CDP
   controls already passed once on unchanged owning inputs and are not repeated for this bounded
   Slice-control repair.
2. From that one unchanged clean signed candidate, run exactly one fail-fast/no-retry
   **Compendium → Slice (`develop`) → Glass (`develop`)** chain. Named-verify every report and stop
   immediately on any nonzero, red or instrument result. Do not run SceneMemory or Recovery.
3. If all three stages are green, retain their exact reports/logs/screenshots, refresh current docs
   once, and leave the requested self-contained Claude polish-review handoff. Do not rerun an
   unchanged green candidate.
4. **SceneMemory remains production-only/quarantined.** A future production candidate requires an
   explicit activation decision and the exact
   **SceneMemory → Compendium → Slice (`production`) → Glass (`production`) → Recovery** chain.

### Product vision and HUMAN boundary

The browser game remains the main bread-and-butter product: a deterministic, effectively infinite
universe built for repeat exploration, mining, crafting, exceptional loot and Pureforged gear,
creature discovery/care/breeding and Pokémon-like combat, Guardian progression and long-term
return play. Existing implemented systems and their source-aligned Markdown references are the
foundation; this campaign completes and certifies them without recreating established systems.

Automation does not substitute for authored design decisions or HUMAN acceptance. Still-open
decision/device work remains explicit in the system references and `port/V2_PROGRAM_ROADMAP.md`,
including conquest-imbue coexistence, another Guardian reward table, canonical mission/care/
healing rules, broader Chronicle/Museum history, achievement reward claims, Fifty Paragons,
remaining production media/depth, veteran import, accessibility, first-journey judgment and
physical phone/tablet install, heat, battery and true-GPU review.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** sign the documentation descendant, verify its clean exact source, then run
  its one develop Compendium → Slice → Glass chain. Preserve the first terminal result and do not
  push or invoke hosted CI.
- **GitHub now:** none. PR #35 remains the existing draft with base **develop** and source
  **openai/mac**. Its copy-ready title is **feat(v2): complete roadmap campaign and harden CI
  parity**. No exact push/head or hosted attempt is authorized.
- **Copy-ready PR description after local green:** “Completes the existing v2 roadmap campaign
  without recreating established systems; preserves creature/genome/universe art structures;
  hardens F4 action causality, protected Training truth, authoritative copy carriers, collision
  controls and property-scoped measured presentation evidence; synchronizes all current references;
  and records one exact local Compendium → Slice → Glass chain. No release, version bump or
  deployment is included.”
- **Claude Code now:** Nick does **not** need to open Claude yet, and Claude must not edit this
  OpenAI worktree. After PR #35 is terminal-green and merged into `develop`, Claude should branch
  from that exact integration commit under `anthropic/*` for the requested full-plan polish review.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
