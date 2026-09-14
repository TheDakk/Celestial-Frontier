# C2 far-ear repair investigation — September 14

Nick requested another repair attempt following Claude's underlap approach. Starting head
88a7b535. Same uninterrupted toolchain session, openai/mac, no external/GitHub action.

## Finding: the current rigid band cannot supply the missing ink

The six retained zero-alpha samples are three pixels at each stride extreme of
head--ear-far. `audit-ear-support.mjs` verifies the old native report's source transforms,
record, original diagnostic inputs, part binding and actual atlas bytes. It inverse-maps
each pixel centre through the head transform into the COMPLETE original far-ear image.
That complete image is a superset of every band permitted by the depth rule and size cap.
The native-size nearest/linear sampling footprint, conservatively enlarged to 3×3 pixels,
is all zero alpha at all six coordinates. The observer refuses scaling/minification,
invalid matrices, dimensions and targets; positive support is not proof of closure.

| Saved frame | Gap targets in 1254 space | Maximum complete-ear source alpha at each target |
| --- | --- | --- |
| Approach quarter | 998,197; 999,198; 1000,198 | 0; 0; 0 |
| Approach three-quarter | 1004,202; 1004,203; 1005,203 | 0; 0; 0 |

For example, target 998,197 maps to source 1024.375,222.831 under the head, where the
far-ear source has no ink. It maps to 1028.115,225.535 under the moving ear, beyond that
ear's right edge (last source column 1027). The opening sits at the silhouette end of
the authored cut. Deeper static copying cannot place original ink at the absent head-side
location. This does not establish that every possible partition or pivot would fail.

No larger whole-ear copy was built or adopted: Claude already rejected its ghost-ear
artifact. No new painting, atlas, band, mask, pivot, clip, native render or acceptance
threshold changed. The existing rest0/38-part2039×2047 atlas result remains historical;
this investigation does not rerun or newly certify it. C2 is **not repaired** by this result.

## Controls and evidence

`support.json` includes input hashes, all source neighbourhoods and packed-pixel verification.
The three new tests distinguish missing band ink from absent original ink, follow an actual
translation and rotation (a rest-coordinate lookup fails the control), and reject bad/scale
inputs. A newly supplied source pixel invalidates the no-ink witness rather than leaving a
false impossibility report. Node tools and root validation results are in checks.json.

The original morphological gate and cut-local diagnostic remain unchanged. No ten-second
capture is authorized by this support bound. It is a diagnosis of why the current depth-only
repair cannot work, not a replacement seam gate or a relaxed rim rule.

## Concrete next repair scope for Nick

A bounded next candidate would replace only the far-ear cut's rigid underlap with a small
textured strip whose vertices blend the existing head and ear transforms. Use the existing
ear pixels, current depth/caps, current master/record and current Motion Kit curves. At rest
the strip must occupy its exact original coordinates and remain hidden beneath base parts;
no changed RGBA channels. It would use the existing parts atlas, with a hash-bound per-cut
mesh/weight declaration and no per-creature clip edits. Runtime interface stays CreatureRigV1.
The strip can span a moving wedge that no head-fixed copy of the same source can reach.
This is a proposal, not an implemented or accepted deformation.

Proof scope: preserve rigid-band and missing-strip controls; rest0; same recoil, strike and
both stride extremes; report both unchanged native oracle and cut-local results; atlas budget
and visible shape check. Stop on any failed gate. Do not proceed to a ten-second capture or
other creature until its applicable gates pass. No 3D/finisher/kit/Claude-owned edit required.

The reason this next mechanism is not silently added is the incorporated band review,
`audits/C2_BAND_UNDERLAPS_20260913/CLAUDE_REVIEW_RESPONSE.md` §4: “If any pair still leaks,
stop and report that pair's render and count; do not add a fourth mechanism.” Nick's current
request authorizes investigating and trying the existing method; this proposal changes the
attachment/deformation mechanism and needs his scope decision.

Codex next: apply the bounded ear-base deformation only if Nick authorizes that scope.
Claude next: no action; Nick need not open Claude. Include this addendum with the existing
combined review prompt later. GitHub none; PR42 parked; no history operation.

## Local checkpoint status

Both configured 1Password signing attempts returned `agent returned an error`, despite
a successful intervening public-key enumeration. No new commit exists; this batch is staged
on88a7b535 (107aheadupstream/218aheadcacheddevelop, zero behind). Signer unchanged; no bypass.
`signing-attempts.json` records the distinction. A locked app is not established as the cause.
