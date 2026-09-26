//#region port/v2/apps/game/src/guide-briefings.ts
/** D19: read-only v2 briefings; each link opens the capability-aware Guide. */
const V2_ADVANCED_BRIEFINGS = Object.freeze([
	{
		"id": "reach",
		"title": "Plan a route, then earn its reach",
		"body": "<p>Survey a destination before entering. A world route opens its system card; <b>Land</b> remains a separate action. The Star Atlas and CF1 Follow respect your expedition’s current reach.</p><p>Build permanent ship systems in Engineering to reach more stars. Titan victories earn Prime Signatures, which separately open galaxy distance. Travel speed never replaces reach.</p><p>Continue with <span data-gt=\"landing\">Landing</span>, <span data-gt=\"atlas\">Star Atlas</span> and <span data-gt=\"signatures\">Prime Codex</span>.</p>"
	},
	{
		"id": "resources",
		"title": "Turn discoveries into equipment",
		"body": "<p>Mine finite grounded deposits and Skim eligible stars through Engineering. Each action shows its own cost, opportunity and limits before you commit. The Fabricator offers connected recipes; <b>Craft ×5</b> stops if a later craft cannot complete.</p><p>Pin a recipe to track its missing stock. Inventory equips exact gear copies; Salvage all requires confirmation and excludes equipped, protected and relic gear. Pureforged modifiers require exceptional direct materials, not a random reroll.</p><p>Read <span data-gt=\"mining\">Mining</span> and <span data-gt=\"crafting\">Fabrication</span>.</p>"
	},
	{
		"id": "companions",
		"title": "Care for the individual you chose",
		"body": "<p>A Compendium fauna detail selects an exact owned companion, even among identical twins. Feed consumes one flora from the chosen lot. Loved food raises Meals by 2, or 3 for tier 4 or higher flora, and mends 0.25 injury; neutral food raises Meals by 1 and mends 0.10; disliked food is consumed harmlessly without growth. Meals stop at 200.</p><p>First meals and new tastes earn their own one-time XP and bond memories. <b>Rest</b> heals a wounded companion and reserves it until its active-play timer ends: 2 minutes per 0.1 injury, rounded up, at most 20 minutes. Closing the game does not advance that timer. Bond records distinct firsts and never decays. Two companions can take Prospect or Survey missions of 10, 25 or 60 active-play minutes. Review the disclosed risk, then claim the sealed return once; Recall pays nothing. Trusted opens Long missions and Devoted halves wound risk.</p><p>Read <span data-gt=\"feeding\">Feeding</span>, <span data-gt=\"injuries\">Recovery</span> and <span data-gt=\"breeding\">Breeding</span>.</p>"
	},
	{
		"id": "combat",
		"title": "Choose a plan; keep the same rewards",
		"body": "<p>Wild conquest is Auto. Against a Guardian or Titan, choose up to three eligible fighters and their stances, then Auto or Command. Command pauses at offered breaks for Hold, Swap or Withdraw; it gives the same rewards as Auto. A forecast is a simulation, not a guaranteed result.</p><p>Every Guardian and Titan can change phase at half health, including solo Balanced Auto fights. Defeat puts companions into active-play Recovery; it does not delete them or add a defeat wound. Winning and losing never pay twice after reload.</p><p>Friendly duels use a shared CFB- creature code and their own reward cooldowns. Read <span data-gt=\"conquest\">Conquest</span> and <span data-gt=\"duels\">Friendly duels</span>.</p>"
	},
	{
		"id": "progress",
		"title": "Know which clock and record owns progress",
		"body": "<p>Accept a Charter before doing its counted deeds. The Weekly board changes after four hours of active play; moving the device clock grants no reset. Conquered-world Harvest has its own active-play cooldown.</p><p>Records, the Binder and Prime Codex describe different accomplishments. A creature share code starts a duel; it does not import an expedition. Reset expedition is a separate confirmed Settings action. A protected save stays protected.</p><p>Settings also offers sound, motion, folded survey cards, pop-up notifications and tooltips. On phones, press and hold to read a tooltip. Read <span data-gt=\"charters\">Charters</span>, <span data-gt=\"settings\">Settings</span> and <span data-gt=\"saving\">Saving</span>.</p>"
	}
].map((row) => Object.freeze(row)));
//#endregion
//#region port/v2/apps/game/src/guide-content.ts
const LEGACY_GUIDE_SYNC = Object.freeze({
	sourcePath: "celestial-frontier.html",
	sourceAnchor: "const GUIDE=",
	sourceSha256: "679d10915805e9559458a4319c94582e12e78ac10fd276c14febb8100331de50",
	categoryCount: 9,
	authoredTopicCount: 43,
	liveTopicCount: 41,
	sourceGameVersion: "1.8.9"
});
const LEGACY_GUIDE_CATEGORIES = [
	{
		icon: "🚀",
		cat: "Getting Around",
		blurb: "Zoom, survey, search, share, travel",
		topics: [
			{
				id: "zoom",
				t: "Flying the universe",
				k: "zoom pan pinch scroll drag modes universe galaxy system surface navigate controls",
				body: "<p>The whole cosmos is one continuous view. <b>Pinch or scroll to zoom, drag to pan.</b> Zooming dives through four scales: <em>universe → galaxy → star system → planet surface</em> — and zooming out climbs back up. Everything you can see, you can visit.</p><ul><li>Tap any object to open its <b>survey card</b>; tap it again (or tap elsewhere) to release.</li><li>When a planet fills the view but sits off-center, keep zooming — the camera glides the rest of the way in. On a world you&#8217;ve never stood on, the dive stops at approach altitude and asks before you commit — see <span data-gt=\"landing\">Landing</span>. Panning and pinching are never hijacked.</li><li>On a surface, you walk the world itself — the survey card stays pinned.</li><li>Travel beyond your charted frontier is gated — see <span data-gt=\"regions\">Frontier regions</span>.</li></ul>"
			},
			{
				id: "survey",
				t: "Survey cards",
				k: "survey card panel tap inspect atmosphere climate water gravity descriptor lock pin land contact census glance ground",
				body: "<p>Knowing a world comes in three acts. <b>Glance</b>: on a computer, hovering shows the long-range reads — color class, atmosphere, water signatures, whispers of life (on a phone your tap goes straight to the survey). <b>Orbital survey</b>: tap to lock the card and the instruments speak — environment, biosphere, signals. <b>Ground survey</b>: <b>land</b> — press the card&#8217;s Land button, or dive toward the world and confirm the descent (see <span data-gt=\"landing\">Landing</span>); planetfall opens the census of any civilization and the mineral veins of dead worlds. Every line is generated from the object’s seed, so your survey matches every other explorer’s.</p><ul><li>Tapping locks the card in place so you can press its buttons while the object drifts.</li><li>A planet&#8217;s card leads with its actions and headlines; the <b>Environment</b> row&#8217;s <b>expand</b> pill unfolds the full readings, and a civilization&#8217;s headline unfolds its census. Cards remember whether you like them open or folded — the ⟁ Signal row never hides, and a world you&#8217;ve stood on wears a <b>Ground-surveyed</b> tag.</li><li>An organized world announces itself from orbit as <b>⟁ signals</b> — land to attempt <b>first contact</b>. Most receptions are warm; a wary one wounds you (a named Field Scout takes the hit instead), and the census stays sealed until a landing goes well. Conquest never needs to ask.</li><li>Worlds with a biosphere show <b>Discover Life</b> — see <span data-gt=\"discover\">Discovering life</span>.</li><li>The bookmark row saves the place — see <span data-gt=\"atlas\">The Star Atlas</span>.</li><li>Every planet&#8217;s card names its <b>biome</b> — swamp world, carbon world, magma sea — and the rare kinds announce themselves in violet. A glance that whispers <b>impossible biosignatures</b> means something is alive where nothing should be.</li><li><b>Worlds of renown (v1.7):</b> the rarest worlds carry an epithet — <em>the Shrouded</em>, <em>the Ringed Court</em> — the same name for every explorer, forever. Rare near home; commoner in the deep field.</li><li>Stand on a world and its <b>mineral veins show their grade</b> for that ground (Primordial worlds enrich every seam one step), and an <b>⬆ Leave this world</b> button pulls the camera back to the system overview.</li></ul>"
			},
			{
				id: "landing",
				t: "Landing",
				k: "landing descent land wave-off risk success approach orbit scrape pity ramp weather storm",
				body: "<p>Setting down is the one moment the frontier pushes back. Every world sits somewhere on a ladder, from a calm approach that always works to a hostile dive that mostly doesn&#8217;t — the odds come from what the world is, and a storm blowing right now shaves a little more off. You see the number before you commit.</p><ul><li>Zooming into an unvisited world stops at approach altitude and asks. The <b>Land</b> button on a survey card skips the question — pressing it is the answer.</li><li>A failed descent is a wave-off: you&#8217;re bounced back to orbit with a scrape, never worse. It cannot kill you.</li><li>Every wave-off teaches the approach — your next try on that world is a fair bit better, and the lesson is remembered even between sessions.</li><li>Once you&#8217;ve stood on a world it is yours: return landings always succeed, no questions asked.</li><li>Earth is home. Home never waves you off.</li></ul>"
			},
			{
				id: "search",
				t: "Search",
				k: "search box find discoveries paste code lookup",
				body: "<p>The search box (top bar) hunts across everything you’ve already discovered: Atlas places and Compendium species. It also accepts pasted codes:</p><ul><li><b>CF1-…</b> world codes — jump straight to a friend’s discovery.</li><li><b>CFB-…</b> creature codes — load a friend’s creature for a duel.</li><li>Worlds bookmark under their biome — searching <b>swamp</b> or <b>carbon</b> finds every one you&#8217;ve saved since v1.3.5.</li></ul><p>See <span data-gt=\"codes\">Share codes</span>.</p>"
			},
			{
				id: "codes",
				t: "Share codes (CF1 / CFB)",
				k: "share code link friend cf1 cfb copy multiplayer social",
				body: "<p>There is no server — the universe is mathematics, identical on every device. A share code is just an address into that shared math:</p><ul><li><b>⇪ Share this discovery</b> on a survey card copies a <b>CF1-</b> code/link. Anyone who opens it lands on the exact same world, with your name for it attached.</li><li><b>⇪ Code</b> on a creature card copies a <b>CFB-</b> code carrying the full genome — the identical creature, stats and all, appears on your friend’s device for a duel.</li></ul><p>Codes are sanitized on arrival; a tampered code can’t hurt your save.</p>"
			},
			{
				id: "charters",
				t: "Expedition Charters",
				k: "charter charters hunt board weekly goals task starter reward stardust chip week reroll tracker objective mainline ascent",
				body: "<p>The <b>Charters</b> board (the 📜 pill — left rail on desktop, dock on phones) always has work for an explorer. Charters arrive in <b>chains</b> that reveal one link at a time: the five <b>trades</b> (planetfall, prospecting, discovering life, naming a Field Scout, conquest) and the <b>Sol tour</b>, a guided lap of the home system that pays its way in starter gear. Completing a link reveals the next — and a link your ring can&#8217;t reach yet stays off the board until the sky opens.</p><p><b>Accept to begin.</b> A revealed charter tracks nothing until you press <b>Accept</b> — three may ride at once. Accept a deed the frontier has already seen you do and it completes on the spot, <em>already proven</em>; counting charters count from the accept and say so. Each pays <b>☄ Stardust</b> — some pay <b>gear</b> — the moment it completes.</p><p>Once the five trades are learned, the board turns weekly: three charters a week, identical for every explorer in the universe — deterministic, like everything else out here. Compare boards with a friend; they match.</p><p><b>The objective chip (v1.7):</b> the pill under the dock is a live tracker — your accepted charter first, otherwise the chapter&#8217;s next goal, with running progress that pulses when it moves. Tap it for the board. The pinned <b>Ascent chapter</b> above the charters is your mainline story: no accepting needed, it is always yours.</p>"
			},
			{
				id: "beacon",
				t: "Traveler’s Beacon",
				k: "beacon daily random destination five minutes",
				body: "<p>The <b>Traveler’s Beacon</b> (left rail) offers a fresh destination every <b>5 minutes</b> — always somewhere <b>inside your charter</b>: it walks Sol while Sol is your world, the Neighborhood once you can jump, the whole galaxy once the Array is up, and the wider cosmos beyond the Rim. Picked deterministically, so every explorer on your ring is pointed at the same place at the same moment. An easy way to see something new when the infinite feels too big.</p>"
			},
			{
				id: "atlas",
				t: "The Star Atlas",
				k: "atlas bookmark favorite home save place travel star log chart map visited undo",
				body: "<p>Your personal map of the infinite. On any survey card:</p><ul><li><b>+ Add to Star Atlas</b> bookmarks the place.</li><li><b>☆ Favorite</b> marks your best finds (and auto-saves them).</li><li><b>⌂ Home</b> marks one place as home — yours to change anytime.</li><li>The weekly pool now includes <b>Down the hard way</b> — land on a gas giant, a hothouse or a molten world. The descent will fight you; that&#8217;s the point.</li></ul><p>Open the <b>Star Atlas</b> (the dock — or the right rail on desktop) and tap any entry to ride the <b>hyperlane</b> there — the camera dives out, the sky stretches into a streak tunnel tinted by your destination’s light, and you ease in on arrival (tap to skip; obeys your effects and Motion settings). The Atlas keeps your most recent ~120 places.</p><p><b>Two views (v1.7):</b> the <b>📋 List</b> and the <b>🗺 Chart</b> — a star map plotting every charted place across the universe. Brighter clusters hold more of your finds, favorites wear rings, home carries its ⌂, and a quiet crosshair marks where you are; <b>tap any light to travel there</b>. Your filters apply to both views. Planetfall <b>auto-charts</b> every world you stand on (the ⛳ Visited filter gathers them), and removing an entry offers its undo right in the list.</p>"
			},
			{
				id: "colors",
				t: "The color language",
				k: "color colors tint meaning legend cyan gold red green ember violet lime chronicle toast tray mud",
				body: "<p>The expedition speaks in color, old-school MUD style — a tint means the same thing everywhere, and the words always carry the meaning too, so nothing is lost if you read past the color.</p><ul><li>Pop-ups and the <b>🔔 tray</b> tint by event: red for harm and loss, gold for milestones and first contact, green for harvests, samples and mined hauls, calm blue for everything else.</li><li>In <b>the Chronicle</b>, your champion reads cyan and the foe ember on every line; damage is yellow, criticals gold, misses dim, staggers flash, burns glow orange, mending green, lifesteal violet, thorns lime — a felled combatant falls in red, and the verdict wears its outcome: victory gold, defeat red.</li><li>A world&#8217;s long-range glance tints each reading by family — water cyan, life green, signals violet.</li><li>Elsewhere the language holds: the <b>Compendium</b> marks your <b>Field Scout</b> in cyan, the <b>Star Atlas</b> tints its badges, <b>Cosmic Events</b> wear their nature&#8217;s color, and a creature&#8217;s condition runs green → yellow → red as wounds deepen.</li><li>A <b>wave-off</b> lands in harm red — a scrape, never a death. Field samples and touchdowns keep their gain green, and a landing that beats a hostile world arrives in milestone gold.</li></ul>"
			}
		]
	},
	{
		icon: "🧬",
		cat: "Life & the Compendium",
		blurb: "Kingdoms, discovery, rarity, specimen cards",
		topics: [
			{
				id: "discover",
				t: "Discovering life",
				k: "discover life scan bioscan species danger wound hp catalogue roster sighting tame scavenge",
				body: "<p>From orbit a living world shows only its <b>life signatures</b> — the card blossoms when you land. Ground the world, then <b>survey its biosphere</b>: a deliberate act with teeth on hostile worlds — the danger percentage is your chance of being wounded by wildlife mid-survey, and <b>wounds deepen with distance</b> (a scrape in the home galaxy is survivable naked; the same claws in the Deep Field bite double and worse — scouts, the Reinforced Hull and crafted suits are how the far rings are survived). The survey always completes — you earned it.</p><ul><li>The survey <b>reveals</b> the roster; it catalogues nothing. Press <b>🐾 Tame</b> for beasts and <b>🌿 Scavenge</b> for flora, fungi and microbes — each attempt names its odds, rarer species resist harder, and crafted gear tips the hand. Every catch earns its Compendium page; there is no limit on trying.</li><li>Or send a beast ahead: press <b>Scout</b> on any of your fauna&#8217;s cards to name it your <b>Field Scout</b> — it takes the hit in your place, wounds and all, mended the usual way with ♥ loved flora. A scout with nothing left is lost forever.</li><li>A fresh scan can spark a spontaneous <b>auto-hybrid</b> with your existing collection.</li><li>Conquered worlds scan safely — see <span data-gt=\"conquest\">Conquest</span>.</li><li>A thin slice of hostile worlds — molten, frozen, crushing — carries actual creatures, not just microbes. The odds run from about 1-in-70 on the friendliest extremes to 1-in-10,000 on the magma seas: the hardest landings hide the strangest finds.</li></ul>"
			},
			{
				id: "kingdoms",
				t: "The four kingdoms",
				k: "kingdom microbe flora fauna fungi realm biome classification",
				body: "<p>All life belongs to one of four kingdoms — <b>🦠 Microbe, 🌿 Flora, 🍄 Fungi, 🐾 Fauna</b> — and is shelved in the Compendium by realm (Land Fauna, Aquatic Fauna, Colonial Life…). Kingdom decides what a creature can do:</p><ul><li><b>Fauna</b> fight duels, defend worlds, and can be fed.</li><li><b>Flora</b> are medicine and meals — eaten by you or fed to beasts.</li><li>All kingdoms can breed within their own kind.</li><li>The sea grows kelp towers, reef-builders and sargassum rafts now; aerial-life worlds fly drifting veils. Extremophiles come with their own ways of living — vent-clingers, magma-swimmers, storm-riders — and worlds whose roster runs titanic sometimes show it breaking the horizon.</li></ul>"
			},
			{
				id: "rarity",
				t: "Rarity & grades",
				k: "rarity grade tier common uncommon notable rare exotic legendary mythic celestial primordial transcendent spectrum color",
				body: "<p>Every species wears one of ten grades on a single ladder shared by creatures, plants, worlds and stars alike: <b>Common → Uncommon → Notable → Rare → Exotic → Legendary → Mythic → Celestial → Primordial → Transcendent</b>. Most expeditions live in the lower bands; the top grades grow vanishingly rare, and a <b>Transcendent</b> is a one-in-a-million roll — the province of master bloodlines and <span data-gt=\"guardians\">Apex Guardians</span>. Rarity tints the card, pitches the discovery chime, and matters mechanically:</p><ul><li>Rarer flora heal more — and poison more. Rarer pairs are harder to breed but forge stronger bloodlines.</li><li>Finding a Legendary-or-better species pays a ☄ Stardust bonus (first discovery only).</li><li>Stars and worlds carry rarity too — but a world hides its grade until you <b>land</b> and stand on it; a star reveals its grade on <b>survey</b>. Rarer worlds yield richer conquest spoils.</li><li>Chasing the rare grades? Size, glow, wild apex blood and deep hybrid generations all push a creature’s grade upward — a master bloodline can climb far past what nature rolls.</li></ul>"
			},
			{
				id: "specimen",
				t: "Reading a specimen card",
				k: "specimen card stats power ability bloodline brood fed gen hybrid tastes",
				body: "<p>Tap any species in the Compendium to open its card:</p><ul><li><b>Five stat bars + Power</b> — its battle strength, rolled deterministically from its genome (see <span data-gt=\"stats\">The five stats</span>).</li><li><b>❤ HP & Condition</b> — its battle pool, and whether it’s Healthy, Bruised, Injured or Critical. Wounds persist and dull every stat — see <span data-gt=\"injuries\">Injuries &amp; recovery</span>.</li><li><b>✧ Ability</b> — its biome-themed combat trick (see <span data-gt=\"abilities\">Abilities</span>).</li><li><b>♥ Favors / ⊘ Dislikes</b> — its feeding tastes (fauna only).</li><li><b>♞ Bloodline</b> — <em>brood</em> (generations bred) and <em>fed</em> (meals taken) both permanently raise its stats.</li><li>Buttons: <b>⇪ Code</b> (share), <b>⚔ Duel</b>, <b>🧬 Breed</b>, <b>🌿 Feed</b>, <b>✎ Rename</b>.</li></ul>"
			},
			{
				id: "drift",
				t: "Passive evolution",
				k: "drift evolve hybrid automatic epoch cosmic clock",
				body: "<p>Your Compendium is alive. As the cosmic clock ticks (one epoch ≈ every 4 minutes of play), two of your species quietly drift into a new hybrid on their own — the collection keeps surprising you the more you explore. Drift pauses at 500 species so your save stays healthy.</p>"
			},
			{
				id: "sapience",
				t: "Sapience & civilizations",
				k: "sapient intelligence civilization advanced eras mind signature",
				body: "<p>Fauna roll an intelligence tier: <em>Instinctive → Social → Tool-curious → Semi-sapient → <b>Sapient</b></em>. Whole worlds can host civilizations from stone-age to starfaring. A conquered world with a sapient native earns the Mind Signature — see <span data-gt=\"signatures\">The nine Signatures</span>.</p>"
			}
		]
	},
	{
		icon: "🌿",
		cat: "Breeding & Feeding",
		blurb: "Bloodlines, meals, medicine",
		topics: [
			{
				id: "breeding",
				t: "Breeding",
				k: "breed pair parents consumed odds hybrid bloodline stardust boost union",
				body: "<p>Pick a specimen, press <b>Breed</b>, choose a same-kingdom mate. Both parents are consumed by the union — win or lose.</p><ul><li>The odds shown depend on the pair’s rarity — rare pairs are long shots.</li><li>☄ Stardust you’ve earned passively boosts odds (up to +15%) — see <span data-gt=\"stardust\">Stardust</span>.</li><li>Success forges a <b>new bloodline</b>: a hybrid child with boosted stats (+1 brood). Chain generations for monsters.</li><li>The union&#8217;s experience goes to the <b>child</b> (+2, and +5 the first time you cross two particular species) — the parents are gone, so the newborn inherits the credit for them.</li><li>A child inherits its parents&#8217; <b>brood</b> but <b>not</b> their fed bloodline — a well-fed pair does not pass that strength on, and the preview says so before you commit.</li><li>Failure loses both parents. Breed your spares, not your champions.</li><li>Two extremophile parents breed a true extremophile; a mixed pair breeds back toward ordinary stock. A creature&#8217;s two-tone hide follows its accent gene, so children visibly carry their parents&#8217; colors.</li></ul>"
			},
			{
				id: "feeding",
				t: "Feeding beasts",
				k: "feed flora meal tastes loved disliked poison toxic dead bloodline fed mend medicine",
				body: "<p>Fauna can be fed flora from your Compendium (<b>Feed</b> on their card). The plant is always consumed. Every beast has <b>tastes</b> — two stat-flavors it loves, one it dislikes (shown on its card):</p><ul><li>A loved meal grows its <b>fed bloodline</b> — permanent strength, up to a ceiling. The first welcome meal and each new flavour discovered also teach the beast directly.</li><li>Feeding is also medicine: a welcome meal mends a wounded beast, and loved flavors mend most. A disliked meal that goes badly can wound it further — see <span data-gt=\"injuries\">Injuries &amp; recovery</span>.</li><li>Every meal carries a <b>poison chance</b> (worse for rare flora and disliked tastes) — a toxic roll poisons the beast, biting off a chunk of its condition; rarer flora bite far deeper. Only a beast whose strength is already spent dies of it — at zero, it’s gone. The Iron Gut ability shrugs toxins off.</li></ul>"
			},
			{
				id: "injuries",
				t: "Injuries & recovery",
				k: "injury wound hurt condition bruised critical mend recover heal scars medicine",
				body: "<p>Wounds persist. A creature’s condition — <b style=\"color:#7fe6a0\">Healthy</b> → <b style=\"color:#ffd96a\">Bruised</b> → <b style=\"color:#ff8a72\">Injured</b> → <b style=\"color:#ff5a4a\">Critical</b> — lives on its specimen card, and the wounded fight below their strength (nearly half power at the brink).</p><ul><li><b>How they get hurt:</b> winning a conquest by a thread leaves scars, and a disliked meal that goes badly can wound. Friendly duels are still pure sport — no harm done.</li><li><b>How they heal:</b> feed them. A welcome meal mends, the flavors a beast ♥ loves mend most, and rarer flora mend deeper. Wounds never fade on their own — medicine is a deliberate act.</li><li>Injuries don’t travel in CFB codes — a shared creature arrives fresh.</li><li>Newborn hybrids are born unhurt, whatever shape their parents were in.</li></ul>"
			},
			{
				id: "eating",
				t: "Eating flora (healing)",
				k: "heal eat flora hp medicine poison stat growth heart nourish",
				body: "<p>Tap the <b>❤ heart</b> by your HP bar to eat flora yourself. The plant is consumed and two things happen:</p><ul><li>You heal. Rarer flora restore more HP — but their poison chance is higher, and a toxic roll wounds you instead. The deadliest medicine heals hardest.</li><li>You grow. Each plant nourishes one specific battle stat permanently (shown on its card). Vitality meals also raise your max HP.</li></ul><p>See <span data-gt=\"stats\">The five stats</span>.</p>"
			}
		]
	},
	{
		icon: "🧑‍🚀",
		cat: "You, the Explorer",
		blurb: "Stats, HP, rank, achievements",
		topics: [
			{
				id: "stats",
				t: "The five stats",
				k: "vitality ferocity resilience agility insight stats grow flora character",
				body: "<p>You fight with five stats, each starting at 50 and grown permanently by eating flora:</p><ul><li><b style=\"color:#7fe6a0\">Vitality</b> — your life pool; sets max HP (×2) and duel toughness.</li><li><b style=\"color:#ff8a72\">Ferocity</b> — attack power.</li><li><b style=\"color:#9fb4ff\">Resilience</b> — blunts incoming damage.</li><li><b style=\"color:#ffd96a\">Agility</b> — initiative; who strikes first.</li><li><b style=\"color:#d6a0ff\">Insight</b> — critical-hit chance.</li></ul><p>Tap your nameplate to open your character sheet and inspect them. Creatures use the same five stats, rolled from their genomes.</p>"
			},
			{
				id: "hp",
				t: "HP, hazards & death",
				k: "hp health damage wound hazard death die expedition reset brink",
				body: "<p>You can be wounded by scanning hostile worlds, by champion duty (losing a conquest you fought yourself), and by toxic flora.</p><ul><li>Your HP bar lives in the top bar; max HP = Vitality × 2.</li><li>Heal by eating flora — tap the ❤ heart (see <span data-gt=\"eating\">Eating flora</span>). <b>Medicine never kills:</b> a toxic meal can gut you to the brink — 1 HP — but eating flora is the one gamble that can&#8217;t end the expedition. (The same law as wave-offs: a scrape, never a grave.)</li><li>At 0 HP the expedition ends — the universe is unchanged (it’s math), but your record starts over. Don’t scan furnace worlds at 12 HP.</li></ul>"
			},
			{
				id: "rank",
				t: "Ranks & expedition score",
				k: "rank score cadet scout pathfinder voyager pioneer cartographer wayfarer sovereign luminary eternal rename name change explorer",
				body: "<p>Everything you do — surveying, cataloguing, breeding, settling, dueling — feeds your <b>expedition score</b>, and score climbs the ten ranks: <em>Cadet → Scout → Pathfinder → Voyager → Pioneer → Star Cartographer → Mythic Wayfarer → Void Sovereign → Cosmic Luminary → Eternal Frontier</em>. Your rank rides on your nameplate and on everything you share.</p><p><b>Nameplate colors:</b> every rank carries its own color, unlocked forever the moment you reach it. Pick any unlocked color from <b>Settings → Nameplate</b> — and <b>Eternal Frontier</b> unlocks the iridescent foil.</p><p><b>Renaming yourself:</b> open <b>Settings → Nameplate</b> and tap <b>✎ Change name</b> anytime. Your record stays; only the name on it changes.</p>"
			},
			{
				id: "achievements",
				t: "Achievements",
				k: "achievements unlock badges trophies curator survivor",
				body: "<p>Dozens of achievements track cataloguing, breeding, rarity hunting, conquest, stellar finds and exploration feats. They live on your character screen (tap your nameplate) under the <b>Achievements</b> fold — open it and each category shelf expands on its own. Many are secret handshakes with the universe: favorite a place, survive the brink, find a black hole…</p>"
			}
		]
	},
	{
		icon: "⚔",
		cat: "Combat",
		blurb: "Duels, abilities, conquest",
		topics: [
			{
				id: "duels",
				t: "Duels & the Chronicle",
				k: "duel fight battle initiative critical rounds deterministic code friend chronicle log share ledger",
				body: "<p>Duels are round-by-round creature battles. <b>Agility</b> decides who strikes first, <b>Ferocity</b> drives damage, <b>Resilience</b> blunts it, <b>Insight</b> lands criticals, <b>Vitality</b> sets the HP pool — and each side’s ✧ ability and 🛡 class arts bend the rules.</p><ul><li>Every fight is told as <b>the Chronicle</b>: named arts, first strikes, executes, thorn recoils, burn ticks, staggers, a death line — closing with a statistics ledger (hits, crits, biggest blow…).</li><li><b>⇪ Share the battle log</b> at the end of any fight — a plain-text chronicle to paste anywhere, like a screenshot. Fights aren’t saved; legends are retold.</li><li>Duel your own creatures from their cards, or paste a friend’s <b>CFB-</b> code. The same matchup always plays out identically, on every device.</li><li>Friendly duels are sport: nothing is lost — but victories still feed your creature’s <b>XP</b>. Conquest is another story.</li></ul>"
			},
			{
				id: "abilities",
				t: "Abilities & biome themes",
				k: "ability theme fire frost storm tide stone venom void sand chem psionic wild burn regen crit dodge",
				body: "<p>Every creature carries one ability from its habitat’s theme — <em>fire, frost, storm, tide, stone, venom, void, sand, chem, psionic, wild</em> (gliders lean storm, swimmers tide, burrowers stone…). Beside each theme’s named classics lives the <b>ability matrix</b>: sixteen archetype verbs — Smite, Aegis, Affliction, Fury, Ambush, Eye, Veil, Mending, Echo, Thirst, <b>Thorns, Rend, Reckoning, Bulwark, Shock, Roulette</b> — at five magnitudes (I–V) that climb with rarity: hundreds of abilities in all (“Fire Reckoning III”). Hybrids usually inherit their other parent’s archetype; sometimes they mutate something new. Apex Guardians fight with <b>Sovereign</b> arts at full magnitude. Every verb is balanced empirically — equal-stat win rates pinned near 50%, with honest counters. The ability is printed on the specimen card.</p>"
			},
			{
				id: "classes",
				t: "Classes, XP & levels",
				k: "class level xp experience innate warrior mage berserker paladin assassin fusion wins",
				body: "<p>Every beast is born to a <b>class</b> — Warrior, Berserker, Necromancer, Assassin, Druid… over a hundred, with the legendary ones (<b>Titan, Worldbreaker, Avatar, Chosen One</b>) reserved for summit-grade creatures. A class grants <b>innate arts</b>: always-on powers that need no roll, printed on the specimen card.</p><ul><li>Power is built through wins <em>and through care</em>. Victories feed the XP bar — duels +8; conquests +20 and guardians +60, each climbing with the conquered world&#8217;s tier — and cataloguing a genuinely new species teaches your standing Field Scout +2. Keeping also counts: a welcome meal +1, a taste discovered +2, a bout survived +2, a fight taken to the wire +3, a conquest lost +3, and a defender pushed to the brink +5. Levels wake more innate arts (slots at level 3 and 6), never raw stats.</li><li>A union pays its XP to the <b>newborn</b> — both parents are consumed, so the child is the only one left to carry it: +2 for the union, and +5 the first time you cross two particular species.</li><li><b>Breeding fuses bloodlines:</b> a hybrid usually inherits a class from its parents’ lineages — a Caster line crossed with a Martial line breeds toward Spellswords and Battlemages.</li><li>Levels are <em>your</em> creature’s story — a shared code arrives at level 1.</li></ul>"
			},
			{
				id: "conquest",
				t: "Conquering worlds",
				k: "conquer settle apex native champion lose forever flag world battle",
				body: "<p>Any world with fauna can be conquered. Press <b>Conquer Planet</b> on its survey card and choose one champion — yourself, or any fauna from your Compendium — to face the world’s <b>apex native</b> (its toughest beast; the picker shows your odds).</p><ul><li>The picker&#8217;s reading is <b>simulated, not estimated</b>: it runs the matchup 160 times and reports a band — <b>Favored · Even · Dangerous · Overwhelming</b> — with the sampled percentage and one line saying why. A sample that size cannot tell 0% from a half-percent, so it shows <b>&lt;1%</b> and <b>&gt;99%</b> rather than claiming a certainty it does not have.</li><li><b>Win:</b> the world flies your flag — bioscans are safe forever, ☄ Spoils of Conquest pay out, and the world can be harvested as you explore.</li><li><b>Win ugly, pay for it:</b> a champion that barely survives carries wounds home and fights below strength until mended — see <span data-gt=\"injuries\">Injuries &amp; recovery</span>.</li><li><b>Lose with a wild-caught creature:</b> it is gone forever.</li><li>A hard-fought loss teaches your champion something — but a world only teaches it <b>once</b>.</li><li><b>Lose with a bred champion:</b> your bloodline crawls home <b>Critical</b> — broken, not dead. Mend it with flora it ♥ loves — a champion fielded while still Critical will not crawl home twice.</li><li><b>Lose fighting yourself:</b> you take the wound instead — it can beat you to the brink but never kill you, and below a quarter health you cannot lead a conquest at all (send a beast, or mend first).</li><li>Worlds in farther frontier regions field tougher apex defenders.</li></ul><p>Conquest is also how most Signatures are claimed — see <span data-gt=\"signatures\">The nine Signatures</span>.</p>"
			},
			{
				id: "binder",
				t: "The Binder & the Fifty Paragons",
				k: "binder collection sets slots types paragon fifty silhouette claim stardust",
				body: "<p>Open <b>🏆 Records</b> and switch to the <b>🗂 Binder</b> tab. You cannot collect individuals out of an infinite universe — so the Binder collects types: fixed pages of slots (every grade, every realm, every body plan, every ability theme…) that are the same for every explorer; your universe decides which specimen fills each.</p><ul><li><b>Sets</b> are curated collections that pay a one-time ☄ Stardust bounty — claim them in the Binder when complete.</li><li><b>The Fifty Paragons</b> are named, one-of-a-kind deep-spectrum legends living on fixed worlds — the same fifty worlds for every explorer. Tap a silhouette to plot a course to its last-known world, then land and <b>Discover Life</b> to catalogue it. Share the coordinates — your friend hunts the very same legend.</li></ul>"
			},
			{
				id: "guardians",
				t: "Apex Guardians",
				k: "guardian apex named ruler challenge summit empyrean eternal singular crown titan",
				body: "<p>About one fauna-bearing world in forty is ruled by a <b>👑 named Apex Guardian</b> — a one-of-a-kind luminous titan wearing the ladder’s <b>Transcendent</b> summit, forced rather than rolled. The same guardian rules the same world for every explorer — share the coordinates and a friend faces the very same beast.</p><ul><li>A guarded world’s survey card names its ruler, grade and Power, and its conquest becomes a <b>guardian challenge</b>.</li><li>Defeat it and the world is settled, the spoils pay a ruler’s ransom, and the guardian itself joins your Compendium — the fighter’s road to Transcendent.</li><li><b>Lose</b> and the usual price is paid: a champion creature is lost forever, or you take the wound.</li><li>The breeder’s road also leads up: size, glow, wild blood and deep hybrid generations can push a bloodline to the summit without ever drawing a blade.</li></ul>"
			}
		]
	},
	{
		icon: "☄",
		cat: "Stardust & Progression",
		blurb: "Economy, harvests, spoils",
		topics: [
			{
				id: "stardust",
				t: "Stardust",
				k: "stardust essence currency economy breeding odds boost earn",
				body: "<p>☄ Stardust is the expedition’s soft currency. Lifetime Stardust earned passively raises your breeding odds (+1% per 50 earned, up to +15%). The faucets:</p><ul><li><b>⛏ Harvests</b> from settled worlds — see <span data-gt=\"harvest\">Harvesting</span>.</li><li><b>Spoils of Conquest</b> — every world you settle pays out (rarer worlds pay more).</li><li><b>Rare Find Bonus</b> — first discovery of any Legendary+ species.</li><li><b>First Arrival</b> — reaching a system no expedition record precedes you in pays a small +2 ☄.</li></ul>"
			},
			{
				id: "harvest",
				t: "Harvesting",
				k: "harvest cooldown settled world replenish stardust epoch exploring",
				body: "<p>Every settled world can be harvested for Stardust (rarer worlds yield more). A world replenishes <b>as you explore</b> — roughly 40 minutes of play, not 40 minutes of waiting — so an empire pays you for playing rather than for the calendar. The button lives on the world’s survey card; “Settled — replenishing” means keep exploring and come back. An empire of settled worlds is a steady Stardust income; visit your conquests.</p>"
			},
			{
				id: "mining",
				t: "Mining & the Cargo hold",
				k: "mine mining elements minerals deposits cargo hold dead lifeless world vein iron gold prismatium samples field landing inventory icons",
				body: "<p>Dead worlds carry the elements. Every lifeless planet has a deterministic mineral profile by type — iron and titanium in rock, ices and helium-3 on frozen worlds, hydrogen in the gas giants, precious metals in metal worlds — and rarer worlds hide richer veins, up to exotics like Voidglass and Prismatium.</p><ul><li><b>Landing pays.</b> Your first footfall on any world (home aside) collects <b>field samples</b> — a pinch of up to two of its elements and a few ☄ Stardust, richer on rarer worlds. Exploration stocks the hold all by itself.</li><li>Prospecting takes boots on the ground: press a lifeless world&#8217;s <b>Land</b> button, or dive in and confirm the descent — planetfall is a <b>ground survey</b>, and the Mine Deposits button opens with it. (Gas giants, hothouses and molten worlds will fight the landing — see <span data-gt=\"landing\">Landing</span>.) (🛰 Deep Scanners read the veins from orbit, but the drills still need a surface under them.)</li><li><b>The drills run in bursts.</b> Press ⛏ Mine once and the rig pulls a <b>burst</b> — up to ten pulls over a quarter minute — then the drills stand down and want another press. Stop early anytime; a vein can still run dry mid-burst. Every haul varies, and sometimes a <b>rich strike</b> hits a rare pocket. <b>Reserves are finite:</b> the card counts the pulls left, and a world mined to nothing stays mined out forever (there are always more worlds). Crafted mining rigs multiply every haul, and the Auto-Extractor keeps pulling while you&#8217;re away — collect on your next visit.</li><li>Everything lands in your <b>🧰 Cargo hold</b> — it lives on your <b>character screen</b> now, beneath the paperdoll (tap your nameplate, or the 🧰 shortcut that appears with your first cargo). The hold is a Diablo bag under your portrait: a grid of slots — ingots for metals, shards for ices, flasks for gases, cut gems for the exotics. Spending them happens at the <b>🛠 Shipyard</b> (the dock — or the right rail on desktop): the Fabricator and the Research Bench live with the ship they build — and a crafted pack in your Module socket grows the bags themselves. See <span data-gt=\"research\">Research &amp; ships</span>.</li></ul>"
			},
			{
				id: "skimming",
				t: "Stellar skimming & the veins",
				k: "skim corona star plasma coronium scoop remnant cosmic vein exceptional vein rare materials stellar extraction",
				body: "<p><b>Stars are mines too.</b> Survey a star, then <b>☀ Skim Corona</b> pulls stellar material straight from its fire — hot bright stars give <b>Stellar Plasma</b>, dead dense remnants give <b>Coronium</b>, cool dwarfs give nothing. Skimming rides the Jump Drive&#8217;s shielding, and each star&#8217;s reachable corona is finite. Mind the dead stars: a remnant&#8217;s corona <b>bites</b> the unshielded for 3 HP a pass — the <b>Corona Scoop</b> (Shipyard, costs one hand-skimmed Plasma) ends the bite, ladles +1 per pass, and reaches a deeper corona (an exhausted star reopens when you build it).</p><p><b>Three special veins</b> can ride a world&#8217;s survey card past its base minerals: the <b>biome vein</b> (a living world&#8217;s gated exotic), the <b>cosmic vein</b> (Primordial-and-up worlds only — foundational and reality-breaking materials), and the <b>✦ exceptional vein</b> (~1 world in 7 hides an ultra-pure seam of one of its own minerals — found only once you land). Exceptional units stack as a ✦ sub-count on the same material card, count one grade higher, and the Fabricator spends them first — forge a piece <b>entirely</b> from exceptional stock and it arrives <b>Exceptionally Forged</b>, carrying a bonus affix like conquest spoils.</p>"
			},
			{
				id: "research",
				t: "Research & ships",
				k: "research tech technology bench drive ship hull scanner lab fusion antimatter warp travel distance",
				body: "<p>The engineer’s track, parallel to the Prime Codex: the Prime Codex is your legend, the Research Bench is your capability. Research costs mined elements + ☄ Stardust:</p><ul><li><b>🛰 Deep Scanners</b> — survey cards reveal mineral veins from orbit.</li><li><b>🛡 Reinforced Hull</b> — hostile bioscans wound you 25% lighter.</li><li><b>🧪 Xenobotany Lab</b> — flora meals nourish one extra stat point.</li><li><b>The drive ladder</b> — 🚀 Fusion → ⚛ Antimatter → 🌀 Warp Fold. Hyperlane travel scales with real distance; each drive cuts it, and Warp Fold makes every jump arrive in a breath. Distance is never a wall — only a wait, and only ever a short one.</li></ul>"
			},
			{
				id: "crafting",
				t: "The Fabricator & gear",
				k: "craft crafting fabricator recipe parts components ship systems gear equipment suit tool module instrument charm slot equip mining rig auto extractor anchor",
				body: "<p>The <b>Fabricator</b> lives at the <b>🛠 Shipyard</b> (the dock — or the right rail on desktop) — your ship, her systems, and both workbenches in one place. It turns ore into capability, three rungs up: <b>T1 basic parts</b> (plates, wire, chips, weave) → <b>T2 components</b> (drive coils, nav cores, hull segments) → <b>T3 ship systems</b> and <b>explorer gear</b>. Recipes are fixed and identical for every explorer; nothing waits on a timer.</p><ul><li><b>Ship systems build once and stay built:</b> the ⚡ Jump Drive, 📡 Long-Range Array and 🌌 Intergalactic Drive open the travel rings (see <span data-gt=\"ascent\">Chapters</span>); the 🤖 Auto-Extractor keeps mining every world you&#8217;ve worked while you&#8217;re away.</li><li><b>Gear equips on YOU.</b> Your character screen (tap your nameplate) shows your explorer head to boots, with nine sockets pinned to the body — Helmet at the head, Earpiece at the ear, Necklace below the chin, Suit on the chest, Gloves and Tool at the hands, Leggings, Boots, and the Module — the 🎒 pack on your shoulder. Mining rigs and gloves multiply hauls; suits, visors and leggings blunt field wounds (the T3 hazard suits open molten, crushing and frozen worlds to nearly-sure landings); boots, greaves and the module ladder steady landings up to the Gravitic Anchor, which never waves off; earpieces and necklaces sharpen first contact, rich strikes, meals and travel.</li><li><b>Risk is the frontier — gear is how you tame it.</b> Every roll in the game (landing, contact, bioscan) has a crafted answer.</li></ul><p><b>The hold is three tabs</b> (character screen): <b>Materials</b> — every element stacks by substance, grouped by family, never slot pressure; <b>Craftables</b> — parts and components by kind; <b>Gear</b> — the slot grid the pack module grows. <b>Tap any item for its card</b>: rarity frame, level, its ✦ affix lines with ranges, and a compare against what you&#8217;re wearing. <b>Equip</b> and <b>♺ Salvage</b> are buttons on the card — salvage breaks a piece back into some of its materials (a confirm guards it; toggle in Settings › Gameplay, and <b>Salvage All Junk</b> clears unequipped commons in one press). <b>Affixes</b> — seeded bonus stats on worn gear — come from conquest spoils, or from forging with pure ✦ exceptional stock.</p>"
			},
			{
				id: "ascent",
				t: "Chapters",
				k: "ascent chapter chapters sol lock jump drive ring ladder progression mainline quest unlock neighborhood galaxy intergalactic",
				body: "<p><b>⬆ The Chapters</b> are the mainline: three of them, pinned at the top of your Charters board, that carry a new explorer from one rock to the whole sky. The rings, in order:</p><ul><li><b>Sol.</b> New expeditions start locked to the home system — the entire sky stays visible and surveyable (looking is always free; moving is what you earn). Mine Sol&#8217;s dead worlds and build the <b>⚡ Jump Drive</b>.</li><li><b>The Neighborhood.</b> The nearby stars open. Hunt life, settle a world, and build the <b>📡 Long-Range Array</b> for the whole galaxy.</li><li><b>Beyond the Rim.</b> Master the trades and build the <b>🌌 Intergalactic Drive</b> — from there the Prime Codex Signatures extend your reach, ring by ring, exactly as they always have.</li></ul><p><b>The spectrum expands with the rings.</b> Rarity is a ladder of distance: the Neighborhood catalogues up to <b>Legendary</b>, the home galaxy up to <b>Primordial</b>, and each region beyond makes <b>Transcendent</b> finds steadily less rare — until the Deep Field, where the ladder’s summit lives. The strangest finds live farthest out; guardians, Paragons and your own bred bloodlines are beyond the law.</p>"
			}
		]
	},
	{
		icon: "✦",
		cat: "The Prime Codex",
		blurb: "Signatures, the frontier, endings",
		topics: [
			{
				id: "signatures",
				t: "The Elemental Signatures (nine titans)",
				k: "signature prime codex element guardian titan relic blueprint earth wind fire air water electric poison void prism win endgame",
				body: "<p><b>The nine elements are the universe’s master test.</b> Each elemental force is embodied by a unique named titan — the same for every explorer. You won’t know a titan waits until you <b>land and survey</b>, and it may or may not be present when you arrive. Face it, send your strongest bred and tamed champions, prevail, and you master that element. The nine, staggered from near to far:</p><ul><li><b>Earth · Fire · Air · Wind · Water</b> — the basics, near home and its neighboring rings.</li><li><b>Electric · Poison</b> — the middle reach, the Local Cluster and Near Field.</li><li><b>Void · Prism</b> — far out, past the Deep Field.</li></ul><p><b>Every element you master recovers a relic blueprint</b> — nine unique, signature-tier pieces of gear (one per socket) that only the Fabricator of a master can forge. The Codex panel (✦, left rail) names each element’s titan and how far out it dwells, and tracks the blueprints you hold. This is where the whole game becomes one: land, mine and tame and heal, craft and breed stronger champions — then master the titans one element at a time, until you are master of them all.</p>"
			},
			{
				id: "regions",
				t: "Frontier regions",
				k: "region reach frontier expand charter solar local cluster near deep outer dark travel gate",
				body: "<p>You begin charted for the <b>Solar Reach</b>. Each Signature claimed pushes your charter outward — <em>the Local Cluster, the Near Field, the Deep Field, the Outer Dark</em>, and finally <em>the Frontier</em>. Travel beyond your charter is blocked until you’ve earned it, and farther regions field tougher apex defenders with stranger life.</p>"
			},
			{
				id: "endings",
				t: "Endings & the Celestial Frontier",
				k: "ending win frontier legacy prismatic complete game finish",
				body: "<p>Master all nine elements and the <b>Celestial Frontier</b> reveals itself — and asks what kind of Pathfinder you are. Your choice becomes your legacy (some legacies must be earned through deeds beyond the Prime Codex). The universe stays open afterward: you cannot finish the infinite, only master it.</p>"
			}
		]
	},
	{
		icon: "🌌",
		cat: "The Living Universe",
		blurb: "Determinism — one shared cosmos, no server",
		topics: [{
			id: "events",
			t: "Cosmic events",
			k: "events supernova timescale minute hour day week month year decade witness",
			body: "<p>The universe is alive on every timescale: somewhere a star is always dying, and rarer spectacles cycle by the minute, hour, day, week, month, year and decade. Open <b>Cosmic Events</b> (left rail) to see what’s live and travel to it. Because everything is deterministic, every explorer sees the same event at the same moment — witnessing one is a shared experience. The <b>📜 Witness Log</b> at the top of the panel remembers every sky you saw with your own eyes.</p>"
		}, {
			id: "determinism",
			t: "One universe, no server",
			k: "deterministic seed offline same universe share procedural infinite math",
			body: "<p>There is no server and no download — the entire universe is generated from seeds, on your device, on demand. The same coordinates always hold the same galaxy, the same world, the same creature, for everyone, forever. That’s what makes share codes work, duels fair, and events shared. The universe needs no saving; only <em>your</em> story is saved.</p>"
		}]
	},
	{
		icon: "⚙",
		cat: "Settings & Saving",
		blurb: "Toggles, tooltips, your save",
		topics: [{
			id: "settings",
			t: "Settings",
			k: "settings text size sound effects shake notifications tooltips toggle options",
			body: "<p><b>The dock</b> holds your five boards — it rides the BOTTOM edge on phones and the RIGHT rail on desktop, with ⚙ Settings and the ? Guide beside it either way.</p><p>The ⚙ panel (dock ⚙) has four tabs.</p><ul><li><b>Display</b>: <b>Text size</b> (A/A+/A++), <b>Text tone</b> (Soft / Bright / Max — brighter tones lift body text toward white and shift bold to gold), <b>Font</b> (Grotesk / System / Mono), <b>Explorer name</b>, and <b>Tooltips</b> (the short hints on hover, keyboard focus, or long-press — turn them off once you’re fluent).</li><li><b>Graphics</b>: <b>Visual effects</b> (particle bursts), <b>Screen shake</b>, <b>Motion</b> (Auto follows your device’s reduce-motion preference; Reduced stills the travel tunnel, shake, confetti and shimmer), and <b>Panel tint</b> (a glass slider — drag from airy liquid glass to a near-solid backing; a floor keeps text readable).</li><li><b>Gameplay</b>: <b>Confirm before salvaging</b> — the guard that asks before an item (or Salvage All) breaks gear down for parts.</li><li><b>Audio</b>: <b>Sound</b> (the master — off silences everything at once, including a world&#8217;s ambience), the <b>Volume</b> slider, <b>Creature voices</b> (every beast has its own call, inherited and blended when you breed), <b>Battle sound</b> (blow-by-blow impact in duels and conquests), and <b>Notifications</b> (silences pop-ups; the 🔔 tray still logs everything).</li></ul><p>All persist with your save.</p>"
		}, {
			id: "saving",
			t: "Your save & reset",
			k: "save localstorage reset erase wipe browser device local",
			body: "<p>Your expedition saves automatically to this browser on this device — no account, no cloud. Clearing site data clears the expedition, so export your best creatures as CFB codes if you’re attached. <b>↺ Reset Game</b> in Settings erases everything after a confirm — the universe itself is unharmed; it’s math.</p>"
		}]
	}
];
const LEGACY_DORMANT_TOPIC_IDS = Object.freeze(["beacon", "events"]);
const GUIDE_CATEGORY_IDS = Object.freeze([
	"getting-around",
	"life-compendium",
	"breeding-feeding",
	"explorer",
	"combat",
	"stardust-progression",
	"prime-codex",
	"living-universe",
	"settings-saving"
]);
const CATEGORY_ID_BY_NAME = Object.freeze({
	"Getting Around": "getting-around",
	"Life & the Compendium": "life-compendium",
	"Breeding & Feeding": "breeding-feeding",
	"You, the Explorer": "explorer",
	"Combat": "combat",
	"Stardust & Progression": "stardust-progression",
	"The Prime Codex": "prime-codex",
	"The Living Universe": "living-universe",
	"Settings & Saving": "settings-saving"
});
const GUIDE_CAPABILITIES = Object.freeze([
	"canvas-navigation",
	"survey-cards",
	"planetfall",
	"search",
	"cf1-sharing",
	"charters",
	"beacon",
	"atlas",
	"color-language",
	"life-discovery",
	"compendium-read",
	"species-details",
	"passive-evolution",
	"civilizations",
	"breeding",
	"feeding",
	"creature-care",
	"explorer-eating",
	"explorer-health",
	"ranks",
	"achievements",
	"duels",
	"abilities",
	"creature-progression",
	"conquest",
	"binder",
	"guardians",
	"stardust",
	"harvesting",
	"mining",
	"skimming",
	"shipyard-inspection",
	"inventory-actions",
	"research",
	"crafting",
	"chapters",
	"prime-codex",
	"frontier-reach",
	"endings",
	"cosmic-events",
	"deterministic-world",
	"settings",
	"records",
	"protected-saves",
	"field-training"
]);
const partial = (allOf, currentBody, currentNote, unavailableReason) => Object.freeze({
	allOf,
	level: "partial",
	currentBody,
	currentNote,
	unavailableReason
});
const unavailable = (allOf, unavailableReason) => Object.freeze({
	allOf,
	level: "available",
	currentNote: "The complete legacy behavior is available.",
	unavailableReason
});
const GUIDE_TOPIC_SUPPORT = Object.freeze({
	zoom: partial(["canvas-navigation"], "<p><b>Drag to pan and wheel or pinch to zoom.</b> Tap a galaxy or star once to open its survey card, then press <b>Enter galaxy</b> or <b>Enter system</b>. Deep zoom over the same selected body also descends. <b>Escape</b> closes the top surface or rises one level.</p><p>For keyboard exploration, focus the starfield canvas, use the <b>arrow keys</b> to cycle visible bodies, <b>Enter</b> or <b>Space</b> to survey, and <b>+</b> and <b>−</b> to zoom. When a keyboard target is highlighted, the first <b>Escape</b> releases it; press Escape again to close the card or rise.</p><p>Planetfall remains a separate, guarded action; see <span data-gt=\"landing\">Landing</span>. Charter reach can block a destination; see <span data-gt=\"regions\">Frontier regions</span>.</p>", "Continuous v2 canvas navigation is live; the explicit survey-card Enter actions replace timing-sensitive second taps.", "Canvas navigation has not been connected in this build."),
	survey: partial(["survey-cards"], "<p>Tap a galaxy, star, or planet once to open its current <b>survey card</b>. A galaxy or star card offers an explicit Enter action. A planet card offers <b>Land</b>, <b>Star Atlas</b>, and <b>Share</b> when those actions are valid; a living world whose record is still open also offers <b>Discover Life</b>.</p><p>The card is bound to the selected object’s full identity, including coordinates, so a same-seed object elsewhere cannot inherit stale actions. Ordinary selection is navigation and inspection: it does not spend a resource, record a living-world Survey, catalogue life, make a capture attempt, or authorize extraction. <b>Discover Life</b> is the separate durable bioscan that records the exact living world and resolves its one deterministic field hazard. On ordinary worlds, it catalogues no species and spends no Biosphere Yield. At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record. It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield. Repeat sightings add no duplicate record or discovery reward. A conquered or otherwise safe world causes no wound. Reinforced Hull reduces hostile damage by 25% before worn bioscan protection; an assigned Field Scout takes the nonlethal wound and is capped at Critical, otherwise the explorer remains at or above 1 HP.</p><p>After landing on a living world, Planetside reveals the biosphere roster, but landing still catalogues nothing. Its at-most-eight-row strip is only a preview: <b>Tame</b>, <b>Scavenge</b>, and <b>Sample</b> are separate finite actions that choose uniformly from their eligible species across the full biosphere.</p><p>Owned <b>Deep Scanners</b> adds one <b>Mineral veins</b> row to the orbital Survey card for a proven lifeless non-Earth world. It preserves the generated ordinary-deposit order and marks the separate biome vein with ✦; cosmic and exceptional veins, grades, reserve and progress facts, and the Mine action remain grounded Engineering information. After landing, <b>Engineering &amp; Shipyard</b> presents the separate grounded mineral reveal and its finite Mine action. The reveal describes the current opportunity but is not itself a mining receipt. See <span data-gt=\"landing\">Landing</span>, <span data-gt=\"discover\">Discovering life</span>, <span data-gt=\"mining\">Mining &amp; the Cargo hold</span>, and <span data-gt=\"atlas\">The Star Atlas</span>.</p>", "The current survey card covers navigation, charting, sharing, planetfall, and explicit living-world Bioscan; Planetside capture and grounded Engineering extraction remain separate durable actions.", "Interactive survey cards have not been connected in this build."),
	landing: partial(["planetfall"], "<p>Any galaxy, star, or planet route arriving from Search, the Star Atlas, or a saved location is regenerated from the seeded universe before it is accepted; navigation uses only the source-verified destination. A valid planet address inside the expedition’s owned reach returns to its live system survey; it never lands for you. A stale or forged route cannot act. An out-of-reach route leaves you in place. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. Saved Prime Signatures separately set the galaxy-distance radius: a verified Titan victory can claim one new Signature, and the ninth distinct claim unlocks the Frontier. A galaxy beyond the current radius stays blocked until enough Signatures have actually been claimed. Press <b>Land</b> on the current planet card to enter Planetside. Only the first landing earns new landfall progress, and Sol-versus-beyond-Sol Charter credit follows the complete verified hierarchy and planet ordinal rather than the planet seed alone.</p><p>On touch, press the minimum-size <b>Leave world</b> action to return to the system. Right-click or <b>Escape</b> also lifts off. A first-time descent uses the exact world’s authored type and biome chance, current deterministic weather, equipped landing gear, and exact-world approach learning. The Land control and its visible approach note disclose the final success chance, nonlethal wave-off damage range, and learned approach before commitment. A 100% approach is shown as guaranteed with zero descent damage risk. A wave-off keeps the ship in orbit, leaves the explorer at 1 HP or more, and adds +20% exact-world approach knowledge for the next attempt, up to five wave-offs. Earth, Training, and known-world returns are guaranteed and consume no landing draws.</p><p>Use Vista to step the survey card and HUD aside; tap or Escape to return. Postcard saves or shares the painted view with its world name and CF1 address. Sharing uses the device share sheet where supported, or downloads the card.</p>", "Truthful exact-world descent odds, nonlethal wave-offs, learned approaches, guaranteed safe returns, and explicit Leave are live.", "Planetfall has not been connected in this build."),
	search: partial(["search"], "<p>The top-bar search accepts discovered species names and deterministic <b>CF1</b> world addresses. Every galaxy, star, or planet code is treated as an address to verify, not as authority: the game regenerates its full hierarchy from the seeded universe and accepts only the source-verified destination. A valid address inside the expedition’s owned reach opens its own navigation level; a planet address reopens the live system survey, where <b>Land</b> remains a separate choice. A stale or forged code leaves the current view unchanged and keeps the exact query in Search for correction. An out-of-reach address leaves the current view unchanged and keeps its query available. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. Saved Prime Signatures separately set galaxy distance; verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier.</p><p>Creature <b>CFB</b> challenge imports are not yet available in the v2 slice. See <span data-gt=\"codes\">Share codes</span>.</p>", "Species lookup and CF1 travel are live; the broader legacy discovery index and CFB challenge flow remain open.", "Search has not been connected in this build."),
	codes: partial(["cf1-sharing"], "<p><b>Share</b> on a planet card prepares a deterministic <b>CF1</b> address for that exact galaxy, star, and planet. A valid-world Share first settles its durable Shares record and one-time Share achievement, independently of whether clipboard access succeeds. If the browser permits clipboard access the address is then copied; otherwise the exact address is selected in Search and the game tells you to use your browser’s Copy command. An accepted custom planet name travels with the address.</p><p><b>Follow</b> counts only after a submitted CF1 route passes source and reach policy. Its accepted saved route, Jumps record, Wayfarer achievement, galaxy-visit ledger, and any source-proved quasar or dwarf-galaxy achievement settle together in the same receipt. Ordinary direct navigation cannot earn Follow. Share and Follow each use one receipt and one compare-and-swap with no retry or optimistic record or route; a stale, refused, or failed write counts nothing, while durable ambiguity reloads instead of applying twice.</p><p>When a code carries an accepted custom world name, that name settles first and the submitted Follow settles next without an intervening progression write. A successful Follow still owns the route and progression in its single receipt. If the post-name route refuses or otherwise cannot join that progression, exactly one bounded name catch-up is queued afterward.</p><p>Before any shared galaxy, star, or planet route is accepted, the game regenerates its hierarchy from the seeded universe and uses only the source-verified destination. A stale or forged code leaves the current view unchanged and keeps the exact query in Search. An accepted planet route returns another explorer to the live system survey when the destination is inside that expedition’s owned reach; otherwise the explorer stays put and the query remains available. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. Saved Prime Signatures separately set galaxy distance; verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier. It never bypasses the Land action.</p><p>CFB creature and Champion-code play is not yet available in this v2 slice. See <span data-gt=\"search\">Search</span> and <span data-gt=\"atlas\">The Star Atlas</span>.</p>", "Exact CF1 world Share and accepted-code Follow records are live; CFB creature sharing remains unavailable.", "CF1 world sharing has not been connected in this build."),
	charters: partial(["charters"], "<p>The <b>Charters</b> board keeps the established Ascent mainline and now presents the two starter chains beneath it. Each chain reveals one unfinished link at a time; choose <b>Accept</b> before work begins tracking, and keep at most <b>three</b> incomplete Charters active. A newly accepted one-step Charter completes immediately when its exact durable deed is already proved. Training cannot accept or advance them.</p><p>The live starter writers are exact first planetfall away from canonical Earth, one successful Mine, a non-null Field Scout assignment or switch, verified conquest, exact Sol landings on Mercury, Mars, Uranus or Neptune, five manual Mine presses on Jupiter or Saturn, and any canonical T2 component from the fixed Fabricator. Sol-tour credit requires the complete registered home-galaxy, Sol-star, planet-seed, and source-ordinal hierarchy; a matching leaf seed elsewhere earns nothing. An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt; older Surveys and capture do not count. It pays its established 15 Stardust and one Earpiece, using the exact inventory carrier with empty-slot auto-equip only. Weekly rows likewise remain protected until wall-week, slate, acceptance, and rollover authority are complete.</p><p>Completion removes the exact accepted row, records it once, raises current and lifetime-earned <b>Stardust</b>, and increments honored Charters in the same receipt as the deed. Mercury, Mars, giant-world, ice-world, and Discover-life links retain their established starter gear; a live gear reward uses the same exact inventory carrier and auto-equips only into an empty matching slot. Capacity, stale authority, failed storage, or unconfirmable publication pays and equips nothing optimistically. If the starter <b>Conquer a world</b> Charter (<code>st-conq</code>) is accepted, verified combat removes it from accepted work, records it complete, adds <b>25 Stardust</b> to current and lifetime-earned totals, and honors one Charter in that combat save.</p><p>The Ascent presents only milestones with real writers: first landfalls, successful <b>Mine</b> actions, successful fixed <b>Fabricator</b> outputs, one successful companion <b>Breed</b>, the first durable successful capture on each source-proven world beyond Sol, and verified Conquest. Each Mine press banks one mining-goal tick, while exact part, component, gear, and system outputs bank only their matching fabrication goals. Research and Skim do not counterfeit any of them. A newly built Jump Drive, Long-Range Array, or Intergalactic Drive creates the actual owned system that changes ship reach; chapter progress alone never mints one. A successful action may reconcile consecutive imported chapters only when canonical progress and owned reach already prove them.</p><p>The first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol banks that world’s one Chapter 2 life-discovery tick in the same capture transaction. A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing. That Chapter 2 capture milestone is separate from the live <b>Discover Life</b> action. Discover Life owns the existing per-world Survey record, hazard, and any accepted <code>st-scan</code> completion in the same receipt. At an exact fixed Paragon home, that same Bioscan can also add only the exact Paragon catalogue record; it creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield. This catalogue exception does not count as the Chapter 2 capture milestone. Weekly bioscan Charters remain protected until their separate lifecycle is complete. One successful Breed banks <b>Breed a hybrid bloodline</b> in the same offspring save; a failed pairing, refusal, stale tab, or failed write banks no breeding credit. A first verified conquest banks Chapter 2’s conquest goal in the combat save. An accepted weekly conquest (<code>wk-conq</code>) refuses before combat; all weekly rewards remain protected.</p><p>A blocked star remains in place until the required owned permanent system extends reach. Saved Prime Signatures separately set the galaxy-distance radius; verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier.</p><p><b>Outposts.</b> After honouring A working component, choose Build here on a world you have landed on. Three stages spend parts and Stardust, sometimes requiring a deed done after that stage opened. Two may be under construction, with 24 total. Abandon refunds built stages; completed Outposts have no timers or upkeep and join the Museum. A Survey Relay needs Deep Scanners and is limited to one per system; its star card shows mineral readouts for lifeless worlds. A Field Shelter makes Discover Life hazard-free on its unconquered fauna world. A Companion Sanctuary on a conquered world displays up to six chosen companions.</p>", "The Ascent plus both established starter chains are visible and every accepted Starter writer, including Discover Life, is live; once the five trades are learned, a Weekly board of three Charters runs on the expedition’s own active-play clock (a new board every four hours of play) that moving the device clock can never reset or advance.", "The Charters board and reach contract have not been connected in this build."),
	beacon: unavailable(["beacon"], "Traveler’s Beacon is dormant in v1.8.9 and remains intentionally absent from v2."),
	atlas: partial(["atlas"], "<p>Use <b>Star Atlas</b> on a planet card to chart it. The Atlas lists saved galaxies, stars, and worlds. Switch between semantic <b>List</b> and <b>Chart</b> views, then filter All, Favorites, Visited, Conquered, or Life. Nearby Chart lights share one large control when their touch targets would overlap. Choose that control to open a bounded list of its exact destinations; <b>Return to Chart</b> restores the originating control. This selection spends nothing and travels nowhere. The Chart uses only source-proven route coordinates and marks the current view; compatibility location text never becomes route or chart authority. Exact canonical world keys own Visited and Conquered, so same-seed worlds remain independent; only legacy <code>p&lt;seed&gt;</code> rows use their preserved seed facts.</p><p>Each saved galaxy, star, or planet route is regenerated from the seeded universe and must produce a source-verified destination before its row or chart point can travel. Choosing a proven entry inside the expedition’s owned reach returns to that destination’s own navigation level. An accepted galaxy or system arrival records the source-proved galaxy visit and any quasar or dwarf-galaxy achievement in the same travel receipt; it does not counterfeit Follow or increment Jumps. An out-of-reach entry leaves you in place. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. Saved Prime Signatures separately set galaxy distance; verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier. A world entry reopens its system survey, where Land remains separate. A stale, forged, or incomplete imported route remains visible but disabled instead of pretending it can travel.</p><p><b>Favorite</b>, <b>Home</b>, and <b>Remove</b> act on one exact row through one receipt and one compare-and-swap with no retry or optimistic publication. Favorite preserves that same row and its route sidecar; the first explicit false-to-true choice owns <code>curator</code>, while unfavoriting never removes it and an unchanged choice writes nothing. Custom names and source-verified composite identities are preserved. Home points to one exact row and Travel Home remains disabled if its route is unavailable. Remove preserves every surviving pair and route identity. Its one-level <b>Undo</b> remains available for eight seconds, restores the exact original pair, position, Home state, and present-or-absent route sidecar, and expires after another Atlas mutation, route-identity change, or convergence reload.</p><p>Accepted Atlas, Search, and CF1 arrivals may paint the same deterministic, skippable hyperlane streak overlay after the route publishes. Unresearched travel keeps the established baseline; Fusion, Antimatter, and Warp Fold use 2×, 4×, and 8× speed bases, with equipped travel-speed gear added to the active base. Effects, Motion, and device limits may reduce or omit the treatment without delaying or changing the destination.</p>", "Source-proven List/Chart travel, five exact filters, Home, exact-row Favorite and Remove with one-level Undo, and the shared skippable hyperlane presentation are live.", "The Star Atlas has not been connected in this build."),
	colors: unavailable(["color-language"], "The complete semantic color-language audit has not yet been ported to the v2 presentation."),
	discover: partial(["life-discovery"], "<p>A living planet’s Survey card offers <b>Discover Life</b> before or after landing. Ordinary card inspection remains write-free. Discover Life is the single durable bioscan: it records that exact living world and resolves one deterministic hazard draw. On ordinary worlds, it catalogues no species and spends no Biosphere Yield. At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record. It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield. Repeat sightings add no duplicate record or discovery reward. The separate <b>Seeker of Legends</b> Binder <b>Claim</b> becomes available at ten exact Paragons and pays its established <b>120 Stardust</b> once; discovering a Paragon never pays that Set reward automatically. A development save that recorded a Paragon home before this feature keeps its already-recorded Bioscan refusal; returning does not backfill the Paragon. The button discloses danger and final field damage. A conquered or otherwise safe world causes no wound. Reinforced Hull reduces hostile damage by 25% before worn bioscan protection; an assigned Field Scout takes the nonlethal wound and is capped at Critical, otherwise the explorer remains at or above 1 HP.</p><p>Landing reveals the biosphere roster, but still adds no Compendium page. Planetside shows at most eight rows as a preview. <b>Tame</b>, <b>Scavenge</b>, and <b>Sample</b> each choose uniformly from every eligible species for that action in the full biosphere, including species outside that preview; no species row is a target.</p><p><b>Tame</b> chooses fauna and a hit adds one owned creature. <b>Scavenge</b> chooses flora or fungi and <b>Sample</b> chooses microbes; either hit adds one specimen lot, never a living companion. The selected species and its exact chance are shown with the result. Equipped gear labelled <b>capture chance</b> is already included in those shown odds: each capture-chance point contributes <b>1.5 percentage points</b> before the <b>95% overall chance ceiling</b>, with the gear contribution capped at <b>+25 percentage points</b>. First contact remains unavailable.</p><p>The three capture actions share one finite <b>Biosphere Yield</b>. Every attempt spends 1 Yield on a hit or miss. A successful species leaves that action’s eligible pool for the rest of the world’s current cycle; a miss stays eligible. Empty, worked-out, or protected-save refusals roll nothing and spend nothing. Busy, stale, and failed-write outcomes publish nothing and leave saved Yield and draw counters unchanged. The pool fully recovers at the next <b>20-minute active-play cycle</b>; closing the game or moving the wall clock does not advance recovery.</p><p>The first successful observation of a species adds its one Compendium page plus the creature or specimen lot. A later-world or later-cycle repeat adds another creature or lot without another page or first-find reward. A first successful Legendary-or-better observation earns its one Rare Find Stardust bonus; the result shows the exact amount. A miss adds no page, creature, specimen, or Stardust. The first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction. A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing. That Chapter 2 capture milestone is separate from the live Discover Life action, which owns the per-world Survey record and hazard. An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt; older Surveys and capture do not count. Weekly bioscan Charters remain protected until their separate lifecycle is complete.</p><p>With <b>Sound</b> and <b>Creature voices</b> on, a verified Tame, an exact committed Feed, or an explicit Listen action on a real owned-fauna Compendium detail may play one deterministic synthesized expression only while its exact current identity and accessible status counterpart agree. Compendium list mounting, focus, filtering, and navigation never play a call. On an inhabited target world, both the pre-landing Survey card and landed Planetside can offer <b>Listen to biosphere</b> only while their exact current generic biosphere lead is visible. Both play the same generic distant living-biosphere signal but retain distinct approach/roster evidence; neither reveals a species, spends Yield, awards anything, or writes the save. Sound Off stops every path; Creature voices Off stops creature expressions but not the generic biosphere ambience or registered post-settlement Combat Chronicle cues. Chronicle sound includes the already-modelled initiative, dodge, stun, impact/critical/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motifs; Skip leaves the remaining transcript silent. Authored ambience, music, recorded assets, and other creature actions remain unavailable.</p><p>Narrow companion feeding, nonlethal <span data-gt=\"breeding\">Breeding</span>, exact-instance companion renaming, and <b>Field Scout</b> selection are available only from a real fauna Compendium detail. Field Scout interception is live on hostile Discover Life. A real Flora detail separately offers <span data-gt=\"eating\">Eat 1</span> for explorer healing, poison, and stat nourishment. Companion Feed reveals tastes, grows Meals, mends wounds and records bond memories; it never poisons a companion. Passive evolution remains unavailable. care, bond memories, friendly duels and companion missions are live.</p>", "Explicit Discover Life with its exact-home catalogue-only Paragon exception, accepted Starter Bioscan completion, nonlethal Field Scout interception, random full-biosphere capture with finite shared active-play Yield, and one first-success Chapter 2 life-discovery tick per source-proven world beyond Sol are live; targeted capture and weekly bioscan Charters remain unavailable.", "Planetside capture has not been connected in this build."),
	kingdoms: partial(["compendium-read"], "<p>The <b>Compendium</b> presents up to 1,500 logical entries across Microbe, Flora, Fungi, and Fauna. Search filters those saved records, the count reports the logical matches, and choosing a row opens its detail. The long list mounts the visible viewport plus half a viewport of overscan on each side (about two viewports total), plus at most the focused pinned row.</p><p>Each mounted row starts with a neutral placeholder, then receives an exact <b>132px</b> thumbnail. The complete genome—not only the displayed name or seed—owns visual identity. Planetside shares the same bounded thumbnail lease path, and thumbnails are released when their visible owner leaves.</p><p>A successful first Planetside capture can add one page: Tame also adds an owned fauna creature, while Scavenge and Sample add specimen lots. Later-world or later-cycle successes add another creature or lot without duplicating the page. A real fauna detail alone exposes narrow exact-instance <b>Feed</b>, <span data-gt=\"breeding\">Breed</span>, <b>Rename</b>, <b>Listen</b>, and <b>Field Scout</b> actions. A real Flora detail can expose the explorer’s separate <span data-gt=\"eating\">Eat 1</span> action. Owned fauna can become eligible conquest champions, and the designated Field Scout can intercept hostile Discover Life injury. Companion care, bond and missions are live; broader husbandry remains unavailable.</p><p>Filter by kingdom or Rare+, Legendary+ and Mythic+ rarity chips. Shelves groups entries by habitat with collapsible headings; the same search applies in both views.</p>", "The Compendium is a bounded catalogue and detail browser; a real fauna detail also exposes narrow Feed, Breed, Rename, Listen, and Field Scout actions.", "The Compendium catalogue has not been connected in this build."),
	rarity: partial(["species-details"], "<p>Species details display the established grade attached to the saved genome, on the shared ladder from Common through Transcendent. The v2 slice preserves that deterministic classification.</p><p>Rarity lowers a species’ base Tame, Scavenge, or Sample chance. Because each action first chooses uniformly from its eligible full-biosphere pool, the selected species and its exact chance appear with the result rather than pretending the preview row was targeted.</p><p>Only the first successful Legendary-or-better observation earns a Rare Find Stardust bonus; the result shows the exact amount. A later-world or later-cycle repeat can add another creature or specimen lot, but never another Compendium page or first-find reward. In the narrow <span data-gt=\"breeding\">Breed</span> action, both parents’ established rarity tiers and the bounded lifetime-earned Stardust bonus determine the shown success chance without exposing raw genetic values. The broader rarity economy remains unavailable.</p>", "Grade display, rarity-weighted capture odds, first-find Stardust, and rarity-backed Breed odds are live; the broader rarity economy remains open.", "Species grade details have not been connected in this build."),
	specimen: partial(["species-details"], "<p>Open a Compendium row’s detail to read its name, kingdom, realm, description, grade, five battle-stat bars, and exact <b>440px</b> portrait. The selected image moves gently while visible; reduced motion holds it still, and Back or Close releases it. This presentation motion does not change anatomy or progression. The portrait uses the same complete-genome identity as its exact 132px list thumbnail; the 440px image is reserved for this detail rather than the list or Planetside.</p><p>Every exact owned fauna instance—including same-species twins—keeps its own XP, level, class, wounds or Recovery, name, and innate combat arts. Innate slots unlock at levels 3 and 6; a species page never collapses distinct companions into one progression row.</p><p><b>Back</b> returns to the saved list position and restores focus to the same logical row. <b>Close</b> returns focus to the exact Compendium opener. Both remain available around explorer eating, companion feeding, breeding, renaming, and Field Scout selection.</p><p>Capture happens only through Planetside’s random full-biosphere Tame, Scavenge, and Sample pools, never from a Compendium row. A Tame hit adds one owned fauna creature; Scavenge or Sample adds one specimen lot and never a living companion.</p><p>A real <b>Flora</b> detail previews the exact canonical owned specimen lot, healing, poison risk, and nourished stat for the explorer’s separate <span data-gt=\"eating\">Eat 1</span> action. One specimen is consumed on either the safe or toxic durable outcome.</p><p>Only a real fauna detail offers companion <b>Feed</b>. Choose one exact unassigned owned companion below the 200-Meal cap and one exact owned flora lot, then confirm <b>Use 1</b>. Identical same-species twins remain separate exact instances. Assigned or recovering companions and capped companions stay disabled and explain why. One committed meal raises Meals by 0 to 3, capped at 200, and removes 1 from that exact flora lot; its final unit empties that exact lot. The action uses one receipt-bearing compare-and-swap with no retry and no optimistic change. A refusal, stale result, or failed write uses and publishes nothing; a durable result whose publication cannot be confirmed requires reload and cannot feed twice. With Sound and Creature voices enabled, only the trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status may produce one deterministic synthesized acknowledgement after that status appears; refused, stale, converging, replayed, hidden, route-lost, and counterpart-lost paths remain silent.</p><p>The separate nonlethal <span data-gt=\"breeding\">Breed</span> action chooses two distinct exact owned fauna companions, shows rarity-backed odds, and settles one child-or-no-child outcome plus active-play Recovery without consuming either parent.</p><p><b>Rename</b> chooses one exact owned companion of this species from bounded 24-row pages. Same-species twins remain distinct; assigned, recovering, and injured companions may be renamed because the action changes identity only, while exhibition entries and protected or non-owned rows refuse. The shipped name policy strips &lt; &gt; &amp; &quot; and apostrophe, trims whitespace, and caps the result at 24 characters. Cleaned-empty or unchanged names consume no receipt or write. A commit changes only that exact companion’s nickname, keeps the old name visible while pending, and uses one immutable receipt and one compare-and-swap with no retry or optimistic publication. A stale or failed write changes nothing; an unconfirmable durable result locks read-only, requires reload, and cannot rename twice.</p><p><b>Field Scout</b> chooses one exact owned companion of this fauna species from bounded <b>24-row pages</b>. Same-species twins remain separate exact instances. Assigned, recovering, and injured companions remain eligible because the role selector itself changes only the Scout pointer; choose another companion to switch Scouts, or choose the current Scout to <b>Stand down</b>. One exact-five compare-and-swap settles that choice with no RNG, retry, or optimistic publication. The designated Scout intercepts hostile Discover Life damage in the bioscan’s own transaction and remains at or below Critical. When a later capture catalogues a genuinely fresh species, the Scout standing before that successful attempt earns up to +2 XP in the same capture transaction, capped at 486; no standing Scout, miss, or repeat grants Scout XP. Refused, stale, failed, or unconfirmable writes change nothing visible and cannot apply twice.</p><p>Companion tastes, meal growth, wound care, bond memories, friendly duels and missions are live; companion poison remains unavailable.</p><p>A wild catch offers Origin travel back to its first catalogued world. A newly added Compendium page opens a specimen reveal with its portrait; multiple pages queue behind the current modal or Training, with Continue and Skip all.</p>", "The specimen profile and exact-instance progression rows are live; real fauna details add narrow Feed, Breed, Rename, Listen, and Field Scout actions while broader husbandry remains open.", "Specimen details have not been connected in this build."),
	drift: unavailable(["passive-evolution"], "Passive evolution and cosmic-epoch collection updates are not yet connected to v2 persistence."),
	sapience: unavailable(["civilizations"], "Civilization census, first contact, and sapience interactions are not yet ported."),
	breeding: partial(["breeding"], "<p>Open a <b>real fauna Compendium detail</b>. Breed appears only there. Choose one exact owned companion of that detail’s species as the primary parent and one different exact owned fauna companion as the mate. Identical same-species twins remain separate exact instances. Each selector mounts at most <b>24 candidates per page</b>, while paging keeps every eligible owned companion reachable.</p><p>Exhibition creatures, mission-assigned companions, companions already in Recovery, and companions at <b>30% hurt or more</b> stay disabled and explain why. The same exact companion cannot occupy both parent roles. The shown success chance comes from both parents’ established rarity tiers plus a bounded bonus from lifetime-earned Stardust; raw genetic values stay hidden.</p><p>Both parents remain yours. A success creates one deterministic child with its exact lineage, grants that child <b>+2 XP</b>, and puts both parents into <b>8 active-play minutes</b> of Recovery; a failure creates no child and gives both parents <b>2 active-play minutes</b> of Recovery. The first successful union of each canonical unordered species pair grants the child another <b>+5 XP</b>. Renaming or reversing the parents cannot re-arm it; imported v1 pair claims and their archive remain authoritative without being newly written in the older format. Recovery blocks Breed, combat, and dispatch. Closing the game or moving the wall clock does not advance it.</p><p>The action proves both possible complete save successors before its one outcome draw, then owns one receipt-bearing compare-and-swap with no retry and no optimistic child, XP, pair claim, or Recovery. A refusal, stale result, overflow, or failed write draws nothing and adds nothing. If the result is durable but publication cannot be confirmed, the panel requires reload and cannot breed twice. <b>Back</b> and <b>Close</b> remain available around the action.</p><p>A successful outcome also banks the Chapter 3 <b>Breed a hybrid bloodline</b> goal inside that same offspring save. A failed pairing, refusal, stale result, or failed write banks no Charter credit. Parent consumption and manual genetic editing remain unavailable. Care, bond memories, combat and companion missions are live.</p>", "One bounded, nonlethal exact-instance Breed action and active-play Recovery are live on real fauna Compendium details; broader husbandry remains open.", "The exact-instance companion Breed and Recovery action has not been connected in this build."),
	feeding: partial(["feeding"], "<p><b>Care &amp; bond.</b> Loved food raises Meals by 2, or 3 for flora tier 4 or higher, and mends 0.25 injury. Neutral food adds 1 and mends 0.10; disliked food is consumed without growth or healing and never poisons a companion. The first meal earns 1 XP and each first flavour earns 2 XP, once. Bond records distinct firsts, ranges from Wary to Soulbound and never decays; Trusted opens Long missions and Devoted halves mission wound risk. Rest heals and reserves a wounded companion for 2 active minutes per 0.1 injury, rounded up and capped at 20 minutes. Closed-game time never advances Rest.</p><p>Open a <b>real fauna Compendium detail</b>. Feed appears only there. Choose one exact unassigned owned companion whose Meals are below 200 and one exact owned flora lot, then confirm <b>Use 1</b>. Same-species twins remain separate exact instances, so the selected companion and selected lot are the only targets. Companions with an active assignment or Recovery timer and companions already at the 200-Meal cap stay disabled and explain why.</p><p>One committed meal raises that companion’s <b>Meals by 0 to 3</b>, capped at 200, and removes <b>1 flora</b> from that exact lot. Using its final unit empties that exact lot. The action owns one immutable receipt and one compare-and-swap save transaction, with no retry and no optimistic inventory or Meals change. A refusal, stale result, or failed write uses and publishes nothing. If durability succeeds but publication cannot be confirmed, the panel requires reload and cannot feed twice.</p><p>With <b>Sound</b> and <b>Creature voices</b> enabled, only the trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status may produce one deterministic synthesized acknowledgement after that status appears. The inline polite result is the only screen-reader announcement; the simultaneous corner toast is visual-only. Refused, stale, converging, replayed, hidden, route-lost, and counterpart-lost paths remain silent. The same successful result and every older successful result also remain silent. <b>Back</b> and <b>Close</b> remain available around the action.</p><p>This companion action resolves taste, Meals growth, wound mending and first-time XP in the same inventory spend: Loved food grows Meals faster and mends wounds; disliked food is harmless; first tastes build bond memories. The explorer’s separate <span data-gt=\"eating\">Eat 1</span> action lives on a real Flora detail and owns healing, poison, and nourishment without changing companion Feed. Companion <span data-gt=\"breeding\">Breed</span> has its own eligibility, odds, lineage, and active-play Recovery. <b>Rename</b> changes only one selected exact companion’s nickname; <b>Field Scout</b> separately selects the exact role and can intercept hostile Discover Life injury. Friendly duels and companion missions are live.</p><p><b>Companion missions.</b> Choose Prospect or Survey for a world you have landed on, for 10, 25 or 60 minutes of active play. Two companions can be away at once. Prospect brings local materials; Survey brings Stardust and lore. Risk is shown before dispatch; Recall brings the companion home with nothing. Claim a ready return once for its sealed rewards, XP and bond memories; a full hold keeps it ready. The first Long return from a world leaves a memento. Trusted unlocks Long missions; Devoted halves wound risk. Kindred’s preferred-mission choice is not yet available. Closing the game or changing the device clock never completes a mission.</p>", "Exact-instance Feed resolves tastes, growth, wound mending and bond memories; Rest, friendly duels and companion missions are live.", "The exact-instance fauna Feed action has not been connected in this build."),
	injuries: partial(["creature-care"], "<p>Surface conquest settles persistent state for an exact owned-fauna champion. A hard-won victory can increase its hurt. On defeat, a bred champion returns through active-play Recovery and so does a wild-caught champion; defeat adds no wound; every result is part of the same verified combat save and never appears optimistically.</p><p>An assigned Field Scout intercepts hostile <b>Discover Life</b> field damage in the bioscan transaction and remains at or below Critical; protected imported injury above that cap refuses instead of being rewritten. Without a Scout, the explorer takes the nonlethal field wound. Explorer <span data-gt=\"eating\">Flora meals</span> can heal or poison the explorer only. Companion Feed mends wounds according to taste; Rest heals a wounded companion and locks it until its active-play timer ends; companion poison is absent. A companion already at 30% hurt or more cannot enter combat or Breed, while Field Scout and identity-only Rename selection remain available.</p>", "Persistent conquest injury, nonlethal Discover Life Scout interception, and explorer Flora healing are live; companion Feed mending and timed Rest are live.", "Persistent conquest injury has not been connected in this build."),
	eating: partial(["explorer-eating"], "<p>Open a <b>real Flora Compendium detail</b> and choose <b>Eat 1</b>. The action consumes one exact owned specimen lot through one receipt-bearing save transaction. A safe meal restores the shown HP and permanently nourishes that flora species' deterministic battle stat; <b>Xenobotany Lab</b> adds one nourishment point, worn healing gear multiplies recovery, and Vitality nourishment raises maximum HP.</p><p>Every rarity keeps its shown poison risk. A toxic outcome consumes the plant and wounds the explorer instead, but the beta-safe meal rule stops at <b>1 HP</b>. Refused, busy, stale, and failed writes consume nothing. An unconfirmable durable meal reloads read-only and cannot eat twice.</p>", "Exact owned-Flora meals, deterministic healing or poison, permanent stat nourishment, Xenobotany, worn healing gear, and the 1 HP survival floor are live.", "Explorer eating has not been connected in this build."),
	stats: partial(["species-details"], "<p>The v2 specimen detail displays the established five combat stats — Vitality, Ferocity, Resilience, Agility, and Instinct — from the deterministic genome through the ported battle-stat facade.</p><p>A safe explorer <span data-gt=\"eating\">Flora meal</span> permanently raises the plant’s deterministic explorer stat by its shown amount, capped at 330. Xenobotany adds one point; Vitality growth recomputes maximum HP and tops up that increase. A toxic meal grants no stat. The full explorer character sheet and broader interactive stat surface remain open.</p>", "Creature battle-stat reading and deterministic explorer Flora nourishment are live; the full explorer stat sheet and broader progression surface remain open.", "The deterministic species-stat detail has not been connected in this build."),
	hp: partial(["explorer-health"], "<p>The top bar displays the expedition’s imported/current <b>HP</b> and the maximum derived from its preserved explorer stats. The value is durable, not decorative: an unguarded stellar skim at a remnant star previews and then costs exactly <b>3 HP</b>. Engineering refuses that skim when HP is 4 or lower, and connected skim protection reduces the shown damage to zero.</p><p>The explorer can also lead a landed Surface conquest. A defeat applies the verified defender-scaled damage but keeps the expedition at a <b>1 HP mercy floor</b>; a settled drop below 20 HP unlocks <b>On the Brink</b>.</p><p>Hostile <b>Discover Life</b> shows its chance and final field damage. Reinforced Hull applies 25% reduction before worn bioscan protection; a Field Scout intercepts when assigned, otherwise the explorer remains at or above 1 HP. A safe <span data-gt=\"eating\">Flora meal</span> restores the shown HP with worn healing gear and can raise maximum HP through Vitality; poison wounds instead but remains nonlethal. Death/reset and broader restoration remain open.</p>", "Durable HP now covers remnant skimming, conquest, explicit Discover Life injury, and explorer Flora healing or poison, all with their established nonlethal floors; death/reset and broader restoration remain open.", "The explorer HP display has not been connected in this build."),
	rank: partial(["ranks"], "<p><b>Records</b> now shows the exact ten-rank ladder: Cadet, Scout, Pathfinder, Voyager, Pioneer, Star Cartographer, Mythic Wayfarer, Void Sovereign, Cosmic Luminary, and Eternal Frontier. Expedition score is the sum of six visible factors: living worlds surveyed, species catalogued, highest raw rarity tier, durable achievement IDs, hybrids bred, and galaxies visited. Eternal Frontier continues in <b>3,000-point prestige steps</b>.</p><p>Each attained rank permanently preserves its nameplate color; Eternal Frontier uses the iridescent foil. The top bar shows the player name and current rank with the durable color or foil, and a real post-action promotion announces the newly earned named rank only after its one nonoptimistic progression refresh commits. Boot catch-up never fakes a promotion.</p><p><b>Settings → Nameplate</b> offers <b>Auto</b> to follow the current rank or any color earned through the durable best-rank record. One native choice settles through one receipt and one compare-and-swap with no retry or optimistic color change; locked or malformed choices are refused, and an unconfirmable durable result reloads instead of applying twice. The saved best-rank record never demotes.</p><p><b>Settings → Explorer name → Change name</b> changes only the expedition’s explorer name. It uses the shipped sanitizer, trims whitespace, and caps the result at 24 characters; cleaned-empty or unchanged input consumes no receipt or write. One receipt and one compare-and-swap settle with no retry or optimistic name, and durable ambiguity reloads instead of applying twice. Explorer self-rename deliberately does not unlock the discovery-name <code>namer</code> achievement. Broader rank rewards remain unavailable.</p>", "The exact ten ranks, six score factors, durable best rank, live Auto/earned-color Nameplate selector, explorer self-rename, color or foil, and postcommit promotion toast are available; broader rewards remain open.", "Explorer ranks have not been connected in this build."),
	achievements: partial(["records"], "<p>The <b>Records</b> board preserves and displays imported exploration totals and Stardust earned. First landfalls visibly update the worlds-landed total. Mine, Skim, and fixed Fabricator settlements also preserve their compatible expedition counters, but those Arc 3 counters are not yet listed as separate Records totals and live Journal writing is not connected.</p><p><b>Expedition Chronicle &amp; Museum</b> is one read-only, escaped projection with four independently ordered galleries of at most 60 rows each: Battle Chronicle is latest receipt first; Discovery Museum follows canonical immutable first-species record order; Prime Victories follows Signature order without inventing claim time; and Legacy Journal preserves its established append order, latest first. Invalid or protected authorities show one protected panel. The Museum creates no writer, receipt, reward, RNG, save field, mission, share card, or global cross-gallery timeline.</p><p>Records renders all <b>96 achievements</b> in <b>13 shelves</b>. One nonoptimistic aggregate refresh can durably add the <b>68 aggregate</b> milestones and the best-rank record after a real product settlement; it owns one compare-and-swap, never retries, and publishes only after verification. The other 28 achievements require their exact live event owner rather than being guessed from totals.</p><p><b>Twenty-six</b> exact live event joins now cover Earth landing (<code>home</code>), first accepted world or companion Rename (<code>namer</code>), successful breeding from two Legendary-or-better parents (<code>bredlegend</code>), first verified conquest settlement (<code>settle1</code>), a settled explorer injury below 20 HP (<code>brink</code>), valid-world Share (<code>share</code>), accepted CF1 Follow (<code>wayfarer</code>), twelve source-derived Survey observations, wormhole traversal, arrival at a quasar or dwarf galaxy, the first explicit Atlas Favorite (<code>curator</code>), safe explorer Flora healing (<code>fieldmedic</code>), a safe meal above 40% poison risk (<code>gambler</code>), and survival of hostile Discover Life injury (<code>survivor</code>). Accepted Follow folds its accepted route, Jumps record, galaxy visit, <code>wayfarer</code>, and any proved <code>quasar</code>/<code>dwarfg</code> event into one receipt; ordinary navigation cannot counterfeit Follow. Explorer self-rename changes only identity and deliberately does not grant <code>namer</code>. Exactly two event owners remain blocked: <code>daily</code> and <code>decade</code>. Achievement reward claims also remain open; preserved unknown imported IDs retain rank credit without being reinterpreted.</p><p>After a real action’s exact durable successor is verified and published, each newly appended supported achievement may announce its authored name and description with a tier-3 sting. A newly raised best rank may announce its name with a tier-5 sting and a bounded gold burst of at most 40 particles; the current effects, motion, and device budget may lower that count. Presentation ceremonies keep their durable action order: an older queued achievement or rank announcement waits intact behind any current receipt-bearing product action and resumes only after that action’s own result is published. Boot catch-up, replay, already-durable recovery, Training, convergence, and refusals stay silent. These ceremonies write no save, evaluate no rule, and grant no reward.</p>", "Records now presents the ten-rank projection, all 96 achievements in 13 shelves, durable aggregate refresh, 26 exact live event joins, and the bounded read-only Expedition Chronicle & Museum; daily, decade, and achievement rewards stay open.", "The current Records and Journal surface has not been connected in this build."),
	duels: partial(["duels"], "<p>Open an eligible owned companion’s <b>Friendly duel</b> panel in the Compendium. Paste a friend’s <b>CFB-</b> code and preview the exact challenger before confirming. Sharing a creature code writes no expedition and does not import a companion.</p><p>A deterministic duel records one saved result. Nobody is lost or wounded. A win can pay <b>8 XP</b>; participation can pay 2 XP, or 3 for a bout taken below 25% health. The panel previews the separate active-play reward cooldowns, and repeating or reloading cannot claim a reward twice. The settled Chronicle has the same named fighters and result as the durable receipt.</p>", "Friendly duels, CFB creature sharing, saved outcomes and bounded XP are live; expedition import is not.", "Friendly duels have not been connected in this build."),
	abilities: unavailable(["abilities"], "Live ability selection, effects, and combat presentation are not yet ported."),
	classes: partial(["creature-progression"], "<p>An eligible owned-fauna conquest champion now receives verified durable XP. A normal conquest win awards <b>20 + world tier</b>; an Apex Guardian or Elemental Titan win awards <b>60 + world tier</b>. The first defeat by that exact creature on that exact canonical world teaches +3 XP, rising to a one-time +5 total when the settled bout reaches the near-brink condition.</p><p>A successful Breed gives the child <b>+2 XP</b>. The first successful union of each canonical unordered species pair gives that child another <b>+5 XP</b>; stable species identities—not names or parent order—own the one-time claim, and imported v1 claims remain authoritative.</p><p>When a successful Tame, Scavenge, or Sample catalogues a genuinely fresh species, the <b>Field Scout standing before that attempt</b> earns up to <b>+2 XP</b> in the same capture transaction, capped at 486. A 485-XP Scout gains only 1; a Scout already at the cap gains 0. A capture with no standing Scout, a miss, or a repeat species grants no Scout XP, and changing the Scout afterward cannot redirect the award.</p><p>The full class, level, innate-art, and interactive progression presentation remains unavailable. These XP writers never invent class state merely because XP is durable.</p>", "Verified conquest, first-loss, successful-child, first-union, and fresh-species Field Scout XP are live; the full class, level, and innate-art presentation remains open.", "Conquest creature XP has not been connected in this build."),
	conquest: partial(["conquest"], "<p>On a landed non-Training <b>Surface</b>, Conquest offers the explorer, each eligible ordinary owned-fauna companion, and each live captured Guardian or Titan as champion. The defender is the world’s one deterministic Elemental Titan when present, otherwise its Apex Guardian, otherwise its strongest canonical fauna. The card shows an exact <b>160-run deterministic forecast</b> before commitment.</p><p>Challenge settles one deterministic encounter through one immutable receipt and one compare-and-swap. Every Guardian or Titan uses the phase change, including solo Balanced Auto; wild fights remain Auto. It has no automatic retry, reroll, or optimistic result. A refusal or failed write changes nothing; an unconfirmable durable result becomes read-only and reloads instead of fighting twice.</p><p>Only after that exact durable settlement is verified, the <b>Combat Chronicle</b> opens with named timed transcript rows, two accessible HP meters, and the settled statistics and result. <b>Skip</b> stops active combat sound and reveals the remaining transcript silently. <b>Share battle log</b> copies plain text when clipboard access works; otherwise the exact log is selected in the Chronicle for the browser’s Copy command. Sharing this battle log grants no world-Share achievement.</p><p>Every already-modelled registered initiative, dodge, stun, impact/critical/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motif owns an exact visible-caption counterpart. Composite events remain one voice and at most two combat voices overlap. Master Sound—not Creature voices—governs combat. Sound Off, Close, Skip, a hidden or replaced Chronicle, route loss, or counterpart loss stops playback. Authored or recorded combat assets, ambience, and music remain unavailable.</p><p>A verified win conquers the world once and awards <b>8 + five times world tier</b> Stardust, plus 40 more against a Guardian or Titan. An owned-fauna champion receives the exact XP described under <span data-gt=\"classes\">Classes &amp; leveling</span>; combat can also persist its injury. A player defeat applies defender-scaled damage but never falls below 1 HP. A bred fauna loser returns through active-play Recovery; a wild-caught loser returns through active-play Recovery.</p><p>Captured Guardians and Titans return through a separate combat-only companion record rather than being inserted into ordinary Arc 5 companion ownership. They use the same forecast, settlement, Combat Chronicle, registered audio, win-XP, exact loss-XP, and injury path. XP and injury persist through reload. Regardless of lineage, defeat assigns a temporary Recovery lock. The champion remains in the composite Compendium and returns to the combat roster when active-play Recovery ends; reload, Training restore and capture reconciliation preserve that lock. They gain no Arc 5 care, breeding or missions; a combat-only Recovery overlay controls their availability.</p><p>A defeated Guardian or Titan is added to the Compendium with battlefield modifiers stripped. A Titan victory also claims its new Prime Signature; the ninth distinct claim unlocks the Frontier. Those Prime claims remain independent of later champion use. Chapter 2 conquest and an accepted starter <code>st-conq</code> reward settle in the same save. An accepted <code>wk-conq</code> refuses before combat because weekly lifecycle authority is missing.</p><p>Authored extra Guardian Gear or material caches remain unavailable. If the legacy 40% conquest-imbue gate would fire for equipped gear, conquest currently refuses before the duel until that imbue can coexist with natural and Pureforged modifiers. Guardian and Titan fights offer up to three fighters, stances, Auto or Command, and offered Hold, Swap or Withdraw choices; ordinary wild fights stay Auto. Defeat applies active-play Recovery with no added defeat wound. Broader Guardian care, breeding and missions remain open.</p>", "One forecasted, receipt-backed Surface conquest settles combat, XP, injury, conquest, Stardust, Guardian acquisition, Prime claims, and bounded Charter joins; advanced combat and loot remain open.", "Surface conquest has not been connected in this build."),
	binder: partial(["binder"], "<p>The <b>Binder</b> lives in <b>Records</b> and keeps its six established type pages: the Spectrum, Sixteen Realms, Body Plans, Ability Themes, Flora Flavors, and Size Classes. Slots are species types, not individual creatures; the current Compendium decides which are filled.</p><p>Eight established collection sets are live: Four Crowns, The Five Flavors, Master of Arts, The Bestiary, Warden of Realms, Against All Odds, The Apex Court, and Seeker of Legends. A completed unclaimed set exposes one exact <b>Claim</b> action. Its one-time Stardust reward, lifetime-earned total, claimed-set record, achievements, and rank refresh settle in one receipt and one compare-and-swap with no retry or optimistic reward.</p><p>The deterministic Fifty-Paragon hunt is live: fifty fixed legends shared by every explorer. A missing silhouette offers <b>Plot course</b> to its source-proven home through the existing ship and Prime reach checks; an accepted world route opens Survey, and Land remains separate. A found entry offers <b>Inspect</b>, which opens that exact existing Compendium record without travel or acquisition. Its ordinary Back control returns to the Compendium list. Use <b>Discover Life</b> at an exact home for its explicit Bioscan. At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record. It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield. Repeat sightings add no duplicate record or discovery reward. The separate <b>Seeker of Legends</b> Binder <b>Claim</b> becomes available at ten exact Paragons and pays its established <b>120 Stardust</b> once; discovering a Paragon never pays that Set reward automatically. A prior Paragon-set claim remains claimed and can never pay again.</p>", "All six established Binder type pages, eight set rewards, and the source-proven Fifty-Paragon hunt are live in Records; missing silhouettes plot a home and found entries inspect their exact Compendium record.", "The Binder has not been connected in this build."),
	guardians: partial(["guardians"], "<p>Rare worlds can field their deterministic <b>Apex Guardian</b>; eligible Signature worlds can instead field one named <b>Elemental Titan</b>. They are selected from the exact world, region, roster, and already-claimed Prime set, so the same canonical expedition facts produce the same ruler.</p><p>A verified victory adds the defeated Guardian or Titan to the Compendium with temporary battlefield modifiers stripped. Titan victories also claim the matching Prime Signature. The normal conquest Stardust and fauna XP bonuses settle in the same receipt-backed save.</p><p>Each live captured Guardian or Titan can return as a conquest champion from its separate combat-only record. It uses the existing forecast, Chronicle, registered combat audio and XP path. Defeat starts active-play Recovery, with no added defeat wound; the creature stays in the Compendium and returns to the roster when ready. Prime Signature claims remain independent. These captures stay outside ordinary Arc 5 care, breeding and missions. A combat-only Recovery overlay controls availability. Guardian and Titan encounters offer a party, stances, Auto or Command, and offered Hold, Swap or Withdraw choices. Their phase change applies even to solo Balanced Auto.</p><p>The authored extra Guardian Gear or material cache is not yet authoritative and is never invented; see <span data-gt=\"conquest\">Conquest</span>.</p>", "Apex Guardian and Elemental Titan encounters, verified acquisition, Prime claims, and captured-champion combat use are live; authored caches and broader companion systems remain open.", "Guardian and Titan conquest have not been connected in this build."),
	stardust: partial(["stardust"], "<p>The expedition preserves its imported/current <b>Stardust</b>. Engineering shows the exact amount owned beside each cost, and any successful Research purchase or eligible fixed Fabricator recipe spends its stated Stardust in the same durable transaction as the result.</p><p>A first successful Legendary-or-better Tame, Scavenge, or Sample observation earns its one Rare Find Stardust bonus in the same durable transaction as its page and ownership; the result shows the exact amount. A miss and every later-world or later-cycle repeat earn none.</p><p>Each supported Starter Charter pays its established 10–25 Stardust once when the exact accepted deed completes; <code>st-conq</code> remains part of verified combat. A completed unclaimed Binder Set pays its established 25–150 Stardust once from Records. Seeker of Legends is the eighth Set: its separate Claim pays 120 Stardust once after ten exact Paragons; a sighting does not pay it automatically. Both paths update current and lifetime-earned totals in the same receipt as their completion or claim.</p><p>A verified conquest win awards <b>8 + five times world tier</b> Stardust, plus 40 against an Apex Guardian or Elemental Titan, in the same save as conquest. Weekly Charters, passive gain, and the rest of the mature economy remain unavailable.</p>", "Engineering spends preserved Stardust; rare first finds, verified conquest, supported Starter Charters, and eight Binder Sets provide current earning paths.", "Stardust spending has not been connected in this build."),
	harvest: partial(["harvesting"], "<p>A conquered world offers <b>Harvest</b> when its active-play cooldown is ready. The card previews its result. One receipt grants the harvest and starts the next cooldown; a duplicate claim, stale tab or failed write cannot grant it twice. Closing the game or changing the device clock cannot advance the timer.</p>", "Conquered-world Harvest runs on active play.", "Settled-world harvest outcomes and play-time recharge are not yet ported."),
	mining: partial(["mining"], "<p>Land on a proven <b>lifeless, non-Earth world</b>, then open <b>Engineering &amp; Shipyard → Mining</b>. Grounded Engineering reveals that world’s deterministic deposits, grades, special veins, and exact pulls remaining. The reveal is inspection only; <b>Mine this world</b> is the separate durable action.</p><p>Each press takes one manual pull, deposits its exact ordinary, rich-strike, cosmic, and exceptional results into Cargo, advances durable extraction progress, and eventually leaves the world <b>Worked out</b>. Living worlds and Earth are protected. An owned Auto-Extractor may add matured loads to a later manual press, but its cursor advances only with active play—closing the game or moving the wall clock creates no income. Capacity, revision, stale-tab, protected-save, and failed-write checks refuse before publication; a pending action disables every Engineering action until it settles.</p>", "Finite grounded mining, Cargo rewards, active-play Auto-Extractor settlement, and worked-out persistence are live; wall-clock and offline income are not.", "Mining has not been connected in this build."),
	skimming: partial(["skimming"], "<p>Enter a proven star system and open <b>Engineering &amp; Shipyard → Stellar Skimming</b>. A fitted Jump Drive is required. Supported star classes show the exact material, finite passes remaining, and next HP damage before <b>Skim this star</b> can be pressed.</p><p>Each successful skim deposits one deterministic material haul and spends one corona pass. An unguarded remnant costs exactly 3 HP; connected skim protection reduces that damage to zero, and HP of 4 or lower blocks the unsafe attempt. A spent corona remains <b>Worked out</b>. Skimming does not bank a mining Charter goal, and there is no wall-clock recharge.</p>", "Finite Jump-gated stellar skimming, Cargo rewards, worked-out persistence, and explicit remnant HP risk are live; recharge and broader stellar heat systems are not.", "Stellar skimming has not been connected in this build."),
	research: partial([
		"shipyard-inspection",
		"research",
		"crafting"
	], "<p><b>Engineering &amp; Shipyard</b> combines the capability-derived ship preview with Mining, Stellar Skimming, the Research Bench, and the fixed Fabricator. The preview consumes the same owned permanent systems and reach state as travel; no separate visual state is saved. If Engineering authority is protected or expedition storage is read-only, the current ship remains inspectable while every authority-dependent action stays unavailable.</p><p>The Research Bench lists exactly six canonical, durably purchasable rows. <b>Deep Scanners</b> reveal bounded orbital mineral facts. <b>Reinforced Hull</b> reduces hostile Discover Life damage by 25%. <b>Xenobotany Lab</b> adds one permanent nourishment point to every safe explorer Flora meal. <b>Fusion Drive</b>, <b>Antimatter Drive</b>, and <b>Warp Fold</b> successively shorten the deterministic distance-scaled hyperlane presentation; they never replace permanent reach systems or slow an unresearched expedition.</p><p>The Fabricator groups all <b>62 fixed recipes</b> and exposes an action only when its output has a connected gameplay effect and its exact materials, parts, Stardust, Signature, prerequisite, revision, and capacity checks pass. Parts, components, permanent ship systems, and supported explorer gear settle durably. Equipped healing, bioscan-protection, and travel-speed gear now join the already-live mining, skimming, and capture effects. When every direct material unit for a slotted craft comes from exceptional stock, that exact item receives one deterministic <b>Pureforged</b> modifier: mining yield, rich-strike chance, or capture-contact points, bound to its recipe and receipt; mixed stock remains an ordinary craft. Pureforged effects without a connected consumer, authored natural affixes/drawbacks, random drops, upgrades, sockets, and vendors remain separate beta work.</p><p>Only one Engineering action can be pending. Close remains available, reopening stays busy, and no reward, HP change, Charter tick, ownership change, or cost is published before the receipt-bearing transaction commits. See <span data-gt=\"mining\">Mining &amp; the Cargo hold</span>, <span data-gt=\"skimming\">Stellar skimming</span>, and <span data-gt=\"crafting\">The Fabricator &amp; gear</span>.</p>", "All six Research Bench purchases have live consequence owners; mining, skimming, connected fixed fabrication, and capability-derived ship/reach presentation are live while advanced loot crafting remains open.", "Engineering actions and capability-derived ship inspection have not been connected in this build."),
	crafting: partial(["inventory-actions", "crafting"], "<p><b>Inventory</b> is a separate board in the phone dock and desktop rail. It presents each migrated explorer-gear copy as one stable item instance, including its exact slot, base effects, inherited legacy affix when present, provenance, and equipped state. Open an item to compare every effect against the item in the same slot; conditional effects are labelled instead of presented as universal gains. The legacy contact effect is labelled <b>capture chance</b>: only equipped copies change Tame, Scavenge, and Sample odds, while first contact remains unavailable.</p><p><b>Equip</b>, <b>Unequip</b>, <b>Salvage</b>, and pending-reward claim are exact, revision-checked actions. Only one action may settle at a time, reload cannot reroll it, and a stale tab cannot publish it. Salvage is confirmed and returns the legacy v1.8.9 rule: half of each direct material cost, rounded down, with the same one-unit non-gated fallback for a cheap item. Equipped, locked, and favorite protection remains explicit. An oversized legacy hold is retained losslessly as <b>inspection only</b>; it is never truncated to invent a capacity.</p><p><b>Engineering &amp; Shipyard → Fabricator</b> now lists all 62 fixed recipes and can settle only rows whose output has a connected effect and whose exact costs and capacity fit. Stackable parts/components, permanent systems, and supported explorer gear update the same Arc 2 inventory authority and legacy mirror in one transaction; eligible slotted gear may auto-equip only into an empty slot. A slotted item made entirely from exceptional direct materials carries one deterministic, recipe-and-receipt-bound <b>Pureforged</b> modifier—mining yield, rich-strike chance, or capture-contact points—as part of that exact item through comparison and reload; a mixed-material craft does not. Pureforged effects without a connected consumer, authored natural affixes/drawbacks, random authored drops, targeting tags, item upgrades, sockets, and vendors remain unavailable.</p>", "Exact Inventory actions, eligible fixed Fabricator recipes, and deterministic Pureforged mining-yield, rich-strike, or capture-contact modifiers are live; unsupported effects, advanced natural item generation, drawbacks, upgrades, sockets, and vendors remain open.", "Exact Inventory actions have not been connected in this build."),
	ascent: partial(["charters"], "<p>The <b>Charters</b> board preserves the imported/current Ascent stage and projects only live milestones: first landfalls, successful Mine actions, successful fixed Fabricator outputs, one successful companion Breed, one first durable successful capture per source-proven world beyond Sol, and verified Conquest. Revisits do not rebank landfall or conquest. Sol-versus-beyond-Sol scope uses the complete verified galaxy, star, planet, and source ordinal, never a planet seed by itself. One Mine press banks one mining-goal tick, and exact part/component/gear/system recipes bank only their matching fabrication goals; Research and Skim bank neither.</p><p>Chapter 1 is now completable through real play. Building its Jump Drive creates the owned system that backs the next reach stage; Long-Range Array and Intergalactic Drive recipes likewise change actual ship/reach state when their canonical chapters can be proved. Land, Mine, Fabricator, successful Breed, qualifying capture, and Conquest commits reconcile consecutive imported chapters only when canonical progress and owned reach already prove them; incomplete or incompatible records stop without invented goals, rewards, systems, or reach.</p><p>The first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol banks that world’s one Chapter 2 life-discovery tick in the same capture transaction. A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing. That Chapter 2 capture milestone is separate from the live <b>Discover Life</b> action, which owns the existing per-world Survey record and hazard. At an exact fixed Paragon home, that same Bioscan can also add only the exact Paragon catalogue record; it creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield. This catalogue exception does not count as the Chapter 2 capture milestone. One successful Breed banks <b>Breed a hybrid bloodline</b> in the same offspring save; a failed pairing, refusal, stale tab, or failed write banks no breeding credit. A first verified conquest banks Chapter 2’s conquest goal in the combat save. If the starter <b>Conquer a world</b> Charter (<code>st-conq</code>) is accepted, that same verified conquest removes it from accepted work, records it complete, adds <b>25 Stardust</b> to both current and lifetime-earned totals, and increments honored Charters once. An accepted weekly conquest (<code>wk-conq</code>) refuses before combat. An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt; older Surveys and capture do not count. Weekly bioscan Charters remain protected until their separate lifecycle is complete. Weekly rows likewise remain protected until wall-week, slate, acceptance, and rollover authority are complete. Saved Prime Signatures separately set galaxy-distance radius; Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier. Mature item rewards remain open.</p>", "Real landfall, mining, fabrication, breeding, alien capture, and conquest Ascent progress plus owned-system and Prime-Signature reach are live; unsupported milestones and mature rewards remain open.", "The current Ascent goals and reach contract have not been connected in this build."),
	signatures: partial(["prime-codex"], "<p>The <b>Prime Codex</b> presents all nine established Signatures: Earth, Fire, Air, Stellar, Water, Electric, Poison, Void, and Prism. Every row names its exact Titan guardian, lore, hunt, reach, and claimed state from the canonical registry; imported unknown Prime or ending authority is shown protected rather than repaired.</p><p>An eligible canonical world can field its one named Elemental Titan only when region, world type, deterministic placement, and the current claimed set agree. Defeating that Titan in verified Surface conquest writes the new claim and its exact world into the Prime Codex in the same transaction. Claimed Signatures expand the separate galaxy-distance radius; the ninth distinct claim unlocks the Frontier. A loss, duplicate claim, refusal, stale tab, or failed write claims nothing.</p><p>A live captured Titan can return through the separate combat-only champion record; its XP and injury persist, and defeat starts active-play Recovery without undoing its Prime claim. The five established Frontier legacy choices are available after all nine claims; see <span data-gt=\"endings\">Endings</span>. Signature relic fabrication remains open.</p>", "The complete nine-row Prime Codex, Titan-backed claims, captured-Titan champion use, ninth-claim Frontier unlock, and five legacy endings are live; Signature relic fabrication remains open.", "Prime Signature conquest has not been connected in this build."),
	regions: partial(["frontier-reach"], "<p>Entering a galaxy or system beyond the expedition’s owned reach is rejected without changing the current view. Star access comes from permanent ship systems—Jump Drive, Long-Range Array, then Intergalactic Drive—with compatible Charter state. Their eligible fixed Fabricator recipes create real ownership and immediately change the shared ship/reach projection. In-progress chapter state never invents a permanent system; a fully completed imported veteran Charter preserves intergalactic reach as the generic legacy refit described in Engineering.</p><p>Galaxy-distance radius remains a separate fact derived from saved Prime Signatures. Verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier; a galaxy beyond the current radius remains blocked until the required claims actually exist. The complete far-field scaling and Prime relic economy remain open.</p>", "Owned-system star reach, Fabricator-driven reach changes, Titan-earned Prime radius, and the ninth-claim Frontier unlock are enforced now; full far-field progression remains open.", "Frontier reach checks have not been connected in this build."),
	endings: partial(["endings"], "<p>Claiming all nine Prime Signatures opens the <b>Celestial Frontier</b> inside the Prime Codex. Choose one established legacy: <b>Sovereign of the Frontier</b>, <b>Warden of Life</b>, <b>World-Shaper</b>, <b>The Unseen Hand</b>, or <b>Prismatic Pathfinder</b>. The galaxy remains open afterward.</p><p>Prismatic Pathfinder is the Balance path and additionally requires at least three conquered worlds, the Electric Signature, and at least 40 catalogued species. One choice changes only the durable ending record through one receipt and one compare-and-swap. It cannot be overwritten by another choice, never retries or publishes optimistically, and an unknown imported ending remains visible protected evidence.</p><p>The later Legacy prestige layer and additional ending consequences remain future work.</p>", "All five established Celestial Frontier choices are live after Prime completion; later Legacy consequences remain open.", "Celestial Frontier ending choices have not been connected in this build."),
	events: unavailable(["cosmic-events"], "Cosmic Events is dormant in v1.8.9 and remains intentionally absent from v2."),
	determinism: partial(["deterministic-world"], "<p>The universe is generated from seeds on your device. A <b>CF1</b> address is a pointer into that shared math, not authority of its own: for every galaxy, star, or planet route, the game regenerates the hierarchy and accepts only a source-verified match. The same supported coordinates therefore resolve to the same galaxy, star, world, and current-slice survey without an account or game server; a stale or forged address cannot replace the current view. Landing history and custom world names follow that complete verified address, so two different worlds that happen to share a planet seed remain separate.</p><p>The universe itself does not need to be stored; your expedition record does. Landed deterministic conquest duels and their verified Combat Chronicle are live. Shared timed events from the mature game remain unavailable.</p>", "The deterministic universe, CF1 address contract, and landed conquest duels are live; friendly/code duels and shared timed events remain unported.", "The deterministic world-generation contract has not been connected in this build."),
	settings: partial(["settings"], "<p>When the v2 web build is served from a secure installable origin, expand <b>App status</b> at the end of Settings. <b>Check for updates</b> looks only for a complete verified build. A ready update waits for <b>Activate update</b>, and activation still never reloads the page for you; choose <b>Reload when ready</b> when you want to enter it. One complete prior build may be selected with <b>Roll back</b>, followed by the same explicit reload. The local development server deliberately does not register the offline worker.</p><p><b>Additional preferences.</b> Folded survey card is off by default. Pop-up notifications can be hidden while the tray and screen-reader announcements remain; creature cues still reveal their visible counterpart. Tooltips support a long press on phones. Confirm salvage, Battle sounds, Mono audio and Reduced intensity are separate controls. <b>Reset expedition</b> requires a second confirmation and replaces the expedition; it is not the same as restarting Training.</p><p><b>Settings</b> currently controls Sound, Volume, Creature voices, Star charts, Visual effects, Screen shake, panel tint, text size, text tone, font, motion, explorer name, and Field Training restart. <b>Visual effects</b> Off allocates no frontier fog particles and turns off the live bloom treatment. With Visual effects On, Motion Reduced keeps only bounded static atmosphere; touch/low-tier devices also stay static, while full-motion capable devices may animate capped fog, blazar bloom, and bright-star breathing. Motion Auto follows the device’s reduced-motion preference live. <b>Screen shake</b> adds only a short deterministic planetfall impulse, and only when Visual effects, Screen shake, and full motion are all enabled. Reduced motion disables shake; device policy may lower the enabled profile and concurrent-impulse cap, but it can never enable shake. Creature voices governs the verified Tame, committed Feed, and explicit owned-fauna Listen expressions. Sound governs all audio, including the generic Planetside biosphere signal and every registered post-settlement Combat Chronicle cue; combat deliberately ignores Creature voices. Each expression or combat cue waits for its own current accessible status or Chronicle counterpart. Turning master Sound off stops every owned audio path immediately; Creature voices Off stops creature expressions only. Turning either setting back on never replays an earlier result. Preferences persist with the expedition.</p><p><b>Explorer name → Change name</b> uses the shipped sanitizer and 24-character cap and changes only the explorer name. Cleaned-empty or unchanged input writes nothing. One receipt and one compare-and-swap settle without retry or optimistic publication; unconfirmable durability reloads instead of applying twice. This identity-only setting never grants the discovery-name <code>namer</code> achievement.</p><p>If the expedition is protected or this tab is read-only, every ordinary save-mutating preference and Training control—including Creature voices and both sliders—remains inspection-only; a protected reload is the only recovery path. A lease-storage failure stops active-play eligibility and accrual immediately, then converges through a protected reload instead of silently reacquiring.</p><p>Restart begins the current <b>16-card</b> drill in Sol: six hands-on navigation lessons and one isolated Iron Plate Forge practice, followed by read-only Planetside, Engineering, Compendium, Records, Guardian/combat, and CF1 Share/Follow orientation. Training locks every live mutating board action and performs no capture, meal, breeding, rename, Field Scout change, persistent engineering transaction, or combat. A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view. If verification pauses, that exact view stays saved; when Sol can still be verified, Training returns there so a reload can restart safely and retry. Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured; every other expedition field is retained from the surrounding save. That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth. An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged; reload after updating. If persistence fails before restart, restart is cancelled. See <span data-gt=\"saving\">Your save & reset</span>.</p><p>The development build plays painted battles by default; the Chronicle remains the text counterpart. The optional audioReview page in a built package is the Listening page for all current sounds. On the development server that flag retains the production audio review tool. Original synthesized voices, material impacts, biome and weather beds, and sparse music share the saved audio controls. Settings has a translation table; English stays unchanged, and real translations remain future work. The optional deviceProbe page measures frame pacing, a heat proxy and available memory facts locally, without sending results.</p>", "Sound, motion, folded survey cards, pop-ups, tooltips, salvage confirmation, confirmed expedition reset and Training controls are live.", "Settings has not been connected in this build."),
	saving: partial(["protected-saves"], "<p>The installed app cache and your expedition are separate. Offline setup keeps one exact active set of app files and, when available, one complete prior set; an incomplete or altered candidate is discarded without replacing the current build. Roll back changes only which complete app-file set will answer after your explicit reload. It never rolls back, copies, or rewrites the IndexedDB expedition. If older app code encounters a newer save, the same <b>Update required</b> protection below still applies.</p><p>The expedition saves to IndexedDB in this browser. v2 starts every explorer fresh: there is no expedition import, and a proven backup may recover a damaged primary. On reload, a saved galaxy, star, or planet location is regenerated from the seeded universe and accepted only when it is source-verified. If that saved location is stale, forged, or incomplete, or if its destination is no longer authorized by your saved reach, the view returns safely to <b>Cosmos</b> without losing the rest of your expedition progress.</p><p>During Field Training, a normal Finish or Skip source-verifies and immediately restores the exact pre-Training view. If verification pauses, that exact view stays saved; when Sol can still be verified, Training returns there so a reload can restart safely and retry. Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured; every other expedition field is retained from the surrounding save. That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth. An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged; reload after updating.</p><p>A newer-build, incomplete, or corrupt stored expedition is held unchanged and announced as <b>Update required</b> or <b>Save protected</b>. Ordinary play cannot silently overwrite protected bytes. There is no cloud account yet.</p>", "IndexedDB persistence, backup recovery, and fail-closed save protection are live; expedition import and account/cloud synchronization are not.", "Protected persistence has not been connected in this build.")
});
/** Capabilities present at the current playable Phase-4 development boundary. */
const V2_DEVELOPMENT_GUIDE_CAPABILITIES = Object.freeze([
	"canvas-navigation",
	"survey-cards",
	"planetfall",
	"search",
	"cf1-sharing",
	"charters",
	"binder",
	"atlas",
	"life-discovery",
	"compendium-read",
	"species-details",
	"breeding",
	"feeding",
	"creature-care",
	"duels",
	"harvesting",
	"explorer-eating",
	"ranks",
	"achievements",
	"creature-progression",
	"conquest",
	"guardians",
	"stardust",
	"mining",
	"skimming",
	"shipyard-inspection",
	"inventory-actions",
	"research",
	"crafting",
	"explorer-health",
	"prime-codex",
	"endings",
	"frontier-reach",
	"deterministic-world",
	"settings",
	"records",
	"protected-saves",
	"field-training"
]);
const DORMANT_SET = new Set(LEGACY_DORMANT_TOPIC_IDS);
const ALL_TOPIC_IDS = new Set(LEGACY_GUIDE_CATEGORIES.flatMap((category) => category.topics.map((topic) => topic.id)));
function crossLinksOf(body) {
	const links = [];
	const seen = /* @__PURE__ */ new Set();
	for (const match of body.matchAll(/data-gt="([^"]+)"/g)) {
		const id = match[1];
		if (id && ALL_TOPIC_IDS.has(id) && !seen.has(id)) {
			seen.add(id);
			links.push(id);
		}
	}
	return Object.freeze(links);
}
function unavailableBody(reason, dormant) {
	return `<p><b>${dormant ? "Dormant in both the v1.8.9 release and v2 development." : "Not available in this v2 development slice."}</b> ${reason}</p>`;
}
function topicView(topic, capabilities) {
	const id = topic.id;
	const support = GUIDE_TOPIC_SUPPORT[id];
	const dormant = DORMANT_SET.has(id);
	const supported = support.allOf.every((capability) => capabilities.has(capability));
	let availability;
	let body;
	if (dormant) {
		availability = "dormant";
		body = unavailableBody(support.unavailableReason, true);
	} else if (!supported) {
		availability = "unavailable";
		body = unavailableBody(support.unavailableReason, false);
	} else if (support.level === "partial") {
		availability = "partial";
		body = support.currentBody;
	} else {
		availability = "available";
		body = topic.body;
	}
	const availabilityNote = availability === "available" || availability === "partial" ? support.currentNote : support.unavailableReason;
	return Object.freeze({
		id,
		title: topic.t,
		keywords: Object.freeze(topic.k.trim().split(/\s+/).filter(Boolean)),
		body,
		legacyBody: topic.body,
		crossLinks: crossLinksOf(body),
		legacyCrossLinks: crossLinksOf(topic.body),
		availability,
		availabilityNote,
		legacyLive: !dormant
	});
}
function getGuideCatalogue(capabilities = V2_DEVELOPMENT_GUIDE_CAPABILITIES, options = {}) {
	const capabilitySet = new Set(capabilities);
	const includeUnavailable = options.includeUnavailable ?? true;
	const includeDormant = options.includeDormant ?? false;
	const categories = [];
	for (const category of LEGACY_GUIDE_CATEGORIES) {
		const topics = category.topics.map((topic) => topicView(topic, capabilitySet)).filter((topic) => (includeDormant || topic.availability !== "dormant") && (includeUnavailable || topic.availability !== "unavailable" && topic.availability !== "dormant"));
		if (topics.length === 0) continue;
		categories.push(Object.freeze({
			id: CATEGORY_ID_BY_NAME[category.cat],
			icon: category.icon,
			title: category.cat,
			blurb: category.blurb,
			topics: Object.freeze(topics)
		}));
	}
	return Object.freeze(categories);
}
function getGuideTopic(id, capabilities = V2_DEVELOPMENT_GUIDE_CAPABILITIES, options = {}) {
	for (const category of getGuideCatalogue(capabilities, {
		includeUnavailable: true,
		includeDormant: options.includeDormant ?? false
	})) {
		const topic = category.topics.find((candidate) => candidate.id === id);
		if (topic) return topic;
	}
}
function searchableText(topic) {
	return [
		topic.id,
		topic.title,
		topic.keywords.join(" "),
		topic.body.replace(/<[^>]*>/g, " "),
		topic.availabilityNote
	].join(" ").toLocaleLowerCase();
}
function searchGuide(query, capabilities = V2_DEVELOPMENT_GUIDE_CAPABILITIES, options = {}) {
	const needle = query.trim().toLocaleLowerCase();
	const topics = getGuideCatalogue(capabilities, options).flatMap((category) => category.topics);
	if (!needle) return Object.freeze(topics.slice());
	return Object.freeze(topics.filter((topic) => searchableText(topic).includes(needle)));
}
//#endregion
//#region port/v2/apps/game/src/release-identity.ts
/**
* Lightweight release identity shared by boot and the authored bulletin archive.
*
* Keep the full Guide/release copy out of the initial browser graph: boot needs
* only the development label and the separately authorized production pointer.
*/
const V2_DEVELOPMENT_VERSION = "2.0";
/** No v2 production release has been authorized or shipped. */
const V2_CURRENT_RELEASE_VERSION = null;
//#endregion
//#region port/v2/apps/game/src/release-content.ts
/**
* Canonical release-note data for the v2 browser app.
*
* The v1.8.9 bulletin remains immutable legacy history.  V2 development notes
* live in a separate development channel and cannot trigger a player update
* popup: v2.0 names the playtest product, while
* V2_CURRENT_RELEASE_VERSION stays null until a production release is
* separately authorized.
*/
const LEGACY_RELEASE_SYNC = Object.freeze({
	sourcePath: "celestial-frontier.html",
	sourceAnchor: "const RELEASES=",
	sourceSha256: "ed9c836e5e116157d3032d62a1873243b29515b234089e99b75a023e70ccde33",
	sourceGameVersion: "1.8.9",
	releaseCount: 56,
	bulletCount: 398
});
const LEGACY_GAME_VERSION = "1.8.9";
const LEGACY_RELEASES = [
	{
		v: "1.8.9",
		title: "One Measure",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🐘 A CREATURE IS ONE SIZE EVERYWHERE — a beast from a long bloodline could be described as “tiny” on its card while the game quietly classified it as Megafauna, handing it a rarity boost and noticeably more vitality than its size should allow. Size now means the same thing on the card, in the fight, in its habitat classification and in the Compendium’s Size Classes.", "🏝 SIZE CLASSES AND HABITAT READINGS AGREE WITH THE CARD — the same mismatch could file a bred creature under the wrong realm, or count it toward a world’s megafauna when it was nothing of the kind."]], ["🔧 Under the Hood", ["📐 ONE DEFINITION OF SIZE — the six places that read the size gene now share a single helper rather than each deciding for themselves. The check that guards it proves a bred creature and its equivalent smaller size are treated identically, and it fails against the previous build."]]]
	},
	{
		v: "1.8.8",
		title: "Paid for Playing",
		date: "July 2026",
		sections: [
			["⚖ Balancing", ["🌍 SETTLED WORLDS NOW PAY YOU FOR EXPLORING, NOT FOR WAITING — a conquered world used to replenish on the calendar: one harvest per hour, whether you were playing or the game was closed. It now replenishes as you explore, roughly forty minutes of play per world. If you play, you earn faster than before. If you leave the game closed for a week, your empire waits for you rather than paying out for time you did not spend. This is the same clock your biosphere pools and creature evolution have always used.", "☄ AN EMPIRE YOU LEFT BEHIND PAYS ONCE ON YOUR RETURN — every settled world is ready the first time you open this version, so a long-standing empire is not penalised for the change."]],
			["🐛 Bug Fixes", ["⏱ THE HARVEST TIMER NO LONGER TRUSTS YOUR DEVICE CLOCK — changing your device’s date could persuade a settled world it had been replenishing for hours. Harvest no longer reads the device clock at all, so there is nothing left to persuade.", "🔘 THE HARVEST BUTTON AND THE HARVEST AGREE — the button face, the survey card and the action itself now read readiness from one place, so a world can never look ready and then refuse."]],
			["🔧 Under the Hood", ["🧪 A NEW CHECK PROVES THE CLOCK CANNOT BE WOUND — it moves a simulated device clock forward a full day and asserts that a settled world stays exactly as ready as the play-time it has earned. It fails against the previous build, which is the only reason to trust it."]]
		]
	},
	{
		v: "1.8.7",
		title: "True to Form",
		date: "July 2026",
		sections: [
			["🐛 Bug Fixes", [
				"🧬 YOUR BRED CREATURES KEEP THEIR SIZE — a creature from a long bloodline could come back from a reload as a different size entirely, usually the largest one, with the vitality and portrait to match. Its voice, its body and its Size Classes slot all moved with it. Bloodlines now read the same before and after a reload, and a creature you exported yesterday still matches the one in your Compendium today.",
				"📱 THE DOCK STAYS REACHABLE DURING TRAINING — on smaller phones, opening the Compendium, Star Atlas or Charters board during Field Training could cover the entire bottom dock, leaving no way to reach the Compendium, Atlas, Shipyard, Charters, Settings or Guide until the board was closed.",
				"💡 THE \"YOU SEEM STUCK\" POINTER NO LONGER DISAPPEARS — acting on the suggestion chip could make it vanish for a player with no objective, which is exactly the player who needed it. If you have nothing on your slate, the chip now always offers a next step."
			]],
			["⚖ Balancing", ["🗓 WEEKLY CHARTERS — the limit added last release is honest about what it does now; the note in the code no longer claims more than the code delivers."]],
			["🔧 Under the Hood", ["⚔ FASTER CONQUEST PICKER — the odds meter rebuilt the defending creature’s stats once per row. It now computes them once for the whole list.", "🧪 TWO MORE OUTCOME TESTS — one proves a long bloodline survives a save-and-reload with its size intact, the other proves the training dock stays pressable behind every raised board on every phone size. Both were checked against the previous build first, to confirm they actually catch the bug they were written for."]]
		]
	},
	{
		v: "1.8.6",
		title: "Kept Promises",
		date: "July 2026",
		sections: [
			["🐛 Bug Fixes", [
				"🎓 THE LESSON CARD STAYS READABLE — opening the Compendium, Star Atlas, Charters or Records during Field Training could draw the board straight over the lesson you were following, hiding both the instruction and the Skip button. On a tablet at the \"open a shelf, then tap a specimen\" step the card was completely buried. Boards now always make room for the lesson.",
				"⚔ DUEL VICTORIES FINALLY PAY — winning a friendly duel awarded your creature nothing at all. Neither did surviving a bout or taking one to the wire. All three now land the XP the Guide has always advertised, and a win no longer quietly eats the cooldown that the next one needed.",
				"🎯 THE CONQUEST ODDS TELL THE TRUTH — the matchup meter cached its estimate too aggressively, so feeding or breeding a champion (or a defender picking up a world bonus) could leave it showing the old number — occasionally the exact opposite of the real result.",
				"🧬 A FIRST-OF-ITS-KIND LINEAGE IS ACTUALLY A FIRST — the lineage bonus announced itself on every successful pairing instead of the first of each kind.",
				"📋 THE QUEST LOG KEEPS ITS HANDLE — while the objective chip was showing a \"you seem stuck\" suggestion, tapping it could no longer open the quest log — exactly when you would want to check what you were meant to be doing.",
				"📏 SIZE READS THE SAME ON THE CARD AND IN THE FIGHT — a heavily bred creature could describe itself as one size on its specimen sheet while fighting at another.",
				"❤ BLOODLINE NUMBERS STOP OVERSHOOTING — a very well-fed beast, or a child of two large broods, could display a fed/brood count above the game’s own 200 ceiling and then snap back after a reload."
			]],
			["🎨 UI Enhancements", ["🐣 THE SPECIMEN SHEET EXPLAINS CARE — the XP line still said victories were the only thing that fed a creature, which has not been true since The Connection. It now names first tastes, unions and new lineages alongside duels, conquests and guardians."]],
			["⚖ Balancing", ["🗓 WEEKLY CHARTERS KEEP THEIR CADENCE — the weekly slate could be persuaded to reroll far more often than weekly, making completed contracts claimable again.", "🔊 CREATURE VOICES USE THEIR FULL RANGE — five of the traits that colour a voice were being folded into far fewer variations than they have, so different creatures sounded more alike than they should. Diets in particular now sound distinct."]],
			["🔧 Under the Hood", ["🧪 REWARDS ARE NOW TESTED BY OUTCOME — a new check plays a real duel and then reads the ledger to confirm the XP arrived. The previous test called the award function directly, which is why a reward that the game never actually granted could pass it in every build.", "📐 THE LAYOUT GATE MEASURES THE LESSON CARD — the browser-based gate grew 80 checks that sample the training card across ten viewports with each board raised, in both card positions."]]
		]
	},
	{
		v: "1.8.5",
		title: "First Touch",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🚀 THE FIRST SCREEN ANSWERS AT ONCE — on a phone, a brand-new expedition spent several seconds building world art you could not see yet, behind the naming screen, so the very first thing you touched did not respond. The art now waits its turn."]], ["🔧 Under the Hood", ["⏱ A COLD-BOOT GATE — the moment the first screen becomes <i>answerable</i> is now measured in a real browser on a throttled phone, because a screen that is drawn is not the same as a screen that answers. That difference was five seconds, and nothing here was watching for it.", "🤖 THE PLAYTEST FLEET PRESSES REAL BUTTONS — a new harness tier takes its actions through the same controls you use instead of reaching past them, so a button that is present but wired to nothing fails here first."]]]
	},
	{
		v: "1.8.4",
		title: "Clear Ground",
		date: "July 2026",
		sections: [
			["🐛 Bug Fixes", [
				"🗺 THE LESSON&#8217;S OWN SCREEN COMES FORWARD — on phones, Earth&#8217;s survey card sat on top of every board, so the two lessons that ask you to open the <b>Star Atlas</b> and the <b>Compendium</b> opened them underneath it. The Compendium button could not be pressed at all. Whatever the current lesson points at now takes the front — except on the landing step, where the card is the thing you need.",
				"📱 THE DOCK IS NEVER BURIED — the survey card stops above the bottom dock instead of running over the buttons a lesson is pointing at.",
				"🪐 THE PLANETSIDE READS CLEARLY DURING TRAINING — the landing view was sliding under the guidance card, hiding its own heading. It settles below the lesson now, so you can read both.",
				"⚙ SETTINGS OPENS OVER A LESSON — the guidance card was covering the Settings panel, the Audio tab especially, on almost every screen size.",
				"🧬 A UNION&#8217;S EXPERIENCE REACHES THE CHILD — both parents are consumed by breeding, and the experience was paid to one of them, so it vanished as it was earned. The newborn carries it now: +2 for the union, +5 the first time you cross two particular species.",
				"🛡 A BOUT SURVIVED FINALLY COUNTS — two of the eight ways a creature earns experience (surviving a bout, and a fight taken to the wire) could never actually pay out. They do now.",
				"💡 THE NUDGE REACHES THE PLAYERS WHO NEED IT — the suggestion that appears when nothing has moved for a while could only ever show for someone who already had a goal. The player with nothing on — the one most likely to give up — was the only one who could never be offered a next step.",
				"☄ SKIMMING A CORONA IS PROGRESS — the game was treating an active skim as if you had stopped playing, and suggested you go do something else.",
				"📋 THE QUEST LOG IS LIVE — it was a snapshot taken when you opened it: charter progress never moved while you watched. It now updates with the objective, closes on Escape, and never strands on screen without a handle.",
				"🔇 SOUND OFF MEANS OFF — switching Sound off left a world&#8217;s ambience playing underneath.",
				"⚔ THE MATCHUP METER STOPS ROUNDING TO CERTAINTY — hopeless and near-certain matchups read <b>&lt;1%</b> and <b>&gt;99%</b> instead of a flat 0% or 100%, and the picker builds its estimate far more cheaply.",
				"❤ THE HEAL TARGET IS A FIXED SIZE — it was sized from the heart glyph, whose width varies by device, and computed under the 44px minimum on phones.",
				"♿ GUIDANCE BUTTONS NO LONGER CLAIM TO BE DISABLED, AND NO LONGER GO DEAD — the shortfall buttons on a specimen card and in the Fabricator now answer when pressed, name what is missing, and sound like a refusal. A verb a lesson has blocked answers too, instead of doing nothing at all."
			]],
			["⚖ Balancing", [
				"🔒 A SPECIES MUST BE CAUGHT TO BE CATALOGUED — tapping a life-form in a world&#8217;s roster added it to your Compendium outright, skipping the tame or scavenge attempt entirely. It now points you at the verb that earns it.",
				"🍽 A WELCOME MEAL IS THE FIRST ONE — the welcome-meal bonus paid on every loved meal forever, and a creature&#8217;s fed bloodline had no ceiling, so a card could promise strength the fighter did not have.",
				"⚔ A LESSON IS LEARNED FROM A WORLD ONCE — losing a conquest was never recorded, so the same world paid its consolation experience on every attempt, indefinitely.",
				"📜 WEEKLY CHARTERS NO LONGER PAY FOR OLD GROUND — a weekly landfall charter completed the moment you accepted it, from worlds you had visited long before, and re-rolled on every clock change.",
				"🌍 HARVESTS KEEP THEIR OWN CLOCK — a settled world&#8217;s hourly harvest measured only the device clock.",
				"💾 A SAVED CREATURE CANNOT CARRY BATTLEFIELD MODIFIERS HOME — the same fields a shared code has always stripped are now stripped on load.",
				"🧪 THE BREEDING PREVIEW TELLS THE TRUTH — the child&#8217;s power range was built from the parents&#8217; fed bloodlines, which a child does not inherit. The range now reflects what the child will actually be, and the card says so."
			]],
			["🔊 Audio", [
				"🐾 CREATURES SOUND FAR MORE LIKE THEMSELVES — the voice read only three things about a creature, so the whole vocabulary was 540 calls: in a collection of fifty, nine in ten had a twin. It now reads its trait, build, gait, diet and senses too.",
				"🎭 TEMPERAMENT IS THE GENE THE CARD PRINTS — the voice&#8217;s character was keyed to the wrong gene entirely, so the most aggressive creatures in the game carried some of the meekest voices.",
				"🦇 NO CREATURE IS PINNED AT THE CEILING — about one in fifty voiced at the top of the range, all of them bats, where size and temperament stopped mattering and the call was simply shrill.",
				"✅ A SUCCESSFUL ACTION SOUNDS LIKE ONE — the confirming tone existed but was never once played, so the contrast the refusal tone depends on only had one side."
			]],
			["📖 Guide", ["📖 THE GUIDE CATCHES UP — the class topic covers experience earned through <em>care</em> and says where a union&#8217;s experience lands; breeding repeats it where a breeder will look; conquest explains that the meter is simulated rather than estimated; and Settings lists the <b>Creature voices</b> and <b>Battle sound</b> switches."]]
		]
	},
	{
		v: "1.8.3",
		title: "Clear Ground (source only)",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🗺 THE LESSON&#8217;S OWN SCREEN COMES FORWARD — on phones, Earth&#8217;s survey card sat on top of every board, so the two lessons that ask you to open the <b>Star Atlas</b> and the <b>Compendium</b> opened them underneath it, with no way through. Whatever the current lesson points at now takes the front, and the card steps back — except on the landing step, where the card is the thing you need.",
			"📱 THE DOCK IS NEVER BURIED — the survey card now stops above the bottom dock instead of running over the chips a lesson is pointing at.",
			"🪐 THE PLANETSIDE READS CLEARLY DURING TRAINING — the landing view was sliding under the guidance card, hiding its own heading. It now settles below the lesson, the way every other dialog does, so you can read both.",
			"⚙ SETTINGS OPENS OVER A LESSON — the guidance card was covering the Settings panel (the Audio tab especially) on almost every screen size. Settings you opened yourself now comes to the front.",
			"🧬 A UNION&#8217;S EXPERIENCE REACHES THE CHILD — both parents are consumed by breeding, and the experience was being paid to one of them, so it vanished the moment it was earned. The newborn now carries it: +2 for the union, +5 the first time you cross two particular species. (That bonus also only ever recognised &#8220;fauna with fauna&#8221; before, so it never meant what it said.)",
			"🔇 SOUND OFF MEANS OFF — switching Sound off left a world&#8217;s ambience still playing underneath. It stops immediately now.",
			"⚔ THE MATCHUP METER STOPS ROUNDING TO CERTAINTY — 160 simulated duels cannot tell 0% from a half-percent, so hopeless and near-certain matchups now read <b>&lt;1%</b> and <b>&gt;99%</b> instead of a flat 0% or 100%.",
			"♿ GUIDANCE BUTTONS NO LONGER CLAIM TO BE DISABLED — the <b>Breed</b> and <b>Feed</b> buttons that explain what you are missing are pressable and always were, but they told screen readers the opposite. They now announce what they actually do."
		]], ["📖 Guide", ["📖 THE GUIDE CATCHES UP — the class topic now covers experience earned through <em>care</em>, not victories alone, and says where a union&#8217;s experience lands; breeding repeats it where a breeder will look; conquest explains that the meter is simulated rather than estimated; and Settings lists the <b>Creature voices</b> and <b>Battle sound</b> switches."]]]
	},
	{
		v: "1.8.2",
		title: "Steady Hands",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🍽 THE MEAL AND THE UNION KEEP THEIR CARD — the feed and breed lessons were closing the specimen card and then asking you to open one again. The card stays open now (its own <b>Feed</b> and <b>Breed</b> buttons are the target), and if you close it, reopening any beast works just as well.",
			"❤ A CALMER HEART — the ❤ keeps its full-size touch target, but its glow and focus ring now hug the heart itself instead of drawing a large box across the HP bar.",
			"📊 THE HP BAR STAYS IN ITS TRACK — the fill can no longer paint past its own edge."
		]]]
	},
	{
		v: "1.8.1",
		title: "The Field Test",
		date: "July 2026",
		sections: [["✦ New Features & Systems", ["📋 A REAL QUEST LOG — the objective pill was one line with a bare &#8220;+1&#8221;. Tap it now and it unfolds into a compact log: your chapter goal and every accepted charter, each with live progress, and a way straight to the board. Tap again to fold it away."]], ["🐛 Bug Fixes", ["🪐 THE PLANETSIDE IS NEVER COVERED — during training the survey card could sit on top of the landing view, hiding the very payoff the lesson is about. The card now yields the screen whenever the Planetside is open.", "🗂 NOTHING OPENS ITSELF — the Compendium&#8217;s shelves and the Fabricator&#8217;s categories now start closed everywhere, training included; the two lessons that relied on a pre-opened drawer simply ask you to open one, which is a better lesson anyway."]]]
	},
	{
		v: "1.8.0",
		title: "The Connection",
		date: "July 2026",
		sections: [
			["✦ New Features & Systems", [
				"🗣 EVERY CREATURE HAS A VOICE — and it is truly its own. Earth&#8217;s animals sound like what they are: wolves roar, sparrows chirp, whales sing, rattlesnakes hiss, cicadas drone. Alien life speaks from its own genome. And when you <b>breed</b>, the child inherits BOTH parents&#8217; voices — a roarer crossed with a chirper carries each of them, and its descendants drift further into the unknown with every generation. No two bloodlines sound alike, and the same creature sounds identical for every explorer who holds its code.",
				"⚔ THE FIGHT HAS A SOUND — duels and conquests were nearly silent. Every blow now lands with weight, critical hits ring above the impact, and ability strikes carry their own voice.",
				"🪐 PLANETFALL ARRIVES — dropping onto a world opens with a chord, and the world itself murmurs underneath while you look out over it: wind on the tundra, surf on the ocean shelves, a low furnace on the magma seas.",
				"💡 THE GAME TELLS YOU WHAT TO DO NEXT — when nothing has moved for a while, the objective chip stops repeating your goal and offers a concrete next step you can actually take right now, and takes you there."
			]],
			["🧭 Gameplay", [
				"🚫 NO MORE DEAD TAPS — every &#8220;can&#8217;t&#8221; now names what is missing, why, and where to get it, with a button that takes you there. Breed and Feed wear their shortfall on the button before you press them, and a blocked action sounds different from a successful one.",
				"⚖ HONEST CONQUEST ODDS — the win estimate was a rough power comparison that could read 50% when the truth was zero, printed beside a warning that losing costs your champion forever. It now runs the real fight hundreds of times behind the scenes and reports what actually happens: Favored, Even, Dangerous or Overwhelming, with the reason why.",
				"🧬 CARE COUNTS — creatures now gain experience from a welcome meal, a taste discovered, a successful union, a first-of-its-kind lineage, a bout survived, a fight taken to the wire and a conquest lost, not from victories alone.",
				"🔮 BREEDING SHOWS ITS PROMISE — a mate&#8217;s row now previews the power band and the rarity a child could reach. Never the exact result: the reveal is the point.",
				"✦ WORLDS NAME THEIR MOST NOTABLE RESIDENT, and every creature card speaks its temperament."
			]],
			["🖱 UI Enhancements", ["🔊 TWO NEW SWITCHES — Settings › Audio can silence creature voices and battle sound independently. Both start on."]]
		]
	},
	{
		v: "1.7.21",
		title: "Right Values",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🌍 EARTH REALLY KEEPS ITS HISTORY — the last fix only held if you skipped training early. Training step 4 asks you to re-chart Earth, so on any completed run your original entry was quietly replaced by a fresh one. Your ☆ favourite, discovery date, badge and notes now merge back onto it every time, and they ride the save so a mid-training reload keeps them too.",
			"🧬 TRAINING NO LONGER LEAVES A MARK — an emergency restore could bake the practice lessons permanently into your record (hybrid counts, feeding and breeding tallies, even the heal step&#8217;s stat growth). It now restores the numbers you had before you started.",
			"❤ A REAL HEART, FOR FREE — the 44px heal target is back to costing zero layout: v1.7.20 bought it with ~26px of permanent header height on every device.",
			"🛟 AN HONEST FAILURE MESSAGE — if a restore ever cannot complete, the game no longer points you toward the button that erases everything.",
			"⏰ CLOCK SANITY, FINAL FORM — weekly charters are no longer &#8220;repaired&#8221; at startup, which is exactly when a device clock is least trustworthy; a lagging clock can no longer wipe a week you were part-way through.",
			"🎓 THE LESSON CARD KEEPS ITS PLACE — the spotlight ring no longer outranks the card that explains it, and the ? popover is reachable during training again."
		]]]
	},
	{
		v: "1.7.20",
		title: "The Proof",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🛟 THE RELOAD PATH, PROVEN — the mid-training reload restore is finally whole: the genome sanitizer it needed is now shared across the codebase, the snapshot survives a failure anywhere in its own construction, and recovery restores your Compendium before it says a word. If it ever cannot, it now tells you the truth instead of a comforting lie.",
			"🌍 EARTH KEEPS ITS HISTORY — restarting training restores your Atlas entry for Earth exactly as it was, ☆ favourite and all, instead of rebuilding it as a fresh stub.",
			"⏰ CLOCKS CAN&#8217;T TOUCH YOUR CHARTERS — a lagging device clock no longer rewinds your weekly slate (which both wiped honest progress and let the week be re-rolled).",
			"⌨ FOCUS AND KEYS — closing a dialog over an open survey card now returns your focus properly, the star map accepts its advertised arrow/Enter/zoom keys under a screen reader again, and the name field holds the 16px floor that stops iPad Safari zooming.",
			"❤ A REAL HEAL TARGET — the heart now measures a true 44×44 on every device, and the training spotlight no longer draws over the lesson card that explains it."
		]]]
	},
	{
		v: "1.7.19",
		title: "Trust, Verified",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🛟 THE RELOAD PATH, TRULY SAFE — round four of testing caught three of our fixes placed where they couldn&#8217;t run. The worst let a mid-training reload wipe the Compendium; the restart snapshot now restores through any reload, proven by a new automated journey that walks that exact path on every release.",
			"⚔ THE TIE COIN ACTUALLY FLIPS — the mirror-match fairness fix read a field that didn&#8217;t exist; exact ties now genuinely break on the seeded coin.",
			"📱 THE TABLET TARGETS ACTUALLY GROW — the 44px rules had landed in the wrong stylesheet and lost the cascade; they now apply, along with the titan-title clamp and landscape caps that shared the defect.",
			"🎓 RESTART POLISH — restarting training no longer double-counts your hybrids, falsely pops achievements, rebuilds Earth&#8217;s Atlas entry as a stub (your ☆ and history survive), or hides the lesson spotlight behind the survey card.",
			"🧮 SMALL TRUTHS — the 900th First Arrival pays again, a forward clock jump can&#8217;t freeze the weekly charters, the last two low-contrast texts stepped up, Text Size reaches the settings rows, and the star map introduces itself without hijacking screen-reader browse mode."
		]]]
	},
	{
		v: "1.7.18",
		title: "The Honest Frontier",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🛟 RESTART TRAINING KEEPS ITS PROMISE — restarting the Field Training now truly leaves your expedition untouched: your Compendium, cargo, exceptional stock, items and every equipped piece come back exactly as they were, even if you reload mid-training. And a restarted training no longer dead-ends at the Atlas lesson.",
			"⚖ THE ARENA TELLS THE TRUTH — burning abilities no longer tick twice per round (Cinderburn was winning 98% of fights through armor), exact-HP ties no longer secretly favor you, defensive builds can actually win (the damage floor now respects mitigation instead of erasing it), and the battle log names the real first mover. All 17 fighting styles and all 55 rolled abilities are measured inside fair bands now.",
			"🥋 26 CLASSES WAKE UP — Brawler, Ronin, Psion, Chaos Mage, Eldritch Horror and 21 others were silently missing their innate arts due to two misspelled ability names; every class now grants what its description promises.",
			"⏰ THE CLOCK CAN&#8217;T PAY YOU — backward clock changes no longer refund mining reserves, re-roll the weekly charter slate, or (past 900 systems) turn First Arrival into an endless stardust faucet.",
			"👑 COSMIC GEAR RULES ITS TIER — the Protomatter Carapace, Coronal Aegis and Dark Matter Bore were weaker than ordinary tier-2 gear; all three now stand above the ladder they crown."
		]], ["♿ Accessibility & Touch", [
			"📱 THE TABLET BAND GETS REAL TARGETS — Surface Pro and iPad Pro sizes now receive full 44px touch targets, the 16px input floor and safe-area clearance; the ❤ heal control grew from 12px to a real fingertip target.",
			"⌨ FOCUS COMES HOME — closing any dialog with Escape returns your keyboard focus where it was; achievement and stat folds are keyboard-reachable; the star map introduces itself to assistive technology instead of hiding from it.",
			"🔎 SMALL FIXES WITH BIG READS — dimmed text everywhere steps up to readable contrast, the training card scrolls instead of pushing its button off-screen and honors your Text Size, titan titles stop truncating, Atlas rows wrap instead of crushing names, and toasts stop blocking the survey card."
		]]]
	},
	{
		v: "1.7.17",
		title: "Front and Center",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🎓 LESSONS SHOW THEIR WORK — during training the survey card and lesson surfaces now sit above the boards and dock instead of behind them (Earth&#8217;s card was buried on the landing step), and the training dialogue only takes the very top on the one step whose full-screen sheet demanded it.", "🔎 A SLIMMER SEARCH — the phone search pill trades some width and padding for a tidier top bar; the 16px type that keeps iOS from zooming stays."]]]
	},
	{
		v: "1.7.16",
		title: "Clean Slate",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🗂 TRAINING TIDIES UP AFTER ITSELF — the lessons open the shelf they teach (Compendium, Fabricator), but those shelves stayed expanded after graduation; a fresh veteran now opens both to the tidy closed index.",
			"🎓 THE NAMEPLATE LESSON STAYS ON TOP — the character sheet was covering the training card (and its Got It button) on phones, making the step look like it vanished; during training the card now outranks every board.",
			"⛳ EVERY OBJECTIVE WEARS ITS COUNT — one-shot charters on the dock chip showed no progress digits and read like the old dead pill; the tracker now always shows 0 / 1 → 1 / 1."
		]]]
	},
	{
		v: "1.7.15",
		title: "The Field Manual",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", ["📖 THE GUIDE CATCHES UP WITH v1.7 — the Star Atlas topic teaches the 🗺 Chart view, auto-charting and the in-list undo; the survey topic covers worlds of renown, on-the-ground vein grades and ⬆ Leave this world; the Charters topic explains the live objective chip and the always-yours mainline. Search keywords updated to match."]]]
	},
	{
		v: "1.7.14",
		title: "The Outfitter",
		date: "July 2026",
		sections: [["✦ New Features & Systems", ["🛠 EVERY PIECE OF GEAR, HAND-PAINTED — all 41 gear pieces now wear bespoke painterly masters: the rig line grows from a worn pick to a plasma lance, the five suits are true identities on one chassis, four necklaces you can tell apart at a glance, and every Signature relic tells its Beacon&#8217;s story. The seven cosmic pieces look like nothing else in the hold — a world being born inside the Genesis Locket, clock hands that disagree about now, a drill bit that is an absence bending light.", "🚀 THE HULL REMEMBERS EVERY REFIT — the survey-fleet era now marks the ship itself with a gold registry band and navigation strobes, completing the ladder from bare scout to luminous intergalactic craft."]], ["🐛 Bug Fixes", ["🤫 DISCOVERIES WAIT THEIR TURN — a new-species reveal no longer pops over an open menu or dialog (it could steal your Escape key); it waits quietly and appears the moment you close what you were doing."]]]
	},
	{
		v: "1.7.13",
		title: "The Cartographer",
		date: "July 2026",
		sections: [
			["✦ New Features & Systems", [
				"🗺 THE STAR CHART — your Atlas gains a second view: every charted place painted across the universe on one deep-space chart, clustered by galaxy, favorites starred, home marked, a quiet crosshair where you stand. Tap any light to travel there. Your filters apply to the chart too.",
				"🏷 WORLDS OF RENOWN — the rarest worlds now carry names worth saying twice: &#8220;the Shrouded&#8221;, &#8220;the Ringed Court&#8221;, &#8220;the Sky Forever&#8221;. Rare near home, commoner out in the deep field where legends live. The same world bears the same name for every explorer, forever.",
				"⛏ VEINS WORTH READING — stand on a world and its mineral veins now show their grade for that ground; Primordial worlds enrich every seam one step."
			]],
			["⚖ Balancing", ["⚔ THE ARENA LEVELED — two fighting styles had quietly drifted stronger than the field (Smite and Roulette); both are back inside the fair band, measured across thousands of simulated duels. Every archetype now wins between 42% and 58% against the field.", "🏆 NO DEAD RELICS — the Graven Aegis and the Prismatic Lathe were weaker than ordinary gear in their own slots; both are now true sidegrades with their own identity (the Aegis holds the protection line with steadier landings; the Lathe trades peak yield for the best rich-strike luck in the game)."]],
			["🐛 Bug Fixes", ["⛏ THE DOUBLE VEIN — metal and lava worlds could list the same mineral twice on their survey card; every vein now appears once."]]
		]
	},
	{
		v: "1.7.12",
		title: "Quiet Gold",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", ["🥇 THE PRIMARY SPEAKS SOFTLY — the survey card&#8217;s Land button trades its solid gold slab for a gold outline and gold lettering on the shared dark pill. Still unmistakably the next step; no longer shouting over the card."]]]
	},
	{
		v: "1.7.11",
		title: "The Waypoint",
		date: "July 2026",
		sections: [["✦ New Features & Systems", ["⛳ THE OBJECTIVE CHIP — the pill under the dock is now a real quest tracker: it always carries the thing you&#8217;re doing <i>right now</i> with live progress (&#8220;⬆ Mine Sol&#8217;s dead worlds · 3 / 8&#8221;), pulses when your count moves, follows your accepted charter first and the story chapter otherwise, and opens the board for details."]], ["🖱 UI Enhancements", ["📖 THE MAINLINE READS AS STORY — the chapter pinned atop the Charters board no longer looks like a stack of pre-accepted quests: it wears its own &#8220;The Ascent — your mainline&#8221; framing with slim progress bars, clearly apart from the optional charters (the ones with Accept buttons) below.", "🗂 THE BINDER MOVES TO RECORDS — type collections, Sets and the Fifty Paragons now live where they belong: a tab on the 🏆 Records board, beside your trophies. The Compendium is purely your living catalogue."]]]
	},
	{
		v: "1.7.10",
		title: "The Listening Post",
		date: "July 2026",
		sections: [
			["🖱 UI Enhancements", [
				"🔎 SEARCH TAKES THE STAGE — results now drop directly beneath the search box, and everything else falls into shadow while you type, so the answer is the one lit thing on screen.",
				"🗂 TIDY SHELVES EVERYWHERE — the Compendium and the Shipyard&#8217;s Fabricator now open with every shelf and category folded closed; whatever you expand stays expanded for the session. (Training still lays open the shelf a lesson needs.)",
				"📖 THE COMPENDIUM CLEARS ITS OWN NAME — the board no longer rides up over the Compendium chip that opened it."
			]],
			["🧭 Gameplay", ["🎓 LESSONS CLEAR THE STAGE — the feed, breed and heal lessons now put away the specimen card left standing by the previous lesson, so &#8220;Open a beast&#8221; is true when you read it and the ❤ heart isn&#8217;t hiding behind a card.", "🖼 NO DEAD BUTTONS — the Planetside&#8217;s ⛶ Full screen pill no longer shows during training, where zoom is deliberately paused so the tap can continue the lesson."]],
			["🔧 Under the Hood", ["🧠 A LIGHTER MEMORY — species lists, search results and roster images now use small thumbnails instead of retaining every full-size portrait; long collecting sessions on phones hold dramatically less memory with no visual change on cards, duels or reveals."]]
		]
	},
	{
		v: "1.7.9",
		title: "The Courtesy Pass",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", [
			"⬆ LEAVE THIS WORLD — every world you&#8217;ve stood on now carries an explicit button that pulls the camera back to the system overview. No gesture knowledge required; one press and the whole sky returns.",
			"🖼 PLANETSIDE ANSWERS INSTANTLY — the landing panorama no longer ignores quick taps (an anti-ghost timer used to eat everything in its first half-second); real taps act immediately, and Escape closes or un-zooms it like everything else.",
			"↺ THE RESET BUTTON KEEPS ITS DISTANCE — a clear gap and quieter styling separate &#8220;erase everything&#8221; from the harmless Restart-Training row above it. The two-step confirm still stands guard."
		]], ["♿ Accessibility", [
			"🔇 TRUE MODAL SILENCE — while the Guide, Prime Codex or a duel is up, the world behind the glass is now genuinely unreachable to screen readers and stray taps, and it wakes back up the moment the dialog closes.",
			"🗒 THE JOURNAL READS ALOUD — the Expedition journal announces itself as a proper list, one landing per row, to assistive technology.",
			"🏷 NOTIFICATIONS SPEAK WITH ONE VOICE — every notification title now follows the same casing, so nothing reads like it came from a different game."
		]]]
	},
	{
		v: "1.7.8",
		title: "The Courier",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🧭 TRAINING STEP 6, UNSTUCK — Earth&#8217;s survey card could vanish between the Atlas lesson and the landing lesson with no way to bring it back (opening the Atlas, travelling from its Earth row, or a keyboard Escape could each close it). The card now rides safely into the landing step, tapping Earth always reopens it, and keyboard shortcuts respect the lesson like taps do.", "⬆ UPDATES ACTUALLY ARRIVE — the game now checks for a newer build the moment it starts and quietly swaps a stale copy for the live one before play begins (your expedition is untouched — saves live on your device, not in the page). The update pill&#8217;s refresh now truly fetches the new build instead of re-serving the cached one."]]]
	},
	{
		v: "1.7.7",
		title: "The Open Door",
		date: "July 2026",
		sections: [["✦ New Features & Systems", [
			"⌨ THE BOARD ANSWERS THE KEYBOARD — focus the star map and the arrow keys cycle every pickable body nearest-first (a gold dashed ring marks your target), <b>Enter surveys it</b> with full credit, +/− zoom on it, Escape releases. The universe is no longer mouse-only.",
			"🗣 THE GAME SPEAKS — every toast, target change and survey is announced to assistive technology through a live region; boards move focus in when they open and hand it back when they close; Tab stays inside open dialogs; search results walk with ↑/↓ and commit on Enter.",
			"⛳ PLANETFALL CHARTS ITSELF — every world you stand on joins your Star Atlas automatically (the + button stays for orbital bookmarks), and a new ⛳ Visited filter keeps your hand-picked favorites uncrowded. No more losing a world because you forgot to file paperwork."
		]]]
	},
	{
		v: "1.7.6",
		title: "The Regression Round",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"🛑 A CRASH, CAUGHT — zooming out of a system with a survey card open could throw an error every frame; the card now closes cleanly when its star leaves the view.",
			"🗂 ONE SURFACE AT A TIME — opening any board now puts the survey card away first (boards were stacking on top of it), tapping the card never closes a board, Escape reaches the card too, and on phones the card stops above the dock instead of tangling with it.",
			"🌍 THE WORLD-NAME FIX ACTUALLY SHOWS — the Planetside header&#8217;s lowercase landing region was being re-capitalized by styling; &#8220;PLANETFALL — MERCURY · carbon world&#8221; now reads as intended.",
			"🔔 TOASTS BEHAVE EVERYWHERE — they no longer hide behind the training card (the &#8220;expedition saved&#8221; note now greets you at graduation), short laptop screens get a left-side lane clear of Records, and tablets show one at a time.",
			"🏷 ONE TITLE PER BOARD — Records and Notifications stopped saying their names twice, and every board now carries its title on desktop as well as phones."
		]], ["🖱 UI Enhancements", [
			"🛠 HONEST SHORTFALLS — an unaffordable recipe lists everything it&#8217;s missing (&#8220;Need 3× Iron + 1× Chromium&#8221;), the buttons can be hovered and tabbed for details, and the Fabricator opens with your <b>closest build</b> and how to close the gap.",
			"📜 DEEDS ALREADY DONE SAY SO — a charter you&#8217;ve already fulfilled shows <b>Claim ✓</b> instead of asking you to do it again, and accepting it pays on the spot.",
			"🗺 UNDO WHERE YOU NEED IT — removing an Atlas entry offers its undo right in the list, under your finger.",
			"🔎 SMALL TYPE, RAISED — the rarity ladder, titan guidance lines, dock captions and the control hint (which now wraps instead of cutting off &#8220;double-tap zooms&#8221;) all stepped up in size or contrast."
		]]]
	},
	{
		v: "1.7.5",
		title: "Clear Air",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", ["📏 ROOM TO BREATHE — the control hint pill, the caption above it, and the training card each step cleanly above the dock instead of brushing the chip tops."]]]
	},
	{
		v: "1.7.4",
		title: "The Quiet Dock",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", ["🏷 CAPTIONS THAT GRADUATE — the dock names its boards while you&#8217;re in Field Training; complete it and the labels retire, leaving the clean icon dock (they return if you restart training from ⚙ Settings). Prime Codex keeps its count either way."]]]
	},
	{
		v: "1.7.3",
		title: "The Tablet Tier",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", [
			"📐 TABLETS GET THEIR OWN HOME — iPads, Surfaces and everything up to 900px now use the dock-and-sheet layout built for touch: boards open as titled, centered sheets above the dock with the world dimmed behind them, instead of desktop furniture squeezed to phone width.",
			"🏷 THE DOCK SPEAKS — every board chip carries its name under its icon (no more guessing what the scroll means), and every chip, circle and control on touch screens holds the 44px finger floor — Accept buttons, Atlas stars, settings chips included.",
			"🖼 BIGGER SKIES — the Planetside vista breathes on tablets, and panels on very large monitors finally grow beyond phone-column width."
		]], ["🎮 Gameplay", ["🌀 THE STELLAR SIGNATURE — the Wind Signature is renamed: Zephyrmaw, the Stellar Squall, was always the titan of the <b>solar</b> wind, and now its Signature says so. Air keeps the skies; Stellar takes the stars. Claimed trophies keep their standing — only the name changes."]]]
	},
	{
		v: "1.7.2",
		title: "The Field Patch",
		date: "July 2026",
		sections: [
			["🖱 UI Enhancements", [
				"📜 THE TITANS SPEAK — every Prime Codex titan now tells its own story (Terrakoth stands where the crust runs richest; Sylphrend rides the cloud decks…), the guidance lines wrap instead of cutting mid-word, and locked rows read clearly.",
				"🔔 TOASTS KNOW THEIR PLACE — on phones they dock at the top, show one at a time, and step aside entirely while a board is open (everything still lands in the 🔔 tray). And they&#8217;re finally <b>tappable</b>: the › deep links work now.",
				"🛬 LAND WEARS THE GOLD — the survey card&#8217;s primary action stands out, every hint names the same landing verb, and the Sun is introduced as Sol, not &#8220;a sun-like star&#8221;.",
				"🛠 THE FABRICATOR ALWAYS HAS A VERB — unaffordable recipes show a disabled Craft button naming exactly what&#8217;s missing (&#8220;Need 3× Iron&#8221;), and every group shows its craftable count.",
				"⎋ ESCAPE CLOSES EVERYTHING — one press dismisses whichever board or dialog is on top, on every panel, even (safely) during training."
			]],
			["🎮 Gameplay", [
				"🎓 TRAINING IS REVERSIBLE — skipping now leads with &#8220;Keep Training&#8221; in gold, plain words explain you lose nothing, and Settings › Gameplay can restart the 21 lessons any time.",
				"📖 A FRESH EXPEDITION SKIPS THE CHANGELOG — release notes greet returning explorers only; new pilots go straight to the stars.",
				"🖱 PLANETS ARE EASIER TO CATCH — mouse clicks get the same forgiving pick radius touch always had, and an assisted landing announces itself."
			]],
			["🐛 Bug Fixes", [
				"🗒 the Expedition Journal reads &#8220;Mercury · Carbon world · 7/26&#8221; instead of &#8220;Mercurycarbon&#8221;, and the Planetside header names the world before its landing region.",
				"☄ a comet&#8217;s tail no longer renders as a giant grey beam at planet zoom.",
				"🏷 the ? button opens the Guide directly; the Star Atlas ✕ explains itself and removal can be undone; clearing notifications asks first; the notification badge clears when you read the tray.",
				"📱 the top bar clears the Dynamic Island, panels keep their close buttons out of the status strip, and the name gate explains itself if a name can&#8217;t be used."
			]]
		]
	},
	{
		v: "1.7.1",
		title: "The Pocket Patch",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["📱 THE PHONE SCREEN FITS AGAIN — on iPhone, typing your name (or searching) could make Safari zoom the whole page and never let go: your nameplate and HP slid off the top, panels spilled past the edges, the Shipyard&#8217;s ✕ went unreachable, and taps on planets landed beside them (training&#8217;s &#8220;tap Earth&#8221; included). The viewport is locked again and text fields no longer trigger the zoom. Pinch-zoom for accessibility still works — iOS never gives that up."]]]
	},
	{
		v: "1.7.0",
		title: "The Forge",
		date: "July 2026",
		sections: [
			["✦ New Features & Systems", [
				"💎 ONE RARITY LADDER FOR EVERYTHING — ten tiers, Common to Transcendent, now grade every creature, plant, world, star, material and piece of gear the same way. And rarity is a <b>discovery</b>: a world hides its grade until you land, a star until you survey it — the reveal grows grander the rarer the find.",
				"⛏ THE FULL MATERIALS ECONOMY — 47 materials across five families (structural, volatiles, precious, exotic, <b>cosmic</b>), each with its own painterly icon, family-grouped in the hold. Exceptional ✦ units ride your ordinary stacks and forge finer gear.",
				"🌌 THE SEVEN COSMICS — Protomatter, Primordial Ice, Void Essence, Chronal Shard, Dark Matter seam only the deepest worlds; Stellar Plasma and Coronium are <b>skimmed from the coronas of stars</b> (☀ Skim, once your Jump Drive flies). All seven anchor endgame gear, and the Apex Court crowns await their collectors.",
				"🛠 THE FORGE — gear got the ARPG treatment: item windows with rarity frames and affix panels, equip and salvage side by side (a confirm guard if you want it, Salvage All for the junk), and the hold reborn as three tabs — Materials, Craftables, Gear.",
				"🛟 SAVE GUARDIAN — your save now keeps a last-known-good backup; if the primary is ever damaged, the game restores it automatically instead of starting you over."
			]],
			["🖱 UI Enhancements", [
				"🧭 THE BRIDGE, REBUILT — ✦ Prime Codex holds the top center; 📜 Charters and 📖 Compendium stack the left rail, 🌍 Star Atlas and 🛠 Shipyard the right; 🏆 🔔 ? ⚙ sit as circles in the corner. On phones everything docks into two even rows at your thumbs, and every panel opens as a sheet above them.",
				"✨ QUIET SIGNALS — the open board glows gold instead of growing, status dots and number badges are retired (only Prime keeps its 0/9), and the HP bar reads like a gauge: quarter ticks, a lit edge, a bright tip.",
				"🎨 PANEL TINT — a Graphics slider sets how solid the glass panels pour; the character sheet fits phones so your inventory surfaces without a scroll."
			]],
			["🎮 Gameplay", [
				"🎓 TRAINING, GRADUATED — Field Training is 21 lessons and now ends the way an expedition begins: <b>you</b> open the 📜 board and accept your first charter. Nothing is ever accepted for you, and the ? Guide takes over from there.",
				"🛬 EVERY DESCENT, A NEW FACE — the region you touch down in re-rolls on every landing, so returning to a world can find its deserts, jungles, or open seas.",
				"🌊 THE DEEP IS ALIVE — abyssal dives and reef descents now swim with the world&#8217;s <b>own</b> aquatic species, and every vista plant is the true species from your Compendium — a desert&#8217;s cacti finally look like cacti."
			]],
			["⚖ Balancing", [
				"⚔ FAIR MIRRORS — when two perfectly matched fighters meet, the first strike now falls by a fair seeded coin instead of always favoring the challenger.",
				"🧬 BLOODLINES WITH A HORIZON — breeding and feeding still grow a champion without limit in spirit, but the deepest grinds now approach a ceiling (~2.5× a Titan) instead of dwarfing every fight in the game. No real bloodline in the wild loses a single point.",
				"🏋 POWER IS EARNED, NOT WORN — an item&#8217;s rarity is its story; its strength comes from tier and craftsmanship."
			]],
			["🐛 Bug Fixes", [
				"📌 a pinned recipe&#8217;s tracker chip no longer sits on top of the Compendium button.",
				"🎓 restarting training after accepting a charter can no longer strand the final lesson.",
				"🔵 veterans updating no longer see every long-catalogued species wearing the blue new-entry dot.",
				"🛠 the Fabricator now says where every cosmic material is found, like the item cards always did."
			]],
			["🔧 Under the Hood", [
				"🔒 a full security hardening pass over saved data and share codes (two independent external reviews, every finding closed).",
				"📴 the game&#8217;s fonts now live inside the game — no outside requests, fully offline.",
				"🔋 hidden tabs stop rendering entirely; portrait memory is budgeted to the device; browser zoom is re-enabled.",
				"🧪 releases now gate themselves: the deploy refuses to ship unless the full test battery passes."
			]]
		]
	},
	{
		v: "1.6.4",
		title: "The Landing Fix",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🛬 LANDING TRAINING UNSTUCK — for returning pilots who had already set foot on Earth, the Land step could light up but never complete (the descent registered, yet training didn&#8217;t move on). It now always advances. New pilots were never affected."]]]
	},
	{
		v: "1.6.3",
		title: "Card & Training Polish",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", ["🃏 SPECIMEN CARD, TIDIED — the action buttons are reordered (Breed · Feed · Duel · Scout · Code), and Rename moved to a small ✎ icon beside the name so the row stays clean.", "🧭 TRAINING OUT OF THE WAY — during the Compendium lesson the training card sits at the top, so the creature list below stays scrollable and reachable."]]]
	},
	{
		v: "1.6.2",
		title: "Mobile Polish",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["📱 THE BEGIN BUTTON STAYS IN VIEW — on short phones the intro&#8217;s name field and Begin button could sit below the bottom of the screen; they&#8217;re now pinned in place while the story scrolls above them.", "🔢 CHARTER COUNTERS DON&#8217;T SPLIT — a charter&#8217;s progress count (like 0 / 2) no longer wraps onto two lines on narrow screens."]]]
	},
	{
		v: "1.6.1",
		title: "The Binder Patch",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", [
			"📖 THE BINDER OPENS AGAIN — the Compendium&#8217;s Binder view hit an error and refused to open; it works again.",
			"🛡 SAVE INTEGRITY — loaded saves now clamp a creature&#8217;s bloodline values, so a tampered save can&#8217;t forge an impossibly powerful creature (or share one).",
			"🏴 ONE WORLD, ONE REWARD — a rapid double-tap on a conquest can no longer pay its Stardust or count its win more than once.",
			"🧬 BREEDING GUARD — the breeding core now refuses already-consumed parents, so a stray double-tap can&#8217;t spawn a phantom child."
		]]]
	},
	{
		v: "1.6",
		title: "The Living Frontier",
		date: "July 2026",
		sections: [
			["✨ New Features &amp; Systems", [
				"🎨 THE UNIVERSE, REPAINTED — every living thing is hand-painted now. The whole bestiary was redrawn by the game&#8217;s painterly canvas engine: no two clades share a silhouette, and a creature&#8217;s body tells you what it is at a glance.",
				"🌍 A PAINTED EARTH — all 631 of Earth&#8217;s real animals and 334 of its plants wear class-true forms — mammals, birds, fish, reptiles, amphibians, insects, arachnids, crustaceans, cephalopods, primates, bats, corals — each with the anatomy, eyes, and stance of its kind, its true name on the card.",
				"👽 ALIEN LIFE, TRULY ALIEN — procedural creatures no longer share one template. Their genes draw real anatomy now: beaked, mandibled, frilled, tusked, or tendril-fringed heads; one to eight eyes; whip, finned, plumed, or stinger tails; two to eight limbs; and structural skins (scaled, furred, feathered, chitinous, plated, warty, translucent, crystalline). An ocean-dwelling species keeps its signature anatomy as a swimmer instead of collapsing into a generic fish.",
				"🏞 LANDING VISTAS — every world paints its biome as a living scene with its wildlife in habitat: reefs and abyssal deeps, jungle canopies, savannas, dunes, glaciers, ash wastes. Gas giants show native life drifting in the clouds; barren and toxic worlds stay honestly empty.",
				"🧬 THE LINEAGE CARD — bred hybrids carry an expandable family-tree lookup: &#8220;Bred from Lion (62% of traits) and Wolf (38%),&#8221; with a per-trait breakdown of where each feature came from (Body plan &#8592; Lion, Tail &#8592; Wolf). Cross away from Earth and the bloodline visibly drifts — alien features creeping onto the familiar frame.",
				"🏆 CHAMPION CODES — copy a 🏆 Champion code for any leveled creature and send it to a friend; they face it at its full strength in an exhibition duel. Same code, same creature, anywhere.",
				"✦ THE LOOT CHASE BEGINS — conquering a world can imbue a worn piece of gear with a seeded bonus stat (✦ +X%), and the deeper the world, the stronger the roll. Your equipment grows a character of its own.",
				"🌱 BIOSPHERE YIELD — a world&#8217;s wildlife is finite. Each biosphere offers only so many capture attempts before it is worked out, so where you hunt, and how, matters."
			]],
			["🖱 UI Enhancements", ["🃏 ITEM CARDS — tap any item to open a card with its full stats and effects, and equip it straight from there.", "🐾 PORTRAITS WITH DEPTH — Compendium and survey portraits use the painterly engine end to end, so a specimen looks the same on its card, in its vista, and on the map."]],
			["🐾 Gameplay", ["🦋 CLASS ROUTING, HARDENED — a species is drawn as what it biologically is: a Butterflyfish is a fish, a Peacock Butterfly an insect, a Peacock a bird. Hundreds of name collisions were resolved so the catalogue reads true."]],
			["🔧 Under the Hood", ["🎨 ONE PAINTER FOR EVERYTHING — the entire visual layer runs through a single deterministic art engine; the same seed paints the same life on every device, and it ships without touching the universe&#8217;s determinism — share codes and cross-device parity are unchanged."]]
		]
	},
	{
		v: "1.5.2c",
		title: "The Titan Hunt",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", [
				"🔮 THE ELEMENTAL TITAN HUNT — the Prime Codex is nine elements now, each guarded by a unique, named titan (Terrakoth of Earth, Pyraxis of Fire, Nullreth of the Void…). Landing reveals whether a titan stands on this world; send your strongest champions to fell it and claim the element. The basics wait near home, Electric and Poison at mid range, Void and Prism far past the Deep Field.",
				"🐾 TAME &amp; SCAVENGE — life is no longer catalogued on sight. Landing surveys the biosphere; then 🐾 Tame a beast or 🌿 Scavenge a growth to enter it in your Compendium. Odds fall with rarity and rise with crafted gear.",
				"🌍 THE CRADLE — Earth&#8217;s real animals and plants are your first catchable roster: named creatures clamped to starter grades and fighting at starter strength, their true names carried into the Compendium.",
				"✦ MASTERING THE UNIVERSE — the story is retold end to end. The Prime Codex is the master survey; fell each element&#8217;s titan to master it; master all nine to open the Celestial Frontier. You cannot finish the infinite, only master it. (The old Pathfinder and beacon lore is retired.)",
				"🛠 THE SHIPYARD — new right-rail screen for the ship: ship portrait that gains each built system, with the Fabricator and Research Bench beneath, recipes grouped by category. The character screen now holds only the explorer: figure, stats, and cargo hold.",
				"🏆 THE RECORDS BOARD — rarity ladder and all achievement shelves moved from the character sheet into their own right-rail panel.",
				"🛬 TRAINING LEARNS TO LAND — new Field Training lesson: press Land on Earth&#8217;s card (Earth never waves off) to open Planetside. Training is now 20 lessons covering chart, land, catalogue, feed, breed, duel, heal, and forge.",
				"⛏ THE DRILLS RUN THEMSELVES — Mine is a toggle: one press starts continuous mining; press again to stop, or mining ends when the vein runs dry.",
				"🗺 THE SOL TOUR — five new starter charters covering the home system: first landings on Mercury, Mars, the gas giants, and the outer system, plus crafting a working component. Each pays on completion; finishing the tour opens the weekly board.",
				"🎒 THE PACK ON YOUR BACK — the Module socket is now worn gear (ship systems live at the Shipyard); slotting a pack module adds a visible row of cargo slots per tier."
			]],
			["🖱 UI Enhancements", [
				"🎒 THE HOLD IS A BAG — inventory is a Diablo-style slot grid under the portrait, empty slots included, so remaining capacity is always visible.",
				"📊 STAT BARS ON THE SHEET — the explorer&#8217;s five battle stats use the same bar rendering as specimen cards.",
				"⬆ GATED STAR CHARTERS — foreign-galaxy stars beyond your ring now name the required build (the Intergalactic Drive) on their charter row, from any ring.",
				"🎽 EQUIP PICKER — opens <b>below</b> its socket (socket stays visible and tappable) and carries a ✕; an empty socket&#8217;s hint is no longer a dead end.",
				"🔤 ONE FOLD LANGUAGE — every collapsible header uses the world card&#8217;s expand/close pill (replacing arrow glyphs); the Compendium opens with its first occupied shelf expanded; battle stats render as plain bars (definitions live in the Guide); Mega Fauna matches its shelf-mates; specimen-card verbs sit in a grid.",
				"🔭 NAMES ARE NAMES — map labels drop parentheses and glyphs: Pluto, comets, and moons show bare names; type details live on the card. Ring systems no longer clip square at the sprite edge on wide-band worlds.",
				"✕ EVERY PANEL&#8217;S CLOSE — stays pinned to the top corner while the list beneath it scrolls.",
				"🧭 CHARTERS MOVE TO THE LEFT RAIL — the Charters board (and the Chapters spine atop it) take the left rail; the Prime Codex, your endgame, moves to the top-right gold pill.",
				"🐾 THE LIFE FORMS MENU — a surveyed world&#8217;s roster now folds behind the card&#8217;s expand/close pill, with its 🐾 Tame and 🌿 Scavenge actions grouped inside, beside the creatures they draw from.",
				"✕ THE SETTINGS CLOSE, CLEANED — the menu&#8217;s ✕ is a clean corner glyph now, not a filled box over the panel.",
				"🎨 THE NAMEPLATE MENU — Settings now has a <b>Nameplate</b> row that opens one editor for your name and your plate colour; the colour picker moved here from the character sheet, and the old redundant Explorer-name row is gone.",
				"⚙ GRAPHICS TOOLTIPS — the Graphics toggles (visual effects, screen shake) carry tooltips now."
			]],
			["🐛 Bug Fixes", [
				"🪐 THE MAP HOLDS WHILE YOU VISIT — landing on (or zooming in to) a world now freezes its orbit, so the planet stays framed under the camera and its survey card stops drifting across the screen; the sky resumes turning when you pull back out.",
				"🛬 PLANETSIDE HOLDS IN TRAINING — the landing-lesson vista no longer closes on its own; it waits for your tap to continue, exactly like live play.",
				"✎ LONG NAMES STAY IN THE PLATE — a long explorer name is trimmed with an ellipsis in the nameplate and on the character sheet instead of spilling out of the box.",
				"⚒ THE FORGE READS YOUR HOLD — the Fabricator&#8217;s craft buttons re-check what you can afford the moment new ore lands, so a recipe you can suddenly build lights up without reopening the Shipyard.",
				"⛏ DRILL CHARTERS COUNT AGAIN — mining charters tally each pull the drills make.",
				"🛠 SHIPYARD ALWAYS ON THE RAIL — the 🛠 button no longer disappears after training; the Shipyard is always one tap away."
			]],
			["⚖ Balancing", ["🩸 MERCY, SHARPENED — the crawl-home mercy now applies only to bloodlines <b>you bred</b> (wild-born crossbreeds die on defeat), and fires once per mend: a champion fielded while still Critical does not crawl home twice. The same rule closes a reroll seam found in the audit — every retry past the first requires real mending.", "🤝 WARY FIRST CONTACT — now follows the wave-off law: its automatic landing damage can take you to the brink but never kill. Deep-ring receptions still hit hard."]]
		]
	},
	{
		v: "1.5.1",
		title: "The Mirror Polish",
		date: "July 2026",
		sections: [
			["🖱 UI Enhancements", [
				"🧍 THE PORTRAIT, REPAINTED — explorer figure redrawn with true proportions, jointed limbs, and a lit face behind the visor, staged on a landing pad under a ringed world.",
				"🎽 THE PICKER COMES TO YOUR THUMB — tapping a socket opens the gear list beside it instead of below the figure.",
				"🗂 ONE CARD GRAMMAR EVERYWHERE — specimen-card verbs moved above the stats (matching world cards); the character sheet&#8217;s nameplate colors, rarity ladder, and achievement shelves folded into Collection and Achievements groups. The left column is now four lines and three folds.",
				"📱 PHONES BREATHE — the character screen stacks paperdoll, cargo, then stats on phones, putting the Fabricator directly below the sockets.",
				"⬆ THE CHARTER SPEAKS ON THE CARD — out-of-ring stars and galaxies state the gate and the required build on their survey card (&#8220;a view for now — the ⚡ Jump Drive opens this sky&#8221;). Viewing remains free everywhere."
			]],
			["✨ New Features & Systems", [
				"🛠 TRAINING LEARNS THE FORGE — nineteenth Field Training lesson: craft an Iron Plate at the real Fabricator using loaned ore from the 🧰 hold. Fully sandboxed — ore and plate return to the order on exit.",
				"⚔ THE QUEST SYSTEM — the mainline is renamed <b>Chapters</b>; the charter board beneath it is now progressive.",
				"⚔ CHARTER CHAINS — charters arrive in chains (the five trades and the Sol tour), revealing one link at a time.",
				"⚔ ACCEPT TO ACTIVATE — a revealed charter tracks only after <b>Accept</b> (three active at once); a deed already done completes on the spot. The weekly board opens once the five trades are learned.",
				"🎒 CHARTERS PAY GEAR — five early links award a crafted piece on completion (headlamp, mag-boots, meteorite pendant, field leggings, comms earpiece), equipped straight into an empty socket. The Fabricator remains the upgrade path.",
				"🧭 NUDGES LEAD SOMEWHERE — the next-step nudge names the current chain link (accepted charter first, else the link awaiting Accept); tapping a guiding toast (marked ›) opens the Charters board.",
				"🧭 ARRIVAL PAYS — first arrival in a system with no prior expedition record logs a First Arrival line and pays +2 ☄ Stardust.",
				"🌸 THE CARD BLOSSOMS — orbit shows identity, a life-signature count, and a one-line environment summary; landing opens the environment fold, the biosphere survey, and the capture verbs.",
				"🐾 TAME & SCAVENGE — the biosphere survey reveals the roster instead of cataloguing it; each species is caught individually with visible odds (lower for rarer species, raised by crafted gear). Misses cost nothing; every Compendium page is earned.",
				"🔮 THE ELEMENTAL SIGNATURES — the Prime Codex is nine elements now, each ruled by a named titan (Terrakoth of Earth, Pyraxis of Fire, Nullreth of the Void…). The basics wait near home; Electric and Poison at mid range; Void and Prism far past the Deep Field. The beacon lore is retired — the elements are the arc.",
				"⚔ THE TITAN HUNT — each element&#8217;s Signature is guarded by a unique named titan, far mightier than any wild apex — the same creature for every explorer, seeded to its world. The Codex reads a resonance that names the KIND of world to hunt (molten worlds for Fire, the deep dark for the Void) and how far out it lies — <b>tap a resonance in reach to track it</b> and set a bearing for the titan&#8217;s nearest world. You won&#8217;t know a titan waits until you land and survey. Each titan wears its element and fights wrapped in it. Send your bred and tamed champions, fell it, and claim the element. Mine, craft, breed stronger, hunt the titans — the whole game meets here.",
				"🌍 THE CRADLE — Earth now carries a real, catchable biosphere from your first landing: land, survey, and tame or scavenge a full spread of beasts, birds, flora and microbes. Every one is a <b>starter</b> — grade capped at Uncommon, honest stat variance, no ceiling-breakers — so a menagerie on day one never becomes an early armory. Humanity stays on the card; the wildlife joins it."
			]],
			["⚖ Balancing", [
				"⛏ THE MINING BURST — one press runs up to 10 pulls (~16s), then mining stops until pressed again. Prevents AFK reserve drain; burst-extending recipes are planned.",
				"⬆ CHAPTER GOALS COUNT DEEDS — Chapter mining goals now count drill runs (one press = one deed) instead of loads; the hold and the charters still count every load.",
				"👑 GUARDIANS HONOR THE DISTANCE — Apex Guardians now use the standard region scaling (+14% power per region out), matching ordinary apex defenders (in force since v1.4).",
				"🛡 LEGENDS GROW WHERE THE WORLDS ARE RARER — conquest XP now scales with the conquered world&#8217;s tier; each genuinely new species catalogued grants the standing Field Scout +2 XP.",
				"🩸 THE MERCY LAW REACHES CONQUEST — a fallen bred champion returns Critical instead of dying; champion duty can reduce you to the brink but never kill; below quarter health you cannot lead a conquest yourself (send a beast or mend first). Closes a death loop the 5,000-player synthetic panel hit 344 times. Wild-caught champions still die on defeat.",
				"🌡 THE DEPTH TAX — field damage (bioscans, wary receptions) now scales with distance: softer than before in the home galaxy, plus a tax per universe region out, exceeding 2x at the Frontier. Displayed danger % is unchanged; only the damage is graded. Near home an ungeared explorer is near-safe; deep rings are where scouts, hulls, and suits matter."
			]]
		]
	},
	{
		v: "1.5",
		title: "Fresh Start",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", [
				"🌅 A FRESH START FOR EVERYBODY — all expeditions reset with v1.5; every explorer starts from the same Sol opening (the Ascent is now the canon start). Nothing is grandfathered or carried over; a farewell card records the retired expedition and its rarest find. The universe is untouched: same seeds, worlds, and share codes.",
				"🧍 THE CHARACTER SCREEN — one centered, Diablo-style home: full-length painterly explorer with nine gear sockets pinned to the body (Helmet, Earpiece, Necklace, Suit, Gloves, Tool, Leggings, Boots, plus the ship Module beside the figure); stats in the left column; Cargo hold, Fabricator, and Research Bench beneath. The 🧰 button shortcuts to inventory. Phones stack paperdoll, stats, then hold.",
				"✦ THE PATHFINDERS&#8217; TRAIL — the Prime Codex is now the endgame arc, starting where the Ascent ends. Each Signature names its trail reach; claiming it recovers a relic blueprint — nine unique signature-tier gear pieces, one per socket, forgeable only at a Signature-holder&#8217;s Fabricator. A Legacy prestige layer for completing the Trail is planned.",
				"🧭 QUEST NOTIFICATIONS — a nudge on login and on idle points at the current chapter goal or charter; fires once per goal, never over another conversation; the 🔔 tray keeps a record."
			]],
			["🖱 UI Enhancements", [
				"⚔ CHARTERS TAKE THE PRIME SLOT — Charters and the Ascent move to the gold pill (top right); the Prime Codex (endgame) moves to the left rail.",
				"🐾 SPECIMEN CARDS CONDENSED — identity and battle stats on top; the field-notes wall folds behind a remembered expand group with a one-line digest. Extremophile ⟁ headlines stay visible. Compendium shelf rows clamp to one line; the card holds the prose.",
				"🌙 QUIET SKIES FOR NOW — Cosmic Events and the Traveler&#8217;s Beacon are disabled pending rework; their achievements are shelved with them. They will return."
			]],
			["⚖ Balancing", ["🛡 LEVELS YOU CAN ACTUALLY REACH — class level thresholds cut in half: level 3 at ~7 victories, level 6 a multi-session arc, level 9 the long chase. XP awards unchanged (duels +8, conquests +20, guardians +60). A 240-session synthetic panel found only 3% of sessions reached the second innate art on the old curve, and none reached the third."]],
			["🐛 Bug Fixes", ["🔔 NOTIFICATION TRAY — no longer overlaps the search box during Field Training; each lesson closes the panels the next lesson does not need.", "📊 LANDING TALLIES — Groundfall and Trailblazer count again. The worlds-landed tally froze in v1.3.8 when landings stopped leaving space; it now ticks on the landing rite."]]
		]
	},
	{
		v: "1.4",
		title: "The Ascent",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", [
				"⬆ THE ASCENT — three-chapter mainline pinned atop the Charters board. New expeditions start locked to Sol and mine → craft → build outward: the ⚡ Jump Drive opens the Neighborhood, the 📡 Long-Range Array opens the whole galaxy, the 🌌 Intergalactic Drive opens intergalactic space. The full sky stays visible from day one — looking is free, moving is earned. Veteran saves keep everything.",
				"🧰 THE FABRICATOR — crafting spine in the Cargo hold: T1 basic parts → T2 components → T3 ship systems and explorer gear; ~30 space-made recipes with painterly icons; no wait timers.",
				"🎽 EQUIPMENT — nine gear sockets on the character sheet (Helmet · Earpiece · Necklace · Suit · Gloves · Leggings · Boots · Tool · Module). Mining rigs and grip gloves multiply hauls; hazard suits open molten/crushing/frozen worlds; the Gravitic Anchor removes wave-offs; the Diplomat&#8217;s Beacon wins first contacts; grail pieces require biome-gated exotics.",
				"📡 THE SHIPYARD — the character sheet shows the ship: a bare hull on chemical thrusters that visibly gains each built system (Jump Drive engines, Array dish, Auto-Extractor pod, Intergalactic outriggers).",
				"🗺 THE BEACON, RETUNED — the Traveler&#8217;s Beacon now always targets inside your current charter: Sol, then the Neighborhood, then the galaxy, then the wider cosmos.",
				"💎 BIOME-GATED VEINS — the four exotics each have a source biome: Geode worlds carry Neodymium, Carbon worlds Promethium, Glass deserts Voidglass, magma seas Prismatium. The vein shows on the card with a ✦; every rich strike there hits it.",
				"⛏ MINING REBUILT — hourly timer removed. Each press pulls a variable haul; rich strikes hit rare pockets; reserves are finite — the card counts remaining pulls, and a world can be mined out (hundreds of pulls). The 🤖 Auto-Extractor keeps working every mined world while away.",
				"🏅 ACHIEVEMENTS & GUIDE — nine new Engineering achievements; two new Guide chapters (The Fabricator & gear · The Ascent)."
			]],
			["⚖ Balancing", [
				"🌈 THE RING SPECTRUM — find rarity caps expand with the rings: up to Legendary near home, Mythic in the home galaxy, one more band per region out, summit grades in the Deep Field. Bred bloodlines, guardians, and Paragons are exempt; existing catalogue entries never downgrade.",
				"🌈 WORLDS & STARS — the same ladder applies to worlds and stars on new expeditions: spectral designations cap by ring, along with the spoils, veins, and reserves that scale on world tier. Existing expeditions keep every shown designation.",
				"💚 MEDICINE NEVER KILLS — eating flora can reduce the explorer to 1 HP but can no longer end the expedition (beasts can still die of a bad meal — they have a keeper; you are the keeper). The 700-player synthetic panel found the heal button was the top cause of death.",
				"🛠 GRAIL RECIPE SOURCES — grail recipes name their exotic&#8217;s source biome in the cost line (Neodymium reads &#8220;Geode worlds&#8221;, Prismatium &#8220;Magma seas&#8221;)."
			]],
			["🖱 UI Enhancements", [
				"🏞 PLANETSIDE — the landing view is renamed <b>Planetside</b> and is now a pop-up card over the game with its ✕ on the frame, not a separate full screen.",
				"⏭ DUEL SKIP — duels gain a ⏭ Skip button to jump straight to the outcome.",
				"🗂 COMPENDIUM SHELVES — unified naming: Land · Aerial · Aquatic · Amphibious · Cave · Extremophile Fauna (gas-giant floaters shelve under Aerial; each card names its precise realm).",
				"📍 SURVEY CARD ANCHORING — cards stay beside their world through pan, zoom, and orbit drift."
			]],
			["🐛 Bug Fixes", [
				"☄ ASTEROID SPRITES — belt and outer-ring asteroids draw as shaded irregular lumps instead of squares, in close-up and card thumbnails.",
				"❔ HELP POPOVER — tapping empty space closes the ? popover, matching every other panel.",
				"🎲 TRAINING ROLLS — every practice roll succeeds, feeding included, on any step; a rig bug poisoned the loaned beast on every training meal."
			]]
		]
	},
	{
		v: "1.3.10",
		title: "Kingdom Shelves",
		date: "July 2026",
		sections: [["🖱 UI Enhancements", ["🗂 KINGDOM FILTERS — the Compendium sorts itself by kingdom now: filter chips (All · 🐾 Fauna · 🌿 Flora · 🍄 Fungi · 🦠 Microbes) sit above the shelves, and picking one throws open that kingdom&#8217;s shelves. Every shelf header wears its kingdom&#8217;s color for at-a-glance reading, filtered or not."]]]
	},
	{
		v: "1.3.9",
		title: "Eyes on the Lesson",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🎯 TRAINING TAP GUARD — during Field Training, tapping a world outside the lesson now does nothing at all. Before, a stray tap in the find-Earth step could lock another planet&#8217;s card for the rest of training — and stray taps could even dismiss the lesson&#8217;s own card."]]]
	},
	{
		v: "1.3.8",
		title: "The View Holds",
		date: "July 2026",
		sections: [["✨ New Features & Systems", ["🛬 ORBITAL LANDING — the descent never leaves the sky: the camera holds at approach framing while the landing view opens over it. The old flat ground close-up is gone entirely — mining, census, samples, and first contact all still work from orbit, exactly as before.", "🏞 VISTA REBUILD — the Landing vista button works on any world you&#8217;ve visited, even after a reload; if this session hasn&#8217;t painted the scene yet, it&#8217;s rebuilt on the spot."]], ["🖱 UI Enhancements", ["✕ LANDING VIEW CLOSE — the ✕ shows everywhere now, training included, and the ? popover follows the one-panel rule (no more settings peeking out beneath it)."]]]
	},
	{
		v: "1.3.7",
		title: "One Lesson at a Time",
		date: "July 2026",
		sections: [["🐛 Bug Fixes", ["🎓 LESSON INPUT SCOPE — Field Training answers only the lesson in front of you: unrelated survey-card buttons (Land included) and specimen-card verbs go quiet, so the feeding lesson can never trip a live breeding roll — while folding rows and closing cards stay free.", "🛬 LANDING VIEW BACKDROP — the landing view floats cleanly over open space; the extreme ground close-up no longer renders behind it."]]]
	},
	{
		v: "1.3.6",
		title: "Quiet Skies",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", ["🔭 STAR CHARTS SETTING — a new Graphics toggle draws orbit paths, the habitable zone, and chart labels in system view. Ships off — flip it on for the full astronomy overlay."]],
			["🖱 UI Enhancements", [
				"🤫 TRAINING HOVER QUIET — while a lesson is up, cursor sweeps no longer pop survey glances over the guidance card; only the lesson&#8217;s own target shows (Earth still glances in find-Earth).",
				"🖱 HOVER SCOPE — hover cards appear only at system scale, so sweeping across a galaxy no longer strobes a stream of star cards. A tap still opens anything, anywhere.",
				"🔍 ZOOM CLAMP — zooming into a landed world now stops before the ground texture smears into stripes."
			]],
			["🐛 Bug Fixes", ["🎲 RIGGED ROLLS — training rolls can no longer fail. A practice breed used to be able to lose its roll, consume both parents, and strand the lesson; rigged rolls now beat any odds.", "🌍 EARTH BIOME — Earth no longer introduces itself as a savanna world; home keeps its true card."]]
		]
	},
	{
		v: "1.3.5",
		title: "Soft Landings",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", [
				"🏞 BIOMES — every world now wears a biome (~35 kinds: swamp worlds, coral shallows, glass deserts, magma seas, carbon worlds, storm-eye giants, and more), named on the survey card and painted into the landing view. Rare biomes are flagged in violet.",
				"🎯 LANDING ODDS — every world sits on a success ladder shown before you commit (a meadow world near-certain, a magma sea ~1 in 10). A failed descent bounces you back to orbit with a scrape, never worse — and each attempt improves the next try on that world. Visited worlds are permanent; return landings never ask again.",
				"⚠ DESCENT CONFIRM — a manual dive into an unvisited world stops at approach altitude and asks first; the survey card&#8217;s Land button skips the ask.",
				"🪐 GAS GIANT LANDINGS — the landing site is the high cloud deck: storm bands, the great spot when the card carries one, rings overhead, deep lightning, and aerial life drifting past where the card grants it.",
				"🌩 WEATHER EVENTS — tornadoes, hurricane walls at sea, sand walls, ice storms, erupting cryogeysers, acid rain that boils off mid-air over Venus-likes, volcanic lightning, fire whirls, iron rain on ember giants — each shown on the surface readout, in the landing view, and on the descent ask.",
				"🦠 EXTREMOPHILE LIFE — a thin slice of hostile worlds (molten, frozen, crushing, airless-adjacent) carries real creatures beyond microbes; the orbital glance flags them in violet as impossible biosignatures.",
				"🐋 LEVIATHAN SIGHTINGS — a world whose roster hides a titanic creature can render it at full scale on the landing-view horizon.",
				"🌊 ABYSSAL LANDINGS — abyssal ocean worlds render underwater: light shafts, glowing plankton, distant vent fire, and lure-bearing deep hunters where the card grants them.",
				"🌿 MARINE & EXTREMOPHILE FLORA — ocean worlds grow kelp towers, seagrass meadows, reef-builders, and sargassum rafts; aerial-life worlds gain drifting veils; and extremophile creatures earn habitat behaviors — vent-clingers, magma-swimmers, storm-riders, winged hunters."
			]],
			["🖱 UI Enhancements", [
				"🪟 ONE PANEL RULE — opening a panel closes the previous one, phone and desktop alike; every panel carries a corner ✕, and tapping empty space closes the open one. Duels, reveals, and dialogs are exempt from stray-tap close.",
				"✕ LANDING VIEW CLOSE — the landing view carries a ✕, and a quick tap right after reopening can no longer strand it open.",
				"🎨 ORBIT COLOR MATCH — orbital art now matches the biome: carbon worlds graphite-dark, obsidian worlds near-black, magma seas glowing warm, blue-ice worlds cold, ember giants red."
			]],
			["⚖ Balancing", ["🌩 STORM MODIFIER — an active storm adds 5 points of landing difficulty — never enough to trouble a friendly world.", "📋 NEW WEEKLY CHARTER — &#8220;Down the hard way&#8221; pays 35 ☄ for landing on a gas giant, hothouse, or molten world; adding it reshuffles the weekly board once at the next rollover."]],
			["🐛 Bug Fixes", ["💫 REMNANT RENDERING — the dashes around supernova remnants and the drawn circles around cosmic deaths are gone; everything that dies in space now renders as a cloud.", "🪐 GAS GIANT READOUT — gas giant surfaces no longer report themselves as airless with no weather."]],
			["🔧 Under the Hood", ["⚡ GALAXY RENDER — remnant and merger gradients are baked once instead of allocated every frame — lower battery draw on phones.", "💾 WAVE-OFF PERSISTENCE — wave-off progress on hard worlds saves with the expedition, so a reload keeps the climb."]]
		]
	},
	{
		v: "1.3",
		title: "The HD Frontier",
		date: "July 2026",
		sections: [["✨ New Features & Systems", [
			"🏞 LANDING VISTAS — landing opens a painted surface view drawn straight from the survey card: terrain, weather, time of day, inhabitants, and nearby fauna. The card&#8217;s Landing vista button reopens it anytime.",
			"🎨 PER-WORLD VARIATION — horizon, sun, rivers, and plants all roll per world, with palettes that run to golden, copper, and violet forests. Rare touches: sky-spanning rings, a huge low moon, glowing shores.",
			"🐾 CREATURE PORTRAITS — Compendium art now matches the card&#8217;s traits: tentacled creatures have tentacles, armored ones plates, eyeless ones no eyes. Apex Guardians wear a molten-gold aura; Paragons a silver-teal one.",
			"🌦 WEATHER CYCLES — rain showers and dust storms pass now instead of running forever, and the readout reports clear skies between spells. Snow still lingers in cold country."
		]], ["🎨 UI Enhancements", [
			"⭐ STAR RENDERING — galaxy-view stars glow in true class colors with halos, spikes on the giants, and a twinkle on the brightest; nebulae, dark clouds, and supernova remnants gain real texture instead of flat circles.",
			"🪐 PLANET ART — the art now honors the survey card: dried seas and salt flats on hot worlds, ice on frozen ones, era-based night lights on civilized worlds, rings on card thumbnails, true moon colors, and per-star lighting in every system.",
			"✨ REVEAL SCALING — the discovery cinematic now escalates past Mythic all the way to the summit; the rarest creatures wear foil in the Compendium list, a caught Paragon&#8217;s Binder slot takes its true grade color, and Silicon earns its own icon color.",
			"🃏 CARD HANDLING — locked cards carry an <b>✕</b> (tapping empty space still closes them), and <b>any open card drags by its header</b>, mouse or finger."
		]]]
	},
	{
		v: "1.2.6",
		title: "Ink & Ember",
		date: "July 2026",
		sections: [["🎨 UI Enhancements", [
			"🖋 EMPHASIS PASS — bold now marks only pressable items and proper names: some ~100 stray emphasis words across cards, battles, training, and these very notes reverted to plain text. In the brighter Text tones, gold marks the interactive bits.",
			"⚔ BATTLE LOG COLORS — a MUD-style color language: champion cyan, foe ember, damage yellow, crits gold, misses dim, burns orange, mending green, lifesteal violet, thorns lime, deaths red — victory prints gold, defeat red. Shared battle logs stay plain text.",
			"🎨 SYSTEM COLOR LANGUAGE — pop-ups and the bell tray now speak in color: red for harm, gold for milestones, green for gains. Long-range glances tint their readings (water cyan, life green, signals violet), the <b>Compendium</b> marks the Field Scout cyan, and <b>Star Atlas</b> and <b>Cosmic Events</b> follow suit.",
			"✍ COPY PASS — a full grammar and clarity sweep: stale button names corrected, the settings guide updated to its three tabs, one stray “Codex” label returned to the Prime Codex, and the First Contact <em>achievement</em> renamed First Specimen (the real first contact keeps its name)."
		]]]
	},
	{
		v: "1.2.5",
		title: "First Contact",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", ["🤝 FIRST CONTACT — landing on an inhabited world now attempts contact: a warm reception opens the census on the spot; a wary one wounds you and seals the census until your next landing; a named Field Scout takes that hit in your place. Conquered worlds skip contact entirely.", "📦 CARGO GRID — the Cargo hold is a real inventory grid now, with per-element icons: ingots for metals, shards for ices, flasks for gases, cut gems for exotics. The <b>Research Bench</b> moves to its own tab, carrying the same icons into every recipe."]],
			["🎨 UI Enhancements", ["🛬 ONE LAND BUTTON — every world&#8217;s card shows a single <b>Land</b> button now; what happens next depends on the world. Manual zoom-in still works."]],
			["🐞 Bug Fixes", ["🩹 CARD OVERFLOW — expanding a survey card&#8217;s Environment fold could push it off-screen with no way to scroll; the card now resizes and repositions itself as it unfolds."]]
		]
	},
	{
		v: "1.2.1",
		title: "The Hunt Board",
		date: "July 2026",
		sections: [["✨ New Features & Systems", ["📋 EXPEDITION CHARTERS — a hunt board joins the left rail. New explorers get five starter charters that chain the core trades in order — make planetfall, prospect a dead world, discover life, name a Field Scout, conquer a world — each paying ☄ Stardust on completion. A veteran&#8217;s already-proven trades arrive marked complete.", "🗓 WEEKLY BOARD — once the trades are learned, three fresh charters arrive each week, identical for every explorer in the universe."]]]
	},
	{
		v: "1.2",
		title: "The Discovery Arc",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", [
				"🔎 THREE-STEP DISCOVERY — knowing a world comes in three tiers: a glance shows telescope reads (color class, atmosphere, water signatures, biosignatures, ⟁ signals — hover on desktop; on phone a tap goes straight to survey); the orbital survey reads environment and biosphere; and planetfall runs the full ground survey.",
				"🛬 LAND BUTTONS — an unlanded world carries one right on its card: <b>Land — make contact</b> on civilized worlds, <b>Land to prospect</b> on dead ones. One press flies you down; manual zoom-in still works.",
				"🤝 CIVILIZATION READS — a civilization can&#8217;t be read from orbit (you get ⟁ signals only); land and make contact to learn its tech era, calendar, and population.",
				"⛏ PROSPECTING GATE — a dead world&#8217;s ⛏ Mine Deposits unlocks only after you&#8217;ve landed on it; 🛰 Deep Scanners still read its veins from orbit.",
				"✅ GROUND-SURVEYED MARK — a visited world now carries a Ground-surveyed mark; every world you&#8217;d charted, settled, or mined before this update counts as ground-surveyed already (nothing known is re-hidden).",
				"⛳ FIELD SAMPLES — your first footfall on any world collects samples: a pinch of its elements plus a few ☄ Stardust, richer on rarer worlds.",
				"🐾 FIELD SCOUTS — press <b>Scout</b> on a fauna card to name your expedition&#8217;s scout; it soaks hostile bioscan hits through the standard wounds-and-mending system, and is lost forever at zero. Tougher scouts open deadlier worlds."
			]],
			["🛠 Under the Hood", ["⚡ PHONE PERFORMANCE — the star field is painted once instead of every frame, survey readouts stop recomputing sixty times a second, card layout no longer thrashes, and phones render at a tuned resolution."]],
			["🎨 UI Enhancements", ["🧭 SURVEY HEADINGS — heading emoji removed and alignment tidied; fold rows now read <b>expand</b> / <b>close</b> instead of a small triangle."]],
			["🐞 Bug Fixes", ["🌍 EARTH MINING — Earth no longer offers <b>⛏ Mine Deposits</b>; it was the only living world with a mining action, a quirk of how home&#8217;s card is built. The dead worlds are where the elements live."]]
		]
	},
	{
		v: "1.1.2",
		title: "Clear Signals",
		date: "July 2026",
		sections: [["🎨 UI Enhancements", [
			"🃏 SURVEY CARDS CONDENSED — actions on top, then rarity, life, and civilization; the environmental survey (atmosphere, climate, water, gravity, and more) folds behind a 🌍 chevron, and the census (tech era, calendar, population) behind its headline. Your fold choices are remembered.",
			"🔝 CARD ACTIONS — Star Atlas, Conquer, Mine, and Share now sit at the top of every survey card.",
			"📜 VISIBLE SCROLLBARS — every scrolling panel (release notes, survey cards, Guide, Compendium, and more) now shows a visible thumb on a faint track.",
			"⚙ SETTINGS WIDTH — the panel is wider now, and option pills can no longer overflow its right edge at any font size.",
			"📰 BULLETIN CONTEXT — the “What&#8217;s new” bulletin carries its whole release line (1.1.2 shows the 1.1.1 and 1.1 notes beneath it)."
		]]]
	},
	{
		v: "1.1.1",
		title: "Signal & Polish",
		date: "July 2026",
		sections: [["🎨 UI Enhancements", ["⚙ SETTINGS SPACING — option pills keep a clean gap from their labels now (Font and Motion had been touching)."]], ["🛠 Under the Hood", ["🏷 EXTERNAL NAMING — the browser tab, link previews, and search results all say Celestial Frontier now; the old “Cosmic Codex” page subtitle is retired (the Prime Codex keeps its name)."]]]
	},
	{
		v: "1.1",
		title: "Field Reports",
		date: "July 2026",
		sections: [
			["✨ New Features & Systems", [
				"🔊 CORE SOUND EFFECTS — a sonar ping on survey taps; a whoosh on hyperlane travel and planetfall.",
				"🎚 SOUND VOLUME SLIDER — Settings → Audio: one master level for every effect.",
				"♿ MOTION SETTING — Settings → Graphics: <b>Auto</b> honors the device&#8217;s reduce-motion preference (and keeps listening for it); <b>Full</b> / <b>Reduced</b> override. Reduced stills the travel tunnel, screen shake, confetti, and foil shimmer.",
				"✎ EXPLORER RENAME — Settings → Display → Explorer name, or the ✎ link atop the character sheet; your record persists, only the name changes."
			]],
			["🎨 UI Enhancements", [
				"🤫 QUIET TRAINING — during Field Training, pop-ups rest in the 🔔 tray (nothing is lost) and tooltips hold; a blocked scroll nudges the guidance card instead of failing silently.",
				"🔠 LABEL SCALING — survey-card labels are brighter and now scale with the A+ / A++ text sizes.",
				"🖱 DESKTOP HINT — corrected: hovering previews a card, a click surveys it.",
				"👆 TOUCH TARGETS — everything tappable in the sky, plus the small Atlas and Settings controls, gained larger hit areas — no visual change.",
				"⌨ KEYBOARD SUPPORT — Settings, Compendium, Binder, Star Atlas, and Guide entries are tabbable and fire on Enter or Space, each with a visible focus ring."
			]],
			["🚀 Gameplay", ["🛬 LANDING ASSIST — zooming into a view-filling, off-center planet glides the camera the rest of the way and lands, instead of silently maxing out; only a deliberate zoom-in triggers it (panning, pinching, and moon-gazing are never hijacked)."]],
			["🐞 Bug Fixes", [
				"🌙 MOON TAP TARGETS — tiny moons no longer steal taps aimed at their planet (“tap Earth” lands on Earth): a moon’s tap target matches its visible size, the generous grab returns up close, and planet targets grew a little.",
				"🎓 TRAINING RANK UP — the sandbox promotion is handed back with the practice cache; the real Rank Up fanfare waits for the real thing.",
				"✎ RENAME DIALOG — closes with Esc or Cancel now instead of demanding a name."
			]],
			["🛠 Under the Hood", ["📰 WELCOME BULLETIN — pinned to the shipped version’s notes, so a fresh expedition always opens on the game overview, never a work-in-progress changelog."]]
		]
	},
	{
		v: "1.0",
		title: "The Frontier Opens",
		date: "June 2026",
		sections: [
			["🌌 An Infinite, Shared Universe", [
				"🌱 DETERMINISTIC COSMOS — every galaxy, star, and world is grown from seeds, identical for every explorer, fully offline, no account needed. Four seamless scales: universe → galaxy → star system → planet surface.",
				"🚀 HYPERLANE TRAVEL — jump time scales with distance, and researched drives cut it sharply. The travel tunnel takes on the destination’s light; tap to skip.",
				"🃏 SURVEY CARDS — for worlds, stars, black holes, wormholes, supernovae, and the cosmic microwave background alike, each with a spectral designation color-coded by rarity.",
				"🗺 FRONTIER REGIONS — the charter begins at the Solar Reach and widens with each Signature claimed: Local Cluster, Near Field, Deep Field, Outer Dark, Frontier. The farther out you reach, the tougher the defenders and the stranger the life.",
				"🌠 COSMIC EVENTS — events on every timescale, cycling by the hour, week, month, and year, identical for every explorer at the same moment; the 📜 Witness Log keeps them all."
			]],
			["🧭 The Explorer’s Tools", [
				"🧭 NAVIGATION TOOLS — the <b>Star Atlas</b> bookmarks worlds with favorites and a home marker; <b>search</b> spans everything you&#8217;ve discovered or named, and accepts pasted codes; and the Traveler’s Beacon posts a shared destination every five minutes.",
				"🔗 SHARE CODES — CF1- codes land a friend on your exact world; CFB- codes summon your exact creature for a duel; and 📸 discovery records export Legendary-or-better finds as paste-anywhere keepsakes.",
				"🎓 FIELD TRAINING — a fully sandboxed tutorial for every new expedition: chart Earth, train with a loaned cache, feed, breed, duel, take a scratch, heal. Skippable for veterans, and nothing from training ever carries out.",
				"📖 THE GUIDE — a searchable <b>🧭 Guide to the Universe</b> covering every system; open it with ? anytime (its version line opens these very notes)."
			]],
			["🧬 Life & the Compendium", [
				"⚗ THE COMPENDIUM — catalogue life across four kingdoms and sixteen realms; a painterly portrait engine stages every creature in the habitat where you found it.",
				"🏅 RARITY LADDER — a deep rarity ladder runs from Common up to a one-in-a-million summit, with foil frames at the very top. Once earned, a grade never falls.",
				"🧬 BREEDING & FEEDING — <b>Breed</b> hybrids (both parents are consumed) and <b>feed</b> for permanent growth and medicine; rarer flora poison deeper, and only a spent beast dies of it.",
				"👑 APEX GUARDIANS — named, one-of-a-kind summit titans rule rare worlds — the same rulers for every explorer — and defeating one in conquest adds it to your Compendium.",
				"🜲 THE FIFTY PARAGONS — legendary deep-spectrum creatures wait on fixed worlds, shown as Binder silhouettes until found; share the coordinates and every explorer faces the same legend.",
				"🌱 LIVING COLLECTION — the Compendium interbreeds and evolves on the cosmic clock, and worlds re-roll their rosters as the universe ages. Sapience runs from Instinctive to fully Sapient, and worlds host civilizations from stone-age to starfaring."
			]],
			["⚔ Battle", [
				"⚔ CLASSES & LEVELS — every beast is born to one of 180+ classes (Warrior to Worldbreaker, the legendary ones reserved for the summit) with innate, always-on arts. XP comes only from wins — duels, conquests, guardians — and levels wake more arts; raw stats never inflate on their own.",
				"✨ ABILITY MATRIX — hundreds of arts (“Fire Reckoning III”) balanced across thousands of simulated duels; hybrids inherit the other parent’s archetype, and guardians fight with Sovereign arts.",
				"📜 THE CHRONICLE — duels are narrated blow-by-blow: initiative, named arts, executes, thorn recoils, burn ticks, death lines — closing with a statistics ledger and a shareable battle log.",
				"🏴 CONQUEST — champion a world yourself or send a beast; settled worlds fly your flag, scan safely, and pay Stardust, and a world&#8217;s home field lets its defenders fight in their element.",
				"🩹 PERSISTENT WOUNDS — conquest scars and resented meals leave a beast Bruised, Injured, or Critical, fighting below strength until mended; feeding is medicine (loved flavours mend most, rarer flora mend deeper — and poison harder). Hostile bioscans cost you explorer HP, and zero HP ends the expedition."
			]],
			["🛠 Progression", [
				"🔑 THE PRIME CODEX — nine elemental Signatures, each guarded by a named titan; master all nine to command the forces of the universe and open the Celestial Frontier — with multiple endings.",
				"⛏ MINING & RESEARCH — dead worlds carry the elements; stock the 🧰 Cargo and spend at the bench on scanners, hull, lab, and the drive ladder (Fusion → Antimatter → Warp Fold).",
				"🗂 THE BINDER — collect types, not individuals: fixed pages, identical for every explorer, with claimable Sets that pay Stardust bounties.",
				"🏆 RANKS & RECORDS — ten explorer ranks with unlockable nameplate colors (foil at Eternal Frontier), dozens of achievements, the Star Atlas, the Traveler’s Beacon, cosmic events with their 📜 Witness Log, 📸 discovery records, and share codes for worlds and creatures alike."
			]],
			["⚙ The Craft", ["📱 PLATFORM — one file, offline-capable, mobile-first, and deterministic to the byte: the same universe on every device, verified by a 50-probe fingerprint and a full headless test fleet on every build.", "⚙ OPTIONS — <b>Display / Graphics / Audio</b> tabs: text size, tone, font, tooltips, effects, shake, sound, notifications — all persistent. The version line under <b>?</b> opens these notes. Saves are browser-local; back up favorites as ⇪ creature codes."]]
		]
	}
];
const V2_RELEASE_CATEGORIES = Object.freeze([
	"New Features & Systems",
	"UI Enhancements",
	"Gameplay",
	"Balancing",
	"Bug Fixes",
	"Under the Hood"
]);
/**
* Development copy only. v2.0 is the authorized playtest identity, not a
* shipped production release and not eligible for update-popup comparison.
*/
const V2_DRAFT_RELEASE = Object.freeze({
	status: "draft",
	id: "v2-development",
	version: V2_DEVELOPMENT_VERSION,
	title: "A New Foundation",
	date: "Unreleased",
	sections: Object.freeze([
		Object.freeze({
			category: "New Features & Systems",
			bullets: Object.freeze([
				"🧭 COMPANION MISSIONS — send a companion to a world you've landed on: Prospect brings back that world's materials, Survey brings a little Stardust and a story. 10, 25 or 60 minutes of play; the risk is shown before it leaves, and you can recall it any time. Two at once.",
				"✨ SPECIMEN REVEALS — every new Compendium page is revealed with its painted portrait; several at once queue up, with Continue and Skip all.",
				"⇪ VISTA POSTCARDS — step into a landing vista with ⛶ Vista, then save or share it as a postcard with the world's name and share code.",
				"🎵 A LIVING SOUNDSCAPE — every world now has its own bed of wind, water, insects and weather, from 43 biomes; music is sparse and melodic — a calm piece, then minutes of only the world — and battles carry their own theme, with stings for victory and defeat.",
				"🦎 EVERY CREATURE HAS ITS OWN VOICE — thirteen body plans voiced from throat, breath and body (croaks, chirps, hisses, clicks, hoots, bubbles), one voice per creature, the same everywhere; every ability theme and impact has its own material sound.",
				"🏗 OUTPOSTS — Build a Survey Relay, a Field Shelter or a Companion Sanctuary on a world you chose: three stages each, paid in parts and Stardust, with no timers or upkeep. Finished outposts change their world for good and join the Museum.",
				"🍃 COMPANION TASTES: Every companion loves two flavours and dislikes one. Loved meals grow it faster and mend wounds; disliked meals are consumed harmlessly. A first meal and each new flavour earn one-time XP.",
				"💤 REST: A wounded companion can rest at home for 2 minutes of active play per 0.1 injury, rounded up and capped at 20 minutes. It heals and becomes available when that timer ends; closing the game does not advance it.",
				"💞 BOND: Six levels, Wary to Soulbound, record distinct shared firsts and never decay. Bond itself adds no combat power; Trusted opens Long missions and Devoted halves mission wound risk.",
				"🔗 SHARE YOUR CREATURE: A companion’s Friendly duel panel offers its battle-ready CFB- code, and a champion code once it has earned XP, for a friend to paste into their own duel.",
				"🌌 THE FRONTIER HAS A NEW FOUNDATION: A playable TypeScript and Pixi v2 development build carries one deterministic expedition from the infinite universe through galaxies and star systems to Planetside, with the current view preserved across reloads.",
				"✨ A UNIVERSE WORTH CROSSING: The streaming sky layers a cosmic web, galaxy haze and nebulae, named stellar fields, compact objects, wormholes, supernova remnants, belts, rings, moons, comets, clouded worlds, and a seeded deep-space backdrop.",
				"🎨 ONE POLISHED UNIVERSE: Galaxies, stars, planets, all 43 live biomes, creatures, plants, and the current ship now share richer warm/cool light, material depth, atmosphere, and focal contrast while keeping every seed, silhouette, anatomy, proportion, placement, and gameplay boundary unchanged. Sol is a calibration point, never a special-case filter.",
				"🛬 THE SCOUT COMES IN TO LAND: The optional audiovisual preview shows a brief Scout arrival over its matching Earth landscape after a successful landing. Its landing sound follows your explicit pilot-sound choice; failed approaches stay quiet, and reduced motion uses a still pose.",
				"⚔ BATTLES HAVE A STAGE: The Combat Chronicle shows its exact creature combatants making short attacks, recoiling and dodging in time with the recorded fight. Your explorer uses a nameplate, and Frontier Resolve now opens its Chronicle correctly. Health, results and rewards follow the same settled battle, while reduced motion keeps the action text and still portraits.",
				"🌄 EVERY LANDED WORLD HAS A HORIZON: Planetside now lazily paints the preserved 960×430 authored landing vista for the exact current world and full canonical biosphere. Portrait phones show the complete composition above the fitted globe instead of cropping away most residents; unsupported workers or failed art mounts leave the usable globe intact. An optional Earth motion study gently turns the canonical surface under fixed lighting and separate clouds, then settles; an additional optional material study adds fine surface relief, ocean sheen and an atmospheric edge. Reduced Motion and Effects Off retain the standard globe. An optional painted Mars dune-sea study shows its full landscape unobstructed after landing, with detailed dunes and rocky horizons that preserve its barren ecology and two moons. An optional Earth riverbank study places existing named plants and animals in a separate layer over its rainy landscape. An optional static Earth painting brings the canonical Civet and its riverbank into one cohesive composition while retaining the same biosphere and landing controls.",
				"🖌️ PAINTED EARTH LANDFALLS: Land shows the painter composition immediately. The accepted rainy Earth painting fades in and is retained without a model download. Other supported recipes use the local finisher when ready. View never travels or starts another painting; Inspect opens the retained original at its actual size.",
				"The local painting engine keeps its models warm between landings. Browser model downloads are explicit and resumable; a damaged install offers Restart. Originals are kept separately from model files. Earth is the first supported art library; the phone finisher tier is not yet qualified.",
				"🦋 EARTH LIFE LOOKS LIKE ITSELF: The rebuilt portrait library gives familiar fauna, flora, fungi, and microbes anatomy, materials, poses, markings, and species-true color instead of generic or repeatedly recolored forms.",
				"🧬 ALIEN LIFE SPEAKS THE SAME VISUAL LANGUAGE: Planetside stages deterministic biospheres whose procedural organisms vary by kingdom, body family, habitat, silhouette, substrate, and seeded palette, while imported discoveries keep their exact identity in the Compendium.",
				"🗂 THE EXPLORER’S BOARDS RETURN: Current-slice versions of the Star Atlas, Compendium, Records, Charters, Settings, Field Training are open for development playtests.",
				"🎒 EVERY PIECE STAYS ITSELF: Inventory migrates each owned explorer-gear copy into a stable exact item instance with its slot, base effects, legacy affix, provenance, equipped binding, and protection state intact. Oversized legacy holds remain lossless inspection-only evidence instead of being truncated to fit an invented capacity.",
				"🛠 ENGINEERING TURNS OPPORTUNITY INTO REACH: Engineering & Shipyard keeps its capability-derived preview, then adds finite grounded Mine and Jump-gated Skim actions, six durably purchasable Research rows, and all 62 fixed Fabricator recipes. Deep Scanners reveal bounded orbital mineral facts; Reinforced Hull reduces hostile Discover Life damage by 25%; Xenobotany Lab adds one permanent nourishment point to a safe explorer Flora meal; and Fusion Drive, Antimatter Drive, and Warp Fold use the established 2×, 4×, and 8× travel-speed bases. Equipped healing, bioscan-protection, and travel-speed gear feed those same registered consumers. Speed never replaces permanent reach or slows the unresearched baseline. Fabrication enables only outputs with connected effects and exact cost, prerequisite, revision, and capacity headroom. A slotted craft paid entirely from exceptional direct materials receives one deterministic Pureforged modifier—mining yield, rich-strike chance, or capture-contact points—bound to the exact recipe, receipt, and item; mixed stock remains ordinary. Authored natural affixes/drawbacks, random drops, upgrades, sockets, and vendors remain unavailable. Built permanent systems change the real ship and star reach; a legacy charter refit still never names or draws a missing drive. Remnant skim damage is previewed before it can spend HP, Engineering can spend preserved Stardust but does not earn it, and no reward, cost, Charter tick, or optimistic panel change publishes before the one receipt-bearing transaction commits.",
				"📖 THE WHOLE FIELD MANUAL: The mature Guide returns with nine categories and 41 player topics drawn from 43 authored stable IDs, plus search, cross-links, and explicit current-slice notes, so mechanics that are not yet playable are labelled instead of promised.",
				"💾 EXPEDITIONS HAVE A GUARDED HOME: IndexedDB persistence, last-known-good recovery, and protected handling for incomplete, corrupt, transiently unavailable, or newer-build saves replace the temporary slice store.",
				"📡 AN INSTALLED FRONTIER CAN TRAVEL OFFLINE: The installable v2 web build accepts an offline candidate only after every exact emitted runtime file passes its recorded digest and the complete marker is written last. A failed or altered candidate is deleted without replacing the current build. Core runtime requests stay inside one selected complete build with no network fallback or cross-build mixing, and one complete predecessor is retained when available for rollback. Declared painted-arena files download on first use, are checked against that build’s exact size and SHA-256, and then remain cached for offline reuse; they do not download during installation.",
				"🔊 THE FRONTIER SPEAKS: Survey pings and travel, planetfall, and ascent whooshes answer the live exploration loop. The persistent master Sound control immediately silences any sting already ringing, while Volume stays remembered for the next enabled sound. Creature voices now shares one deterministic runtime across a verified durable wild-fauna Tame, one exact durable nonconverging Feed commit, and an explorer-requested call from one exact owned-fauna detail. Each waits for its own current visible accessible counterpart; browsing, filtering, focus, navigation, misses, refusals, stale or converging results, repeats, reloads, hidden play, route or counterpart loss, and disabled Sound or Creature voices remain silent without retry or replay. Feed keeps only the latest successful ownership key, so the same or an older successful result never replays; its inline polite result is the sole screen-reader announcement while the simultaneous corner toast is visual-only. A separate explicit pre-landing Survey and Planetside biosphere Listen may play one generic distant-ecology signal only while that exact inhabited world surface’s visible biosphere lead agrees; the two controls retain distinct approach/roster evidence, reveal no species, spend no Yield, grant nothing, and write no save. After a verified settlement, the Combat Chronicle now gives every already-modelled registered cue its own exact visible-caption sound: initiative, dodge, stun, damage with critical or ability layers, burn, regeneration, defeat, resolution, and Guardian or Titan entrance, phase, victory, and defeat motifs. Composite events remain one bounded voice, at most two combat voices overlap, master Sound governs them, Creature voices does not, and Skip completes the remaining Chronicle silently. Combat cues briefly soften music and ambience already playing in the shared mix, then restore your chosen levels smoothly after the last overlapping cue. Finite creature, biosphere, and combat cues now release their voice slots and audio nodes even if the browser misses the completion event, without changing their sound plans. In the optional audiovisual preview, accepting a Starter Charter now plays a short confirmation after the acceptance succeeds, including when existing progress completes it immediately. It follows your explicit pilot-sound choice; duplicate or failed acceptances stay quiet. Other sound mappings and creature actions remain future work.",
				"🜲 FOLLOW THE FIFTY: Records → Binder reveals fifty fixed Paragon trails shared by every explorer. A missing silhouette plots its source-proven home through existing ship and Prime reach checks; a found entry uses Inspect to open its exact existing Compendium record without travel, and Back returns to the Compendium list. Discover Life at an exact fixed home adds only that Paragon catalogue record in the same verified save, with no owned companion or specimen, no Capture credit and no Biosphere Yield spend. Repeat sightings add no duplicate record or discovery reward. Seeker of Legends becomes claimable after ten exact Paragons through a separate Binder Claim and pays its established 120 Stardust once; a sighting never pays that Set reward automatically."
			])
		}),
		Object.freeze({
			category: "UI Enhancements",
			bullets: Object.freeze([
				"⚔️ PAINTED BATTLES BY DEFAULT — every fight now plays out on the painted battle stage, with painted creature art and motion, above the Combat Chronicle. Add `?battle2=0` to the address to watch the Chronicle alone.",
				"📚 COMPENDIUM FILTERS AND SHELVES — sift the Compendium by kingdom (Fauna, Flora, Fungi, Microbes) and rarity (Rare+, Legendary+, Mythic+), or turn on ▦ Shelves to fold it by habitat.",
				"↗ ORIGIN TRAVEL — a wild catch's page flies you back to the world where you first catalogued it.",
				"🎧 MONO AUDIO AND REDUCED INTENSITY: Two Creature voices settings offer the same sound in both ears and a quieter, gentler mix. Both are remembered on this device.",
				"🔔 MARK ALL READ AND CLEAR ALL: Notifications can mark every entry read in one press and clear its history with a two-step confirmation.",
				"⚙ BATTLE SOUNDS AND CONFIRM SALVAGE: Turn battle hits and effects off without muting creature voices, and choose whether salvage asks first.",
				"📂 FOLDED SURVEY CARD: An option in Settings folds environment and census rows behind remembered toggles. The survey card stays fully open by default.",
				"🎧 LISTENING REVIEW: The optional review page in built packages plays creature voices in a fixed order for Keep, Redo or Cut ratings you can copy out. Ratings stay on your device.",
				"📌 PIN A RECIPE: Pin an unbuilt recipe to track missing materials while gathering; its chip turns READY when you can forge it.",
				"🗺 PRIME CODEX TRAVEL: Return to a Signature’s source or track the nearest in-reach world with an unclaimed Titan.",
				"⚙ MORE SETTINGS: Reset expedition asks for confirmation. Pop-ups Off keeps the notification tray and screen-reader announcements; creature cues still reveal their counterpart. Tooltips support press-and-hold on phones.",
				"📖 ADVANCED BRIEFINGS: Five optional Guide pages explain v2 travel, resources, companion care, combat and progress, with links to the live manual. Browsing changes no expedition progress.",
				"📱 FAMILIAR CONTROLS ON EVERY SCREEN: Phones keep five icon-only scene buttons above four compact utility icons. Survey replaces the separate Charters shortcut on phones and larger screens; your objective opens the full Charters panel. Survey reopens the selected object or current landed world. Star charts stays available in Settings without a duplicate phone shortcut. Tablet and desktop use the production side controls, top-center Prime Codex and bottom-right utilities. Inventory opens from your full nameplate; gold selection and local Inter respect your font and larger-text preferences.",
				"🔔 MESSAGES KEEP THEIR PLACE: Notifications collects recent expedition messages and saves up to 50 with their read state. Opening the bell leaves unread messages unread; Mark read saves that choice. Messages shown while saves are protected remain clearly labelled for this session only.",
				"🫧 ONE GLASS LANGUAGE: Rounded name, health, objective and navigation controls carry the production layout forward. Text pills on larger screens fit their labels instead of stretching to uniform widths. Search sits in the upper-right corner on phones with a simple Search prompt. Your objective shares that right edge below Search, followed by Star Atlas and Shipyard on larger screens. A red heart accompanies Health and its exact count; bottom guidance is plain text with a dark letter outline for bright scenes, and the Current view readout is hidden.",
				"⚖ COMPARISON TELLS THE WHOLE STORY: Inventory opens from the shelf nameplate, keeps a bounded 48-row page, and gives one selected item a focus-owned detail sheet whose comparison includes every base and affix delta, conditional context, provenance, and equipped state. While the detail is open, current and newly mounted background surfaces stay inert and hidden from assistive technology; Close restores each surface’s exact prior state. On the narrowest phones, full item copy now reflows above its wrapping badges instead of being starved beside them.",
				"📱 PHONE FIRST, EVERYWHERE ELSE READY: Safe areas and measured top, context, and dock heights keep controls clear from 320-pixel phones through tablets, laptops, desktops, ultrawide displays, and short landscape screens.",
				"🪐 SHEETS KEEP THEIR ROOM: Panels share a title strip and sticky Close, scroll inside their own bounds, and clear measured guidance, captions and notices even with larger text. Keyboard scrolling leaves room below each sheet heading for its controls. Survey keeps its title and Close visible while details scroll above the biosphere. On crowded phones, notices use compact headlines; Notifications keeps the full messages. Scene instructions and captions tuck away when a sheet or biosphere needs their space, then return when room is available. Settings stays available above Field Training; closing it returns you to the lesson without changing your progress.",
				"↔ SHORT LANDSCAPE KEEPS EVERY COMMAND: Opening the Compendium now gives its variable-height rows a full safe-height left workspace while Search, Survey, and the dock remain visible and usable in a separate right column. Its heading shares the reserved Close row instead of spending a second header row and clipping the list.",
				"⌨ THE SKY ANSWERS EVERY INPUT: Pointer, touch, wheel, pinch, and keyboard explorers share the same survey outcomes; arrows cycle visible bodies, Enter or Space surveys, plus and minus zoom, and Escape releases focus or rises one level.",
				"♿ ACCESSIBILITY IS PART OF THE SHELL: Text size, text tone, font, panel tint, visible focus, forced-colors treatment, minimum 44-pixel actions, named controls, focus restoration, and true reduced-motion behavior are built into the live surfaces.",
				"⚙ GRAPHICS CHOICES NOW CONTROL THE SKY: Saved Visual Effects and Screen Shake controls are live. Effects Off allocates no frontier fog particles; reduced motion and low-tier devices keep bounded static atmosphere; full capable devices animate capped fog, blazar bloom, and bright-star breathing. Screen Shake adds only a short deterministic planetfall impulse when Effects, Shake, and full motion are all enabled. Magnetar systems now show their two static blue magnetic-field arcs around the core, matching their distinct Survey artwork. Protostars show their tilted dusty birth disk and warm core instead of an ordinary stellar surface. Trinary systems now show all three generated stars instead of drawing only the primary and one companion.",
				"🧪 BUILD IDENTITY STAYS IN THE GUIDE: The development page shows Celestial Frontier v2.0 plus its full source commit inside the Guide, without covering the playable sky with a floating DEV badge.",
				"🔄 UPDATES WAIT FOR YOUR COMMAND: Installable builds place an accessible App status disclosure at the end of Settings with minimum-size Check for updates, Activate update, Reload when ready, and Roll back actions plus polite status announcements. A verified update never forces a reload, rollback changes app files rather than expedition data, and a verification failure leaves the current offline build unchanged.",
				"🔔 UTILITIES STAY TOGETHER: Desktop notices and utility panels clear the measured bottom-right utility controls and share their right edge, keeping Records, Notifications, Guide and Settings together as the window changes size.",
				"🏅 EVERY EXPEDITION HAS A RANKED RECORD: Records renders the exact ten ranks from Cadet through Eternal Frontier, all six score factors, and all 96 achievements across 13 shelves. One nonoptimistic aggregate refresh can durably add the 68 aggregate milestones and permanent best-rank record; exact-event rows remain locked until their true owner fires. Twenty-six exact joins now belong to their true actions: Earth landing, world or companion Rename, Legendary-pair successful Breed, first verified conquest settlement, settled explorer injury below 20 HP, valid-world Share, accepted CF1 Follow, twelve source-derived Survey observations, wormhole/quasar/dwarf-galaxy travel, first explicit Atlas Favorite, safe explorer Flora healing, a safe above-40%-risk Flora meal, and any hostile Discover Life encounter whether the Field Scout or explorer takes the nonlethal wound. Accepted Follow folds its route, Jumps, galaxy visit, wayfarer, and any proved quasar/dwarfg event into one receipt; ordinary navigation cannot counterfeit Follow. Exactly two event owners—daily and decade—remain open. Records also houses the Binder’s six established type pages and eight current-proof Set claims. One completed unclaimed Set pays its established 25–150 Stardust, updates lifetime earned, records the claim, and refreshes achievements and rank in one receipt and one compare-and-swap with no retry or optimistic reward; the Fifty-Paragon hunt is live, and prior Set claims remain claimed. Missing silhouettes plot their source-proven homes, while found entries use Inspect to open the exact Compendium record without travel. Seeker of Legends is a separate Binder Claim at ten exact Paragons for 120 Stardust once; a sighting never pays that Set reward automatically. Its read-only Expedition Chronicle & Museum projects four escaped, independently ordered, at-most-60-row galleries from already-owned facts: latest-receipt Battle Chronicle, canonical first-species Discovery Museum, Signature-ordered Prime Victories without invented dates, and latest-first Legacy Journal. Protected authority yields one protected panel; the Museum creates no writer, reward, RNG, save field, mission, share card, or global cross-gallery timeline. The top bar shows the player name and rank in its earned permanent color or Eternal Frontier foil. Only a post-action durable promotion announces the new named rank—boot catch-up stays silent; a newly durable post-action achievement likewise announces only after commit. Achievement ceremonies use the authored name and description with a tier-3 sting; rank promotion uses a tier-5 sting and an at-most-40-particle gold burst that the effects, motion, and device budget may lower. Presentation ceremonies keep durable action order: an older queued achievement or rank ceremony waits intact behind the current receipt-bearing product action, then resumes only after that action’s own result is published. Replay, already-durable recovery, Training, convergence, and refusals stay silent, and ceremonies never write or reward. Settings → Nameplate offers Auto/current-rank or any permanently earned rank color through one receipt-bearing compare-and-swap with no retry or optimistic color change; locked choices refuse and durable ambiguity reloads instead of applying twice. Settings → Explorer name → Change name uses the shipped sanitizer and 24-character cap, changes only the explorer name, makes cleaned-empty or unchanged input receipt-free, and settles through one receipt-bearing compare-and-swap with no retry or optimistic name; durable ambiguity reloads instead of applying twice. Explorer self-rename deliberately does not grant the discovery-name namer achievement. Achievement rewards remain open.",
				"✕ ONE SURFACE, ONE CLOSE: Every panel and Survey card owns exactly one 44-pixel top-right Close action with a reserved content gutter, so refilling or scrolling a surface cannot duplicate it, detach it to the upper-left, place another control beneath it, or strand keyboard focus behind a hidden surface. Panel titles keep an opaque backing over scrolling rows, including the space above and beside the title. Spacing inside the side navigation belongs to its controls and leaves the active panel open; a genuine empty-sky press still dismisses it.",
				"🖥 SHARP WHERE IT COUNTS, RESPONSIVE WHERE IT HURTS: Native backing is preserved through UHD, while larger displays use a deterministic capped tier that keeps the live scene answerable without allocating two full-resolution 8K canvases."
			])
		}),
		Object.freeze({
			category: "Gameplay",
			bullets: Object.freeze([
				"A returning companion earns XP and bond memories; its first long mission to a world leaves a memento.",
				"⛏ HARVEST YOUR WORLDS: A conquered world offers Harvest on an active-play cooldown. Moving the device clock cannot speed it up.",
				"🍽 TASTE DECIDES THE MEAL: Companion feeding is deterministic. Loved, neutral and disliked food have distinct, previewed growth and healing outcomes.",
				"🛠 CRAFT ×5: Fabricator parts and components can forge up to five times. Each craft is its own saved result and the batch stops at the first refusal.",
				"♺ SALVAGE ALL: A confirmed action salvages unequipped, unprotected Common and Uncommon gear, excluding relics. Its confirmation also offers Don’t ask again.",
				"🗓 WEEKLY CHARTERS KEEP THE EXPEDITION’S OWN TIME: Once the five trades are learned, three Weekly Charters appear and a new board arrives every four hours of play. The board runs on the game’s own active-play clock, so changing the device clock never resets or advances it; each counts only deeds done after you accept it and pays once.",
				"🚀 SURVEY BEFORE YOU TRAVEL: One selection opens a card; explicit Enter galaxy, Enter system, Land, and Leave world actions make descent deliberate on mouse, touch, and keyboard instead of depending on a second tap or timing window.",
				"🔗 WORLD CODES KEEP THE WHOLE DESTINATION: CF1 addresses preserve galaxy, star, planet, coordinates, and accepted custom names. Landing history and names follow that complete identity, so different worlds that happen to share a planet seed remain independent. A valid-world Share first settles its Shares record and one-time share achievement before the independent clipboard copy/fallback result. A submitted CF1 earns Follow only after its route is source-proven, reach-authorized, and accepted; that accepted saved route, Jumps record, and wayfarer achievement settle with its galaxy visit and any source-proved quasar or dwarf-galaxy event in the same receipt. Ordinary direct navigation cannot own Follow, Jumps, or wayfarer, but still owns its source-proved arrival and galaxy-event aggregate. Each action uses one receipt and one compare-and-swap with no retry or optimistic record or route; durable ambiguity reloads instead of applying twice. A named planet code now settles its accepted custom world name first, then lets Follow own the joined route and progression without an intervening catch-up writer. A successful Follow still uses its single receipt; a post-name route that refuses or otherwise does not join progression queues exactly one later bounded catch-up for the already-committed name. Every accepted galaxy, star, or planet route is regenerated from the seeded universe and source-verified instead of trusting the code. A stale or forged code leaves the current view unchanged and keeps the exact query unchanged. An in-reach planet address returns to Survey without bypassing Land; an out-of-reach address leaves the explorer in place. A star beyond owned ship reach stays blocked until Engineering builds the required permanent system. Saved Prime Signatures separately gate galaxy distance; verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier.",
				"🧭 THE ATLAS LEADS BACK: Star Atlas restores semantic List and Chart views plus All, Favorites, Visited, Conquered, and Life filters. Overlapping Chart targets become one large control for a bounded exact-destination list, with Return to Chart restoring focus and no automatic travel. Chart coordinates come only from source-proven route sidecars, the current view has its own marker, canonical world-key history keeps same-seed worlds independent, and only legacy p-seed rows use preserved seed facts. Charted galaxies, stars, and worlds can reopen their own navigation level only after the saved route is regenerated from the seeded universe and source-verified; a proven planet entry returns to Survey and Land remains explicit. Stale, forged, or incomplete rows remain visible but disabled with an honest unavailable label. Favorite, Home, and Remove each settle one exact row through one receipt and one compare-and-swap with no retry or optimistic publication. Travel Home remains honest when its route is unavailable. Remove preserves every survivor and offers one eight-second Undo that restores the exact pair, source position, Home state, and present-or-absent route sidecar; another Atlas mutation, route-identity change, or convergence reload expires it. Accepted Atlas, Search, and CF1 arrivals may paint the same deterministic, skippable hyperlane streak overlay after the route publishes. Unresearched travel keeps the established baseline; Fusion, Antimatter, and Warp Fold use 2×, 4×, and 8× speed bases, with equipped travel-speed gear added to the active base. Effects, Motion, and device limits may reduce or omit the treatment without delaying or changing the destination.",
				"🔎 SEARCH UNDERSTANDS DISCOVERIES AND ADDRESSES: The top-bar field filters imported Compendium life and accepts CF1 world codes, with an exact selected-text fallback when browser clipboard access is denied.",
				"🐾 DISCOVER LIFE AND CAPTURE HAVE HONEST LIMITS: A living planet’s Survey card offers explicit Discover Life before or after landing. Ordinary inspection stays write-free. On ordinary worlds, the action records that exact world and resolves one shown deterministic hazard without cataloguing a species or spending Biosphere Yield. At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record. It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield. Repeat sightings add no duplicate record or discovery reward. Conquered and otherwise safe worlds cause no wound. Reinforced Hull reduces hostile damage by 25% before worn bioscan protection; an assigned Field Scout intercepts the nonlethal wound at no worse than Critical, otherwise the explorer remains at or above 1 HP. Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound; safe scans do not. Capture remains a separate landed action. Tame chooses uniformly from eligible fauna in the full biosphere, Scavenge from flora and fungi, and Sample from microbes—not only the at-most-eight-row preview. Equipped capture-chance gear adds 1.5 percentage points per point before the 95% overall ceiling, capped at +25 points; first contact remains unavailable. All three share one finite Biosphere Yield; every hit or miss spends 1, and the pool recovers at the next 20-minute active-play cycle, never from closing the game or changing the wall clock. A hit removes that species from its action pool for the cycle; a miss stays eligible. The first successful observation adds one Compendium page plus one owned creature for Tame or one specimen lot for Scavenge and Sample. A Legendary-or-better first find also awards its one Rare Find Stardust bonus. A repeat adds another creature or lot without another page or first-find reward; a miss adds none. The first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction; a miss, Sol, repeat, stale tab, or failed write banks nothing. That Chapter 2 milestone is separate from Discover Life. An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt, including its established Earpiece reward; older Surveys and capture do not count. Weekly bioscan Charters remain protected until their separate lifecycle is complete. Narrow companion Feed, nonlethal Breed, exact-instance Rename, requested Listen, and Field Scout selection are available from a real fauna detail; Passive evolution remains unavailable. companion missions are live. Care, bond memories and friendly duels are live.",
				"🐕 ONE EXACT FIELD SCOUT, NEVER A GUESS: A real fauna Compendium detail names, switches, or stands down one exact owned companion through bounded 24-row pages; same-species twins remain separate by stable instance identity. Assigned, recovering, and injured companions stay eligible because the selector itself changes only the Scout pointer. One exact-five compare-and-swap settles the role with no RNG, retry, or optimistic publication. Refused, stale, failed, and unconfirmable writes change nothing visible and cannot apply twice. The standing Scout intercepts hostile Discover Life damage in that bioscan’s own save and remains at or below Critical. When a later successful Tame, Scavenge, or Sample catalogues a genuinely fresh species, the Scout standing before the attempt earns up to +2 XP in the same capture transaction, capped at 486; 485 gains 1, the cap gains 0, and a capture with no standing Scout, a miss, or a repeat species grants no Scout XP. Each exact owned twin also retains its own XP, level, class, wounds or Recovery, name, and deterministic innate combat arts; innate slots unlock at levels 3 and 6. Companion missions, care and bond are live.",
				"⚔ ONE WORLD, ONE VERIFIED DUEL: A landed non-Training Surface now lets the explorer, an eligible ordinary owned-fauna companion, or a live captured Guardian or Titan challenge its deterministic Elemental Titan, Apex Guardian, or strongest fauna after an exact 160-run forecast. One immutable receipt and one compare-and-swap settle one deterministic duel with no retry, reroll, or optimistic result. Only after exact durability is verified, an accessible timed Combat Chronicle opens with named transcript rows, two HP meters, settled statistics and result. Skip stops active combat sound and completes the remaining transcript silently; Share battle log copies plain text or selects the exact log in a visible fallback without granting the world-Share achievement. Every already-modelled registered initiative, dodge, stun, impact/critical/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motif owns an exact visible-caption counterpart. Composite events remain one voice and at most two combat voices overlap. Master Sound—not Creature voices—governs playback; Close, Skip, hidden/replaced presentation, route loss, counterpart loss, or Sound Off stops playback. Authored or recorded combat assets, ambience, and music remain unavailable. A verified win conquers the world once, awards exact tier-scaled Stardust and fauna XP, and persists injury; player defeat keeps a 1 HP mercy floor, a bred fauna loser returns through active-play Recovery, and a wild-caught loser returns through active-play Recovery. Captured Guardians and Titans return through a separate combat-only companion record rather than ordinary Arc 5 ownership. They use the same forecast, Chronicle, registered audio, win-XP, exact loss-XP, and injury path; XP and injury survive reload. Regardless of lineage, defeat assigns a temporary Recovery lock. The champion remains in the composite Compendium and returns to the combat roster when active-play Recovery ends; reload, Training restore and capture reconciliation preserve that lock. They gain no Arc 5 care, breeding or missions; a combat-only Recovery overlay controls their availability. Defeated Guardians and Titans join the Compendium with battlefield modifiers stripped; a Titan win claims its Prime Signature, and the ninth distinct claim unlocks the Frontier. Prime claims remain independent of later champion use. Chapter 2 conquest and the settle1 achievement bank in that same save. If starter st-conq is accepted, the verified conquest also removes it from accepted work, records it complete, adds +25 current and lifetime-earned Stardust, and honors one Charter. Accepted wk-conq refuses before combat because its weekly lifecycle owner is missing. Authored extra Guardian Gear or material caches remain open; a world whose legacy 40% conquest-imbue gate would fire stays blocked until that modifier can coexist with natural and Pureforged gear. Guardian and Titan fights offer up to three fighters, stances, Auto or Command, and offered Hold, Swap or Withdraw choices; ordinary wild fights stay Auto. Defeat applies active-play Recovery with no added defeat wound. Broader Guardian care, breeding and missions remain open.",
				"🔊 CREATURE CALLS ARE YOURS TO REQUEST: Open a real owned-fauna Compendium detail and choose Listen on an exact companion to hear its stable deterministic call. Browsing, filtering, focusing, and returning through the Compendium never auto-play it.",
				"🪐 HEAR A LIVING WORLD WITHOUT SPOILERS: A living world’s pre-landing Survey card and landed Planetside both offer Listen to biosphere. Their quiet generic ecology pulse appears only while that exact surface’s biosphere lead is visible; it never names a hidden species, spends Yield, grants a discovery or reward, or changes the save.",
				"🌿 TWO EXACT MEAL PATHS, TASTE-LED CARE: A real fauna Compendium detail can Feed one exact unassigned owned companion below the 200-Meal cap from one exact owned flora lot through Use 1. Same-species twins remain separate; companions with an active assignment or Recovery timer and capped companions stay disabled and explain why. One receipt-bearing compare-and-swap raises Meals by 0 to 3 and removes exactly 1 flora, emptying that exact lot on its final unit, with no retry or optimistic change. A committed Feed requires its trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status, then may produce one deterministic synthesized acknowledgement after that status appears; refused, stale, converging, replayed, hidden, route-lost, counterpart-lost, and older results remain silent. Companion Feed resolves taste, Meals growth, wound mending and first-time XP in one inventory spend: loved meals grow and mend, neutral meals grow and mend less, and disliked meals are harmless; first tastes build bond memories. Separately, a real Flora detail previews the explorer’s healing, poison risk, and deterministic nourished stat, then Eat 1 consumes the canonical exact owned specimen in one receipt-bearing transaction. A safe meal restores shown HP with worn healing gear, raises the stat up to 330, gains +1 nourishment from Xenobotany, and recomputes maximum HP after Vitality; a toxic meal grants no healing or stat and leaves the explorer at or above 1 HP. Safe healing owns fieldmedic, and a safe meal above 40% poison risk also owns gambler, in that same save. Refused, busy, stale, and failed writes consume nothing; durable ambiguity reloads read-only and cannot eat twice. Companion Breed remains separate; Rename is identity-only; Field Scout can intercept hostile Discover Life injury. Friendly duels and companion missions are live.",
				"🧬 TWO PARENTS, ONE DURABLE OUTCOME: Breed is now available from a real fauna Compendium detail. Choose one exact owned companion of that detail’s species and one distinct exact owned fauna mate; same-species twins remain separate, every eligible candidate stays reachable through bounded 24-row pages, and exhibition, mission-assigned, recovering, or 30%-hurt companions explain why they cannot participate. The shown chance uses both established rarity tiers plus a bounded lifetime-earned Stardust bonus without revealing raw genetic values. Parents are never consumed. Success creates one deterministic child with +2 XP and gives both parents 8 active-play minutes of Recovery; the first successful union of each canonical unordered species pair gives that child another +5 XP. Renaming or reversing the parents cannot re-arm that claim, and imported v1 pair claims and their archive remain authoritative; failure creates no child and gives both 2 active-play minutes of Recovery. Recovery blocks Breed, combat, and dispatch and never advances from closed-game time or a changed wall clock. Both complete save outcomes—including exact Charter progress—are proved before the one draw; the action then uses one immutable receipt and one compare-and-swap with no retry or optimistic child, XP, pair claim, or Recovery. A successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save; a failed pairing, refusal, stale result, or failed write banks nothing and grants no Charter credit. An unconfirmable durable result locks read-only and reloads so it cannot breed twice. Back and Close remain available. Parent consumption and manual genetics remain unavailable; care, bond memories and companion missions are live.",
				"✎ ONE COMPANION, ONE DURABLE NAME: Rename is now available from a real fauna Compendium detail. Choose one exact owned companion from bounded 24-row pages; same-species twins remain separate by stable instance identity. Assigned, recovering, and injured companions may be renamed because this action changes identity only, while exhibition, non-owned, protected, and revision-exhausted rows refuse. The shipped policy strips angle brackets, ampersands, quotation marks, and apostrophes, trims whitespace, and caps the result at 24 characters; a cleaned-empty or unchanged name consumes no receipt or write. A committed rename changes only that exact companion’s nickname—never its species, genome, traits, lineage, assignment, condition, bond, catalogue alias, or another twin—and keeps the old name visible until durability is verified. One immutable receipt and one exact-five compare-and-swap settle without RNG, retry, or optimistic publication. Stale, duplicate, storage, carrier, and postcommit faults change nothing visible and converge read-only through reload so the name cannot apply twice. Back and Close remain safe during settlement.",
				"🔒 THE FRONTIER HONORS YOUR PROGRESS: Owned Jump Drive, Long-Range Array, and Intergalactic Drive systems—with compatible Charter state—gate star travel; successful fixed fabrication can extend that reach immediately. The Prime Codex presents all nine established Signatures with their exact Titans, lore, hunt, reach, and claimed state. Saved Prime Signatures separately gate galaxy distance, verified Titan victories can claim new Signatures, and the ninth distinct claim unlocks the Frontier. Prime completion exposes the five established choices—Sovereign of the Frontier, Warden of Life, World-Shaper, The Unseen Hand, and Prismatic Pathfinder—while the Balance path additionally requires three conquered worlds, the Electric Signature, and 40 catalogued species. One ending receipt and one compare-and-swap write only the ending record, cannot overwrite a prior choice, never retry or publish optimistically, and preserve unknown imported ending evidence. The galaxy remains open afterward; later Legacy consequences remain unavailable. A blocked destination never moves the camera or quietly skips the requirement, and chapter progress alone never invents a system or Signature.",
				"🪐 FIRST PLANETFALL COUNTS: Only a world’s first landing banks the live landfall objective and visible worlds-landed Record; revisits bank and pay nothing. Sol-versus-beyond-Sol Charter credit follows the complete verified galaxy, star, planet, and source ordinal, so a matching planet seed elsewhere cannot impersonate Sol. Chapter 1 Mine credit likewise requires the exact home-galaxy, Sol-star, dead-world, coordinate, and source-ordinal hierarchy; the same dead-world seed elsewhere cannot advance it. Successful Mine presses, fixed Fabricator outputs, one successful Breed, a qualifying capture on a source-proven world beyond Sol, and verified Conquest now bank only their exact Charter goals, while Research and Skim bank neither. Mine, Skim, and Fabricator compatibility counters persist, but the visible Records board does not list those Arc 3 counters as separate totals yet. Any successful Land, Mine, Fabricator, Breed, qualifying capture, or Conquest commit may reconcile an imported Chapter only when canonical progress and owned reach already prove it.",
				"🛬 DESCENT DISCLOSES ITS RISKS: An unfamiliar world uses its authored type and biome odds, seeded weather, worn landing gear, and exact-world approach learning. Before commitment, the Land button and visible note show chance, possible nonlethal HP cost, and the learned bonus. A failed approach stays in orbit and teaches only that exact address; successful arrival clears its wave-offs. Earth, Training, and known-world returns are safe, and any 100% approach shows guaranteed arrival with zero descent damage risk. One lease-fenced receipt settles the outcome, HP and canonical-address learning together; stale tabs and failed writes never publish a result.",
				"🧾 GEAR ACTIONS SETTLE ONCE: Equip, Unequip, confirmed Salvage, and pending-reward claim use the tab lease, save revision, exact item identity, and one immutable receipt. A double press, stale tab, failed write, or reload cannot duplicate or reroll the action; salvage follows the exact legacy direct-material-half return instead of inventing scrap or Stardust.",
				"🎓 FIELD TRAINING LIVES IN THE NEW SHELL: The current 16-card drill keeps six real navigation lessons for finding Earth, reading Survey, charting, opening the Atlas, and landing, then adds one isolated Iron Plate Forge practice and read-only Planetside, Engineering, Compendium, Records, Guardian/combat, and CF1 Share/Follow orientation. Training locks every live mutating board action and performs no capture, meal, breeding, rename, Field Scout change, persistent engineering transaction, or combat. Restart captures the exact pre-Training view. A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view; if verification pauses, that exact view stays saved, and when Sol can still be verified, Training returns there so a reload can restart safely and retry. Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured; every other expedition field is retained from the surrounding save. That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth. An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged; reload after updating."
			])
		}),
		Object.freeze({
			category: "Bug Fixes",
			bullets: Object.freeze([
				"🍃 A RESTING PARENT CAN EAT AGAIN: Breeding Recovery stops blocking Feed when its active-play timer ends. Companions still busy with Rest or another assignment remain unavailable.",
				"⌨ KEEP YOUR PLACE AS THE BOARDS REFRESH: Records, Star Atlas, and Charters preserve the current keyboard control without scrolling to it; an action that disappears or becomes unavailable returns focus to Close. A finished Favorite save no longer takes focus back after you move elsewhere. Queued saves also recheck current save, Training, import, and replacement permissions before preparing a write. Compendium keyboard selection keeps its focus ring inside each creature row in both the standard and pilot presentation.",
				"📱 PRIME KEEPS YOUR PROGRESS: Prime Codex retains its Signature count out of nine in the phone bottom row and the tablet or desktop top-center pill, with its full label on larger screens and the existing touch and keyboard protections.",
				"⏳ SETTLING IS NOT READ-ONLY: If one durable expedition action is still in flight, another mutating press now says that the action is settling and asks you to stay on that location. Read-only expedition is reserved for actual save-authority loss; inspection and Survey Close remain available.",
				"🐾 CAPTURE ACTIONS STAY READY AFTER PROGRESS: When a durable Tame, Scavenge, or Sample also settles new achievement or rank progress, the still-open Survey now republishes its exact current Biosphere actions after that follow-up receipt releases. Eligible actions no longer remain disabled until a later heartbeat or card reopen.",
				"⌨ ENGINEERING KEEPS YOUR PLACE: Activating Research or Fabrication with Enter no longer lets the browser drop focus onto the page while the action settles. The exact row now keeps keyboard context; a completed Research stays on its result, and a still-available recipe returns to its exact action without stealing focus after the explorer moves elsewhere or closes the section.",
				"💾 PROTECTED MEANS PROTECTED: Sparse, corrupt, transiently unavailable, and newer-build saves are classified before promotion, and a recovery backup is proven safe before it can replace the primary. Promotion and recovery now recheck the exact primary, backup, revision, and lease evidence immediately before writing, so a newer tab cannot be overwritten by a result proved against older bytes. A source-valid saved destination that is no longer authorized repairs only its location to Cosmos and preserves the rest of the expedition. While storage is protected, every ordinary save-mutating preference and Training control—including Creature Voices—remains inspection-only; a protected reload is the only recovery path. Protected Engineering likewise keeps the independently capability-derived current-ship preview available for inspection while suppressing every authority-dependent detail and action. If authority is lost while Shipyard is already open, it immediately becomes preview-only; the protected reload remains scheduled even if that repaint fails. Invalid or future backup bytes cannot destroy the evidence they were meant to recover.",
				"🌱 EVERY EXPLORER STARTS FRESH: v2 begins a brand-new expedition for everyone. The v1 “Bring expedition” save-import door is gone from Settings, so only your own play can change your live save; while storage is protected, a protected reload is the only recovery path. Expedition replacement still cancels and drains queued preference writes and claims one exclusive reload transaction, so an older save cannot overwrite a newer one or another flow’s rollback.",
				"🧷 CARDS ACT ON WHAT THEY SHOW: Land, Atlas, Share, and travel actions bind to full composite identity, preventing an equal seed at different coordinates from inheriting stale controls.",
				"🗺 OLD ATLAS ROWS NO LONGER PRETEND: Imported entries with incomplete legacy coordinates stay visible but disabled, rather than offering a travel action that cannot resolve its destination.",
				"📎 COPY FEEDBACK TELLS THE TRUTH: Clipboard denial no longer reports success; the exact world code is selected in Search with a browser-copy instruction.",
				"📋 THE CHARTER STOPS AT THE LIVE FRONTIER: The primary chip and Charter board show only landfall, mining, fixed-fabrication, successful-breeding, first-world alien bioscan, and conquest goals with real outcome writers. The board exposes the two established starter chains one unfinished link at a time, requires Accept before tracking, and caps incomplete accepted work at three. Exact writers cover first planetfall beyond canonical Earth, one Mine, a non-null Field Scout assignment or switch, verified conquest, full-address Mercury, Mars, Uranus, or Neptune landfall, five manual Mine presses on Jupiter or Saturn, and any canonical T2 component. Full-address Sol hierarchy is required; a matching leaf seed elsewhere earns nothing. Each supported completion pays its established 10–25 Stardust once in the same receipt, and supported gear uses the exact inventory carrier with empty-slot auto-equip only. A successful offspring banks its exact Chapter 3 milestone in the same durable Breed transaction; failure banks nothing. A verified conquest banks Chapter 2 conquest and can honor one accepted starter st-conq for +25 Stardust in the same combat save. An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt; older Surveys and capture do not count. Accepted wk-conq remains fail-closed because its weekly lifecycle owner is missing; wall-week, slate, acceptance, and rollover authority must all be complete before weekly work can settle. Weekly rewards remain unavailable instead of being presented as settled work.",
				"📋 COMPLETE IMPORTED CHAPTERS MOVE AGAIN: Saturated veteran Charter records no longer wedge. Any successful planetfall acknowledges every consecutive already-proven, reach-backed chapter without rebanking or inventing progress, while incomplete or unpowered records stay put.",
				"🎓 A LESSON OWNS ITS ESCAPE KEY: Active Field Training keeps the navigation and Survey state needed by the current step instead of ascending or closing the only required action. If Survey is rebuilt while a lesson owns it, the new Land and Atlas actions inherit the same keyboard, focus, and pointer scope before they can answer. A wrong-world detour keeps only its real Close available, and Escape dismisses it without abandoning Sol or the lesson.",
				"🎞 REDUCED MOTION ACTUALLY STILLS THE SCENE: Visual animation clocks, camera easing, fades, and decorative scene transforms stop or settle instead of leaving the most expensive motion running behind a preference.",
				"🌈 RARITY IS NOT A SPECTRAL CLASS: Survey cards no longer show a player-facing Spectral class row. Galaxies and stars show plain Rarity immediately; planets reveal plain Rarity only after landing. The Compendium now speaks the same ten-name Common-to-Transcendent ladder in both its list and detail card, including deep raw grades, while malformed legacy records invent no grade. Canonical rarity hues now sit on an opaque reading badge so even Exotic stays legible over bright glass artwork. Seeded spectral color remains internal art data, and real stellar G/K/M/remnant classification remains astronomical identity.",
				"🖥 RELOADS RELEASE THE OLD SKY: Training restart, Training recovery, and storage recovery stop and release the outgoing renderer and full-size canvases before the replacement page starts, preventing overlapping scenes and very-large-display starvation.",
				"↔ RESIZING KEEPS YOUR PLACE: Density and viewport changes refresh canvas, pointer, Survey, and backdrop geometry while preserving the current location and open card, including same-backing 8K-to-5K transitions. Resize bursts settle at most once per animation frame and density-only work never creates a save write.",
				"🦋 COLD PLANETSIDE ART NO LONGER FREEZES THE DECK: Loading and painting the first specimen thumbnails now happens away from the renderer thread, so Search, navigation, and browser controls stay answerable while neutral tiles fill in; the globe starts at the resolution its fitted size needs and upgrades only when real zoom or display density asks for a sharper tier. Species and biome workers are still created only when their art is requested, but each now owns one complete verified module response—there is no later painter or vista file for a first-install service-worker claim to strand. Production rejects any split worker graph, update and mixed-build requests remain fail-closed, and a real worker failure keeps its exact bounded diagnosis.",
				"🔊 A NEWLY TAMED CREATURE CAN GREET YOU: The greeting compared two different save revisions and treated a valid capture as stale. It now follows the committed creature record while keeping stale results silent.",
				"🌧 AURORAS RESPECT THE WEATHER: Canonical magnetic-field identity is preserved, but rain and snow once again suppress the aurora overlay instead of painting both at the same time.",
				"🌐 ALIEN YEARS AGREE ON EVERY DEVICE: Generated non-Earth civilization years now use deterministic ASCII comma grouping instead of the device locale. Earth keeps its authored Year 2026 CE, while the numeric year, RNG chronology, and every other generated field remain unchanged.",
				"🪟 A FAILED VISTA CANNOT POISON THE NEXT VISIT: Malformed worker results, throwing bitmap cleanup, context loss, and failed Pixi mounts now stay fail-soft; an unmountable cached canvas is evicted and a new canvas is committed only after it mounts successfully."
			])
		}),
		Object.freeze({
			category: "Under the Hood",
			bullets: Object.freeze([
				"🌐 READY FOR OTHER LANGUAGES: the Settings panel now draws its words from a translation table (English unchanged); more screens follow.",
				"📱 DEVICE CHECK: a hidden page (?deviceProbe=1) measures how smoothly the painted battles run on your phone, over a longer stretch as it warms up, and what the painted art keeps in memory, and gives you one block to copy. It sends nothing anywhere.",
				"🎧 All sound is original and generated on the device — nothing downloaded, no recordings, no AI audio; the hidden Listening page now reviews every sound in the game.",
				"🔬 DEVICE PROBE: The optional device probe checks Opus and AAC decoding from hash-checked samples and reports which formats work on this device. It does not silently select or download new production sound sources.",
				"🐾 CREATURE MOTION STUDIES: Fish and snakes carry travelling body waves, while walking insects and spiders spend longer on supporting feet and centipede steps ripple along the body. Existing painted artwork is preserved; the motion study remains separate from release and full biomechanical qualification. The painted battle preview checks its bundled art identities without downloading painter masters, and switching matchups keeps the main game renderer alive.",
				"🧱 A MODULAR CORE UNDER ONE UNIVERSE: Deterministic domain facades, strict root and app TypeScript programs, Pixi rendering, and IndexedDB persistence form the current playable Phase-4 foundation without changing seeded world identity. One versioned, digested 43-key domain biome-profile authority binds the exact current-world roster environment fingerprint to art and to a pure already-surfaced distant-ecology plan. A strict playback join accepts only exact visible inhabited-biosphere evidence and renders one generic deterministic neutral signal; it writes no save, spends no Yield, and reveals no species.",
				"🔐 ONE DURABLE AUTHORITY AT A TIME: Versioned split-store saves, a per-document tab lease, revision fences, immutable receipts, an active-play-only clock, and isolated SessionRNG counters commit product state together. A lease-storage failure or rejected repository-revision read immediately stops eligibility and accrual and converges through protected reload instead of silently reacquiring; a losing tab cannot rebase, and a failed transaction publishes neither the reward nor its entropy advance.",
				"🔢 THE REVISION CEILING FAILS CLOSED: The maximum safe revision remains readable, but a mutation that would overflow it returns a typed protected outcome before changing product rows, receipts, F4 state, or revision bytes.",
				"🌐 BROWSER UPDATES ARE PROVENANCE, NOT BASELINES: Local Chromium-driving art and layout tools resolve an explicit or installed compatible Edge/Chrome executable across macOS, Windows, and Linux. Before art evidence, the connected browser must report complete Chromium-family identity, version, executable, revision, user agent, JavaScript, and CDP 1.3 provenance. Any compatible point version is accepted and never demands a visual rebaseline by itself.",
				"📦 ART ARRIVES WHEN IT IS NEEDED: Species art loads on demand. The read-only Compendium supports up to 1,500 logical entries while mounting the visible viewport plus half a viewport of overscan on each side (about two viewports total), plus at most the focused pinned row; each visible row moves from a neutral placeholder to an exact 132px thumbnail keyed by the complete genome. Search filters the logical count, Back restores the saved row and focus, and Close returns focus to the exact opener. Planetside shares the same bounded thumbnail lease path, leases release with their visible owners, and only specimen detail publishes and retains an exact 440px portrait with gentle selected-image motion that stops when hidden, closed, or reduced motion is enabled; thumbnail scratch art is downsampled to 132px before it crosses the worker boundary. The worker keeps its immutable data-URL handoff, while the window converts only settled 132px thumbnails into revocable Blob URLs. Closed surfaces release their visible owners, evict unowned portraits, and retain only the 17 most-recently used unleased thumbnails for bounded warm reuse; live leases survive, reacquisition works, and invalid, dropped, oversize, duplicate, evicted, or finally disposed art releases its Blob ownership.",
				"🧵 ONE BACKGROUND PAINTER AT A TIME, OWNED END TO END: A dedicated worker is constructed only after a real owner and a serviced boot turn, with its complete portrait graph sealed into that exact worker entry so painting needs no second module fetch. One broker serializes work, deduplicates complete-genome keys, bounds caches and leases, validates every 132px/440px result, contains failed tiles, revokes stale bfcache work, and terminates an idle or replaced producer without a synchronous renderer fallback.",
				"🪐 HD SURFACES HAVE ONE NAMED OWNER: A named HD surface-planet texture attachment binds each completion to the exact surface generation and planet identity, retains the displayed predecessor until an acquired successor publishes, rejects stale work, suppresses same-texture swaps, and cancels and releases its timer and leases at the owning scene boundary.",
				"📚 HISTORY STAYS HISTORY: All 56 v1 releases and 398 legacy bullets remain byte-parity checked and separate from the v2.0 development bulletin; this draft cannot trigger the shipped-update popup or mutate the seen-release marker.",
				"🧪 THE TEST FLEET DRIVES THE REAL SURFACES: Determinism and parity checks, full TypeScript tests, one-attempt browser smoke, a 12-viewport responsive matrix, deliberate broken-build controls, and nine automated play lenses guard the development package. Closed Inventory panels retain their inventory, filter, and page state without keeping hidden item rows or dormant event subscriptions, and every registered panel opener shares one focus-capture owner. The memory ruler names the exact exceeded counter and cannot move merely because the browser received a compatible point update. Automated lenses still do not replace human play.",
				"🔬 RELOADS HAVE AN EVIDENCE CHAIN: Import settlement, renderer release, navigation commit, replacement boot, ready publication, and later page commandability are measured as separate ordered outcomes instead of one blind reload delay.",
				"❤️ THE BROWSER GETS A VOTE: Exact-page checks run beside an independent browser heartbeat, so a scene that cannot answer is reported as a product finding rather than hidden as a test timeout or retried away.",
				"🌐 DEVELOPMENT PUBLISHING STAYS PARKED: The owner-authorized, labelled PR battery can build, browser-check, and archive an exact-commit v2.0 preview package with full Guide identity, origin refusal, and byte inventory; it does not publish. The separate branch-site workflow remains manually parked, and production remains the v1.8.9 main-branch site."
			])
		})
	])
});
const V2_SHIPPED_RELEASES = Object.freeze([]);
function legacyView(release) {
	return Object.freeze({
		channel: "legacy",
		status: "legacy",
		version: release.v,
		title: release.title,
		date: release.date,
		sections: Object.freeze(release.sections.map(([heading, bullets]) => Object.freeze({
			heading,
			bullets: Object.freeze(bullets.slice())
		})))
	});
}
function v2ShippedView(release) {
	return Object.freeze({
		channel: "v2",
		status: "shipped",
		version: release.version,
		title: release.title,
		date: release.date,
		sections: Object.freeze(release.sections.map((section) => Object.freeze({
			heading: section.category,
			bullets: Object.freeze(section.bullets.slice())
		})))
	});
}
function v2DraftView(release) {
	return Object.freeze({
		channel: "v2",
		status: "draft",
		version: release.version,
		title: release.title,
		date: release.date,
		sections: Object.freeze(release.sections.map((section) => Object.freeze({
			heading: section.category,
			bullets: Object.freeze(section.bullets.slice())
		})))
	});
}
function getLegacyRelease(version) {
	return LEGACY_RELEASES.find((release) => release.v === version);
}
/** Mirrors the mature latest-popup rule: include the shipped patch's full minor line. */
function getLegacyReleaseLine(version = LEGACY_GAME_VERSION) {
	const shippedIndex = LEGACY_RELEASES.findIndex((release) => release.v === version);
	const start = shippedIndex < 0 ? 0 : shippedIndex;
	const minorLine = version.split(".").slice(0, 2).join(".");
	const line = LEGACY_RELEASES.filter((release, index) => index >= start && (release.v === minorLine || release.v.startsWith(`${minorLine}.`)));
	return Object.freeze((line.length ? line : [LEGACY_RELEASES[0]]).slice());
}
function getCurrentV2Release(currentVersion = null, shippedReleases = V2_SHIPPED_RELEASES) {
	if (currentVersion === null) return void 0;
	return shippedReleases.find((release) => release.version === currentVersion);
}
/** A draft can never be "unseen"; only an authorized shipped version can. */
function hasUnseenV2Release(seenVersion, current = getCurrentV2Release()) {
	return current !== void 0 && seenVersion !== current.version;
}
function getReleaseHistory(options = {}) {
	const includeLegacy = options.includeLegacy ?? true;
	const includeDraft = options.includeDraft ?? false;
	const releases = (options.shippedReleases ?? V2_SHIPPED_RELEASES).map(v2ShippedView);
	if (includeDraft) releases.unshift(v2DraftView(V2_DRAFT_RELEASE));
	if (includeLegacy) releases.push(...LEGACY_RELEASES.map(legacyView));
	return Object.freeze(releases);
}
//#endregion
export { GUIDE_CAPABILITIES, GUIDE_CATEGORY_IDS, GUIDE_TOPIC_SUPPORT, LEGACY_DORMANT_TOPIC_IDS, LEGACY_GAME_VERSION, LEGACY_GUIDE_CATEGORIES, LEGACY_GUIDE_SYNC, LEGACY_RELEASES, LEGACY_RELEASE_SYNC, V2_ADVANCED_BRIEFINGS, V2_CURRENT_RELEASE_VERSION, V2_DEVELOPMENT_GUIDE_CAPABILITIES, V2_DEVELOPMENT_VERSION, V2_DRAFT_RELEASE, V2_RELEASE_CATEGORIES, V2_SHIPPED_RELEASES, getCurrentV2Release, getGuideCatalogue, getGuideTopic, getLegacyRelease, getLegacyReleaseLine, getReleaseHistory, hasUnseenV2Release, searchGuide };
