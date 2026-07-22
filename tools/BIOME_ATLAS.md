# Celestial Frontier — Biome Atlas & Color Plan (Phase 4)

_Generated 2026-07-20 from: live `BIOME_SETS` (main.js) + data-pack CSVs (01_EARTH 93 · 02_NON_EARTH 315) + Additional Biomes file. Colors are PROPOSED signatures for the biome→dot / biome→vista tint._

> **VISTA/LANDING coverage as of v1.6 Batch 15.5 (render-only):** all 43 BIOME_PROFILES (= 39 surface/
> ocean + 4 gas giants) render as landing vistas, verified in three modes via `tools/sheets/biome-coverage.js`
> (`MODE=earth`|`proc`, `EMPTY=1`) and gated by `tools/biome-audit.js`. Coral→`_hdReefScene`, abyssal→
> `_hdAbyssScene` (both draw fauna only when populated), gas→`_hdDeckScene` (native aerial life; Earth life
> unsupported). `_hdBiomeDress` cases strengthened for canyon (walls), glass (shards), saltflat vs saltpan,
> and the rocky cluster (geode amethyst crystals etc.). ICE/GREY/HAZE worlds now place creatures. Fauna-free
> by design: **acidhaze, abyssgreen** (`fauna:[]`). Remaining look-alike-cluster differentiation
> (marsh/swamp/mangrove · ice family · rocky boulder/graben/carbon · sulfur/acid/abyssgreen · ember family)
> is tracked as NON-BLOCKING post-lock polish.

## 1 · LIVE biomes (43, in the game now — colored FIRST in Phase 4)

**Terran 🌍** — Temperate `soft green #6f9a52` · Savanna `gold #c9a24a` · Jungle `deep emerald #2f7d4f` · Marsh `reed olive #7f8a45` · Swamp `blackwater teal #4a5940` · Mangrove `warm green-brown #5c7a4a` · Tundra `pale sage-gray #9fb0a0` · Karst `limestone gray #b8b0a0` · Salt-Flat `blinding white #e8e6dc` · Fungal (rare) `muted violet #9a6fb0` · Crystal Steppe (rare) `mineral cyan #7fb0c0`

**Ocean 🌊** — Open-Sea `deep blue #2a5a8a` · Archipelago `teal-green #3a8a80` · Coral-Shallows `turquoise #40c0b0` · Storm-Sea `slate blue-gray #4a5a70` · Volcanic-Archipelago `dark teal+ember #2a6a6a` · Abyssal `near-black blue #16283e` · Milk-Sea (rare) `luminous cyan #a0d0d0`

**Ice ❄️** — Glacier `ice white-blue #cfe0ea` · Pack-Ice `cold gray-blue #a0b8c8` · Cryogeyser `pale cyan #b0d0d8` · Blue-Ice (rare) `glowing blue #6fa8d0`

**Desert 🏜️** — Dune-Sea `sand #d8b878` · Canyon `red-rock #b06a48` · Salt-Pan `white-brine #ded8c8` · Oxide-Waste `rust #b0603a` · Glass-Desert (rare) `sharp amber #c8b0a0`

**Rocky 🪨** — Cratered `gray #9a9a94` · Boulder-Field `stone tan #a8a090` · Graben-Canyon `shadowed gray #78787a` · Geode (rare) `amethyst #9a6fc0` · Carbon (rare) `graphite black #2a2a2e`

**Venus-type 🟡** — Sulfur-Storm `gold-green #b0a040` · Acid-Haze `sickly yellow #b8a850` · Greenhouse-Abyss `dark olive-heat #6a6030`

**Lava 🌋** — Ash-Waste `gray ash #7a7570` · Ember-Field `orange-red #c05028` · Obsidian `black glass #2a2428` · Magma-Sea `molten orange #e06020`

**Gas giant 🪐** — Banded `cream-tan bands #c8b090` · Pastel-Ammonia `soft pastel #d0c8d8` · Storm-Eye `deep red-brown #a0604a` · Ember giant (rare) `sullen red #b04030`

