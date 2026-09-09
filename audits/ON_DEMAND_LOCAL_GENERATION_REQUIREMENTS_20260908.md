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

Nick asked for a recommendation based on modern browsers, compute and local
storage instead of selecting one of the proposed limits. Codex recommends an
initial download under100MB and a500MB steady-state app-managed storage target
covering installed assets/model, saves and scene caches. This is a proposed
product budget, not Nick's accepted numerical limit, a proven model size, a new
runtime policy or an increase to the existing128MiB shipped-pack gate. Do not
require a multi-gigabyte AI download in the default iPhone/browser experience.
Browser-managed duplicate caches, metadata and temporary updates can add usage
outside an application-managed steady-state figure; measure actual installations.

Safari supports WebGPU, but API availability does not establish acceptable image
model speed, memory or heat on a target phone. [WebKit Safari26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/).
Storage quotas are upper limits rather than guaranteed capacity; eviction and
persistence policy still require explicit handling. [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/).

No small local generator has proved the approved full-painting quality within
that proposed budget. Keep no paid/cloud/model action while the technical and
product scope remains unresolved. The next implementation
should prove one canonical scene against the quality/storage/resource constraints
before widening art coverage; preserve exact worlds, full genomes/lineage, named
Earth anatomy/botany, biome mapping, accepted UI, saves and gameplay clocks.
