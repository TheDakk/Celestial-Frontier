# Batch 4 proposed PR fields

## PR #41 — updated fields; attempt 2 awaits Nick

Existing PR: https://github.com/TheDakk/Celestial-Frontier/pull/41. Do not open another PR.
The branch push updates this PR; no label or hosted attempt is authorized.

**Base:** `develop` at `9ea01041dcdc711190bbf909ea8bb743cd993734`.
**Source:** `openai/review-batch4-gameplay-20260905`. Signed, verified correction source:
`8f8948feb857a279b347ec7ffa096582befd7a3c`. The final user handoff supplies the exact pushed
reporting SHA. Product files remain unchanged from validated `b173353b9e273c4b223e8ee8d6ee181081f79b4a`.

**Title:** Connect authored expedition systems, creature progression and mature Atlas

**Description:**

Review correction: travel-presentation.test.ts now reads the tracked v1 source via readTrackedV1Source() instead of the gitignored main.js, so the hosted develop profile can run it.

Hosted-timeout correction: PR #41 run `33976307813`, battery job `101333510983`,
failed when the unchanged Glass targeted CLI test exceeded 15 seconds (16.693 seconds).
Raise only the requested per-test/child-process caps in glass-targeted-verifier,
evidence-chain-tools and arc4-acquisition-planner. Keep assertions, fixtures, selection,
worker settings and global config identical. No product, tool, pin, policy or workflow changes.

Complete the fresh-start v2 expedition loop with authored Research effects, explicit Discover
Life and Flora meals, Scout XP, the accepted Starter Charter, deterministic descent, fifty
Paragons, individual creature progression, and the mature Atlas. Co-deliver Guide, Training,
release copy and current references. Preserve exact authority, one receipt/CAS, deterministic
outcomes and the fresh-start save boundary.

Verify the existing mint/clone and WorldConfig controls, share only the production Research ID
owner, and move unchanged Landing presentation into its existing module. Record the first phone
analysis; unresolved profiler timings and reserved gameplay/art scope remain explicitly parked.

Earlier product validation: 301 files / 3,100 passed / 1 skipped, typecheck, artunused, Glass selftest,
exact-source Slice and both phone diagnostics, 50 unchanged legacy fingerprints and 81 budget
policy controls. The audit records source SHAs, report identities and all prior reds. Claude's
checkout receives the integrated work through develop after review. The first hosted attempt
is retained as RED; it was not retried, its label was removed and attempt 2 awaits Nick.
No release or deployment is included.

Previous tracked-v1 correction validation with root `main.js` absent: typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; exact `node tools/check-profile.mjs --profile=develop` PASS once. Local `VITEST_MAX_WORKERS=4` was used after the unrestricted run hit two unchanged timeout limits; the overnight report retains that result. No CI, policy, product or pin changes.

Current timeout-correction validation on signed source
`8f8948feb857a279b347ec7ffa096582befd7a3c`: fresh clean checkout, root `main.js` absent,
worker overrides unset. Typecheck PASS (2.955 s), artunused PASS (1.476 s), Vitest PASS
(301 files / 3,100 passed / 1 skipped; 43.631 s), and exact
`node tools/check-profile.mjs --profile=develop` PASS once (46.837 s).