## 2 · EARTH biomes — data pack (93, by family)

### Cave (6)
- **Limestone Cave** — Variable · Cave terrain  _(starter zone)_
- **Tropical Cave** — Tropical · Cave terrain  _(starter zone)_
- **Lava Tube** — Variable · Rocky or geological terrain  _(starter zone)_
- **Sea Cave** — Variable · Cave terrain  _(starter zone)_
- **Ice / Desert Cave** — Arid · Arid open terrain  _(starter zone)_
- **Crystal Cavern** — Subterranean · Natural mineral crystals, cave pools and narrow passages  _(starter zone)_

### Coastal (8)
- **Sandy Beach** — Maritime · Coastal terrain  _(starter zone)_
- **Coastal Dunes** — Maritime · Arid open terrain  _(starter zone)_
- **Rocky Coast / Tide Pool** — Maritime · Coastal terrain  _(starter zone)_
- **Estuary** — Maritime · Coastal terrain  _(starter zone)_
- **Salt Marsh / Mudflat** — Maritime · Freshwater or wetland terrain  _(starter zone)_
- **Mangrove Coast** — Maritime · Coastal terrain  _(starter zone)_
- **Lagoon** — Maritime · Coastal terrain  _(starter zone)_
- **Fjord / Sea Cliff** — Maritime · Rocky or geological terrain  _(starter zone)_

### Desert (8)
- **Hot Sandy Desert** — Arid · Arid open terrain  _(starter zone)_
- **Rocky Desert** — Arid · Arid open terrain  _(starter zone)_
- **Cold Desert** — Arid · Arid open terrain  _(starter zone)_
- **Badlands** — Arid · Arid open terrain  _(starter zone)_
- **Salt Flat** — Arid · Arid open terrain  _(starter zone)_
- **Oasis** — Variable · Desert terrain  _(starter zone)_
- **Desert Canyon** — Arid · Arid open terrain  _(starter zone)_
- **Dune Sea** — Hyper-arid hot or cold desert · Continuous dune fields with sparse interdune basins  _(starter zone)_

### Forest (11)
- **Tropical Rainforest** — Tropical · Wooded terrain  _(starter zone)_
- **Tropical Seasonal Forest** — Tropical · Wooded terrain  _(starter zone)_
- **Tropical Dry Forest** — Tropical · Wooded terrain  _(starter zone)_
- **Cloud Forest** — Variable · Wooded terrain  _(starter zone)_
- **Bamboo Forest** — Variable · Wooded terrain  _(starter zone)_
- **Temperate Deciduous Forest** — Temperate · Wooded terrain  _(starter zone)_
- **Temperate Rainforest** — Temperate · Wooded terrain  _(starter zone)_
- **Boreal Forest / Taiga** — Variable · Wooded terrain  _(starter zone)_
- **Montane Forest** — Highland · Wooded terrain  _(starter zone)_
- **Swamp Forest** — Variable · Wooded terrain  _(starter zone)_
- **Forest Canopy** — Tropical or temperate humid · Upper tree crowns, epiphyte mats and suspended vines  _(starter zone)_

### Freshwater (12)
- **Mountain Stream** — Highland · Freshwater or wetland terrain  _(starter zone)_
- **Lowland River** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **Tropical River** — Tropical · Freshwater or wetland terrain  _(starter zone)_
- **Temperate Lake** — Temperate · Freshwater or wetland terrain  _(starter zone)_
- **Tropical Lake** — Tropical · Freshwater or wetland terrain  _(starter zone)_
- **Pond** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **Marsh** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **Swamp** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **Bog** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **Floodplain** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **River Delta** — Variable · Freshwater or wetland terrain  _(starter zone)_
- **Freshwater Spring** — Variable · Freshwater or wetland terrain  _(starter zone)_

