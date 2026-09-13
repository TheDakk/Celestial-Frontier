# Proposed Motion and Sound Kits v1 — receipt and bounded handoff

Nick requested both supplied root kits committed verbatim as PROPOSED v1. They were absent
at the root, so only MOTION_KIT.md and SOUND_KIT.md were extracted from the supplied zip.
verification.json records exact lengths, hashes and byte equality. No duplicate kit copies
are kept in the tree. No fenced paragraph or other kit text was edited. The documents are
proposals; their imperatives are not blanket implementation or acceptance authority.

Current user scope: retain these kits, and when the already authorized Civet parts-rig proof
is built, compile its body card from the winning painter's resolved-anatomy record following
MOTION_KIT sections 3–6 and use those timings. Do not hand-fill a body card, fall back to raw
genes for named Earth anatomy, or silently guess a missing field. The arena/Wild artwork
still awaits visual acceptance; this request does not accept those candidates or authorize
other families, UI/panel motion, ships or a broad sound library.

## Preliminary body-card gaps — no record or compiler changes

Read-only comparison against audits/CIVET_2D_PROOF_20260912/civet.landmarks.json and
port/v2/packages/art/src/quadruped-anatomy.ts. Recheck the actual resolved parts-rig record
when building the proof, and report its complete coverage then.

| Body-card requirement | Present evidence / missing information |
| --- | --- |
| Identity, template, seed | Authored record has speciesVisualKey, ownerId, seed, quadruped template id/version and recipe hash. |
| Parts/pivots and lengths | Named landmarks and boundsCheck.boneLengths exist. Separate painted part ownership/pivots must be resolved with the parts rig; no mask atlas exists yet. |
| Mass class | No resolved size/mass class in the record. Serialized raw genes inside speciesVisualKey are identity, not permission to override named Civet anatomy. |
| Locomotion | No resolved locomotion field. Do not decode raw loco from the identity string as the named-anatomy authority. |
| Realm | No explicit resolved realm field; the clip-set name is not a declared realm field. |
| Materials | One overall surface value fur exists; needs an explicit fur→furred vocabulary mapping and per-part assignments for section 6. |
| Secondary parts | Tail/ear landmarks exist; no explicit secondary-part list or lag ordering is declared. |
| Weapons | No resolved natural-weapon list. The selected Wild/Savage Maw effect does not itself supply an anatomical weapon record. |
| Luminous | No resolved luminous boolean. Raw serialized lumin is not named-Earth appearance authority. |
| Bounds | Current boundsCheck is an in-frame/length result, not declared angular joint limits. Template-owned joint limits need a record binding. |

The draw-time procedural interface currently exposes owner/kind/width/ground line/landmarks
and overall materials only. The proof must resolve its additional body-card requirements
through the painter/record owner; no new fields or behavior were implemented in this batch.

Timing authority for the later proof is now Motion Kit §5 as Nick explicitly requested.
At mass1.00: approach420ms, melee140+90+one-frame smear+260ms, hit110+160+180=450ms,
return380ms, hitstop70ms (attacker-scaled, cap140ms). Apply the declared mass scaling.
This differs from earlier hit≈300ms and can exceed earlier approach/return caps for heavy
bodies; do not claim both schedules match. Report actual compiled timings with the captures.
The proposed text's frame-based smear/flash wording versus time-based playback, and its
section3 claim of14 fauna/2plant templates versus section4's12 fauna/2plant list, are noted
without editing the kit or expanding the quadruped proof. Resolve only proof-relevant
interpretation when implementing; proposed volume wording is not implementation authority.

## Sound approval and first sources

Do not record or synthesize sources until Nick approves the frozen paragraphs. Recording
this proposed kit is not that approval. Nick's explicit gate controls execution; do not add
an independent approval flow merely because section8a also lists mix/output sections.
Once approved, record only SOUND_KIT §8b: one quadruped voice archetype set, one Wild theme
set, the battle set, a temperate bed with rain, and fur impacts. Record source rights under
the existing audio provenance owners; preserve source bytes and hashes.

Derive Civet, fox and one procedural quadruped from that single archetype using compiler
voice cards and seeded bounded transforms. Present all three side by side for listening,
and wire the approved bounded sources into the arena proof so the turn is heard. The
existing emitter/Pixi compatibility work and art acceptance stop remain in force. Do not
record extra archetypes/themes/biomes, add music or replace the whole runtime audio system
from this document alone. No sound source, derived voice or audio wiring was made now.

GitHub step none; PR42 parked. No release/deployment, hosted run or history rewrite.
