# UI parity and presentation program — accepted brief

Nick supplied this brief on 2026-09-05. The quoted program below is retained verbatim.
Current amendments (2026-09-06): desktop/tablet utilities use the FINAL LAYOUT bottom-right
Records / Notifications / Guide / Settings cluster, confirmed by Nick. Nick also requested
saved notification history with persistent read/unread state; this is a narrow exception to
the original no-persistence-change boundary, using the existing notification schema and F4
checkpoint protections. No schema, product receipt, RNG or import-door change.

Desktop utilities use 44px pitch to keep the required 44px targets non-overlapping,
a proposed 2px deviation from the old 42px diagram. The earned8px root-owned rail gap must
also survive; with44px targets, rails use52px pitch (+10px against the older diagram). Codex stated this assumption after asking
for a preference; Nick has not explicitly confirmed that numerical deviation. Phone pitch
remains exactly 64px. U1 stops for Nick's visual review before U2. U2's pasted stacking order
conflicts with the earned Settings-above-Training-card law; resolve it before implementing U2.

## Original brief

UI PARITY + AAA PRESENTATION PROGRAM — Batches U1–U4. Bounded, checkpointed, on openai/mac (or a bounded
openai/review-ui-*-<date> branch). Branch pushes only. This precedes any Phase 2 audiovisual chrome.

WHY
Claude compared the sealed v1.8.9 golden phone screens (port/baseline-v1.8.9/screens/ui-*-phone.png) against the
v2 slice and the pilot captures. v2 lost the production layout framework: the v8→v11 dock (labelled chips, Prime
0/9, 64px pitch, gold selection wash) is ten unlabeled grey circles; the two-row phone shelf is oversized with ~80px
dead space; panels are loose text scrolls instead of cards with sticky Close and segmented controls; the Homecoming
toast overlaps the biosphere sheet and "Pilot controls" collides with the caption lane. Cause: port plan Phase 4
("Validated UI and gameplay-shell parity") is not done and nothing in v2 enforces the v1 layout laws — root
uilayout.js only runs on legacy HTML; Glass checks focus/actionability/modal law, not spacing/pitch/collision.
The integrated pilot is NOT approved; do not build on the pilot's compact study as a base.

AUTHORITY / SPEC
- UI_PRESENTATION.md: "THE ONE-BAR LANGUAGE" (2026-07-25), "FINAL LAYOUT — UI v8→v11", "THE TRAINING STACK LAW"
  and the ROUND 7 addenda are the layout law. The 28 golden screens are the visual baseline.
- Same layout and features as production; presentation quality raised to a professional studio standard.
- Nick's defaults until he says otherwise: (a) geometry = exact v1 v8→v11 metrics in U1 (parity first; refinement
  proposals go in a review study, not the product); (b) UI type face = Inter (already OFL-licensed and in the pack);
  system/monospace/larger-text preferences keep precedence; (c) icons = emoji stay in U1–U2 (Nick-directed law);
  in U3 deliver a custom SVG icon-set STUDY side by side with emoji for Nick to choose — do not switch without approval.
- Presentation only. No domain, persistence, receipt/CAS, RNG, save, Training-step, Guide-copy or gameplay changes.
  Existing element ids, data-sel anchors, focus owners, Escape order and 44px floors stay intact.

U1 — TOKENS, TOPBAR, DOCK (one checkpoint)
- Add one token owner (CSS custom properties, generated from one TS source): 4/8px spacing scale, type scale
  (Inter), radii, z-layers, and color ROLES (surface/elevated/border/text/muted, accent-gold, accent-teal,
  success/warn/danger; rarity/resource/Atlas/protected colors keep their existing owners — alias, do not redefine).
- Port the phone shelf and dock EXACTLY: two-row shelf (nameplate · HP pill · search · bell; --topbar-h synced),
  dock row 1 = Charters · Compendium · Prime (0/9) · Shipyard · Atlas as 58px chips at 64px pitch, row 2 =
  Records · Notifications · Guide · Settings as 34–36px circles at 64px pitch; selection = gold wash via .sel, no
  layout growth; ⚙/? bookends on desktop per the one-bar language; desktop/tablet ≥701px per FINAL LAYOUT.
- Objective chip, trail pill and caption/hint lane get their v1 metrics and lanes back.
- Evidence: side-by-side PNG grid (v1 golden vs v2) for main phone/desktop/tablet; pixel diff of chip pitch,
  shelf height and lane offsets to the v1 values named in UI_PRESENTATION §3; Slice develop + both phone canaries.

