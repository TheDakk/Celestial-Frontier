# audits/ — external review bundles, preserved

External review rounds arrive as uploaded zips. Those uploads and any working directory used to
unpack them are **session-scoped** — they disappear when a session ends. The fix lists were being
copied to the repo root piecemeal while the evidence, harness code and raw measurements were not,
so the *conclusions* survived and the *proof* did not.

Everything here is committed so a future session can re-read the measurement rather than trust a
summary of it.

## Contents

### Signed `bf24a492…` universe-polish restart — Layout/SceneMemory/Compendium PASS, Slice instrument stop

Signed clean source `bf24a4921eb5ca757a4978b9d01e44ae39a0a06d` (tree
`9518b5ff8df81e82837687bfe8c6ea4933ddf97c`, parent `27513798bedd…`) passed Layout **787/787**
in 76,215 ms, SceneMemory **44/44** in 10,822 ms and Compendium **78/78** in 45,945 ms, each once
without retry and with exact named verification. Slice
`20260829-universe-polish-bf24a4921eb5-slice` then ran once for 239,797 ms and stopped before
Glass/Recovery with ten findings.

Nine findings were one release-oracle cascade: the truthful Feed bulletin used grammatical
`; refused, stale…`, while Slice and Glass alone required capitalized exact copy. The independent
tenth finding waited for Feed audio after the imported fixture left Creature Voices off; product
policy correctly requires both Sound and Creature Voices. The repair leaves app/release bytes and
memory producers unchanged, case-folds the shared silence promise in both browser oracles and uses
real Settings to enable and verify both preferences before retaining the exact oscillator/graph
outcome. Focused 64/64, both report selftests, full 1,711-pass + one-skip v2, all typechecks,
`artunused`, producer derivation and diff hygiene are green.

- `PHASE4_LAYOUT_UNIVERSE_POLISH_PASS_20260829_014157430.json.gz`: 5,026 compressed bytes,
  SHA-256 `8c6743839683b1917ba52dbf831967d9902de5be535954069caa140296ed6893`; 106,976 raw bytes,
  SHA-256 `9ad615522348a5b7c3da7e46230a4c03c3cf96501ebd4f119cb94635ced80a85`.
- `ARC1C_SCENEMEM_UNIVERSE_POLISH_PASS_20260829_014226362.json.gz`: 30,488 compressed bytes,
  SHA-256 `025328bd245b90b0a9a54a75f77057309318f241ca5b122a8a3d0df012f4f98d`; 426,760 raw bytes,
  SHA-256 `dede46d7dfb3d8bc6f57e054ebf2af7e21aa2292aa21c0e42c2663c59ec2b910`.
- `ARC1_COMPENDIUM_UNIVERSE_POLISH_PASS_20260829_014326379.json.gz`: 450,582 compressed bytes,
  SHA-256 `0b3e90a0ce26e437823c506a7c1baddcc2f589f05fab94234819030439aa32c4`; 8,595,166 raw bytes,
  SHA-256 `fa866a078532457531e0525217dde12f6e5a2230124634f7b0cd413f45b8b3db`.
- `ARC4_SLICE_UNIVERSE_POLISH_RELEASE_NOTE_FAILURE_20260829_014859940.json.gz`: 5,374 compressed
  bytes, SHA-256 `9878f712f12c5966fc2c816bb3efb5856c2cfdfc5ecc8c2b4cd5913c396c488b`; 122,262 raw bytes,
  SHA-256 `9d047013a39f522485067f62b11503ddb951f690591b06367b607e9b75a9fef0`.
- `ARC4_SLICE_UNIVERSE_POLISH_RELEASE_NOTE_FAILURE_20260829_014859940.log.gz`: 3,323 compressed
  bytes, SHA-256 `caa22e4ad8e493aeacd0659f52625ce1001ceb29b9fb7e5b4010efee0351b857`; 55,984 raw bytes,
  SHA-256 `02bc7642d85e8fdddff6884591046d8bbe89c92ce95a8976ff1210be1f5e43e9`.

All five carriers pass gzip integrity. This campaign is immutable and grants no Slice, Glass,
Recovery, HUMAN, hosted, merge or release authority. The signed repair must restart at Layout.

### Signed `b65fd5d…` calibration + signed `27513798…` activation — exact Compendium certificate green

Signed clean calibration source `b65fd5d4a1b7928fc8c722f4e6ac22cc2ef02974` (tree
`d59e2a9fd3ea61fa24459a41646672c73c5024cf`, parent
`55126af50f3f7ab7b4eaeee7d81b28f8881c87fa`) stayed clean and unchanged for all four measurements.
The candidate reports bind measurement authority
`cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78`, producer authority
`d97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271`, Microsoft Edge
`151.0.4129.107` / CDP `1.3`, the same exact fixture/input identity and one committed working-tree
digest. Their distinct run IDs and timestamps satisfy the independent-run rule:

- `20260829-universe-polish-b65fd5d4a1b7-candidate1` ran once with zero automatic retries,
  completed all 78 calibration outcomes in 45,761 ms and retained no findings;
- `20260829-universe-polish-b65fd5d4a1b7-candidate2` ran once with zero automatic retries,
  completed all 78 calibration outcomes in 45,286 ms and retained no findings;
- `20260829-universe-polish-b65fd5d4a1b7-candidate3` ran once with zero automatic retries,
  completed all 78 calibration outcomes in 45,357 ms and retained no findings.

These are calibration observations, not current-budget PASS certificates. Across the three runs,
phone maxima were 10,925,264 B V8 heap, 4,823,337 B backing storage, 16,558,308 B aggregate heap,
3,210,056 B encoded art and 308,486 B encoded portrait; desktop maxima were 14,570,732 B V8 heap,
6,331,653 B backing storage, 21,249,926 B aggregate heap, 8,523,880 B encoded art and 308,486 B
encoded portrait. The reviewed rational-headroom selection is:

- phone: 11,534,336 B V8 heap, 5,242,880 B backing storage, 17,825,792 B aggregate heap,
  3,407,872 B encoded art and 393,216 B encoded portrait;
- desktop: 15,728,640 B V8 heap, 6,815,744 B backing storage, 23,068,672 B aggregate heap,
  8,912,896 B encoded art and 393,216 B encoded portrait.

Every other numeric field remains byte-identical to the prior ruler. The wider aggregate/V8 margins
avoid turning normal measured spread or sub-one-percent headroom into an immediate false red. The
384 KiB portrait ceiling conservatively preserves prior cross-platform encoder variance; it is not
a claim of a fresh Linux measurement. Exact decoded-resource +1 sentinels, fractional next-state
sentinels and the 512 KiB warm-range rulers remain unchanged.

Paired run `20260829-universe-polish-b65fd5d4a1b7-baseline1` measured the exact broken product at
`38447019517147319bd08c598202d097ee866874` with collector source `b65fd5d…`. Both phone and
desktop reproduced all four sealed faults: `unwindowed-1500-rows`, `list-source-440`,
`full-portrait-dom-exposure` and `eager-art-import`. The selected ceilings retain the exact expected
**14 phone / 13 desktop** numeric breach inventories.

- `ARC1_COMPENDIUM_UNIVERSE_POLISH_CANDIDATE1_20260829.json.gz`: 455,574 compressed bytes,
  SHA-256 `65c9982ee3339d32b493fe26beb72aa35b2d55cece3b35a981852512ee6cacdc`; 8,683,347
  decompressed bytes, SHA-256 `d259ddbee5e621dd7694302601ac4a4576bd31ba39d184f93874c446683a5135`.
- `ARC1_COMPENDIUM_UNIVERSE_POLISH_CANDIDATE2_20260829.json.gz`: 451,313 compressed bytes,
  SHA-256 `855d823ec0a8866e3f69f8542fd8a1c892ca04760341c3b7b9fa36d9caba66e0`; 8,577,843
  decompressed bytes, SHA-256 `7d36e634b30a75ae70a15a806dc7288b76815c151110377dbb3717121d36972e`.
- `ARC1_COMPENDIUM_UNIVERSE_POLISH_CANDIDATE3_20260829.json.gz`: 451,208 compressed bytes,
  SHA-256 `bf1ad07f82c7e3565644162b7d9195289f844e0be360259689800f4ffa8a9d0c`; 8,581,571
  decompressed bytes, SHA-256 `7fbd4375d26063a8e000b63fe652cc4d812696255dc5467641332836a7e7c705`.
- `ARC1_COMPENDIUM_UNIVERSE_POLISH_BASELINE1_SAMPLE_20260829.json.gz`: 2,868 compressed bytes,
  SHA-256 `353c09949f413d3f4a9a7907167151345475877225033df10156e65c71a978c2`; 14,756
  decompressed bytes, SHA-256 `fc9afe2499629e9ad16966b0f8da4b370acf056fbd13a2309a1d0a592e5361aa`.

All four calibration carriers pass gzip integrity. Signed activation
`27513798bedd9e4337d0b1db9712fa784b90b9fd` (tree
`9ae0ffa3c8d39d0a05b6f8b823576b88af8fb516`, parent `b65fd5d4…`) owns the active budget SHA-256
`02ee0ada076e444b7f3ad67c47c3de688bbd290d7e1a9a9e7570168f2d4c29f0`; focused 27/27,
222 selftest controls, full 1,711-pass + one-skip v2, all typechecks, `artunused`, current-producer
binding and independent review are green.

Its exact run `20260829-universe-polish-27513798bedd-compendium-certification` then completed once
with zero retries, passed all 78 outcomes in 44,432 ms with complete lifecycle/cleanup, zero
findings/blocked outcomes and passed named verification. It binds unchanged clean source begin/end,
the exact active budget, measurement `cd1586e2…`, producer `d97370c0…`, six review PNG manifests and
Edge `.107` / CDP `1.3`. `ARC1_COMPENDIUM_UNIVERSE_POLISH_ACTIVATION_CERTIFICATION_20260829.json.gz`
is 453,664 compressed bytes with SHA-256
`1415773e8eb7474d141b9174939bf618795b76742afd874e4bf73fa7bc0a70e7`; its 8,637,650-byte raw
report has SHA-256 `3b0116f98a77e3089ef80fd78ebc762a658c74907a2c5e473061718c9860e7a6`.
After this carrier and synchronized docs are signed, a completely fresh
Layout → SceneMemory → Compendium → Slice → Glass → Recovery chain begins on that descendant.
Routine compatible Edge updates remain provenance only and never trigger rebaseline or recalibration.

### Signed `55126af…` universe-polish campaign — Layout/SceneMemory PASS, Compendium product-budget stop

Signed clean source `55126af50f3f7ab7b4eaeee7d81b28f8881c87fa` (tree
`1b561cae692f38d2b8f38e66578a68657b0567a7`, parent
`283c8b3b04e0e9a70bb7e4242e3408169c24b02a`) stayed clean and unchanged through every completed
stage. Layout `20260828-universe-polish-55126af50f3f-layout` ran once with zero retries, passed all
787 sealed outcomes across ten viewports in 76,378 ms and passed named verification. SceneMemory
`20260828-universe-polish-55126af50f3f-scenemem` then ran once with zero retries, passed all 44
outcomes in 10,672 ms and passed named verification.

Compendium `20260828-universe-polish-55126af50f3f-compendium` ran once with zero retries on
Microsoft Edge `151.0.4129.107` / CDP `1.3`, retained a complete terminal product `fail` report in
46,681 ms, and its named verifier accepted that exact red report with the expected nonzero result.
Exactly four of 78 outcomes failed; the other 74 resource, lifecycle, ownership, DOM,
answerability and cleanup outcomes passed:

- **Phone heap:** V8 used heap was 10,902,116 B against 10,485,760 B (416,356 B / 3.97% over),
  and backing storage was 4,678,792 B against 4,194,304 B (484,488 B / 11.55% over). Embedder heap
  was 3,070,912 B against 4,194,304 B and aggregate heap was 16,222,216 B against 16,777,216 B,
  both within their ceilings.
- **Phone bytes:** encoded thumbnail bytes were 3,202,320 B against 2,621,440 B (580,880 B /
  22.16% over), and the retained portrait was 308,486 B against 262,144 B (46,342 B / 17.68%
  over). Cache entries, decoded pixels/bytes, jobs, leases, subscribers and portrait entries passed.
- **Desktop heap:** aggregate heap was 21,239,200 B against 20,971,520 B (267,680 B / 1.28%
  over). V8 used heap was 14,536,484 B against 14,680,064 B, embedder heap was 3,220,288 B against
  4,194,304 B and backing storage was 6,278,552 B against 6,291,456 B, all within their ceilings.
- **Desktop bytes:** encoded thumbnail bytes were 8,528,076 B against 6,815,744 B (1,712,332 B /
  25.12% over), and the retained portrait repeated the 308,486 B against 262,144 B breach. All
  structural/resource-ownership counts passed.

Warm plateaus passed on both profiles, including desktop's 326,652 B range against 524,288 B.
Independent diagnostic audits found no leak-shaped lifecycle evidence: the stable plateaus and
roughly 22–25% encoded-thumbnail increase align with the deliberately richer deterministic art
producer. The app's harder runtime encoded caps also retained substantial room (phone
3,202,320/6,690,816 B; desktop 8,528,076/17,842,176 B). This is a real current-product budget red,
but it is **not** Edge drift and does not request an Edge rebaseline: the version-tolerant browser
contract accepted `.107` exactly as designed.

This immutable report remains bound to measurement authority
`3c811274c4f67cf706b621142db2001d614ba6b1a3c3669daf6ce1dacf67b574`. The subsequent
calibration-required authority-binding repair advances the prospective measurement to
`cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78`; it does not rewrite this
report or promote it into a calibration sample.

The fail-fast campaign stopped before Slice, Glass or Recovery. One run cannot move numeric
ceilings. The prescribed successor is a new signed source that puts the Compendium budget into
`calibration-required`, then runs exactly three independent current-producer candidates per profile
plus the paired broken baseline at exact commit
`38447019517147319bd08c598202d097ee866874`, each once with zero retries. Only that evidence may
select strict replacement ceilings; certification must then restart the complete serial chain from
Layout on another unchanged signed source.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260829_001955334.json.gz`: 5,029 compressed bytes,
  SHA-256 `8a922d61d7195db624984f4ca735b82b5076955d7c641295061cc252573cb000`; 106,976
  decompressed bytes, SHA-256 `bd2dacb071e4f667a0565b2cd43de06461adcc228bc60b1b37700bbf24f3a813`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260829_002021315.json.gz`: 30,441 compressed bytes,
  SHA-256 `f9bb59a819c91babe2cc429a41b00ce43cf49582d7d8b0e7db4a13dbcce448c5`; 426,948
  decompressed bytes, SHA-256 `1355c8a67e64a4cf058e6dd85aeda006396e37e7b885f97b724f173da440ec2d`.
