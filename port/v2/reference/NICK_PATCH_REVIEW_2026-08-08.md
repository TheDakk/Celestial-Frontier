# Celestial Frontier — 2026-08-08 Fixed Species Patch Review

**Archive reviewed:** `cfspeciesFIXED20260808.zip`

## Scope and patch coverage

This archive is a **targeted correction patch**, not the full 1,250-image catalog. It contains **60 changed assets: 40 Earth fauna + 20 Earth flora**.

It semantically contains **all 59 assets that were marked `FIX` in the previous full Gold audit**, plus **Zebra** as one extra equid-family update. Every file differs from the previous baseline.

Technical check: all 60 files open successfully, all are **440×440 RGBA PNGs**, and there are **no exact duplicates inside this patch**.

## Executive verdict

This is a **strong correction pass**. The Horse/equid work is materially better, most of the plant fixes succeeded, several marsupial/rodent/gliding forms now have their defining anatomy, and the specialist fish work is improved in several places.

However, I would **not merge all 60 blindly**. A smaller group still needs correction, and **Mahi-Mahi is an actual regression** because large fang/saber teeth were added to a fish that should not have them.

### Status totals

| Status | Count | Meaning |
|---|---:|---|
| PASS | 15 | Previous required correction is solved; leave alone. |
| PASS WITH POLISH | 25 | Required issue is materially solved; optional Platinum refinement remains. |
| STILL FIX | 19 | The patch improved something, but the defining morphology is still not accurate enough. |
| REGRESSION | 1 | The patch introduced a new obvious biological error. |

## Most important conclusions

- **Horse is now dramatically better.** I would move Horse from required `FIX` to `PASS WITH POLISH`. The new mane, tail, barrel and croup finally read as equine. Only leg-joint and skull refinement remain.
- **Do not accept the new Mahi-Mahi as-is.** Remove the large teeth/fangs; they are a new error. Keep working toward the steep forehead and long dorsal profile.
- **Eagle and Harpy Eagle still need a real raptor body**, not the compact round-bird scaffold.
- **Several small/medium cats still retain the wrong underlying quadruped body**: Bobcat, Caracal, Cat, Cheetah, Clouded Leopard, Fishing Cat, Lynx and Ocelot.
- **Bison still needs a dedicated front-heavy bison scaffold** with a shoulder hump, low head and massive forequarters.
- **Spider still needs eight clearly readable legs.**
- **Most flora corrections are successful.** The main remaining plant problems are Devil's Club, Giant Kelp, Kelp and Sargassum.

## Earth fauna — one-by-one patch review

