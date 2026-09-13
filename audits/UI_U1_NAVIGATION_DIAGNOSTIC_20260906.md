# U1 navigation diagnostic — 2026-09-06

## Terminal result — instrument verified; original navigation blocker OPEN

Exact tested source `95c9a1fb8f9a07ae6021cf10b74cb09900f031e3`, signed and verified;
implementation predecessor `3035c102c142adf82231cba141322e22b081fbbf` is also signed/verified.
The records successor containing this result is not a newly tested source. Product source
remains `7bff7967fef6b6d6f6b99480098a92c8501da994`; no product or layout repair was attempted.

One fresh separate checkout, root main.js absent, under one uninterrupted toolchain lock:

- Typecheck and artunused PASS.
- Vitest: 311 files, 3,319 passed / 1 skipped.
- Glass selftest and normal distributable build PASS.
- Normal UI review PASS: phone390×844, desktop1440×900, tablet834×1112;
  63 trusted input deliveries, nine PNGs, zero runtime/debugger errors or overflow.
- The same-task Settings probe was reached and passed its three exact untrusted deliveries,
  final header/rail measurements and original viewport/shell restoration. Larger-text and
  short-landscape numeric probes passed within this normal review.
- Slice and both phone Glass rows were NOT RUN in this instrument-only diagnosis. This is
  not full U1 completion, certification, physical-device proof or Nick's visual acceptance.

Normal review ran once,16:41:38.356–16:41:59.780 UTC. Cosmos remained canonical after ascent;
the original spontaneous Milky Way transition did not recur. **Nonrecurrence is not a repair**:
debugger instrumentation changes scheduling and the trace still lacks camera/travel-authority
facts. No extra wait, forced state, product guard, unchanged product-review retry or broad loop.

Four actual #trail pauses were captured and resumed during intentional phone-document viewport
changes for the wide Settings/short-landscape probes. Retained source maps resolve every stack to
rendererDensitySync's frame-coalesced resize path (`main.ts:17527`) → rerender (`main.ts:7018`)
→ hudText's universe branch (`main.ts:5495`) → setTrail (`app-chrome.ts:271`). These are
same-Cosmos redraws, not galaxy-descent stacks. The async ancestry maps to resize registration
and frame-coalescer scheduling (`main.ts:17499/17537`, `frame-coalescer.ts:23/25`). Resolution used
existing source-map-js1.2.1 with CDP zero-based line+1/column unchanged. Raw stack positions,
resolved JSON and exact generated JS/map hashes are retained; no package was added.

Manifest `UI_U1_NAVIGATION_95c9a1f_20260906/manifest.json`, SHA256
`728f9779812dafa96918f0e3a957e89efd0f54286414e7186387fafcf328a28d`.
All23 retained compressed/original carrier hashes verified. Current nine-image normal review
is in that directory; unlike9c869c3, it is evidence from the current tested diagnostic source.
It remains visual review material, not acceptance. Independent code review found no remaining
substantive instrumentation issue after the two corrected test weaknesses below.

The bounded correction is complete. Stop here: retain the instrument for a separately scoped
future reproduction; do not automatically add product guards or replay the battery. Nick still
owns phone shelf density/wide pill decisions; name-only remains the explicit approved amendment.
Codex commits these records locally; no push. Claude does not need to open now; the unintegrated
local commits are not available from origin/develop and must not be manually copied into its
working tree. A later review can use the retained audit supplied by Nick. No GitHub step/PR now.
Budget UNFROZEN, public per last verification, private fallback3,000; zero hosted attempts.
Develop/main/live unchanged; U2–U4/Phase2 remain unstarted.

## Preserved preparation snapshot (superseded by the terminal result above)

Status: INSTRUMENT-ONLY SUCCESSOR PREPARED; NORMAL REVIEW PENDING.
The product is unchanged from `7bff7967fef6b6d6f6b99480098a92c8501da994`.
The prior tested source is `08cd97d79b67cab4b8d19bfd493293e997dec528`; saved records
checkpoint `0a6ee0fdb6656361106ab6540169225669c64e0e` is its direct successor.
The new signed diagnostic source will be recorded with its independent result below.

## Review disposition and boundary

Nick supplied Claude's review in this session. Exact pasted bytes, including its work narrative,
are retained in `UI_U1_CLAUDE_REVIEW_20260906.txt`. Claude reports scratch-only reproduction
attempts; their scripts/results were not supplied, so those conclusions are attributed review
claims, not independently verified receipts. Its proposed trigger and product guards remain
hypotheses. No post-commit navigation guard, zoom latch, gameplay, save, Training or layout change
is made here. A future product correction requires evidence naming the initiator and a bounded
review of durable-state/publication consistency; neither suggested guard is assumed behavior-free.

Claude's rank-suffix recommendation conflicts with Nick's latest name-only amendment in
`port/UI_PARITY_PROGRAM_U1_U4.md`; the explicit user instruction wins. Phone shelf density and
wide pill sizes remain visual decisions for Nick. No U2–U4, Phase 2, icon swap or hosted action.