- `COMPENDIUMMEM_CURRENT_INPUT_FAILURE_20260829_002129399.json.gz`: 452,821 compressed bytes,
  SHA-256 `25292bcd0ff55a32842c0958d25ae9d299c1ef8470ca6dc7269ccdfd1c092716`; 8,591,680
  decompressed bytes, SHA-256 `c5adaca207770251b48b3cadf634d80bd03cb55f589814fd3e93c8c635aba5d8`.

All three carriers pass gzip integrity and decompress byte-for-byte to the exact sizes and hashes
above. They remain immutable failure evidence and must never be relabeled or rerun.

### Signed `a9d35cc…` universe-polish campaign — Layout PASS, SceneMemory instrument stop

Signed clean source `a9d35cc795076a8903807d02ae011288ea5a639c` (tree
`c2374dc04488654058919d0f539f770ea9e3e467`, parent
`c55cc63ee3a8c9b761cfccb2de2ad108f46c6b4e`) stayed clean and unchanged through both completed
stages. Layout `20260828-universe-polish-a9d35cc79507-layout` ran once with zero retries and passed
all 787 sealed outcomes across ten viewports in 76,183 ms; its named verifier passed.

SceneMemory `20260828-universe-polish-a9d35cc79507-scenemem` then ran once with zero retries and
stopped terminal `instrument-fail` after 6,059 ms. The phone profile completed its initial sample,
four warmups, all four measured cycles and BFCache proof. Before reload cleanup, the collector
passed the 30,000 ms art-phase budget directly to `Runtime.evaluate`; the owned CDP transport
correctly rejected that request because its command cap is 5,000 ms. Desktop collection,
contract projection and all 44 outcomes therefore did not run. Browser, server and workspace-lock
cleanup all passed. This is an instrument timeout-wiring failure, not a product verdict. The serial
campaign stopped there, so Compendium, Slice, Glass and Recovery correctly did not run.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260829_000555600.json.gz`: 5,028 compressed bytes,
  SHA-256 `f872b3c4914d893671d40055c0ed8dd4c7ff4d2b1e1bff4874991250d68b355b`; 106,976
  decompressed bytes, SHA-256 `012bf5ed8fabf6e9c6bc6058a6933861c777bbac6e45dd8c6bfcd92fb3f0b37d`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_INSTRUMENT_FAILURE_20260829_000629495.json.gz`: 15,721
  compressed bytes, SHA-256 `e88138914aa9c5f838aa9fcb3db3f7fb27621597ea21bd7439daaa78465d2f31`;
  169,741 decompressed bytes, SHA-256
  `3cdfe2f6bbece91010e641451c043783227676ad9f2b59f8f706ee505b8b1b73`.

Both carriers were produced with deterministic `gzip -n -9`, pass gzip integrity and decompress
byte-for-byte to their exact raw artifacts. The repair keeps each CDP command at or below the
existing 5,000 ms transport cap while the separate 30,000 ms semantic phase deadline remains
unchanged; it rebinds only producer identity and does not recalibrate a numeric ruler. Any repaired
evidence must start a new exact-source campaign from Layout with new run IDs rather than retrying
this immutable stop. Edge `151.0.4129.107` / CDP `1.3` is provenance only.

### Signed `7cb0969…` Final13 campaign — complete exact-source automated chain PASS

Signed clean source `7cb09699726b0f2cc069a1f123bce5ccd6d9e41f` (tree
`209abfea522c837ea7e236c6e6381f0174ed5f53`, parent
`5ab4d3ec92a7575fc091ca3b2c358ef01927be02`) remained clean and unchanged through the complete
once-only Final13 campaign. Layout `20260828-phase4-final13-7cb09699726b-layout` passed 787/787
sealed outcomes across ten viewports in 75,945 ms. Source-bound SceneMemory
`20260828-phase4-final13-7cb09699726b-scenemem` passed 42/42 in 10,235 ms. Source-bound
Compendium `20260828-phase4-final13-7cb09699726b-compendium` passed 78/78 in 43,752 ms, with
zero findings or blocked outcomes and six exact review-PNG bindings.

Slice `20260828-phase4-final13-7cb09699726b-slice` passed terminally in 423,847 ms with
parent/child exit `0/0`, zero findings or failed scopes, ten exact review-PNG bindings and zero
automatic retries. Glass `20260828-phase4-final13-7cb09699726b-glass` then passed all 12
viewports in 85,944 ms with zero findings or instrument failures and the exact Slice report/log
predecessor hashes. Recovery `20260828-phase4-final13-7cb09699726b-recovery` passed terminally
in 1,290,887 ms with zero findings. Its observation verdict passed all 15 outcomes across 308
samples, spanning 1,200,308.5 ms of browser observation (1,200,309 ms active-play elapsed), and
the exact next-cycle boundary, recovered UI and complete cleanup all passed. Recovery binds the
exact Slice report/log and Glass predecessor hashes. Every stage ran exactly once, and every
exact-run named verifier passed before its successor began.

This is the complete automated Slice → Glass → Recovery certificate for this exact signed
source only. It grants no HUMAN, hosted, integration, whole-Gate, version, release, deployment,
preview or publication authority.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_150805271.json.gz`: 4,669 compressed bytes,
  SHA-256 `bcef7c40e36c900802e6e57fddba60de5b95e653cca8f3231f7731c3c3fc024c`; 106,062
  decompressed bytes, SHA-256 `7c6a605435c785caa758edbe32841c883d171b89a1c8a5a6ba21afeaac70110e`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_150839984.json.gz`: 22,331 compressed bytes,
  SHA-256 `ac608d605fd789a84a58ca125b0fe42157ea7218f3dbc9f41d072ef42dff38cd`; 305,665
  decompressed bytes, SHA-256 `0fc075d677dbb37ff1a7c70d1e3c981ecc7abb746b79e3fd09a3a7b8ce574f75`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_150944210.json.gz`: 442,022 compressed bytes,
  SHA-256 `717064782d4a0d18844d1762b684ac692c865fd012f7f183d7c7caa4853b33bb`; 8,524,870
  decompressed bytes, SHA-256 `09425b6b1a35e673c042442970c7ee67c25ba46be53e8ab46247ec3ba6c587b8`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_151711686.json.gz`: 1,919 compressed bytes,
  SHA-256 `ab5753c1b995e3531003e53d7dd014d6bd49f45cea300a95ee83de64c2d9ae5b`; 6,169 decompressed
  bytes, SHA-256 `b001d8a1bb80ce131d9a81d660657176f078ca0317ca1cf42fafabada0a098fc`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_151711686.log.gz`: 2,911 compressed bytes,
  SHA-256 `60d5838b00bf1062b993899d063e7896039c0c6e60f564d78611ee03bf963624`; 5,905 decompressed
  bytes, SHA-256 `31d38adb81af8349ce52e62c0acce51287a57f1e0fcadeaad0ebe0dce4d3f133`.
- `PHASE4_GLASS_CURRENT_INPUT_PASS_20260828_151857734.json.gz`: 70,640 compressed bytes,
  SHA-256 `fdaffe75858907cec26635bb30959da2b2a850f6ef0f7640244af69336336c64`; 845,143
  decompressed bytes, SHA-256 `c580549251032b9de9e5b112d312b4e3f38f2bbeb79ba6353db6bf24ee9f252a`.
- `ARC4_RECOVERY_CURRENT_INPUT_PASS_20260828_154058034.json.gz`: 276,918 compressed bytes,
  SHA-256 `d06fbb646d3eeff95da762bde6029dea80c84e04d7559a09d9e2d9bcb3002b1a`; 3,802,681
  decompressed bytes, SHA-256 `79f2bf8e3833b100c9fbbdbd0cbaa6a7529ee9cdaf5d4789ab9da37fc496df6b`.

All seven Final13 carriers were produced with deterministic `gzip -n -9`, pass gzip integrity,
and decompress byte-for-byte to raw artifacts with the exact sizes and SHA-256 values above. The
six Compendium and ten Slice run-ID PNGs remain in the ignored smoke workspace; their byte sizes
and SHA-256 bindings are retained inside the reports, matching the established policy of committing
the compressed result/log carriers rather than duplicate screenshots. Edge `151.0.4129.107` / CDP
`1.3` is provenance only and never a baseline, rebaseline or numeric-threshold key.

### Signed `5097345…` Final12 campaign — three green predecessors, then Slice mutation-control stop

Signed clean source `509734533dd47a659138f9c6b69c125dc1f75dc2` (tree
`609e92c6278f43ac3983b97ffe121493bfedaf68`, parent `12d826a…`) remained clean and unchanged
through every completed Final12 stage. Layout
`20260828-phase4-final12-509734533dd4-layout` passed 787/787 sealed outcomes across ten viewports
in 76,474 ms. Source-bound SceneMemory
`20260828-phase4-final12-509734533dd4-scenemem` passed 42/42 in 9,974 ms. Source-bound Compendium
`20260828-phase4-final12-509734533dd4-compendium` passed 78/78 in 43,804 ms, with zero findings
or blocked outcomes and six exact review-PNG bindings.

Slice `20260828-phase4-final12-509734533dd4-slice` then ran once for 414,198 ms and ended stored
`fail`, parent/child exit `1/1`, with one finding in the single `arc-4-stale-convergence` scope.
The real-path assessment itself was wholly green: `assessment.ok` was true and every main
acquisition, empty-CAS, no-mutation, exact-authority, convergence-release, read-only reload,
Arc-5 preservation and one-native-action check passed. The stop came from the
`witnessAuthorityControl` negative control: coordinating the before/after `sessionOrdinal` mutation
correctly made `convergenceRelease` false, but also made the top-level `oldUiConvergence` false. The
control was therefore double-red instead of isolating only `convergenceRelease`, and the fail-closed
isolation
check stopped the campaign. This is an instrument mutation-control coupling, not a demonstrated
product failure. There was no automatic retry; Glass and Recovery correctly did not start, so
Final12 grants no Glass, Recovery, HUMAN, hosted, integration, version, release or deployment
authority.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_140426642.json.gz`: 4,668 compressed bytes,
  SHA-256 `daebe2ef62e3e318b3b13e74e4324b67e14255dc07b07f3a5f5ae23080c55e78`; 106,062 decompressed
  bytes, SHA-256 `309c591414980ca4d839478c4963ad9fe68478ce9d98d8d3fb7d9bd2d6a9fdc4`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_140504682.json.gz`: 22,288 compressed bytes,
  SHA-256 `3834ab2603a8c3b781d58542009f89e9fc5b2c9617c25bb7bebaa82e075b74fa`; 305,506 decompressed
  bytes, SHA-256 `b22e90bc2e443e42b6790591c58292f16249cbeb8b8da464e7c7d1534e4cf7ac`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_140612082.json.gz`: 443,335 compressed bytes,
  SHA-256 `a2c235cc33b1de1f3b07f461cd986febcf4e6c95f113338588049021fd0a3a7a`; 8,562,987
  decompressed bytes, SHA-256 `1d4e5e59af3d7b07d14bc63a25a8f5ff58a6fae99b5481e9e28d7334a8ea9c7c`.
- `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260828_141326745.json.gz`: 28,329 compressed bytes,
  SHA-256 `f90f47a50730fc25267e59f3aab8075265b1a3c7296d614e71d2e7cb00863999`; 198,289 decompressed
  bytes, SHA-256 `2df7f476cfb367385d7e86ffbd06dda3807044cad7feb49d3026e8ddcf4dec8b`.
- `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260828_141326745.log.gz`: 14,853 compressed bytes,
  SHA-256 `9fa7af5c0731399148328c5127ac7f9df0357b13118903682c6ad6bfdd195f32`; 88,365 decompressed
  bytes, SHA-256 `83ae1dc7341c97890618918a42c38b5cc377b0a3eb4cd8aa0b76e5c9a21ad7b2`.

All five Final12 carriers pass gzip integrity and exact decompression size/hash checks. The six
Compendium and ten Slice run-ID PNGs remain in the ignored smoke workspace; their byte sizes and
SHA-256 bindings are retained inside the two reports, matching the established policy of committing
the compressed result/log carriers rather than duplicate screenshots. Edge `151.0.4129.107` / CDP
`1.3` is provenance only and never a baseline, rebaseline or numeric-threshold key.

### Historical Final11 assessor-repair follow-up — immutable failure retained, repaired replay green

The Final11 carriers and hashes below are unchanged. Recovery remains stored `fail`, with one
attempt, zero retries and exactly `activePlayProjection` and `closeCheckpoint` false in its stored
domain assessment. The repaired assessor independently replayed that same immutable
`recoveryBundle` wholly green; it does not rewrite the carrier or retroactively turn Final11 into a
Recovery certificate.

The repaired law permits durable raw to lead rendered UI only while rendered remains at or before
runtime and within the existing 10-second bound, with the exact raw/runtime authority tuple intact.
Close binds the latest exhausted live state/UI time, exact six-key committed/lost hide witness and
committed revision outcome. Controls retain Final11's reported 20 ms render lag and 322 ms live-
close gap, accept the exact close boundary, reject +1 ms, future/excessive lag and each independently
mutated witness field. This is assessor/tests/docs only: product, save, deterministic content,
numeric rulers, version identity and browser point-version policy are unchanged. That repair led to
Final12, whose distinct immutable Slice stop is recorded above.

### Signed `1ca6715…` Final11 campaign — full observation green, then Recovery temporal-oracle stop

Signed clean docs source `1ca67156e27d6bd58a324e33b0e6b752adf568bc` remained unchanged through
Final11. Layout passed 787/787 in 76,403 ms; SceneMemory passed 42/42 in 10,096 ms; Compendium
passed 78/78 in 45,982 ms; Slice passed with zero findings and ten PNGs in 416,073 ms; and Glass
passed all 12 viewports with zero findings or instrument failures in 86,808 ms. Every predecessor
ran once and passed its named verifier.

Recovery `20260828-phase4-final11-1ca67156e27d-recovery` ran once for 1,291,034 ms. It passed
through `boundary-crossed`, including all 15 observation outcomes, 309 samples, Node/browser/active
elapsed times of 1,200,308/1,200,305/1,200,305 ms, the exact next-cycle proof and recovered UI.
The `recovered` domain assessment then failed only `activePlayProjection` and `closeCheckpoint`;
cleanup passed and no retry occurred. Recovered raw/rendered/runtime active play was
1,285,118/1,285,098/1,285,404 ms, a valid 20 ms render lag under the existing 10-second runtime
law. Exhausted raw/state/UI was 79,709/84,738/84,740 ms and closed raw/state was 85,062/85,062 ms
with a 2 ms checkpoint. The old oracle compared close against the stale exhausted raw capture and
reported 5,353 ms instead of binding close to the latest exhausted live runtime, whose gap is only
322 ms. Final11 therefore exposes an instrument temporal-oracle defect, not a product failure. It
is immutable and was not retried; it is not a Recovery certificate.