### Geological (6)
- **Impact Crater** — Climate-dependent · Crater rim, ejecta field and sheltered basin  _(starter zone)_
- **Boulder Field / Talus Field** — Temperate, alpine or arid · Loose boulders, scree slopes and rock cavities  _(starter zone)_
- **Rift Valley / Graben** — Variable, often warm and dry · Fault-bounded valley, escarpments, lakes and volcanic soils  _(starter zone)_
- **Volcanic Ash Field** — Variable volcanic · Ash, pumice, tephra and eroded gullies  _(starter zone)_
- **Obsidian Field** — Arid or volcanic highland · Sharp volcanic glass, lava ridges and sparse soil pockets  _(starter zone)_
- **Sulfur Field** — Geothermal · Fumaroles, sulfur crusts, acidic pools and steaming ground  _(starter zone)_

### Grassland (7)
- **African Savanna** — Variable · Grassland terrain  _(starter zone)_
- **Tropical Flooded Grassland** — Tropical · Grassland terrain  _(starter zone)_
- **Prairie** — Variable · Grassland terrain  _(starter zone)_
- **Steppe** — Variable · Grassland terrain  _(starter zone)_
- **Pampas** — Variable · Grassland terrain  _(starter zone)_
- **Meadow** — Variable · Grassland terrain  _(starter zone)_
- **Alpine Meadow** — Highland · Grassland terrain  _(starter zone)_

### Human (6)
- **Farmland** — Variable · Human-modified terrain  _(starter zone)_
- **Pasture / Ranch** — Variable · Human-modified terrain  _(starter zone)_
- **Orchard / Vineyard** — Variable · Human-modified terrain  _(starter zone)_
- **Village / Suburb** — Variable · Human-modified terrain  _(starter zone)_
- **City / Harbor** — Variable · Human-modified terrain  _(starter zone)_
- **Ruins / Graveyard** — Variable · Human-modified terrain  _(starter zone)_

### Island (5)
- **Tropical Island** — Tropical · Island terrain  _(starter zone)_
- **Volcanic Island** — Maritime · Island terrain  _(starter zone)_
- **Coral Atoll** — Maritime · Island terrain  _(starter zone)_
- **Subantarctic Island** — Polar · Island terrain  _(starter zone)_
- **Archipelago** — Variable maritime · Island chains, channels, reefs and exposed headlands  _(starter zone)_

### Marine (8)
- **Coral Reef** — Maritime · Marine terrain  _(starter zone)_
- **Seagrass Meadow** — Maritime · Marine terrain  _(starter zone)_
- **Kelp Forest** — Maritime · Wooded terrain  _(starter zone)_
- **Continental Shelf** — Maritime · Marine terrain  _(starter zone)_
- **Open Ocean** — Maritime · Marine terrain  _(starter zone)_
- **Deep Ocean / Abyssal Plain** — Maritime · Marine terrain  _(starter zone)_
- **Ocean Trench / Hydrothermal Vent** — Maritime · Marine terrain  _(starter zone)_
- **Seamount / Underwater Canyon** — Maritime · Marine terrain  _(starter zone)_

### Mountain (7)
- **Rocky Mountain** — Highland · Rocky or geological terrain  _(starter zone)_
- **Tropical Mountain** — Tropical · Rocky or geological terrain  _(starter zone)_
- **Cliff / Escarpment** — Variable · Rocky or geological terrain  _(starter zone)_
- **Karst Mountains / Sinkholes** — Highland · Rocky or geological terrain  _(starter zone)_
- **Volcanic Slopes** — Variable · Rocky or geological terrain  _(starter zone)_
- **Lava Field** — Variable · Rocky or geological terrain  _(starter zone)_
- **Geothermal Basin** — Variable · Rocky or geological terrain  _(starter zone)_

### Polar (6)
- **Arctic Tundra** — Polar · Polar terrain  _(starter zone)_
- **Alpine Tundra** — Highland · Polar terrain  _(starter zone)_
- **Polar Ice / Arctic Coast** — Polar · Polar terrain  _(starter zone)_
- **Antarctic Coast** — Polar · Polar terrain  _(starter zone)_
- **Glacier** — Polar or alpine · Permanent ice, crevasses, moraines and meltwater margins  _(starter zone)_
- **Pack Ice** — Polar marine · Seasonal and multi-year floating sea ice  _(starter zone)_

