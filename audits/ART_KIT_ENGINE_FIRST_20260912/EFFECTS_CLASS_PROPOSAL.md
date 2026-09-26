# Proposed v4.1 Effects cut-out class — inactive

Scheduled after acceptance of the first engine painting and before any effect painting.
Nick's approval is required. This proposal changes neither approved v4 nor its 4E turnaround.

| Class | Source keys | Subject and layout | Technical output | Required negatives |
| --- | --- | --- | --- | --- |
| 4K Effects (cut-out) | `ABILITY_THEMES`: fire, frost, storm, tide, stone, venom, void, sand, chem, psionic, wild | One source ability's painted physical effect, with direction, origin and extent from the choreography; one effect per frame, then assemble the ordered frames into a labelled review sheet and an unlabelled animation atlas; frozen style, crisp opaque painted shapes, no scene or creature | Each frame 1024 square on flat #FF00FF, at least 8% safe margin; frame count and timing fixed in the animation manifest from the clip/choreography; key and pack after review, retaining originals | No soft bloom, glow halo, smoke fading into the key, background, ground, actor, text, icon badge or baked frame/grid |

Authority: `port/v2/packages/domain/combatcore/src/combatcore.verbatim.js:34–101`.
Source colours and gameplay identities remain unchanged. Reserved pink/violet-pink
pigment is remapped only by the kit compiler; this is especially relevant to `psionic`.
Exact frame counts/timing will be proposed with the Civet staged-turn proof, not invented
as additional ability themes. No Effects artwork has been generated.
