# UI parity and presentation program — accepted brief

### Final bounded U1 guidance correction — 2026-09-06

Clean1609cf3 passed develop static (312 files/3333 passed/1 skipped), Slice and exact named
verification. Small-phone then retained one hint contrast RED; large-phone did not run.
The accepted layout remains fixed. Its plain guidance gains an opaque dark glyph outline and
a conservative stroke-aware contrast check; the threshold remains4.5. Sourcea528791 passed
static3358/1skip and native outline controls, then stopped on a stale dock-fault wording check
with zero product findings. The instrument-only successor uses responsive-slot errors and
passes6/6 retained-receipt controls plus rootTypeScript/validate; local completion is pending. [The audit](../audits/UI_U1_HINT_CONTRAST_20260906.md) owns current
status and the23-carrier prior checkpoint. U2 is the next development batch after these checks;
physical UAT and the two historical unknown causes remain open. No U2–U4, Phase2 or hosted work.
Earlier amendments below are retained verbatim.


Nick supplied this brief on 2026-09-05. The quoted program below is retained verbatim.

### Authorized bounded rail correction — 2026-09-06

Nick authorized completion of the remaining local U1 checks without another generic confirmation.
The Slice correction covers full boundary ancestry/exact restoration and the four-copy hidden-rail
oracle. Thirty focused tests passed; static validation, clean-candidate Slice and both phone canaries
are pending. [The correction audit](../audits/UI_U1_RAIL_CONTROL_CORRECTION_20260906.md) owns current
status. Product layout and earlier RED evidence are unchanged. Physical UAT and both older causes
remain open; U2–U4, Phase2 and hosted work are unstarted. Prior amendments remain verbatim.

### Local U1 checkpoint — 2026-09-06, stopped at Slice

Nick's “Proceed” selected the remaining local U1 checks. Source
`ce8912864fabbe5624651e76c06b94f95b734f39` passed hermetic static validation and the normal
three-view review, then stopped on two Slice instrument findings. Neither phone canary ran.
[The checkpoint audit](../audits/UI_U1_LOCAL_CHECKPOINT_20260906.md) owns the retained RED,
source qualification and next bounded correction. Accepted product layout is unchanged; physical
UAT and both older causes remain open. Compendium/full Glass were outside this local checkpoint.
No U2–U4, Phase2 or hosted work. The earlier amendments below remain verbatim.

### U1 layout accepted for UAT — Nick, 2026-09-06

Nick accepted the current U1 layout for UAT at product
`053ef439774520577071f0ca50887337dd938755`, recorded in
`b08c9521c90f806e42496361127c542d206628f5`. The accepted layout is the Survey/Charters arrangement
below. This accepts the layout for testing; it does not claim completed device UAT or close any
technical gate. The integrated audiovisual pilot remains separately unapproved.

The bounded phone-only restoration diagnostic passed at signed source
`381ddf59858bd863640703e83d2d98beeedf59fa` with accepted product source unchanged. Original native
predecessors, 15000ms transport, font readiness → two animation frames and debugger auto-resume
timing remain intact. Named font/frame and geometry evaluations plus ordered receipt 33 establish
current 390×844 restoration completion; `../audits/UI_U1_UAT_RESTORATION_20260906.md` owns evidence.
Both older blockers remain historical OPEN because their old cause is unknown and nonrecurrence
is not repair. This bounded batch ends. Next is remaining local U1 checkpoint validation before
U2, without another restoration retry or implementation/refinement. No full three-view review,
Slice, Glass, full-chain or hosted run; no U2–U4 or Phase2 work. No device-UAT completion is claimed.

### Previous Survey/Charters amendment (preserved verbatim)

The full prior amendment below retains its source, result and approval wording from that
checkpoint. Nick's acceptance for UAT above supersedes its pending human-layout-approval status;
all earlier evidence and amendments remain unchanged.

### Latest all-platform Survey/Charters correction — Nick, 2026-09-06

Nick replaces the Charters shortcut with Survey on every platform. Compact upper-row emoji
boards are Survey (🔭), Compendium, Prime (N/9), Shipyard and Atlas; the four small lower
utilities remain Records (including Achievements), Notifications, Guide and Settings. Wide
Survey occupies Charters' former upper-left position above Compendium, with Charts below.
Duplicate dock/rail Charters shortcuts are removed. Prime stays compact-center/wide-top-center;
phone Search, fitted wide pills, Health and Settings → Star charts keep their existing behavior.

