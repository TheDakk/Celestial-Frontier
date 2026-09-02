# PR #35 local Glass stop — POSIX cleanup identity and Inventory instrument repair

Date: **2026-09-02**
Status: **immutable clean-source instrument red preserved; final reviewed dirty-source stop-to-end sweep green; no clean-source successor certificate or hosted authority**

## Exact stopping boundary

Exact SSH-signed source `05690215771db91601cf9dbcbcaa8d771fe540b5`
(tree `00ee47169a3929dfbe952842419641a3f69699aa`, parent
`18c088de4388edf58eda2c192b71cb94156e26e7`) passed the complete browser-free
`develop` profile at **263/263 files, 2,719 passed / 1 skipped**. Exact Compendium
`20260902033229765-66224-f9f0a7aa7a` passed **78/78**. Exact develop Slice
`20260902033353481-66577-7b2bc768c3cc` passed with zero findings; its report SHA-256
is `5a9a64e86385c27c85cd6f5b01bbcd140d94f59c8b5df203e632060c65e3e35d` and raw-log
SHA-256 is `c54f93683e4a6596317b54b32171a57032054908ca16e1bebf4a353aac877962`.

Full-certifying Glass `20260902034025002-67201-c5ef56b312e9` consumed that exact
Slice predecessor on the same unchanged clean source. It stopped terminal
`instrument-fail`, exit 2, after **64,720 ms** with exactly one instrument failure:

`tablet-portrait: owned browser cleanup failed (kill EPERM)`

There were **zero product findings**, zero blocked controls and zero retries. The first six
viewports—small-phone, compact-phone, primary-phone, large-phone, phone-landscape and
tablet-portrait—completed their product work green. All six reload rows passed. The report
retains **18/18 observed Arc 4 outcomes green** from those six viewports and **101/104**
negative controls. Only `settings-close-gutter-clearance`,
`hidden-panel-opener-focus-fallback` and `ultra-same-backing-resize` were omitted because
the terminal cleanup stop prevented later viewports. Tablet-landscape, laptop-720p, desktop,
desktop-1080p, ultrawide and desktop-8k never ran in that certificate.

Source start/end remained exact and clean. Browser provenance was Edge
`152.0.4191.53`, V8 `15.2.23.6`, CDP `1.3`, revision
`@4ee8983fdce2559a0ae8f8376934c5ed353035cd`. Named verification correctly rejected the
red report. There is no later stage in the `develop` chain, and no retry occurred.

The raw report is 457,053 bytes with SHA-256
`6ec30cb1ef2622c94ad68d90b2c7326bc3970b8a7b28ffeca6d45c669029bee9`.
Its deterministic `gzip -n -9` carrier is 41,796 bytes with SHA-256
`8da792931c36e4f8ee47796b24b5f40217131a9e3422253eef78d4e760f5c24d`.

## Cause and bounded launcher repair

The former POSIX launcher detached Edge as the process-group leader. After
`Browser.close`, cleanup probed the numeric group with `kill(-pgid, 0)`, treated `EPERM`
as “alive”, and then attempted TERM/KILL against that numeric group. The exact EPERM does not
retain enough kernel identity to prove which process held the number, but it proves the launcher
could no longer safely establish ownership. Rapid PGID reuse is the strongest diagnosis. The
same launcher and exact Edge build previously passed full 12-viewport Glass, reinforcing that
this was host/process churn rather than a product regression. More importantly, the old design
could signal an unrelated group if the number were reused by a signalable process.

The bounded POSIX repair launches a detached Node sentinel as the durable group leader and launches
the browser non-detached inside that group. The sentinel remains alive while Chromium exits, holds
TERM itself while relaying TERM to its owned group, announces its exact final PGID to the parent,
waits for the matching acknowledgement, and finishes with one group SIGKILL barrier. A watchdog
performs the same final barrier if the acknowledgement is lost. The parent no longer probes or
signals a released numeric PGID.

The owner also fail-closes duplicate, missing or wrong PID/PGID messages; browser exit before
endpoint/socket/command completion; stderr forwarding failure; shutdown protocol errors; missing
final identity; non-SIGKILL final exit; and a lost final acknowledgement without the watchdog
barrier. Controls prove a TERM-resistant descendant is killed, an unrelated sibling survives,
owned profiles are removed, and no operation occurs after ownership release. Windows taskkill
ownership is unchanged. No game source, gameplay behavior, product ruler, threshold, retry rule or
browser point-version policy changed.

