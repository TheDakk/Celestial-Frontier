# Claude complete review of openai/mac — executive summary (2026-09-10)

Reviewer: Claude (Anthropic) from `anthropic/mac`. Reviewed target: Codex worktree `openai/mac`, signed HEAD f6eed9b4 (124 commits ahead of `develop` c1791e21) plus its uncommitted working copy. Read-only: no source in either worktree was changed, no tests, builds, browsers, model runs, fetches or GitHub writes. This packet is the only write, on `anthropic/mac`, committed locally and not pushed.

Documents: [ART_KIT_INTEGRATION.md](ART_KIT_INTEGRATION.md) (Nick's Art Kit v3, stored verbatim at the repository root as `ART_KIT.md`, mapped onto the codebase with ten reconciliations and program version 3), [CODEX_HANDOFF.md](CODEX_HANDOFF.md) (copy-ready resume instructions), [FULL_REVIEW.md](FULL_REVIEW.md) (Parts A to K, including the consolidated defect and optimization registers in Part K) and [FIRST_PASS.md](FIRST_PASS.md) (the morning pass, superseded where the two differ).

## Direction lock

Nick's art direction is unchanged by this review. As of 2026-09-11 its canonical statement is `ART_KIT.md` (version 3), stored verbatim; the earlier recommendation to write a style paragraph is satisfied by the kit's section 2. The approved Living Worlds triptych and Earth full landfall set the finish; the descriptive style text in `ART_DIRECTION.md` is canonical and deliberately does not name its inspiration; landfalls are large cohesive still paintings of multiple canonical organisms sharing light, atmosphere, contact and overlap; Earth species keep named anatomy; universal objects share the finish; battles move to articulated 2D rigs later. Every recommendation is a means to reach that target in a browser and to remove defects and waste.

## What was reviewed

Of 1,858,030 inserted lines, 1,779,642 are audit evidence. The reviewable change is 21,080 source lines, 17,606 test lines and 34,251 markdown lines. Eleven read-only passes read every changed source, test and non-audit markdown file in full (one Blender script about 60% line by line); the evidence was checked mechanically: hash claims (53 checked, none false), result statuses, the archive-verbatim law (52 of 52 blocks preserved), the pause inventory (four docs drifted after sealing), licensing (Apache-2.0 and MIT throughout) and repository size.

## Verdict

Construction quality is high and consistent: refusal-before-write state machines, exact hash binding of every artifact, negative-controlled tests, honest first-red retention, clean determinism, intact save shape, sound resource lifecycles. The direction is right. The batch spent most of its effort on the perimeter (delivery, storage, transactions, contracts, packs, diagnostics) while the finish and the per-subject fidelity, which decide whether painted landfalls succeed, moved little. Forty-seven confirmed defects and four plausible ones are registered; most are small. No merge of the accumulated head as one unit: split it into the production-facing UI tier, the `?localai=1` gated game tier and the research tools, and admit the first on its exact head under one authorized hosted attempt.

## Art: how to get the best version of the approved direction

1. **The reference images are steering the model away from the target.** The six per-species references are studio specimen plates on a flat matte, and the model reproduces that finish: the six-reference output is a flat storybook illustration, while the fungal test, conditioned on one full-scene reference at the target finish, came closest to the approved paintings. Repaint the six references in situ at the approved finish, add one style-anchor scene reference, and pre-fit references offline (this also closes a cross-browser determinism hole and removes 9 MB from the pack).
2. **One canonical style paragraph.** The four prompt families carry the art-direction vocabulary unevenly; the compiled landfall prompt spends most of its 452 tokens on anatomy and percentage anchors the model ignores, and its only finish clause says "restrained detail". Lift the existing description into one paragraph, brand unnamed, and use it verbatim as the preamble of every prompt: references, landfalls, Compendium portraits, universal objects.
3. **Fidelity needs a pipeline shape, not a better prompt.** The graph has no box, mask or count input. Let the deterministic painter draw the composition (exact species, counts, placement, identity for any world) and let the model finish it with a low-strength image-to-image pass that adds painted light, material and atmosphere. This makes anatomy exact by construction, removes the need for a per-world prompt compiler, and lets the model shrink with the device. Unfreeze steps, seed and size first (byte-frozen in three owners) and run one sweep.
4. **Distance to target, honestly.** Composition, light and cohesion can reach the approved paintings. Fine material detail will stay softer on-device until the engine port runs a larger finisher natively. That is a fact about the models, not a change of goal.
5. **The rest of the game must join the painted language.** Protostar, magnetar, trinary companion and the Earth turn are procedural vector ports of the legacy renderer; the livingvista study composites vector sprites over a painting. Do not extend them; painted skyboxes and planet discs become cheap once the finisher exists.

## Speed and phones

Measured on the M4 Pro, one painting is text 12.5 s, reference encode 1.1 s, denoise 51.8 s, decode 4.3 s with block32; six references took 136 s; the portable model is about 3.5× slower on denoise, which with GPU contention from the render loop explains the in-game 600 s timeout. Levers in order: keep sessions warm (a fresh worker per stage and six VAE encoder builds per painting today); precompute text embeddings so no text encoder ships; per-organism passes (attention is quadratic in tokens); start on orbit arrival and show the painter's painting instantly; throttle the Pixi ticker while drawing; measure a Q4 transformer; never below four steps.

Phones: a 6.23 GiB download inside a browser tab is an installer, and ORT Web stages each weight file through JavaScript memory before the GPU sees it. One probe run on the real target iPhone (`maxBufferSize`, `shader-f16`, memory at transformer load) should gate all further delivery work. The tiered design (painter everywhere, a small finisher where the device qualifies, Klein on capable desktops, gated by measured capability rather than user agent, one codebase with tiers as data) keeps "no installation" true and ports to the engine unchanged. The uncommitted block32 OPFS storage layer should be replaced by in-worker expansion: the 347 MB derived file is a pure four-times expansion of 87 MB of parent bytes.

## Gameplay

Discovery is the strongest pillar and the painted landfall is the right investment. Collecting and breeding are complete and audited; their gap is presentation, so Compendium portraits should go through the same finisher. Battles are the weakest pillar against the vision: combat math is deterministic and tested, presentation is a portrait sliding on a div, and family rigs are unstarted apart from a reusable IK solver and a Civet-only mesh. Do not build rigs in the browser beyond one proof per family; build battle staging (painted backdrops from the landfall, scale and overlap, camera push-ins, hit flashes, cues), which reaches the intended feel sooner and ports. Sharing needs a view-only envelope carrying pixels plus provenance.

## Sound

The runtime is solid: 25 ms/90 ms duck contract verified by an independent observer with negative controls, rights recorded consistently across three owners with matching hashes, a bounds-checked WAV parser, no leaks. Gaps: no human has listened; pilot music is opt-in behind a query flag and any gameplay gesture cuts it; decoded audio is held twice per play; two 4.6 MB uncompressed WAVs and the rest of the pilot assets are precached on every phone install. One listening session on headphones and a phone speaker, convert to Opus or AAC, exclude study assets from the install.

## Bugs and waste (see Part K for all 47)

Highest impact: View from Notifications can perform a landing and start a new GPU job; Stop model preparation reports an error; the originals store poisons itself after one failed open; about 6,700 panel rebuilds per install; an inert desktop panel-anchor CSS block of the kind that cost two releases; notices that sit "Awaiting checkpoint" with no Mark read after a product action; the Charters opener hidden whenever a surface is open; a corrupt model install that the UI cannot recover; four unit tests taking the exclusive checkout lock (the real cause of the "duplicate checkout lock" aggregate failure); ten load-bearing files untracked so a clean checkout cannot start any preview runner; tracked evidence grown from 79 MB to 766 MB with full-history CI clones; about ten stale documentation claims; and a new standing authorization in `AGENTS.md` for automatic tool installs, which is Nick's decision.

## Ordered program

Superseded by program version 3 in [ART_KIT_INTEGRATION.md](ART_KIT_INTEGRATION.md); kept here for the record.

1. Canon the style paragraph (half a day).
2. Repaint references in situ, style anchor, unfreeze steps and seed, one sweep, then the painter-to-finisher pass on desktop (two to four days). Sets the reachable bar and proves the architecture.
3. iPhone probe (half a day).
4. Fix the defect register's shipped-defect class: the ten integration items, the CSS block, the notice drain, the Charters opener, the checkpoint refusal, the four lock-taking tests, the untracked files (one to two days, all small).
5. Artwork durability: persistent-storage request and status, add-to-home-screen prompt on iOS, PNG export via the share sheet, protected originals in any eviction, labelled regeneration on loss (FULL_REVIEW Part I5a). Today originals live only in origin IndexedDB and the browser can evict them; the discovery is never lost, the exact pixels can be.
6. Prune and split: study assets and WAVs out of the pack, dead modules deleted, query-lane sentences out of release notes, bulky evidence out of history, PR42 split; admit the production tier on its exact head.
7. Tier 1 finisher on the real phone; tier policy, quality setting, crossfade, precomputed embeddings, warm sessions, start-on-orbit.
8. Compendium through the finisher; battle staging; living-painting layer effects; the listening session.
9. View-envelope sharing.

Everything in this program transfers to the engine: the style canon, recipes, tier policy, painted assets, identity contracts and the fixtures that prove parity.
