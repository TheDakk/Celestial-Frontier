## Workspace identity — verified

| Check | Value | Expected (PARALLEL_GIT_PROTOCOL.md:16) | |
|---|---|---|---|
| Physical cwd | `/Users/nick/Projects/celestial-frontier-anthropic-mac` | same | ✅ |
| `git rev-parse --show-toplevel` | `/Users/nick/Projects/celestial-frontier-anthropic-mac` | same | ✅ |
| `git branch --show-current` | `anthropic/mac` | `anthropic/mac` | ✅ |
| `origin` | `git@github.com:TheDakk/Celestial-Frontier.git` | same SSH origin | ✅ |
| Platform / HEAD | Darwin arm64 / `c860f57f` | Anthropic·macOS | ✅ |

No `cd`, branch switch, fetch, merge, copy or config change was performed. Working tree untouched.

**Reviewed head: `8bdbea9a65b1f64c09906fd99589d75e5d8bc50a`** ("Prototype queued landfall progress and verify fixed-shape inference"), tree `fc7cc269`, parent `ff1669a2`, authored 2026‑09‑09 08:35:45 ‑0400. Read via `--git-dir` on the Codex worktree object database only. The commit carries an SSH signature block; I could **not** cryptographically verify it (`gpg.ssh.allowedSignersFile` is unset in my workspace) — I confirmed the signature is present and the object graph matches what the handoff claims, nothing more.

**I ran no tests, no builds, no browser/renderer, no hosted Actions, no fetch/push/label/merge, and wrote no files.** All findings below come from reading immutable Git objects plus four evidence images/JSON read in place from the Codex directory.

---

## Scope

**Inspected (source, at `8bdbea9a`):** `ROADMAP.md`; `audits/CLAUDE_DIRECTION_REVIEW_20260909/{HANDOFF,BATCH_RESULT}.md`; the whole `tools/local-image-generation/` owner set (`landing-progress.mjs`, `browser-proof.{mjs,html}`, `stage-worker.mjs`, `pipeline-math.mjs`, `denoiser-shapes.mjs`, `q8-block32.mjs`, `proof-server.mjs`, `landing-ui-evidence.mjs`, `model-manifest.json`, test name inventories); `port/v2/apps/game/src/{landfall-appearance-snapshot,scene-image-cache-plan,earth-layered-recipe,painted-vista-load,combat-battle-scene}.ts`; `packages/art/src/earth-resident-plan.ts`; the audio ducking diff in `packages/audio/src/runtime.ts`; `main.ts:6130–6290`; the `release-content.ts` diff; `.gitignore`; commit graph vs `c1791e21`. Evidence read as data: `raw-output.png`, `03-earth-full-landfall.png`, two UI screenshots, `progress.json`, `VISUAL_REVIEW.md`.

**Not inspected:** the ~4,000 audit artefacts and generated bundles (per instruction); the bulk of `main.ts`'s +658/−49 diff; U1/U2 UI sources and their sheets; `glassmatrix.mjs` / `slicesmoke.mjs` (+2,000 lines); Blender/creature authoring scripts; `tame-greeting-audio`, `notification-history`, `pilot-*`, `sheet-layout`, `planet-surface-*`; audio rights data; every test body (I read test *names* and a few assertions, not implementations). No claim is made about those.

---

## Findings, by severity

### S1 — blocks the stated goal

**1. The retained visual review's central "improvement" does not match the artefact it describes.**
`VISUAL_REVIEW.md` states "this output has one coherent Civet and one tail inside the frame" and the independent reviewer's first bullet is "Civet has one coherent body and ringed tail." Reading `fixed-shapes-1024-01/raw-output.png` directly, the middle‑right subject reads to me as **two fused heads on one spotted body** — two distinct muzzles, two pairs of ears, two eye pairs, with a single ringed tail. The same shape is visible in `ui-complete-phone-layout.png`. I am reading a downsampled raster, so I state this as a strong observation rather than a certainty — **but it must be re‑checked at native 1024×576 before the record stands.** This matters disproportionately: "one coherent Civet" is the evidence used to justify the `--identity-only` direction over the dual‑reference recipe. If the head is duplicated, the duplication defect that was "explicitly rejected" at 480 tokens was not fixed, it changed form, and the direction it justified is unsupported. This is exactly the PROCESS_LAWS failure mode — a review that came back clean on the very case it was written for.

