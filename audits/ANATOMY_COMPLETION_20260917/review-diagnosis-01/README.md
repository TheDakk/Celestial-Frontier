# Three requested reviews — September 19, 2026

**The two diagnoses and the three-film review are complete. No repair or visual qualification is claimed.** Nick requested all three options in the preceding handoff: Mud/Vent contact diagnosis, Persimmon fold diagnosis, and review of the three numerically passing crab films. This is that bounded batch; R3/R4/R9 and further native capture remain unopened.

Capture producer: signed `6a58e40eeb552e925c94e0173d6298c4b05303e3`. Existing evidence successor: signed `d04374362aaa0a357c5dc2791213fe277b0f4915`. Both signatures were independently verified with the configured public key and a command-scoped temporary allowed-signers file. Earlier “signing pending” text is historical, not current status. The original signer-failure receipt is preserved alongside this audit. This batch's documentation successor is not the code producer; use `git log` for its exact hash.

## 1. Mud/Vent: cause demonstrated

[Offline replay and controls](diagnosis-02.json) use the actual GSAP adapter, timeline, performance owner, contact solver, compiled skin field, ARAP and painted-part checks. All eight distinct retained failing action/presentation samples reproduce their recorded drift exactly; the duplicate `approach:scuttle` alias was not counted twice. Forty-two imported files overlap the original native source manifest, with zero hash differences. No browser was started and no CPU qualification was rerun.

The nearest tracked paint vertex is **2.118–2.540 source pixels away from the planted joint**, fully weighted to its endpoint bone and already hard-pinned. The endpoint stays planted, but the lower-leg bone rotates the offset. For source offset `d` and endpoint rotation `R`, paint drift is `(R − I)d`. That prediction matches the deformed output within **0.000025px** across the eight failures. This replaces the earlier hypothesis with actual-source causal evidence.

| Subject / sample | Measured drift | Rotation-only prediction | Paint offset |
| --- | ---: | ---: | ---: |
| Mud hit 236.25ms | 0.250474px | 0.250486px | 2.118112px |
| Mud dodge 128.333ms | 0.256468px | 0.256443px | 2.118112px |
| Mud faint 242.667ms | 0.251709px | 0.251722px | 2.164809px |
| Mud presentation 6700ms | 0.269844px | 0.269845px | 2.118112px |
| Vent approach 210ms | 0.347889px | 0.347890px | 2.540236px |
| Vent hit 210ms | 0.254967px | 0.254986px | 2.540236px |
| Vent dodge 114.333ms | 0.268688px | 0.268705px | 2.540236px |
| Vent presentation 1216.667ms | 0.329862px | 0.329849px | 2.540236px |

**Repair boundary:** bind stance to an observed painted support with an explicit offset-aware constraint, preserving anatomical endpoint/reach, source pixels and joins. A shared pose-to-skin contact constraint must define how the local support accommodates lower-leg rotation; merely targeting the anatomical joint again cannot fix this. Do not relabel rotation as noise, loosen 0.25px, add the same pins, move source landmarks, or use species gains. Prove both bone and paint outcomes and the real five-crab and affected-family sentinels before claiming a fix. No candidate was adopted here.

## 2. Persimmon: coupled foliage constraints isolate the fold

The retained failure is reproduced exactly: **84 field folds at disturb 67.1667ms**, and **209 at presentation 1200ms**. The immediately preceding sampled action frame at62ms passes, but already needs a26.66px orientation correction. At the failing action frame, the weighted target has449 folds; the bounded solver performs64 forward passes plus487,296 active-set visits and still has84 folds, with84.46px maximum orientation displacement. Presentation starts with533 target folds and reaches the same visit budget.

[Exact source-triangle ownership](fold-locations.json) locates the first failure principally in `branch-3-foliage` and `branch-4-foliage` (46/52 supporting triangles; shared triangles count in both), with2 trunk triangles. The presentation also involves groups5/6. No unresolved triangle is fully pinned: this is not proof of one all-pinned inverted triangle or a mathematically impossible embedding. It is a demonstrated failure of the coupled rigid-foliage/collar targets under the current shared bounded solver.

Bounded causal controls at the same67.1667ms, in memory only:

| Changed diagnostic input | Remaining field folds | Visible-part shape result |
| --- | ---: | --- |
| Original | 84 | Refused before publication |
| Zero local leaf3 secondary rotation | 61 | Refused |
| Zero local leaf4 secondary rotation | 76 | Refused |
| Zero both local leaf3/leaf4 rotations | 0 | Pass at this one sample |
| Zero all local foliage rotations | 0 | Pass at this one sample |
| Remove105 leaf3 rigid pins | 0 | Pass at this one sample |
| Remove88 leaf4 rigid pins | 0 | Pass at this one sample |
| Remove both sets,193 pins | 0 | Pass at this one sample |

**Repair boundary:** review the observed group3/4 ownership, shared collar geometry and inherited/secondary targets together. The current rigid regions demand incompatible-looking motion at their joined boundaries. A shared, source-relative treatment must preserve foliage shape and above-root motion while allowing the necessary collar motion. These ablations identify the interaction; they are **not proposed per-species exceptions or acceptable fixes**. Removing pins can smear foliage and zeroing motion erases intent. Do not increase solver iteration budgets or attenuate all motion to bless a green number. Any correction needs full-action shape and CPU proof; the existing Persimmon/Cranberry/Devil's Club CPU failures remain open.

## 3. Three retained films: reviewed, not accepted

Reviewed183 timestamped samples across the full retained timelines at6fps, all12 full-resolution transition frames, and the three native pinch50 stills. All1,821 encoded frames were decoded for an adjacent-frame pixel-delta census. This is explicit frame-sequence inspection, not a claim of real-time human viewing or examination of every native frame. The films contain idle → approach → pinch → hit → idle; they do **not** show the full dodge/faint/other-action cycles.

