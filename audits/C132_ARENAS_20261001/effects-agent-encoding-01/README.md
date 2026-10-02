# Arena encoding feasibility — 2026-10-02

Nine exact delivery layers were tested: FAR/MID/NEAR from karst (detailed foliage and rock), blueice (ice and pale terrain), and hotglow (amber clouds). The committed originals, runtime PNGs, manifests, registry and 128 MiB cap remain unchanged. This is a sample feasibility result, not package admission.

| Encoding | Sample bytes | Saving |
| --- | ---: | ---: |
| Original runtime PNGs | 18,497,931 | — |
| PNG deflate level 9, adaptive filtering | 15,863,041 | 14.24% |
| WebP lossless, exact, q100, method 6 | 11,740,534 | 36.53% |

All 18 encoded copies decode to exactly the same dimensions and every RGBA byte as their input, including RGB beneath alpha zero. Source and output hashes are retained in report.json. The comparison's controls detect a changed hidden RGB byte and a changed alpha byte. This is stronger than comparing only visible colors.

WebP ratios range from 52.67% to 76.34% of the corresponding source PNG. Even the best observed individual ratio is above the 49.98% ratio needed for the earlier 20-set total to fit beside the current shipped pack. The worst observed ratio applied conditionally to those 20 sets would give 168,969,950 total bytes, above the unchanged 134,217,728-byte cap. This conditional calculation is not an all-asset estimate, and later delivered sets increase the demand. Exact lossless encoding offers useful savings but this sample does not establish a cap solution.

The current manifest reader in port/v2/tools/morph/arena-sets.mjs validates runtime paths and hashes without requiring a PNG suffix, and build-shipped-battle2.mjs enumerates those runtime paths. That source inspection suggests a separately reviewed WebP derivative can be represented by the existing delivery structure. It does not prove browser/phone decoding, texture upload behavior, decode cost or memory. No registry or loader integration was attempted.

Encoded copies preserve the arenas' visible seams, fringe and staging defects. They confer no visual acceptance or medium/motion admission.

Evidence:
- report.json: exact source/output/decoded hashes, sizes, tool versions, controls and conditional budget calculation.
- run.mjs: bounded reproduction script; output creation is immutable and refuses overwrite.
- Eighteen PNG/WebP copies: output pixels are byte-identical to their respective source after decoding.
- All paths in records are repository-relative. No native epoch was run.
