# Canonical Earth surface turn — 2026-09-08

Nick approved the painted space/creature direction and authorized starting local art and
animation implementation. This first bounded renderer proof separates canonical surface color
from illumination: optional `?planetturn=1`, exact home galaxy999/Sol424242/Earth133 only,
18 seconds of gentle axial yaw and settlement, maximum0.22 radians. Existing `surfaceColor`
is not periodic in longitude, so this is not a full360 rotation or a newly painted asset.
The existing cloud layers remain independent. Motion/Effects off retain the standard globe;
hidden views pause; leaving the scene retires worker, canvas, texture lease and mesh buffers.
One shared shader program/uniform-group remains intentionally application-owned, bounding
Pixi's native program cache through repeated entry. Browser players require no authoring tools.

Root confirmed openai/mac, HEAD837db4aaa0ef5d3d8bffc79c70f62dcc2503032d,38ahead/0behind.
Reuse uninterrupted startup receipt TOOLCHAIN_STARTUP_20260907; no dependency updates/additions.
Preserve the654-file painted-direction recovery and all prior source/audit packets. Signing
still awaits restoration evidence; no retry or unsigned fallback. Local implementation and
isolated browser checks only: hosted authority/attempts/cost0, budgetUNFROZEN/PUBLIC, private3000.
No develop/main/release/deployment or Claude synchronization action.

Before tests, independent review caught Geometry.destroy's default retaining vertex buffers
and per-entry GlProgram/UniformGroup allocations accumulating compiled native cache entries.
Corrections: destroy owned geometry with buffers; reuse one app-owned program+uniform uid,
destroy per-view shaders without that program; release all other owners even if a destructor
throws and retain the error. Worker field is cleared before termination; late callbacks refuse.

Run the current browser-free develop profile and root validate once under the shared lock,
then a scoped native phone/desktop renderer proof on freshly built immutable evidence bytes.
Stop first red, preserve it, diagnose before any bounded correction. This is not full admission,
physical iPhone qualification, art acceptance or a full-universe/creature animation claim.