| Asset | Status | Current assessment |
|---|---|---|
| Aardvark | **STILL FIX** | The lower body and digging claws are improved, and the long snout/ears now read correctly. The torso is still too woolly/sheep-like and the tail is much too thin for an aardvark. Keep the new head/feet, but use a smoother, lower aardvark body and a thick muscular tapering tail. |
| Agouti | **PASS** | Now reads as a compact large rodent rather than a tiny ungulate. Short legs, rounded hindquarters, small ears and the nearly absent tail are appropriate enough for the stylized direction. Leave alone. |
| Badger | **PASS WITH POLISH** | The body is now low, wide and short-legged, which fixes the main silhouette problem. The striping is somewhat graphic/zebra-like and the paws could be broader, but the animal is clearly a badger. No release-level change required. |
| Bison | **STILL FIX** | The body still does not read as an American bison. It lacks the massive forequarters/shoulder hump, low-set head, heavy front mane and small rear. The horns and long flowing tail also feel bovine/antelope-like rather than bison. This needs another body pass. |
| Bobcat | **STILL FIX** | The coat improved, but the underlying body remains ungulate-like. It still needs feline paws/hocks, a flexible cat torso, cheek/ear tufts and a more obvious short bobbed tail. Do not solve this with markings alone. |
| Capybara | **PASS** | This now reads well as a heavy, low, blunt-headed rodent with short sturdy legs. The proportions are much closer to a real capybara and there is no glaring body-family error. Leave alone. |
| Caracal | **STILL FIX** | The silhouette is cleaner but still does not fully read as a caracal. The body/feet remain too ungulate-like and the defining long black ear tufts are not prominent enough. Keep the tall ears and slender build, but rebuild the feet/hocks and emphasize the tufts. |
| Cat | **STILL FIX** | The striped coat is fine, but the body is still not a convincing domestic cat. The legs remain too straight, the feet are not feline paws, the spine is stiff and the muzzle/head shape is too generic. Needs a true domestic-cat scaffold. |
| Cheetah | **STILL FIX** | The long tail and spotted slender silhouette help, but the legs/feet still read too straight/hoof-like and the head is too generic. Add feline paws, digitigrade hocks, a deeper chest/tucked waist and facial tear marks. |
| Civet | **PASS WITH POLISH** | The new lower elongated body, pointed face, spots and ringed tail are much closer to a civet. Paws and head anatomy could be refined, but the family read is now convincing enough. |
| Clouded Leopard | **STILL FIX** | The long tail helps, but the body still sits on a generic ungulate-like scaffold and the coat lacks the large cloud-shaped blotches that define the species. Needs a feline torso/paws plus stronger cloud patterning. |
| Coati | **PASS WITH POLISH** | The body is now lower and longer, with a prominent ringed tail. The snout should be longer and more flexible and the paws more dexterous, but it now reads as a coati rather than a generic ungulate. |
| Colugo | **PASS WITH POLISH** | The defining gliding membrane is now visible around the limbs, which fixes the major issue. Extending the patagium more clearly toward the neck and tail would improve accuracy, but this is no longer a glaring problem. |
| Deep-Sea Octopus | **PASS WITH POLISH** | The single-eye problem is fixed. Two eyes, a mantle-like head, ear-like fins and a broad webbed arm curtain now read plausibly as a deep-sea cirrate/dumbo-type octopus. The eight arm rays could be separated more clearly, but the new design is biologically plausible. |
| Donkey | **PASS WITH POLISH** | This is substantially better. Large ears, short upright mane and tufted tail now establish donkey identity. The leg joints and hooves remain very simplified and the body could be slightly stockier, but I would not hold release on it. |
| Eagle | **STILL FIX** | Feet and tail are more visible, but the overall silhouette is still a round generic bird rather than a powerful raptor. It needs a stronger hooked beak/brow, larger chest, broad raptor wings, stronger shoulder line and large talons. |
| Fishing Cat | **STILL FIX** | The pattern reads, but the body still does not read as a cat. The head/muzzle, hocks and feet remain too generic and the torso is heavy in the wrong way. Needs a stocky feline wetland scaffold with real paws. |
| Flying Squirrel | **PASS** | The patagium is now clearly visible between the fore- and hindlimbs and the broad tail is retained. This fixes the defining feature and the silhouette reads correctly at card scale. Leave alone. |
| Harpy Eagle | **STILL FIX** | Talons are now visible, but the body remains the same compact round-bird scaffold as the generic eagle. Harpy Eagle needs a massive raptor body, broad rounded wings, a strong double crest and oversized talons. |
| Horse | **PASS WITH POLISH** | This is a major improvement and I would no longer classify it as a required fix. It now has a real mane, flowing tail, deeper barrel, stronger croup and more equine overall silhouette. For Platinum polish, refine the head toward a longer wedge-shaped horse skull and add clearer knees/hocks/fetlocks/pasterns rather than nearly straight legs. |
| Jerboa | **PASS WITH POLISH** | The long balancing tail and enlarged hindlimb treatment now communicate jerboa much better. The hind feet could be even longer and the forelimbs smaller, but the defining bipedal rodent concept is present. |
| Kinkajou | **PASS WITH POLISH** | The body is lower and more arboreal than before, and the long tail is improved. Make the tail more obviously prehensile and the paws more grasping in a future polish pass; no glaring release blocker remains. |
| Lynx | **STILL FIX** | The coat and ears help, but the body remains too ungulate-like. It needs true feline paws/hocks, large feet, a flexible torso, stronger ear tufts and a clearly bobbed tail. |
| Mahi-Mahi | **REGRESSION** | This patch introduces an obvious biological error: the huge fang/saber teeth are not a mahi-mahi trait. The fish still needs the characteristic steep forehead, laterally compressed elongated body and long continuous dorsal fin. Remove the fangs; keep the forked tail and color improvements. |
| Monkfish | **STILL FIX** | The lure and enlarged mouth are improvements, but the body remains too boxy/oval. A monkfish/goosefish should have a huge flattened head and mouth, broad pectoral bases and a strongly tapering body. The new teeth alone do not solve the body plan. |
| Moray Eel | **PASS WITH POLISH** | The incorrect sucker/circular mouth is gone, which is the important fix. The long eel body reads correctly. Enlarge the head/jaw and gape slightly for a stronger moray read, but this is now acceptable. |
| Ocelot | **STILL FIX** | Patterning is improved but the animal is still built on the same non-feline scaffold. It needs a low flexible cat body, feline paws/hocks, a more cat-like head and the species' elongated chain-like markings. |
| Possum | **PASS WITH POLISH** | The body is lower, the muzzle is more pointed and the long mostly naked tail is retained. Paws and tail grasping anatomy could be refined, but it now reads as a possum. |
| Raccoon | **PASS** | The low body, face mask and clearly ringed tail now work together. The previous 'mask-only' problem is resolved. Leave alone. |
| Saiga | **PASS** | The enlarged hanging nasal structure is now dominant, which is the defining feature. Horns and body are sufficiently recognizable for the stylized direction. Leave alone. |
| Sailfish | **PASS** | The enlarged dorsal sail now dominates the silhouette and the bill/forked tail are clear. This is a successful correction and should be left alone. |
| Serval | **PASS WITH POLISH** | Long legs, very large ears and spots now make the serval recognizable. Paws/hocks remain simplified, but the species identity is sufficiently strong. |
| Spider | **STILL FIX** | The two-part arachnid body and multiple eyes are good, but the eight-leg requirement is still not visually secure. Several legs overlap/disappear, so the silhouette can read as fewer than four pairs. Make all eight articulated legs clearly countable. |
| Sugar Glider | **PASS** | The gliding membrane is now obvious and the tail/body relationship reads correctly. This fixes the defining anatomical issue. Leave alone. |
| Tasmanian Devil | **PASS WITH POLISH** | The darker stocky body and white chest marking improve the read considerably. The head/jaw could still be larger and heavier, but the species is now recognizable enough. |
| Warthog | **STILL FIX** | The head is improved, but the body remains too ungulate-like and the defining facial warts, curved tusks and mane are too weak. Use a true boar body, broader snout and much more obvious tusks/warts. |
| Wild Ass | **PASS WITH POLISH** | The corrected equid direction is visible, with long ears and a tufted tail. Leg joints/hooves remain simplified, but this is now recognizably a wild ass. |
| Wild Horse | **PASS WITH POLISH** | The new horse scaffold is a major improvement: deeper barrel, mane and flowing tail are present. Refine joint anatomy and skull shape only as optional Platinum polish. |
| Wild Pony | **PASS WITH POLISH** | The pony is now more equid-like and somewhat stockier. It could be shorter-legged and more compact relative to Horse, but the previous deer-like placeholder problem is materially resolved. |
| Zebra | **PASS WITH POLISH** | This extra patch item remains recognizable and benefits from the improved equid direction. The stripe pattern is strong; apply any future equid leg/joint refinement consistently to Zebra as well. |