The current repair is contract-only: it permits bounded UI render lag relative to durable raw under
the existing 10-second runtime law, binds close to the latest exhausted live state/UI time plus the
exact committed/lost hide witness and committed revision outcome, and mutation-tests both
directions. It changes no product, save, deterministic content, numeric ruler, browser authority,
point-version policy, or release identity. A fresh complete chain on the signed clean repair source
is required.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_112951723.json.gz`: 4,783 compressed bytes,
  SHA-256 `aaa5b9a071d4ca905c4dfd924f56edda8a7ed589fdc65dc82902ad1ca3d85d6d`; 106,062 decompressed
  bytes, SHA-256 `700f483c78b5fde4baeace9f4a6ad17fea50c0f92d151d488b1788de484afeae`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_113018245.json.gz`: 24,084 compressed bytes,
  SHA-256 `0555f55055d2958626823bcae92b6f7c32c04185760d2dc8d2b1c2193e55185a`; 305,731 decompressed
  bytes, SHA-256 `e7523ad4c6d0d8405997a848f18700c730c590330d797d152f79e52d36cde709`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_113116959.json.gz`: 541,274 compressed bytes,
  SHA-256 `d78a6fee001583293645de26817be1e0a2241233f377ac558046a379396c9274`; 8,542,263 decompressed
  bytes, SHA-256 `bc47a2d768080cd9d04257d300dcb4d009035d6611792d10f020d0beb179d5c8`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_113825782.json.gz`: 1,919 compressed bytes,
  SHA-256 `af4cda59371aa37b73147ba72cf32556f9a9bb0abc67b0055c2f63d202797b26`; 6,169 decompressed
  bytes, SHA-256 `f374604be62f1f4866c870a4bc3dc9e6b11ad4dcc5944bd515c71c4fae75e31f`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_113825782.log.gz`: 2,913 compressed bytes,
  SHA-256 `149391caeeb494d45a1c21f35f28479415eac8f5c58660388f866d87b791c8a8`; 5,905 decompressed
  bytes, SHA-256 `e0b82ad7cd4d7e443b1fb618694923710f31154d3fdaf48e42d2efa479b447de`.
- `PHASE4_GLASS_CURRENT_INPUT_PASS_20260828_114015380.json.gz`: 74,636 compressed bytes,
  SHA-256 `15a088d8f053fd99c3566372a7d13226587434ee1709c7ca491d929d18423571`; 845,186 decompressed
  bytes, SHA-256 `ab83ca765e58b06f3bc559ccf076b299e2d805049777af61112755d55f01fedc`.
- `ARC4_RECOVERY_CURRENT_INPUT_FAILURE_20260828_120206393.json.gz`: 299,902 compressed bytes,
  SHA-256 `cb44985eb4894e34d518f521df8506c7b4aec452afcc8a2351f52eb5dd9b698a`; 3,807,719
  decompressed bytes, SHA-256 `fa035d12a50a55b7e51ebca9de565c59b0f02d5941d1a19ccd4d5f65ae8febcb`.

All seven Final11 carriers pass gzip integrity and exact decompression checks. Edge
`151.0.4129.107` / CDP `1.3` is provenance only and never a baseline or rebaseline key.

### Signed `4405fb2…` Final10 campaign — five green predecessors, then Recovery offline-reopened status-oracle stop

Signed clean source `4405fb2b4ba7ef6898eb334330d7ef4300b5266c` (tree
`74133f0749a42ffddcaf5e0444a6c21197ad1da3`, parent `a85e0ed…`) remained clean and unchanged
through every completed Final10 stage. Layout `20260828-phase4-final10-4405fb2b4ba7-layout`
passed 787/787 sealed outcomes across ten viewports in 76,517 ms. Source-bound SceneMemory
`20260828-phase4-final10-4405fb2b4ba7-scenemem` passed 42/42 in 10,121 ms. Source-bound
Compendium `20260828-phase4-final10-4405fb2b4ba7-compendium` passed 78/78 in 45,542 ms and
bound all six review PNGs. Slice `20260828-phase4-final10-4405fb2b4ba7-slice` passed with zero
findings/scopes and ten PNG bindings in 414,827 ms. Glass
`20260828-phase4-final10-4405fb2b4ba7-glass` passed all 12 viewports with zero findings or
instrument failures in 86,406 ms. Every green stage ran once and passed its named verifier.

Recovery `20260828-phase4-final10-4405fb2b4ba7-recovery` then ran once and stopped terminal
`instrument-fail` at `offline-reopened` after 110,549 ms. Fixture, the complete 16-attempt
burn-down, exhausted disabled-suppression receipt, close/checkpoint and closed/offline proof all
passed. The active observation, boundary-crossed and recovered stages did not run. Cleanup passed
with browser, browser context, server and workspace lock released; no automatic retry occurred.

The failure evidence retained the correct Pertar route/card, the exhausted 16/16/0 cycle-0 budget,
and all three Tame/Scavenge/Sample controls as model-disabled, natively disabled and aria-disabled.
After the true close and reopen, however, the document was deliberately read-only/ineligible and
truthfully rendered every verb as `unavailable`. The old phase-blind poll reused an active-authority
exhaustion predicate that accepted only `empty` or `depleted`, so it rejected this coherent offline
surface. Its terminal `last:null` records the final unmatched poll; the appended non-null `observed`
receipt preserves the actual same-document UI → state witness. Final10 therefore exposed an
instrument semantic/status-oracle defect, not demonstrated product loss. Because the run stopped
before the later offline raw/state/UI assertion and before the real active-play observation, it makes
no offline durable-parity, Recovery product-layout, 20-minute recovery or recovered-state claim.
Final10 is immutable and was not retried. The bounded successor must distinguish offline/ineligible
`unavailable` from active exhausted `empty`/`depleted`, then restart Layout → SceneMemory →
Compendium → Slice → Glass → Recovery on a newly signed clean source with fresh run IDs.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_085940581.json.gz` preserves Final10 Layout. The
  gzip is 4,841 bytes with SHA-256
  `4329476439bc6bbde11adeeb487e22f1d9a06c5f4b6b0f75642802c720ca9925`; decompressed JSON is
  106,062 bytes with SHA-256
  `2fa05df1d8964a99943f1e235936446d02c6e285e41a73f5cc1432e4b786c638`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_090028728.json.gz` preserves Final10 SceneMemory.
  The gzip is 24,164 bytes with SHA-256
  `99abfc6d0a084ce0ed874cf5516c833d1d73735e4ebb8c44c0d3ce870075a0e3`; decompressed JSON is
  305,657 bytes with SHA-256
  `00161fd6c4d8b5457776dc1768ea2022a142a73c892c8a4cdff207073e88116a`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_090149421.json.gz` preserves Final10 Compendium.
  The gzip is 541,176 bytes with SHA-256
  `c93be41ed90be67236b10a2b57a79e252824b00091be9da55f84604de2ade8cd`; decompressed JSON is
  8,533,320 bytes with SHA-256
  `6ee3aa6f2e4dd50b7e148302486a4381385df92a10828f1b8b63408c66353035`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_091016498.json.gz` preserves Final10 Slice. The gzip
  is 1,970 bytes with SHA-256
  `2c7bbcfc52a8805593be730ff03ebee2c00debf2a8eb82e51fd782bf1d26b12c`; decompressed JSON is
  6,169 bytes with SHA-256
  `ef0dcef3001a8384a080b40696480eaf0d1176da3cd30ec2ff5be9d145fb47c5`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_091016498.log.gz` preserves Final10 Slice stdout/stderr.
  The gzip is 2,967 bytes with SHA-256
  `80b1942ae7777d91f0015fe45c60901d4ca014839043430e7e9971168f09ebcc`; decompressed log is
  5,905 bytes with SHA-256
  `929c4125b322a876a4624080fa90bc78e98bc1d055e41f66bfbc507e524dd501`.
- `PHASE4_GLASS_CURRENT_INPUT_PASS_20260828_091204762.json.gz` preserves Final10 Glass. The
  gzip is 74,755 bytes with SHA-256
  `a17d0e37dc567a08e9847bbf31c102e01f4e90e6859d4870acefbfa382b2d171`; decompressed JSON is
  845,128 bytes with SHA-256
  `ca06571c4efa3425e367edc87a1d652fc5da15eecf5a683af0688eb8c078be51`.
- `ARC4_RECOVERY_CURRENT_INPUT_INSTRUMENT_FAILURE_20260828_091420389.json.gz` preserves the
  immutable Final10 Recovery offline-reopened instrument failure. The gzip is 84,891 bytes with
  SHA-256 `c038e5dc37bbedd230afb954e7b576b85a65970bdafbc0ee158f185b07244358`;
  decompressed JSON is 822,999 bytes with SHA-256
  `9642a7dfad56df1695693ef2f2cafaf0c0fb4628d8401cc8bcdf839f31a429ce`.

All seven gzip carriers pass integrity checks and decompress byte-for-byte to their exact source
report or log. The Compendium and Slice reports retain their PNG manifests and hashes; the PNGs
remain run-bound ignored review evidence rather than additional tracked audit carriers. Edge
`151.0.4129.107` / CDP `1.3` is run provenance only, never a baseline pin or rebaseline trigger.

### Signed `a85e0ed…` Final9 campaign — five green predecessors, then Recovery exhausted-control oracle stop

Signed clean source `a85e0edf9b7ceca0f13ecf32bb8ac3c88db6ceb1` (tree
`7260957697be3574626d42e12de78cb60e143969`, parent `c133c89…`) remained clean and unchanged
through every completed Final9 stage. Layout `20260828-phase4-final9-a85e0edf9b7c-layout` passed
787/787 sealed outcomes across ten viewports in 76,313 ms. Source-bound SceneMemory
`20260828-phase4-final9-a85e0edf9b7c-scenemem` passed 42/42 in 10,202 ms. Source-bound Compendium
`20260828-phase4-final9-a85e0edf9b7c-compendium` passed 78/78 in 46,170 ms and bound all six
review PNGs. Slice `20260828-phase4-final9-a85e0edf9b7c-slice` passed with zero findings/scopes
and ten PNG bindings in 414,850 ms. Glass `20260828-phase4-final9-a85e0edf9b7c-glass` passed all
12 viewports with zero findings or instrument failures in 86,524 ms. Every green stage ran once and
passed its named verifier.

Recovery `20260828-phase4-final9-a85e0edf9b7c-recovery` then ran once and stopped terminal `fail`
at the exhausted stage after 87,589 ms. Fixture and complete 16-attempt burn-down passed. The
reported Tame control was already semantically correct—`disabled:true`,
`data-model-enabled="false"`, 292×44—but its raw rectangle was y=812.1875…856.1875 in a
390×844 viewport. The old collector did not scroll the button into the Survey card's clipped
`overflow:auto` scrollport before testing its centre, collapsed geometry and hit ownership into one
`ok` bit, and did not retain the actual hit owner. The same unchanged source's Glass certificate
independently scrolled this exact class of Tame control to y=470.875…514.875, then proved full
card/viewport containment and stable BUTTON ownership at the same primary-phone viewport. Slice
also passed its real disabled-suppression path after native reveal. Final9 therefore exposed an
instrument/oracle defect; it makes no Recovery product-layout verdict and no recovery claim.

