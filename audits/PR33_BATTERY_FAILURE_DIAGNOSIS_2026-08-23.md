# PR #33 battery failure diagnosis — 2026-08-23

This is the retained diagnosis for the four consumed PR #33 `test-battery` attempts. It preserves
the exact fourth-run SceneMemory evidence and the bounded local repair. It does **not** relabel a red
run green, authorize another hosted attempt, mark PR #33 Ready, merge, release, or deploy.

## Chronic-failure classification

| Run | Terminal cause | Classification |
|---|---|---|
| `32609389977` | D-ART-36 recognized only the old `execSync` build spelling and rejected the real unconditional `execFileSync` build. | Static ruler false positive. |
| `32611053651` | The active Compendium budget described the pre-Arc-1 producer and the guarded workflow still installed Edge `.86`. | Correct fail-closed stale authority, amplified by duplicated browser configuration. |
| `32614177932` | The Compendium collector observed readiness, performed its own required render turn, then sampled two newly remounted 0×0 placeholders. | Collector settlement race exposed by hosted timing. |
| `32618995487` | Every SceneMemory target completed and advanced the Pixi ticker, but the Mac-selected 250 ms target ceiling rejected Linux rendered-frame latency. | Cross-host budget/ruler defect, not a product leak, hang, or 2-second timeout. |

No run established an Arc 1 product defect. Each red remains consumed and truthful; none may be
retried or called terminal-green retroactively.

## Exact fourth-run evidence

- Workflow run: `32618995487`, attempt 1; authorized head
  `bd3e65bfd99b91e556ff27b5dd028fe92f447227` against base
  `d4ab7e671959ab80198bed22bb600a26fc3524cc`.
- Report source: clean committed synthetic merge
  `715a74a276b5f8f8bcde115bbd15844e4efbac30`.
- Edge authority: `Edg/151.0.4129.101`, revision
  `@cc1d9f4080fd9140611a9600b8d1615db310105d`, JS `15.1.23.9`, CDP `1.3`.
- Original budget SHA-256:
  `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`.
- GitHub artifact `v2-scene-memory-evidence`: ID `9488319243`; GitHub ZIP digest
  `39697f623d793e9eb42f99eb78a4f63c93de618bf82d86b651d3a097d33f2493`.
- Retained deterministic gzip:
  `PR33_LINUX_SCENEMEM_REPORT_32618995487.json.gz`, SHA-256
  `20db9d1671f9324f469fdd3305085b49f7fc44d871d0ddbedf9f6031c25b4b5f`.
- Decompressed 299,811-byte report SHA-256:
  `c59908636e8addd72da019f372089216ad231bb862b718f75f266f6b25347856`.
- Lifecycle completed in 152,863 ms; browser/server/workspace-lock cleanup all passed;
  `fatalEvents` is exactly empty.

The report has exactly 42 outcomes: 40 pass and only `phone/answerability` plus
`desktop/answerability` fail. All twelve judged targets say `ok:true`, retain the same document,
advance the ticker exactly once, and complete below the unchanged 2,000 ms transport deadline.
Phone targets are 618.722–647.218 ms; desktop targets are 493.473–506.892 ms. Every independent
browser-process heartbeat is below 6 ms. All heap, DOM, ownership, cache, route, Shipyard, HD-tier,
pending-work, and BFCache outcomes pass.

The matching local Mac evidence uses the same canonical Edge, collector, contract, product, build,
fixture, and budget authority but records target turns below 11 ms. The authority does not include
OS, CPU, GPU/software-rendering mode, or scheduler cadence, so the sampled 250 ms Mac ceiling was
not portable to the Linux runner.

## Bounded repair

The collector and contract remain byte-identical. The repair changes only the two active
`targetElapsedMsMax` values from 250 to a strict 1,000 ms and keeps the 100 ms independent-heartbeat
ceiling. One second is a fixed player-answerability SLA, not hosted-observation-plus-headroom; the
separate collector transport deadline stays 2,000 ms. Active budget SHA-256 is
`5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501`.

The focused budget test now:

- hashes and replays the original hosted report under its original 250 ms budget as exact 40/42 red;
- replays the same immutable profiles under the active budget as exact 42/42 green, with only the
  two answerability outcome objects changing;
- binds all twelve target/heartbeat values and re-derives every profile metric from raw points;
- makes all twelve 999.999 ms targets pass and all twelve exact-1,000/1,000.001 ms targets fail the
  exact two-outcome inventory while the other 40 outcomes remain byte-identical; and
- keeps target-failure, stale-ticker, changed-document, heartbeat-failure/non-independence, and a
  non-answerability memory fault red.

The old local 250 ms certificate remains historical and bound to its original budget SHA. It is not
rewritten or promoted. A fresh clean current-budget certificate is required before this repair is
called locally certified.

## Fail-fast optimization

The unchanged 10-minute SceneMemory install/control/certificate/verifier block now runs immediately
after v2 static gates and before the unchanged 40-minute Compendium chain. The Compendium
install → preflight → certificate adjacency remains sealed. SceneMemory, now the first Edge owner,
also performs an exact-package `--reinstall`; the static workflow control rejects the known no-op
plain-install regression, anonymous/intervening steps, missing authority fields, retries, and
soft-fail behavior. Authorization remains 2 minutes plus one 90-minute serial battery, with no
matrix and no retry. Had this order governed run `32618995487`, its 2.5-minute red would have stopped
before the 35m38s hosted Compendium certificate.

Compendium certificate carry-forward is deliberately deferred. The current verifier binds current
source identity; safe reuse of the complete hosted 78/78 report would require a separately reviewed,
negative-controlled closure authority. This batch does not weaken that verifier or silently skip
live Compendium evidence.

## Authority boundary

No new hosted attempt is authorized. PR #33 remains Draft, open, unmerged, and unlabeled until a
new changed-head authorization names the final head/base/label/92-minute ceiling/no-retry contract.
No production release, deployment, version bump, preview publication, or site write is in scope.