Everything else in that review I independently agree with, and would add: the Persimmon foliage is **pinnate/compound** (ash- or rowan-like), not the broad simple oval leaf of a persimmon — a species-level miss the review softened to "narrow foliage… suggesting generic citrus"; the Platypus has **no bill at all**, not a "partial muzzle cue"; the rain reads as overlaid white diagonal strokes rather than integrated atmosphere. Cranberry and Frog are genuinely decent. Composition, palette, contact shadows and depth are ~70% of the reference; material/micro-detail is well under half.

**2. There is no genome → conditioning compiler. The pipeline cannot generalise past one world, and nothing in this batch moved it toward one.**
The prompt is a hand-authored English paragraph hardcoded at `tools/local-image-generation/proof-server.mjs:11` and `:14`, naming "Civet… Platypus… Persimmon… Devil's Club" with anatomy written by a human. The canonical snapshot is validated (`proof-server.mjs:32–40`) and then attached to the recipe as **provenance metadata only** (`:45–47`) — `request`, `roster` and `appearanceSnapshot` are never read to construct `identityPrompt` or `chatPrompt`. `landfall-appearance-snapshot.ts` and `earth-layered-recipe.ts` are byte-exact gates on one frozen JSON literal (`earth-layered-recipe.ts:12`, `:16`, `:65`, `:74`) — by construction they admit exactly one world. So the honest description of the current state is: *a hand-written prompt for one scene, with a rigorously verified provenance envelope around it.* The envelope is good work; it is not progress on the hard problem. Meanwhile this batch spent its budget on progress bars, ETA calibration, cache arithmetic and a 1.31% kernel experiment. **The descriptor→conditioning compiler and species fidelity are the only two things standing between here and Nick's goal, and neither was touched.**

**3. Delivery is arithmetically incompatible with "browser PoC, no installer, mobile-first."**
From `model-manifest.json`: the runtime graphs alone are **6,675,137,531 bytes (6.22 GiB)** — text encoder 2.04 GiB, transformer Q8 3.85 GiB, VAEs 0.31 GiB — plus the block32 derivative's +336 MiB. Retained host RSS peaks at **3.05 GiB summed process RSS** at ~11.8 s (`progress.json`, text-encoder stage), excluding GPU memory. `stage-worker.mjs:40` hard-requires a non-fallback WebGPU adapter with `shader-f16`. That combination is not deliverable to an iPhone under any current Safari/iOS memory or WebGPU feature budget, and a 6.2 GiB first-run download is not a "no separate installer" experience — it is an installer wearing a browser costume. This isn't a defect in the code; it's the load-bearing assumption that needs an explicit decision from Nick. The honest framing is: *the browser proves the pipeline; a shipped local generator on phones needs a model one to two orders of magnitude smaller, or generation must not happen on the player's phone.*

### S2 — real gaps that will bite at the gameplay hook

**4. The cheapest untried quality lever is the step schedule, and it has not been swept.**
`pipeline-math.mjs:50–58` implements Diffusers' `compute_empirical_mu` as a linear interpolation between a **10-step** fit (`m10`, line 55) and a **200-step** fit (`m200`, line 53). The recipe runs `steps: 4` (`proof-server.mjs:42`), i.e. it **extrapolates below the fit's calibrated domain**. The retained sigmas confirm the consequence: `[1, 0.9622, 0.8947, 0.7390, 0]` — three steps spent in a narrow high-noise band, then the entire remaining trajectory collapsed in one jump from 0.739 to 0. Nearly all structure is decided in the final step. That is a textbook mechanism for exactly the failures observed: fused/duplicated heads, missing diagnostic anatomy, generic foliage. ROADMAP records "no seed sweep, no reroll"; there is likewise no step sweep. If Klein is distilled for few-step operation this may not help — but it is one afternoon to find out, at 4/6/8 steps × 2 seeds, and **the queued-landing UI you just built is precisely what makes a 110 s generation acceptable.** Do this before concluding the model class is inadequate.

**5. The only storage budget tool excludes the largest consumer.** `scene-image-cache-plan.ts:7–12` caps the scene cache at 500 MB / 1 GB / 2 GB (desktop override ≤ 5 GB), while `:59–60` states "Development filesystem model caches must not be charged to origin usage." In a real deployment the model lives in the origin (Cache API/OPFS) and *does* count against quota — 6.2 GiB against a 2 GB planning ceiling. The planner's arithmetic is sound but it is budgeting the wrong resource.

**6. The planner cannot admit a genuinely new sole original.** `scene-image-cache-plan.ts:266` pauses with `protected-retention-required` unless `hasSurvivingCopy(input.candidate, …)` is true, i.e. unless the candidate already has a verified protected copy elsewhere. That is the correct *policy* — but it means the planner's `admit` path is unreachable for first-ever artwork until a protected-original store exists, and that store is not in this batch. Fine as a staged contract; it should be recorded that the module cannot yet serve its own primary use case.