U2 — SHEET SYSTEM AND STACK LAW (one checkpoint)
- One panel/sheet component: header strip (title + icon), sticky ✕ Close at the panel's right, internal
  overflow-y:auto with styled scrollbar, opens as an aligned sheet above the hint lane on phones, rises from its
  button on desktop; Settings centers per the law.
- One stacking owner implementing THE TRAINING STACK LAW: training card > Settings > sheets > toasts > hint lane,
  with the CSS-specificity trap documented and negative-controlled (an equal-specificity earlier rule must FAIL).
- Toast/achievement lane and caption lane that never intersect an open sheet, the dock or each other at any of
  the ten viewports; the Homecoming-over-biosphere overlap becomes a red negative control.
- Motion: one easing/duration token set (150–250ms enter/exit, reduced-motion respected). Stateful controls:
  hover/pressed/selected/disabled/focus-visible for chips, pills, buttons.

U3 — PANEL RE-SKINS (one checkpoint per panel, in this order)
Shipyard (card: vista, Fabricator/Research segmented control, tier rows with counts + EXPAND chips) · Star Atlas
(List/Chart, filters, Home, Remove/Undo — keep the Batch 4 behavior) · Compendium · Charters · Records/Chronicle ·
Guide · Settings · Survey/landing card and biosphere sheet · Inventory/paperdoll (min(62vw,240px) cap).
Each: v1 golden vs v2 before/after PNGs, unchanged element ids and focus behavior proven by the existing
main-wiring tests, plus the emoji-vs-SVG icon study delivered once (as review images, not product).

U4 — V2 LAYOUT GATE (one checkpoint; the Phase 4 gate)
- Port the intent of root tools/uilayout.js to v2 as a Glass-adjacent layout contract across the current ten
  viewports: no overlapping interactive rects, dock/shelf pitch and heights within 1px of the law, 44px touch
  floors, caption/toast/sheet lane non-intersection, panel content inside its sheet, --topbar-h sync.
- Negative controls BOTH directions for every check (break a build on purpose; prove red; restore; prove green),
  reproduce the reported geometry, findings carry their own diagnosis. Suspect the instrument first.
- Golden-screen comparison report: each of the 28 v1 screens paired with the v2 equivalent; differences listed
  as intended (token/style) vs unintended (layout) — unintended must be zero to close the gate.
- Add the layout gate to the develop profile ONLY as a proposal in the handoff; do not edit .github/workflows or
  the Actions policy.

GATES AT EVERY CHECKPOINT (fresh checkout, root main.js ABSENT)
npm run typecheck · npm run artunused · npx vitest run · node tools/glassmatrix.mjs --selftest ·
node tools/slicesmoke.mjs --profile=develop · glassmatrix --viewport=small-phone then large-phone (0 findings).
When main.ts changes: re-derive ONLY the Compendium producer authority and move its pins together. When the
bulletin changes: move every bullet pin together (V2_DRAFT_BULLET_COUNT, GUIDE_DRAFT_BULLET_AUTHORITY,
glassmatrix expectedBulletCount/"N-outcome", guide-release/evidence-chain-tools/slicesmoke-sixth-red pins).
Any layout rule that overrides another releases the anchor it overrides (min-height beats max-height; earlier
equal-specificity rule loses). Stop after any red; correct on a new source; never retry unchanged source.

DOCS IN THE SAME BATCH
UI_PRESENTATION.md (new "v2 presentation system" section: tokens, components, stack owner, layout gate; matches
code as of <date>), celestial-frontier-codebase-reference.md, port/v2/README.md, port/V2_PROGRAM_ROADMAP.md,
port/v2/DEVIATIONS.md, PROCESS_LAWS.md (any new earned law), V2_DRAFT_RELEASE bullets for player-visible
changes, and a ROADMAP.md handoff per checkpoint with the superseded block archived verbatim.

BOUNDARIES
No hosted runs, labels, PRs, merges, releases, purchases. No .github/workflows, Actions policy, protected-portrait
or artlock reference edits. No legacy import door. No Phase 2 audiovisual chrome and no integrated-pilot approval
claim. Leave Claude's anthropic/mac c860f57 and unmerged 173c806 negative control alone. Nick's open items stay
open: artlock CI lane, ITP save protection, DECISIONS row 19 wording, plus the three UI decisions above (icons,
geometry refinement, Inter) — present each with evidence and wait. After U1 lands locally, stop and report with
the side-by-side grid so Nick can judge direction before U2. Give paired next steps for Codex, Claude and Nick.