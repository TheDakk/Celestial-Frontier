# PR #35 battery review — eleventh hosted launcher-instrument red and right-sizing plan

Date: **2026-09-02**
Status: **immutable consumed red; deterministic local repair and unchanged-source develop chain green; no retry or hosted authority**

## Exact eleventh hosted boundary

- Workflow: `test-battery`, GitHub run `33628648136`, attempt `1`
- Authorization job: PASS
- Required `battery` job: terminal FAIL after **6m30s**
- Exact head: `85431115256137b05d7cdfa590e087fd3b4d52e1`
- Exact base: `7a9f4c1370dd84292388d718c38ff34214f6203b`
- Synthetic merge: `44659456e15f5250fdcf566516da8f85a1ef5328`
- Synthetic tree: `517f2e08b53b631b5f493ce39872334bceff83a4`, byte-identical to the head tree
- Terms: owner-applied `actions-budget-approved`, 92-minute maximum, one attempt, no retry

Authorization, checkout/setup, environment/scope/policy, legacy browser-free work, the v2 static
profile, changed-art mutation control, root Layout **787/787**, and Compendium's browser instrument
selftests all passed. SceneMemory was correctly skipped as production-only. The first and only red
was `changed-or-production Chrome launcher selftest`:

```text
Error: SELFTEST abnormal browser exit after Browser.close: injected failure was accepted
```

Exact Edge installation, live Compendium, Slice and Glass correctly did not run. The approval
label was removed immediately, the PR remained open/unmerged, no retry occurred, and this
authorization is consumed.

## What the failure was—and was not

The failure was entirely inside the shared browser launcher's synthetic process-lifecycle
instrument. It did not load or judge Celestial Frontier. The former integrated negative sent a
real `SIGABRT` to a Node browser fixture, allowed only 250 ms for the resulting exit/core-dump
lifecycle to reach the owner, and then began sentinel cleanup. On a loaded Ubuntu runner, cleanup
could change the recorded phase before that lifecycle IPC arrived, allowing the injected abnormal
exit to be misclassified as an accepted owned shutdown.

The browser-free count is not the source of the delay. The complete `develop` profile currently
executes **2,728 passing assertions plus one skip in one approximately 40-second local run**, then
runs three TypeScript programs and the existing art/specification audits. It is not 2,728 hosted
jobs. Long elapsed time comes from the cumulative PR activating all scopes and from live-browser
Compendium and Slice work.

## Eleven-attempt failure classification

| Attempt | Hosted run | Class | Terminal cause |
|---:|---:|---|---|
| 1 | `33273328362` | Instrument/infrastructure | Ignored `main.js` made local testing non-hermetic; two child selftests lacked reliable Linux bounds. |
| 2 | `33278630671` | Product/runtime | Landing crossed persistence barriers; worker build-pin and BFCache fixture ownership also needed repair. |
| 3 | `33437596315` | Instrument | Compendium Back compared stale pre-helper geometry rather than action-time state. |
| 4 | `33453239307` | Instrument | Shared launcher lacked correct descendant-tree/profile cleanup ownership. |
| 5 | `33466661094` | Instrument sequencing | Slice issued dependent Enter before Survey reached its durable fixed point; later findings cascaded. |
| 6 | `33522000552` | Product/runtime | Automatic travel consumed its one-shot latch before the action owner accepted the attempt. |
| 7 | `33542791572` | Instrument | Eleven Settings flows and diagnostic saves were placed inside one 30-second CDP command. |
| 8 | `33560546382` | Instrument | Final-only audio traversal lost a valid temporal route; phone Land reused pre-Guide authority. |
| 9 | `33572309149` | Mixed | Guide used fixed wheel counts; D-TRAIN sampled before convergence; ceremony ordering was a real presentation defect. |
| 10 | `33584052508` | Wrong-tier instrument | Mutable SceneMemory allocator phase incorrectly remained a `develop` blocker. |
| 11 | `33628648136` | Instrument | `SIGABRT`/exit IPC timing allowed the injected post-close abnormal exit to be accepted. |

Result: **8 instrument/infrastructure stops, 2 product/runtime stops, and 1 mixed stop**. The
dominant problem is evidence-instrument reliability and ordering, not widespread game breakage.

## Battery ownership review

