# Fruit Bat paint03 — independent source review and initial authoring

This is a manual visual/source prototype for subsequent label, IC-3 and motion qualification. It is not a test or technical acceptance. Only authoring.json and this review were written. No painting, intake, rig/solver run, coordinate optimization or production edit was performed. The delivered master and parent declaration remain unchanged.

- Master SHA-256: `ba6037964ac289b10cb7ccac9c44bdf05395deeec827a412fa4e97be5f7ca1a7`.
- New authoring creation SHA-256: `1a88593285413314910c8a29f951dbacc5aa0c9b3a870d5dcae274fe9d6c9a3e`.
- Parent-owned presence SHA-256: `90cf2f6724cac8198eb24d82d7fedff1b33d8f3038c794e394002d4a404f95db`.

## Visible anatomy

Two independent rearward membrane wings, two pointed ears and two distinct clawed hind feet are visible; no extra limb or tail is seen. The far wing sits above the near wing. Both have a shoulder/base feature, a raised elbow, a wrist/thumb hub farther left and slightly lower, then an outer tip farther left/down. The near wing's thumb hook and the far wing's thumb hook are wing anatomy, not additional feet. Membrane finger ribs and scallops remain within the existing four-owner wing representation.

The far wing and hind-leg roots are partially occluded by the near membrane/body. That does not make a complete wing or leg hidden, and this review does not infer or alter the parent's declaration: tail absent; hidden []; folded []. Both visible wing tips and both feet appear intact and enclosed by background. Exact internal anatomy cannot be inferred from the painterly surface.

## All 21 source-authored landmarks

The old 17-part authoring provided schema, names and inventory only. Every coordinate below comes from a fresh visual fit to this actual painting; no pose-guide coordinates were consulted for this authoring. Pixel precision records the authored decision, not anatomical measurement certainty.

| Landmark | Source pixels | Basis |
| --- | --- | --- |
| root | [877, 654] | Estimated internal body center; partly occluded anatomy |
| pelvis | [763, 731] | Estimated internal body center; partly occluded anatomy |
| spine | [891, 648] | Estimated internal body center; partly occluded anatomy |
| chest | [985, 573] | Estimated internal body center; partly occluded anatomy |
| neck | [1067, 568] | Estimated internal body center; partly occluded anatomy |
| head | [1135, 554] | Approximate skull center |
| jaw | [1179, 609] | Visible lower muzzle/jaw fit |
| wingFarRoot | [831, 451] | Visible body-side bony/root feature; internal attachment approximate |
| wingFarElbow | [604, 301] | Visible raised major bend |
| wingFarWrist | [394, 355] | Visible thumb/finger hub |
| wingFarTip | [47, 533] | Visible outer membrane-supported terminal |
| wingNearRoot | [875, 576] | Visible body-side bony/root feature; internal attachment approximate |
| wingNearElbow | [651, 430] | Visible raised major bend |
| wingNearWrist | [435, 477] | Visible thumb/finger hub |
| wingNearTip | [65, 690] | Visible outer membrane-supported terminal |
| legFarKnee | [571, 880] | Visible lower-leg bend/transition in the existing two-span approximation |
| legFarFoot | [559, 921] | Visible clawed terminal center; no support-plane inference |
| legNearKnee | [722, 866] | Visible lower-leg bend/transition in the existing two-span approximation |
| legNearFoot | [717, 921] | Visible clawed terminal center; no support-plane inference |
| earFarTip | [1151, 434] | Visible ear apex |
| earNearTip | [1085, 422] | Visible ear apex |

## All 17 mask owners and wing seams

All 17 polygons were redrawn for this master. Near membrane ownership precedes legs and far membrane where surfaces overlap; the parent-owned explicit presence controls the inventory. Ears and jaw precede head. Distal surfaces begin at each wrist and contain the left outer fan. Wrist surfaces lie between elbow and wrist with their associated inner membrane; elbow surfaces extend from wing base toward elbow; base surfaces occupy the body-side membrane wedge. These are the existing graph owners, not new bones.

| Part | Joint owner | Source region |
| --- | --- | --- |
| ear-near | earNearTip | Visible ear surface |
| ear-far | earFarTip | Visible ear surface |
| jaw | jaw | Visible lower muzzle |
| head | head | Visible skull and upper muzzle |
| wing-near-distal | wingNearTip | Outer fan and scalloped edge beyond wrist |
| wing-near-wrist | wingNearWrist | Wrist/thumb hub, elbow-to-wrist ridge and adjoining membrane |
| wing-near-elbow | wingNearElbow | Root-to-elbow ridge and adjoining membrane |
| wing-near-base | wingNearRoot | Body-side attachment membrane wedge |
| leg-near-foot | legNearFoot | Clawed lower foot |
| leg-near-upper | legNearKnee | Visible proximal hind-leg span |
| leg-far-foot | legFarFoot | Clawed lower foot |
| leg-far-upper | legFarKnee | Visible proximal hind-leg span |
| wing-far-distal | wingFarTip | Outer fan and scalloped edge beyond wrist |
| wing-far-wrist | wingFarWrist | Wrist/thumb hub, elbow-to-wrist ridge and adjoining membrane |
| wing-far-elbow | wingFarElbow | Root-to-elbow ridge and adjoining membrane |
| wing-far-base | wingFarRoot | Body-side attachment membrane wedge |
| body | root | All otherwise unassigned body/head-neck fur and residual alpha; no intended wing-edge strips |

Membrane owners share explicit cross-cuts rather than leaving intentional unowned stripes. Near cuts connect wrist [435,477] to [503,791], elbow [651,430] to [694,831], and base-side [822,540] to [763,760]. Far cuts use [394,355]→[342,612], [604,301]→[600,680], and [785,419]→[808,531]. The far polygon interiors extend behind the near wing only to preserve continuous ownership where visible; priority masking retains the actually painted occluder and creates no hidden pixels. Outer polygons include the scalloped membrane contours and their fringe; the actual raster split still needs review for any missed edge before claiming perfect ownership.

The eight wing joint owners explicitly use smooth skin; the body uses fur. The source's finger-supported ribs remain painted membrane detail. No solver, family, joint limit or gate was changed.

## Framing and uncertainty

The parent's retained master-integrity.json reports 1254×1254 RGBA, 372374 positive-alpha pixels, positive-alpha bounds x0…1223/y19…1229, and diagnostic alpha>127 bounds x43…1220/y296…930. Diagnostic left/right margins are 43/33 pixels, so the requested 8% margin was not achieved. The diagnostic threshold does not become an intake cutoff. All low-alpha fringe and every delivered pixel remain unchanged; intact visible tips are a visual observation, not a crop certificate.

Internal torso/pelvis centers, the exact wing shoulder attachment behind fur, and biological hind-leg knee locations are uncertain. The authored leg bends support the existing two-span representation; they do not invent invisible joints. groundLineY 0.78 is an explicit framing reference beneath the visible feet, not a inferred common terrain plane across a flying animal.

Parent now owns intake, label inspection and qualification. Nick reviews the art, and Claude consumes only signed results under the authorized handoff.
