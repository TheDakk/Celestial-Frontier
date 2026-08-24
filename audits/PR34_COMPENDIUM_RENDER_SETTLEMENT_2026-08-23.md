# PR #34 Compendium render-stable row settlement — 2026-08-23

## Exact hosted failure

- GitHub Actions run: `32677088518`, the one authorized attempt for head
  `3dc213cc87c1995a58525fa6b310f79bbfc99fef` against base
  `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e` (one attempt, no retry; label removed).
- GitHub synthetic merge source: `8fecd69a9f3c9a8073ec893bd9a45e693d99939a`, clean and committed.
- Retained report: `PR34_COMPENDIUM_GHA_32677088518_FAILURE.json.gz`.
- Raw/gzip SHA-256:
  `544015e9e8e9e09e6ad6e13c5be40e7629f3e5884e55a147c503234a754f45da` /
  `cc5ed778f402763f34ceb76785f080b56d61f6067033087b6fe1143a492a28c9`.
- Historical active budget: `208af9558317cae7748f01470dd50e608485d4a197212ecd04db823f7c15a424`;
  measurement authority `cfc40f891e817c54c5b382cd5ef39ff606a0af27e1c142382c19da3d213edf0a`;
  collector `50c28928c7aac758c2b19d0a7c52de1d05f730d03e293b0d83fa324cdd300cf7`.
- Browser and product producer authority matched exactly; lifecycle completed; cleanup succeeded.
  No memory outcome was evaluated because the terminal partial report blocks all 78 outcomes.

## Exact diagnosis

The first desktop activation of `cmem-0777-filter-beacon` completed, opened the 440px detail,
and produced its immediate exact-detail receipt. After Close, reopen, and the second native scroll,
the row passed the collector's one-shot full-containment/hit-owner check. The next deferred
ResizeObserver/render turn invalidated that point. The passive click-point wait then issued 112
observations under the same 20-second phase: 111 timely falsy results followed by one final clipped
51 ms command. The root `Browser.getVersion` heartbeat remained timely (2.386498 ms). Reporting
that final remainder as a product deadline obscured the earlier geometry race.

This is neither a Compendium memory leak nor evidence that a healthy product needs a longer
timeout. A passive poll cannot repair invalid geometry. The row must be repositioned through the
ordinary native-scroll path and must own the same click point across the deferred render boundary
before any press is sent.

## Bounded correction

The collector now:

1. positions the exact logical row through the existing native wheel path;
2. records its owned inset activation point;
3. consumes two animation frames and re-proves exact thumbnail settlement;
4. requires the same point, within 0.5 CSS px, to remain fully contained and owned afterward;
5. repeats only the bounded positioning transaction when the row moved; and
6. sends exactly one native press/release, followed immediately by the exact-detail receipt.

The bounded reposition is not a click retry. A row that never owns a stable point is an explicit
`product-unanswerable` result with the last before/after geometry. The point expression probes a
small inset grid but accepts only pixels whose independent `elementFromPoint(...).closest(...)`
owner is the exact logical row.

The browser-free control reproduces a point that is green before the render boundary and null
after it, proves a second positioning pass reaches a stable point, and independently rejects a row
that keeps moving. No timeout, automatic retry, product resource ceiling, or gameplay code changed.

## Authority transition

Collector SHA-256 is `6d681d19ab8c9a6ec77de04db9cbacc2ab49fb9f65044b421635ba9fed09487b`;
measurement authority is `6a961df806e460d6ed02600f5366485d09d0878efa0129960b683cc4037173c7`.
The prior candidates, paired baseline, active budget, and local 78/78 certificate are historical
only under their old collector. The tracked budget is therefore `calibration-required`, with no
ceilings and no selected samples, until three fresh clean candidate runs plus one paired legacy
baseline are retained from one committed repair source. A fresh exact-budget certificate is also
required before another changed-head hosted attempt can be requested.
