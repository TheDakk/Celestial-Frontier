# PR #33 Compendium focus-settlement repair — 2026-08-23

Hosted run `32614177932` passed every preceding root/v2/static stage and the desktop Compendium
profile. Its phone focus-pinned point alone sampled `cmem-0740` and `cmem-0743` at 0×0 with two live
subscribers. The collector had proved the prior virtual window ready, then its own mandatory render
turn mounted fresh normal-window rows while the off-window focused row stayed pinned. Every other
byte, pixel, cache, queue, active-job, lease and portrait ceiling passed. The single paint error in
the report was the instrument's intentional recovered producer-error control.

The repair does not widen a ceiling or ignore placeholders. Collector `4ab533a7…` consumes the
deferred double-rAF window turn, re-proves exact mounted identities, decoded dimensions and drained
work, then enters the unchanged rAF → GC → heap/product/DOM snapshot. The paired selftest makes the
old order capture a zero-width image and the corrected order capture an exact 132px image.

Clean source `14626a70a88793a339472204709348d210956ecc` produced three current-product candidates and
one paired legacy baseline under Edge `151.0.4129.101`, revision `@cc1d9f…`, JavaScript `15.1.23.9`,
protocol `1.3`, measurement authority `625d2978…`, and producer `5a316197…`. Every run was one attempt
with zero retries. The baseline retained the four sealed faults and 14 phone / 13 desktop breaches.

Retained raw/gzip SHA-256 pairs:

- candidate 1: `02afb70d4a44b0d58c21d84faec23a551aa4ad662842c6c927fd5e38aab85f5b` /
  `f222eaa8cddd0afa935f9b9006d9e785716262e656ed8c31ac9d92efb4fad600`
- candidate 2: `0e6578f9d3a7e4adafeaa61adbb54c42a83dd763a6b47867045d9c52210e269d` /
  `ebfbb80d5cfee1e7226c494be79de69daa47d2dfb5fc5736734102bfb153830d`
- candidate 3: `d539fb8df3ae8873d1ebb1725574f5e85b3cfff8ca8fcb9cdd5ba80d8bb6882f` /
  `fdede499e335cd6edca65b5c5d35d9457189a21545b273734b8428a653afb5c8`
- paired baseline sample: `fb56e4bc55fa448e8add17872cca86948296b2d56ed524aba31bdd0c90f00916` /
  `3b0c5356e7cf37a749e55d5859672c246d46c1d3be9f1d7ed9be7280c264b036`

Active budget source `e8898bf3a12d094eefc99fe188a217d9e60058a0` owns budget SHA-256
`28b958678fa2e95bb7b906cb10bd1a422dfe0b52867400e8722fbf6befddb15d`. Independent run
`20260823-pr33-focus-settlement-certification` passed 78/78 with complete lifecycle, zero findings,
no partial failure and named verification. Its raw/gzip report SHA-256 are
`d1ea225b913c28a2b9110538d064e3df6609582dc94c875f62a622998ac55071` /
`8e09255b616f9539a8dee5e180df00c8f03d211f3da7eac82529397a6f3b1966`.

Evidence-bound descendant `d359d8c12fcb67677d7f95c00a43e2cc31ea531a` passed the complete local
root/v2/browser battery. This is local evidence only. PR #33 remains Draft, unlabeled, terminal-red
at the consumed hosted run, and unmerged; no push, hosted retry, Ready transition, release or deploy
is authorized by this record.