## Earth flora — one-by-one patch review

| Asset | Status | Current assessment |
|---|---|---|
| Acai | **PASS** | Now clearly reads as a palm with a slender trunk, pinnate crown and hanging dark fruit cluster. The previous generic stem is fully resolved. |
| Baobab | **PASS WITH POLISH** | The massively swollen bottle trunk and sparse high crown now capture the iconic baobab silhouette. The crown could be a little broader/more branched, but the defining growth form is present. |
| Bull Kelp | **PASS WITH POLISH** | The long stipe, terminal float/bladder and radiating blades are now recognizable as bull kelp. Blade width/flow could be more natural, but the defining structure is fixed. |
| Cloudberry | **PASS WITH POLISH** | The plant has been moved down to a low creeping bog form with a single central aggregate fruit. Leaf shape and berry detail could be refined, but the previous tall-herb error is gone. |
| Desert Rose | **PASS** | The swollen caudex and showy pink flowers now match the species' defining growth form. This is a successful fix. |
| Devil's Claw | **PASS WITH POLISH** | The plant is now prostrate/sprawling with flowers and a visible hooked claw-like fruit structure. The hooks could be more dramatic, but the defining concept is present. |
| Devil's Club | **STILL FIX** | This now looks like a narrow leafy shrub with red flower/berry spikes, but Devil's Club should be dominated by very large palmate maple-like leaves on spiny stems. The current leaf architecture is still the wrong plant. |
| Duckweed | **PASS** | The asset now reads as a dense mat of tiny floating fronds on the water surface. This fixes the scale and growth-form problem. Leave alone. |
| Giant Kelp | **STILL FIX** | There is more branching than before, but the image still reads as a vertical bundle of narrow rods. Giant kelp needs long flexible stipes with broad blades and repeated gas bladders/pneumatocysts along the fronds. |
| Kelp | **STILL FIX** | The added side structures help, but the asset is still dominated by rigid vertical rods instead of broad flexible blades/fronds with clear holdfast and stipe logic. Another morphology pass is warranted. |
| Miner's Lettuce | **PASS WITH POLISH** | The new slender stems with round perfoliate-looking leaves and small flowers are much closer to miner's lettuce. The structure is stylized but recognizable. |
| Orchid Pods | **PASS WITH POLISH** | The asset now shows elongated capsules attached along an orchid-like stalk, which solves the harvest-organ problem. If this is meant to depict the whole source plant, add leaves/flowers; if it is the harvested pod asset, it is adequate. |
| Papyrus | **PASS** | Tall stems topped with radiating umbrella-like umbels now establish papyrus clearly. Successful correction. |
| Peanut | **PASS** | The plant is now low and branching with paired leaflets and visible pod/ground logic. This is a strong species-specific fix. |
| Pinyon Pine | **PASS WITH POLISH** | The asset now uses a conifer silhouette with tiered needle-bearing branches rather than a round broadleaf canopy. Cones/needle texture could be stronger, but the growth family is correct. |
| Prickly Pear | **PASS** | Flattened jointed pads, spines and a fruit/flower are now clearly present. The previous wrong plant family is completely fixed. |
| Sargassum | **STILL FIX** | Round gas bladders are now present, but the plant still reads as sparse upright twigs. Sargassum should have dense branching brown fronds with many small leaf-like blades and numerous bladders. |
| Steppe Tulip | **PASS** | A clear cup-shaped tulip flower on a simple stem now dominates the silhouette. This is a successful correction. |
| Sweet Potato | **PASS WITH POLISH** | The image now reads as a creeping vine with heart-shaped leaves and morning-glory-like flowers, which is biologically appropriate for the source plant. Add a visible tuber only if the design must communicate the harvested root in the same portrait. |
| Yew | **PASS** | The coniferous needle-like crown and red arils now communicate yew clearly. The previous generic broadleaf-tree form is resolved. |

## Recommended merge plan

1. **Merge all `PASS` assets.**
2. **Merge `PASS WITH POLISH` assets** and treat their notes as optional Platinum backlog.
3. **Hold `STILL FIX` assets** for one more targeted morphology pass.
4. **Reject/rework the current Mahi-Mahi patch** before merge.
5. Do **not** run another global pass. Touch only the remaining held assets.

## Final call

The patch is a substantial success and solves most of the previous 59-item correction list. The Horse in particular is no longer the alarming global-body-template example it was before. The remaining work is now concentrated enough that the team should make one final targeted pass rather than changing the overall library again.