Audit-time `browsercdp.mjs` SHA-256 is
`52603369b57807e5e0360f3fe7c6d01c7c76c3de23c28ddb246b4fb0053e4626`.
Compendium measurement authority is
`37616a0b1c1c57b86747b976ba351f1c8c37c5aa2f6cb7bf6b387b9c4f68e340`;
only its `browserCdp` input changed. Producer authority remains
`308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77`.

## Stop-first downstream sweep

After the launcher repair, targeted diagnostics reran the exact stopping viewport and every
previously unrun downstream viewport individually:

| Viewport | Run | Result | Duration |
|---|---|---:|---:|
| tablet-portrait | `20260902042158260-74767-0c405e9e44aa` | PASS | 14,235 ms |
| tablet-landscape | `20260902042231099-74920-8f55f5537263` | PASS | 13,877 ms |
| laptop-720p | `20260902042254019-75059-f6dadbcabb19` | PASS | 13,352 ms |
| desktop | `20260902042315281-75182-6b61dad63778` | PASS | 14,261 ms |
| desktop-1080p | `20260902042339374-75332-291aeb16b3e2` | PASS | 12,919 ms |
| ultrawide | `20260902042400949-75460-10a493183d65` | PASS | 13,256 ms |
| desktop-8k | `20260902042421777-75595-c20ca09fd77b` | immutable false-product FAIL | 10,798 ms |

The first six reports contain zero findings, zero instrument failures and zero retries. The 8K
report classified one `INVENTORY_ACTION_NO_OPTIMISM` finding, but its retained evidence proves the
product contract was green. At 8K the Inventory card began at `scrollTop: 0`; the old offscreen
control required a positive saved scroll offset, failed to move the button, and dispatched its
supposed negative-control click into the real Equip action. The later intended product click then
found the action already pending. The report's real receipt retains `baseline.ok: true`, unchanged
revision/runtime bindings/DOM rows, both actions disabled while pending, all binding/DOM/identity
mutants red, and every mutation restored. The harness incorrectly folded its failed setup into the
product outcome.

The Inventory instrument repair separates pre-action instrument validity, real product
prerequisites and publication mutation controls. A zero-scroll 8K row is moved offscreen through an
important inline transform; the negative probe must dispatch no input and retain no receipt; scroll
and the exact prior inline style are restored in `finally`; and any setup/restoration defect becomes
an instrument failure before the product outcome is classified.

The first repaired 8K PASS `20260902042854555-76853-add9939c6c92` was superseded while its
non-vacuity proof was strengthened. Two subsequent reports correctly stayed instrument-red with
zero product findings:

- `20260902043246864-77282-80eea89c9f25`: the offscreen transform was not yet proven through its
  exact applied-property witness, and exact style restoration remained false.
- `20260902043357227-77607-db7e2467ce4f`: the important transform and no-input probe were proven,
  while null-versus-empty inline-style restoration still remained falsely unequal.

Final 8K diagnostic `20260902043450417-77849-27a8e6436564` passed in **13,521 ms** with its
reload row, **93** applicable controls, zero findings, zero instrument failures and zero retries.
Its raw report is 83,864 bytes, SHA-256
`fa6bbd8d91ac4b85998bbc45a356e0358d9d0df6f6d49773430c1d765c270630`; deterministic
gzip is 10,106 bytes, SHA-256
`8414e61d238b9bb890059a45637ed90abf19b8bd05de41ce49e5cc350d487860`.

Final tablet-portrait diagnostic `20260902043550755-78132-41546314f115` rechecked the original
stopping viewport after the final Glass changes. It passed in **13,123 ms** with its reload row,
**96** applicable controls, zero findings, zero instrument failures and zero retries. Its raw
report is 83,842 bytes, SHA-256
`0afdd560726192a6537d7c43158f715d10dc5ca0cdf3833afb46c2f6ebeb43f7`; deterministic
gzip is 10,140 bytes, SHA-256
`018e43bdc2d1e42dc10527dd0c38ef690fca2dcb073e7926a4e1ec33be59939e`.

