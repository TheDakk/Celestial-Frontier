# C132 Alligator faint-ground audit — candidate remains held

This packet is an **audit-only continuous head/neck candidate, not a complete repair**. No runtime source, painting, binding, support, ground line, joint limit, timing, outcome or certificate changed. No native job ran. The source fit is the exact C136 Alligator captured by Claude; the five copied originals and their hashes are retained in `input-manifest.json`.

The source painting's head and jaw use flexible skin with mixed weights across several bones: none of their 88/85 contributing field vertices is pinned. A head-point or rigid head-box check would therefore measure the wrong geometry. `paint-publication.mjs` uses the existing observed contact solver → skeleton → compiled skin field → ARAP → part interpolation → rigid-parent correction → shape guards. This fit declares zero rigid-parent groups; the owner still executes that correction stage. `runtime-parity.json` independently confirms exact byte parity with the **actual Node-loaded CreatureRigV1**, all 31 published parts and 4,684 coordinates, at eight original/candidate poses. Its custom decoded texture avoids browser/GPU work; it is not a native rendering receipt.

The retained original fails: the jaw mesh reaches **118.849 source pixels below ground**. At the captured 1024×576 stage scale its extreme is y=493.269 against ground y=449.28. Positive-alpha source-pixel tracing separately finds 3,805 jaw pixels and 2,030 head pixels crossing the line; the deepest opaque jaw pixel reaches y=488.689. Mesh extents and visible pixel evidence are reported separately.

The offline author derives one constant **0.353515625 gain** for the complete neck/head curves from the available painted clearance. Final authored neck/head excursions remain nonzero (about 8.84°/10.61°). Every other curve, root offset, phase, ease, key time, secondary, limit and planted-support contract stays exact. The measured minimum head/jaw/neck clearance is **2.017 source pixels** (0.747 stage pixels). `original-faint.json` retains the failing curves; `candidate-faint.json` is bound to this record and binding only. Never copy this numeric gain to another fit or species.

`candidate-report.json` measures 5,070 published frames: original and candidate, each standalone plus the actual `sampleTurn` target layering in both facings, on a 1 ms grid across the 840 ms faint with explicit settle/end neighbors and the exact captured held time. It uses the captured turn beats and stage stands; the two target seeds exercise their actual idle clocks. Foot publication drift is unchanged, below 0.016 source pixels in these samples. The curves are continuous by construction, but a finite grid is **not** a mathematical all-times guarantee or qualification of every possible idle starting phase. The author requires 1,394 full publications, roughly 0.9 seconds in Node here; its full-skin dependency and per-card cost are deliberately not introduced into runtime.

Two independent defects still block the whole creature:

- **Held-pose detached fragment:** a spine-owned, 619-positive-alpha-pixel connected component at source x895–937/y712–749. Of these, 354 pixels cross ground; the deepest is source [928,749], atlas [763,266], face 569, at stage [674.138,456.615] on the right. The lowest nearby mesh uses field vertices 1131/1130/1132, each rigidly weighted to spine and pinned. The fragment is identical before and after the head candidate; zeroing neck/head cannot repair its ownership.
- **Tail during actual idle fade:** at faint elapsed 284 ms, tail3 part vertex 19 (faces 20/21; field triangle 1157/1158/1159) reaches 37.448 source pixels below ground for the left target seed and 61.456 for the right target seed. These are published mesh findings; this packet does not claim a separate opaque-pixel count at that tail frame.

All four 1254×1254 held-pose diagnostic PNGs were inspected at original size. The candidate raises the snout, while the foot-like detached component, several other small separated pieces and visible body/neck seams remain. **Visual verdict: HELD.** These images rasterize the actual published triangles over a neutral background with the runtime's existing opaque seam-padding plan. Nearest-neighbor software sampling differs from Pixi's native filtered rasterization; they are diagnostic images, not native visual acceptance.

Five focused controls pass. They retain exact safe short/long-neck **analytic fixture** curves, catch a lower jaw that the head centre misses, preserve complete-curve timing, refuse impossible clearance, distinguish positive-alpha paint from empty crossed mesh, and preserve independent ownership of overlapping source rectangles. These analytic controls do not qualify additional real creature fits. The real retained original is the failing publication control, and the candidate's remaining whole-paint failure is intentionally asserted.

Next work should repair the source-owned detached component through the existing reviewed painting/island workflow and address the tail's full layered excursion, then derive a fresh geometry-bound candidate on that new binding. Any production authoring integration needs a bounded source-bound contract/cache design and real safe-fit controls; this packet does not add one. Native review remains a separately reserved epoch after a complete deterministic candidate exists. Parent owns signing, mailbox and ROADMAP delivery; Claude receives the source attribution through the normal mailbox, with no Dakk relay required.

PowerShell reproduction from the owned lane (local deterministic checks only):

```powershell
Set-Location ~/Projects/celestial-frontier-openai-mac
node --test audits/C132_FAINT_GROUND_20261002/curve-candidate.test.mjs audits/C132_FAINT_GROUND_20261002/paint-pixel-trace.test.mjs
node audits/C132_FAINT_GROUND_20261002/verify-candidate.mjs
node audits/C132_FAINT_GROUND_20261002/runtime-parity.mjs
```

The dense verifier reads the exact report in `~/Projects/celestial-frontier-anthropic-mac/audits/G1_AUTO_AUTHOR_20260926/native-g2c136/03-alligator/report.json` read-only and refuses if its hash changes. All five copied input hashes and the named source-owner hashes are checked at both boundaries. Free disk was 135 GiB at this batch's start; the final check is recorded in `validation.json`.