The exact retained blocker stays OPEN: after native Skip and Escape ascent to Cosmos, canonical
trail returned to Cosmos/Milky Way at approximately3930ms, before Notifications input. The failed
08cd97d manifest and all10 compressed/original carrier hashes were independently verified this
session. No unchanged-source retry. Slice, both phone Glass rows and the Settings browser probe
were not reached on that source. A later nonrecurrence cannot establish a repair.

## Bounded instrument change

`ui-shell-review.mjs` already captured layout viewport width/height. Its public-DOM trace now
also records visualViewport dimensions/scale/offsets, performance time origin, and separately
tagged window resize, visual-viewport resize and actual canonical trail changes. A same-text
trail rebuild is not classified as navigation. The existing1000-entry overflow remains explicit.

`ui-review-trail-debugger.mjs` owns an exact CDP session, enables async stack depth16 and arms
one freshly queried #trail subtree breakpoint after the existing Cosmos assertion. It retains
raw synchronous/async call frames, reason/data, arm/viewport identity and host receipt/resume
timestamps. Its event handler sends resume immediately; no evaluate or report callback runs
before that command. Pending resumes gate evaluations. Intentional native/programmatic inputs
and document navigation remove the breakpoint; successful inputs rearm it. Errors/overflow
fail closed, and cleanup preserves the original product failure plus separate instrument errors.

The observer follows the official [DOMDebugger](https://chromedevtools.github.io/devtools-protocol/tot/DOMDebugger/)
and [Debugger](https://chromedevtools.github.io/devtools-protocol/tot/Debugger/) contracts.
Debugger observation can perturb scheduling. It cannot prove action settlement, camera values,
or the absence of a timing bug, and same-text breakpoint hits alone do not name a navigation.
Existing readiness deadlines, native predecessor assertions, geometry rules and input counts
are unchanged. No state forcing, extra Escape, arbitrary delay, evidence-mode product hooks,
measurement authority, workflow or package changes.

## Preparation evidence

`UI_U1_NAVIGATION_PREP_20260906/manifest.json` binds the focused logs and raw synthetic carriers.
Root validation PASS: zero boot errors,1010 Earth species rendered,50-probe fingerprint unchanged.
Initial focused suite passed10/10. Independent review replaced a source-text-only predecessor
check with execution of the actual extracted clickNative routine: wrong Cosmos/Milky Way scope
rejects before any Input dispatch, while Cosmos delivers press/release and rearms; the revised
2-test trace file passes. The Node selftests use explicit .selftest.mjs paths to keep their owner separate from default
Vitest discovery; filenames were corrected before the fresh-source run. Mocked helper controls cover wrong-session events, immediate resume,
pending boundaries, missing frames/nodes, cleanup failures and bounded overflow.

Synthetic calibration uses only an isolated about:blank document. The first PASS proved raw
stack presence but its async check was too weak. The tightened named-ancestor check correctly
failed: an async function after await remained on the synchronous stack, with only its anonymous
caller in async ancestry. That RED is retained. The corrected fixture uses a named timer scheduler;
it passed all4 controls: missing breakpoint rejected, named writer plus named async scheduler
captured/auto-resumed (empty ancestry rejected), disarm stops capture, and native window plus
visual viewport resize facts observed. These are instrument controls, never game or U1 proof.

## Session startup receipt

2026-09-06T16:28:25.659Z, Codex/macOS arm64, required shared-lock --check PASS. Inventory:
ImageMagick7.1.2-31, FFmpeg9.0.1_1, Python3.12.14, Node26.7.0, gh2.100.0, Blender5.2.1,
Inkscape1.4.4, REAPER7.79.0_06dd787u, Surge1.3.4, GSAP3.15.0, Homebrew6.0.22.
Official stable metadata reports Node26.8.1 available; five active processes (21997,30203,
30226,30716,31031) resolve to /opt/homebrew/Cellar/node/26.7.0/bin/node, so that update is
DEFERRED under the busy-tool rule. REAPER is open; brew outdated confirms its suffix difference
is not an update. All other approved entries current. No eligible idle update, installation,
capability change or package modification. Preserve those processes; no recurring task created.

Ownership verified: OpenAI/Codex on macOS | openai/mac |
/Users/nick/Projects/celestial-frontier-openai-mac | origin/openai/mac.
SSH origin git@github.com:TheDakk/Celestial-Frontier.git; authentication as TheDakk and repository
read/fetch passed after sandbox DNS refusal. origin/develop c1791e2 is an ancestor; initial
upstream comparison0/0. Only ambient untracked .DS_Store is left untouched; root main.js absent.
Budget UNFROZEN, public per last verified record, private fallback3000. Zero hosted attempts,
PRs, labels, merges, releases or deployment authorized. This batch commits locally without push.

## Result and paired next steps

Pending one new-source normal review after static/build preparation. Stop on the first red;
do not run Slice/Glass or broaden product work from this diagnostic. Keep raw reports/stacks
and source maps needed to attribute any recurrence. If it does not recur, retain OPEN status.
Codex records the exact source/result and fresh ROADMAP handoff. Claude can review those
retained facts read-only from its own anthropic checkout; no copying/merging into its worktree.
Nick need not open Claude during preparation. No PR needed now; future integration is a separately
authorized openai/mac → develop PR, never an implied main release. Develop/main/live unchanged.
