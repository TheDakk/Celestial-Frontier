# Long-session work order — the meat of the coding

Issued 2026-09-12 by Nick (authorization below), written by Claude. Governs both agents until Nick revises it. Read after ROADMAP.md, PROCESS_LAWS.md and PARALLEL_GIT_PROTOCOL.md; those still apply.

## Standing authorization (Nick, 2026-09-12)

> Proceed through the work packages without asking between steps. Stop only for: a kit wording change, the first image or sound of a new class, a GitHub write, a history rewrite, or a scope question. Report at each package's acceptance with the evidence named in this plan.

## Decisions taken with this order

- **Branches:** no new long-lived branches. Codex works on `openai/mac`; Claude works on `anthropic/mac`, which now contains the merged history of `openai/mac` at 1e65e006 (merge commit on 2026-09-12). Both agents may fan out temporary subagents inside their own worktree on disjoint paths; no temporary branches are left behind.
- **Merges into develop use merge commits, not squash.** Two agents share history; squashing one side would make the other side's later merge conflict with itself. Cleanliness comes from the pruning batch and the tree at the head, not from rewritten history.
- **Evidence size:** Nick approved migrating bulky evidence in `audits/` (files over 1 MB: profiles, GIFs, tarballs, screenshots) to Git LFS on `openai/mac` before its PRs are readied. This rewrites `openai/mac` only; Codex performs it once, with Nick's explicit go at that moment, and Claude re-merges afterwards.
- **Research tools tier merges into develop** as tools, with no game change.

## Lanes and file ownership (disjoint; do not edit the other lane's paths)

| Lane | Owns |
|---|---|
| Codex | kit compiler and painting (`landfall-conditioning.ts`, `tools/local-image-generation/**`, `ART_KIT.md` under Nick's approval), the parts rig runtime (`tools/creature-animation/**`, `tools/quadruped-proof/**`, `apps/game/src/creature-rig*`), arena intake and library rollout, sound source recording, the pruning batch and PR split |
| Claude | new modules only, under `port/v2/apps/game/src/motion/`, `effects/`, `battle2/`, `soundkit/`, `worldlife/`, and their tests under `port/v2/tests/`; plus docs it authors under `audits/CLAUDE_*` and the three kit companions when Nick approves wording |
| Shared by contract only | `main.ts` wiring: Claude adds an adapter file per module and one import; Codex owns the existing wiring; both announce any `main.ts` hunk in the commit message |

## Work packages

Each package ends at an acceptance with named evidence. Mechanical gates are typecheck, the package's tests with negative controls, and root `node tools/validate.js`. A visual or audible acceptance is Nick's, delivered as a capture or a rendered file.

| # | Lane | Package | Acceptance evidence |
|---|---|---|---|
| C1 | Codex | Kit v4.3 theme material table (Nick approves diff), Wild repaint, MID foliage despill pass | images |
| C2 | Codex | Parts rig over the accepted masters: part masks, joint patches, pose application, atlas via the pinned packer; Civet versus Platypus turn in the accepted arena using Motion Kit timings; captures for Civet, fox, procedural | ten-second captures |
| C3 | Codex | Sound sources: quadruped voice archetype, Wild theme set, battle set, temperate rain bed, fur impacts; rights recorded | listening files |
| C4 | Codex | Library rollout twelve at a time in the approved order; arenas per biome family | review sheets |
| C5 | Codex | Pruning batch and PR split per CLEAN_PROMOTION_PLAN; LFS migration on Nick's go | green on exact heads |
| A1 | Claude | Motion compiler: body card from the resolved-anatomy record; template library data model; GSAP timeline builder for actions; secondary motion by material; mass-scaled timing table; budget guard; fallback labelling | tests with negative controls (clock read fails, unknown template refuses, bounds clamp flags); a capture on a fixture quadruped |
| A2 | Claude | Seeded emitter and effects sequencer on Pixi 8: launch, travel, impact from the anchors JSON, deterministic from the recipe seed | byte-identical replay test; capture with the Wild sequence |
| A3 | Claude | Battle scene v2: arena compose (far, mid, near parallax at .10/.50/1.20), turn choreography (timing bar, cursor, run-up, hitstop, flash, shake, damage number), wired to combat math through an adapter, labelled whole-portrait fallback until C2 lands | dom-tier reachability and outcome tests; capture |
| A4 | Claude | Sound derivation engine: voice card compiler; deterministic pitch, formant, time and layer processing through offline Web Audio rendering; cue registry from the Sound Kit vocabulary; mix integration with the existing ducking runtime | byte-identical replay test; Civet, fox and procedural voices rendered from one archetype for Nick to hear |
| A5 | Claude | World-life layer for landfalls and arenas: rain and snow at card density, mist drift, water shimmer, foliage sway by weather, seeded | replay test; capture on the accepted landfall |
| A6 | Claude | Remaining defect register items not in Codex's lane; docs sync for the new modules; MOTION_KIT and SOUND_KIT marked "matches code as of" | green on exact head |

Order for Claude: A1, A2, A3 (with fixture rig), A5, A4, A6. Order for Codex: C1, C2, C3, C4, C5.

## Interfaces (contracts, so the lanes do not block each other)

- Resolved-anatomy record: the JSON Codex's bridge and landmark files emit (`cf.creature-blender-phenotype/v1` lineage and the `*.landmarks.json` shape). Claude's body-card compiler reads it and refuses missing fields with a named reason; it never invents anatomy.
- Parts rig runtime (C2) exposes: load parts for a record, apply a pose (joint rotations and offsets), expose part display objects and pivots. Until it lands, Claude's battle scene uses a fixture rig with the same interface and labels captures as fixture.
- Effects sequencer (A2) consumes the anchors JSON per sequence (`cf.effect-sequence-anchors/v1`).
- Sound engine (A4) consumes source sets by archetype key and the voice card; until C3 lands it uses labelled placeholder recordings that are never shipped.

## Reporting

Each package closes with a short entry in `audits/LONG_SESSION_20260913/LOG.md`: package, commit, evidence paths, what was not done. No GitHub step in any package. PR42 stays parked until C5.