Optional targeted small-phone run `20260902043513123-77991-b5fb69d10815` stopped
instrument-only with zero findings after its reload passed. A one-viewport run had no eligible
visible-trail/non-fallback portrait baseline, so the campaign-wide portrait control could not run
exactly once. This is a targeted-mode cross-viewport limitation, not a product finding and not part
of the requested downstream sweep. Small-phone had already completed green inside the original
multi-viewport run. The final full certificate must still exercise the complete portrait campaign.

Every targeted report is explicitly `targeted-diagnostic` on a dirty source. These reports prove
the stopping viewport, downstream viewport behavior and instrument repairs locally; they do not
replace one final clean-source, predecessor-bound 12-viewport Glass certificate.

## Preserved report carriers

All 14 raw reports are preserved as deterministic `gzip -n -9` carriers (**176,011 bytes total**):

| Carrier suffix / run | Gzip bytes | Gzip SHA-256 |
|---|---:|---|
| `POSIX_CLEANUP_INSTRUMENT_RED_20260902_0569021` | 41,796 | `8da792931c36e4f8ee47796b24b5f40217131a9e3422253eef78d4e760f5c24d` |
| `20260902042158260-74767-0c405e9e44aa` | 10,154 | `49155935ec920407cc8fd2e118977db8d248fc57cb0e149eef6f5e4c372219f4` |
| `20260902042231099-74920-8f55f5537263` | 10,155 | `2f8deb380b3ae8bd835dbff74918e0d0a330ac1626082f8968d22c1d900e1279` |
| `20260902042254019-75059-f6dadbcabb19` | 10,128 | `dd749ac439e187310c6e48aa9570dab9e7eb36808994d09bd15cb8be8308b1c9` |
| `20260902042315281-75182-6b61dad63778` | 10,156 | `0d8b1ddf54fc63e479e09429acd0debfe50c5f71b292f2509c7f5ea804bd523d` |
| `20260902042339374-75332-291aeb16b3e2` | 10,125 | `1e8adae455f58cd0eeced2638d4095f0ae9385a1f0305d0ff26662601702eb78` |
| `20260902042400949-75460-10a493183d65` | 10,141 | `1d33fb8b30112db8b97612ff0649197c1752316865b982da663009700de32eb4` |
| `20260902042421777-75595-c20ca09fd77b` | 11,316 | `2ac26bd777bcad61eea57b971b0e26b5669167934688f7a212777b720cfdce4f` |
| `20260902042854555-76853-add9939c6c92` | 10,108 | `660d990b5e3a0f1012096399604e022706e2742b0a299e78132ddab3cc286e2f` |
| `20260902043246864-77282-80eea89c9f25` | 10,699 | `f0bbe355f77db31bb7a2bb234230390bccf416815f7a762272851fac6d5547e8` |
| `20260902043357227-77607-db7e2467ce4f` | 10,739 | `7f480f90e994340ca71eac5e561120a9a6d3f393e72a58704cfe31e10d6730a4` |
| `20260902043450417-77849-27a8e6436564` | 10,106 | `8414e61d238b9bb890059a45637ed90abf19b8bd05de41ce49e5cc350d487860` |
| `20260902043513123-77991-b5fb69d10815` | 10,248 | `88542abf7d7c10114dbc217cebc742bab4626b7cd56a74afe4c7e8d93c0aabff` |
| `20260902043550755-78132-41546314f115` | 10,140 | `018e43bdc2d1e42dc10527dd0c38ef690fca2dcb073e7926a4e1ec33be59939e` |

The clean red uses
`ARC4_GLASS_PR35_POSIX_CLEANUP_INSTRUMENT_RED_20260902_0569021.json.gz`.
Each targeted carrier uses
`ARC4_GLASS_PR35_TARGETED_DIAGNOSTIC_<exact-run-id>.json.gz`. The semantic names avoid
misrepresenting dirty diagnostics as certificates.

## Leaked profile handling

The failed clean-source run left the generated Edge profile at the exact literal path:

`/private/var/folders/0t/t0n1rpg946v17b0dc3drx2rr0000gn/T/cf-glassmatrix-67201-d99907d7d9967867`

