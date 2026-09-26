# P1 second quadruped — Wolf, generation 01

One painting under PROGRAM §6's exception and Nick's explicit non-Civet direction. Wolf is a quadruped in `port/v2/reference/fauna.json`. The retained 440×440 side-on painter guide faces right; its original source and hash are in `request.json`. No sibling files were copied or edited.

**Declaration:** Wolf: four visible legs (two fore, two hind), four visible paws; `cf.anatomy-presence/v2`: `absent: []`, `hidden: []`; no leg is fully occluded. Far legs overlap the torso at their attachments but have separately visible legs and paws. The declaration concerns legs; a side-on far eye is naturally occluded.

- `wolf-master.png`: original image-tool output, 1254×1254 RGBA, copied byte-for-byte; SHA-256 `12ff561839c191bb726b967eef420f418063a8ab14548ab8901486d460f51773`.
- `prompt.txt`: exact text sent to `image_gen.imagegen`, once, with the approved Discovery Atlas and `anatomy-guide.png` attached. Seed/model identifiers are not exposed by that tool.
- `compile-prompt.mjs`: packet-only compilation from the retained P1 prompt with catalogue-owned Wolf traits and the side-on guide's facing. It fills subject, fauna-card, accuracy and layout slots; the reference, frozen style, technical output and negative blocks remain unchanged. It does not modify or exercise any intake writer.
- `request.json`, `result.json`, `subject-source.json`: source hashes, requested/delivered format, original tool path and inspection receipt. `presence.json` and `declaration.txt` retain the declaration separately from any family record.

The request used the same P1 1024-square PNG / magenta-key technical block. The tool delivered 1254-square transparency, as for the five crabs. No resize, keying, despill, RGB or alpha change was applied. Alpha inspection found 1,147,766 fully transparent, 248 fully opaque and 424,502 partially transparent pixels; opacity is retained as delivered for compiler evidence. Visual inspection shows one right-facing Wolf with four separate paws. Horizontal framing exceeds the requested 80% target / 8% margin. These are retained output findings; no retry or art acceptance is claimed.

No hand landmarks, masks, intake, fit, binding, rig, animation or battery was performed. IC-3 writers remain frozen. Existing staged four-crab delivery work is outside this packet and is not included in this commit.

Handoff: **Codex holds. Claude runs this master through `score.mjs`, `ic4.mjs` and `sheet.mjs` as the second quadruped. Nick has nothing to decide.** No fetch, sync, push, PR, merge, release or deployment.
