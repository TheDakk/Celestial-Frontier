# New-session prompt for Claude Code (anthropic lane) — intake compiler, 2026-09-21

You are resuming the Anthropic/Claude lane of Celestial Frontier on this Mac. Worktree
/Users/nick/Projects/celestial-frontier-anthropic-mac, branch anthropic/mac (verify with `git rev-parse --show-toplevel`
and `git branch --show-current`); origin/anthropic/mac is current as of 7d510e7e. Codex's lane is the sibling worktree
/Users/nick/Projects/celestial-frontier-openai-mac on openai/mac — READ ONLY by absolute path, never edit or sync it.
Read CLAUDE.md, PARALLEL_GIT_PROTOCOL.md, GITHUB_ACTIONS_BUDGET.md, then ROADMAP.md (handoff block at the end), then
audits/VISION_PROGRAM_20260920/PROGRAM.md (§5–§6) and INTAKE_COMPILER_DESIGN.md, then
port/v2/tools/anatomy-verify/README.md (slices 1–17 record every rule tried and its numbers — do not repeat them).

State: five painted crabs are accepted art (Nick) and rigged by Codex to films; Codex's IC-3 writers are FROZEN; no
new intake, painting, P2 or roster until the intake compiler passes IC-4 (PROGRAM §6). Painted-tier CPU gate is
3.5 ms desktop, boundary 24 canonical; three one-run reads at 3.6–4.0 ms are recorded findings, not to be chased.
Codex holds. Nick's open item: the coconut animation verdict.

Your task: the universal intake compiler (INTAKE_COMPILER_DESIGN.md). Rule: the compiler contains no creature and no
family — a template-driven graph matcher; if a step needs the word "crab", it is wrong. The crab is instance 1, the
Civet instance 2; every change is scored on the five painted crabs AND the Civet together with the runner pattern in
the README (Codex's hand landmarks are comparison truth only, never inputs). Code lives in
port/v2/tools/anatomy-verify/ (tips, thickness, ridge, chains, assign, walkback…); assign.mjs has TEMPLATES
(brachyuran, quadruped). Current best: 21/35 foot positions within 25 px, named 13/25 (precision over recall).

Next, in order (from README slice 17): (1) `view: 'front'|'side'` as a template property and the side rule that
follows it (side view: far/near by attachment depth/occlusion, not x); (2) all length thresholds as ratios of the
template's rest limb length through the body size (no working-pixel constants); (3) the body axis from the spine
ridge (two thickest nodes on the longest thick edge), not the thick-region centroid; (4) extend the exact per-side
assignment to forked appendages and stalk-knobs so claws and eyes are named in the same pass; (5) knees at the
template's segment ratios along each chain, hidden inference for empty slots (Codex's record rule), labels by geodesic
nearest chain; (6) IC-4 on the five crab fits, then the Civet through the identical code, with the three mutants
(erased leg, duplicated leg, wrong-template guide) refused.

Laws: commit signed (1Password; if the agent refuses, ask Nick to unlock, never fall back to unsigned); push
anthropic/mac only (Nick authorized this lane's pushes); no PR/merge/release/deploy; species counts come from the
species' visible anatomy; `hidden` is declared, never inferred from a missing landmark; a hand step on a creature is a
compiler bug; one owner per deliverable (painting tool and IC-3 writers are Codex's; registration, hidden inference,
labels, sheets are yours); record every failed rule with its numbers in the README before trying the next; end every
batch with a ROADMAP handoff and paired next steps for Nick, Codex and Claude.
