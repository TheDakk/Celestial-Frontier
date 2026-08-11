/* Exact machine-readable review coordinates shared by the Node evidence
   producer and packager. Human-readable crop labels remain inside the rendered
   atlas only; the sealed manifest carries identities and numeric geometry. */
export const HYBRID_REVIEW_LINEAGES = Object.freeze([
  { id: 'fruit-bat', species: 'Fruit Bat', kingdom: 'fauna', challenge: 'head-graft', crops: [[92,185,55,55],[293,185,55,55],[192,105,55,55],[192,286,55,55]] },
  { id: 'eagle', species: 'Eagle', kingdom: 'fauna', challenge: 'dorsal-tail', crops: [[166,166,55,55],[220,210,55,55],[95,112,55,55],[176,286,55,55]] },
  { id: 'wolf', species: 'Wolf', kingdom: 'fauna', challenge: 'palette-contrast', crops: [[274,161,55,55],[271,263,55,55],[126,267,55,55],[80,197,55,55]] },
  { id: 'elephant', species: 'Elephant', kingdom: 'fauna', challenge: 'head-graft', crops: [[276,176,55,55],[269,216,55,55],[232,154,55,55],[250,276,55,55]] },
  { id: 'sea-turtle', species: 'Sea Turtle', kingdom: 'fauna', challenge: 'extra-eyes', crops: [[286,194,55,55],[252,262,55,55],[125,258,55,55],[99,211,55,55]] },
  { id: 'great-white-shark', species: 'Great White Shark', kingdom: 'fauna', challenge: 'dorsal-tail', crops: [[275,191,55,55],[203,135,55,55],[223,245,55,55],[92,198,55,55]] },
  { id: 'chameleon', species: 'Chameleon', kingdom: 'fauna', challenge: 'head-graft', crops: [[218,125,55,55],[198,180,55,55],[151,218,55,55],[124,174,55,55]] },
  { id: 'dragonfly', species: 'Dragonfly', kingdom: 'fauna', challenge: 'extra-eyes', crops: [[178,120,55,55],[178,150,55,55],[126,133,55,55],[145,149,55,55]] },
  { id: 'octopus', species: 'Octopus', kingdom: 'fauna', challenge: 'bulk-length', crops: [[128,251,55,55],[257,251,55,55],[192,153,55,55],[193,274,55,55]] },
  { id: 'apple', species: 'Apple', kingdom: 'flora', challenge: 'palette-contrast', crops: [[193,218,55,55],[132,173,55,55],[254,173,55,55],[240,130,55,55]] },
  { id: 'vanilla-orchid', species: 'Vanilla Orchid', kingdom: 'flora', challenge: 'head-graft', crops: [[193,300,55,55],[154,226,55,55],[230,220,55,55],[193,129,55,55]] },
  { id: 'oyster-mushroom', species: 'Oyster Mushroom', kingdom: 'fungi', challenge: 'bulk-length', crops: [[115,201,55,55],[193,164,55,55],[271,211,55,55],[192,286,55,55]] },
  { id: 'amoeba', species: 'Amoeba', kingdom: 'microbe', challenge: 'extra-eyes', crops: [[20,200,55,55],[205,92,55,55],[200,190,55,55],[345,155,55,55]] },
].map((row) => Object.freeze({ ...row, crops: Object.freeze(row.crops.map((crop) => Object.freeze(crop))) })));
