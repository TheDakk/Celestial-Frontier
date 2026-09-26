# Procedural battle iteration — 2026-09-16

## Delivered

Local preview: http://127.0.0.1:49816/procedural/ . Four ten-second films: three new,
actually generated quadrupeds beside their source pixels, and the revised fish/bird encounter.
No kit, master, combat outcome, source genome, main.ts, sibling worktree or GitHub changes.
This is a dirty-source diagnostic with source hashes, not production certification.

The mixed-scene hitstop formerly stopped the attack sample but allowed locomotion and travel
to continue. `battle-presentation-clock.ts` now subtracts compiled hitstop from every body
channel. Ambient water/UI use presentation elapsed time. Both turn roles have native geometry
and placement equality checks inside hitstop; the unit control demonstrates the old raw-time
motion still moving. Seeds and world generation never use either presentation clock.

The family review now supplies the actual genome to the body-card compiler, scales sparse
source canvases by their visible silhouette, and blends idle/approach/attack/recoil. Its gate
samples the assembled presentation as well as individual clips. Earlier unblended native-1
is retained; the final first-creature film is native-1-polished.

## Actual procedural trial

The deterministic search examined 272 seeds from [10000,15000), taking the first three distinct
supported body genes. Exclusions are explicit in painter-01/report.json: 167 other painters,
58 extra-leg bodies,43 unsupported tails,one non-land creature. No creature was hand-edited.
These are three four-leg/banded-tail examples, not a universal generator acceptance claim.

| Seed | Body gene | Actual painted material | Parts | Atlas | Native film |
| --- | --- | --- | --- | --- | --- |
| 10032 | 11 | crystalline | 21 | 550×186 | native-1-polished/family-10s.webm |
| 10052 | 12 | fur | 20 | 597×171 | native-2/family-10s.webm |
| 10271 | 13 | fur | 21 | 616×245 | native-3/family-10s.webm |

The winning painter emitted masks and landmarks. Observation changes zero channels in the
normal 440-square paint. Records retain complete genomes, source material and hash-bound
original PNGs. Native alpha bypasses the magenta keyer. One pinned atlas per creature preserves
all part bytes; exact rest and final rest differ by zero channels. No per-creature clip edits.
The procedural exporter is a dated bounded experiment (its source audit path is explicit),
not yet a general game asset-export service.

## Evidence

Each final procedural native report:484 individual clip samples and601 assembled-sequence
samples pass source joins and strict shape checks; deliberately separated mesh fails. Each
pure sweep also passes484 samples. Films are608/606/607 frames,10.116956/10.100190/10.116769s;
about60fps. Inclusive rig update p95 is0.4ms for each, whole-frame CPU p95 is0.6ms.

`native-habitat-01/report.json`:1,202 creature pose samples pass complete mesh containment and
source joins, both hitstop roles freeze exactly, oversized-body control refuses.607 frames,
10.116818s,about60fps; fish/bird update p950.9/0.6ms, whole-frame1.8ms.

`tests.txt`:36 focused tests pass. `typecheck.txt`:game TypeScript check passes.
`root-validation.txt`:root validation, Earth painter/biome guards and deterministic fingerprint.
Compiled native preview bundles are outside the repository; see compiled-preview-retention.json.

## Visual limits and next work

The films prove actual generation→observation→atlas→shared motion for three inputs. They do
not prove final painted procedural art, correct movement for every species, planted paws,
changing head views, variable appendage counts, all locomotion families, ordinary-game
integration or physical-phone performance. At enlarged scale, fine silhouette aliasing and the
source-painted shadow moving with the body are visible; neither is hidden by numerical PASS.
Bird opponent-facing flight and Frog contact remain open from the preceding package.

Next: separate source shadow from body motion without altering accepted rest pixels; improve
edge sampling with an image-based control; complete masks/landmarks for further painter owners,
then qualify real aquatic/airborne procedural generations and variable-count anatomy. Continue
to use habitat admission rather than assigning fish to land or air to every unknown creature.
Nick owns visual acceptance. Claude needs only REVIEW_PROMPT.md and the named evidence when
Nick chooses review; no app switch or branch integration is needed now. PR42 remains parked.

Signed checkpoint:73b93592. See CHECKPOINT_STATUS.md. Review ZIP in review-bundle.json
contains the prompt, code, source records, receipts and four MP4s below30MB. The first embedded
gallery crashed; a single-player selector recovered and playback was observed (PREVIEW_CHECK.md).