### Keep as `develop` admission

- owner authorization, exact base/head and scope/policy checks;
- one consolidated v2 `develop` static profile;
- relevant legacy/layout work only when its inputs changed;
- one current Compendium certificate plus named verifier;
- one critical develop Slice plus named verifier;
- one full 12-viewport Glass matrix bound to the exact Slice predecessor plus named verifier.

These checks protect determinism, persistence, mobile layout and the playable browser journey.
They are not candidates for deletion merely because the cumulative PR made all of them active.

### Instrument-only and only when relevant inputs change

- art mutation control;
- browser path resolver selftest;
- shared launcher selftest;
- Compendium preflight and synthetic collector selftests;
- root layout selftest when legacy/layout inputs changed.

The required causal order is the shared launcher selftest before every real-browser consumer,
then Compendium's resolver/preflight/synthetic controls before the live Compendium certificate.

### Production-only or quarantined

- live SceneMemory heap selftest, certificate and verifier;
- production preview producer controls;
- Recovery bound to exact SceneMemory, Compendium, Slice and Glass predecessors;
- production preview packaging.

SceneMemory's native-heap work remains intentionally stale/red and cannot block `develop`.
Production still requires Nick's separate activation decision.

### Evidence transport

Named in-process verifiers remain blocking. Artifact upload is retention/transport rather than a
gameplay verdict; separating upload-service failure from the required battery result is a
post-merge policy decision, not part of this repair.

## Bounded repair

The successor keeps all product requirements and changes only lifecycle evidence and causal
ordering:

1. Record the `Browser.close` lifecycle phase before synchronous send, but claim a request only
   after send succeeds.
2. Wait for the exact browser lifecycle promise rather than waiting for a sentinel-owned tree that
   deliberately cannot quiesce before cleanup.
3. Replace the core-dump-dependent integrated negative with a `SIGUSR2` handler that writes an
   explicit receipt and exits with deterministic code `17`; retain pure SIGABRT classifier cases.
4. Before the final group barrier, make the sentinel terminate and observe the exact browser child,
   flush its lifecycle IPC, then announce its identity and group-kill remaining descendants.
5. Latch shutdown diagnostics without releasing ownership early; preserve profile removal and
   stable-absence proof before reporting the diagnostic.
6. Keep TERM grace, lifecycle flush and acknowledgement watchdog phases within the caller-owned
   shutdown deadline.
7. Add integrated clean, nonzero, missing-lifecycle, forced-SIGKILL and pre-barrier-error controls,
   plus source mutations for the ordering and barrier invariants.
8. Move the shared launcher selftest ahead of Layout, SceneMemory and Compendium so it fails before
   any expensive consumer.

Current shared launcher SHA-256 is
`4236ec3fc357d987c525bfde3e58eec09f38373dab8faff61d5712dc598ba7ca`.
Compendium measurement authority is
`b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`; only its `browserCdp`
input changed. Producer authority remains
`308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77`.
No ruler, numeric ceiling, outcome inventory, sample, game byte, browser-family/CDP policy,
browser point-version rule or retry policy changed.

## Verification and stopping rule

Exact SSH-signed implementation/docs source
`a484c39b30c8cdecac464c31283f64efb0263628`, tree
`eb9ed823ff165ff89d9c8137f006e30497931c73`, parent
`85431115256137b05d7cdfa590e087fd3b4d52e1`, passed its hermetic tracked-input `develop`
rehearsal at **264/264 files, 2,728 passed / 1 skipped**, all three TypeScript programs, **34**
clean art sources, **1,014/1,014** routes and **454** non-inert fields. The exact source remained
clean and byte-identical through every later stage.

- Root Layout `local-1788355721508-17420-624f697795` passed **787/787** across 10 viewports in
  **76,917 ms** and passed named verification.
- Compendium `20260902133054645-17703-2cf459762b` passed **78/78** with zero findings or blocked
  outcomes in **65,415 ms** and passed named verification.
- Develop Slice `20260902133238723-18057-fb0557070177` passed terminal/certifying with zero
  findings/scopes and ten screenshots in **363,456 ms**. Named verification bound report SHA-256
  `6724025357702846ef9283d4ecd55ba0e86f57a3d4a87607b33953a9717851b5` and raw-log SHA-256
  `4e3750b8eea9e2ad2df8b9edb73a49b9a321dd7e1bea5e6a4f1a9f43ad6f44da`.
