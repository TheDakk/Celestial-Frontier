# One phone probe without text encoder — preparation

Nick authorized one new probe on the same physical iPhone17Pro/iOS26.6.2, USB-C.
First verify every pinned transformer initializer fits1GiB. Parent and exact in-worker
expanded graph both have443 initializers; largest113,246,208bytes (108MiB). None exceeds
1GiB. Oversized synthetic tensor rejects; exact1GiB permits. See initializer-audit.json.
Total initializer bytes4,393,808,634 after expansion; passing one-buffer check does not
prove total resident memory or temporary allocation fits. No inference in this inspection.

Next precompute only the accepted recipe text on Mac, freeze binary/hash/prompt/model
identity, serve it to phone and refuse text-encoder fallback. Phone must load only encode,
denoise and decode. One warm finisher attempt, memory where exposed, no session-loss retry.
No phone inference has run in this audit yet. Native embedding preparation requires a
signed source; preparation tool exposes only text weights, no VAE/transformer resources.

Mac text-only preparation onf725f633 PASS: one text inference, zero VAE/transformer/decoder
requests or painting.416x7680 float16,6,389,760bytes, binarySHA
46f0533d51e3c436b6d6cf6bcfa3e8af0c5d402b51e6d4570e13dda0724a20c7.
Public embedding under port/v2/apps/game/public/__local_ai/embeddings is byte-identical.
This is probe input delivery, not qualification of a new normal-game phone model tier.
The phone-only worker has no tokenizer import, hard-pins binary and refuses wrong prompt,
revision, shape, nonfinite values, four sessions or repeat invocation. Tests pass.
Server excludes text-encoder/tokenizer files entirely in --embedded mode.

Safari session preflight currently SESSION_UNAVAILABLE: devices found but unusable; no
more specific cause supplied. No phone model attempt yet. Waiting for reconnect/unlock.
After readiness: start driver49763, obtain physical same-device session privately; run
`node tools/local-image-generation/run-iphone-kit-probe.mjs SESSION_JSON HTTPS_KEY HTTPS_CERT 192.168.1.62 NEW_AUDIT --embedded`
with private session/certificate paths. Source must be committed. One attempt only,
no retry on session loss; raw result retains observed memory and transformer stage.

Signing stop:1Password refused the prepared signed commit afterf725f633. Changes remain
staged; no unsigned fallback. The ordinary-game-01 check refused uncommitted source
before opening a browser. Preserve that result; after signing, use ordinary-game-02 once
for the no-inference normal Land/reload/Inspect check. This did not consume a phone model
attempt. Nick has been asked to unlock1Password and reconnect/unlock the phone.
