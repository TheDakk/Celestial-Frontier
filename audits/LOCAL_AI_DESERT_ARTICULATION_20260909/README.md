# Articulated desert prototype — September 9, 2026

Nick clarified that the requested scene should show the armored creature walking, the bat flying,
the lizard running and plants swaying. The earlier ambient-only preview did not meet that request.
This isolated scene-specific prototype addresses those four motions. Broader game work remains
paused. No canonical species, genomes, biome mapping or accepted game UI placement is modified.

Original source: ../LOCAL_AI_DESERT_TEST_20260909/raw-output.png,1024x576, SHA256
4a2acc4a36809347e1948a46d5d839cfc60989b9245c682e102da7c0b0a52a65.
The original local model generated the still painting; it did NOT generate animation or rigs.
Background-clean.png was prepared with the built-in image editing tool, removing three animals,
plants, their shadows and footprints while retaining the desert composition. This is developer
asset preparation using the image service, not evidence of an entirely local production pipeline.
The original and repaired plate remain separate files; the original image is untouched.

Motion is locally authored Canvas2D textured cutout/mesh animation. Parts sample original pixels;
manual polygon masks define their visible silhouettes. Grazer and small-creatures modules own
scene-specific body/limb/wing transforms and travel. Plant carriers bend with height above fixed
roots. The parent renderer composes these over the repaired plate, with shadows and light dust.
No local video model, automatic anatomy extraction, universal procedural skeleton adapter or game
integration is claimed. Hidden surfaces and occluded tails cannot be recovered from original pixels.
Explicit approximations, visual findings and exact native capture evidence will be retained below.

Same uninterrupted-session startup receipt reused; OpenAI/Codex macOS/openai/mac owned checkout,
existing FFmpeg/ffprobe9.0.1. Shared toolchain and checkout leases; native isolated browser outside
Seatbelt. No new model/dependency download, hosted action or schedule. Pending broader integration
remains uncommitted/unverified; these new authoring artifacts are also local/uncommitted.

GitHub step NONE: PR42 stays parked Draft/unlabeled (base develop/source openai/mac). Codex returns
to pause after this preview; Claude need not open now. Accumulated handoff will link this result.