**7. The post-decode publication window is not cancellable.** `browser-proof.mjs:123–137` runs decode→RGB conversion→`putImageData`→`toDataURL`→`state='complete'` with no `generationController.signal.aborted` check anywhere in that span, while every other awaited boundary has one (`:57`, `:61–63`, `:87–90`, `:108`). Press Cancel in that window and you still get a published painting and a completion notice. ~100 ms in the proof; in the game the equivalent window mounts art into the live scene, so close it before the hook.

**8. `View landfall` verifies job state but not destination.** `browser-proof.mjs:148` gates on `state==='complete'`, `landing.state==='complete'` and `png` presence — nothing about which world the painting belongs to. The prototype only has one world, so this is latent, not live. The game already has the right predicate shape at `main.ts:6177–6182` (`surfaceVistaGeneration` + `ecologyEpoch` + `worldKey` + `environmentFingerprint` + nav mode/seed). The completion notice must carry a world key and re-verify against that predicate, and it must not navigate on its own. Relatedly, `createLandingProgress()` is instantiated once as a page singleton (`browser-proof.mjs:3`) — the factory shape is right for per-world instances, which is what multiworld queuing will need.

### S3 — low

9. **Failure presentation is written into a hidden element.** `browser-proof.mjs:139` sets `stageLabel:'Landing unavailable'`, but `renderLanding` (`:9`) hides `#landing-progress` whenever state isn't queued/running. The only text a user sees on a pre-plan failure is `#status` = the raw error (`:140`), e.g. `HTTP503: /recipe.json`. The BATCH_RESULT's "explicit preparation/failure presentation" is true of the state object, not of the visible UI.
10. **Duck/release skips smoothing at zero.** `packages/audio/src/runtime.ts:~1812` requires `target > 0` for `smooth`; a category whose effective gain reaches 0 hard-sets (and cancels an in-flight ramp mid-way), which is the click case the 25 ms/90 ms work exists to avoid.
11. `browser-proof.mjs:15,17` re-serialises the entire event log on every event (O(n²)) into an unbounded array — trivial at 4 steps, not at multiworld scale.
12. `landfall-appearance-snapshot.ts` and `scene-image-cache-plan.ts` live in `apps/game/src/` but are imported only by tests and one isolated tool. Research modules with no game caller inside the playable-slice tree blur the boundary; `packages/` or `tools/` is a cleaner home.
13. `release-content.ts` describes `?paintedlanding=1` / `?livingvista=1` / `?paintedvista=1` studies as player-visible bullets without stating they are unreachable without a query string.
14. **Cross-device pixel identity is unreachable with this recipe** — correctly documented at `pipeline-math.mjs:143–145`, and reinforced by Box–Muller's `Math.log/cos/sin` (`:159–160`) plus GPU accumulation order. Decide now that "share an exact discovery image" transports **pixels**, not a recipe; that choice changes the sharing design and the storage numbers.
15. `combat-battle-scene.ts:179–188` walks ancestors with `getComputedStyle` from a `MutationObserver` on `root` + `body` attribute changes — a forced style recalc per mutation during combat.

### What is genuinely well done (do not re-litigate)

`landing-progress.mjs:67–70` refuses publication unless every stage actually completed — this is "assert the outcome, not the code path" implemented correctly, and `:29–31` reserves a denominator slot so the meter provably cannot reach 1 before publication. The event-kind, monotonicity and worker `loading→loaded→outcome` guards (`:76–95`) all refuse *before* any state write. The fixed-shape experiment is properly verified, not asserted: `progress.json` shows `freeDimensionOverrides {batch:1, image_sequence:2904, text_sequence:512}` with **all symbolic dims resolved to concrete integers** in `inputMetadata` — that is the discriminator between "override applied" and "override inert," and declining to claim a speedup from 1.31 % on one run is the right call. `q8-block32.mjs:12–34` pins graph + data by SHA against parent identity with an inode/mtime re-stat. `pipeline-math.mjs` cites its scheduler source to file and line. `painted-vista-load.ts` and the `requestSurfaceVista` gates keep every study default-off behind a query string with a bounded fallback. `release-content.ts` was updated in the same batch for the player-visible v2 work, and `V2_CURRENT_RELEASE_VERSION` remains null.

---

## Feasibility against Nick's vision

