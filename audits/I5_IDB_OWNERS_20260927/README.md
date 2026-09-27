# I5 IndexedDB listener ownership — 2026-09-27

The f858 scratch-disposal epoch passed calibrations 1 and 2, then stopped permanently at calibration 3: desktop listeners 100 exceeded the unchanged 96 ceiling. All 77 other outcomes passed, including memory. Its reports remain in the scratch audit; this repair does not retry or reinterpret them.

The full-flow ownership diagnostic reproduces +11 native listeners: three completed/in-flight meta transactions (three callbacks each) and one CAS request (two). Stacks identify active-play lease renewal and revision reads. `before-full-flow.json.gz` preserves the trace. The initial diagnostic launcher emitted its inherited CLI usage after independently collecting the trace; that diagnostic is explicitly not an epoch. The corrected launcher is retained.

Cleaning IDL handlers, reusing IDL functions, and per-operation add/remove listeners did not eliminate transient native wrappers. Every candidate report is retained, including failures. The final implementation owns four database capture listeners (success/error/complete/abort); individual request/transaction state lives in a WeakMap and is deleted at completion. Open requests retain temporary listeners until terminal resolution, including orphan closure after a blocked open. Each request error dispatches its request handler then the transaction failure handler. Atomic transactions, prior-value checks, stale refusal and protected recovery are unchanged.

`native-final.json` compares immutable pre-repair source605a6e28 to current source using real Chromium IndexedDB. It verifies reads, commits, stale refusal, abort, actual constraint-error rollback of all writes, deletion and clearing. CDP getEventListeners inspects held native objects rather than relying on on* properties. A further 100 transactions open only one extra database connection; the repaired count is bounded by connection listeners, while old code allocates three callbacks per transaction. Earlier native-capture count: old52→358, repaired14→28 (two live connections; after GC12). No GC is used between before/after100 readings.

Unit controls cover independent concurrent operations and release-state idempotence, success/error/abort/stale outcomes, open retry and late orphan closure. Actual omit-capture and retain-state mutants fail. Root validation preserves all50 deterministic probes. Full signed-source battery and fresh unchanged-limit3+1 proof are required before any closure claim.

Native counter lifetime is consistent with Chromium's [JSBasedEventListener constructor/destructor](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/bindings/core/v8/js_based_event_listener.cc). Request parent propagation is implemented by [IDBRequest dispatch](https://chromium.googlesource.com/chromium/src/+/4405e7bfdf8a298e51490d4b2781458ca907b26b/third_party/blink/renderer/modules/indexeddb/idb_request.cc). Native storage outcomes above, rather than mock propagation alone, are the acceptance evidence.

See SESSION_HANDOFF.md for the paused art/gameplay queue and full continuation instructions. No thresholds, measurement inventory, deadlines, history or v1 evidence changed.

Exact signed d20c271 battery:5703PASS/I5solefailure+seven ownersPASS; unchanged before/after source and log hashes verified. Fresh3+1 on this signed repaired product follows.

## Terminal result and explicit profile activation

Epoch i5-v2-d20c27166042 is CERTIFIED: three calibrations and one certification, all four raw verifiers exit0, zero automatic retries, unchanged clean product, unchanged v1 history. Every phase passes78outcomes. The successful evidence is signedafec51f84. No stopped epoch resumed.

The explicit active-v2 selector retains all raw inputs; read-only admission reconstructs the current generated instrument without writing it and confirms byte identity to the certified materialization. It verifies every raw phase, artifact bytes, exact browser/source/run/phase identity, unchanged guard and raw-derived calibration samples against the current measured build.21controls include rehashed forged summaries, missing outcomes, raised limits, stale producers, altered screenshots/instrument, incomplete/changed source and phase errors. Fullbattery follows; no hosted run or historical v1 rewrite.

## Final local closure

I5 CLOSED. Strict current-authority develop profile PASS on signed991997ae5262cbd82ddfd7f4c71704505f9f1be6:5725testsPASS,2expectedfail/2skipped,0unexpectedfailures. Allseven additionalownersPASS. Source clean before/after; everyloghash verified. RESULT.json binds the tested source digest, complete local proof and workflow preflight. Claude's final acknowledgment e573f934 independently confirms the full green battery; merge05716bf changes only ROADMAP and his mailbox, with tested runtime/tool inputs identical. The incoming handoff is byte-identical. Current code and complete evidence are ready for the normal signed own-branch checkpoint push; no hosted job/PR/label/release/deploy occurred. Development/art remain paused,168recentoriginals saved; next action only when Dakk resumes. No app relay or per-creature approval needed.

Normal own-branch push7227a39af confirmed. The earlier merge title named8cbc, but the actual signed incoming tip was e573f934 (Claude published his independent green result between checks); exact merge parents and signature/handoff checks are verified. RESULT.json records the correction.
