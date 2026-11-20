# Painted master review for pixel art

Written 2026-11-20. An independent, read-only review of the 631 painted
masters chosen as anatomy references for the pixel-art conversion (Codex's
ledger, `audits/PIXEL_PIVOT_20261120/image-ledger.json` in the OpenAI
worktree). It lists what a sprite author must correct when drawing from a
master, and which species look too alike to become distinct sprites.

How it was checked:

- Ledger integrity was recomputed from the files: 631 rows matching the
  roster, every master present, no hash, size or dimension mismatch, no file
  shared by two species.
- The 70 newly chosen masters were each opened at full size.
- All 24 family contact sheets were viewed tile by tile at about 258 px per
  tile. Look-alike candidates were then compared side by side at 512–760 px.
- Not done: the 561 previously certified masters were not each opened at
  full size, so toe, claw and fin counts were not audited for them. Species
  identity was judged by eye, not against reference photographs.

Result in one line: the library is sound as reference material. One master
should be replaced, about thirty need a note for the artist, and roughly
twenty groups of species cannot be told apart at sprite size.

## Replace

- **Deep-Sea Octopus.** The head has a fish-like snout with a mouth line and
  nostril, the fins read as ray-finned fish fins, and the subject is small.
  An older painting (`audits/G2_C163_FAMILY_ORIGINALS_20261002/20-deep-sea-octopus/master.png`)
  looked better at montage scale and needs a full-size check.

## Draw differently from the painting

Anatomy errors in the master. The sprite should follow the real animal.

| Species | What is wrong in the painting |
| --- | --- |
| Giant Otter | Broad scaly beaver-paddle tail; should taper. |
| Marine Iguana | Tail ends in a fish-like fan of fin rays; should be a plain flattened taper. |
| Flying Squirrel | Tail painted as overlapping bird feathers; should be flat and furred. |
| Gharial | Exaggerated saw-tooth fan on the tail tip; treat as stylisation. |
| Peccary | One oversized downward tusk. |
| Mayfly | A seventh leg tip can be read under the abdomen; draw six legs. |
| Fiddler Crab | Three walking legs a side visible; draw four. |
| Vent Crab | Spiny king-crab carapace with whip antennae; seven of eight walking legs visible. |
| Camel Spider | Feather-duster pedipalp tips and three eyes in a row; should be two eyes. |
| Blue Whale | Long scalloped humpback-style flipper. |
| Peacock | Crest painted as a string of beads, not a fan crest. |
| Giant Tube Worm | A colony of seven tubes with feathery plumes, while Tube Worm is a single tube. |

## Do not sample colour from the outline

Key-colour residue or edge flecks that must not be copied as body colour:
Lionfish (fin membranes), Moth (antennae), Thrips (wing fringe), Leopard,
Tiger and Cattle (red and yellow flecks along the silhouette). Octopus
carries key red under near-zero alpha, which shows as a halo in any tool
that drops transparency; other transparent masters may do the same.

## No side view in the master

Whole animals, but not a neutral profile. The artist needs a second
reference for the side silhouette.

- Frontal or three-quarter: Tree Frog, Kookaburra, Fangtooth, Tripod Fish,
  Ray, Manta Ray, Eagle Ray.
- From below: Bullfrog, Freshwater Shrimp, Dragonfly.
- Top-down: Cave Frog, Lobster, Prawn, Crab.
- From behind: Coconut Crab.
- Wings open, frontal or in flight while neighbours stand: Kingfisher,
  Grebe, Pigeon, Quetzal, Owl, Kakapo, Osprey, Frigatebird, Tropicbird.

## Small in frame

Usable, but fine detail is limited: Seahorse, Fly Larvae, Warthog, Horned
Lizard, Sea Squirt, Clam, Jellyfish, Newt, Chameleon, Hawk, Deer Tick,
Walrus, Ibex, Peacock, Tanager, Lungfish, Mite, Giant Octopus, Gecko, Eagle,
Limpet. Thin-bodied: Lancelet, Ice Worm, Whiptail.

## Look-alike species

This is the finding that matters most for pixel art. Two paintings that
differ only in fine texture become the same sprite at 64–96 px. It is not a
painting defect: several of these are one animal under two roster names.

### No carriable difference found

Nothing a small sprite could show separates the members of each group.

