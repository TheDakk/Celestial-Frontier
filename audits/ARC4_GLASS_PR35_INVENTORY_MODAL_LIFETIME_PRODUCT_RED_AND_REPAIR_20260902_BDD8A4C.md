# PR #35 twelfth hosted stop — Inventory modal lifetime ownership

**Date:** 2026-09-02

**Hosted workflow:** `test-battery` run `33657402955`, attempt 1

**Authorized head/base:** `bdd8a4c46fbbd8484fb9a36d43bb3f60bf660c17` →
`7a9f4c1370dd84292388d718c38ff34214f6203b`

**Result:** terminal red, no retry, no merge

## Immutable source and authorization boundary

Nick authorized exactly one PR #35 `test-battery` attempt for the head/base above, using the
`actions-budget-approved` label, with a 92-minute maximum and no retry. `openai/mac` was pushed at
that exact head and PR #35 was Ready before the label was applied. GitHub built synthetic merge
`26db13963033feacc89ceef1a59a4af0c05c14c3`, whose two parents are the exact base then head above.
Its tree `ae8faec92122f412240c5b4979073f69b170c9f4` is byte-identical to the exact head tree.

The workflow was created at `2026-09-02T16:50:43Z` and completed at
`2026-09-02T18:03:21Z`, a wall duration of **72m38s**. The authorization job passed. The battery
job ran from `16:50:50Z` through `18:03:20Z` and stopped at its first nonzero product stage. The
approval label was then removed. PR #35 remains Ready/open/unmerged, `develop` remains at the exact
base above, and no release, version bump, preview publication or deployment occurred.

This exact authorization is consumed. The red run is immutable and must not be retried or
relabeled. Any changed successor requires a new exact-head authorization.

## Stage outcome

The following hosted steps passed before the stop:

- authorization, checkout, environment, scope and budget policy;
- legacy browser-free gates;
- v2 base-profile static gates;
- changed-art mutation control;
- the repaired shared Chrome launcher selftest;
- root Layout across 10 viewports plus freshness verification;
- Compendium instrument selftests, exact browser install/preflight, one memory certificate and its
  named verifier; and
- one real-browser `develop` Slice plus its exact report/log predecessor binding.

Live SceneMemory correctly skipped because it is production-only/quarantined. Production preview
producer controls correctly skipped in this develop profile. Recovery and preview packaging
correctly skipped after Glass stopped red.

Glass started at `2026-09-02T18:02:20.715Z` and stopped after **50,864 ms**. Its sealed inventory
still names 12 viewport classes and 104 controls, but causal stop executed only the first
**small-phone 320×568 @2x** row: one reload passed, **81 controls executed**, and the remaining 23
were explicitly blocked by the first product finding. Nothing was automatically retried or
silently omitted.

## Exact Glass finding

Glass retained exactly **one product finding**, zero instrument failures and zero retries:

- viewport/surface: `small-phone/inventory-modal`;
- code: `INVENTORY_MODAL_OWNERSHIP`;
- element: `#inventorysheet`;
- selected instance:
  `gear1|loot1|legacy-migration|save-v2-user|items-v1|||migration%3Av4-v5|5000`; and
- sole failed clause: `backgroundLocked:false`.

Every sibling clause was healthy: there was one sheet and one exact detail, the selected identity
matched runtime diagnostics, active/retained/pending counts were `1/0/0`, the card was inside the
safe 320×568 bounds, all three controls were at least 44px, and initial focus owned the Close
button. This is a modal-isolation defect, not a loot, save, geometry, focus, browser-version or
responsive-baseline failure.

The hosted report records only the aggregate `backgroundLocked` boolean, so it does **not** prove
which body sibling escaped. Source inspection proves the defect class: Inventory took one snapshot
of direct body siblings when it opened and never reasserted ownership. Any later direct-body mount
or any writer clearing a sibling's `inert` or `aria-hidden` could therefore violate the modal.
The timer-driven ordinary toast is a high-confidence candidate because `showToast()` removes
`aria-hidden`; the rank ceremony also mounts a later body FX root without `inert`. Those are causal
source candidates, not relabeled hosted observations.

Chrome `151.0.7922.173` / CDP `1.3`, revision
`@a96602f30358e9b5d256a0464e7e4d4bec223004`, is provenance only. The repair does not pin a point
version, change a browser baseline, or loosen a ruler.

## Bounded successor repair

`apps/game/src/inventory-panel.ts` now applies the same lifetime-owner pattern already used by the
Import modal:

1. snapshot each current direct body background root exactly once;
2. set both `inert` and `aria-hidden="true"`;
3. observe direct-body additions and descendant `inert`/`aria-hidden` mutations for the whole open
   lifetime;
4. idempotently reassert both isolation halves without replacing the original snapshot; and
5. disconnect first on Close/dispose, then restore every encountered root's exact prior values.