### Shrubland (3)
- **Mediterranean Shrubland / Chaparral** — Variable · Shrubland terrain  _(starter zone)_
- **Heathland / Moorland** — Variable · Shrubland terrain  _(starter zone)_
- **Sagebrush Scrub** — Variable · Shrubland terrain  _(starter zone)_

## 3 · NON-EARTH biomes — data pack (315, by category → color family)

### Artificial (20)
- **Machine World** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Nanite Desert** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Cyber Forest** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Data Sea** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Reactor Core** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Automated Foundry** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Scrap Wastes** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Hologram Garden** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Synthetic Ocean** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Terraforming Zone** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Orbital Shipyard** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Dyson Interior** — theme: Metal; Lightning · Mythic → color `#8a8f98 steel-gray`
- **Orbital Habitat** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Habitat Ring** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Bioengineered Preserve** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Generation-Ship Forest** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Hydroponic Canyon** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Artificial Reef Cylinder** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Climate-Controlled Steppe** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`
- **Abandoned Arcology** — theme: Nature; Metal · Legendary → color `#8a8f98 steel-gray`

### Biological (24)
- **Fungal Forest** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Mycelial Weblands** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Puffball Fields** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Lantern-Cap Groves** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Mold Plains** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Spore-Tower Colonies** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Shelf-Fungus Terraces** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Crystal-Fungus Clusters** — theme: Nature; Poison · Legendary → color `#8a8f98 (by category)`
- **Hive World** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Parasite Marsh** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Brood Caverns** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Symbiote Jungle** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Chitin Plains** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Larval Sea** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Pheromone Forest** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Collective-Mind Reef** — theme: Nature; Psychic; Poison · Mythic → color `#8a8f98 (by category)`
- **Slime Sea** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Biofilm Ocean** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Microbial Crust World** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Iron-Oxidizing Slime Fields** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Methane-Eating Mats** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Purple-Sulfur Flats** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Radiation-Resistant Crustlands** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`
- **Snow-Algae World** — theme: Nature; Acid; Poison · Legendary → color `#b6c24a acid-green`

### Chemical (16)
- **Methane Lakeshores** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Methane Sea** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Ammonia-Sea Shallows** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Ammonia Ocean** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Hydrocarbon Sludge Delta** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Ethane Rain Basin** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Cryogenic Hydrocarbon Dunes** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Nitrogen-Ice Coast** — theme: Poison; Ice · Mythic → color `#bcd8ea pale-ice-blue`
- **Sulfur Deck** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Sulfur Dunes** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Acid-Haze Plateau** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Chlorine Fog Basin** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Brimstone Caverns** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Toxic Fumarole Fields** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Corrosive Saltpan** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`
- **Venusian Cloud Swamp** — theme: Acid; Poison; Fire · Mythic → color `#e0561f molten-orange`

### Corrupted (8)
- **Corrupted Forest** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Cursed Wastes** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Eldritch Shore** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Worldeater Scar** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Abyssal Beastlands** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Living Darkness** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Rotting Star Garden** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`
- **Whispering Void Marsh** — theme: Shadow; Void; Poison · Anomalous → color `#1a1230 void-purple`

### Cosmic (20)
- **Astral Sea** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Nebula Forest** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Starfield Plains** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Lunar Wastes** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Comet Trail** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Asteroid Belt** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Solar Corona** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Pulsar Desert** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Quasar Shore** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Supernova Remnant** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Cosmic-Dust Sea** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Ringworld Meadow** — theme: Light; Void · Anomalous → color `#1a1230 void-purple`
- **Black-Hole Accretion Zone** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Event Horizon** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Wormhole Verge** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Quantum Rift** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Dark-Energy Current** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Gravitational Lens Field** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Vacuum Bloom** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`
- **Relativistic Jet Corridor** — theme: Void; Gravity; Time · Anomalous → color `#5a4a8a gravity-violet`

