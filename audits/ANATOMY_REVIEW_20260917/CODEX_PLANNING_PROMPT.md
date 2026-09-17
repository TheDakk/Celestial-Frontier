# Copy-ready prompt for OpenAI/Codex — PLAN ONLY, no code changes

Read Claude's consolidated review of the openai/mac worktree at HEAD
`0426ef4db5dc55205925725b9579ca61d960cd42` plus the staged September 17 batch:

- `audits/ANATOMY_REVIEW_20260917/CLAUDE_REVIEW_RESPONSE.md` (on anthropic/mac; Nick will supply the
  file or path — do not pull, merge or sync branches to obtain it).

Scope of this turn is **review and planning only**. Do not edit source, tests, kits, docs, evidence or
audit files. Do not run captures, native diagnostics, the full suite or any certification chain. Do not
sign, commit, push, label, dispatch, rerun, merge or publish. Do not retry the blocked 1Password signing
unless Nick has unlocked it and says so. Keep the staged implementation exactly as it is.

Produce one document, `audits/ANATOMY_COMPLETION_20260917/CODEX_REPAIR_PLAN.md` (write it locally,
unstaged, and report its path; nothing else changes), containing:

1. **Disposition per finding.** For every ID in the review (Pass 1 A1–A7, B1–B4, C1–C3, D1, E1–E2,
   F1–F2, G1–G2, H1, I1–I5; Pass 2 S1–S5, A8–A13): `agree` / `disagree` / `needs Nick`, with a
   one-line reason. Where you disagree, cite the exact file:line or evidence that contradicts the
   finding. Do not soften a finding by re-labelling it "diagnostic only".

2. **Bounded repair register**, ordered S2 → S3 → S4 → S1 → (A1, A2, A5, A6, B1, I1, I3) → S5, unless
   you argue a different order. For each repair: the exact files/functions touched, the shared contract
   it changes (template layer, performance owner, data table), what it must NOT touch (kits, masters,
   per-species clips, reserved effects/battle2/soundkit/worldlife, main.ts, version/save/seed), the
   negative control in both directions, and the acceptance proof (outcome test + which native capture
   or still Nick will look at). Estimate size in lines/files, not hours.

3. **Design questions for Nick**, each with your recommendation: B2 (crabBody gape — accept subtle or
   authorize a painted open gape), S2 direction (amplitude profile vs twig-level branch groups vs both),
   S1 frame-refusal policy (hold last pose vs degrade to field-only pose), S5 phone vertex budget, and
   whether the A2 plant root-key removal is confirmed as a library change or reverted.

4. **What you will re-run after the repairs and in what order**, and which existing evidence folders
   remain immutable history versus which get a new numbered sibling.

5. **Signing/commit sequence** for when Nick unlocks 1Password: the staged batch first, unchanged;
   the repair plan document second; repairs only after Nick approves this plan.

Report actual local commit/ahead state at the end; infer no remote state. PR42 stays parked; no PR is
needed for a plan. No GitHub writes.