Objective becomes a named native button and the sole Charters opener, using the existing panel
owner for pointer/keyboard activation and focus return. It remains available while landed and
shows Charters when no objective is active. Objective progress and Charter gameplay are unchanged;
Survey keeps its existing handler. This explicitly supersedes the earlier six-board arrangement.

The compact dock returns to ten half-columns and a 320px cap within viewport width minus safe
sides and 20px. Pitch is dock width / 5 (at most 64px); board width is pitch minus 4px with a 44px
minimum. Four lower 44px targets/36px faces are centered below. The default dock remains 92px high.
Panel-open short landscape retains the header safe-column cap:
`min(320px, (viewport width − safe left − safe right − 36px) / 2)`.
The left rail is now nested in the dock and boxless on compact layouts, placing Survey first
while hiding the duplicate rail Compendium control. The scene-actions group contains only Charts.

Scoped verification PASS in six fresh phone/tablet/desktop contexts, including Objective's native
touch/mouse/Enter/Space Charters opening and Close/Escape focus return. Human visual approval
remains OPEN. Current source/results and the preserved first keyboard-instrument red belong to
`../audits/UI_U1_SURVEY_CHARTERS_20260906.md` and ROADMAP. Product source is unchanged by the
probe-only portable-key correction. Both the unattributed navigation and
portrait-restoration blockers remain OPEN. No full normal-review retry, Slice/Glass/full-chain
run, U2–U4, Phase2 or hosted action is authorized by this correction.

### Superseded phone-row amendment (preserved verbatim)

The entire prior amendment below retains its wording and checkpoint evidence. The latest
all-platform correction above owns current control placement and Objective activation.

### Latest phone-row correction — Nick, 2026-09-06

Nick explicitly places Survey in the phone dock's upper row. That row now has six emoji board
pills: Charters, Compendium, Prime (N/9), Shipyard, Atlas and Survey (🔭). The lower row contains
only the four small utility controls: Records (including Achievements), Notifications, Guide
and Settings. This supersedes Codex's prior optional Survey lower-row default. No new control,
action or gameplay owner is added; Charts remains available through Settings on compact layouts.
Phone Search stays upper-right with Search as its visible placeholder. Wide fitted text controls,
wide Prime at top-center and Health geometry stay unchanged; compact Prime is third of six.

Twelve half-columns span a responsive dock capped at 384px and bounded by viewport width minus
both safe sides and 20px. Pitch is dock width / 6, capped at 64px; each upper board is pitch minus
4px, keeping at least 44px within supported viewports (about 57.67px at 390px, 60px at 430px and
46px at 320px, with no side safe area). The four lower 44px targets/36px faces occupy the middle
four column pairs. Survey has the same plain emoji board pill as its upper-row peers; default
dock height remains 92px. The existing nested `#sceneactions`/compact `display:contents` ownership remains.
Only with a panel open in short landscape, the dock also fits the existing header safe-column
width: `min(384px, (viewport width − safe left − safe right − 36px) / 2)`. This bounds the expanded
dock beside Settings at 667×375; the shared dock oracle applies the same formula independently.

Build and scoped dock verification PASS in fresh 320/390/430px portrait documents and 667×375
with Settings open, without portrait restoration. Visual approval remains pending. Exact
source/results and the retained first-source instrument red belong to
`../audits/UI_U1_SURVEY_TOP_ROW_20260906.md` and ROADMAP. Both the unattributed navigation blocker
and the portrait-restoration verification blocker remain OPEN. Full normal review, Slice, phone
Glass and the full chain were NOT RUN. No U2–U4, Phase2 or hosted action.

### Superseded compact-control amendment (preserved verbatim)

The complete amendment below retains its original wording and checkpoint status. Nick's explicit
phone-row correction above owns current Survey placement and compact geometry; prior evidence
remains bound to its original source. Historical headings and authority labels below are unchanged.

### Latest compact-control amendment — Nick, 2026-09-06

Phone Search aligns in the upper-right corner with only **Search** as its visible placeholder.
Desktop/tablet name and text pills fit their labels using bounded `width:max-content`; Health's
existing meter geometry stays unchanged. Native Survey/Charts stay as text-sized left-stack
controls on desktop/tablet.

Nick asked what Survey and Charts do and proposed emoji-only bottom placement if needed. Survey
opens the retained/current surface card; Charts toggles orbit rings, the habitable zone and belt
caption, and remains available through Settings → Star charts. After asking an optional choice
and waiting, Codex stated the Survey-only default: Survey (🔭) becomes the fifth lower-row utility
on compact layouts, while the Charts shortcut is hidden there. The phone dock has five board
icons plus five utility icons at the existing 64px pitch. This default is reviewable implementation,
not an explicit new approval from Nick for either optional arrangement.

