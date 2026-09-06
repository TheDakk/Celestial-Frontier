# U1 presentation checkpoint — 2026-09-06

Status: IMPLEMENTED, exact-source verification pending. No U2 or Phase2 approval.

Starting source ec5188f5059fb3ce7ae8b99af68c51709f2ee9b6, on openai/mac. Fresh fetch confirmed
develop c1791e210158de864fdd475323c3091d9ecbae58 already an ancestor. Codex/macOS owns
/Users/nick/Projects/celestial-frontier-openai-mac; no other worktree was edited.

Scope: normal-game U1 shared tokens/local Inter, measured shelf, five labelled phone boards,
four utility controls, desktop/tablet bottom-right cluster, native selection/focus/Training
roots, retained scene actions and objective/trail/caption/hint lanes. Nick amended scope to
include existing-schema notification history/read-state persistence. Explicit reads use the
idle guarded save owner; passive notices never schedule a competing write, and notices emitted
during an action remain in a private buffer until the next admitted checkpoint after settlement.

Geometry authority differences are documented in UI_PRESENTATION.md and port/v2/DEVIATIONS.md.
Desktop44px pitch is a proposed2px change from the old diagram to preserve44px targets; Nick
has not explicitly confirmed that numerical choice. Phone64px pitch is exact. Shelf height is
content-derived (default88px), not a claimed fixed legacy measurement. V1 goldens remain unchanged.
The old short-landscape left panel remains; relocated interactive shelf and desktop rails now
occupy its right safe column. Broad sheet restyling/stack changes wait forU2.

Verification requires a clean committed temporary checkout with no root main.js. Run each
selected owner once, stop on red, retain the red evidence and correct on a new signed source.
Required sequence: typecheck; artunused; full Vitest; Glass selftest; Slice develop; Glass
small-phone; Glass large-phone. Normal-build U1 review captures phone390x844,desktop1440x900,
tablet834x1112 against the sealed main goldens. Human visual review is not an automatic gate.

The draft bulletin has81 outcomes; ordered SHA256
f35a3cca3eea2015025bf257c7832d706d1e2961fac9417a953d0932e0f5ca08.
Compendium producer is to be re-derived after final product edits. Measurement/ruler/ceilings,
SceneMemory and artlock references stay unchanged. No workflow/policy edits or hosted authority.

Final exact source, verification results and review image links follow after the local checkpoint.

Producer derivation: `a671e70073c1a34141ece1011b9ccfbd65f5e921503bf5d2b9e312e9e5fbb46c`. Tool exit2 reports expected producer movement,
quarantined SceneMemory drift, and a pre-existing Compendium measurement mismatch in
`inputs.appPackage` / `inputs.packageLock` introduced by the prior GSAP setup. This batch
preserves those dependencies and the sealed measurement authority; it does not claim a
current Compendium certificate or silently update the ruler. Required U1 gates remain pending.

## Preparation instrument result — source35ded10

The first fresh clone had no main.js and matched35ded10f3d052ab5603e781ee06d2a25448397f5.
Sandbox npm ci could not resolve registry.npmjs.org for lockedGSAP3.15.0 (ENOTFOUND).
A prematurely submitted typecheck returned127 (tsc unavailable) before dependency setup
completed; no TypeScript/product test ran. The remaining checks were not submitted.
Correction: dependency installation must report exit0 before launching any check; network
access for the unchanged locked install was granted through sandbox escalation. This is a
local setup/instrument failure, not a product or hosted result. It is retained before the
successor verification source; no unchanged product-red test is retried.

## First product checkpoint —37d82ef

Fresh committed source `37d82ef50e1c4e1554a572473019c4451c690559`, root main.js absent: install,typecheck,artunused
PASS. VitestRED:7failed/303passed files;12failed/3,241passed/1skipped tests. Stop honored;
Glass selftest, Slice, canaries and visual review were not run. `UI_U1_REDS_20260906.json`
retains exact failures and log hash. Corrections preserve every tested outcome: removed-one
bullet count80from81, native Atlas opener anchor, extracted persistView harness dependencies,
and complete producer component record. The prior unused GSAP runtime dependency is moved to
isolated `tools/ui-motion` (same3.15.0 installation verified). Game package/lock restored
byte-for-byte to their sealed values; no measurement/ruler/ceiling/test expectation weakened.

Corrected producer derivation: `1afd4b75628db48685ca065b8cfbfa7a8ab342c602e1fe6d7f785777a662964c`.
Compendium sealed measurement now MATCHES. Tool exit2 reflects producer movement before pin
update and quarantined SceneMemory drift only. Producer pins/components moved together;
measurement/ruler/ceilings remain byte-identical. Fresh successor verification follows.

## Browser checkpoint —4e6047b

Fresh checkout: typecheck/artunusedPASS;310Vitestfiles/3,255testsPASS/1skip; GlassselftestPASS.
Slice developRED and the later canaries/review were not submitted. It found Search in a broad
non-dismiss header, missing independent HP text backing, missing8pxroot-owned rail gaps,
the old Search-at-right-edge oracle after adding a shelf bell, and Feed's reload fixed point.
The product repairs restore Search dismissal, HP backing and real empty rail gaps without
weakening their controls. Rails therefore use44pxtarget+8pxgap=52pxpitch, disclosed against
old42pxdiagram; desktop utility pitch remains44. The Search geometry oracle now measures its
relationship to the new bell. Feed notification comparison is investigated separately.

Browser correction producer: `e9d4c92fe92101fb6d97b4107444a063bfbf4ca5bda27f21591571d3165406b5`.
Compendium measurement MATCH; all component/producer pins move together. Tool exit2 before
pin update includes producer movement and quarantined SceneMemory drift; neither measurement
nor SceneMemory authority was edited. Fresh corrected verification remains pending.

## Bounded browser corrections prepared

The Feed carrier now records both codecs' notification vectors and the actual painted toast.
Immediate/pending/stale-loser comparisons still require the full unchanged unrelated digest.
Reload additionally proves exactly one new bounded unread meal notice, unchanged predecessors,
codec parity, expected collision-free ID and bounded wall-clock timing, while every other
unrelated field retains its own exact fingerprint. Missing/extra/forged/read/late/reordered
notice and unrelated-state negative controls are retained; no product Feed outcome changes.

Notifications retains the native58px Close gutter, joins the safe left panel workspace in
short landscape, and stays above Survey using an explicit utility-panel token. Phone Prime
uses one label/count line to keep the default dock92px. The normal-game review now reaches
Cosmos through actual Escape presses and captures native Notifications open/Close/focus too.
Latest producer `6b9f100f4502f6a371f1c670cf98dac686bc5d6b69ef0f273027ffbf26f6cbd1`; sealed Compendium measurement MATCH.
All previous red evidence is retained. Successor verification has not yet run.

## Instrument correction —b08f8ac

Fresh static sequence:310files/3,258testsPASS/1skip, typecheck/artunused/GlassselftestPASS.
Slice's earlier product/history checks passed. Its sole remaining finding was the Prime
HP-collision negative control: a transformed dock becomes the containing block for fixed
children, so viewport coordinates did not create the intended collision. The control now
translates from actual painted Prime/HP rectangles and retains the existing required overlap
and exact-restoration assertions. No product change or producer movement in this correction.
Red log is retained in `UI_U1_SLICE_RED_b08f8ac_20260906.log.gz`; later gates were not run.