Close/checkpoint, closed/offline proof, reopen, the real 20-minute active observation, boundary
crossing and recovered stages did not run. Cleanup passed with every owned resource released and
zero automatic retries. Final9 remains immutable and was not retried. The bounded successor repair
reveals and settles the exact disabled control, retains complete button/card/viewport/scroll/hit/
document evidence, binds native dispatch to the trusted pointer receipt, restores scroll in
`finally`, and replays instrument integrity separately from product suppression. Because those
collector/contract bytes change, the next signed clean successor must restart Layout →
SceneMemory → Compendium → Slice → Glass → Recovery with fresh run IDs.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_064146278.json.gz` preserves Final9 Layout. The gzip
  is 4,839 bytes with SHA-256
  `e9019f1cfd4339c4713f188d9c4431a360cf98cee953b286793dcc9746333286`; decompressed JSON is
  106,061 bytes with SHA-256
  `7628b2be0db6ce8aca905582bb92d63eae4e688f8d7aaaa597b1417dd904ecf4`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_064212063.json.gz` preserves Final9 SceneMemory.
  The gzip is 24,120 bytes with SHA-256
  `a195d31731899136d699343b736fe6940d2729a50d101caa268d08b3cf063e23`; decompressed JSON is
  305,647 bytes with SHA-256
  `b9734acd5c6614e1c7b6f908aaf1e6a4547efef5f0d9d0451359bd96dbf8a3a4`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_064317311.json.gz` preserves Final9 Compendium. The
  gzip is 542,224 bytes with SHA-256
  `7612cd6e850057c6a7b5eb33154cbe71ede25e54cdb1a3c6a8ebc5714b125f07`; decompressed JSON is
  8,563,298 bytes with SHA-256
  `bd009387b9a3f1430135c2ab264bf9ef32429967c02e0dfdc6da79f414b60441`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_065042577.json.gz` preserves Final9 Slice. The gzip is
  1,969 bytes with SHA-256
  `78881cc94b0102b47f9e2973eb757412250f6142327e317d949aa0cef57864e8`; decompressed JSON is
  6,145 bytes with SHA-256
  `97d0d85894934d042d09ad3b57d84c9c9f5f0531195066764edf330b51c2604a`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_065042577.log.gz` preserves Final9 Slice stdout/stderr.
  The gzip is 2,964 bytes with SHA-256
  `4cb909a1f8a37a3666aa31589a17120e1d627764020980e363f1e7a5dce8f22e`; decompressed log is
  5,904 bytes with SHA-256
  `0fd08de0a6e87fb728203e460d931c17e1bb1d03eb8cfed6d67c615c2963f692`.
- `PHASE4_GLASS_CURRENT_INPUT_PASS_20260828_065238705.json.gz` preserves Final9 Glass. The gzip
  is 74,599 bytes with SHA-256
  `762befbad4232993d174896c7a74a46444f554d244b743cf0dce657dd40f25cd`; decompressed JSON is
  845,103 bytes with SHA-256
  `a3b1b9a85ea280848e926c38e10894ee0a86000916e8aa5c6ecf7f5b2d7a4f52`.
- `ARC4_RECOVERY_CURRENT_INPUT_FAILURE_20260828_065439072.json.gz` preserves the immutable Final9
  Recovery exhausted-stage oracle failure. The gzip is 32,098 bytes with SHA-256
  `f0cde9db25a3a44b6aa2c16d26df8ac4adc1fc05bbef0e9c49744af969c4a887`; decompressed JSON is
  322,076 bytes with SHA-256
  `21d7d4e3e22ee41a06f61f23de490b6aa9b21c686817f7d34203e3caffdfe6b7`.

All seven gzip carriers pass integrity checks and decompress byte-for-byte to their exact source
report or log. The Compendium and Slice reports retain their PNG manifests and hashes; the PNGs
remain run-bound ignored review evidence rather than additional tracked audit carriers. Edge
`151.0.4129.107` / CDP `1.3` is run provenance only, never a baseline pin or rebaseline trigger.

### Signed `c133c89…` Final8 campaign — five green predecessors, then Recovery precondition stop

Signed clean source `c133c89ead736c9c7414af1e6242acd411339853` (tree
`e93b6808e9442e2bbf48ef5aa158d9c0ee8a78af`, parent `53d030b…`) remained clean and unchanged
through every completed Final8 stage. Layout `20260828-phase4-final8-c133c89ead73-layout` passed
787/787 sealed outcomes across ten viewports in 76,318 ms. Source-bound SceneMemory
`20260828-phase4-final8-c133c89ead73-scenemem` passed 42/42 in 10,168 ms. Source-bound Compendium
`20260828-phase4-final8-c133c89ead73-compendium` passed 78/78 in 46,530 ms and bound all six
review PNGs. Slice `20260828-phase4-final8-c133c89ead73-slice` passed with zero findings/scopes
and ten PNG bindings in 415,546 ms. Glass `20260828-phase4-final8-c133c89ead73-glass` passed all
12 viewports with zero findings or instrument failures in 87,045 ms. Every green stage ran once and
passed its named verifier.

Recovery `20260828-phase4-final8-c133c89ead73-recovery` then ran once and stopped terminal `fail`
at its fixture precondition after 7,633 ms. The sole failed clause was `runtimeCaptureOrder`; every
other route, durability, authority, rendered UI, ownership, finite-yield, random-pool and action-idle
clause passed. Burn-down, exhaustion, closure/reopen, the real 20-minute active observation,
boundary crossing and recovered stages did not run. Cleanup passed, with every owned resource
released and zero automatic retries. This immutable report therefore makes no Recovery product
verdict and claims no recovery.

Post-run source review proved the red was an instrument/oracle chronology mismatch. Recovery's old
ready-surface collector sampled outer state first, then its nested UI expression obtained a second,
later state snapshot, while the shared precondition correctly expected canonical UI → state order.
The app's monotonic active-play clock can advance between those calls; equal millisecond values could
also let the reversed collector false-pass. The bounded local repair captures UI then state, emits
a browser-derived document/order/timestamp/runtime witness, classifies malformed receipts as
instrument evidence and preserves a trusted backward runtime as product-red. It does not loosen the
10-second shared chronology/lag contract or change product code. Because the collector and evidence
bytes changed, Final8 is immutable and cannot resume; a newly signed clean successor must restart
Layout → SceneMemory → Compendium → Slice → Glass → Recovery.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_045804245.json.gz` preserves Final8 Layout. The gzip
  is 4,784 bytes with SHA-256
  `cf3611f023f92657e53b632e6760ac866bce449849ec5f5f7b104a128f268001`; decompressed JSON is
  106,061 bytes with SHA-256
  `ae0c486c2b0bebf2047e55ffec131691dc457bc8f67af60b9b48efa57e70f5b8`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_045839643.json.gz` preserves Final8 SceneMemory.
  The gzip is 24,057 bytes with SHA-256
  `a4ac0eeb323cd6558c690d5b1d57d1e5a0a36ec69997db22010e0d520bbef649`; decompressed JSON is
  305,712 bytes with SHA-256
  `5bbac8b3c71a396e0ace5ce04e2124c15695f0af92580cca47d85b3057cb2e2a`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_045959479.json.gz` preserves Final8 Compendium. The
  gzip is 543,085 bytes with SHA-256
  `f7dcc09f8a7ce419488a63e4c446ea384aea167caeb007ea321cc6f128de71ec`; decompressed JSON is
  8,579,794 bytes with SHA-256
  `cfb11b3ba5c735c02c3e4ad0e3a6ba0ed6748a3edbac5157d47e3f9aaad723e8`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_050821691.json.gz` preserves Final8 Slice. The gzip is
  1,922 bytes with SHA-256
  `a3872de9538fb71803384e24c8e4116df912e757eb77051fa67517cad780818e`; decompressed JSON is
  6,145 bytes with SHA-256
  `39fde2d9ec8bc1bcab19bd4f80998e9db87e77d972ac196ce5a3b1a92c5e9f3f`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_050821691.log.gz` preserves Final8 Slice stdout/stderr.
  The gzip is 2,913 bytes with SHA-256
  `39f5e03f7a19449b86499f035d95420b756d55fdd3125b30a27f5e413b046aab`; decompressed log is
  5,904 bytes with SHA-256
  `17413ee4af51df0b4642b8280becd2288ca47844b2dede5dbed826f86ca1d486`.
- `PHASE4_GLASS_CURRENT_INPUT_PASS_20260828_051003109.json.gz` preserves Final8 Glass. The gzip
  is 74,618 bytes with SHA-256
  `efe451efaa707d400f70e6a0e5bbbc808d76fc7d7bd2573f4817494f46f90c75`; decompressed JSON is
  845,064 bytes with SHA-256
  `0ca296cd4820ba0259facd6cfe0c4fa1eaab096cdd3925f759c0e4f2163b0728`.
- `ARC4_RECOVERY_CURRENT_INPUT_FAILURE_20260828_051049287.json.gz` preserves the immutable Final8
  Recovery precondition failure. The gzip is 5,481 bytes with SHA-256
  `8548618e21b0072db322f6f2b79e56ee61934a7c24cf7d98fe9342f02a79523a`; decompressed JSON is
  17,028 bytes with SHA-256
  `986b48734762a20abb78009a3016b337446f06d2ce1ab440c582db391a7c3517`.

All seven gzip carriers pass integrity checks and decompress byte-for-byte to their exact source
report or log. The Compendium and Slice reports retain their PNG manifests and hashes; the PNGs
remain run-bound ignored review evidence rather than additional tracked audit carriers. Edge
`151.0.4129.107` / CDP `1.3` is run provenance only, never a baseline pin or rebaseline trigger.

### Signed `53d030b…` Final7 campaign — four green predecessors, then terminal Glass red

Signed clean source `53d030bb733beca1a68fd8e42358dfa4b10ed0e2` (tree
`19bdbd9774ba2d1aa5c814582bfc04f5f77620dc`, parent `ea845d7…`) remained clean and unchanged
through every completed Final7 stage. Layout `20260827-phase4-final7-53d030bb733b-layout` passed
787/787 sealed outcomes across ten viewports in 76,145 ms. Source-bound SceneMemory
`20260827-phase4-final7-53d030bb733b-scenemem` passed 42/42 in 10,281 ms. Source-bound Compendium
`20260827-phase4-final7-53d030bb733b-compendium` passed 78/78 in 46,094 ms and bound all six review
PNGs. Slice `20260827-phase4-final7-53d030bb733b-slice` passed with zero findings/scopes and ten
PNG bindings in 415,497 ms. Each completed green stage ran once and passed its named verifier.

Glass `20260827-phase4-final7-53d030bb733b-glass` then ran once across 12 viewports for 75,032 ms
and stopped terminal `fail` with 25 findings, zero report-classified instrument failures and zero
automatic retries. Recovery correctly did not run. Post-run review separated one Compendium
heading/workspace product root and two narrow-phone Inventory product defects from two hostile-row
Compendium oracle artifacts and four Settings oracle artifacts. Edge `151.0.4129.107` / CDP `1.3`
is run provenance only.

The bounded local repair lets the Compendium heading share its reserved sticky-Close row, reflows
`<=360px` Inventory copy above left-aligned wrapping badges without hiding any visible identity or
status, and makes each Settings control own stable samples, native hit proof, Close clearance and
exact scroll restoration. These changes alter source and evidence bytes. Final7 is immutable and
cannot resume. Bounded dirty-tree small-phone and phone-landscape diagnostics passed; they are
repair evidence only, not a post-repair full/certifying browser-chain PASS. After browser-free
review, a newly signed clean successor must restart the complete Layout → SceneMemory → Compendium
→ Slice → Glass → recovery chain with fresh IDs.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_031651483.json.gz` preserves Final7 Layout. The gzip
  is 4,782 bytes with SHA-256
  `69db5b56a55b74ba4b3468cb59a2f85576757913cc9114b50da36abe062c6b77`; decompressed JSON is
  106,061 bytes with SHA-256
  `85d5220ebc3e592b21c42a49c03a95d78151b02b3971a4ffc61dc0ae9331b215`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_031719888.json.gz` preserves Final7 SceneMemory. The
  gzip is 24,049 bytes with SHA-256
  `73997c61e60ba655a7314eed8af8bbaa18a527c8d36da7bc96bdef7db8ed8d35`; decompressed JSON is
  305,669 bytes with SHA-256
  `dda4da30da3a9cee3550c4c52f88f1b7ecff61a23507af548fbc863f488558cd`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_031936204.json.gz` preserves Final7 Compendium. The
  gzip is 543,901 bytes with SHA-256
  `adf44f5f06ba386065596d1e2578296bb3db6b633c79c2c1b50d91f88e3716f5`; decompressed JSON is
  8,588,379 bytes with SHA-256
  `617151d1b72529d260520171337e2977adb7e6e89a72fd7fafbac97347e0cb4d`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_032721592.json.gz` preserves Final7 Slice. The gzip is
  1,916 bytes with SHA-256
  `bba4a7f703648e1f1e00796ad8e08e359e809018dc2af162cfa5f88519799b05`; decompressed JSON is
  6,145 bytes with SHA-256
  `2a4921075b1790623d0def563b3042b3b2ce72291f0140b3d1200450f9bfb8bb`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_032721592.log.gz` preserves Final7 Slice stdout/stderr.
  The gzip is 2,912 bytes with SHA-256
  `7627337e23b902a161f1e18466e643c0c6ad6f893385c3346db7ca56d93790d5`; decompressed log is
  5,904 bytes with SHA-256
  `6b8f9c6741d4408dd525ca7436812d9d5cdc21c192cf8c608fa2a5b12d5e5d2a`.
- `PHASE4_GLASS_CURRENT_INPUT_FAILURE_20260828_032908335.json.gz` preserves Final7 Glass. The gzip
  is 77,621 bytes with SHA-256
  `2b5253f05315e3e5b5d59addd509e852ed4006af9eb92ebd7587f1a82ff3fba3`; decompressed JSON is
  884,622 bytes with SHA-256
  `98cfa0536acf3d7b6e79f83303e3f01b0929f4e912de7772aa782a1de398ed6f`.

All six gzip carriers pass integrity checks and decompress byte-for-byte to their exact source
report or log. The Compendium and Slice reports retain their PNG manifests and hashes; the PNGs
remain run-bound ignored review evidence rather than additional tracked audit carriers.

### Signed `ea845d7…` Final6 campaign — three green predecessors, then one causal Slice instrument stop

Signed clean source `ea845d77d9783599c269f708462eb650e2c3e245` (tree
`1d041580e3977555898b9f8efaef9f3db5ab2166`, parent `39e4f20…`) remained byte-stable through
the serial Final6 campaign. Layout `20260827-phase4-final6-ea845d77d978-layout` passed all
787/787 sealed outcomes across ten viewports in 75,826 ms. Source-bound SceneMemory
`20260827-phase4-final6-ea845d77d978-scenemem` passed 42/42 in 10,085 ms. Source-bound
Compendium `20260827-phase4-final6-ea845d77d978-compendium` passed 78/78 in 45,661 ms and
bound its six review PNGs. Every completed stage passed its named verifier, ran once with zero
automatic retries, retained complete cleanup, and used Microsoft Edge `151.0.4129.107` / CDP
`1.3` as per-run provenance only.

Slice `20260827-phase4-final6-ea845d77d978-slice` then ran once for 420,570 ms and stopped
terminal red with five findings in five scopes. Its first/root finding was instrumental: the exact
thermal Inventory row was a valid 164px button, but its raw centre at `y=751` lay below the bounded
panel scrollport. The old collector did not reveal the row, so it correctly skipped the click but
then incorrectly judged the absent modal, Equip, Close and reload outcomes as four additional
product failures. Those four descendants were unexercised cascades, not independent product
verdicts. Static review found the product Inventory lifecycle coherent. Final6 was not retried;
Glass and recovery correctly did not start.

The current browser-free instrument repair uses the row's real `scrollIntoView` path, waits through
animation-frame plus later-task settlement, proves exact scrollport containment and centre hit
ownership, and binds trusted row, Equip and Close receipts to their exact coordinates and owners.
Each dependent surface/action/Close/reload judgment now requires its full green causal prefix;
controls run only from a green base; a red action proves quiescence and cleanup before terminating
mutable successors. No product source or numeric ruler changed. No post-repair browser claim exists:
Final6 cannot resume, and a newly signed clean successor must restart the chain at Layout.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_014710842.json.gz` preserves the Final6 Layout
  report. The gzip is 4,781 bytes with SHA-256
  `52e3d3535a71738fa60e9ae5910aab18d3faf7420f71f09752d8290b6315f1a6`; decompressed JSON is
  106,061 bytes with SHA-256
  `7b1543b848acda57c0fc077996dd837a2b8a54dfe32a552ad8fb4a8a9e413305`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_014750410.json.gz` preserves the Final6
  SceneMemory report. The gzip is 24,029 bytes with SHA-256
  `541184b8affb1a637909644fc7fb88184f00fbfedf8aa60dff25af411696c720`; decompressed JSON is
  305,655 bytes with SHA-256
  `d23ec732491730bfcd718f0ca1ed6d758f83d5142d454ec29601c291965d4ade`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_014927668.json.gz` preserves the Final6
  Compendium report. The gzip is 542,065 bytes with SHA-256
  `8567a36ca0c4d9d28a5dbe4373ae60c29364843b4657a85ee54c71c8593c85fc`; decompressed JSON is
  8,587,851 bytes with SHA-256
  `1416d7cad1512ad4bc251d8870d2ac4681f0aef059887a41f4bcd1ba96aa41aa`.
- `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260828_015651534.json.gz` preserves the Final6 Slice
  report. The gzip is 88,669 bytes with SHA-256
  `cb97ae8d190c77a4f7eec8bf3e1116f4bd7749eed9b7293e356eb8e9e1e3aecc`; decompressed JSON is
  613,747 bytes with SHA-256
  `462e0fd5b4187920a2f247ccb109e67e0f1013a2df124d1c39cbbd109c03985c`.
- `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260828_015651534.log.gz` preserves the paired Slice
  stdout/stderr record. The gzip is 39,378 bytes with SHA-256
  `1597df9b40ea6d036007e2fea2985d06ebddd0f5f506e437cf00aeef719dee5e`; decompressed log is
  254,569 bytes with SHA-256
  `907a99b02b254bd643c252e7c78974576f954519b4dee30c6e17f6dd9baac808`.

### Signed `39e4f20…` Final5 campaign — Layout and SceneMemory green, then Compendium instrument stop

Signed source `39e4f20fb35e47d5a05855f040ad1ae1cd921f75` (tree
`506127c7c3c6694e9b8befe71cc3c06db56b6028`, parent `041d1cf…`) began clean on
`openai/mac` and remained byte-stable through the source-bound stages. Layout report
`20260827-phase4-final5-39e4f20fb35e-layout` passed 787/787 sealed outcomes across all ten
viewports in 76,129 ms. SceneMemory report
`20260827-phase4-final5-39e4f20fb35e-scenemem` passed 42/42 with zero findings in 9,980 ms,
complete browser/server/workspace-lock cleanup and exact clean begin/end source identity. The
associated Layout schema still embeds no Git/source identity, so its carrier is
chronology-associated result provenance rather than a reusable standalone exact-source
predecessor.