Focused unit coverage independently clears `inert`, removes `aria-hidden`, appends a late body FX
root, proves each broken state is red before the observer turn, proves each is re-locked, checks
unusual exact prior-state restoration, and proves disposal cannot reacquire later roots.

Glass keeps the existing pass/fail predicate but now retains the exact unlocked sibling ledger
(stable selector/tag/id plus inert property/attribute and `aria-hidden`) and nearby toast/progression
presentation state. Its existing `inventory-modal-focus` control now deliberately mutates the real
toast and appends a late body root, proves the aggregate and new ledger turn red synchronously,
waits for observer-driven green, and separately dispatches an outside `focusin` to prove redirection.
Close proves the late root restores exactly. The existing `inventory-focus-wrap` control keeps real
forward/reverse native Tab proof but places its bypass sentinels inside the modal, outside the
product/auditor control enumeration, so a negative control no longer depends on reachable body
background.

No new Glass control name or job was added: the sealed total remains **104**. The change adds
causal coverage and actionable diagnosis to the existing owners.

## Retained evidence

The complete GitHub artifact `battery-evidence` is artifact ID `9860127013`, archive size
**9,752,514 bytes**, digest
`sha256:ad9d5212cb4c8f187b3c2f9035a1da2483adf0b56184418b73946c9ba21d21fa`, expiring
`2026-09-16T18:03:11Z`.

The exact immutable Glass report is retained permanently as
`ARC4_GLASS_PR35_INVENTORY_MODAL_LIFETIME_PRODUCT_RED_20260902_BDD8A4C.json.gz`:

- raw JSON: **93,541 bytes**, SHA-256
  `33e3f66127493092923106458bb54825584e00df4ea33f9494f97c4c62e97b59`;
- deterministic `gzip -n -9`: **11,242 bytes**, SHA-256
  `50acaf9454040c09f6f016d31fb24ca2e6cabf72a4afe3b302185f9a2d41bd18`.

The report embeds exact Slice predecessor ID `gha-33657402955-1-slice`, report SHA-256
`7e21608b77e31fd40c2265d4362a942eaac474bdfb4d9af1393a97d43db7bc9b`, and raw-log SHA-256
`f0e6586b4dd0184aec33a4667f8a8b143d73a879a18a83cafd462e093e34b0e9`.

## Verification and scope

At the initial repair boundary:

- Inventory focused test: **1 file / 21 passed**;
- all three v2 TypeScript programs: PASS;
- Glass report selftest: PASS;
- two small-phone targeted diagnostics exercised the revised focus control, then the complete
  lifetime/focus controls, with zero product findings and all relevant Inventory controls present;
  both retained the pre-existing targeted-only portrait-campaign limitation because one 320px row
  cannot supply the full multi-viewport visible-trail baseline. They are diagnostics, not
  certificates.

The first consolidated `develop` profile stopped in **32.61s** at the exact producer-authority
mismatch after its other tests reached **2,727 passed / 1 skipped**. It named only
`inputs.index.sha256`, `inputs.owner.relativePath`, `inputs.owner.sha256`,
`inputs.serviceWorker.sha256` and the derived `sha256`; no product outcome, ruler or numeric
ceiling was red. The independent standard build derived the tuple below. Recursive comparison
proved that the budget repair changed exactly those five producer leaves plus
`calibration.selectionRule`, preserving every other budget leaf.

Focused producer/budget coverage then passed **2 files / 32 tests**, and the single corrected
browser-free `develop` profile passed **264/264 files, 2,728 passed / 1 skipped**, all three
TypeScript programs, **34** art sources with zero findings, **1,014/1,014** routes and **454**
declared fields with zero inert fields. This does not erase the first local red.

## Exact-source local successor certificate

Exact SSH-signed implementation source
`5004fd36f9fdb2632f323d99f1535e9fb2ac5b95`, tree
`cc1a568ebd49e038b831464b2c1ce7d8ac01ad3a`, parent
`bdd8a4c46fbbd8484fb9a36d43bb3f60bf660c17`, passed the hermetic tracked-input `develop`
rehearsal at **264/264 files, 2,728 passed / 1 skipped**, all three TypeScript programs, **34**
clean art sources, **1,014/1,014** routes and **454** declared/non-inert fields. Browser-CDP,
browser-path, Compendium browser-preflight and all **618** Compendium mutation controls passed.
Live preflight accepted canonical Edge `152.0.4191.53` / CDP `1.3`; the point version is
provenance only.

On that exact clean, unchanged source, one serial fail-fast/no-retry develop chain completed:

- Compendium `20260902185934666-38136-1560adf2b6` passed **78/78** with zero findings or blocked
  outcomes in **61,876 ms**, then passed named verification.
