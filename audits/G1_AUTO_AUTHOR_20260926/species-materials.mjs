/** Closed motion-kit surfaces. Species names disambiguate mixed-integument profiles. */
export const SPECIES_MATERIAL = Object.freeze({
  fur: ['felid', 'canid', 'hyena', 'bear', 'small-clawed-mammal', 'aquatic-pawed-mammal', 'platypus', 'gliding-mammal', 'aardvark', 'rabbit-hopper', 'marsupial-hopper', 'koala', 'primate', 'hoofed-horned', 'hoofed-unhorned', 'tapir', 'suid', 'bat'],
  scales: ['constricting-snake', 'snake', 'lizard', 'special-lizard', 'marine-iguana', 'crocodilian', 'fish', 'predatory-shark', 'filter-shark', 'tube-snouted-fish'],
  feathers: ['raptor', 'flightless-bird', 'penguin', 'swimming-bird', 'wading-bird', 'ground-foraging-bird', 'bird', 'pheasant'],
  chitin: ['mandibulate-insect', 'soft-mouth-insect', 'aquatic-insect', 'spider', 'scorpion', 'other-arachnid', 'centipede', 'millipede', 'springtail', 'small-crustacean', 'shrimp-prawn', 'fiddler-crab', 'observed-crab'],
  'smooth skin': ['elephant', 'hippo', 'rhino', 'frog', 'salamander', 'caecilian', 'eel', 'jawless-fish', 'cephalopod', 'mudskipper', 'annelid-land', 'land-gastropod', 'annelid-water'],
  warty: ['echinoderm', 'sponge'], plated: ['bivalve', 'tortoise', 'freshwater-turtle'], translucent: ['cnidarian', 'comb-jelly', 'sessile-tunicate'],
});
// These profiles contain both hair and armour: never give the whole profile one surface.
const MIXED = Object.freeze({
 'toothless-clawed-mammal': Object.freeze({'Giant Anteater':'fur',Pangolin:'plated',Echidna:'fur'}),
 xenarthran: Object.freeze({Sloth:'fur',Armadillo:'plated'}),
});
/** C221 exact surface reviews. These classify material, never anatomy or admission. */
export const REVIEWED_SPECIES_SURFACES = Object.freeze({
  "sea-turtle": {
    "Sea Turtle": {
      "surface": "plated",
      "components": [
        "shell",
        "scaly skin"
      ],
      "review": "Shell and four real flippers; no mammalian paws inferred."
    }
  },
  "pinniped": {
    "Walrus": {
      "surface": "smooth skin",
      "components": [
        "skin",
        "sparse hair"
      ],
      "review": "Exact species separates walrus sparse hair from seal/sea-lion coats; flipper topology remains required."
    },
    "Seal": {
      "surface": "fur",
      "components": [
        "skin",
        "hair coat"
      ],
      "review": "Exact species separates walrus sparse hair from seal/sea-lion coats; flipper topology remains required."
    },
    "Fur Seal": {
      "surface": "fur",
      "components": [
        "skin",
        "hair coat"
      ],
      "review": "Exact species separates walrus sparse hair from seal/sea-lion coats; flipper topology remains required."
    },
    "Sea Lion": {
      "surface": "fur",
      "components": [
        "skin",
        "hair coat"
      ],
      "review": "Exact species separates walrus sparse hair from seal/sea-lion coats; flipper topology remains required."
    }
  },
  "ray": {
    "Ray": {
      "surface": "scales",
      "components": [
        "skin",
        "dermal denticles"
      ],
      "review": "Cartilaginous fish integument; no bony armour or shell inferred."
    },
    "Manta Ray": {
      "surface": "scales",
      "components": [
        "skin",
        "dermal denticles"
      ],
      "review": "Cartilaginous fish integument; no bony armour or shell inferred."
    },
    "Eagle Ray": {
      "surface": "scales",
      "components": [
        "skin",
        "dermal denticles"
      ],
      "review": "Cartilaginous fish integument; no bony armour or shell inferred."
    }
  },
  "stingray": {
    "Stingray": {
      "surface": "scales",
      "components": [
        "skin",
        "dermal denticles"
      ],
      "review": "Cartilaginous fish integument; no bony armour or shell inferred."
    }
  },
  "water-gastropod": {
    "Freshwater Snail": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Water Snail": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Sea Snail": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Limpet": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Chiton": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Cowrie": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Conch": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Abalone": {
      "surface": "plated",
      "components": [
        "mantle",
        "muscular foot",
        "calcareous shell"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    },
    "Nudibranch": {
      "surface": "smooth skin",
      "components": [
        "mantle",
        "muscular foot"
      ],
      "review": "Soft mantle/foot remains separately observed anatomy; shell material never authorizes rigid soft appendages."
    }
  },
  "clawed-crustacean": {
    "Crayfish": {
      "surface": "chitin",
      "components": [
        "chitinous exoskeleton"
      ],
      "review": "Jointed external skeleton; shell occupancy does not create missing limbs."
    },
    "Lobster": {
      "surface": "chitin",
      "components": [
        "chitinous exoskeleton"
      ],
      "review": "Jointed external skeleton; shell occupancy does not create missing limbs."
    },
    "Hermit Crab": {
      "surface": "chitin",
      "components": [
        "chitinous exoskeleton"
      ],
      "review": "Jointed external skeleton; shell occupancy does not create missing limbs."
    }
  },
  "terrestrial-crab": {
    "Coconut Crab": {
      "surface": "chitin",
      "components": [
        "chitinous exoskeleton"
      ],
      "review": "Adult coconut crab has its own hardened exoskeleton, not a borrowed gastropod shell or mammalian skin."
    }
  },
  "toothed-cetacean": {
    "Beluga": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Narwhal": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Orca": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Dolphin": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Porpoise": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Sperm Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "River Dolphin": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "Same external skin classification as the existing Dolphin review; no fish scales or blubber-as-surface."
    },
    "Pilot Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "Same external skin classification as the existing toothed cetacean reviews."
    },
    "Beaked Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "Same external skin classification as the existing toothed cetacean reviews; teeth remain separate named anatomy."
    }
  },
  "sirenian": {
    "Manatee": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Dugong": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    }
  },
  "baleen-cetacean": {
    "Blue Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Humpback Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Right Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Gray Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "External skin; blubber is internal insulation, not a new exterior material."
    },
    "Whale": {
      "surface": "smooth skin",
      "components": [
        "skin"
      ],
      "review": "Canonical smooth streamlined body; existing baleen-whale rendering surface."
    }
  },
  "larva": {
    "Fly Larvae": {
      "surface": "smooth skin",
      "components": [
        "soft glossy outer surface"
      ],
      "review": "Canonical creamy-white glossy skin on a legless soft grub; no adult insect exoskeleton or legs inferred."
    }
  },
  "barnacle": {
    "Barnacle": {
      "surface": "plated",
      "components": [
        "fused cone plates",
        "summit plates",
        "soft cirri"
      ],
      "review": "Canonical chalky fused plates; soft cirri retain independent anatomy and are not declared rigid."
    }
  },
  "tardigrade": {
    "Tardigrade": {
      "surface": "smooth skin",
      "components": [
        "flexible outer surface"
      ],
      "review": "Closed rendering-surface category for the plump flexible body; not a taxonomic or chemical claim and no leg admission."
    }
  },
  "horseshoe-crab": {
    "Horseshoe Crab": {
      "surface": "chitin",
      "components": [
        "carapace",
        "jointed appendages"
      ],
      "review": "Arthropod external skeleton; canonical concealed legs are not fabricated by classifying the surface."
    }
  },
  "tunicate": {
    "Salp": {
      "surface": "translucent",
      "components": [
        "gelatinous tunic",
        "muscle bands"
      ],
      "review": "Canonical transparent gelatinous barrel; no vertebrate face inferred."
    },
    "Pyrosome": {
      "surface": "translucent",
      "components": [
        "gelatinous colony surface"
      ],
      "review": "Canonical hollow gelatinous colonial tube; no single animal head inferred."
    }
  }
});
export function materialForProfile(profileId,name){
 if(Object.hasOwn(REVIEWED_SPECIES_SURFACES,profileId))return REVIEWED_SPECIES_SURFACES[profileId][name]?.surface??null;
 if(Object.hasOwn(MIXED,profileId))return MIXED[profileId][name]??null;
 return Object.entries(SPECIES_MATERIAL).find(([,ids])=>ids.includes(profileId))?.[0]??null;
}
