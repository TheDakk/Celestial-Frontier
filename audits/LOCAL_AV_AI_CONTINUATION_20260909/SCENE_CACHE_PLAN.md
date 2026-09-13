# Advisory scene-image admission plan

September9,2026. This bounded implementation follows Nick's proposed adaptive
scene-cache limits. It is a pure calculation, not an enabled cache manager,
device detector, storage reservation or permission to delete files. Implementation
and focused/static verification are complete; actual storage execution is separate.

The first planner accepts an explicit profile: conservative500MB, qualified
phone1GB or qualified desktop2GB, with an explicitly selected desktop ceiling
up to5GB. These are decimal bytes and provisional scene-cache ceilings. No RAM
hint, user agent or device name selects a profile inside this function.

The caller supplies origin usage/quota, protected/current inventory and future
reservations. Origin usage already includes existing scene, save, build and model
bytes; those bytes must not be added a second time. The model files in today's
local proof live outside browser-origin storage, so they cannot be presented as
measured browser cache usage. A future browser installation must include them.

Candidate `bytes` is the final encoded image size. `peakStagingBytes` is additional
temporary space **beyond** that final image. Future safety, save/update and other
job reservations also reduce headroom. Arithmetic must remain finite safe integers.
Missing estimates, inconsistent accounting or an unsupported candidate pauses
optional admission. Storage estimates are not guarantees of physical space.

The planner may propose LRU eviction only for unlocked disposable scene variants
with evidence of a verified surviving exact copy. Same-origin recovery must point
to an inventoried protected original with the same bytes/content hash. External
recovery identifies an explicitly protected verified copy and its receipt. These
are trusted storage-owner inputs, not self-authenticating claims from a file.
A model seed alone does not prove pixel-identical reproduction.

Originals, recipes, saves, builds and models remain in protected accounting.
Pins, read leases and in-flight entries are ineligible. A sole newly generated
original needs protected retention before disposable-cache admission; the planner
must not silently classify it as reproducible. IDs and last-use sequences have
deterministic ordering, independent of locale or wall clocks.

An output binds inventory/reservation revisions and reports an advisory admit or
pause, effective scene ceiling, byte accounting, eligible proposals and shortfall.
It has no filesystem paths or executable deletion commands. A future executor
must atomically recheck revisions, copies, pins, leases and reservations before
acting. The active-play lease does not automatically provide that art-storage lock.

Unchanged boundaries: repository `assetcache` remains disposable string storage;
protected binary originals need a separate durable owner. Existing decoded canvas
reuse is not disk storage. Service-worker complete-build retention and128MiB game
pack admission remain intact; no individual build asset may enter image LRU.
No player UI/settings, storage migration, model download, service-worker route,
actual eviction or claim of art/device qualification is introduced here.

The exported `planSceneImageCacheV1(unknown)` input/output interfaces live in
`port/v2/apps/game/src/scene-image-cache-plan.ts`. Inputs describe an already known
variant, not pre-generation of an unknown image hash. Processing is bounded to4096
physical inventory entries. Duplicate IDs, candidate replacement, descriptor hooks,
unsafe counts and contradictory hash/length claims for one copy are rejected.
Same-copy reuse with identical bytes is allowed. Descriptor reads are not a claim
that JavaScript Proxy traps can be suppressed; supplied records remain caller data.

Verification: [first frozen run](cache-plan-controls-01/RESULT.json) PASS,24 focused
Vitest cases, all3 V2 TypeScript programs and root validation. All7 recorded input
hashes remain unchanged, including the legacy HTML. Root still reports1010 named
renders, zero boot errors and all50 original fingerprints. The outcome ruler checks
selected physical blobs against both actual inequalities, and rejects too few
removals or substitution of protected model bytes. Positive/restored controls prove
flags and evidence do not cause blanket rejection. No browser run is needed for
this pure unmounted owner. This is not full changed-head admission.

Independent source review corrected contradictory external-copy assertions before
the first execution. The original proposed implementation never deleted files;
its review finding is retained here. Only24 focused cases were run once; no failed
execution or unchanged retry occurred in this batch. Existing failed evidence from
other batches remains intact.
