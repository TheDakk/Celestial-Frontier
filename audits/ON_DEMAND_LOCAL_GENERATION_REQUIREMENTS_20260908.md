# On-demand local generation — conditional direction

September8,2026; clarified after signed display-prototype checkpoint
`3ee104f86c08973243cc8c8a21c1f9ebba41ae76` (91 files; signature verified;44 ahead/0
behind cached origin/openai/mac). All runtime and review evidence remain unchanged.

Nick agrees with a local generation direction **if** it is feasible, does not use
a large amount of local storage and requires no additional software installation
by the player. Treat these as constraints, not permission to install a heavy model.
The finished scene must be generated on demand during play and meet the approved
cohesive art direction. Millions of possible scenes need not be stored in advance.

No extra installer can be achieved by integrating the inference runtime and
managing model delivery within the game; it does not make model bytes disappear.
The current evidence game pack is18.108MiB. No locally distributable generator
has yet demonstrated the approved painting quality inside an accepted storage,
latency, memory or battery budget. Local model weights may materially exceed the
existing128MiB shipped-pack limit. Do not silently raise that limit or rewrite
PWA cache/retained-build rules. A model download is not authorized.

Codex made the reference images using its built-in generation tool and saved
the returned files in the repo. The current project does not contain that model.
An online backend/API can also provide no separate player setup, but it remains
a different connectivity/operating-cost choice; no service is selected or called.
[Researched feasibility and workflow](STATIC_LANDING_PORTRAIT_20260908/LOCAL_GENERATION_FEASIBILITY.md).

## Adaptive storage direction — clarified September 8, 2026

Nick proposes adapting limits to device capability, with smaller allowances on
limited devices and several GB of cache on capable Mac/Windows machines. This
supersedes a single global 500MB total-storage recommendation. Nick's preceding
500MB/1GB suggestion was exploratory, not a resolved fixed total-game ceiling.
The under100MB initial-download idea remains a provisional Codex recommendation,
not a proved local-model delivery size or permission for a mandatory GB download.

The following **Codex proposal** concerns disposable encoded scene images only.
These are maximums, not preallocation, immediate downloads, RAM allowances or an
accepted exact device table. MB/GB here are decimal; existing MiB gates remain binary.

| Starting profile, subject to available storage | Proposed scene-cache ceiling |
| --- | ---: |
| Limited or unknown capability | 500MB, lower if needed |
| Qualified more capable phone/tablet | 1GB |
| Qualified desktop/laptop | 2GB |
| Player-selected expanded desktop cache | Up to 5GB where space permits |

Device category suggests a default; it must not override low available storage.
Use origin usage/quota estimates, conservative margins, bounded performance
qualification and an accessible player setting. Unsupported/ambiguous capability
signals start conservatively. Browser RAM hints are approximate and privacy-bounded,
not exact installed or currently free RAM, and require an unsupported-API fallback.
[W3C Device Memory working draft](https://www.w3.org/TR/device-memory/).

Disk capacity decides how much encoded art can be retained. Separate measured
RAM/GPU limits govern decoded images, textures, model working buffers, resolution
and concurrency. Increasing disk allowance must not increase live allocations.
A several-GB cache does not prove that the device can run the chosen image model.
No model, benchmark, hardware tier detector or adaptive cache is implemented here.

## Total accounting and behavior at the cap — proposed, not implemented

The player must see both the scene-cache limit and total managed storage. Total
accounting includes active/rollback game packs, installed model versions, protected
saves and original pictures, disposable scenes, metadata and concurrent reservations.
Admit downloads/generation only after allowing for temporary candidate updates,
output staging and safety headroom. Do not double-count existing bytes in origin
usage estimates. Actual browser HTTP caches/overhead may add further bytes.
The effective scene ceiling is constrained by remaining headroom after these costs;
500MB of scene cache does not mean a 500MB total game installation.

At the effective cap, remove the least recently used **eligible disposable** scene
copies before storing another. Exclude active images, in-flight jobs, pins and
protected originals. A recoverable image means a verified exact other copy or a
proved reproduction contract; an AI seed alone is not that contract. Until the
appearance-retention policy is proved, treat sole exact originals as protected.
Do not promise an evicted painting will return pixel-identically from its seed.

Keep complete Compendium/discovery records, canonical genomes/lineage, flora effects,
progress and saves outside art eviction. Explicitly kept/shared exact originals
need durable ownership with their versioned identity/appearance manifest, not only
an entry in the disposable assetcache. Pins, read leases, generation reservations
and eviction require atomic cross-tab coordination so an image cannot be pinned
while another tab deletes it. Referenced model/build versions also remain protected.

If no eligible space remains, pause admission of new optional art and offer cache
controls; never silently overwrite protected data. The same rule applies if a player
lowers the cap below protected/in-use bytes. Do not claim the lower cap is already
met. Gameplay continues only through existing safe durable outcomes; persistence
failure still refuses the affected action under current transaction/recovery rules.

These are application eviction rules, not a guarantee against browser/OS eviction
or a user clearing site data. Persistence status and exports/backups need separate
qualification. Storage estimates are not guaranteed physical free-space reservations.
[WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/).

## Existing runtime boundaries that must survive implementation

- `port/v2/apps/game/pwa-build.ts` enforces the unchanged128MiB shipped-pack admission
  limit. It is not a total runtime cache policy. Existing256MiB retained-update
  qualification remains open.
- The service worker retains complete active and verified prior builds and stages
  a complete candidate before pruning. Reserve transient space for all three.
  Never LRU-delete individual assets in `cf-v2-build-*` or `cf-v2-pwa-control-v1`.
  The optional Civet portrait currently remains a required manifest/precache asset.
- The service worker serves exact manifest assets for the client's retained build;
  generated-art access needs a deliberate new storage/route contract. Do not bypass
  its unlisted-resource, foreign-origin or network-write rejections.
- `port/v2/packages/persistence/src/repository.ts` labels `assetcache` explicitly
  disposable. Protected original images must not rely solely on that store.

This document-only follow-up incorporates a bounded independent advisory review.
Runtime, sealed evidence packets and original failure receipts are unchanged; no
model download, capability benchmark, cache migration or browser test was run.

Safari supports WebGPU, but API availability does not establish acceptable image
model speed, memory or heat on a target phone. [WebKit Safari26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/).
Storage quotas are upper limits rather than guaranteed capacity; eviction and
persistence policy still require explicit handling. [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/).

No small local generator has proved the approved full-painting quality within
a qualified device budget. Keep no paid/cloud/model action while the technical and
product scope remains unresolved. The next implementation
should prove one canonical scene against the quality/storage/resource constraints
before widening art coverage; preserve exact worlds, full genomes/lineage, named
Earth anatomy/botany, biome mapping, accepted UI, saves and gameplay clocks.
