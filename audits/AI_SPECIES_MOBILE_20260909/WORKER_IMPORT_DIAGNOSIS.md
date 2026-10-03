# Optional PWA worker imports — diagnosis and verified correction

The optional package rejected real static imports from its own local AI worker. The earlier
full-model run reached verified offline storage, then failed to finish its worker module check.
The model bytes and the worker import route are separate owners; no second 6.69 GB copy was needed
to isolate the defect.

## Preserved attempts

- `native-mobile-delivery-01/result.json`: aggregate FAIL. Install/Pause/resume completed, but the
  diagnostic's hard reload bypassed its service-worker controller. Offline verification was not
  reached. The corrected runner uses normal reload and checks the exact activated controller.
- `native-mobile-delivery-02/result.json`: aggregate FAIL. The controlled full installation,
  Range resume, actual server-off offline reload, full native UI rehash and all twenty production
  Blob reads succeeded. Final dedicated-worker observer timed out; a pending worker Network.enable
  also timed out. Neither failure was hidden by the positive storage subresults.
- `offline-runtime-native-01/result.json`: aggregate FAIL. The small module-only test received a
  generic worker Event without a message; the first observer incorrectly left that as undefined
  and waited for a reply. Later runners record the Event class/type and null message explicitly.
- `offline-runtime-native-02/result.json`: aggregate FAIL with the real generic Event. A late
  service-worker telemetry listener captured nothing, and the failure-time ownership query had
  a syntax error. This is not proof that the browser made no worker fetches.
- `offline-runtime-native-03/result.json`: aggregate FAIL before going offline. The same worker
  failed while the server was online and its exact PWA controller was active.
- `worker-ownership-diagnostic-01/result.json`: deliberately instrumented diagnosis, aggregate
  FAIL and not qualification. A strictly local proxy prepended an initial read-only fetch-event
  observer to a served copy of the verified worker; response policy stayed unchanged. It recorded
  the native request metadata below. Instrumentation is retained in its measured runner only.

The native entry request has destination `worker`, a parent document client ID and a nonempty
resulting worker client ID. Static imports also have destination `worker`, but mode `cors`, the
created worker's client ID and an empty `resultingClientId`. The old policy classified every
`worker` destination as creation, then rejected those imports for lacking a new client ID.

## Product correction and controls

Only the optional AI worker template changes. An admitted worker creation writes an explicit
`worker: true` role into its exact retained-build client marker. Requests with worker destination
and an explicitly empty resulting client ID may use the import route only with that role. They
still pass the existing current/prior build, complete-cache marker and exact listed-asset guards.
Window pins, absent/role-less/substituted markers, unretained builds, unlisted files and malformed
new-worker IDs remain refused. There is no fallback to a different active build. The ordinary
PWA template remains byte-identical to the signed pre-mobile revision.

`worker-import-controls-01/result.json` records ten package/ownership and two reply-acceptor
controls, all 34 existing PWA controls, three TypeScript programs and root validation. The actual
request-shape success control also runs offline; mutations cover both ownership and asset failures.
The independent static review is beside that receipt. No full profile or certificate was rerun.

## Actual unchanged-package outcome

`mobile-delivery/build-03/result.json` builds and independently verifies the changed optional
package with all 426 measured inputs unchanged. `offline-runtime-native-04/result.json` is PASS
using that exact package without a proxy or instrumented service worker. The actual module worker
responds through its existing pre-GPU profile-validation guard both online and after the origin
server is physically closed, CDP is offline and the game completes a normal new-document reload.
A deliberately changed reply is rejected before the real reply is accepted again.

All 95 cached asset digests match. An offline fetch retrieves the exact 25,749,873-byte Asyncify
WASM (SHA256 `503d17cb7411b79781b9fad1cf0978f03cf06b050c7d399c730e914f473bf549`). This checks bytes,
not WASM instantiation. The model OPFS namespace is absent. All twelve sources remain unchanged,
there are no captured browser exceptions/crashes or loading failures, and target/browser/origin/
workspace cleanup completes. The screenshot was visually inspected: the offline Sol scene is
rendered with its normal controls; this is not a phone-layout certificate.

The deliberately invalid profile response proves that the genuine ESM graph loaded far enough
to reach its own guard. It does not initialize WebGPU, allocate a model, generate an image or
qualify a physical phone. The two full-model aggregate FAIL results remain unchanged; the later
PASS closes the separately measured module route only. No network model download or hosted action.