`#sceneactions` now belongs inside the dock; compact `display:contents` lets Survey occupy its
lower-row slot and leaves no wrapper box for top-chrome measurement. Existing native action,
focus, save and gameplay owners remain unchanged. No `main.ts` gameplay change or new action.
Static checks/build passed; normal review stopped INSTRUMENT RED during phone portrait restoration.
Visual acceptance is pending and the navigation blocker stays OPEN and unattributed. The exact
source, partial phone evidence and unrun stages are recorded in
`../audits/UI_U1_COMPACT_CONTROLS_20260906.md`. This remains bounded U1; no U2–U4, Phase2 or hosted
action is authorized.

### Superseded screenshot amendment (preserved verbatim)

The following heading and amendment retain their original wording; the compact-control amendment
above owns the current Search alignment, fitted text widths and compact Survey/Charts placement.

### Latest screenshot amendment — Nick, 2026-09-06

Use actual production v1.8.9 layout code as the foundation. Phone boards have no visible
labels; keep Prime N/9. Desktop/tablet restore left Charters/Compendium, top-center Prime,
upper-right Search → Objective → Star Atlas → Shipyard, bottom-right Records/Notifications/
Guide/Settings, and bottom-center plain guidance. Phone Search stays toward center with
Objective upper-right. Nameplate shows the full name only and opens Inventory. Health keeps
its caption, red heart and numeric ratio without HP. Rounded pills replace square top chrome;
remove the visible Cosmos/Current view label and the hint pill. U3 will refine presentation
inside the approved layout, not relocate these controls.

Actual live and tracked production CSS match. Its60px phone boards supersede the brief's 58px;
64px centers remain. Preserve 44px targets and 8px owned rail gaps; wide utilities use 52px pitch
rather than copy overlapping legacy coarse-pointer anchors. The existing >=701 tablet/wide
boundary and <=900 short-landscape safe-column exception remain explicit v2 adaptations.
This is bounded U1 under the existing visual approval stop. No U2–U4 or Phase2 execution.

### Superseded amendments below (preserved verbatim)

The historical headings and text below are retained as written. Their former “current” and
“still applicable” labels describe their earlier checkpoints; the latest compact-control amendment
above and its retained production-layout foundation supersede their geometry. The saved-notification
decision and unresolved U2 stacking conflict remain active.

Latest amendment — Nick's top/left refinement, 2026-09-06: keep the approved bottom
launcher, align the top and left controls, stack and space the left actions consistently,
and improve the health gauge. Cosmos belongs at the top; no floating button belongs in the
middle of the scene. Cosmos is a read-only current-view label, so it now lives inside the
header opposite health. Inventory/HP/context actions share a width and left edge;8px gaps
and44px targets remain. Landed portrait actions use a compact top row to protect roster
space. HP retains exact values and health math with an accessible meter and framed paint.
This is another bounded U1 revision under the same visual-review stop, with no U2–U4,
Phase2, art/audio asset, domain/save, workflow or hosted authorization.

### Uniform launcher amendment (still applicable)

Current amendment — Nick's U1 visual review, 2026-09-06: the whole UI must remain uniform
across devices. Desktop/tablet reflect the phone's layout and visual language, with compact,
readable controls and useful screen space rather than wholesale magnification. Keep the same
centered bottom launcher, control identities/order, type and color roles. This supersedes the
prior desktop/tablet side rails and bottom-right-only utility cluster.

U1 implements a capped single row on wider screens: tablet701–1099 uses72px pitch,
66px boards,48px targets and40px utility faces; desktop>=1100 uses80px pitch,74px boards,
56px targets and44px faces. Phone keeps its58/64/36/44 geometry and two rows. Narrow landscape
<=900 retains that compact arrangement, moving into the existing right safe column when a
panel opens. Prime stays in the launcher. Caption/hint lanes clear the measured launcher.
Future U2/U3 panels follow the same component/type/spacing system; this amendment does not
start those batches. U1 still stops for visual review. No workflow/policy/hosted authority.

Saved notification history remains Nick's narrow existing-schema persistence amendment.
No schema, product receipt, RNG or import-door change. U2's pasted stacking order conflicts
with the earned Settings-above-Training-card law; resolve it before implementation.

### Superseded first-review amendment (preserved)

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