Compendium report `20260827-phase4-final5-39e4f20fb35e-compendium` then ran once and stopped
`instrument-fail` after 3,237 ms. It retained zero product outcomes out of 78 expected, one
instrument finding—`phone: stable first open did not prove a mounted cold fixture key`—a partial
non-certifying phone profile, no desktop profile, an empty review packet and zero PNGs. Its last
completed stage was `producer error publication`; it failed at `producer error cold-key proof`.
The report binds complete lifecycle cleanup, exact unchanged clean source at begin/end and the
then-current budget `858c2503ed94770e5cf0595a9e3ad676f87be83806fd58cbf924f1ea2158b8f6`
with matching producer `bf9ad0b6623913bfff5b5e79a8ed9ac7dbe49424b608bc9fee8621e5c4874dcb`.
It emitted no separate stdout log. There was no automatic retry, and Slice, Glass and recovery
correctly did not start. This carrier makes no Compendium product-behavior judgment.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_010734681.json.gz` preserves the Final5 Layout
  report. The gzip is 4,666 bytes with SHA-256
  `25ae18625393a546b655fb63b61acf2ddf05ad0fdc204b9b412aea5fae67bd84`; decompressed JSON is
  106,061 bytes with SHA-256
  `59caff9589373d1ae739013feff9a92859d8ee2d579aca3418550e3d485be78e`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_010821484.json.gz` preserves the Final5
  SceneMemory report. The gzip is 22,290 bytes with SHA-256
  `d7725f545251ffd985c6ab84cb1990289c01041e6ecfe907fef74c42d94d8c97`; decompressed JSON is
  305,566 bytes with SHA-256
  `2fb765c87ca6c85fec9d4a949abb5971e6cb4ee3bea2c44d44e7969fd23c6b33`.
- `COMPENDIUMMEM_CURRENT_INPUT_INSTRUMENT_FAILURE_20260828_010936591.json.gz` preserves the
  Final5 Compendium report. The gzip is 9,117 bytes with SHA-256
  `555fcb6682b6995df23b511f2f675886226306efe9552ddfd4965d76688c34b2`; decompressed JSON is
  106,942 bytes with SHA-256
  `2fa2957d0fd557512ea9cbee1483ba560ac72740d8566332614ca73f406e03be`.

The failed oracle compared cardinalities: it required the eight mounted distinct fixture keys to
outnumber the eight pre-arm cached Planetside keys. Equal counts cannot prove equal membership.
The report's direct evidence already showed that the first errored row's exact visual key was absent
from the pre-arm cached-key set, while publication contained exactly one errored row and one
`jobError`. The bounded repair therefore proves exact set membership rather than `8 > 8`, and its
paired controls reject a cached/wrong key. It changes the current collector authority to
`c13a489d32de9a54807d0a16412d8fbd3063656b3282e28f48d074c58bb3faab`, outcome contract to
`ac7eea3939c32f893620e28fde58a8c12bb21d788d029cb7db60bc2eda216d17`, measurement authority
to `28b06f3cb26cd5570fa7bbe7565c410e30db3dd11bb0960919bb2e34cda5276c`, and live budget-file
SHA-256 to `3e6607420342b878bf3f1bc0be562eed72bcbd5206534eda3c85d3ff1c652ae5`.
Producer authority and every numeric ceiling remain unchanged. Because those evidence bytes now
differ from signed Final5, the next campaign is a newly signed clean Final6 checkpoint and a
complete fresh chain from Layout; Final5 cannot resume. Microsoft Edge `151.0.4129.107` / CDP
`1.3` remains per-run provenance only, not a pin, calibration event or rebaseline trigger.

### Signed `041d1cf…` final4 campaign — four green predecessors, then Glass instrument stop

Signed source `041d1cfdff28c4217d699bdb26eacd5f792f7a80` (tree
`796f3da97bbfe56dc64cde34598e4a59de2b6e0d`, parent `5ddddbf…`) began clean on
`openai/mac` and stayed byte-stable. Every stage ran once with a fresh
`20260827-phase4-final4-041d1cfdff28-*` ID and zero automatic retries. Layout passed 787/787
sealed outcomes and its 10/10 verifier in 76,058 ms; SceneMemory passed 42/42 and its named
verifier in 10,277 ms; Compendium passed 78/78 and its named verifier in 46,414 ms; and Slice
finished terminal PASS with ten screenshots, zero findings/scopes and a passing named verifier in
414,797 ms. Glass then stopped fail-closed after 74,409 ms with terminal `instrument-fail`, 46
findings and five instrument failures across all 12 viewports. It was not retried and recovery
correctly did not start.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260827_234347046.json.gz` preserves run
  `20260827-phase4-final4-041d1cfdff28-layout`. The gzip is 4,781 bytes with SHA-256
  `66bf4a70ef6424db5bae892efd8215e15efc2af72fc77be11e422164ce332c09`; decompressed JSON is
  106,061 bytes with SHA-256
  `da6cfcb8415516527e777bd5b056abe772af7e90765b7d7b261aaadba28e7930`.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260827_234435396.json.gz` preserves run
  `20260827-phase4-final4-041d1cfdff28-scenemem`. The gzip is 23,993 bytes with SHA-256
  `544ebab6c01b59c59c45b44c5e3ead7fbc473262a0573d7f8a485486ce758a85`; decompressed JSON is
  305,575 bytes with SHA-256
  `1350dc76914dbd6b9cb26411896a7e92d2b04e482439b7af2aa3d35650d0f987`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260827_235229369.json.gz` preserves run
  `20260827-phase4-final4-041d1cfdff28-compendium`. The gzip is 538,322 bytes with SHA-256
  `b8ce7e6bcbecaff7ab6f150afc32856d68422b1d90ae250c65782e917552d1ca`; decompressed JSON is
  8,543,685 bytes with SHA-256
  `e7c26d37cc653da74900ca03700b175c3020e8d07a293542a7e9d9dfa9849585`.
- `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_000011550.json.gz` and
  `ARC4_SLICE_CURRENT_INPUT_PASS_20260828_000011550.log.gz` preserve run
  `20260827-phase4-final4-041d1cfdff28-slice`. The report gzip/raw are 1,920 / 6,145 bytes with
  SHA-256 `1440866886518d6ba524c5ff794293e3fbacfcf0db476f89be5cd297f673ba17` /
  `af2eed83289730686b281cfd882eaf5893c54dbb8ff57f823ce3b5ed71db0ed0`; the log gzip/raw are
  2,912 / 5,904 bytes with SHA-256
  `19774e72bc5cb54d324e51206c74d2562e5fb469a4c3b5329bf95bb9705b323b` /
  `d75ca5212a634ef2a4226b1887dee2226fef97b632bc5a147e7828be445a33dd`.
- `PHASE4_GLASS_CURRENT_INPUT_INSTRUMENT_FAILURE_20260828_000226676.json.gz` preserves run
  `20260827-phase4-final4-041d1cfdff28-glass`. The gzip is 102,055 bytes with SHA-256
  `e7bb528cf804bed32d77dab01585d0097094f11f331043448ac3dbf7e612d115`; decompressed JSON is
  1,518,127 bytes with SHA-256
  `9ccf29c2c9c6c3315114d1adf2f886a4b1831c5d3279852669e0271285f0fec5`.

The 46 findings reduce to four stale or incomplete harness assumptions plus two connected product
presentation defects. Twelve `REQUIRED_COPY_EMPTY` rows rejected the valid four-character title
`Mars` because the generic orbital audit demanded five characters. The generic audit displaced the
Survey scroller; the small-phone orbital control then sampled the already-rendered, settled
`Mineral veins` row while it was off-card, without first centring it or proving exact restoration.
The nine `SETTINGS_CREATURE_VOICE_CONTROL` findings comprise four phone rows that inherited
unrelated audit scroll state and five laptop rows caused by the real Close overlap; one additional
laptop `CONTROL_NOT_HITTABLE` finding records the same product defect. The 1280×720 Sound centre
was genuinely owned by the sticky Close target because the panel had lost its reserved Close
gutter. Twelve `SHIPYARD_STATE_TRUTH` rows came from
the independent recipe oracle still calling `earpiece`, `diplobeacon` and `rl-mind` effects
unavailable after their contact/capture-support consumers became live; the four Shipyard control
failures cascade from that stale baseline. Twelve `TEXT_CONTRAST_LOW` rows are genuine: canonical
Exotic `#9A5CFF` measured 2.86:1 against effective bright glass, below 4.5:1.

The bounded repair retains the canonical rarity hue on an opaque `#05070d` reading badge, restores
the proven 58px panel Close gutter / 44px Close translation / cleared heading geometry, restores
every audit-touched scroll owner exactly, waits for the real orbital row before measuring it, proves
live off-card → centred → exact-restored containment, treats nonempty semantic titles as valid, and
refreshes the three source-independent contact-effect oracle rows. Each repair has a positive and
negative control. SceneMemory and Compendium bind only their current source/dist producer records;
numeric rulers and historical samples remain unchanged. Microsoft Edge `151.0.4129.107` / CDP
`1.3` is provenance only, not a version regression or rebaseline trigger. Because the repair changes
source, none of the four green final4 predecessors can certify it: after a new signed clean
checkpoint, the complete chain must restart at Layout with fresh final5 IDs.

### Signed `5ddddbf…` final3 campaign — Layout green, then SceneMemory instrument stop

Signed source `5ddddbfb79ea984d44c86e2107e5e4013f84f1b3` (tree
`fb62bce43ec3ef4230fec8939f54286292503a8d`, parent `b206cf0…`) began clean on
`openai/mac` and stayed byte-stable. Layout run `20260827-phase4-final3-layout` passed its
787/787 sealed outcomes across all ten viewports in 76,133 ms, then its named verifier passed.
SceneMemory run `20260827-phase4-final3-scenemem` ran once, stopped `instrument-fail` after
1,662 ms, retained zero product outcomes and complete browser/server/workspace-lock cleanup, and
was not retried. Compendium, Slice, Glass and recovery correctly did not start.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260827_223504110.json.gz` preserves the Layout result.
  The gzip is 4,655 bytes with SHA-256
  `bff57442cfdb7f85b9f2fc48951e163ecbb46f4ab4c9e86df2e19e706a527a12`; decompressed JSON is
  106,048 bytes with SHA-256
  `49f9ce820481859f529ce7237fd6abaf7987285934a78673467f2cf11cbb0272`. Layout schema v2 still
  lacks Git/source identity, so this is chronology-associated result provenance, not a reusable
  exact-source predecessor.
- `ARC1C_SCENEMEM_CURRENT_INPUT_INSTRUMENT_FAILURE_20260827_223521179.json.gz` preserves the
  SceneMemory JSON report; the instrument emitted no separate stdout log. The gzip is 4,832 bytes
  with SHA-256 `ff83663c498ddf09d661b9523ffe2ede7f23d2258b6829df3edcb72e327ef417`;
  decompressed JSON is 12,463 bytes with SHA-256
  `a2d9da733a0fa6fffc5ddcb62f7d04c75e768f4a7c18d9b89fc30e677d3e7d38`.

The failure happened before either phone or desktop measurement. Twenty-one of the 23 SceneMemory
producer fields matched; only `buildDist` (`46e47365…` tracked versus `6575498b…` observed) and
`gameMain` (`7ff00481…` versus `02b85f74…`) were stale. The same browser-free audit found the
Compendium measurement authority still current while its live producer was stale (`4bdd3e36…`
tracked versus `4b5aa3a3…` observed) because the built index/owner chunk changed. This is producer
binding drift from the intentional final2 repair, not a product, numeric-ruler, deadline, cleanup,
or Edge-version regression. Edge `151.0.4129.107` / CDP `1.3` remains run provenance only.

The bounded repair changes only the two live producer records and adds a source-derived,
browser-free current-authority test with stale-source, stale-build, duplicate-constant and
recomputed-owner mutants. SceneMemory's repaired active budget is
`47d24080df86f1fd207a2d1674eabbf62260b2d2269698ef052691d6a2d8775b`; historical activation
budget `e6c4aeea…`, all calibration samples and every numeric ceiling remain historical and
unchanged. Compendium's repaired active budget is `f0bedb67…3c64`, with live producer
`4b5aa3a3…`; its fixed ruler and samples remain historical and unchanged. Both carriers pass gzip
integrity. This stopped campaign grants no SceneMemory product verdict or later-stage authority.
After the repair is signed clean, the chain must restart at Layout with entirely fresh IDs.

### Signed `b206cf0…` final2 campaign — three green predecessors, then one terminal Slice red

Signed source `b206cf0986cf21747967e72700222ea9fa9d10f0` (tree
`b993f7da15d80ad3892389b7ddaf31cfe96bacae`, parent `7362a0e…`) began clean on
`openai/mac` and stayed byte-stable through the source-bound stages. The serial campaign used fresh
`20260827-phase4-final2-*` IDs, one execution per stage and zero automatic retries. Layout passed
787/787, SceneMemory passed 42/42, and Compendium passed 78/78; all three named verifiers passed.
Slice then stopped terminal-red with six findings across five scopes, so Glass and recovery
correctly did not start. Microsoft Edge `151.0.4129.107` is run provenance only: browser authority
remains compatible Edge family + CDP `1.3` + each gate's capability contract, and a compatible
point update never triggers rebaselining.

- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260827_202017303.json.gz` preserves run
  `20260827-phase4-final2-layout`: 787/787 sealed outcomes across all ten viewports in 76,135 ms.
  The gzip is 4,653 bytes with SHA-256
  `9c870d4393e89d589bf06cf241932faae1dd20b1c06e8b64fb7cf910fc06fe31`; decompressed JSON is
  106,048 bytes with SHA-256
  `66a1a38188b0ccdcb48f9aeea03834e46795a679c8b510372e6686b65c3d1c4b`. Layout report schema v2
  embeds browser/CDP provenance but no Git/source identity, so this is a truthful named result and
  chronology-associated predecessor, not standalone exact-source proof.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260827_202045397.json.gz` preserves run
  `20260827-phase4-final2-scenemem`: 42/42 outcomes in 10,177 ms with exact clean begin/end source
  binding and complete browser/server/workspace-lock cleanup. The gzip is 22,275 bytes with
  SHA-256 `f05b6859acd77bd6780b0b58c637f85b1a6f53fbea17602ec25300bd711d2070`;
  decompressed JSON is 305,569 bytes with SHA-256
  `b9e6e737fbc0a89ca0ecc6d8764a3dd2aca1dde7ded022fde6d800409ac749b9`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260827_202147686.json.gz` preserves run
  `20260827-phase4-final2-compendium`: 78/78 outcomes in 45,728 ms, exact clean begin/end source
  binding, complete report lifecycle, active budget SHA-256 `91b91b53…a012`, matching browser
  authority and matching producer SHA-256 `4bdd3e36…2cb4`. The gzip is 441,302 bytes with SHA-256
  `0ab5536b76a08c85c882f1bc33f819da14dd9a2b356fbda5ec19be6287c48616`;
  decompressed JSON is 8,634,871 bytes with SHA-256
  `fe70ee276ec97e9954d5299b4c00682014caa52296b9c443a255f2bc6bf67dbc`.