At audit time it was mode `0700` and occupied **353,404 KiB** (about 345 MiB). It is generated
cleanup residue, not evidence to commit. After the immutable report carrier and this audit were
recorded, an out-of-sandbox process-list check found no browser using that exact
`--user-data-dir` (only the inspection command itself matched). The exact literal directory was
then removed and its absence verified. Removal is non-recoverable but discarded only regenerable
temporary test-profile data.

## Authority boundary

The original `0569021…` Glass result remains immutable red. The targeted reports remain dirty,
non-certifying diagnostics. A fresh SSH-signed clean successor must pass tracked-input preflight
and one unchanged-source, no-retry, named-verified Compendium → Slice → full Glass chain. No push,
PR mutation, hosted attempt, merge, release, version bump, publication or deployment is authorized
by this audit.

## Final-review supersession and identical-source stop-to-end proof

The earlier 14 carriers above remain immutable intermediate evidence; none is relabelled. A final
independent review then found two remaining instrument-only gaps before clean certification:

1. the Inventory refusal control could still reach the native activation helper unless dispatch
   was explicitly forbidden, so refusal now uses `dispatch:false`, arms no trusted-receipt listener
   and must retain zero input and zero receipt; and
2. browser exit classification needed explicit lifecycle phases. A `Browser.close` request accepts
   only clean code `0` with null signal; POSIX owned shutdown accepts clean or exact TERM/KILL;
   crash/nonzero exits remain red. The parent performs no negative-PGID probe or signal at all.
   Windows external exit is accepted only after the exact bounded taskkill request succeeds.

The final launcher selftest includes a real abnormal-SIGABRT POSIX group fixture and an injected
Windows taskkill integration fixture. Independent reviews of both the launcher and Glass changes
are CLEAR. Focused verification passes **3 files / 74 tests**, all three TypeScript programs and
diff hygiene.

The stop-first browser campaign then caught two short local reds before any long chain or hosted
attempt:

| Viewport | Run | Instrument diagnosis | Product input/findings |
|---|---|---|---:|
| tablet-portrait | `20260902052600888-85161-dd14bc6726f4` | nested restoration interpolation emitted invalid page source (`missing ) after argument list`) | 0 / 0 |
| desktop-8k | `20260902052945783-86025-0f4247ee8571` | Chromium retained `style=""` after the first removal when exact prior state was an absent style attribute | 0 / 0 |

The first defect is now closed by one source builder whose unit test parses and executes the exact
generated browser expression, restores the retained exact owner and deletes its temporary owner
reference. The second is closed by retaining transform/value/priority evidence before a narrowly
owned final attribute normalization. `null` and `""` remain distinct; a browser-faithful control
requires two removals only for the originally absent case and zero for the originally empty case.

After both fixes, all seven requested viewports ran once each on identical dirty-source digest
`23884a5d5050bc79642d25ac4700e58b269e0deee2d61464c37143550815c027` and Edge
`152.0.4191.53` / CDP `1.3`. Every row passed with one green reload, zero findings, zero instrument
failures and zero automatic retries:

| Viewport | Run | Duration | Applicable controls |
|---|---|---:|---:|
| tablet-portrait | `20260902053159926-86747-9a6ec544ca9f` | 13,216 ms | 96 |
| tablet-landscape | `20260902053214646-86864-a72ce4d83aef` | 13,402 ms | 92 |
| laptop-720p | `20260902053229583-86982-528e2a6690f0` | 12,536 ms | 93 |
| desktop | `20260902053243665-86740-fd3ed6b519f9` | 13,320 ms | 92 |
| desktop-1080p | `20260902053339974-87246-c7e46a84c35d` | 13,034 ms | 92 |
| ultrawide | `20260902053354610-87392-74be39e3fc8d` | 12,952 ms | 92 |
| desktop-8k | `20260902053409007-87239-adca4be4b296` | 13,286 ms | 93 |

Current `browsercdp.mjs` SHA-256 is
`8c6094e4e4bc05c40ace80478b038890e2e8c33856e5932a60805ac71249e0df`.
Compendium measurement authority is
`a963f40135651323bb2c0f2a0a6fa7a381ab3905e43b6e5721f45e9f38e50e62`;
producer authority remains
`308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77`.
The fixed ruler, every ceiling and sample, the 78-outcome inventory and the version-tolerant
Edge-family/CDP `1.3` policy are unchanged.

### Final-review carriers

