# Species references and mobile delivery — independent bounded review

Matches reviewed source and public documentation as of 2026-09-09. OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`, upstream `origin/openai/mac`. This subtask edits only this review directory. No product change, browser/model run, software or weight download, hosted write, commit, schedule or physical-phone claim occurred here.

## Existing anatomy references

[Exact inventory](existing-reference-inventory.json) retains all six full genomes, full identity keys, canonical anchors and named diagnostic rules from the immutable prior native-game02 recipe. Direct inspection of the two candidate images agrees with their preserved reviews. Neither is a claim that a generated scene is species-correct.

| Resident | Reusable painted source / remaining requirement |
| --- | --- |
| Civet | [Selected WebP](../../CREATURE_SCENE_COHESION_20260908/civet-selected-v1.webp): pointed masked muzzle, rounded ears, spotted coat, four paws, ringed tail. Pale fringe and fragmented whisker matte remain. |
| Platypus | [Bound PNG](../../AI_GAME_INTEGRATION_20260909/platypus-reference.png): conspicuous bill, webbed/clawed feet and blunt paddle tail; prominent hump, swollen bill base, dense fur and rounded-looking tail remain diagnostic limits. |
| Frog | No standalone rich-painted reference found in scoped repository search. Need a small green crouched anuran, wide mouth, two domed eyes, four limbs with long folded rear legs, no adult tail or mammal fur. |
| Persimmon | No standalone rich-painted reference found. Need branching woody tree, broad simple oval leaves, orange fruit with four-lobed calyx. No citrus or generic berry-bush substitution. |
| Devil's Club | No standalone rich-painted reference found. Need thick spiny canes, huge palmate lobed leaves and upright terminal red berry cones. |
| Cranberry | No standalone rich-painted reference found. Need low creeping runners, small simple oval leaves and near-ground red berries, not a tall woody berry bush. |

The supplied [Earth sheet](../../PAINTED_EARTH_AND_ALIEN_FLORA_20260908/earth-flora-fauna-reference.png) remains direction evidence. Its unlabelled organisms do not supply a canonical genome, and its upright red-fruited shrub is not Cranberry. Known-negative model scenes must not become anatomy authorities. A new individual reference must retain the actual genome/identity and declare a review boundary, not silently replace named Earth rules with raw alien body loci.

Six 480×320 reference encodings supply 3,600 image tokens; at 1024×576 the generated canvas adds 2,304, for 5,904 image tokens versus the old single-reference 2,904. This arithmetic describes the actual packed spatial grid only, not a predicted latency or memory benchmark. Multiple whole-image references remain soft model conditioning; this graph has no individual box, mask or count input.

## Native runtime source correspondence

[Byte evidence](native-source-correspondence.json) newly corroborates the exact installed Asyncify WASM's source version. At byte offset 24,757,131, the SHA-pinned binary embeds a unique NUL-terminated build string identifying commit prefix `2e2543fbe9`, Release, plus a `1.29.0` version string. The prefix matches the full pinned source commit `2e2543fbe9fae542f921d47a72d21d5a4ef0b710` that supplied the retained complete ThirdPartyNotices aggregation. Therefore the old statement that source-version correspondence is wholly unproved should be narrowed.

The [official npm version record](https://registry.npmjs.org/onnxruntime-web/1.29.0) was retained as 5,620 bytes; its package integrity equals the project lock. No tarball was downloaded, no registry signature verified here, and the response contains neither gitHead nor an attestation pointer. The upstream [prepack source](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/js/web/script/prepack.ts) updates the common-package version. Its [WASM artifact helper](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/js/web/script/pull-prebuilt-wasm-artifacts.ts) supports fetching CI-built artifacts; it was read as text only, never executed.

The exact runtime keeps its MIT license, bundle banner and full matching source notice aggregation. This evidence does not reconstruct the binary, enumerate its selected linked native components or establish every component's build options. `source-version-correspondence-corroborated` is accurate; bit-reproducible build, selected-component SBOM and full distribution/device qualification remain false. First DNS-restricted retrieval and successful scoped outside-sandbox read are both retained in source-retrieval-01/02. The earlier notice packet remains immutable.

## Concrete browser-mobile constraints

Safari 26.0 shipped WebGPU on iOS and iPadOS. The same release added File System WritableStream support; merely detecting either API does not establish that this six-gigabyte model fits a device. WebKit explicitly lists ONNX Runtime among frameworks using the new GPU support. The current worker separately requires `shader-f16`, a non-fallback adapter and sufficient actual resource limits. A Safari version string cannot replace those probes. [WebKit Safari 26.0 release](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

WebKit's published storage policy allows browser origins up to 60% of total disk, with Home Screen apps receiving the same quota policy. This is a ceiling, not guaranteed writable free space. Quota failure must stop safely. Storage can be evicted by origin under pressure or inactivity; `estimate()`, `persisted()` and `persist()` are available, with persistence decided by heuristics. A large returned quota or Home Screen installation is not an outside-origin backup. [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

ONNX Runtime's large-model guidance distinguishes browser ArrayBuffer limits, the 2GB protobuf limit, and 4GB WASM32 address space. It recommends external data and OPFS/cache reuse. This game uses staged graphs and external shards; adding their disk sizes does not mean one WASM memory holds the total. Conversely successful streamed storage does not prove graph initialization, GPU tensors or transient copies fit. No universal iPhone memory number can responsibly be substituted for a measured run. [ONNX large-model guide](https://onnxruntime.ai/docs/tutorials/web/large-models.html)

The ONNX deployment guide requires executable JavaScript, compatible WASM, model data, correct paths and a secure context. Its generic binary table still describes JSEP; the locked installed loader selects Asyncify instead. Preserve the measured closure and same-build JS/WASM pins over generic examples. The combined app still needs actual offline URL coverage, correct WASM MIME/CSP/headers and retained-update accounting; standalone pack byte verification alone is insufficient. [ONNX deployment guide](https://onnxruntime.ai/docs/tutorials/web/deploy.html)

Physical iPhone model/OS, installed browser versus Home Screen origin, full 6,691,020,416-byte verified installation, cancellation/resume under realistic storage pressure, graph loading, complete output, foreground responsiveness, peak memory, thermals and reload/offline survival remain actual device qualifications. Desktop device emulation, synthetic small model fixtures and capability reports do not close them. This review does not authorize a phone/model download or hosting action, and it makes no new image-quality acceptance claim.
