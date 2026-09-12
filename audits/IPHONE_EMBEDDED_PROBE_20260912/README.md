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

Signing resumed after Nick unlocked1Password:8a739f73 verified signed. On that source,
ordinary-game-02 PASS (audits/ART_KIT_WEATHER_LADDER_20260912):165.23ms composite, retained
accepted weather PNG restored after reload and opened in Inspect, zero inference/model
requests. Screenshot inspected. No repeat of installed-model or finisher experiments.
Safari session-preflight-02 still could not create a usable physical-phone session and
supplied no specific cause. No phone model attempt consumed. Temporary driver closed;
waiting for Nick's reconnect/unlock confirmation. Rain variant selection also pending.

## First embedded phone attempt — stopped before model load

Nick confirmed phone unlocked. Physical Safari session on iPhone/iOS26.6.2 succeeded.
One probe on signedcaf3db63 then stopped INSTRUMENT_OR_CONNECTION_FAILED: navigation
never reached the transient HTTPS server (zero HTTP requests), and capability script
observed secureContext false, crossOriginIsolated false, no exposed GPU/storage APIs.
The script fails closed there, before kitProof.start. Cause is not resolved: no page URL,
TLS error page or screenshot was captured before session cleanup. Do not identify this
as OOM, a transformer limit, lack of WebGPU, or proven certificate rejection.

Model/inference attempts0; text encoder requests/events0; VAE/transformer/decoder loads0;
transformer memory and warm finisher timing unavailable. Prior secure phone probe's1GiB/
f16 findings are not invalidated by this insecure-page instrument result. The pinned
initializer and embedding checks remain valid. No probe retry occurred. Session closed,
HTTPS server closed, owned Safari driver stopped. Phone tier remains unqualified.

First result reported to Nick. Evidence native-01/result.json and session-preflight-03.json.
Next phone attempt needs a separately authorized correction of the navigation/secure-origin
boundary. No new model/device/delivery tier qualification. Civet animation proof remains
next development work; rain variant A–F selection pending, accepted1x remains active.

## Explicitly authorized retry — certificate rejection identified

Nick said "try again". Instrument correction372a1fc0 waits for exact URL, secure context,
isolation and client readiness; negative controls reject blank/wrong/insecure/unfinished
pages. The single native-02 attempt on that signed source connected to the physical phone,
then stopped before any model request. Navigation records Safari's data:text/html error
page: "The certificate for this server is invalid." Server received two connections,
both TLS certificate-unknown alerts, zero HTTP requests. navigation-failure.png confirms
that page. This establishes a TLS trust blocker for native-02, not a model or RAM result.

No VAE/text/transformer/decoder load, inference or finisher timing. No further retry;
session/server/driver closed. Certificate SAN matches192.168.1.62; validitySep12–13UTC;
private key remains private. No trust settings, insecure-certificate capability, kit,
model or painting parameters changed. Establish a trusted local HTTPS connection before
any newly authorized phone attempt. Rain selection pending; Civet proof remains next.

Nick then authorized trusted-local-HTTPS setup. See trusted-https/README.md for the checked
profile, exact certificate identity, private runtime path, live setup URLs and removal.
Apple/native and OpenSSL trust checks pass; iPhone installation/trust remains pending its
required Settings taps. No model attempt or new phone qualification during setup.

## Trusted certificate: ordinary Safari succeeds, automation still refuses

Nick explicitly confirms the full-trust switch ON. Regular Safari loaded the trusted check
page and reported secureContext/isolation/WebGPU true. Physical WebDriver native-03 on
3dc3dc7f still rejected the new server certificate, before HTTP/model access. Two TLS alerts;
zero model starts/events and no timing. Same new leaf fingerprint verified locally. Do not
claim root-trust switch was off or that normal browsing proves automation trust. Result
reported; no further automation retry. All temporary servers/driver closed afterward.
WebKit documents separate automation windows/preferences/storage, but does not establish
the precise cause of this certificate difference:
https://webkit.org/blog/9395/webdriver-is-coming-to-safari-in-ios-13/ .

Continue the authorized same-phone probe in ordinary Safari through the known-working
secure origin49765. run-manual-iphone-probe.mjs serves only pinned inputs/embedding/image
models and records page reports on the Mac; one user Start tap claims the attempt. Before
start model routes refuse. No text encoder/tokenizer routes; same phone-only worker.
Single-start/secure iPhone-family/capability/three-session/result negative controls pass.
Loss of heartbeat60s or deadline15min stops, never retries. Records JS memory where exposed;
ordinary page UA + user confirmation identifies target, not WebDriver-attested identity for
this run. No transport authentication beyond task-local same-origin TLS; no deployment.
Capture decoded final PNG and raw finisher. Record capability/result before any delivery tier.
Then remove the profile; no kit changes. Model execution has not occurred in this batch yet.