**Reachable as specified:** same individual identities in landfall and Compendium (the snapshot boundary already proves the data plumbing); cohesive multi-organism static composition (the generated image *already* achieves cohesion — shared light, mist, contact, overlap — which was the hardest thing to get and it is essentially solved); accepted UI placement, determinism, saves and genome/lineage authority (all preserved, nothing regressed).

**Reachable but not started:** per-world generation. Needs the genome→conditioning compiler that does not exist. This is the whole remaining program and should be the next batch.

**Not reachable on the current path without a decision from Nick:**
- *Fidelity at reference quality.* A 4B distilled model at 4 steps, prompted in prose, is not going to reliably produce a Devil's Club with spiny canes and a Platypus with a bill. Prose is a lossy channel for anatomy. The likely architecture is prose for scene/atmosphere + **image conditioning per organism** (you already have the `references` slot, `createImageIds` reference time-coordinates at `pipeline-math.mjs:192–207`, and a working `encode` stage) — i.e. render each canonical organism from the existing deterministic species painter as a control image, and let the model do lighting/integration rather than inventing anatomy. That plays to the model's demonstrated strength and around its demonstrated weakness, and it preserves exact identity by construction instead of hoping for it.
- *On-phone generation.* See S1‑3. Options are a much smaller model, desktop-only generation, or a server. All three conflict with something Nick has stated; he should pick which constraint yields.
- *Seasons / rotation / time-specific sharing.* Correctly marked aspirational; nothing here contradicts that.
- *Shared family 2D battle rigs.* `combat-battle-scene.ts:1–3` and `:197–211` are honest whole-portrait translations, explicitly "not anatomical animation." The 15 mathematical kinematics tests do not constitute a rig. Land/air/water family rigs remain entirely unstarted — treat the current battle stage as staging polish, not a down payment on that goal.

**Architecturally, the code is in good shape.** The state machines, refusal-before-write discipline, resource ownership, negative controls and provenance pinning are of a consistently high standard — better than most production code. The risk here is not quality of construction; it is that the construction is happening around the perimeter of the problem.

---

## Merge / no-merge for `8bdbea9a`

**No merge today.** Not because of a defect found, but because production readiness is not established for this head:

- The last full battery (4,121 tests / 1 skip) certified `9bfec7dc`, seven commits back. BATCH_RESULT correctly says so. There is **no changed-head Compendium/Slice/Glass admission** for `8bdbea9a`.
- Prior reds are still open and unresolved on this line: `3a61352` small-phone instrument red, `08cd97d` / `c57aaaeb` timeouts unknown, D‑9e habitat/painter/profile conflicts, the stopped 330-file/5-FAIL aggregate.
- Finding S1‑1 puts a question mark on the batch's own art-evidence record. Resolve that before the record is carried forward.

**Distinguishing the two tiers, since they should not share a fate:**

*Gated research* — `tools/local-image-generation/**`, `scene-image-cache-plan.ts`, `landfall-appearance-snapshot.ts`. Provably unreachable from the app (no import from `main.ts`; I checked), model bytes gitignored. Safe to carry into `develop` as quarantined research **once labelled as such** and preferably relocated out of `apps/game/src` (S3‑12). It certifies nothing about the game and should not be described as if it does.

*Production-facing* — U1/U2 UI, combat battle stage, Scout landing presentation, audio ducking, Charter settlement audio, magnetar/protostar/trinary graphics, notification history, the query-gated painted studies, release-content. Merge-eligible **in principle**; blocked in practice on the admission battery for this exact head.

**Conditions for a merge recommendation:**
1. Re-verify the Civet at native resolution and correct or confirm `VISUAL_REVIEW.md` and the ROADMAP line derived from it (S1‑1).
2. Close the post-decode cancellation window and add a world-key check to the completion notice (S2‑7, S2‑8) — cheap, and they are the two defects that would become real bugs the moment the gameplay hook lands.
3. Refresh PR42's title/body for the accumulated head, then run the required battery on that exact head under one explicitly authorized hosted attempt.
4. State in the PR body that the AI/storage tier is quarantined research with `qualityAccepted:false` and no gameplay reachability.

**Recommended next batch, in priority order:** (a) step/seed sweep (S2‑4) — cheapest untried quality lever, one afternoon; (b) per-organism image conditioning from the existing species painter, which is the plausible route to exact identity; (c) the genome→conditioning compiler for a second world. Progress/ETA/cache/kernel work is now sufficient; further polish there does not move the goal.

I have not verified any of the above by execution — no tests, no builds, no browser, no hosted Actions were run, and no files were written.
