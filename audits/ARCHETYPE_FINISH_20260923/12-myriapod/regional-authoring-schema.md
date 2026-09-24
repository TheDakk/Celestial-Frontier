# Packet-local regional intake

Prepared compiler only; no intake or acceptance has been executed by its author.
The parent supplies observed source authoring and decides when to run it.

```sh
node audits/ARCHETYPE_FINISH_20260923/12-myriapod/intake-01.mjs \
  audits/ARCHETYPE_FINISH_20260923/12-myriapod/CANDIDATE \
  audits/ARCHETYPE_FINISH_20260923/12-myriapod/NEW_FIT
```

Both paths must be in this checkout's `audits/` tree. Output must not exist.
Input files are `master.png`, `subject-source.json`, `presence.json`, and
`authoring.json`. Delivered master extent is exactly 1254 × 1254; no resize.
Existing native-alpha or magenta-key intake owns raster handling. All nonzero
native alpha is retained, including faint fringes. No source paint is invented.

`subject-source.json` supplies the exact species name, genome with integer seed,
visualKey (or speciesVisualKey), and optional ownerId. `presence.json` is the
explicit `cf.anatomy-presence/v2` declaration, including absent, hidden, folded,
and `appendages: {walkingLegPairs: 14, ultimateLegPairs: 1}`. The compiler never
infers presence or derives landmarks from the guide, masks, or nearest joints.

`authoring.json` uses the existing explicit fields:

- `id`, `family: "myriapod"`, `materials`, `groundLineY`, `remainderPart`;
- `landmarksPx`: all 63 named movable joints, in source pixel coordinates;
- `parts`: 32 `{id, joint, layer, polygonPx}` entries, first-match texture
  ownership priority, with the named remainder receiving otherwise unclaimed
  positive-alpha pixels; layer is `far` or `near`;
- optional `coverage` and `habitat` retain their existing meanings;
- `fixedAttachmentsPx`: the 31 explicit, source-observed fixed sockets below;
- `regionalInfluences`: the named source extents below.

The texture parts are body/root, head/head, 28 whole walking limbs whose primary
joint is their Foot, and the two ultimate appendages. No virtual extra parts are
merged after admission. The 63 joints are root, head, mandible, antennaFar,
antennaNear, 28 Knee/Foot pairs, and ultimateFar/ultimateNear. Walking names are
zero-based `leg0FarKnee`, `leg0FarFoot`, `leg0NearKnee`, `leg0NearFoot` through
index 13. There are no seg0–seg7 channels in this compact model.

`fixedAttachmentsPx` maps exactly `head`, all 28 `leg…Knee` joints, and
`ultimateFar`/`ultimateNear` to `[x,y]`. The compiler normalizes these into
`record.geometry.fixedAttachments`; the production family validator owns exact
inventory, finite normalized coordinates, and painted-alpha admission. These
are fixed source sockets, not extra joints or pose channels.

Each regional entry has only these fields:

```json
{
  "id": "leg0-far-proximal-observed-paint",
  "partId": "leg0-far",
  "joint": "leg0FarKnee",
  "polygonPx": [[100,100],[130,100],[130,140],[100,140]],
  "pin": false
}
```

The coordinates above illustrate syntax only; they are not measured authoring.
`id` is a required, unique lowercase source-extent name. `partId` names an
existing texture owner, `joint` names an existing declared joint. `pin` is
optional and defaults to false. Polygon coordinates are finite and inside the
source extent, with nonzero polygon area. Polygon edges are included exactly,
without a distance allowance. Use simple polygons; no holes are represented.

Regions need not tile an entire part. Proximal walking paint may seed Knee while
uncovered distal paint keeps the ordinary Foot-based split field. Head paint
may explicitly seed mandible and antenna influences while uncovered paint keeps
the head-based split field. Those defaults include existing source-join
diffusion; they do not promise every uncovered support remains pure Foot/head.
Explicit shape-pin regions can retain rigid interiors; avoid pinning an entire
multi-joint texture part or its flexible attachment collar.

A region must contain positive-alpha pixels from its named part and select at
least one existing field support inside its polygon. Only supports already
referenced by that part's mesh are eligible. A field support can lie in mesh
padding: selection is explicit source-space polygon authoring, not an assertion
that every mesh vertex itself lies on an opaque pixel. The receipt separately
counts actual painted pixels and selected field supports. A narrow region that
hits paint but no support is a refusal, never silently snapped to a nearby joint
or support. No mesh refinement is automatically added.

The sequence is existing 40/80 mesh sampling → observed source joins → observed
surface split with root fixed, all 28 Foot contacts, and `shapeJoints: []` →
regional seed assignment → one existing 32-iteration weight-diffusion pass →
restore every inherited root/contact pin and every explicit regional pin.
Uncovered supports keep their split weights as diffusion seeds. Regions that
request different joints for a shared support, or conflict with an inherited
pin, are refused. Repeated same-joint selection is permitted and counted.
All 63 declared joints must have a final positive painted influence.

The compiler retains the source-coordinate/topology/interpolation hash, all
texture parts and UV mappings, the original solver profile, and every inherited
pin weight exactly. `validatePaintSkin` checks the result, including its existing
eight-influence maximum and weight-sum/geometry guards. The final binding is
sealed by standard `hashJSON`. The final source-join probe must reproduce the
pre-split observed inventory and interpolation exactly apart from binding hash.
No contact limit, joint limit, motion gate, source-join allowance, solver setting,
or runtime part/joint ceiling is changed by this packet compiler.

Output includes record/declaration/labels (native-alpha path), packed parts and
atlas, pre-split and pre-regional bindings, observed-split receipt, regional
receipt with source-extent IDs and exact selected vertex indices, final probe,
binding, fit receipt, and input/helper hash provenance. Any refused stage after
output creation is retained in `refusal.json`; partial output is not admission.
The region receipt records painted pixel/support/pin/change counts only after
actually measuring them. No static, exact-rest, film, performance, or art
acceptance follows from compilation alone.
