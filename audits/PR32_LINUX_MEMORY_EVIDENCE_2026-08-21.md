# PR #32 Linux Compendium memory evidence — 2026-08-21

This note preserves the exact terminal diagnosis used to repair the Arc 1A memory budget after
GitHub Actions run [`32441023665`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/32441023665).
The uploaded raw report was `compendiummem-report.json` in artifact
`9433081460` (`v2-compendium-memory-evidence`). It is committed beside this note as
`PR32_LINUX_MEMORY_REPORT_32441023665.json.gz`; deterministic gzip SHA-256 is
`a3b67e70881b725266a0fb669f027b51141967a4ff2193e011ed3b1d124a0916`, and its decompressed
10,466,459-byte report SHA-256 is
`a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36`.

## Authority

- PR/head/base: `#32`, `e9b04d5d515ce09363971f912603720f820de7f1`,
  `38447019517147319bd08c598202d097ee866874`.
- GitHub's detached test-merge source: `ff38629db5dfb3936c8d0926cfee125f905e2a7b`.
- Exact browser: `Edg/151.0.4129.86`, revision
  `@083e754915c9ab93da1d8f7b9c860e4520273900`, JavaScript `15.1.23.7`, protocol `1.3`.
- Host provenance: `/opt/microsoft/msedge/microsoft-edge`; X11/Linux x86_64 user agent.
- Budget: `546d3a817073e42910b496895734ae2a01bb4c633af2780ecde1b1ef6570b292`.
- Measurement authority: `23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92`.
- Producer authority: `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`.
- Working-tree digest: `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`,
  identical to candidate27/28/29 calibration source.
- Attempt policy: one attempt, zero automatic retries. Lifecycle completed without partial or
  blocked evidence.

## Exact result

The report contained 78 outcomes: 75 passed and three failed.

| Outcome | Observed | Active ceiling | Diagnosis |
|---|---:|---:|---|
| `phone/warm-plateau` | 97,320 B | 65,536 B | Last-three aggregate heap range exceeded the macOS-derived allowance. Encoded and decoded resource ranges were both zero. |
| `phone/byte-ceiling` | 220,530 B | 196,608 B | Only the one retained 440px portrait data URL exceeded its encoded-byte allowance. |
| `desktop/byte-ceiling` | 220,530 B | 196,608 B | The same retained portrait was the only exceeded field. |

The phone warm aggregates were `10,923,445`, `10,826,125`, and `10,850,473` B. Page heap changed
by only 12 B, backing storage was constant, and the non-monotonic 97,320 B range came entirely from
browser embedder heap. Across the same warm points, thumbnail encoded bytes, decoded bytes, job
starts, disposals, worker starts/disposals, leases, and the single portrait were stable. Absolute
page/embedder/backing/aggregate heap ceilings all passed.

Every other combined byte-ceiling field passed on both profiles: cache entries, decoded pixels and
bytes, total thumbnail encoding, queued and active jobs, leases, subscribers, portrait entry count,
and all product-owned live limits. `no-full-portrait-thumb-path`, warm precondition, settled jobs,
worker disposal, DOM ceilings, responsiveness, and authority checks also passed.

## Cross-host comparison and bounded repair

Candidate27/28/29 used the same exact Edge/producer/measurement/working-tree authorities on macOS.
Their retained portrait was always 182,238 B; their phone warm ranges were 5,324, 6,000, and
5,036 B. The Linux run therefore exposed two native host-variance carriers—PNG encoding and
embedder-heap collection—not a changed product build or monotonically growing resource state.

The budget-only repair raises exactly these fields to 262,144 B:

- phone `warmHeapAggregateRangeBytesMax`;
- phone `livePortraitEncodedBytesMax`;
- desktop `livePortraitEncodedBytesMax`.

That leaves 164,824 B of headroom above the observed Linux phone range and 41,614 B above its
portrait, while remaining below paired baseline11's 393,140 B phone warm range and far below its
20,693,680 / 55,868,080 B portrait totals. All other ceilings stay byte-identical. Baseline11
therefore retains the same four sealed faults and 14 phone / 13 desktop ceiling breaches. The
measurement authority, three independent candidate samples, paired baseline, producer authority,
browser tuple, attempt policy, and human-review boundary do not change.

This evidence does not authorize a retry, merge, release, deployment, publication, or Arc 1B work.
A changed-head hosted attempt still requires a new exact owner authorization.