### Elemental (161)
- **Emberfield** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Flame Prairie** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Inferno Basin** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Cinderwood** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Pyroclast Desert** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Ashen Caldera** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Flame Reef** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Solar Furnace** — theme: Fire · Epic → color `#e0561f molten-orange`
- **Endless Ocean** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Tidal Expanse** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Floating Reef Colonies** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Storm Sea** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Milk Sea** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Brine World** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Living Ocean** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Abyss Green Sea** — theme: Water · Epic → color `#2a6aa0 deep-blue`
- **Basalt Plateau** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Boulder World** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Graben Maze** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Meteor Crater Fields** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Iron-Oxide Barrens** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Carbon Flats** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Geode Labyrinth** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **Diamond Mantle Expanse** — theme: Earth · Epic → color `#8a6a44 loam-brown`
- **High Cloud Decks** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Sky Islands** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Cloud Garden Colonies** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Jetstream Corridor** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Storm-Eye Updrafts** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Thunderhead Sea** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Floating Archipelago** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Vacuum-Swept Mesas** — theme: Air · Legendary → color `#cfe0ea sky-pale`
- **Blue Ice Expanse** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Cryogeyser Fields** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Pack-Ice World** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Under-Ice Ocean** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Cometary Wastes** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Ammonia-Ice Plains** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Methane Frostlands** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Glacier Labyrinth** — theme: Ice · Legendary → color `#bcd8ea pale-ice-blue`
- **Thunder Plains** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Static Desert** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Ion Storm Belt** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Ball-Lightning Marsh** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Electromagnetic Ridge** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Aurora Fields** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Plasma Tempest** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Stormeye** — theme: Lightning · Legendary → color `#f0e0a0 photon-gold`
- **Bioluminescent Grove** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Canopy Titan World** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Spore Jungle** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Living Jungle** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Symbiotic Meadow** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Carnivorous Garden** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Rootworld** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Blooming Ocean** — theme: Nature · Epic → color `#8a8f98 (by category)`
- **Rust Wastes** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Iron Forest** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Magnetic Mountains** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Copper Dunes** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Steel Reef** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Liquid-Metal Delta** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Machine-Ore Fields** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Mercury Basin** — theme: Metal · Legendary → color `#8a8f98 steel-gray`
- **Poison Swamp** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Venomwood** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Toxic Bloom Fields** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Miasma Marsh** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Caustic Bog** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Spore-Poison Fields** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Neurotoxin Jungle** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Fume Basin** — theme: Poison · Legendary → color `#8a8f98 (by category)`
- **Acid Haze** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Acid Rainforest** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Acid Cloud Layers** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Caustic Sea** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Dissolution Caves** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Sulfuric Marsh** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Acid-Pool Biofilm Fields** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Corrosion Coast** — theme: Acid · Mythic → color `#b6c24a acid-green`
- **Radiant Plains** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Solar Garden** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Halo Desert** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Luminous Reef** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Dawn Forest** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Whitefire Steppe** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Photon Sea** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Sunlit Crystal Spires** — theme: Light · Legendary → color `#f0e0a0 photon-gold`
- **Shadow Marsh** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Umbra Forest** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Eclipse Tundra** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Nightsea** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Gloom Caverns** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Blackglass Desert** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Dusk Plains** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Penumbra Archipelago** — theme: Shadow · Legendary → color `#2a2836 shadow-charcoal`
- **Voidlands** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Event-Horizon Shelf** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Null Desert** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Vacuum Abyss** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Starless Ocean** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Gravity Well** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Entropy Fields** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Dark-Matter Reef** — theme: Void · Anomalous → color `#1a1230 void-purple`
- **Arcane Wastes** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Mana Springs** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Rune Forest** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Aether Sea** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Spellstorm Plateau** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Leyline Nexus** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Alchemical Marsh** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Enchanted Forest** — theme: Arcane · Mythic → color `#8a8f98 (by category)`
- **Spirit Forest** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Ancestral Plains** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Soul River** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Ghost Reef** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Memory Garden** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Wraith Marsh** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Afterlight Shore** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Shrine Peaks** — theme: Spirit · Mythic → color `#8a8f98 (by category)`
- **Psionic Expanse** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Dreamscape** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Thought Ocean** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Memory Maze** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Empathy Garden** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Nightmare Basin** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Synaptic Reef** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Hallucination Dunes** — theme: Psychic · Mythic → color `#8a8f98 (by category)`
- **Resonance Caves** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Singing Dunes** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Harmonic Forest** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Echo Canyon** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Sonar Sea** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Thunder-Drum Plains** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Whispering Marsh** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Silence Zone** — theme: Sound · Legendary → color `#8a8f98 (by category)`
- **Inverted Mountains** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Floating Islands** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Crushing Gravity Decks** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Microgravity Reef** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Tidal-Gravity Basin** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Orbital Falls** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Gravity Shear** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Heavyworld Plains** — theme: Gravity · Anomalous → color `#5a4a8a gravity-violet`
- **Time-Lost Valley** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Temporal Fracture** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Stasis Forest** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Accelerated Bloom** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Fossil-Future Wastes** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Chrono Sea** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Looping Canyon** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Agefall Glacier** — theme: Time · Anomalous → color `#8a8f98 (by category)`
- **Prismatic Expanse** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Rainbow Mountains** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Kaleidoscope Forest** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Chromatic Desert** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Prism Reef** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Iridescent Marsh** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Refraction Caverns** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Spectrum Skylands** — theme: Prism · Mythic → color `#8a8f98 (by category)`
- **Mirrorlight Plains** — theme: Prism · Mythic → color `#8a8f98 (by category)`