- `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_202908578.{json,log}.gz` preserves terminal run
  `20260827-phase4-final2-slice`, executed from `20:22:04.353Z` through `20:29:08.578Z`
  (424,225 ms), with exact clean begin/end source, parent/child exit `1/1`, no source change and no
  automatic retry. The report gzip is 91,012 bytes with SHA-256
  `1578d5e5bd23f87dcfb68daec17d105fad93779c44d70adf4c4bca10c66aa655`; decompressed JSON is
  820,968 bytes with SHA-256
  `d999b6d15c6a123c3b0d2da2ddb783b7312778123a87ffc3ddd0f314b8d7ff57`. The log gzip is
  42,579 bytes with SHA-256
  `d9e815a903038f6c95b56348f1ddf65455e84c5af34879bb121a0803549abd7c`; decompressed log is
  352,256 bytes with SHA-256
  `20bfd7c607d5fbab74d5dfd943cfc660e9f32fc0cd2b030a74fd6bf1d965cffa`.

The six Slice findings reduce to two harness roots. First, the saved-route setup ignored a false
`__smokeStageStoredV4` result while a zoom-triggered persist was still active, reloaded the prior
`Current Field Repair` expedition, and cascaded into two saved-route plus two Atlas verdicts without
ever testing the intended outer-route fixture. Second, Arc 4 required the lease-read counter to stay
equal across `runtime.release()`, although the owned tab-lease release necessarily performs exactly
one repository read; its structured-ledger failure was a cascade. The preserved report independently
proves neither the intended saved-route/Atlas product outcomes, all 30 Arc 4 negative-control
isolations, nor exact browser/server/lock cleanup. It has browser executable/version provenance but
does not retain the predecessor gates' full CDP/UA/capability envelope.

All five carriers pass gzip integrity. The red is never rewritten as green and grants no Slice,
Glass, recovery, HUMAN, hosted, integration, version, release or deployment authority. The bounded
repair joins the one active persist, blocks new writes, atomically clears/stages every direct
primary, backup and absent-primary fixture, and retains exact byte/hash receipts even on rejection.
An executable held-writer control observes the page-owned protected hold under a bounded deadline,
keeps staging pending while a competing persist settles false, and then requires the released
writer's safe exact +1 committed revision plus exact staged bytes before the affected saved-route/
Atlas verdicts. Arc 4 requires the product-exact one-read lease release with missing/
extra-read controls; protected-save targets additionally retain post-boot byte-preservation checks. A newly signed repaired source must restart the
immutable chain at Layout under fresh IDs.

### Three source-bound green carriers plus one Layout result carrier associated with signed `7362a0e…`

Signed documentation boundary `7362a0ea32e90b24e4988c81d566b82e20549e66` (tree
`711573279cbf8debbed7e67847016885e5647527`, parent `4a54c0d…`) is embedded by the standalone and
serial SceneMemory reports and by the serial Compendium report. Their source/build checks stayed
clean and unchanged. The retained campaign chronology also associates the Layout result below with
that sequence, but Layout schema v2 embeds no Git/source identity and its non-commit-tagged run ID
has no separately preserved clean-HEAD/target-blob execution record. Its carrier therefore proves
the named 787/787 run result and verifier only, not standalone exact-source binding. Every stage ran
once with zero automatic retries on Microsoft Edge `151.0.4129.107` / CDP `1.3`. Exact Edge version
remains provenance only; compatible Edge-family point updates never trigger rebaselining,
recalibration or threshold movement.

- `ARC1C_SCENEMEM_ACTIVATION_PASS_20260827_180121090.json.gz` preserves standalone run
  `20260827-phase4-activation-scenemem`: 42/42 outcomes, zero findings, complete browser/server/
  workspace-lock cleanup and 10,159 ms duration. The compressed carrier is 24,078 bytes with
  SHA-256 `3758559b54b2a04d5afdaeb59be0de7642ecf0cd73acb4a0d6402e61ad0ac953`;
  decompressed JSON is 305,652 bytes with SHA-256
  `e0449818a7f5163a1a4428dc58ee1f31eebdf1a2de37a937dae06be67944dcbe`.
- `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260827_180204174.json.gz` preserves serial run
  `20260827-phase4-final-layout`: 787/787 sealed outcomes across all ten viewports and 76,155 ms
  duration. The compressed carrier is 4,767 bytes with SHA-256
  `fe93e9e36cb6f2d4f8d345d315b293c433d3ae74f4fff0110d803c5eab4b31d0`; decompressed JSON is
  106,046 bytes with SHA-256
  `89440ca9461c5466e72db09a255c5cc50ffad37b4b176a4737049e47050262fe`. The report and verifier
  do not independently bind this result to `7362a0e…`; it is retained as chronology-associated
  run provenance only.
- `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260827_180352756.json.gz` preserves serial run
  `20260827-phase4-final-scenemem`: 42/42 outcomes, zero findings, complete cleanup and 10,216 ms
  duration. The compressed carrier is 24,076 bytes with SHA-256
  `5bef9ef38a619882877187f7d240efebd7d0c4fc19df4ca1d76321c2abdabaf8`; decompressed JSON is
  305,700 bytes with SHA-256
  `97fb18592bf4bbd9b79cad17ca3e74392a503f3fbabd2a96935e95aa2c525006`.
- `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260827_180444018.json.gz` preserves serial run
  `20260827-phase4-final-compendium`: 78/78 outcomes, zero findings, complete lifecycle and
  44,852 ms duration under Compendium budget SHA-256 `91b91b53…a012` and producer SHA-256
  `4bdd3e36…2cb4`. The compressed carrier is 543,916 bytes with SHA-256
  `742d7391cdf2f93e1a3f3c3dbd0fdd02864ace56a88d847675b16bd7c74196ae`; decompressed JSON is
  8,655,318 bytes with SHA-256
  `45849b7e53d784c873abd5ddfa5dafdbee72ec8f0b794a32bea3e6f038c2e34f`.

All four carriers pass gzip integrity. The two SceneMemory carriers and Compendium carrier remain
truthful source-bound evidence for `7362a0e…`; the Layout carrier remains a truthful result carrier
without standalone source authority. A later harness-source repair cannot inherit any of them as
predecessors: the final immutable campaign must restart at Layout on one newly signed unchanged
source. They grant no later Slice, Glass, recovery, HUMAN, hosted, integration, version, release or
deployment authority.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_181317782.{json,log}.gz` — seventh Slice red after three green predecessors

Retains serial run `20260827-phase4-final-slice` from the same clean signed source `7362a0e…`.
It ran exactly once from `2026-08-27T18:06:23.569Z` through `18:13:17.782Z` (414,213 ms), ended
parent/child exit `1/1`, retained ten screenshot-manifest rows and reported 12 findings across 11
scopes. There was no automatic retry. Glass and recovery correctly did not start.

The red is diagnostic evidence for stale harness assumptions after earlier product hardening, not
an Edge-version or new product regression. The first finding showed the exact issue: the truthful
55-bullet development bulletin was canonical, populated and honest, but Slice still looked for
`DEVELOPMENT PUBLISHING IS ISOLATED` after the live contract had become
`DEVELOPMENT PUBLISHING STAYS PARKED`. The related findings exposed four more stale or incomplete
oracles: Settings imported raw tint `0.55` correctly restores to the live slider floor `0.82`;
Arc 4 convergence releases runtime/audio before pagehide and therefore needs its own exact release
witness; Training restoration emits the canonical full-address Earth identity rather than legacy
leaf ID `p133`; and rejected Arc 2 bootstrap leaves Inventory lazily unmounted, closed and empty.
The bounded repair updates Slice/Glass and their negative controls without changing product bytes,
numeric rulers, deadlines or browser authority.

Carrier integrity:

- Report gzip: 175,903 bytes, SHA-256
  `10d91ce46c1d36c415ca54e03f8b802d3b9b376d960a30f6627fc6d08d124152`; decompressed JSON:
  1,484,514 bytes, SHA-256
  `dd79ea9b8106713937204ae7b3070bde1bb958695e986861ae6a9aea54ee86ff`.
- Log gzip: 78,360 bytes, SHA-256
  `36f659ae98c5179b6cb4842117c56465555c96d0996a7bbb6bb7bce08beaade7`; decompressed log:
  636,187 bytes, SHA-256
  `4f92fb9236c20b0e2ce9933bde2ad3c55d16268e728a0a66a2b34e267f9c69cf`.

Both carriers pass gzip integrity. This red is never rewritten as green and authorizes no retry,
later browser stage, hosted work, integration, HUMAN claim, version, release or deployment. The
repaired source must be signed clean and restart the full Layout → SceneMemory → Compendium → Slice
→ Glass → uninterrupted recovery chain with fresh IDs.

### `ARC1C_SCENEMEM_REPAIR_CALIBRATION_2026-08-27.md` and three calibration carriers — heap-only activation evidence

Retains three independent clean current-product SceneMemory calibrations from commit
`6c9ad85577bd90d6af883dd7b3f13556d24eb3ad`. Named runs
`20260827-phase4-repair-candidate1`, `20260827-phase4-repair-candidate2` and
`20260827-phase4-repair-candidate3` each ran once with zero automatic retries, completed 42/42
calibration outcomes, kept source/build/producer authority stable, used unique browser targets and
documents, and released browser/server/workspace-lock ownership. Their deterministic carriers are:

- `ARC1C_SCENEMEM_REPAIR_CALIBRATION_CANDIDATE1_20260827.json.gz`: 22,278 compressed bytes,
  SHA-256 `bd91cbbfba7daf7fd283f2f1d523a34ca0aed1b46a8d5acb6030889b80df75d1`; 305,457
  decompressed bytes, SHA-256
  `d447a5c76bcfbc1e9df87c51f0c35bc6e960c70f6afb31f8bdcf54765efcb39b`.
- `ARC1C_SCENEMEM_REPAIR_CALIBRATION_CANDIDATE2_20260827.json.gz`: 22,268 compressed bytes,
  SHA-256 `6f7d0a17cc60fda9c8c07d0e41d9206c1ea7d2c63233c0cc3494e03ecfb67a14`; 305,452
  decompressed bytes, SHA-256
  `e6ec574ddd5f475158d78bdd960dbd11541e16502b6a6bfce69a5484b34ba7da`.
- `ARC1C_SCENEMEM_REPAIR_CALIBRATION_CANDIDATE3_20260827.json.gz`: 22,214 compressed bytes,
  SHA-256 `6015b3620aadf55b3abdb807cdc19bb97b85b37e21b3f3d8ba2e6a1ddd59fc82`; 305,301
  decompressed bytes, SHA-256
  `52d54330efc5ca07ded8645fb1b33e029ed7da11cc18ae892c38e0a0e7ce08f7`.

All three pass gzip integrity and deterministic `gzip -9 -n` reproduction. Independent raw-point
recomputation found maxima of 11,566,152 V8 / 17,681,258 aggregate heap bytes on phone and
11,630,936 / 17,636,682 on desktop. The activation therefore changes only the two heap fields per
profile to 12 MiB / 18 MiB, with 951,976–1,237,686 bytes of strict headroom; every other ruler is
unchanged. The exact metrics, source/producer/build/browser bindings, headroom, paired-red replay,
boundary controls and claim limits are recorded in
`ARC1C_SCENEMEM_REPAIR_CALIBRATION_2026-08-27.md`.

All candidates used Microsoft Edge `151.0.4129.107` / CDP `1.3`. The exact build is provenance
only: the reusable authority remains compatible Edge-family + CDP/capability/profile contracts,
so routine Edge point updates never require this calibration to be repeated. These carriers are
calibration-only and grant no exact-budget certificate, later campaign, HUMAN, hosted, integration,
release, version or deployment authority.

### `ARC1C_SCENEMEM_CURRENT_INPUT_FAILURE_20260827_163818607.json.gz` — fixed-growth heap/hidden-panel SceneMemory red

Retains named run `20260827-phase4-successor-scenemem` from clean signed source
`862a75b316142348636abea442dab15e87393642` on branch `openai/mac`. The source and
working-tree digests remained unchanged. Full named Layout had already passed 787/787 across all
ten viewports on that exact source. SceneMemory then ran exactly once with zero automatic retries
on Microsoft Edge `151.0.4129.107`, revision
`@419e77616b4ed7d0a544b85cb53ccd5b74d5f135`, JavaScript `15.1.23.12` and CDP `1.3`.
Exact Edge build is run provenance, not a version pin or rebaseline trigger. The collector ran
`2026-08-27T16:38:18.607Z`–`16:38:28.871Z` (10,264 ms), retained complete
browser/server/workspace-lock cleanup, and stopped the serial campaign before Compendium, Slice,
Glass or recovery.

The report passed 40/42 outcomes. All answerability, warm-range/slope, resource ownership,
registry, same-document and cleanup outcomes were green. Only the phone and desktop
`heap-dom-budget` outcomes failed. Phone maxima were 11,580,536 V8 heap bytes, 17,758,550 aggregate
heap bytes, 898 nodes and 90 JavaScript listeners; desktop maxima were 11,635,116,
17,687,678, 895 and 89 respectively. The original contract collapsed those independent counters
to the generic `heap or DOM ceiling was exceeded`; replay through the repaired evaluator now names
every exact field, observed value and ceiling.

Static ownership and one deliberately non-certifying dirty diagnostic separated two causes. The
avoidable shell cost was fixed: production Inventory now retains state while closed without
retaining its hidden row tree or dormant subscriptions, and panel openers share one delegated
focus-capture owner rather than one closure per opener. The diagnostic reduced measured maxima to
676/673 nodes and 71/70 listeners, below the unchanged 704/80 ceilings, while warm range, slope and
all other resource outcomes stayed green. The remaining constant heap delta belongs to the much
larger synchronously loaded Arc 2–5/F4 product graph (the generated main bundle grew by about
527 KB), not to a lifecycle leak or Edge `.107`. It therefore requires one evidence-backed
product-growth calibration from three independent clean current-product candidates; routine Edge
point updates alone never move a ceiling. This preserved clean predecessor is the paired broken
baseline: after any heap-only activation it must still fail on its unchanged node/listener excess.

Carrier integrity:

- Deterministic `gzip -9 -n`: 22,315 bytes, SHA-256
  `dc6c149341323912f410bd32498cf4eec3128b5f13f2bbad16ba3a72f495cb47`.
- Decompressed JSON: 305,891 bytes, SHA-256
  `3197ca65a1011bf386067d73515a0bcefd17ab91752a2d9d36af5e5dd055dfd7`.

The carrier passes gzip integrity. It grants no SceneMemory, Compendium, Slice, Glass, recovery,
HUMAN, hosted, integration, release, version or deployment authority. The dirty diagnostic is
diagnosis only and is not a calibration candidate or certificate.

### `ARC1C_SCENEMEM_CURRENT_INPUT_FAILURE_20260827_132723548.json.gz` — protected-veteran fixture SceneMemory red

Retains named run `20260827-phase4-final-scenemem` from clean signed source
`bb5dc7c7f4372f712778af67ace2b5f81b71b99d` on branch `openai/mac`. The source and
working-tree digests remained unchanged. It ran exactly once with zero automatic retries on
Microsoft Edge `151.0.4129.107`, revision `@419e77616b4ed7d0a544b85cb53ccd5b74d5f135`,
JavaScript `15.1.23.12` and CDP `1.3`; exact Edge build is run provenance, not a version pin or
rebaseline trigger. The collector ran `2026-08-27T13:27:23.548Z`–`13:27:56.729Z`
(33,181 ms), retained complete browser/server/workspace-lock cleanup, and stopped during the phone
profile before desktop measurement, contract evaluation or a verdict. The PASS-only named verifier
exited `1` as required for this terminal `fail`; no later campaign stage or retry followed it.

The phone document stayed answerable, but Shipyard preview settlement never became eligible during
577 observations inside the unchanged 30-second allowance; the old collector reduced every failed
predicate clause to `last:null`. This is a settlement timeout, but it is not a performance/deadline
defect, a reason to extend the unchanged 30-second allowance, or an Edge-version defect. The immutable
`veteran_rich` baseline includes orphan legacy Mine facts for leaf seed `201` but no source-proved
full address for that world. Arc 3 correctly enters `legacy-refused` /
`legacy-seed-missing` protection rather than inventing an address. SceneMemory owns the older Arc 1C
read-only preview/resource contract, not loaded Arc 3 authority. The red exposed a product coupling
defect: protection should suppress authority-dependent Engineering details/actions, but the
independently capability-derived ship preview must remain. The bounded repair must keep this exact
protected baseline, separate that preview from Arc 3 state and retain field-level settlement
diagnoses. Glass's distinct both-cleared fixture continues to serve its intentional full-Engineering
coverage; it must not replace SceneMemory's input or broaden its PASS predicate. The repair must not
loosen the deadline, change the numeric ruler, or repin Edge.

Carrier integrity:

- Deterministic `gzip -9 -n`: 6,855 bytes, SHA-256
  `9204f183785947bce7518c925e23c0a846c29213884ff60a3c7d08e3a503dbb3`.
- Decompressed JSON: 22,302 bytes, SHA-256
  `452d076d8562d80986ac914cae580f3e0357c786a41391544b6c4cc523323b46`.

The carrier passes gzip integrity. SceneMemory produced no log or screenshot files to preserve.
This red grants no SceneMemory, Compendium, Slice, Glass, recovery, HUMAN, hosted, integration,
release, version or deployment authority; a new signed clean successor and a fresh no-retry serial
campaign are required.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_085237038.{json,log}.gz` — sixth exact-input Slice red

