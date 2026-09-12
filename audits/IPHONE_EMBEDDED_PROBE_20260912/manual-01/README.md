# Ordinary Safari iPhone probe — first result

Source: `c77e5217e4b6e4475d40e43916bee5e68bb3b6d7`; target supplied by Nick: iPhone 17 Pro, iOS 26.6.2, USB-C.
This run is user-operated and identified by its iPhone Safari UA, not WebDriver-attested.

**CONNECTION_LOST:** no page heartbeat for 60 seconds while loading the transformer.
Stopped after the first attempt; no retry. HTTPS server closed and checkout lease released.

| Measurement | Result |
| --- | --- |
| Secure context / cross-origin isolation | Both true |
| WebGPU adapter / shader-f16 | Both available |
| maxBufferSize / maxStorageBufferBindingSize | 1,073,741,824 bytes each (1 GiB) |
| Origin storage quota / usage | 1,048,576,000 / 0 bytes |
| Largest transformer initializer | 113,246,208 bytes (108 MiB), below 1 GiB |
| VAE encoder load | Completed in 2,624.54 ms |
| Transformer | Load started; expansion 206/206 completed; session load completion unobserved |
| Decoder / finisher | Not reached; no warm timing or painting |
| Exposed JS / native GPU memory | Unavailable (null), including at transformer load |
| Text encoder requests | Zero; pinned precomputed embedding supplied |

The last event was expansion complete at 11,783.34 ms. This is not evidence of an
out-of-memory cause. Individual initializer fit does not establish total memory fit;
expanded initializer storage totals 4,393,808,634 bytes before other allocations.
The 12 GB physical RAM figure is user-reported, not memory available to this browser.
The quota belongs to this origin/session and differs from the earlier automated probe.
`inferenceRuns: 1` records the admitted attempt; zero `inference-start` events were observed.
Phone tier remains unqualified. Original result and earlier failed attempts are retained.

Nick elected to leave the temporary CF Local Probe 20260912 profile installed for possible
future testing. No further attempt is authorized by that choice. The server certificate
expires September 13 at 22:59:55 UTC; the root expires September 14 at 22:59:54 UTC.
The root signing key was removed; a later test may require fresh certificate setup.
When finished, remove the profile in Settings → General → VPN & Device Management.
Civet animation proof remains next; rain A–F selection remains pending. No GitHub step.