### Hybrid (40)
- **Lava Sea** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Magma Sea** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Obsidian Wastes** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Cooling-Lava Margins** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Basalt Labyrinth** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Volcanic Ashwaste** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Hotglow Caldera** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Brimstone Lava Shelf** — theme: Fire; Earth · Mythic → color `#e0561f molten-orange`
- **Steam Jungle** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Boiling Marsh** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Vapor Sea** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Storm Forest** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Cyclone Archipelago** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Electro-Monsoon Basin** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Supercell Plains** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Cloudburst Reef** — theme: Water; Fire; Air; Lightning · Legendary → color `#e0561f molten-orange`
- **Crystal Steppe** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Crystal Caverns** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Glass World** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Glass-Needle Thickets** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Mirror-Bark Forest** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Geode World** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Silica Dunes** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Crystal Reef** — theme: Earth; Prism · Mythic → color `#8a6a44 loam-brown`
- **Blood Marsh** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Fleshlands** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Bone Wasteland** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Living Vein Canyons** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Organ Reef** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Marrow Caverns** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Pulsewood Forest** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Red-Tide World** — theme: Blood; Nature · Mythic → color `#8a8f98 (by category)`
- **Plasma Sea** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Ionized Cloud Ocean** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Corona Fields** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Magnetar Tempest** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Lightning-Sun Prairie** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Charged Glass Desert** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Auroral Plasma Reef** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`
- **Starfire Basin** — theme: Fire; Lightning; Light · Anomalous → color `#e0561f molten-orange`

### Planetary (8)
- **Banded Atmosphere** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Hotglow Layer** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Storm-Eye Megavortex** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Ammonia Cloud Deck** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Hydrogen Sea** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Helium Updraft Fields** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Crushing Lower Decks** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`
- **Floating Cloud-Reef Colonies** — theme: Air; Lightning; Gravity · Mythic → color `#cfe0ea sky-pale`

### Spiritual (8)
- **Fey Woods** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Celestial Peaks** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Worldhealer Garden** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Godtouched Meadow** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Angelbound Sanctuary** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Spiritbound River** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Eternal Spring** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`
- **Eternal Autumn** — theme: Spirit; Light; Arcane · Mythic → color `#f0e0a0 photon-gold`

### Surreal (10)
- **Mirror Realm** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Fractal Plains** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Escher Labyrinth** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Quantum Foam** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Reality Scar** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Colorless Zone** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Anti-Matter Shore** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Dreaming City** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Shattered Isles** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`
- **Recursive Forest** — theme: Prism; Time; Psychic; Void · Anomalous → color `#1a1230 void-purple`