| Film | Motion/readability finding | Disposition |
| --- | --- | --- |
| [Crab](../crab-native-04/family-10s.webm) | Scuttle alternates bent/lifted legs and body loading is visible. Pinch has weak silhouette change; thin edge/streak artifacts remain around lower legs and claw/body boundaries. | Do not visually accept. |
| [Coconut](../coconut-crab-native-04/family-10s.webm) | Large near claw obscures its finger motion; dark legs lose contrast against the review background. Approach is more obvious than the pinch. | Do not visually accept. |
| [Freshwater](../freshwater-crab-native-04/family-10s.webm) | Open claws give the clearest opening/closure and legs are easier to follow. Thin boundary streaks remain at appendage/body edges. | Best readable candidate of these three, still not accepted. |

**New shared presentation defect:** every film visibly snaps backward at approach → pinch, between encoded frames225/226 (Crab/Freshwater3.767→3.783s; Coconut3.752→3.769s). These media timestamps include recorder priming; the source presentation boundary is3666.6667ms. The contact solver advances gait root travel independently of blend weight; the presentation switches to a fresh non-gait pose with zero travel. The accumulated offset disappears in one frame. The code-derived limiting jumps are **56.91px Crab,56.61px Coconut,42.09px Freshwater in the displayed study**, consistent with the inspected images. The largest pixel delta in all three films occurs at frame226. The existing pointwise shape/contact gates do not assert inter-action world-position continuity.

[Crab transition](crab-transition.png) · [Coconut transition](coconut-crab-transition.png) · [Freshwater transition](freshwater-crab-transition.png) · [timing/geometry receipt](transition.json).

The repair must preserve N11's blend-independent physical travel and give persistent stage displacement one explicit owner across action transitions. Do not fix the snap by multiplying gait travel by blend. This relates to the queued R3 solver/stage contract, but this review does not implement R3 or authorize arena/battle integration. Q1's source-painted open-gape candidates remain separately approved preparation, with unchanged originals and Nick's3× adoption review still required; none were painted in this batch.

Full-timeline sheets: [Crab1](crab-review-01.png), [2](crab-review-02.png), [3](crab-review-03.png), [tail](crab-review-04.png); [Coconut1](coconut-crab-review-01.png), [2](coconut-crab-review-02.png), [3](coconut-crab-review-03.png), [tail](coconut-crab-review-04.png); [Freshwater1](freshwater-crab-review-01.png), [2](freshwater-crab-review-02.png), [3](freshwater-crab-review-03.png), [tail](freshwater-crab-review-04.png).

## Instrument corrections and limits

- The first offline diagnostic mistakenly read ARAP's private position scratch after its rigid-rest fast path. That path publishes the target directly and does not populate this scratch, so the diagnostic falsely listed7,614 rest folds despite successful rest publication. The corrected diagnostic reads the published field for the rigid path and explicitly asserts zero rest folds. Original script/log/output are retained losslessly; use `diagnosis-02.json` for conclusions. The eight moving contact samples and84/209 fold reproduction were unchanged.
- The initial field-part labels used vertex membership and overcounted three associations. `fold-locations.json` instead matches exact source triangle triples and is authoritative for ownership counts.
- The updated standard FFmpeg has no `drawtext` filter. Frame extraction uses FFmpeg and annotations use the already verified ImageMagick. An initial montage also needed an explicit font. These preparation failures and the first derived sheet are retained; no native capture was retried and no original media was changed.
- [Source hashes](diagnostic-source-hashes-02.json), [film inputs/metrics](film-review-inputs.json), and the final provenance receipt distinguish imported code, original inputs and newly derived review artifacts. No timing from this offline replay is presented as browser performance evidence.

## Startup, checks and handoff

Official toolchain check PASS; idle FFmpeg9.0.1_1 →9.0.2, libvmaf3.2.0 →3.2.1 and xz5.8.3 →5.8.4 applied under the shared lock. Homebrew remains7.0.3; all seven capability checks PASS. REAPER's suffix difference is current according to `brew outdated`. Automatic approval review blocked the combined Node update because it classified managed Node as locked runtime; Node remains26.8.2 pending Nick's answer. No project dependency lock, browser pin or accepted source asset changed. Blender was unused.

OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac` tracking `origin/openai/mac`. Starting local HEADd0437436 was133 ahead of cached origin/openai/mac and244 ahead of cached origin/develop. These are local refs only. No fetch, pull, synchronization, SSH remote probe or GitHub write. Configured origin is `git@github.com:TheDakk/Celestial-Frontier.git`; prior recorded accountTheDakk/authentication was not freshly revalidated for this local review.

Next Codex work requires a bounded repair direction based on these findings, not another unchanged native run. Preserve the0.25px and strict<2ms gates, N1/N11/N12 and approved D1–D4/Q1–Q5. Future queue remains R3 →R4 →R9, then scoped integrity/coverage/phone gates; no visual, phone, habitat or ordinary battle qualification was added. Civet18/20 failure and the stale Compendium certificate remain open. All58 targets remain unqualified,53 without bindings.

Anthropic/Claude Code may read this report and supply the queued R9 addendum when Nick requests; no automatic message, file copy, edit or synchronization was made. No need to open Claude now merely for this handoff. GitHub step:none; PR details:not needed, PR42 parked. Budget file:UNFROZEN, last reported public visibility/private fallback3,000; zero hosted runs authorized or consumed. Develop/main/live site unchanged by this work; no release/deployment/LFS/history operation. Completed evidence/documents are signed locally; final exact commit/ahead state is reported separately.