- Glass `20260902133910919-18520-cab54654b9fd` consumed that exact Slice predecessor and passed
  **12/12** viewports, **12/12** reload rows and **104/104** controls with zero blocked/omitted
  controls, findings, instrument failures or retries in **116,033 ms**. Its Slice-bound named
  verifier passed; report SHA-256 is
  `eec545ab3215a5cbeb0c52cf316bc4e0bfcbc16c27c31e023d7b55223a5838cc`.

Five deterministic `gzip -n -9` carriers preserve the exact reports/log:

- `ROOT_LAYOUT_PR35_LAUNCHER_LIFECYCLE_REPAIR_PASS_20260902_A484C39.json.gz` — raw **106,958
  bytes**, SHA-256 `ea59339872b99738bd6b6d4e20832d4d911392f674bf92e38082eb5258ce0272`;
  gzip **5,034 bytes**, SHA-256
  `1df2c2f0b705e2f06ae7b3c90c203704270c4d3ca726b6796f4db6cb791b9a72`.
- `ARC1A_COMPENDIUM_PR35_LAUNCHER_LIFECYCLE_REPAIR_PASS_20260902_A484C39.json.gz` — raw
  **10,836,499 bytes**, SHA-256
  `982ae51835d7b7c0f3bba71c3f4f7bea4cc9715b2d39f51282f7a994ca30f8bc`; gzip **452,500
  bytes**, SHA-256 `2e0230bd68c7fa7d6055ad637829d98b39f425c0715b3aa9a347498aee8955fd`.
- `ARC4_SLICE_PR35_LAUNCHER_LIFECYCLE_REPAIR_PASS_20260902_A484C39.json.gz` — raw **6,126
  bytes**, SHA-256 `6724025357702846ef9283d4ecd55ba0e86f57a3d4a87607b33953a9717851b5`;
  gzip **1,961 bytes**, SHA-256
  `cfcc2d0e7e3c39f0a6b7f34018fc1e4a8dd1e4e0162b63f43ea7f76af8e7d315`.
- `ARC4_SLICE_PR35_LAUNCHER_LIFECYCLE_REPAIR_PASS_20260902_A484C39.log.gz` — raw **6,950
  bytes**, SHA-256 `4e3750b8eea9e2ad2df8b9edb73a49b9a321dd7e1bea5e6a4f1a9f43ad6f44da`;
  gzip **3,291 bytes**, SHA-256
  `64a626af9e27046a5f3a28dbaa866b45270302e507b15d1bec12a0758d502710`.
- `ARC4_GLASS_PR35_LAUNCHER_LIFECYCLE_REPAIR_PASS_20260902_A484C39.json.gz` — raw **898,814
  bytes**, SHA-256 `eec545ab3215a5cbeb0c52cf316bc4e0bfcbc16c27c31e023d7b55223a5838cc`;
  gzip **78,837 bytes**, SHA-256
  `264afa94dc1191b08559efde51ed4349017a884fa2a5131c6aec180e6870707c`.

All five pass gzip integrity, byte-for-byte raw comparison and deterministic recompression. Every
certifying stage ran once; no stage retried. The signed documentation/evidence descendant containing
this audit also passes the final hermetic tracked-input `develop` proof at **264/264 files, 2,728
passed / 1 skipped** with all three TypeScript programs and art/specification audits green.

Do not rerun hosted head `8543111…`. No push, label, hosted run, PR mutation, Ready transition,
merge, release, version bump, publication or deployment is authorized by this audit.

## Post-merge consolidation candidates

These are review recommendations, not changes silently folded into PR #35:

1. split launcher runtime transport from its large selftest fixture file so fixture-only changes do
   not rebind product measurement authority;
2. reuse retained Compendium evidence when all producer and measurement input digests are
   unchanged, rather than binding expensive work to the whole commit;
3. separate Slice's critical develop journeys from exhaustive production-only harness campaigns;
4. add one thin `prehost:develop` orchestrator that invokes existing owners once and prints a
   stage manifest, without duplicating assertions;
5. keep future integration PRs smaller so unrelated historical work does not activate every scope.