## 4 · ADDITIONAL biomes — "Additional Biomes" file (proposed middle-tier + exotic)

### ADDITIONAL EARTH-LIKE AND NON-EARTH BIOMES
- Excluded from this document:

### TIDALLY LOCKED WORLDS
- Twilight Belt Forest
- Terminator Savanna
- Terminator Wetlands
- Substellar Rainforest
- Substellar Storm Basin
- Antistellar Ice Desert
- Antistellar Tundra
- Permanent-Dawn Meadow
- Permanent-Dusk Shrubland
- Twilight Inland Sea

### DIFFERENT STAR AND LIGHT ENVIRONMENTS
- Red-Dwarf Blackleaf Forest
- Red-Dwarf Crimson Grassland
- Purple Photosynthetic Marsh
- Infrared Jungle
- Ultraviolet Shield Forest
- Binary-Sun Seasonal Plains
- Twin-Sunset Desert
- Ring-Shadow Steppe
- Eclipse Forest
- Aurora Tundra

### PLANET-SCALE CLIMATE ZONES
- Supercontinent Interior
- Supercontinent Monsoon Coast
- Perpetual Monsoon Basin
- Hyperseasonal Forest
- Global Riverland
- Planetary Floodplain
- Inland Sea Coast
- Mega-Archipelago
- Warm Polar Ocean
- Rain-Shadow Plateau
- Equatorial Storm Belt
- Temperate Cloud Continent
- Global Savanna
- Saltwater Rainforest
- Fog Desert
- Oceanic Meadow Islands

### GRAVITY-BASED HABITABLE ZONES
- Low-Gravity Giant Forest
- Low-Gravity Canopy World
- Low-Gravity Grass Spires
- High-Gravity Dwarf Forest
- High-Gravity Cushion Scrub
- High-Gravity Burrowlands
- Super-Earth Valley
- Super-Earth Plateau
- Dense-Atmosphere Flying Forest
- Thin-Air Highland Steppe

### UNUSUAL BUT HABITABLE ATMOSPHERES
- High-Oxygen Megaforest
- High-Oxygen Fernland
- Low-Oxygen Mossland
- Dense-Atmosphere Cloud Forest
- Carbon-Dioxide Basin Forest
- Sulfur-Tolerant Wetland
- Mineral-Fog Woodland
- Permanent-Haze Jungle
- Hyperbaric Valley
- Windless Basin Forest

### GEOLOGICAL HABITABLE ZONES
- Crater Oasis
- Impact Basin Sea
- Impact-Rim Forest
- Geothermal Refuge
- Subglacial Biosphere
- Deep Karst Biosphere
- Basalt Floodplain
- Lava-Tube Biosphere
- Gypsum Desert
- Carbonate Terrace
- Silica Beach
- Iron-Rich Wetland
- Mineral Spring Forest
- Volcanic Island Chain
- Tectonic Rift Wetlands
- Caldera Rainforest

### MOON AND TIDAL HABITATS
- Megamoon Tidal Marsh
- Extreme-Tide Coast
- Tidal Mangrove Belt
- Tidal Forest
- Moonlit Reef
- Eclipse-Tide Wetland
- Tidal-Heated Polar Sea
- Volcanic Moon Oasis
- Subsurface Moon Ocean
- Ice-Moon Vent Biosphere

### ADVANCED PHYSICAL AND COSMIC BIOMES
- Rogue-Planet Geothermal Sea
- Rogue-Planet Ice Shell
- Comet Nucleus Caverns
- Magnetosphere Jungle
- Magnetic-Field Reef
- Neutrino Reef
- Cosmic-Ray Bloom Fields
- White-Dwarf Ashlands
- Neutron-Star Crustlands
- Relativistic Tide Zone
- Cosmic-String Scar
- Zero-Point Tundra
- Dark-Energy Dunes
- Photon Sea
- Aurora Ocean
- Radiation-Bloom Jungle