- Slice `20260902190106514-38463-d9be88c2f213` passed terminal/certifying with zero findings or
  scopes, ten screenshots and a green Arc 4 ledger in **362,697 ms**. Named verification bound
  report SHA-256 `661865d0fab54ebb4943cbdc2aebc5b511e94a199a8e54256cb8427e86c0f3e3`
  and raw-log SHA-256 `099daaa8e2650f6fe1faa956954ad0409e0262db979f834e3ac9cfcb4b078340`.
- Glass `20260902190730548-38863-824672142575` consumed that exact Slice predecessor and passed
  **12/12** viewports, **12/12** reload rows and **104/104** controls with zero blocked/omitted
  controls, findings, instrument failures or retries in **113,689 ms**. Its Slice-bound named
  verifier passed; report SHA-256 is
  `3603a19e3eff5f9e3b41f400ed899bd0fbf76d79c38ed91a45ce88407928871f`.

Four deterministic `gzip -n -9` carriers preserve the exact reports/log:

- `ARC1A_COMPENDIUM_PR35_INVENTORY_MODAL_LIFETIME_REPAIR_PASS_20260902_5004FD3.json.gz` — raw
  **10,832,945 bytes**, SHA-256
  `527fc3dc559d9e36cb162e84c1abc938eb5b889d8cbad0abbd7dce2ee443691b`; gzip **452,176 bytes**,
  SHA-256 `6f19fa85da668ce8d03102263ef1a6d935357df8338ab4a1b265b2f3faf43df4`.
- `ARC4_SLICE_PR35_INVENTORY_MODAL_LIFETIME_REPAIR_PASS_20260902_5004FD3.json.gz` — raw **6,126
  bytes**, SHA-256 `661865d0fab54ebb4943cbdc2aebc5b511e94a199a8e54256cb8427e86c0f3e3`;
  gzip **1,960 bytes**, SHA-256
  `9a3dbb231eab2f60500fb16f2ea2867137023c3003e8fc558a966dc560ae5e3c`.
- `ARC4_SLICE_PR35_INVENTORY_MODAL_LIFETIME_REPAIR_PASS_20260902_5004FD3.log.gz` — raw **6,950
  bytes**, SHA-256 `099daaa8e2650f6fe1faa956954ad0409e0262db979f834e3ac9cfcb4b078340`;
  gzip **3,288 bytes**, SHA-256
  `d4981a531e15fc1179285d0b5f2a11004b6bf2305fd5a61afecddf6589f1e140`.
- `ARC4_GLASS_PR35_INVENTORY_MODAL_LIFETIME_REPAIR_PASS_20260902_5004FD3.json.gz` — raw **898,747
  bytes**, SHA-256 `3603a19e3eff5f9e3b41f400ed899bd0fbf76d79c38ed91a45ce88407928871f`;
  gzip **78,817 bytes**, SHA-256
  `91400a88b84dd8ddb259d90269abb0afc44f3ed032c4e23f3cc121117e2eec62`.

All four pass gzip integrity, byte-for-byte raw comparison and deterministic recompression. Every
certifying stage ran once; no stage retried. The signed documentation/evidence descendant
containing this record also passes the final hermetic tracked-input `develop` proof with the same
**264/264 files, 2,728 passed / 1 skipped** result.

Because the product and player bulletin changed the build graph, the exact current Compendium
producer authority is `f0bb6c638f2ad89236168c28a7161f941dd5702a51104ff93b898481bea4e9dc`
under unchanged measurement authority
`b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`. The current index is
`5b9ed6e4d700982cce9748be7030617b43181335d9a9cebc435199816de5f961`; owner
`assets/main-BsF0uVAJ.js` is
`0dc4d11d427a4318092c77315a734d7391c3e6c253fddcdd6256199bc22ce3ad`; and generated
`service-worker.js` is
`9874c86b11e80b8229784aa87ef0ae5921341c74b83547ad0137e790d1cbf957`. Worker/painter bytes,
the fixed ruler, all numeric ceilings, the 78-outcome inventory and every historical sample remain
unchanged. This is a source-identity refresh, not a resource recalibration or Edge rebaseline.

This repair changes no gameplay rule, loot tier, inventory identity, creature/genome, plant, biome,
Guardian, world generation, graphics, audio, save schema, persistence transaction, ruler, numeric
ceiling, retry policy, Gate/HUMAN status, production version or release boundary. The cumulative
v2 draft remains 77 bullets; its refreshed rendered ordered SHA-256 is
`1ad35cf24a8faeb058cecc00640ee2e0aa1de8bf4b22257a114895f1d2fbe964`.

With this twelfth stop, the PR #35 hosted history classifies as **8 instrument/infrastructure, 3
product/runtime and 1 mixed**. That classification does not make any red green and does not grant
merge authority.
