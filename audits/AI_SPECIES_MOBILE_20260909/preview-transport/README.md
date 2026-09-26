# Frozen local preview transport — 2026-09-09

This packet repairs one authoring-preview transport defect without repeating
model generation or changing the game, model, runtime package or mobile pack.

The immutable [first native generation result](../native-generation-01/result.json)
remains FAIL: six reference passes and the retained painting completed, but the
injected Vite client opened an unavailable WebSocket and raised
`WebSocket closed without opened.` Vite 8.2.0 injects that client even when its
server has `hmr: false` and `ws: false`. This packet preserves the original server
source, installed client bytes and exact hashes in
[first-source-evidence.json](first-source-evidence.json). Those installed bytes
are upstream source, not a claim that the original transformed HTTP body was
captured during the failed run.

`frozen-preview-client.mjs` checks the exact locked Vite version/client SHA and
serves a copy with its one eager connection disabled. CSS/query helpers, exports
and error reporting remain intact. The installed dependency is unchanged.
Console forwarding must also be explicitly disabled. Unknown dependency bytes
or configuration fail before serving. Both the actual model preview and the
no-inference boot observer use the same server factory.

## Controls

[controls-01/result.json](controls-01/result.json): **13 PASS, zero failures**,
five new source/transport controls plus the eight existing preview HTTP controls.
All six measured input files were unchanged. This includes original eager-start
code executing once versus the corrected code executing zero times, changed
dependency/config rejection, an actual transformed Vite HTTP response, preserved
normal game index delivery, range/security/integrity/cleanup controls. The tiny
eager-start span is a controlled instrument, not a browser WebSocket substitute.
HTTP/Vite and both locks closed. No model scan or inference ran.

## Scoped native result

[native-boot-01/result.json](native-boot-01/result.json): **PASS**, isolated Edge
152.0.4191.66 on this Mac. The actual game rendered, a trusted native Skip reached
Sol, a new document restored the durable route, and the renderer continued to
advance. Network recorded **zero WebSocket creations**, zero model/inference
requests and zero runtime exceptions/crashes across both documents. Both actual
served client bodies are retained with the same SHA
`dc4e9453f1906c7d3548b64e8833431f16ea879f8e0d5bd8dd08a1966fc4e968`.
All20 captured source hashes were unchanged. Target, browser, HTTP, Vite,
workspace and outer foreground locks closed. Two favicon404 log entries remain;
this is not a zero-browser-error claim. Commands, syntax check and raw logs are
in [native-boot-launch-01](native-boot-launch-01/).

The two screenshots were inspected: the first shows the ordinary Sol training
card with visible Skip; the second shows the unobstructed restored Sol game.
Their exact byte identities and this narrow visual scope are recorded in
[native-boot-01/VISUAL_REVIEW.json](native-boot-01/VISUAL_REVIEW.json). The native
observer never invokes the game model scanner or changes its WebSocket object.
This scoped result does not replace the failed generation receipt, qualify
phone/PWA delivery or approve the generated species artwork.

```sh
node tools/with-toolchain-lock.mjs --label frozen-preview-native-boot -- node tools/local-image-generation/run-frozen-preview-boot.mjs --output=audits/NEW_PREVIEW_BOOT_ATTEMPT
```

Use only for a newly justified preview change. The exact current source already
passed; no unchanged inference or browser rerun is required.
