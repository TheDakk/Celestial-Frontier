/** Exact-name Earth fauna presentation profiles, matches catalogue September 16.
 * This is a gameplay authoring register, not proof of a fitted/painted species.
 * candidateTemplates and intendedMoves expose work still needed. No profile
 * supplies landmarks, paint, damage, genes or a conditional weapon. */
export type FaunaMedium='ground'|'air'|'water';
export interface EarthFaunaProfile {
 readonly id:string; readonly names:readonly string[];
 readonly candidateTemplates:readonly string[]; readonly media:readonly FaunaMedium[];
 readonly intendedMoves:readonly string[]; readonly notes:string;
}
const group=(id:string,names:string[],candidateTemplates:string[],media:FaunaMedium[],intendedMoves:string[],notes:string):EarthFaunaProfile=>Object.freeze({id,names:Object.freeze(names),candidateTemplates:Object.freeze(candidateTemplates),media:Object.freeze(media),intendedMoves:Object.freeze(intendedMoves),notes});
export const EARTH_FAUNA_PROFILES:readonly EarthFaunaProfile[]=Object.freeze([
 group("felid",["Jaguar", "Leopard", "Tiger", "Clouded Leopard", "Ocelot", "Lion", "Cougar", "Snow Leopard", "Bobcat", "Lynx", "Caracal", "Fishing Cat", "Cheetah", "Serval", "Sand Cat", "Wildcat", "Cat"],["quadruped"],["ground"],["claw", "bite"],""),
 group("canid",["Jackal", "Wolf", "Coyote", "Fox", "Red Fox", "Arctic Fox", "African Wild Dog", "Maned Wolf", "Pampas Fox", "Fennec Fox", "Dog", "Dingo"],["quadruped"],["ground"],["bite", "claw"],""),
 group("hyena",["Hyena", "Spotted Hyena", "Striped Hyena"],["quadruped"],["ground"],["bite"],""),
 group("bear",["Sloth Bear", "Spectacled Bear", "Panda", "Black Bear", "Brown Bear", "Polar Bear", "Bear", "Sun Bear", "Grizzly Bear"],["quadruped"],["ground"],["claw", "bite"],""),
 group("small-clawed-mammal",["Kinkajou", "Coati", "Civet", "Mongoose", "Meerkat", "Red Panda", "Raccoon", "Badger", "Weasel", "Stoat", "Mink", "Marten", "Fisher", "Wolverine", "Possum", "Porcupine", "Squirrel", "Chipmunk", "Mouse", "Vole", "Mole", "Shrew", "Hedgehog", "Lemming", "Marmot", "Prairie Dog", "Ground Squirrel", "Gopher", "Hamster", "Gerbil", "Hyrax", "Agouti", "Guinea Pig", "Rat", "Tree Shrew", "Wombat", "Tasmanian Devil", "Quoll"],["quadruped"],["ground"],["bite", "claw"],""),
 group("aquatic-pawed-mammal",["River Otter", "Otter", "Giant Otter", "Sea Otter", "Beaver", "Capybara", "Water Vole", "Marsh Rodent"],["quadruped"],["ground", "water"],["bite", "claw"],""),
 group("gliding-mammal",["Flying Squirrel", "Sugar Glider", "Colugo"],["quadruped"],["air", "ground"],["bite", "claw"],"Gliding membrane needs its own observed geometry; ordinary quadruped legs do not certify gliding."),
 group("toothless-clawed-mammal",["Giant Anteater", "Pangolin", "Echidna"],["quadruped"],["ground"],["claw"],"No bite granted from the quadruped default."),
 group("xenarthran",["Sloth", "Armadillo"],["quadruped"],["ground"],["claw"],""),
 group("aardvark",["Aardvark"],["quadruped"],["ground"],["claw"],""),
 group("rabbit-hopper",["Pika", "Rabbit", "Hare", "Snowshoe Hare", "Jackrabbit", "Jerboa", "Arctic Hare", "Mara"],["hopper", "quadruped"],["ground"],["kick", "bite"],""),
 group("marsupial-hopper",["Kangaroo", "Wallaby"],["hopper"],["ground"],["kick", "bite"],""),
 group("koala",["Koala"],["quadruped"],["ground"],["claw", "bite"],""),
 group("primate",["Gorilla", "Chimpanzee", "Orangutan", "Capuchin", "Howler Monkey", "Spider Monkey", "Tamarin", "Macaque", "Langur", "Baboon", "Monkey", "Lemur", "Gibbon", "Mandrill", "Marmoset", "Aye-Aye", "Proboscis Monkey"],["primate"],["ground"],["punch", "bite"],""),
 group("hoofed-horned",["Gaur", "Banteng", "Water Buffalo", "Deer", "Antelope", "Takin", "Elk", "Moose", "Reindeer", "Caribou", "Mountain Goat", "Ibex", "Chamois", "Giraffe", "Kudu", "Impala", "Buffalo", "Wildebeest", "Eland", "Gazelle", "Hartebeest", "Oryx", "Bison", "Saiga", "Yak", "Cattle", "Sheep", "Goat", "Wild Sheep", "Musk Ox", "Cow", "Bull", "Pronghorn", "Springbok", "Bongo", "Duiker", "Gerenuk", "Nilgai", "Tahr", "Serow"],["quadruped"],["ground"],["gore", "headbutt", "kick"],"Horn/antler use additionally needs an observed weapon; sex/age and hornless masters must not receive gore."),
 group("hoofed-unhorned",["Zebra", "Wild Horse", "Wild Ass", "Camel", "Wild Pony", "Dromedary Camel", "Bactrian Camel", "Horse", "Donkey", "Llama", "Alpaca", "Okapi"],["quadruped"],["ground"],["kick", "bite"],"No generic claw; horn use not inferred."),
 group("tapir",["Tapir", "Mountain Tapir"],["quadruped"],["ground", "water"],["bite", "headbutt"],""),
 group("suid",["Wild Boar", "Peccary", "Warthog", "Wild Pig", "Pig"],["quadruped"],["ground"],["bite", "gore", "headbutt"],"Tusks must be observed before a gore motion is admitted."),
 group("elephant",["Elephant", "Forest Elephant", "Asian Elephant", "African Elephant"],["quadruped"],["ground"],["gore", "headbutt"],"Tusks/trunk require their own observed contact geometry."),
 group("rhino",["Rhinoceros"],["quadruped"],["ground"],["gore", "headbutt"],""),
 group("hippo",["Hippopotamus"],["quadruped"],["ground", "water"],["bite", "headbutt"],""),
 group("platypus",["Platypus"],["quadruped"],["ground", "water"],["bite"],"Bill contact; a male hind spur is conditional and is not assumed."),
 group("bat",["Fruit Bat", "Bat", "Insect-Eating Bat", "Vampire Bat"],["flyer-membrane"],["air", "ground"],["bite", "claw"],""),
 group("pinniped",["Walrus", "Seal", "Fur Seal", "Sea Lion"],["quadruped"],["water", "ground"],["bite"],"Requires flipper topology and swimming/haul-out poses, not a four-legged walking substitute."),
 group("toothed-cetacean",["Beluga", "Narwhal", "Orca", "River Dolphin", "Dolphin", "Porpoise", "Sperm Whale", "Pilot Whale", "Beaked Whale"],["fish"],["water"],["bite"],"Swimming template needs mammalian fluke axis/absence declarations; narwhal tusk remains conditional."),
 group("baleen-cetacean",["Right Whale", "Blue Whale", "Humpback Whale", "Gray Whale", "Whale"],["fish"],["water"],["body", "tail"],"No biting teeth invented. Generic Whale is conservative; fluke contact needs observed anatomy."),
 group("sirenian",["Manatee", "Dugong"],["fish"],["water"],["body", "tail"],"No legs or claw attack; fluke topology required."),
 group("raptor",["Eagle", "Owl", "Hawk", "Falcon", "Snowy Owl", "Osprey", "Kestrel", "Desert Owl", "Harpy Eagle"],["biped-bird"],["air", "ground"],["claw", "peck"],""),
 group("flightless-bird",["Ostrich", "Rhea", "Emu", "Cassowary", "Kiwi", "Kakapo"],["biped-bird"],["ground"],["kick", "peck"],"No aerial attack. Wings do not imply flight."),
 group("penguin",["Penguin"],["biped-bird"],["ground", "water"],["peck"],"Flipper swimming, no aerial attack."),
 group("swimming-bird",["Goose", "Duck", "Swan", "Eider Duck", "Auk", "Puffin", "Guillemot", "Loon", "Grebe", "Cormorant", "Coot", "Moorhen"],["biped-bird"],["air", "water", "ground"],["peck", "kick"],""),
 group("wading-bird",["Heron", "Egret", "Ibis", "Stork", "Crane", "Spoonbill", "Flamingo", "Curlew", "Snipe", "Plover", "Sandpiper", "Rail", "Bittern", "Oystercatcher", "Godwit", "Avocet", "Screamer"],["biped-bird"],["air", "ground"],["peck", "kick"],""),
 group("ground-foraging-bird",["Peacock", "Guineafowl", "Turkey", "Grouse", "Ptarmigan", "Bustard", "Sandgrouse", "Quail", "Partridge", "Roadrunner", "Chicken", "Rooster", "Secretary Bird", "Seriema"],["biped-bird"],["air", "ground"],["peck", "kick"],"Flight-capable does not require every move to be airborne."),
 group("bird",["Macaw", "Parrot", "Toucan", "Hornbill", "Hummingbird", "Kingfisher", "Vulture", "Tanager", "Woodpecker", "Crow", "Raven", "Robin", "Cardinal", "Chough", "Lark", "Sparrow", "Finch", "Swallow", "Magpie", "Jay", "Dove", "Gull", "Pigeon", "Tern", "Albatross", "Petrel", "Skua", "Condor", "Swift", "Pelican", "Gannet", "Frigatebird", "Seabird", "Booby", "Tropicbird", "Snow Petrel", "Starling", "Cockatoo", "Kookaburra", "Hoatzin", "Quetzal", "Weaverbird"],["biped-bird"],["air", "ground"],["peck"],""),
 group("constricting-snake",["Anaconda", "Boa", "Python", "Sand Boa"],["serpent"],["ground", "water"],["strike", "constrict"],""),
 group("snake",["Cobra", "Viper", "Tree Snake", "Rat Snake", "Garter Snake", "Cottonmouth", "Water Snake", "Mamba", "Rattlesnake", "Racer", "Mountain Viper", "Whip Snake", "Grass Snake", "King Snake", "Cave Snake", "Snake", "Vine Snake"],["serpent"],["ground", "water"],["strike"],""),
 group("crocodilian",["Caiman", "Crocodile", "Alligator", "Gharial"],["quadruped"],["water", "ground"],["bite", "tail"],"Low sprawling legs and tail; no fur/ears from a mammal template."),
 group("lizard",["Monitor Lizard", "Anole", "Gecko", "Skink", "Alligator Lizard", "Mountain Lizard", "Tegu", "Wall Lizard", "Lizard", "Whiptail", "Agama", "Iguana", "Land Iguana", "Coastal Lizard", "Komodo Dragon", "Gila Monster", "Frilled Lizard"],["quadruped"],["ground"],["bite", "tail"],"Reptile-specific absence and skin declarations required."),
 group("special-lizard",["Chameleon", "Horned Lizard"],["quadruped"],["ground"],["bite"],"Do not invent a rigid striking horn or tail weapon from the name."),
 group("marine-iguana",["Marine Iguana"],["quadruped"],["ground", "water"],["bite", "tail"],""),
 group("tortoise",["Tortoise", "Box Turtle"],["quadruped"],["ground"],["bite"],"Shell and retracted limbs need actual observed topology."),
 group("freshwater-turtle",["Pond Turtle", "Snapping Turtle", "Softshell Turtle", "Turtle"],["quadruped"],["water", "ground"],["bite"],""),
 group("sea-turtle",["Sea Turtle"],["quadruped"],["water", "ground"],["bite"],"Flipper topology required; no running paws."),
 group("frog",["Tree Frog", "Poison Dart Frog", "Bullfrog", "Glass Frog", "Frog", "Wood Frog", "Toad", "Cave Frog"],["hopper"],["ground", "water"],["kick", "bite"],"Adult frog: tail and external ears absent."),
 group("salamander",["Salamander", "Newt", "Giant Salamander", "Alpine Salamander", "Olm", "Blind Salamander", "Axolotl"],["quadruped"],["water", "ground"],["bite"],"Preserve tail and optional external gills; no mammalian ears."),
 group("caecilian",["Caecilian"],["serpent"],["ground", "water"],["strike"],"Limb-free amphibian; no venom or constriction inferred."),
 group("fish",["Salmon", "Trout", "Char", "Pike", "Catfish", "Gar", "Bowfin", "Bass", "Carp", "Tilapia", "Piranha", "Killifish", "Arctic Cod", "Herring", "Cold-Water Fish", "Blind Fish", "Small Fish", "Grayling", "Minnow", "Sculpin", "Sturgeon", "Paddlefish", "Perch", "Pacu", "Arapaima", "Arowana", "Cichlid", "Tetra", "Sunfish", "Walleye", "Whitefish", "Lungfish", "Tigerfish", "Goldfish", "Mullet", "Tarpon", "Snapper", "Cave Fish", "Goby", "Blenny", "Flounder", "Grouper", "Bonefish", "Barracuda", "Reef Fish", "Cod", "Mackerel", "Halibut", "Clownfish", "Damselfish", "Butterflyfish", "Angelfish", "Surgeonfish", "Tang", "Triggerfish", "Parrotfish", "Wrasse", "Cardinalfish", "Lionfish", "Pufferfish", "Boxfish", "Rabbitfish", "Sea Bass", "Tuna", "Haddock", "Pollock", "Marlin", "Sailfish", "Swordfish", "Mahi-Mahi", "Wahoo", "Sardine", "Anchovy", "Flying Fish", "Anglerfish", "Lanternfish", "Viperfish", "Fangtooth", "Dragonfish", "Oarfish", "Barreleye", "Blobfish", "Tripod Fish", "Snailfish", "Deep-Sea Fish", "Monkfish", "Coelacanth", "Ocean Sunfish", "Remora", "Archerfish", "Knifefish", "Icefish", "Mudminnow", "Flying Gurnard"],["fish"],["water"],["bite"],"Fin/body variants and toothless suction-feeders need actual jaw/feeding-part observation; not a claim of teeth."),
 group("eel",["Eel", "Electric Eel", "Moray Eel", "Gulper Eel"],["fish", "serpent"],["water"],["bite", "strike"],"No legs. Electrical effects are abilities, not physical anatomy."),
 group("jawless-fish",["Lamprey", "Lancelet"],["fish"],["water"],["body"],"No articulated biting jaw invented."),
 group("tube-snouted-fish",["Seahorse", "Pipefish"],["fish"],["water"],["body"],"No conventional jaw bite; feeding/suction contact needs a specific observation."),
 group("mudskipper",["Mudskipper"],["fish"],["water", "ground"],["body", "bite"],"Amphibious pectoral support, never quadruped paws."),
 group("predatory-shark",["Juvenile Shark", "Shark", "Reef Shark", "Hammerhead Shark", "Great White Shark", "Tiger Shark", "Mako Shark"],["fish"],["water"],["bite"],""),
 group("filter-shark",["Whale Shark", "Basking Shark"],["fish"],["water"],["body"],"No predatory bite inferred from shark family."),
 group("ray",["Ray", "Manta Ray", "Eagle Ray"],["fish"],["water"],["body"],"Disc/pectoral fins; stinging tail not inferred from a broad ray identity."),
 group("stingray",["Stingray"],["fish"],["water"],["tail"],"Tail barb must be observed; existing generic fish bite is not appropriate."),
 group("cephalopod",["Squid", "Octopus", "Cuttlefish", "Giant Octopus", "Giant Squid", "Vampire Squid", "Deep-Sea Octopus", "Nautilus"],["cephalopod"],["water"],["lash", "bite"],"Preserve arm/tentacle counts and shell; Nautilus does not inherit exactly eight arms."),
 group("cnidarian",["Jellyfish", "Portuguese Man-of-War", "Sea Anemone", "Coral", "Cold-Water Coral", "Deep-Water Coral"],["radial"],["water"],["sting-arms"],"Colony/sessile forms need anchored topology, not swimming-bell motion."),
 group("comb-jelly",["Comb Jelly"],["radial"],["water"],["body"],"No cnidarian sting inferred."),
 group("echinoderm",["Starfish", "Sea Urchin", "Sea Cucumber", "Sand Dollar", "Brittle Star"],["radial"],["water"],["body"],"No universal sting, jaw or jellyfish bell."),
 group("sponge",["Sponge"],[],["water"],[],"Sessile filtration; effect-only combat needs a verified root/colony anchor."),
 group("tunicate",["Sea Squirt", "Salp", "Pyrosome"],[],["water"],[],"Sessile or colonial suspension feeders; no invented jaws, legs or arms."),
 group("bivalve",["Mussel", "Oyster", "Clam", "Razor Clam", "Giant Clam", "Scallop"],[],["water"],[],"Valve closure/jet escape needs a valve rig; do not call it a bite."),
 group("land-gastropod",["Land Snail", "Banana Slug", "Snail"],[],["ground"],[],"Foot-wave/retraction needs a gastropod body; no leg or snake-jaw substitution."),
 group("water-gastropod",["Freshwater Snail", "Water Snail", "Sea Snail", "Limpet", "Chiton", "Nudibranch", "Cowrie", "Conch", "Abalone"],[],["water"],[],"Radula/mantle/foot are not a fish bite or jellyfish arms."),
 group("annelid-land",["Earthworm", "Ice Worm"],[],["ground"],[],"Segmented body compression needs observed source geometry."),
 group("annelid-water",["Leech", "Marine Worm", "Tube Worm", "Polychaete Worm", "Giant Tube Worm", "Scale Worm", "Flatworm"],[],["water"],[],"Different feeding structures; no universal jaw or venom."),
 group("clawed-crustacean",["Crayfish", "Freshwater Crab", "Crab", "Hermit Crab", "Fiddler Crab", "Mud Crab", "Lobster", "Vent Crab"],[],["water", "ground"],["pinch"],"Pincer, walking-leg and abdomen counts need a crustacean topology; do not substitute spider chelicerae."),
 group("small-crustacean",["Brine Shrimp", "Water Flea", "Krill", "Copepod", "Amphipod", "Cave Shrimp", "Freshwater Shrimp", "Shrimp", "Prawn", "Giant Isopod", "Isopod", "Vent Shrimp", "Fairy Shrimp", "Tadpole Shrimp"],[],["water"],[],"Observed segmented swimming/crawling appendages; no generic stinger."),
 group("barnacle",["Barnacle"],[],["water"],[],"Anchored feeding cirri, no locomotor leap."),
 group("horseshoe-crab",["Horseshoe Crab"],[],["water", "ground"],[],"Telson is not a venomous stinger; dedicated topology needed."),
 group("spider",["Tarantula", "Spider"],["arachnid"],["ground"],["bite"],"No scorpion stinger."),
 group("scorpion",["Scorpion"],["arachnid"],["ground"],["sting", "bite"],""),
 group("other-arachnid",["Deer Tick", "Camel Spider", "Harvestman", "Pseudoscorpion", "Mite", "Sea Spider"],["arachnid"],["ground"],["body"],"Distinct mouth/palp/pincer inventories; no scorpion tail assigned."),
 group("centipede",["Centipede", "Giant Centipede"],["myriapod"],["ground"],["mandible"],"Venom claws are at the head; no rear stinger."),
 group("millipede",["Millipede"],["myriapod"],["ground"],["body"],"No centipede forcipules or tail sting."),
 group("mandibulate-insect",["Leafcutter Ant", "Termite", "Mantis", "Locust", "Dung Beetle", "Beetle", "Grasshopper", "Cricket", "Ant", "Honeybee", "Bumblebee", "Ladybug", "Bee", "Orchid Bee", "Water Beetle", "Caddisfly", "Stonefly", "Dragonfly", "Damselfly", "Diving Beetle", "Cave Cricket", "Cockroach", "Wasp", "Carrion Beetle", "Stick Insect", "Firefly", "Dobsonfly"],["insect"],["ground"],["mandible"],"Wings/stings are conditional; ant/termite castes and aquatic larvae must retain their actual stage. Flight requires a source habitat declaration for the observed stage."),
 group("soft-mouth-insect",["Butterfly", "Cicada", "Mosquito", "Black Fly", "Moth", "Aphid", "Fly", "Cold-Adapted Insect", "Mayfly", "Scorpionfly", "Thrips"],["insect"],["air", "ground"],["body"],"Proboscis/stylet/body/effect motion; no chewing mandible or scorpion sting inferred."),
 group("aquatic-insect",["Water Strider", "Giant Water Bug"],["insect"],["water", "ground", "air"],["body"],"Surface/piercing mouthparts need observation; no submerged fish pose."),
 group("larva",["Fly Larvae"],[],["water", "ground"],[],"Life stage cannot inherit adult wings or adult six-leg graph."),
 group("springtail",["Springtail"],["insect"],["ground"],["body"],"Furcula jump needs observed spring organ, not a stinger."),
 group("tardigrade",["Tardigrade"],[],["water", "ground"],[],"Eight lobopod legs and stylets require exact topology; no arachnid fangs."),
 group("pheasant",["Pheasant"],["biped-bird"],["air", "ground"],["peck", "claw"],"Foot rake on the observed foot, not an inferred raptor talon."),
 group("terrestrial-crab",["Coconut Crab"],[],["ground"],["pinch"],"Dedicated pincer/leg topology required; adult is not a submerged aquatic fighter."),
 ]);
const byName=new Map<string,EarthFaunaProfile>();
for(const profile of EARTH_FAUNA_PROFILES)for(const name of profile.names){
 if(byName.has(name))throw Error('Duplicate Earth fauna profile: '+name);
 byName.set(name,profile);
}
export function earthFaunaProfile(name:string):EarthFaunaProfile|undefined{return byName.get(name);}
/** Exact coverage check against the caller's live catalogue, not a fixed count. */
export function auditEarthFaunaProfiles(names:readonly string[]){
 const current=new Set(names);
 const missing=names.filter(n=>!byName.has(n));
 const obsolete=[...byName.keys()].filter(n=>!current.has(n));
 const duplicates=names.filter((n,i)=>names.indexOf(n)!==i);
 return {status:missing.length||obsolete.length||duplicates.length?'FAIL' as const:'PASS' as const,
  species:current.size,profiles:EARTH_FAUNA_PROFILES.length,missing,obsolete,duplicates};
}
