# Local generation feasibility — September 8, 2026

Nick prefers investigating generation inside the game on the player's device.
This is a local-first preference, not a selected model or final architecture.

Apple provides native Swift/Core ML image generation. Its example compresses an
SDXL UNet to about **1.46 GB**: one component, not the complete package or a model
selected for Celestial Frontier. [Apple implementation](https://github.com/apple/ml-stable-diffusion)
Core ML supports on-device inference without network access once models are
present. [Core ML](https://developer.apple.com/documentation/coreml)

The current PWA needs browser-compatible inference or a native integration;
Apple's Swift package cannot simply be imported into browser JavaScript.
Browser runtimes can use Wasm/WebGPU.
[Browser inference architecture](https://developer.chrome.com/blog/io24-webassembly-webgpu-1)

A candidate design retains one model package and a bounded cache of visited
scenes, rather than millions of installed paintings. Neither a cloud service nor
a particular compositor is required by the request. Model choice, redistribution
license, hardware coverage, download size, latency, memory, battery/heat, cost and
approved-art quality remain unresolved.

The next bounded proof should generate one canonical landfall locally, preserve
its full world/organism identities, and measure quality and resources on the target
iPhone. Exact shared pixels need a separate retention/recipe policy. No device
benchmark, model installation, service selection or runtime integration occurred
in this research. The existing still remains a quality/display prototype.

## How the current artwork was made

Codex used its built-in image-generation tool with the approved references and
scene instructions, then copied the returned PNGs into this workspace. The
game did not generate them. The authorized ImageMagick step only prepared the
selected display copy. No generator/model is embedded in the runtime by these files.

Nick additionally requires no separate AI-software installation for players.
An online game backend could call OpenAI's image API with canonical scene data
and reference images, then return/cache the result. This is the same general
authoring approach, not a claim that a selected public API model exactly matches
the Codex tool's undisclosed runtime model. The API supports generation and editing;
quality, recurring-character consistency and latency still require a real proof.
[Official image-generation guide](https://developers.openai.com/api/docs/guides/image-generation).
API credentials stay on the backend, never in the player app/browser.
[Authentication](https://developers.openai.com/api/reference/overview#authentication).

An embedded local model can also avoid a separate installer, but the game must
download/package its weights and supply a supported inference runtime. Neither
route needs a pre-rendered image for every possible world. The remaining product
choice is online generation versus local model download/compute, with storage,
quality and sharing controls appropriate to that choice. No API prototype,
model download, account charge or hosted action was performed.
