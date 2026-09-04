# PR #35 action-settlement repair — exact clean local pass

This audit preserves the unchanged-source local `develop` admission chain for the bounded Glass
Inventory action-settlement instrument repair. It is local evidence only; it does not claim a
hosted PR result.

## Exact source and browser-free profile

- Commit: `64e405bc6678302c5936945c1b34ac5de5407025`
- Tree: `732bcf9930ac36e7661b14cdfd6cde64137d34f4`
- Branch/source state: `openai/mac`, clean committed bytes throughout the browser chain
- Tracked `develop` profile: **264/264 files**, **2,738 passed / 1 skipped**

## One unchanged-source, fail-fast chain

- **Compendium:** run `20260902214924248-53897-bef91ee56a` passed **78/78** expected
  outcomes with zero findings and zero blocked outcomes in **61,826 ms**. Exact report SHA-256:
  `128763fcdd45cef23cb41f509f8d30bc6c041784c3547252cd6438f0b089f105`.
- **Slice:** immutable certifying `develop` run
  `20260902215043536-54220-81ac577271ec` passed with zero findings, zero scopes, and **10**
  screenshots in **362,381 ms**. Report SHA-256:
  `7f73b8bb68c4197e44931ec615063d66e7f2ba7b1b5d1e86fcf9eb5850a4b7c3`; raw log SHA-256:
  `1b89495e6e5d5a10183f16b30be65c84df7cbf1605cf81907dfa951e82b90eba`.
- **Glass:** immutable full-certifying run `20260902215703000-54563-41950fd00ea0` consumed
  that exact Slice report/log binding and passed **12/12 viewports**, **12/12 reloads**, and
  **104/104** planned controls with zero findings, instrument failures, blocked controls, omitted
  controls, or automatic retries in **114,022 ms**. Report SHA-256:
  `de298933a9be237efcb926d28054a2fcb308ca09eacc2532bbb7b75c67ddadc2`.

Every stage was terminal green on the same source identity; no stage retried.

## Browser/CDP provenance

- Executable: `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
- Product: `Edg/152.0.4191.53`
- Revision: `@4ee8983fdce2559a0ae8f8376934c5ed353035cd`
- CDP protocol: `1.3`; JavaScript engine: `15.2.23.6`
- User agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
  (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0`

## Deterministic carriers

Each carrier was produced with `gzip -n -9`, passed `gzip -t`, decoded byte-for-byte to its named
raw source, reproduced the raw SHA-256 after decompression, and matched an independent deterministic
recompression byte-for-byte.

The four carriers and this index are retained by SSH-signed commit
`112bf7fb4961d8f85833df964fe8b17109ab2a0b`, tree
`5daa4e7e589ec37fc59f5e1b2e863caccd5101be`. That descendant passes the final hermetic
tracked-input `develop` profile at **264/264 files, 2,738 passed / 1 skipped**; the current signed
handoff-only descendant passes it too without rebinding the browser certificate.

| Carrier | Raw bytes | Raw SHA-256 | Gzip bytes | Gzip SHA-256 |
| --- | ---: | --- | ---: | --- |
| `ARC1A_COMPENDIUM_PR35_ACTION_SETTLEMENT_REPAIR_PASS_20260902_64E405B.json.gz` | 10,868,971 | `128763fcdd45cef23cb41f509f8d30bc6c041784c3547252cd6438f0b089f105` | 453,995 | `06bcbff2009d4fdae50bbbdd529612410b8bf22427b234be4e888a6ead276ef8` |
| `ARC4_SLICE_PR35_ACTION_SETTLEMENT_REPAIR_PASS_20260902_64E405B.json.gz` | 6,126 | `7f73b8bb68c4197e44931ec615063d66e7f2ba7b1b5d1e86fcf9eb5850a4b7c3` | 1,959 | `780fd2e50885047ded3427fa3719ef6a7f4070a51ce6a85146468b24bbd3821e` |
| `ARC4_SLICE_PR35_ACTION_SETTLEMENT_REPAIR_PASS_20260902_64E405B.log.gz` | 6,950 | `1b89495e6e5d5a10183f16b30be65c84df7cbf1605cf81907dfa951e82b90eba` | 3,288 | `c61e7d1e2ab2970c9d99e354e2e89b4498a7131bf852e2e5ad9e79fe3f3a4512` |
| `ARC4_GLASS_PR35_ACTION_SETTLEMENT_REPAIR_PASS_20260902_64E405B.json.gz` | 898,941 | `de298933a9be237efcb926d28054a2fcb308ca09eacc2532bbb7b75c67ddadc2` | 78,885 | `932516f599db57e6d2001ed2f2e2efa54b7ee0fd3594dee42e16eca0d7f3e846` |

## Authority boundary

This certificate grants no GitHub Actions spend or hosted status. No push, label, workflow
dispatch, retry, PR mutation, merge, release, version bump, publication, or deployment is
authorized by these local results. Any hosted PR #35 attempt still requires a fresh exact-head,
exact-base, one-run authorization and must stop without retry if red.