| Family | Group |
| --- | --- |
| Quadruped | Bear, Brown Bear, Grizzly Bear |
| Quadruped | Camel, Dromedary Camel |
| Quadruped | Caribou, Reindeer |
| Quadruped | Fox, Red Fox |
| Quadruped | Hyena, Spotted Hyena |
| Quadruped | Wild Boar, Wild Pig |
| Quadruped | Otter, River Otter |
| Quadruped | Pond Turtle, Turtle |
| Quadruped | Coyote, Jackal |
| Quadruped | Alligator Lizard, Coastal Lizard, Lizard, Mountain Lizard |
| Quadruped | Elephant, African Elephant |
| Quadruped | Olm, Blind Salamander |
| Fish | Whale, Humpback Whale (both painted as humpbacks) |
| Fish | Great White Shark, Shark, Juvenile Shark (Mako only slightly bluer and slimmer) |
| Fish | Cod, Pollock (Arctic Cod and Cold-Water Fish barely differ) |
| Fish | Blind Fish, Cave Fish |
| Fish | Flounder, Halibut |
| Bird | Gull, Seabird |
| Bird | Crow, Raven (size only) |
| Gastropod | Snail, Land Snail |
| Bat | Bat, Insect-Eating Bat |
| Small crustacean | Isopod, Giant Isopod (size only) |
| Myriapod | Centipede, Giant Centipede (size only) |
| Annelid | Marine Worm, Polychaete Worm |
| Insect | Diving Beetle, Water Beetle |
| Insect | Bee, Honeybee |
| Serpent | Racer, Rat Snake, Mamba, Garter Snake |

### One weak feature

Each group can be separated, but only by the single feature named.

| Family | Group | Feature |
| --- | --- | --- |
| Quadruped | Alligator, Caiman, Crocodile | Snout width, colour, flank spots |
| Quadruped | Antelope, Impala | Horn sweep |
| Quadruped | Gazelle, Springbok | Horn hook, whiter face |
| Quadruped | Vole, Water Vole, Lemming | Tail length, back stripes |
| Quadruped | Gopher, Prairie Dog | Incisors and foreclaws |
| Quadruped | Fisher, Mink | White chin, thinner tail |
| Quadruped | Weasel, Stoat | Black tail tip |
| Quadruped | Leopard, Jaguar | Build, tail length, rosette size |
| Quadruped | Cat, Wildcat | White paws and bib; ringed blunt tail |
| Quadruped | Buffalo, Water Buffalo | Horn shape |
| Quadruped | Banteng, Gaur | Rump patch; dorsal ridge |
| Quadruped | Fur Seal, Sea Lion | Shade |
| Quadruped | Hyrax, Capybara, Wombat | Muzzle and leg length; scale |
| Quadruped | Forest Elephant against the African pair | Straight down-pointing tusks |
| Fish | Anchovy, Sardine, Herring, Small Fish | Jaw, body depth, gold stripe |
| Fish | Bonefish, Tarpon, Whitefish | Dorsal filament, snout, depth |
| Fish | Cichlid, Tilapia | Colour only |
| Fish | Bass, Sea Bass, Walleye | Side stripe, colour, tail tip |
| Fish | Mudminnow, Killifish | Red spots |
| Fish | Goby, Blenny, Sculpin | Dorsal count, head tuft, pectorals |
| Fish | Eel, Electric Eel | Banding; underside fin |
| Fish | Deep-Sea Fish, Dragonfish, Viperfish | Chin barbel; dorsal lure |
| Bird | Eagle, Hawk | Tail colour, chest |
| Bird | Sandpiper, Snipe | Bill length, head stripes |
| Bird | Finch, Sparrow, Lark | Bill, head pattern, crest |
| Gastropod | Freshwater Snail, Water Snail, Sea Snail | Tentacle shape, shell pattern |
| Bat | Fruit Bat, Vampire Bat against the two above | Face and ears, collar |
| Small crustacean | Cave Shrimp, Krill, Shrimp, Vent Shrimp | Colour only |
| Small crustacean | Brine Shrimp, Fairy Shrimp | Tail and limb colour |
| Cephalopod | Squid, Giant Squid; Octopus, Giant Octopus | Colour or pose only |
| Crab | Mud Crab, Freshwater Crab | Colour and claw size |

### Shared pose

Several distinct species were painted in one pose and silhouette, so pattern
or colour is the only separator: Leopard, Tiger, Clouded Leopard, Snow
Leopard and Cougar; Coyote, Jackal and Dingo; the three brown bears; all
four bats.

## Questions this raises for the design

1. Same-animal entries (Fox and Red Fox, Camel and Dromedary, Whale and
   Humpback Whale): one sprite under two names, or a deliberate
   distinguishing mark for each?
2. For weak-feature groups, is the named feature enough at the chosen sprite
   size, or does the part and recipe model need a rule that guarantees a
   minimum visible difference between two named species?
3. Should size carry identity where it is the only difference (Giant Isopod,
   Giant Centipede, Raven)?
4. The roster names do not change either way; this is about the art.