Retains run `20260827085237038-27561-1f8e3c1771b7` from clean signed source
`1e0141be418ca20a37dd82f1115c00b1a005e090` (tree
`9360ec502dba9d6a588b365cf2a8b9b6de513514`, parent
`9ce7ddde01201177dff1cacafc06c8424c4098cb`) on branch `openai/mac`. The commit has a good
ED25519 SSH signature for `79046704+TheDakk@users.noreply.github.com`, fingerprint
`SHA256:zEMVsGerZMaUimBJbJwXWrpvRqRitWTIlJZ8NBG8qgk`. The report binds an empty status SHA-256,
clean-tree digest `f0af1e1d…758a`, `sourceChange:false`, Microsoft Edge
`151.0.4129.107` executable/version provenance, and exactly zero automatic retries. This Slice
carrier does not retain protocol version, browser revision, JavaScript version or user agent.
Edge 151 is run provenance, not a browser baseline, pin, threshold change or rebaseline requirement.

The one attempt ran `2026-08-27T08:52:37.038Z`–`08:59:14.139Z` (397,101 ms), reached the
terminal D-TRAIN audit, and ended parent/child exit `1/1` with no signal or spawn error. It records
23 findings across 16 scopes. They reduce to four instrument-contract roots plus one Training
scope-restoration root: the valid 55-row development bulletin met every semantic and authority
check but Slice still expected 54; a rejected wrong-ordinal fixture advanced the legitimate
`persistence.ecology.observedActivePlayMs` diagnostic by 1; contextless Tame-audio checks wrongly
required the mute policy bit to remain true even though settings may synchronously unmute a still
blocked, zero-context runtime; and the epoch probe wrongly expected private candidate time to
publish before its real persistence commit. A Training negative control then rebuilt Survey after
bypassing its document guard without rebinding the lesson to the new action nodes. The resulting
early Land cascaded through the remaining drill and made the terminal transaction a valid Skip,
not the intended Finish. Full Finish therefore remains unproved on this input.

The run outcome-clears the committed native Tame, exact result and one-start voice owner,
accessible counterpart, close/reopen/expiry lifecycle, Arc 5 compact upgrade/aligned fixed point,
and Arc 4 publication-convergence assessment and its controls. It also stored and reloaded ecology
epoch 1 after keeping published epoch 0 before commit. These individually green outcomes are not
a terminal Slice PASS. Because the overall run was red,
`arc4SuccessEvidence.required:false`, `ok:null`, `ledger:null`, zero ledger lines and zero Arc 4
PASS markers were emitted. Glass and recovery therefore remained blocked and were not run.

Carrier integrity:

- JSON gzip: 246,615 bytes, SHA-256
  `80228b85524544d968ec7f288a73492e390526f0adfb41ed086a2e806dce225e`; decompressed
  2,193,285 bytes, SHA-256
  `17063c6b0978956a889ce926307bf5d021a3d330a4e4053f196540e14e260555`.
- Log gzip: 108,363 bytes, SHA-256
  `0446d2804248509c14772b5631ac065fed26c1e8b14565c430d911b923a8634b`; decompressed
  918,043 bytes, SHA-256
  `a87c5741d409e69797bf024ccdd39f8e94719b7c9efbca6ff4460433ca43ef54`.

Both carriers pass gzip integrity, and the report's declared raw-log size/hash match the
decompressed log. Ten ignored run-bound PNGs existed at audit time and matched the report manifest
for codex, Earth, galaxy, Guide, phone, Settings, Sol, Sol marker, Training and universe. Only the
manifest is preserved here; the pixel bytes are not. This evidence grants no durable visual,
Glass, recovery, HUMAN, hosted, integration, release, version or deployment authority. The bounded
repair is local and must receive a new signed clean candidate plus one new no-retry Slice; this red
is never rewritten as green.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_041238239.{json,log}.gz` — Tame-greeting observation Slice red

Retains clean, stable signed-source run `20260827041238239-16243-cbf9ca66283b` at
`9ce7ddde01201177dff1cacafc06c8424c4098cb` on branch `openai/mac` and Edge
`151.0.4129.107`. It ran exactly once with zero automatic retries and ended terminal red with
parent/child exit `1` after 141,336 ms
(`2026-08-27T04:12:38.239Z`–`04:14:59.575Z`). Its only finding and scope are the first independent
root, not a cascade: `harness: Arc 4 exact committed Tame greeting voice did not reach its browser
outcome within 10000ms (last null)`. The retained `last null` contains no terminal observation and
identifies none of the predicate's individual clauses, so the outer `harness` scope is not a
product/instrument disposition. The immediately preceding silent-gesture-arm observation did pass.
The straight-line collector therefore outcome-clears the prior Deep Scanners/Fabrication,
Survey/Search/remnant, native Skim, four-action Engineering reload, Mineral/Survey-to-rail,
storage/stale/publication convergence and Arc 5 v1-to-compact-v2 upgrade/fixed-point stages. The
post-start audio lifecycle and the later exact nine-stage/14-burn Arc 4 ledger were not reached.

Static source analysis—not a retained browser disposition—identifies a product cross-counter defect:
the global F3 durable `result.revision` is compared with the independent Arc 4/5 ownership
`OwnershipStateV2.revision`, so the current owner is expected to reject this first Pertar successor
as `ownership-stale` even though the two counters legitimately differ. The harness also has an
independent diagnostic flaw: its success predicate requires the transient active voice and creature
emitter to be observed simultaneously, so it can miss an otherwise correct short voice, then
collapses every failed clause to `null`. A repair and rerun must preserve the terminal observation,
separate durable voice-start evidence from transient-active evidence, and compare the ownership
state only with an explicit ownership revision; this carrier does not claim those repairs have
landed or passed.

The JSON gzip SHA-256 is
`fafac2c12d5223b9488588bdceb7f1524d826cfbc1109d9677df0d324b28810e`; its decompressed SHA-256 is
`b777b6a5fc4a9188053006743aeae8a7ab43fc81a7415915d7a7a1f1f6c79f8e`. The log gzip SHA-256 is
`b4a62c25d6603576d07631453e5962eb0cf5f7a08a8087f8eae2ecbc1862cbb4`; its decompressed SHA-256 is
`99af93e2e9478033be9ba15f7233bd19512a810a1783ff71f4cce80298f26938`. The JSON binds seven
run-specific 1280×800 PNG manifest rows whose byte counts and hashes matched the ignored files at
audit time, but those PNG bytes are not preserved. Arc 4 evidence is explicitly non-required with
zero ledger lines and zero PASS markers. This carrier therefore supplies no durable visual, Slice,
Glass, recovery, HUMAN, hosted or release evidence.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_032748771.{json,log}.gz` — remnant-oracle and post-reload lifecycle Slice red

Retains clean, stable signed-source run `20260827032748771-8092-d2a0130882c1` at
`bd6b06baa2511c859a4bc227b1a8736b2097fc9d` on Edge `151.0.4129.107`. It ran exactly once with
zero automatic retries and ended terminal red with parent/child exit `1` after 119,502 ms
(`2026-08-27T03:27:48.771Z`–`03:29:48.273Z`). The six finding scopes reduce to two independent
harness roots. First, stale Mars-source expectations plus an obsolete five-key rendered-scene
receipt rejected the valid Search/remnant correction and current receipt; findings 2–3 cascaded
and Skim was deliberately skipped. Product Search and the remnant route were correct. Second,
after reload Slice reopened and retained Survey, then attempted Engineering without yielding the
card. The product correctly hid the right rail while the card owned the silhouette; finding 4 is
that lifecycle defect, while the absent storage input and still-armed/stale-authority findings 5–6
cascade from it. Deep Scanners, fixed Fabrication and the repaired close/reopen lifecycle are
outcome-cleared. Skim settlement and every later Slice stage remain unproved.

The JSON gzip SHA-256 is
`c34bd6fa26f417d664291c206facc8cfe604123166986553a1638570bd652ac2`; its decompressed SHA-256 is
`e75d57e9dc6205e4ffbb8876a6f5d881a34f4edabc88610f943da71cc6b2a5fd`. The log gzip SHA-256 is
`e9d642acda78cc232ca97b02dc9ff4345dae0a11c67c8b864f27dc0e56526672`; its decompressed SHA-256 is
`504060415fab5800acc110b5833956aa0acac0cdfe43f3617b99432584d9c05e`. The JSON binds seven
run-specific 1280×800 PNG manifest rows and hashes, but their ignored bytes are not preserved.
Arc 4 evidence is explicitly non-required with zero ledger lines and zero PASS markers. This
carrier therefore supplies no durable visual, Glass, recovery, HUMAN, hosted or release evidence.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_025804458.{json,log}.gz` — retained-card lifecycle Slice red

Retains clean signed-source run `20260827025804458-2742-c0c871ee52b6` at
`8a23e2243d83aca6a14430882e3570dd4fcfb8a8` on Edge `151.0.4129.107`. It ran exactly once with
zero automatic retries, kept source stable, and ended terminal red after 93,582 ms
(`2026-08-27T02:58:04.458Z`–`02:59:38.040Z`) with three findings. All three are one instrument
cascade: Slice reopened and retained the Survey card, then attempted to open Engineering before
yielding it. Intentional product CSS `body.card-open #railrgt {display:none}` therefore gave
`railshipyard` a zero rectangle; the visible-rail check, native Engineering-open check, and
six-second Deep Scanners outcome wait failed in sequence. The valid card-context repair from the
preceding red is outcome-cleared. The product behaved correctly; Deep Scanners and every later
Slice stage did not run, so this report is neither a verdict on those outcomes nor a Slice PASS.

