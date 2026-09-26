# Pack4 impact correction — review request

Review the candidate in wild-phases-review.png and the two before/after400% crops.
Original art, launch, travel, MID and every alpha byte are unchanged. Only9RGB pixels in the
lower-right impact tuft changed using one explicit-target radius8 pass. The top-right rectangle
had zero eligible pixels after the required protected-colour exclusions; its crop is unchanged.
Do not infer completion from zero remaining eligible targets. Nick owns final image acceptance.

Give ACCEPT or TARGETED INTAKE FIX for each specified impact cluster, checking visible pink,
retained fur/leaf shapes and the protected sheen. If something remains, name exact keyed1254
coordinates and whether it is pale protected paint, interior paint, or an edge candidate.
Do not recommend another global pass or erosion. No further correction is currently authorized.

The old total counts110travel/85impact were broad keyer diagnostics. The new explicit split is:
travel85pink-band candidates,1excluded pale,24excluded umber;
impact before this pass52pink-band candidates,9excluded sheen,16excluded pale,8excluded umber.
These conservative mechanical categories differ from Claude's visual estimates44/31; both are
retained. No under40 acceptance threshold is applied. Pixel lists and classification rules,
protected/outside/alpha checks, source hashes and unchanged transforms are in receipt.json.

Both anchor JSON files identify the current keyed/registered copies. The master-fallback's
imageSha256 still binds its unchanged original image; keyedImageSha256 binds the corrected copy.
registration-receipt.json is the current aggregate; previous receipts remain historical.
