# Regional compiler selftest 01

PASS: one execution, nine focused cases, tool receipt `2c6528`, exit 0.
The exact command, log hashes and compiler hashes are in
`regional-selftest-01-execution.json`. The report and 31 exact source snapshots
are under `regional-selftest-01/`; all 31 sources retained identical hashes
during this execution. No real candidate intake, static battery, S2, browser,
film, or CPU measurement was performed here.

The synthetic fixture has 32 texture owners, 63 joints, 31 explicit regions,
133 field vertices, and 70 triangles. The compiler preserved all 32 inherited
pins and added 59 explicitly requested shape pins. Standard binding sealing,
source coordinates, interpolation, triangles, part frames and solver settings
were retained. The bound result is
`68dc9191e3fcb9164f434dee0361af2554cf28a89c432ae93ce12eb9cd7a8301`.
This hash identifies synthetic test geometry, not the Centipede painting.

Each of the 63 declared joints moved its assigned mesh through the actual
skeleton evaluator, ARAP solver and Float32 part interpolation. Exact rest had
zero changed coordinates. Proximal Knee pins remained unchanged under Foot-only
rotation while the inherited Foot pin followed its exact Float32 target. The
same motion observation rejected an erased antenna influence and a walking
part whose weights were all replaced by root. An unpinned antenna seed also
survived diffusion and produced measured mesh motion of
`0.03803853771737553` native pixels in this synthetic pose.

Expected refusal controls passed for an unknown joint, conflicting inherited
pin, conflicting regional joint, region with no owned paint, painted region
with no selectable field support, stale record hash, and stale binding hash.
The retained test source records each exact expected diagnostic pattern. The
audit added a missing standalone record-hash check before running the selftest;
the intake already supplies a freshly sealed record.

Remaining authoring limits:

- A polygon selects existing field supports referenced by its part. Some
  supports lie in mesh padding. Separate nonzero-alpha pixel counts prevent an
  empty paint region, but do not establish that every selected support itself
  lies on paint or that its anatomical label is correct.
- Uncovered supports retain the original split's initial weights, then join the
  shared diffusion pass. They are not guaranteed pure Foot/head afterward.
- A region overlapping a differently owned root/contact lock refuses. Preserve
  the attachment collar through source authoring; do not release protected pins
  to make a broad polygon pass.
- A positive weight is not proof of meaningful movement on the real painting.
  These motion controls establish compiler behavior on the fixture. The actual
  candidate still needs its full exact-rest, contact, seam, static and native
  admission chain. No source-pixel coverage or real art acceptance is claimed.

The fresh S2 helper at `contact-regression/run-s2.mjs` was inspected and is byte
identical to the retained Tarantula final runner. Its unexecuted command is:

```sh
node audits/ARCHETYPE_FINISH_20260923/12-myriapod/contact-regression/run-s2.mjs
```

It requires fresh output, preserves the sentinel instrument apart from output
routing, and compares six complete receipts, 12 input hashes and 13,286
decompressed support samples against the retained baseline. The parent owns
authorization and execution after final shared source is ready.