### EXOTIC MATTER AND LIQUID BIOMES
- Ferrofluid Marsh
- Liquid-Crystal Sea
- Metallic-Hydrogen Ocean
- Helium-Rain Depths
- Diamond-Rain Layer
- Supercritical-Fluid Jungle
- Molten-Salt Sea
- Liquid-Nitrogen Basin
- Plasma-Rain Coast
- Photonic-Crystal Forest
- Piezoelectric Mountains
- Shape-Memory Metal Plains

### LIVING-WORLD BIOMES
- Living Continent
- Planetary Nervous Plains
- Planetary Heart Basin
- Skinland
- Carapace Plains
- Bone Reef
- Cartilage Forest
- Digestive Caverns
- Synapse Jungle
- Living-World Blood Sea
- Immune-System Wastes
- Regenerating Landscape
- Sapient Ocean
- Planetary Eye

### TECHNOLOGICAL BIOMES
- Algorithmic Desert
- Quantum-Computer Caverns
- Signal-Storm Plains
- Radio Jungle
- Clockwork Biosphere
- Self-Replicating Factory Forest
- Drone Hive Sky
- Memory-Storage Glacier
- Server-Reef Ocean
- Circuit Mangrove
- Holographic Wilderness
- Abandoned Simulation Layer
- Artificial Weather Ocean
- Synthetic Evolution Preserve

### LIGHT AND PRISMATIC EXTENSIONS
- Laser Forest
- Polarized-Light Desert
- Ultraviolet Reef
- Infrared Swamp
- Colorless Crystal Wastes
- Living-Rainbow River
- Spectrum Storm Belt
- Holographic Meadow
- Refraction Ocean
- Prism-Shadow Forest
- Chromatic Aurora Fields
- Color-Siphon Marsh

### VOID EXTENSIONS
- Void Bloom
- Void Coral Sea
- Null-Light Forest
- Silence Abyss
- Vacuum Garden
- Entropy Oasis
- Absent-Matter Plains
- Hollow-Star Interior
- Nothingness Shore
- Void-Tide Marsh
- Anti-Gravity Void Reef
- Starless Cloud Forest
- Earth
- Earth-Like Exoplanet
- Alien Habitable
- Extreme Alien
- Artificial
- Anomalous
- Spiritual
- Cosmic
- Suggested expansion:
- Earth-like exoplanet biomes should:
- Extreme non-Earth biomes should:
- Every biome should include:
- Biome ID
- Biome Name
- Biome Scope
- Biome Family
- Difficulty Tier
- Rarity Cap
- Planet Compatibility
- Terrain
- Atmosphere
- Temperature
- Gravity
- Light
- Primary Liquid
- Weather
- Primary Hazards
- Secondary Hazards
- Fauna Pool
- Flora Pool
- Fungi Pool
- Microbe Pool
- Resources
- Encounter Gate
- Fauna Rolls
- Flora Rolls
- Fungi Rolls
- Microbe Rolls
- Base Tame Chance
- Base Scavenge Chance
- Environmental Hazard Chance
- Description

## 5 · The biome→color mechanic

- **`BIOME_COLOR` map**: biome key → signature hue, deterministic (seeded for stability).
- **Two consumers**: the galaxy-map planet **dot** tints by biome, and the **vista tint** shifts to match — a world reads as its biome from orbit.
- **Non-Earth**: color is driven by `primary_element_or_theme` (Fire→molten, Ice→pale-blue, Void→purple, Living→flesh, Machine→steel, Prismatic→shifting) — see the family colors above.
- **Earth / Earth-like**: color driven by climate + star spectrum (red-dwarf worlds = crimson/black foliage, purple-star = violet, aurora = teal).
- **Rarity**: rarer biomes get a more saturated / luminous signature.
- **Determinism caveat**: if biome color feeds ONLY rendering → fingerprint-safe; if it feeds any seeded generation → a **re-pin** (Nick-authorized).

_Total defined here: 43 live + 93 Earth pack + 315 non-Earth pack + additional file ≈ 451+ core biomes._