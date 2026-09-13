# Independent bench source and native-still review — 2026-09-08

Reviewer: Codex creature sub-agent. This agent authored the separate articulated rig and reviewed the root-owned harness/runner; this is an independent bench review, not an independent review of its own rig implementation. Scope was source reading and retained PNG inspection. No additional test, browser, video-decode, or rendering job was run for this review.

The reviewed bench reads the current preserved native canvas for motion evidence without calling pose, render, or renderer extraction. Native actions own the finite clock. The new rig retains the exact original 29-field Civet identity, connected painted projection and four planted paw support regions; the lower-left tail is no longer captured by the old full-width bottom lock. Earlier rig, assets and evidence remain separate.

The source review identified these concrete acceptance gaps, now corrected in the final harness/runner:

- Paw readability counts originally ignored channel changes of eight or less. Four nonempty paw regions now require `exactChanged === 0`; readable-motion thresholds remain separate.
- A maximum lift across frames could accept one inhale or a held crest. Acceptance now requires the first and second crests at 1,500/4,500 ms, with a measured descent at 3,000 ms. Deficient breathing controls supply the same phase inventory.
- A desktop viewport change from 1,440 to 1,410 could leave the capped canvas unchanged. The resize control now crosses the cap, requires actual canvas-width change and advancing frames/elapsed time, and preserves the active sequence and cancellation count.
- Rest pixels alone could mistake cancellation for completion. Each complete clip now requires one completion, unchanged cancellation count, the original sequence, the finite-completion reason and exact restored pixels. Stop/reset is disabled initially and after settlement.

The first native run completed its desktop motion evidence but later failed at the water toggle. The retained diagnosis was Pixi normalizing an absent empty filter chain from `undefined` to `null`. The scene owner was corrected to compare empty chains semantically while retaining ordered identities for nonempty borrowed filters. The root reports `native-filter-state` PASS after that correction; the first aggregate failure remains a failure. Root-owned test and native reports are the verification authority, not this review note.

Still inspection used `native-first/desktop-initial-creature.png`, `desktop-breathe-1500.png`, `desktop-strike-448.png`, `desktop-strike-864.png` and `desktop-environment-water.png`. The inhale visibly raises and rounds the back/chest above fixed feet. Anticipation lowers and retracts the head/chest and moves the tail outward; thrust extends the neck/head forward and upward, with the tail tip lower and farther right. No obvious disconnected joints, missing painted parts, mesh tears or folded geometry were visible in those frames.

The remaining limits are material: leg silhouettes still read mostly as four planted columns, with subtle knee/shoulder flex. Some body movement retains the appearance of a softly deformed painting. Bright whisker fragments and fine matte fringe remain. Removing the five unfinished residents improves the environment comparison, but water contact is delicate at this scale: feet read at/on shallow water more clearly than submerged, and the Civet remains warmer and sharper than the diffuse landscape.

This is improved finite articulation and local water contact for one painted view. It does not establish convincing locomotion, hidden anatomy, jaw articulation, 3D motion, final production compositing or human art acceptance. Still inspection does not establish temporal smoothness; native WebM evidence is retained but was not decoded by this reviewer. There is no physical-phone, Safari/PWA, protected-save, native-game-integration or full-admission claim.
