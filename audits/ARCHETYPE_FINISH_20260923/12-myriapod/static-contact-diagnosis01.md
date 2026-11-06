# Hit and dodge: exact first-contact refusals

The diagnostic reproduces only hit22.5ms and dodge25.666666666666668ms from fit04/static01 using the actual GSAP player, performance adapter and contact owner. Both error strings match exactly. No ARAP, paint publication, full static, S2, browser, film or altered-policy sample ran. All46 bundled source hashes stayed unchanged; applicable hashes match the retained static source receipt. The observational inserts invert to the exact runtime bytes retained in `static-contact-diagnosis01-owner.ts`.

`firstRefusal.pose` in the static report is the last successful publication, not the attempted pose. The JSON records the actual input captured immediately before contact, compiled source keys, source-step state, generated targets and each reached endpoint-check pass.

The first physical contradiction is leg3Far. Its source socket is(851,629), knee(835,592), endpoint(866,536), and observed painted support(861,531). The upper/lower lengths are40.311288741492774/64.00781202322098px, giving104.31910076471375px endpoint reach. The support is exactly rigid to Foot; its corresponding rigid reach is106.62116734189435px.

| Action | Initial endpoint distance px | Pass1 distance px | Refused pass2 distance px | Rigid painted target distance px |
|---|---:|---:|---:|---:|
| hit22.5ms |102.21795929316805|104.04285952510044|104.62953776542123|107.16453414998936|
| dodge25.666666666666668ms |102.11573368782709|104.1109638720077|104.76230717751017|107.245835118356|

The initial endpoint target fits, but correcting its rotated painted offset exposes an unreachable painted target. The downward-only accommodation refuses because this target is above the hip. The compression cap remains34.401488339896005px; changing that cap would not address the direction mismatch. Exact rigid fallback alone is also insufficient: even the painted-point reach exceeds its corresponding full extension by0.5433668080950156/0.6246677764616493px.

The compact contract explicitly uses source steps for hit/dodge (`myriapod-anatomy.mjs:21`). The source-step clock is correct: hit's first−0.08body key is at110ms and dodge's−0.12body key is at120ms. The root uses linear segment travel plus the preserved GSAP rounding residual. No wrong duration ratio or discarded arbitrary displacement was observed.

The incompatibility is the swing lift convention in `creature-rig-contact.ts:177–183`: every swinging endpoint subtracts screen y. For this top-oblique layout, far feet already lie above the trunk, so subtracting another8.839095751241267px(hit)/9.115323928974629px(dodge) extends them away from their socket. This contradicts the intended retracting swing. Arithmetic from the retained target places a lift retracted toward the socket within geometric reach, but no such changed pose has been solved or admitted. Any repair should explicitly scope this convention to the compact model, retain its existing lift amplitude and all joint/length/contact guards, and independently qualify the changed behavior. This is not evidence that an entire row would pass.

The global rigid fallback is independently unavailable because observed supports leg0Far,leg5Far,leg8Far andleg12Far contain mixed contributors. Leg5Far has substantial mixed influence; the others include nonzero barycentric residues near floating zero. Exact eligibility correctly refuses these; no zeroing or tolerance change is proposed. Their full support provenance is retained for the separate feed/weight diagnosis. The first hit/dodge physical reach contradiction persists even if that fallback eligibility issue is resolved.

`static-contact-diagnosis01.findings.json` holds the derived reach comparisons separately from the raw replay. The alternative directions there are arithmetic only, with no IK, joint-limit or publication acceptance claim. Production source and all fit inputs remain unchanged.