The JSON gzip SHA-256 is
`71e70d485a4707b553b66332f743e2594ce0a7d66bad6ed2a5dd777f56b170c5`; its decompressed SHA-256 is
`59dd8f6877ebfb7167e15a21f9fd28282f2ceed205fa2693ee6d860d7a806731`. The log gzip SHA-256 is
`818b550e19403afcab5ebdd97d04a2e8b614b080be9a1ed7a3f604b63b63cc04`; its decompressed SHA-256 is
`cb77de6eb910fd0580f50962b641d06202be0d3f6b8761a2fb0f88e1eaa23662`. The JSON names and hashes
seven run-bound PNGs from the earlier completed surfaces, but their ignored bytes are not preserved;
the manifest is provenance only and supplies no durable visual, Glass, recovery, HUMAN, hosted, or
release evidence.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827.{json,log}.gz` — changed-source one-finding Slice red

Retains clean signed-source run `20260827000034983-98202-869d966f2f88` at
`9d4b2b01a7f89ae15b7c7b175867993af649e9f1` on Edge `151.0.4129.107`. It executed once with zero
retries, kept source stable and ended terminal red after 92,566 ms with only the Arc 3 harness finding. The JSON gzip
SHA-256 is `42a1b3caa0a0b5a8b1d1932d3d87c1137ec63d6c05c5af3d80bf6ec0318ffaac`; its decompressed
SHA-256 is `e23fcac2931755bb12c46e90f9bd3c0ae2dac0292484dc9b9003bc5d158ecbe9`. The log gzip SHA-256 is
`9388d14422bf5998b0c90527d644f19e1af3f6e37ee489cf1e30c965268b8ce7`; its decompressed SHA-256
is `ca0b2b40fdab8b933f95f75553d4942e7576961b6285c226d80d4f46cba6b0a7`. Settings and retained-
Survey focus are outcome-cleared relative to the earlier red. The remaining failure is instrument
evidence for an impossible card-context oracle, not a product verdict or Slice PASS. Its tool-only
repair is local and unrerun.

### `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260826.{json,log}.gz` — original three-finding Slice red

Retains clean signed-source run `20260826214541492-83064-b252b137f7a3` at
`8553bd78a2b097dcf65c71f4d47f6815af8ee8c8` on Edge `151.0.4129.107`. It executed once with zero
retries and ended terminal red after 92,772 ms with two instrument false reds—Settings' stale
14-control inventory and an unreachable Arc 3 target—plus the retained-Survey focus product
regression. The JSON gzip SHA-256 is
`8c2e6cd06cbebfab9cb7122303f3ef8d89ace065e5175e1b02713a6316fc90f8`; its decompressed SHA-256 is
`afb2b3c20f555c29afe3c32b3948512bcd95c83793ff3aef68c880bf979c5f11`. The log gzip SHA-256 is
`1a659612b294017f59b05a9613878a3287a1ecea9fc3076ae966298791c10822`; its decompressed SHA-256 is
`b1b245c837001f6f9817757cb178974bec626ec3e57ad3532445616f8b81d17f`.

The five earlier JSON reports retain run-bound screenshot manifests and hashes. The PNG bytes themselves remain
ignored under `port/v2/apps/game/smoke/` and are not preserved by these carriers; none of these entries
claims durable visual evidence, current-input Glass, the real recovery certificate, or a Slice PASS.

### `ARC4_RECOVERY_REALTIME_INSTRUMENT_FAILURE_20260826.json.gz` — first real-time recovery instrument red

Retains clean committed-source run `20260826024124548-13172-6286d5212e` at
`35a22b130a65f936769dfcfe88b150f44b4295d9` on Edge `151.0.4129.107`. It executed once with zero
automatic retries, kept the exact clean source tuple stable, completed its lifecycle and released
the browser, server, browser context and workspace lock. After fixture and 16-step burn-down passed,
the `exhausted` stage was the exact first and only failure:
`exhausted Pertar surface timed out; last=null`; active observation, boundary crossing and recovery
therefore did not run. The then-current poll required all three exhausted rows to say `depleted`,
while the valid product surface was Tame `empty` plus Scavenge/Sample `depleted`, all disabled. The
repaired collector accepts only that bounded `empty|depleted` family with at least one depleted row.
The gzip SHA-256 is `1dba5bba9c88a8dac085af2c3021cd2da869b9a617f350c62d07a2bba4974d11`;
its decompressed SHA-256 is `a153a339e12ef36654a3c5b11786cfb5576aa66cb434b056a06b01753cf6b4af`.
Overall status remains `instrument-fail`; this artifact contains no `recoveryClaimed` field and does
not claim a recovery PASS or certificate.

### `PR33_BATTERY_FAILURE_DIAGNOSIS_2026-08-23.md` — four-run diagnosis and bounded repair

Classifies all four consumed PR #33 battery failures, binds the exact fourth-run Linux SceneMemory
artifact, and records the fixed one-second answerability SLA plus SceneMemory-before-Compendium
fail-fast order. It preserves the original 40/42 red verdict and no-retry boundary; it does not
claim a hosted pass, Ready transition, merge, release, or deployment.

### `PR33_LINUX_SCENEMEM_REPORT_32618995487.json.gz` — retained raw hosted report

Deterministic gzip of the complete 299,811-byte SceneMemory report from artifact `9488319243` in
run `32618995487`. Compressed SHA-256 is
`20db9d1671f9324f469fdd3305085b49f7fc44d871d0ddbedf9f6031c25b4b5f`; decompressed SHA-256 is
`c59908636e8addd72da019f372089216ad231bb862b718f75f266f6b25347856`. The focused budget test
requires its original exact 40/42 result, then replays the same immutable measurements under the
fixed product SLA and negative-controls every changed boundary and retained liveness fact.

### `PR33_SCENEMEM_CROSS_HOST_SLA_CERTIFICATION_20260823.json.gz` — current-budget local certificate

Deterministic gzip of the clean one-attempt 42/42 certificate at repair commit `7d8dc380…`, active
budget SHA-256 `5c8a6e75…`, and exact Edge `.101` authority. Compressed SHA-256 is
`7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a`; decompressed SHA-256 is
`d16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960`. Its named verifier passed
immediately after collection. It is local exact-budget authority, not hosted terminal-green status.

### `ARC1_CLAUDE_REVIEW_2026-08-22.md` — Anthropic/Claude Arc 1 read-only review

The full-Arc adversarial review of PR #33 head `8b2c423b` against base `d4ab7e67…`, requested by the
`openai/mac` handoff. Records the exact review authority, what was independently recomputed here
(evidence hashes, all 21 producer inputs, raw↔derived agreement inside the certification report),
one MEDIUM instrument-hardening finding and three LOW items — each with file/line, why the existing
suites miss it, the smallest correction, and its required negative control. It claims no hosted CI,
HUMAN judgment, Gate closure, or release authority.

### `PR32_LINUX_MEMORY_EVIDENCE_2026-08-21.md` — exact-head cross-host ruler evidence

GitHub Actions run `32441023665` reached a complete 78-outcome Compendium report on exact Edge
151.0.4129.86: 75 passed, while three macOS-derived numeric ceilings rejected Linux-native PNG
encoding and embedder-heap variance. The note preserves the report/artifact hashes, exact
authorities, raw failing values, stable resource state, paired-baseline discrimination, and the
three-field budget-only repair. It is instrument portability evidence, not a product leak, retry,
merge, HUMAN review, or Gate closure.

### `PR32_LINUX_MEMORY_REPORT_32441023665.json.gz` — retained raw hosted report

Deterministic gzip of the complete 10,466,459-byte report from artifact `9433081460`. Compressed
SHA-256 is `a3b67e70881b725266a0fb669f027b51141967a4ff2193e011ed3b1d124a0916`; decompressed SHA-256 is
`a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36`. The focused budget test
verifies its authorities, original ordered 75/3 result, repaired production-evaluator replay, and
three isolated just-below controls.

### `v2-program-review-2026-08-14/` — PR #23 roadmap and HD-audio direction review

Two Markdown review inputs supplied after the complete v2 program roadmap was proposed: Claude's R1–R9
roadmap critique and the approved distant-ecology/companion-expression audio addendum. Both original
files are preserved byte-for-byte with SHA-256 values in the bundle README. Their accepted changes
are integrated into the operational roadmap and audio/gate/decision references; the originals remain
review/direction evidence rather than a claim that planned features are live.

### `round-7-v1.8.2/` — round 7, audited build `a9a13c7` (v1.8.2 "Steady Hands")

The strongest round the project has had. **Start with `v1.8.2-fix-list.md`** — 25 findings, each
with line numbers, the measurement behind it, and a recommended fix.

| Path | What it is |
|---|---|
| `v1.8.2-fix-list.md` | The report. The lead item, CF1802-01, is the mobile training wall |
| `evidence/dock_*.png` | Training step 5 with the dock outlined and per-button reachability labelled — phone vs the desktop control |
| `evidence/burial_*.png` | Step 7 across four viewports: the Compendium button buried under the survey card |
| `evidence/tr_*_step7/8/9.png` | The training walk at the steps that break |
| `data/training-reachability.txt` | CF1802-01's full per-step, per-viewport table + mechanism |
| `data/tutreach.json` | Raw surface-level reachability measurements |
| `data/fleet-1000-sessions.jsonl.gz` | 1,000 sessions · 10 personas · 21 device profiles |
| `data/fleet-summary.json` | The same, rolled up |
| `data/voice-model-200k.txt` | 200,000-genome run of the voice model, extracted verbatim from the build |
| `data/audio-lifecycle.txt` | Web Audio node instrumentation: the bed vs close / hidden tab / sound-off |
| `data/boot-ab.txt` | Paired cold boot vs v1.7.20, idle host, 8 reps, + payload table |
| `harness/*.mjs` | Their harness. Independent of ours, and it found things ours could not |
| `prior-rounds/*.md` | The v1.7.15 / .18 / .19 / .20 fix lists, for the series |

**Our response:** `../REVIEWER_NOTES_v1.8.4.md`.
**What we shipped from it:** v1.8.4 — 23 of 25 fixed. See the ROADMAP handoff.

### `battery-v1.8.2/` — the four-lens full battery on the same build

Ran before round 7. Returned **Conditional Gold, ~94%** with two P1s and two P2s, all fixed in
v1.8.3/v1.8.4.

- `reports/` — the summary plus four review lenses (technical/security · training/UI/Momentum ·
  creature/audio/fun · performance/release readiness)
- `raw-results/` — battery, boot comparison, exploits, odds, training overlay, UI matrix, source metrics
- `static-checks/` — their static analysis logs
- `source-notes/` — the reviewer notes we gave them for that round

**Our response:** `../REVIEWER_NOTES_v1.8.2.md` (corrected after they caught us overstating
"zero added payload").

### `round-8-v1.8.5/` — round 8, audited build `e20d62c` (v1.8.5 "First Touch")

**Start with `v1.8.5-review.md`.** Organised as a path to 10/10 rather than a bug list: §1 the
obstacles · §2 the archetypes · §3 the path · §4 the pattern. 7 new CF1805 findings, plus a residue
table on the round-7 partials.

The harness was **rebuilt** for this round, and that is the story of the bundle: 18 archetypes (was
10) and — the part that mattered — **12 goal-directed verbs** (`mine · harvest · scavenge · tame ·
conquer · craft · breed · feed · charter · sheet · idle · backout`) driven off the game's own
`data-act`/`data-craft`/`data-chacc` hooks, replacing eight generic actions that all poked the same
map. That is why five previous rounds never reached mid-game. Half the deep sessions boot from a
seeded veteran save built with the build's **own** `makeGenome`.

| Path | What it is |
|---|---|
| `v1.8.5-review.md` | The report |
| `evidence/tr_ipad-mini_step8.png` | CF1805-01 — the Compendium up, the training card gone |
| `evidence/tr_ipad-mini_step5/6/7/9.png` | The surrounding steps, for context |
| `data/fleet-rollup.txt` | 214 sessions: health, per-archetype reach, **saw vs did** |
| `data/training-reachability-v185.txt` | 6 viewports × 17 surfaces, every training step |
| `data/fleet-214-sessions.jsonl.gz` | Raw session records |
| `data/fleet-plan.json` · `veteran-save.json` | The seeded plan (re-runnable) + the mid-game save |
| `harness/*.mjs` | The rebuilt instrument, incl. `tutreach8.mjs` (found both P0s) |
| `prior-rounds/*.md` | v1.7.15 → v1.8.2 fix lists |

**`saw` vs `did` is the metric to carry forward.** "The affordance existed when we looked" vs "the
verb completed and the world changed" — a system nobody can find is as broken as one that errors,
and nothing in our own battery measures it. Their §2.4 finding: once an affordance is on screen the
game does the thing (100% for six verbs, 85%+ for four more). The barrier is entirely `nocard` —
the land-first chain fails about nine times out of ten. That is the mid-game reachability problem,
measured for the first time.

**Our response:** `../REVIEWER_NOTES_v1.8.6.md`.
**What we shipped from it:** v1.8.6 "Kept Promises" — 10 of the 12 fixes are player-visible.
CF1805-05 (harvest) is open **by decision** and the notes explain why it is not closable offline.

### `battery-v1.8.5/` — the independent full battery on the same build

Arrived separately the same day, and agrees with round 8 on almost nothing — which is what made the
pair useful. Its P0 is the **conquest odds cache**, which round 8 did not find at all: the memo key
named four of the ten inputs that move the result, so the meter could display 0% when the true
matchup had become 100%. Reproductions A and B are in the report. Both bundles independently found
the live `fed`/`brood` overshoot.

- `Celestial_Frontier_v1.8.5_Full_Battery_Audit.md` — the report (verdict, 14-point Gold checklist)
- `Celestial_Frontier_v1.8.5_Review_1..4_*.md` — the four analytical lenses

### `round-9-v1.8.6/` — round 9, audited build `0bfc904` (v1.8.6 "Kept Promises")

**Start with `v1.8.6-review.md`.** The most useful review this project has received, and the
method is why: **a 152-line delta reviewed hunk by hunk**, not another fleet run. Six of seven
round-8 findings closed, and one line we had shipped found to be **corrupting live saves**.

| Path | What it is |
|---|---|
| `v1.8.6-review.md` | The report |
| `data/size-drift-simulation.txt` | CF1806-01 — 500 lineages through the build's own `crossGenome`, showing ~10% drift past size 5 |
| `data/dock-clearance-measurement.txt` | CF1806-02 — forced-state dock reachability across four phone viewports |
| `data/voice-vocabulary-200k.txt` | The audio arc closed: 533 → 199,707 distinct voices |
| `data/training-reachability-v186.txt` | 6 viewports × every training step |
| `data/fleet-180-sessions.jsonl.gz` · `fleet-rollup.txt` | 180 sessions, rage quits down a second build |
| `evidence/v185_card_buried_BEFORE.png` | The CF1805-01 burial, for the before/after |
| `harness/*.mjs` | Their instrument, incl. `sizedrift.mjs` and `dockclear.mjs` |

**Why this round matters more than its size suggests.** The `size` corruption only manifests
*across a reload boundary*, so no volume of sessions would have found it — and our own 787-check
browser gate could not see it either. It took someone reading two lines of a diff and asking what
they did to each other. **Delta review and fleet review find disjoint defect classes.**

Round 9 also **retracted its own round-8 headline**: it had attributed the step-8 training wall to
CF1805-01, and reports that the card went 0% → 100% reachable while the stall rate did not move
(25% → 27%). Step 8 is recorded as *unmeasured*, not defective. Second consecutive round in which
they withdrew a finding of their own before publishing.

**Our response:** `../REVIEWER_NOTES_v1.8.7.md`.
**What we shipped from it:** v1.8.7 "True to Form" — a regression fix, plus CF1806-02/03/04 and
both §2.5 smalls.

### `battery-v1.8.6/` — the independent Gold audit on the same build

Arrived the same evening, separately, as in round 8.

## Two things worth carrying forward

**Their method beat ours twice.** They verify by *reachability* — does the code exist **and** can it
take effect at runtime — which caught `CF1720-07`: a rule we had shipped, tested and declared fixed
that was permanently dead because a blanket selector out-specified it. And they measure UI defects
by **clickability per viewport**, which is what found the P0 our whole battery missed.

**They retract.** Round 7 withdrew "a creature speaks only once per session" before publishing,
having traced it to their own probe clicking at (0,0) inside a collapsed shelf; and they reported
`tutorialCompleted: 0/498` as a harness limit rather than a regression after checking it against six
rounds of their own history. Findings from a source that does that are worth more.

## Reproducing a negative control against an old build

`tools/uilayout.js` takes `--url=FILE`, so a new gate can be replayed against the build a bug was
found in, to prove the gate actually catches it. Recover an old build from git rather than storing
one here:

```bash
# use an absolute Windows-style path — `/tmp/...` in Git Bash is NOT what node resolves
git show 66e0516~2:celestial-frontier.html > C:/Temp/v1.8.2.html
node tools/uilayout.js --vp=iphone,iphone-max,android --url="file:///C:/Temp/v1.8.2.html"
```

(`66e0516~2` is the commit before v1.8.4's two doc commits, i.e. the last v1.8.2-era build.
Verified: that file still contains `body.training:not(.vista) #panel{z-index:58}` and no `tutpri`.)

Against v1.8.2 that reproduces CF1802-01 on all three phone viewports — which is the only reason to
trust the gate.
