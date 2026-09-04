# PR #35 Glass action-settlement instrument red — 2026-09-02

## Immutable boundary

Nick authorized one `test-battery` attempt, with no retry and a 92-minute maximum, for exact PR #35
head `5ae12c7e161e90b3799d6b49a63e2b0438048da6` against exact `develop` base
`7a9f4c1370dd84292388d718c38ff34214f6203b`, gated by
`actions-budget-approved`. GitHub Actions run `33674116068`, attempt 1, began
`2026-09-02T19:34:29Z` and completed failure at `2026-09-02T20:46:40Z` after 72m11s.

GitHub tested synthetic merge `dac0b24ddcc34a9035b8b294727dd104a411ec00`, whose parents are the
exact base followed by the exact head. Its tree
`fbb059cea703cceb3feebcc716e64e02f5f5ba90` is byte-identical to the exact head tree. The Glass
report records that clean detached source at both boundaries, with empty-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, unchanged working-tree
SHA-256 `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`, and
`sourceChange.detected:false`.

## Passed predecessors and terminal stop

Authorization; checkout/setup; environment, exact-scope and budget policy; legacy browser-free
gates; v2 base-profile static gates; changed-art mutation control; shared Chrome launcher
selftest; root Layout **787/787** plus freshness verification; Compendium instrument selftests,
exact calibration-browser installation and live preflight; Compendium **78/78** plus named
verification; and real-browser Slice plus exact binding all passed. SceneMemory correctly skipped
as production-only. Glass consumed exact Slice run `gha-33674116068-1-slice`, report SHA-256
`f0476afe0d812aa109c7f8eabd068f5c393fbc9411cf398912ecd98a3f47d49e` and raw-log SHA-256
`64c0bd4e3569d209bce65733fcb5cb0e696714fbee899837ea8519981420e14d`.

Glass run `gha-33674116068-1-glass` stopped terminal `instrument-fail` after **68,102 ms**. Its
first small-phone 320x568@2 row ran for **63,780 ms**, and its reload row passed in **2,587 ms**.
The report contains zero product findings, one instrument failure, zero blocked controls and zero
automatic retries; it executed 87 of 104 planned controls before causal stop. The exact terminal
error is:

> `small-phone: small-phone/Inventory action settlement: outcome did not arrive within 10000ms (last null)`

The remaining 11 viewports, Recovery and preview packaging correctly did not run. The artifact was
still archived. Browser provenance is Chrome `151.0.7922.173`, revision
`@a96602f30358e9b5d256a0464e7e4d4bec223004`, JavaScript `15.1.206.23` and CDP `1.3`.

## Classification and diagnosis

This is an **instrument failure, not a product finding**. Exact source has two independent Glass
harness defects that prevent the retained report from identifying the product outcome:

1. At exact-head `port/v2/tools/glassmatrix.mjs:11035-11038`, `actionControl.ok` first combines the
   pre-action control, action prerequisite and baseline receipt, but the later
   `...preActionInstrumentControl` spread overwrites that composite `ok`. A false action
   prerequisite or baseline can therefore be reported as green.
2. At exact-head `port/v2/tools/glassmatrix.mjs:11042-11045`, the settlement observation returns a
   full object only when every pending/action/revision/binding clause has already converged and
   returns `null` for every other state. The 10-second timeout consequently retained only
   `last null`, discarding whether dispatch, pending state, refusal, publication, revision or
   equipped binding was the missing clause.

The masked prerequisite and lossy all-or-null observation make the underlying action state
indeterminate. They do not establish a product defect, an Edge/Chrome-version problem, a lease
expiry, or a need to rebaseline. The two downstream negative controls
`inventory-action-publication` and `inventory-convergence-retry` were omitted after causal stop,
not passed as product evidence.

## Preserved bytes

The unique hosted `battery-evidence` artifact is ID `9866333992`, **9,763,738 bytes**, archive
digest `sha256:d27795929ab3407507367aa0356b26d3a49bd46026c6b1e205845da3240ea648`, created
`2026-09-02T20:46:37Z` and expiring `2026-09-16T20:46:35Z`.

The exact Glass report is preserved as
`ARC4_GLASS_PR35_ACTION_SETTLEMENT_INSTRUMENT_RED_20260902_5AE12C7.json.gz`:

- raw report: **89,088 bytes**, SHA-256
  `1b454562442d9c4265bf244dd9a3d9b43e3d26e638e58982b6fb6daed32848d6`;
- deterministic `gzip -n -9`: **10,752 bytes**, SHA-256
  `9f59ba4d6d61cc0c1de5fb9891f3a57f1590edab45fb0bd9d6ea5c442c2aa064`.

Decompression reproduces the raw SHA-256, and an independent deterministic recompression
reproduces the gzip SHA-256.

## Authority after the stop

The one exact authorization is consumed. `actions-budget-approved` is absent; PR #35 remains
Ready, open, mergeable and unmerged, with exact remote head/base unchanged. There was **no retry,
no product finding and no merge**. No push, label, dispatch, PR mutation, release, version bump,
publication or deployment is authorized by this record.
