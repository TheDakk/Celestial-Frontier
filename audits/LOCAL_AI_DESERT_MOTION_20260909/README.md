# Desert living-painting preview — September 9, 2026

Nick requested animation of the newly generated alien desert. This is one bounded ambient-motion
study; broader game development and integration remain paused. Source is the exact untouched local
model PNG from LOCAL_AI_DESERT_TEST_20260909, SHA256
4a2acc4a36809347e1948a46d5d839cfc60989b9245c682e102da7c0b0a52a65.

index.html renders that immutable painting as a WebGL texture: periodic camera overscan, subtle
heat distortion restricted to distant terrain, translucent moving sand veils and45 seeded dust
particles. The12s loop uses deterministic time/seed. Bodies, legs and wings have no articulated
rig; no creature layer or inpainted background is claimed. This is code-driven ambience, no new
AI inference/image service and no alteration of the source PNG. It does not make the entire image
animation-ready, establish per-biome game integration or change the approved still landing default.

The standalone preview includes Play/Pause and honors reduced-motion. Independent read-only review
caught two issues before capture: seeking now updates the internal clock, and persisted pagehide
pauses while retaining GPU resources for a back/forward-cache return. Normal pagehide releases
resources. Exact native back/forward cache behavior is not itself certified by that source fix.

capture.mjs syntax and extracted inline module syntax passed. Native browser capture checked
first/quarter/loop frames, actual pixel change and identical loop endpoints, including frozen and
broken-loop refusal controls. It also checks the separate preview's reduced-motion state, trusted
Play/Pause and390px layout. These are scoped preview observations, not game Glass or phone hardware.
The full output is1024x576,24fps,288frames,12sH.264 MP4; a640px-wide GIF is a compact preview.
All frames are rendered from the same native canvas at explicit times, not interpolated AI motion.
FFmpeg/ffprobe9.0.1 observed; same uninterrupted-session startup receipt reused. Shared toolchain/
workspace locks and isolated native browser outside Seatbelt. No model/tool/dependency download.

Raw start/result receipts, source/frame hashes, browser identity, two inspection frames, phone
preview screenshot, FFmpeg log and encoded outputs are retained. No hosted action, schedule,
production version or game source change. One capture attempt; first failures are retained.

Codex returns to pause; new preview and existing integration remain local/uncommitted. GitHub
step NONE: PR42 parked Draft/unlabeled, base develop/source openai/mac. Claude need not open now;
this bounded preview joins the accumulated local handoff. No develop/main/live-site change.

## Actual result and inspection

PREVIEW_RENDERED. H.264 MP4 is1024x576,24fps,288frames,12.000s,3776020B;
SHA256a993c3fbc4773d7fab736c887684b028b7ab6d9a8d4fe813541188ab6d5baf7c.
The640x360 GIF preview is6586063B (larger despite reduced dimensions because of its format),
SHA2566d8914eae2c0e2a80b9d02fb47da6090400373cc74f9c01fb4852ab2e05080f4.
First and12s endpoint hashes match exactly;3s frame differs. Frozen and broken-loop negative
controls both refused; restored native observations pass. The encoded video metadata matches.
Sources unchanged, zero collected browser exceptions/crashes; isolated browser/server/lock cleanup
passed. Reduced-motion pauses; trusted Play/Pause succeeds;390px preview fits with a44px control.
This is simulated viewport evidence, not physical-phone/GPU/thermal qualification.

Inspected0s/3s native frames and the small viewport screenshot: source orientation/palette and
creature composition retained; slight camera drift and fine atmospheric distortion are visible.
Dust and heat are intentionally restrained. The shader uses approximate screen-space masks, not
true scene depth; some plant-edge distortion can occur. Creatures remain painted in fixed poses;
walking, breathing, wingbeats and anatomical deformation are not implemented or accepted by this
preview. No extracted body layers, hidden-background reconstruction, animation model or universal
rig has been added. No full game battery was run for this separate audit-only media artifact.

The MP4/GIF are convenience preview exports; the original source PNG is unchanged. This motion
study does not waive the desert image's previously recorded art-quality/style limits. Broader
work returns to pause; Claude handoff/ROADMAP preserve this new scoped result, with no hosted step.