The two new reds and seven final passes add **92,529 bytes** across nine deterministic carriers;
all **23** carriers in this audit total **268,540 bytes**. Each carrier decodes byte-identically to
its raw report.

| Run | Raw bytes / SHA-256 | Gzip bytes / SHA-256 |
|---|---|---|
| `20260902052600888-85161-dd14bc6726f4` | 86,107 / `68338b0dd2a60bdea6d09e7d6b1295233f85c085d321c24928a073593c30e65e` | 10,836 / `43132728b99824f95648438063c54bc41c0b030b35aff40e159ae6d9e69548f8` |
| `20260902052945783-86025-0f4247ee8571` | 86,375 / `47fad8765cd76ce720afa1cce93b688122093c6b9395117d17c600e1d987adc0` | 10,869 / `53299ce95d3f1ed824643b8a823906321c5b7e31bb5e17290a8fea9212e3e4a2` |
| `20260902053159926-86747-9a6ec544ca9f` | 83,788 / `a1eacd53bd9abe1d86f0b8ca9d6673d8e5a1ea033a2c8ef72a3558b227b993ab` | 10,155 / `9fd772d2aba2793731a714e0cfa85d04d748455235d52fb33cde514923d8cb4d` |
| `20260902053214646-86864-a72ce4d83aef` | 83,802 / `a1ffa773d88de8be78746f24906a011d24f6f4e192017736fc6857863719f2b7` | 10,104 / `ce3be3a203a71ea9ba33dd454b647c0e75668ab727c5ea21af5a3cd595678535` |
| `20260902053229583-86982-528e2a6690f0` | 83,898 / `a7d12aa61e767fe45212064af9d860064fce902eb35ae1644e9cd8cf82c6c5dc` | 10,129 / `d28a004a00984d6650bb4c87acb7203e23c0ef88ce89e93e8a155040335c24e5` |
| `20260902053243665-86740-fd3ed6b519f9` | 83,775 / `9672d3caaa036fcd366e4dd93679c7cee4081d2ca0ab2df68fe230a75febc5c5` | 10,132 / `23c3ba6c3dd7cf4328fa1ab88a78788e8eba9b43a971a64c24d3bfcc5bdafd9f` |
| `20260902053339974-87246-c7e46a84c35d` | 83,832 / `b48a5999cf7ce6f539d20307fd3c8870ac9b336421d5daf4c45a3c010c576d95` | 10,084 / `2a16c8a0932e77cd3cfe56e7d3699b8541f774cccd3adeb01762b03c1014739e` |
| `20260902053354610-87392-74be39e3fc8d` | 83,865 / `5c3fdf388b70d3114d1f931e0631e01f545c0276e4bac8ad367d9d6ff4e5bdbd` | 10,132 / `69a115ceb0398e1fdc9d8e20830b6d7235c65db00394a9702a7e905007ab3a43` |
| `20260902053409007-87239-adca4be4b296` | 83,912 / `2057aa6e0cd40d6fde8dc5c5466ff0646d7f096ffda4c995f07ef99ec1fd2698` | 10,088 / `5523bdd6e486c015ce83c571bfaab3be795b120a36a53a14ad8d6362c1fadb7d` |

The final seven reports remain non-certifying targeted diagnostics. They prove the original stop
and every downstream viewport before the longer work begins; they do not replace the pending clean
signed candidate, tracked-input preflight or single unchanged-source Compendium → Slice → Glass
certificate. They create no GitHub, merge, release or deployment authority.

## Finished dirty-source browser-free closure

After the final targeted sweep, the unchanged finished dirty source passed
`node tools/check-profile.mjs --profile=develop` at **264/264 files, 2,728 passed / 1 skipped**,
all three TypeScript programs, **34** art sources with zero findings, **1,014/1,014** routes and
**454** declared fields with zero inert fields. Root `node tools/validate.js` also passed syntax,
CSS balance, duplicate-id, render and determinism checks; all **1,010** species rendered cleanly
and the **50-probe** fingerprint remained byte-identical to the v1.0 baseline. The authority
printer reports current Compendium measurement/producer budgets and remains red only for the
intentionally stale, production-only SceneMemory source/build inputs. None of these local results
authorizes a GitHub write or substitutes for the pending clean signed certificate chain.
