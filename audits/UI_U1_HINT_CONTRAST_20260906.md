# U1 final local gate — guidance contrast, 2026-09-06

Nick authorized completing the remaining bounded U1 local checks and asked when U2 can begin.
The accepted layout is final for this batch. U2 is the next development batch after these checks;
U2–U4, Phase 2, the integrated audiovisual pilot and hosted actions remain unstarted.

## Retained clean checkpoint

Signed source `1609cf3991e20da45d5e4628fd2163278ece5ec8` (16 local commits ahead) passed the
browser-free develop profile: 312 files, 3333 passed, 1 skipped, plus its TypeScript/art gates.
Slice `local-u1-1609cf3-20260906-slice` passed in 370012ms with zero findings and ten screenshots;
its named verifier passed. Both repaired rail controls preserve all three native phases and
exact attribute restoration. No rail defect remains in that run.

Small-phone `local-u1-1609cf3-20260906-small-phone` then stopped with one product finding:
`TEXT_CONTRAST_LOW` for `#hintpill`, modeled ratio 1 against threshold 4.5. There were zero
instrument failures; large-phone did not run. The report remains RED. All eight stage logs,
execution receipt, Slice report/log/ten PNGs, immutable Glass report and labelled diagnostic
pointer are retained in `UI_U1_LOCAL_CHECKPOINT_1609cf3_20260906/manifest.json` (23 carriers),
SHA-256 `1ad81a5a4d7e94d362d095c6f73d7624aef309cf6a0fb248cc61a854d0a8265b`.
The test artifact's full Git status was empty and the owned workspace's ambient `.DS_Store`
was preserved. This does not relabel the earlier dirty-diagnostic ce89128 run.

## Bounded correction

Glass models bright artwork as white beneath transparent chrome. Its previous calculation
ignored glyph shadows/strokes, while the accepted plain guidance had only blurred shadows.
The RED therefore does not establish a measured painted 1:1 result, but the blur also does not
prove an adequate halo. The correction retains plain text, zero padding/border/background and
all accepted positions; it adds a 2px opaque black glyph stroke painted before the fill, leaving
at least 1px outside the glyph. The development release's existing bullet describes the outline;
there are still 81 bullets, no version bump or shipped update popup.

The assessor recognizes only an opaque stroke at least 2px wide with stroke-first paint order.
It computes fill and halo with cumulative opacity and retains the 4.5:1 normal-text threshold.
Arbitrary shadows are not accepted. Focused and native controls must reject missing/thin/light/
translucent or incorrectly painted outlines and faded ancestor opacity, then restore exact
styles and geometry. [W3C G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18) permits a
sufficiently contrasting outline or halo; the implementation does not infer compliance from a
nonempty text-shadow declaration.

The exact built producer is refreshed to
`6e6f000fe26753119327831b96fa8c4454d35952197286b16dc367a5ff658d90`; the owner and worker/painter
bytes, numeric ceilings and measurement
`4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12` remain unchanged. Prior
calibration/certification samples keep their historical identities; no fresh Compendium claim.

## Validation and stop boundary

Preparation passed: 25 glyph-stroke tests, 72 release/budget/evidence tests across three files,
root no-unused TypeScript, evidence build and root validate/fingerprint. All six preparation
carriers are retained in UI_U1_HINT_PREPARATION_20260906/manifest.json. Fresh committed browser
validation remains pending; native fault controls have not yet run. The final local attempt uses one clean
local test artifact: develop static once, the two independent noncertifying phone diagnostics
(small then large), then Slice develop and exact named verification, all on unchanged source.
Checking the directly affected phone first avoids paying for another six-minute Slice run before
exercising the corrected contrast. No dependency is bypassed: these targeted phone reports have
no Slice predecessor, and this is not the full Compendium → Slice → Glass admission chain.
Stop after the first nonzero/RED; preserve evidence, never retry unchanged source.

The ce89128 normal three-view PASS remains prior layout evidence; it did not inspect this new
outline. Both older unknown causes remain OPEN: 08cd97d native Skip/Escape followed by unsolicited
travel, and c57aaaeb portrait Runtime.evaluate timeout with the old expression unknown.
Nonrecurrence and responsive cleanup do not establish causal repair. Physical iPhone/Safari/PWA
UAT remains open. U2 must reconcile Settings-above-Training before sheet/stack implementation.

OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`,
upstream `origin/openai/mac`. Same-session TheDakk SSH/read receipt and develop ancestor reused.
Startup receipt 2026-09-06T16:28:25.659Z/Node26.7.0 reused; 26.8.1 deferred for busy tools.
Whole-job shared locks and first-attempt isolated-browser escalation apply. Budget UNFROZEN,
PUBLIC per last verification, private fallback3000; zero exact hosted authority or hosted actions.
Codex owns local completion; Claude need not be opened, copied into or rerun now. No PR needed
for this local batch. Future openai/mac → develop integration needs separate exact hosted authority.
