/**
 * Canonical Guide data for the v2 browser app.
 *
 * LEGACY_GUIDE_CATEGORIES is an exact, source-derived snapshot of the mature
 * v1.8.9 Guide literal in celestial-frontier.html.  Keep the snapshot and the
 * hash contract together: guide-release.test.ts deliberately fails if either
 * side drifts.  V2 never renders legacy copy for a mechanic it has not ported;
 * GUIDE_TOPIC_SUPPORT supplies a current-slice body or an explicit unavailable
 * explanation instead.
 */

export interface LegacyGuideTopic {
  readonly id: string;
  readonly t: string;
  readonly k: string;
  readonly body: string;
}

export interface LegacyGuideCategory {
  readonly icon: string;
  readonly cat: string;
  readonly blurb: string;
  readonly topics: readonly LegacyGuideTopic[];
}

export const LEGACY_GUIDE_SYNC = Object.freeze({
  sourcePath: 'celestial-frontier.html',
  sourceAnchor: 'const GUIDE=',
  sourceSha256: '679d10915805e9559458a4319c94582e12e78ac10fd276c14febb8100331de50',
  categoryCount: 9,
  authoredTopicCount: 43,
  liveTopicCount: 41,
  sourceGameVersion: '1.8.9',
} as const);

export const LEGACY_GUIDE_CATEGORIES = [
{icon:'🚀', cat:'Getting Around', blurb:'Zoom, survey, search, share, travel', topics:[
 {id:'zoom', t:'Flying the universe', k:'zoom pan pinch scroll drag modes universe galaxy system surface navigate controls', body:
  '<p>The whole cosmos is one continuous view. <b>Pinch or scroll to zoom, drag to pan.</b> Zooming dives through four scales: <em>universe → galaxy → star system → planet surface</em> — and zooming out climbs back up. Everything you can see, you can visit.</p><ul><li>Tap any object to open its <b>survey card</b>; tap it again (or tap elsewhere) to release.</li><li>When a planet fills the view but sits off-center, keep zooming — the camera glides the rest of the way in. On a world you&#8217;ve never stood on, the dive stops at approach altitude and asks before you commit — see <span data-gt="landing">Landing</span>. Panning and pinching are never hijacked.</li><li>On a surface, you walk the world itself — the survey card stays pinned.</li><li>Travel beyond your charted frontier is gated — see <span data-gt="regions">Frontier regions</span>.</li></ul>'},
 {id:'survey', t:'Survey cards', k:'survey card panel tap inspect atmosphere climate water gravity descriptor lock pin land contact census glance ground', body:
  '<p>Knowing a world comes in three acts. <b>Glance</b>: on a computer, hovering shows the long-range reads — color class, atmosphere, water signatures, whispers of life (on a phone your tap goes straight to the survey). <b>Orbital survey</b>: tap to lock the card and the instruments speak — environment, biosphere, signals. <b>Ground survey</b>: <b>land</b> — press the card&#8217;s Land button, or dive toward the world and confirm the descent (see <span data-gt="landing">Landing</span>); planetfall opens the census of any civilization and the mineral veins of dead worlds. Every line is generated from the object’s seed, so your survey matches every other explorer’s.</p><ul><li>Tapping locks the card in place so you can press its buttons while the object drifts.</li><li>A planet&#8217;s card leads with its actions and headlines; the <b>Environment</b> row&#8217;s <b>expand</b> pill unfolds the full readings, and a civilization&#8217;s headline unfolds its census. Cards remember whether you like them open or folded — the ⟁ Signal row never hides, and a world you&#8217;ve stood on wears a <b>Ground-surveyed</b> tag.</li><li>An organized world announces itself from orbit as <b>⟁ signals</b> — land to attempt <b>first contact</b>. Most receptions are warm; a wary one wounds you (a named Field Scout takes the hit instead), and the census stays sealed until a landing goes well. Conquest never needs to ask.</li><li>Worlds with a biosphere show <b>Discover Life</b> — see <span data-gt="discover">Discovering life</span>.</li><li>The bookmark row saves the place — see <span data-gt="atlas">The Star Atlas</span>.</li><li>Every planet&#8217;s card names its <b>biome</b> — swamp world, carbon world, magma sea — and the rare kinds announce themselves in violet. A glance that whispers <b>impossible biosignatures</b> means something is alive where nothing should be.</li><li><b>Worlds of renown (v1.7):</b> the rarest worlds carry an epithet — <em>the Shrouded</em>, <em>the Ringed Court</em> — the same name for every explorer, forever. Rare near home; commoner in the deep field.</li><li>Stand on a world and its <b>mineral veins show their grade</b> for that ground (Primordial worlds enrich every seam one step), and an <b>⬆ Leave this world</b> button pulls the camera back to the system overview.</li></ul>'},
 {id:'landing', t:'Landing', k:'landing descent land wave-off risk success approach orbit scrape pity ramp weather storm', body:
  '<p>Setting down is the one moment the frontier pushes back. Every world sits somewhere on a ladder, from a calm approach that always works to a hostile dive that mostly doesn&#8217;t — the odds come from what the world is, and a storm blowing right now shaves a little more off. You see the number before you commit.</p><ul><li>Zooming into an unvisited world stops at approach altitude and asks. The <b>Land</b> button on a survey card skips the question — pressing it is the answer.</li><li>A failed descent is a wave-off: you&#8217;re bounced back to orbit with a scrape, never worse. It cannot kill you.</li><li>Every wave-off teaches the approach — your next try on that world is a fair bit better, and the lesson is remembered even between sessions.</li><li>Once you&#8217;ve stood on a world it is yours: return landings always succeed, no questions asked.</li><li>Earth is home. Home never waves you off.</li></ul>'},
 {id:'search', t:'Search', k:'search box find discoveries paste code lookup', body:
  '<p>The search box (top bar) hunts across everything you’ve already discovered: Atlas places and Compendium species. It also accepts pasted codes:</p><ul><li><b>CF1-…</b> world codes — jump straight to a friend’s discovery.</li><li><b>CFB-…</b> creature codes — load a friend’s creature for a duel.</li><li>Worlds bookmark under their biome — searching <b>swamp</b> or <b>carbon</b> finds every one you&#8217;ve saved since v1.3.5.</li></ul><p>See <span data-gt="codes">Share codes</span>.</p>'},
 {id:'codes', t:'Share codes (CF1 / CFB)', k:'share code link friend cf1 cfb copy multiplayer social', body:
  '<p>There is no server — the universe is mathematics, identical on every device. A share code is just an address into that shared math:</p><ul><li><b>⇪ Share this discovery</b> on a survey card copies a <b>CF1-</b> code/link. Anyone who opens it lands on the exact same world, with your name for it attached.</li><li><b>⇪ Code</b> on a creature card copies a <b>CFB-</b> code carrying the full genome — the identical creature, stats and all, appears on your friend’s device for a duel.</li></ul><p>Codes are sanitized on arrival; a tampered code can’t hurt your save.</p>'},
 {id:'charters', t:'Expedition Charters', k:'charter charters hunt board weekly goals task starter reward stardust chip week reroll tracker objective mainline ascent', body:
  '<p>The <b>Charters</b> board (the 📜 pill — left rail on desktop, dock on phones) always has work for an explorer. Charters arrive in <b>chains</b> that reveal one link at a time: the five <b>trades</b> (planetfall, prospecting, discovering life, naming a Field Scout, conquest) and the <b>Sol tour</b>, a guided lap of the home system that pays its way in starter gear. Completing a link reveals the next — and a link your ring can&#8217;t reach yet stays off the board until the sky opens.</p><p><b>Accept to begin.</b> A revealed charter tracks nothing until you press <b>Accept</b> — three may ride at once. Accept a deed the frontier has already seen you do and it completes on the spot, <em>already proven</em>; counting charters count from the accept and say so. Each pays <b>☄ Stardust</b> — some pay <b>gear</b> — the moment it completes.</p><p>Once the five trades are learned, the board turns weekly: three charters a week, identical for every explorer in the universe — deterministic, like everything else out here. Compare boards with a friend; they match.</p><p><b>The objective chip (v1.7):</b> the pill under the dock is a live tracker — your accepted charter first, otherwise the chapter&#8217;s next goal, with running progress that pulses when it moves. Tap it for the board. The pinned <b>Ascent chapter</b> above the charters is your mainline story: no accepting needed, it is always yours.</p>'},
 {id:'beacon', t:'Traveler’s Beacon', k:'beacon daily random destination five minutes', body:
  '<p>The <b>Traveler’s Beacon</b> (left rail) offers a fresh destination every <b>5 minutes</b> — always somewhere <b>inside your charter</b>: it walks Sol while Sol is your world, the Neighborhood once you can jump, the whole galaxy once the Array is up, and the wider cosmos beyond the Rim. Picked deterministically, so every explorer on your ring is pointed at the same place at the same moment. An easy way to see something new when the infinite feels too big.</p>'},
 {id:'atlas', t:'The Star Atlas', k:'atlas bookmark favorite home save place travel star log chart map visited undo', body:
  '<p>Your personal map of the infinite. On any survey card:</p><ul><li><b>+ Add to Star Atlas</b> bookmarks the place.</li><li><b>☆ Favorite</b> marks your best finds (and auto-saves them).</li><li><b>⌂ Home</b> marks one place as home — yours to change anytime.</li><li>The weekly pool now includes <b>Down the hard way</b> — land on a gas giant, a hothouse or a molten world. The descent will fight you; that&#8217;s the point.</li></ul><p>Open the <b>Star Atlas</b> (the dock — or the right rail on desktop) and tap any entry to ride the <b>hyperlane</b> there — the camera dives out, the sky stretches into a streak tunnel tinted by your destination’s light, and you ease in on arrival (tap to skip; obeys your effects and Motion settings). The Atlas keeps your most recent ~120 places.</p><p><b>Two views (v1.7):</b> the <b>📋 List</b> and the <b>🗺 Chart</b> — a star map plotting every charted place across the universe. Brighter clusters hold more of your finds, favorites wear rings, home carries its ⌂, and a quiet crosshair marks where you are; <b>tap any light to travel there</b>. Your filters apply to both views. Planetfall <b>auto-charts</b> every world you stand on (the ⛳ Visited filter gathers them), and removing an entry offers its undo right in the list.</p>'},
 {id:'colors', t:'The color language', k:'color colors tint meaning legend cyan gold red green ember violet lime chronicle toast tray mud', body:
  '<p>The expedition speaks in color, old-school MUD style — a tint means the same thing everywhere, and the words always carry the meaning too, so nothing is lost if you read past the color.</p><ul><li>Pop-ups and the <b>🔔 tray</b> tint by event: red for harm and loss, gold for milestones and first contact, green for harvests, samples and mined hauls, calm blue for everything else.</li><li>In <b>the Chronicle</b>, your champion reads cyan and the foe ember on every line; damage is yellow, criticals gold, misses dim, staggers flash, burns glow orange, mending green, lifesteal violet, thorns lime — a felled combatant falls in red, and the verdict wears its outcome: victory gold, defeat red.</li><li>A world&#8217;s long-range glance tints each reading by family — water cyan, life green, signals violet.</li><li>Elsewhere the language holds: the <b>Compendium</b> marks your <b>Field Scout</b> in cyan, the <b>Star Atlas</b> tints its badges, <b>Cosmic Events</b> wear their nature&#8217;s color, and a creature&#8217;s condition runs green → yellow → red as wounds deepen.</li><li>A <b>wave-off</b> lands in harm red — a scrape, never a death. Field samples and touchdowns keep their gain green, and a landing that beats a hostile world arrives in milestone gold.</li></ul>'},
]},
{icon:'🧬', cat:'Life & the Compendium', blurb:'Kingdoms, discovery, rarity, specimen cards', topics:[
 {id:'discover', t:'Discovering life', k:'discover life scan bioscan species danger wound hp catalogue roster sighting tame scavenge', body:
  '<p>From orbit a living world shows only its <b>life signatures</b> — the card blossoms when you land. Ground the world, then <b>survey its biosphere</b>: a deliberate act with teeth on hostile worlds — the danger percentage is your chance of being wounded by wildlife mid-survey, and <b>wounds deepen with distance</b> (a scrape in the home galaxy is survivable naked; the same claws in the Deep Field bite double and worse — scouts, the Reinforced Hull and crafted suits are how the far rings are survived). The survey always completes — you earned it.</p><ul><li>The survey <b>reveals</b> the roster; it catalogues nothing. Press <b>🐾 Tame</b> for beasts and <b>🌿 Scavenge</b> for flora, fungi and microbes — each attempt names its odds, rarer species resist harder, and crafted gear tips the hand. Every catch earns its Compendium page; there is no limit on trying.</li><li>Or send a beast ahead: press <b>Scout</b> on any of your fauna&#8217;s cards to name it your <b>Field Scout</b> — it takes the hit in your place, wounds and all, mended the usual way with ♥ loved flora. A scout with nothing left is lost forever.</li><li>A fresh scan can spark a spontaneous <b>auto-hybrid</b> with your existing collection.</li><li>Conquered worlds scan safely — see <span data-gt="conquest">Conquest</span>.</li><li>A thin slice of hostile worlds — molten, frozen, crushing — carries actual creatures, not just microbes. The odds run from about 1-in-70 on the friendliest extremes to 1-in-10,000 on the magma seas: the hardest landings hide the strangest finds.</li></ul>'},
 {id:'kingdoms', t:'The four kingdoms', k:'kingdom microbe flora fauna fungi realm biome classification', body:
  '<p>All life belongs to one of four kingdoms — <b>🦠 Microbe, 🌿 Flora, 🍄 Fungi, 🐾 Fauna</b> — and is shelved in the Compendium by realm (Land Fauna, Aquatic Fauna, Colonial Life…). Kingdom decides what a creature can do:</p><ul><li><b>Fauna</b> fight duels, defend worlds, and can be fed.</li><li><b>Flora</b> are medicine and meals — eaten by you or fed to beasts.</li><li>All kingdoms can breed within their own kind.</li><li>The sea grows kelp towers, reef-builders and sargassum rafts now; aerial-life worlds fly drifting veils. Extremophiles come with their own ways of living — vent-clingers, magma-swimmers, storm-riders — and worlds whose roster runs titanic sometimes show it breaking the horizon.</li></ul>'},
 {id:'rarity', t:'Rarity & grades', k:'rarity grade tier common uncommon notable rare exotic legendary mythic celestial primordial transcendent spectrum color', body:
  '<p>Every species wears one of ten grades on a single ladder shared by creatures, plants, worlds and stars alike: <b>Common → Uncommon → Notable → Rare → Exotic → Legendary → Mythic → Celestial → Primordial → Transcendent</b>. Most expeditions live in the lower bands; the top grades grow vanishingly rare, and a <b>Transcendent</b> is a one-in-a-million roll — the province of master bloodlines and <span data-gt="guardians">Apex Guardians</span>. Rarity tints the card, pitches the discovery chime, and matters mechanically:</p><ul><li>Rarer flora heal more — and poison more. Rarer pairs are harder to breed but forge stronger bloodlines.</li><li>Finding a Legendary-or-better species pays a ☄ Stardust bonus (first discovery only).</li><li>Stars and worlds carry rarity too — but a world hides its grade until you <b>land</b> and stand on it; a star reveals its grade on <b>survey</b>. Rarer worlds yield richer conquest spoils.</li><li>Chasing the rare grades? Size, glow, wild apex blood and deep hybrid generations all push a creature’s grade upward — a master bloodline can climb far past what nature rolls.</li></ul>'},
 {id:'specimen', t:'Reading a specimen card', k:'specimen card stats power ability bloodline brood fed gen hybrid tastes', body:
  '<p>Tap any species in the Compendium to open its card:</p><ul><li><b>Five stat bars + Power</b> — its battle strength, rolled deterministically from its genome (see <span data-gt="stats">The five stats</span>).</li><li><b>❤ HP & Condition</b> — its battle pool, and whether it’s Healthy, Bruised, Injured or Critical. Wounds persist and dull every stat — see <span data-gt="injuries">Injuries &amp; recovery</span>.</li><li><b>✧ Ability</b> — its biome-themed combat trick (see <span data-gt="abilities">Abilities</span>).</li><li><b>♥ Favors / ⊘ Dislikes</b> — its feeding tastes (fauna only).</li><li><b>♞ Bloodline</b> — <em>brood</em> (generations bred) and <em>fed</em> (meals taken) both permanently raise its stats.</li><li>Buttons: <b>⇪ Code</b> (share), <b>⚔ Duel</b>, <b>🧬 Breed</b>, <b>🌿 Feed</b>, <b>✎ Rename</b>.</li></ul>'},
 {id:'drift', t:'Passive evolution', k:'drift evolve hybrid automatic epoch cosmic clock', body:
  '<p>Your Compendium is alive. As the cosmic clock ticks (one epoch ≈ every 4 minutes of play), two of your species quietly drift into a new hybrid on their own — the collection keeps surprising you the more you explore. Drift pauses at 500 species so your save stays healthy.</p>'},
 {id:'sapience', t:'Sapience & civilizations', k:'sapient intelligence civilization advanced eras mind signature', body:
  '<p>Fauna roll an intelligence tier: <em>Instinctive → Social → Tool-curious → Semi-sapient → <b>Sapient</b></em>. Whole worlds can host civilizations from stone-age to starfaring. A conquered world with a sapient native earns the Mind Signature — see <span data-gt="signatures">The nine Signatures</span>.</p>'},
]},
{icon:'🌿', cat:'Breeding & Feeding', blurb:'Bloodlines, meals, medicine', topics:[
 {id:'breeding', t:'Breeding', k:'breed pair parents consumed odds hybrid bloodline stardust boost union', body:
  '<p>Pick a specimen, press <b>Breed</b>, choose a same-kingdom mate. Both parents are consumed by the union — win or lose.</p><ul><li>The odds shown depend on the pair’s rarity — rare pairs are long shots.</li><li>☄ Stardust you’ve earned passively boosts odds (up to +15%) — see <span data-gt="stardust">Stardust</span>.</li><li>Success forges a <b>new bloodline</b>: a hybrid child with boosted stats (+1 brood). Chain generations for monsters.</li><li>The union&#8217;s experience goes to the <b>child</b> (+2, and +5 the first time you cross two particular species) — the parents are gone, so the newborn inherits the credit for them.</li><li>A child inherits its parents&#8217; <b>brood</b> but <b>not</b> their fed bloodline — a well-fed pair does not pass that strength on, and the preview says so before you commit.</li><li>Failure loses both parents. Breed your spares, not your champions.</li><li>Two extremophile parents breed a true extremophile; a mixed pair breeds back toward ordinary stock. A creature&#8217;s two-tone hide follows its accent gene, so children visibly carry their parents&#8217; colors.</li></ul>'},
 {id:'feeding', t:'Feeding beasts', k:'feed flora meal tastes loved disliked poison toxic dead bloodline fed mend medicine', body:
  '<p>Fauna can be fed flora from your Compendium (<b>Feed</b> on their card). The plant is always consumed. Every beast has <b>tastes</b> — two stat-flavors it loves, one it dislikes (shown on its card):</p><ul><li>A loved meal grows its <b>fed bloodline</b> — permanent strength, up to a ceiling. The first welcome meal and each new flavour discovered also teach the beast directly.</li><li>Feeding is also medicine: a welcome meal mends a wounded beast, and loved flavors mend most. A disliked meal that goes badly can wound it further — see <span data-gt="injuries">Injuries &amp; recovery</span>.</li><li>Every meal carries a <b>poison chance</b> (worse for rare flora and disliked tastes) — a toxic roll poisons the beast, biting off a chunk of its condition; rarer flora bite far deeper. Only a beast whose strength is already spent dies of it — at zero, it’s gone. The Iron Gut ability shrugs toxins off.</li></ul>'},
 {id:'injuries', t:'Injuries & recovery', k:'injury wound hurt condition bruised critical mend recover heal scars medicine', body:
  '<p>Wounds persist. A creature’s condition — <b style="color:#7fe6a0">Healthy</b> → <b style="color:#ffd96a">Bruised</b> → <b style="color:#ff8a72">Injured</b> → <b style="color:#ff5a4a">Critical</b> — lives on its specimen card, and the wounded fight below their strength (nearly half power at the brink).</p><ul><li><b>How they get hurt:</b> winning a conquest by a thread leaves scars, and a disliked meal that goes badly can wound. Friendly duels are still pure sport — no harm done.</li><li><b>How they heal:</b> feed them. A welcome meal mends, the flavors a beast ♥ loves mend most, and rarer flora mend deeper. Wounds never fade on their own — medicine is a deliberate act.</li><li>Injuries don’t travel in CFB codes — a shared creature arrives fresh.</li><li>Newborn hybrids are born unhurt, whatever shape their parents were in.</li></ul>'},
 {id:'eating', t:'Eating flora (healing)', k:'heal eat flora hp medicine poison stat growth heart nourish', body:
  '<p>Tap the <b>❤ heart</b> by your HP bar to eat flora yourself. The plant is consumed and two things happen:</p><ul><li>You heal. Rarer flora restore more HP — but their poison chance is higher, and a toxic roll wounds you instead. The deadliest medicine heals hardest.</li><li>You grow. Each plant nourishes one specific battle stat permanently (shown on its card). Vitality meals also raise your max HP.</li></ul><p>See <span data-gt="stats">The five stats</span>.</p>'},
]},
{icon:'🧑‍🚀', cat:'You, the Explorer', blurb:'Stats, HP, rank, achievements', topics:[
 {id:'stats', t:'The five stats', k:'vitality ferocity resilience agility insight stats grow flora character', body:
  '<p>You fight with five stats, each starting at 50 and grown permanently by eating flora:</p><ul><li><b style="color:#7fe6a0">Vitality</b> — your life pool; sets max HP (×2) and duel toughness.</li><li><b style="color:#ff8a72">Ferocity</b> — attack power.</li><li><b style="color:#9fb4ff">Resilience</b> — blunts incoming damage.</li><li><b style="color:#ffd96a">Agility</b> — initiative; who strikes first.</li><li><b style="color:#d6a0ff">Insight</b> — critical-hit chance.</li></ul><p>Tap your nameplate to open your character sheet and inspect them. Creatures use the same five stats, rolled from their genomes.</p>'},
 {id:'hp', t:'HP, hazards & death', k:'hp health damage wound hazard death die expedition reset brink', body:
  '<p>You can be wounded by scanning hostile worlds, by champion duty (losing a conquest you fought yourself), and by toxic flora.</p><ul><li>Your HP bar lives in the top bar; max HP = Vitality × 2.</li><li>Heal by eating flora — tap the ❤ heart (see <span data-gt="eating">Eating flora</span>). <b>Medicine never kills:</b> a toxic meal can gut you to the brink — 1 HP — but eating flora is the one gamble that can&#8217;t end the expedition. (The same law as wave-offs: a scrape, never a grave.)</li><li>At 0 HP the expedition ends — the universe is unchanged (it’s math), but your record starts over. Don’t scan furnace worlds at 12 HP.</li></ul>'},
 {id:'rank', t:'Ranks & expedition score', k:'rank score cadet scout pathfinder voyager pioneer cartographer wayfarer sovereign luminary eternal rename name change explorer', body:
  '<p>Everything you do — surveying, cataloguing, breeding, settling, dueling — feeds your <b>expedition score</b>, and score climbs the ten ranks: <em>Cadet → Scout → Pathfinder → Voyager → Pioneer → Star Cartographer → Mythic Wayfarer → Void Sovereign → Cosmic Luminary → Eternal Frontier</em>. Your rank rides on your nameplate and on everything you share.</p><p><b>Nameplate colors:</b> every rank carries its own color, unlocked forever the moment you reach it. Pick any unlocked color from <b>Settings → Nameplate</b> — and <b>Eternal Frontier</b> unlocks the iridescent foil.</p><p><b>Renaming yourself:</b> open <b>Settings → Nameplate</b> and tap <b>✎ Change name</b> anytime. Your record stays; only the name on it changes.</p>'},
 {id:'achievements', t:'Achievements', k:'achievements unlock badges trophies curator survivor', body:
  '<p>Dozens of achievements track cataloguing, breeding, rarity hunting, conquest, stellar finds and exploration feats. They live on your character screen (tap your nameplate) under the <b>Achievements</b> fold — open it and each category shelf expands on its own. Many are secret handshakes with the universe: favorite a place, survive the brink, find a black hole…</p>'},
]},
{icon:'⚔', cat:'Combat', blurb:'Duels, abilities, conquest', topics:[
 {id:'duels', t:'Duels & the Chronicle', k:'duel fight battle initiative critical rounds deterministic code friend chronicle log share ledger', body:
  '<p>Duels are round-by-round creature battles. <b>Agility</b> decides who strikes first, <b>Ferocity</b> drives damage, <b>Resilience</b> blunts it, <b>Insight</b> lands criticals, <b>Vitality</b> sets the HP pool — and each side’s ✧ ability and 🛡 class arts bend the rules.</p><ul><li>Every fight is told as <b>the Chronicle</b>: named arts, first strikes, executes, thorn recoils, burn ticks, staggers, a death line — closing with a statistics ledger (hits, crits, biggest blow…).</li><li><b>⇪ Share the battle log</b> at the end of any fight — a plain-text chronicle to paste anywhere, like a screenshot. Fights aren’t saved; legends are retold.</li><li>Duel your own creatures from their cards, or paste a friend’s <b>CFB-</b> code. The same matchup always plays out identically, on every device.</li><li>Friendly duels are sport: nothing is lost — but victories still feed your creature’s <b>XP</b>. Conquest is another story.</li></ul>'},
 {id:'abilities', t:'Abilities & biome themes', k:'ability theme fire frost storm tide stone venom void sand chem psionic wild burn regen crit dodge', body:
  '<p>Every creature carries one ability from its habitat’s theme — <em>fire, frost, storm, tide, stone, venom, void, sand, chem, psionic, wild</em> (gliders lean storm, swimmers tide, burrowers stone…). Beside each theme’s named classics lives the <b>ability matrix</b>: sixteen archetype verbs — Smite, Aegis, Affliction, Fury, Ambush, Eye, Veil, Mending, Echo, Thirst, <b>Thorns, Rend, Reckoning, Bulwark, Shock, Roulette</b> — at five magnitudes (I–V) that climb with rarity: hundreds of abilities in all (“Fire Reckoning III”). Hybrids usually inherit their other parent’s archetype; sometimes they mutate something new. Apex Guardians fight with <b>Sovereign</b> arts at full magnitude. Every verb is balanced empirically — equal-stat win rates pinned near 50%, with honest counters. The ability is printed on the specimen card.</p>'},
 {id:'classes', t:'Classes, XP & levels', k:'class level xp experience innate warrior mage berserker paladin assassin fusion wins', body:
  '<p>Every beast is born to a <b>class</b> — Warrior, Berserker, Necromancer, Assassin, Druid… over a hundred, with the legendary ones (<b>Titan, Worldbreaker, Avatar, Chosen One</b>) reserved for summit-grade creatures. A class grants <b>innate arts</b>: always-on powers that need no roll, printed on the specimen card.</p><ul><li>Power is built through wins <em>and through care</em>. Victories feed the XP bar — duels +8; conquests +20 and guardians +60, each climbing with the conquered world&#8217;s tier — and cataloguing a genuinely new species teaches your standing Field Scout +2. Keeping also counts: a welcome meal +1, a taste discovered +2, a bout survived +2, a fight taken to the wire +3, a conquest lost +3, and a defender pushed to the brink +5. Levels wake more innate arts (slots at level 3 and 6), never raw stats.</li><li>A union pays its XP to the <b>newborn</b> — both parents are consumed, so the child is the only one left to carry it: +2 for the union, and +5 the first time you cross two particular species.</li><li><b>Breeding fuses bloodlines:</b> a hybrid usually inherits a class from its parents’ lineages — a Caster line crossed with a Martial line breeds toward Spellswords and Battlemages.</li><li>Levels are <em>your</em> creature’s story — a shared code arrives at level 1.</li></ul>'},
 {id:'conquest', t:'Conquering worlds', k:'conquer settle apex native champion lose forever flag world battle', body:
  '<p>Any world with fauna can be conquered. Press <b>Conquer Planet</b> on its survey card and choose one champion — yourself, or any fauna from your Compendium — to face the world’s <b>apex native</b> (its toughest beast; the picker shows your odds).</p><ul><li>The picker&#8217;s reading is <b>simulated, not estimated</b>: it runs the matchup 160 times and reports a band — <b>Favored · Even · Dangerous · Overwhelming</b> — with the sampled percentage and one line saying why. A sample that size cannot tell 0% from a half-percent, so it shows <b>&lt;1%</b> and <b>&gt;99%</b> rather than claiming a certainty it does not have.</li><li><b>Win:</b> the world flies your flag — bioscans are safe forever, ☄ Spoils of Conquest pay out, and the world can be harvested as you explore.</li><li><b>Win ugly, pay for it:</b> a champion that barely survives carries wounds home and fights below strength until mended — see <span data-gt="injuries">Injuries &amp; recovery</span>.</li><li><b>Lose with a wild-caught creature:</b> it is gone forever.</li><li>A hard-fought loss teaches your champion something — but a world only teaches it <b>once</b>.</li><li><b>Lose with a bred champion:</b> your bloodline crawls home <b>Critical</b> — broken, not dead. Mend it with flora it ♥ loves — a champion fielded while still Critical will not crawl home twice.</li><li><b>Lose fighting yourself:</b> you take the wound instead — it can beat you to the brink but never kill you, and below a quarter health you cannot lead a conquest at all (send a beast, or mend first).</li><li>Worlds in farther frontier regions field tougher apex defenders.</li></ul><p>Conquest is also how most Signatures are claimed — see <span data-gt="signatures">The nine Signatures</span>.</p>'},
 {id:'binder', t:'The Binder & the Fifty Paragons', k:'binder collection sets slots types paragon fifty silhouette claim stardust', body:
  '<p>Open <b>🏆 Records</b> and switch to the <b>🗂 Binder</b> tab. You cannot collect individuals out of an infinite universe — so the Binder collects types: fixed pages of slots (every grade, every realm, every body plan, every ability theme…) that are the same for every explorer; your universe decides which specimen fills each.</p><ul><li><b>Sets</b> are curated collections that pay a one-time ☄ Stardust bounty — claim them in the Binder when complete.</li><li><b>The Fifty Paragons</b> are named, one-of-a-kind deep-spectrum legends living on fixed worlds — the same fifty worlds for every explorer. Tap a silhouette to plot a course to its last-known world, then land and <b>Discover Life</b> to catalogue it. Share the coordinates — your friend hunts the very same legend.</li></ul>'},
 {id:'guardians', t:'Apex Guardians', k:'guardian apex named ruler challenge summit empyrean eternal singular crown titan', body:
  '<p>About one fauna-bearing world in forty is ruled by a <b>👑 named Apex Guardian</b> — a one-of-a-kind luminous titan wearing the ladder’s <b>Transcendent</b> summit, forced rather than rolled. The same guardian rules the same world for every explorer — share the coordinates and a friend faces the very same beast.</p><ul><li>A guarded world’s survey card names its ruler, grade and Power, and its conquest becomes a <b>guardian challenge</b>.</li><li>Defeat it and the world is settled, the spoils pay a ruler’s ransom, and the guardian itself joins your Compendium — the fighter’s road to Transcendent.</li><li><b>Lose</b> and the usual price is paid: a champion creature is lost forever, or you take the wound.</li><li>The breeder’s road also leads up: size, glow, wild blood and deep hybrid generations can push a bloodline to the summit without ever drawing a blade.</li></ul>'},
]},
{icon:'☄', cat:'Stardust & Progression', blurb:'Economy, harvests, spoils', topics:[
 {id:'stardust', t:'Stardust', k:'stardust essence currency economy breeding odds boost earn', body:
  '<p>☄ Stardust is the expedition’s soft currency. Lifetime Stardust earned passively raises your breeding odds (+1% per 50 earned, up to +15%). The faucets:</p><ul><li><b>⛏ Harvests</b> from settled worlds — see <span data-gt="harvest">Harvesting</span>.</li><li><b>Spoils of Conquest</b> — every world you settle pays out (rarer worlds pay more).</li><li><b>Rare Find Bonus</b> — first discovery of any Legendary+ species.</li><li><b>First Arrival</b> — reaching a system no expedition record precedes you in pays a small +2 ☄.</li></ul>'},
 {id:'harvest', t:'Harvesting', k:'harvest cooldown settled world replenish stardust epoch exploring', body:
  '<p>Every settled world can be harvested for Stardust (rarer worlds yield more). A world replenishes <b>as you explore</b> — roughly 40 minutes of play, not 40 minutes of waiting — so an empire pays you for playing rather than for the calendar. The button lives on the world’s survey card; “Settled — replenishing” means keep exploring and come back. An empire of settled worlds is a steady Stardust income; visit your conquests.</p>'},
 {id:'mining', t:'Mining & the Cargo hold', k:'mine mining elements minerals deposits cargo hold dead lifeless world vein iron gold prismatium samples field landing inventory icons', body:
  '<p>Dead worlds carry the elements. Every lifeless planet has a deterministic mineral profile by type — iron and titanium in rock, ices and helium-3 on frozen worlds, hydrogen in the gas giants, precious metals in metal worlds — and rarer worlds hide richer veins, up to exotics like Voidglass and Prismatium.</p><ul><li><b>Landing pays.</b> Your first footfall on any world (home aside) collects <b>field samples</b> — a pinch of up to two of its elements and a few ☄ Stardust, richer on rarer worlds. Exploration stocks the hold all by itself.</li><li>Prospecting takes boots on the ground: press a lifeless world&#8217;s <b>Land</b> button, or dive in and confirm the descent — planetfall is a <b>ground survey</b>, and the Mine Deposits button opens with it. (Gas giants, hothouses and molten worlds will fight the landing — see <span data-gt="landing">Landing</span>.) (🛰 Deep Scanners read the veins from orbit, but the drills still need a surface under them.)</li><li><b>The drills run in bursts.</b> Press ⛏ Mine once and the rig pulls a <b>burst</b> — up to ten pulls over a quarter minute — then the drills stand down and want another press. Stop early anytime; a vein can still run dry mid-burst. Every haul varies, and sometimes a <b>rich strike</b> hits a rare pocket. <b>Reserves are finite:</b> the card counts the pulls left, and a world mined to nothing stays mined out forever (there are always more worlds). Crafted mining rigs multiply every haul, and the Auto-Extractor keeps pulling while you&#8217;re away — collect on your next visit.</li><li>Everything lands in your <b>🧰 Cargo hold</b> — it lives on your <b>character screen</b> now, beneath the paperdoll (tap your nameplate, or the 🧰 shortcut that appears with your first cargo). The hold is a Diablo bag under your portrait: a grid of slots — ingots for metals, shards for ices, flasks for gases, cut gems for the exotics. Spending them happens at the <b>🛠 Shipyard</b> (the dock — or the right rail on desktop): the Fabricator and the Research Bench live with the ship they build — and a crafted pack in your Module socket grows the bags themselves. See <span data-gt="research">Research &amp; ships</span>.</li></ul>'},
 {id:'skimming', t:'Stellar skimming & the veins', k:'skim corona star plasma coronium scoop remnant cosmic vein exceptional vein rare materials stellar extraction', body:
  '<p><b>Stars are mines too.</b> Survey a star, then <b>☀ Skim Corona</b> pulls stellar material straight from its fire — hot bright stars give <b>Stellar Plasma</b>, dead dense remnants give <b>Coronium</b>, cool dwarfs give nothing. Skimming rides the Jump Drive&#8217;s shielding, and each star&#8217;s reachable corona is finite. Mind the dead stars: a remnant&#8217;s corona <b>bites</b> the unshielded for 3 HP a pass — the <b>Corona Scoop</b> (Shipyard, costs one hand-skimmed Plasma) ends the bite, ladles +1 per pass, and reaches a deeper corona (an exhausted star reopens when you build it).</p>' +
  '<p><b>Three special veins</b> can ride a world&#8217;s survey card past its base minerals: the <b>biome vein</b> (a living world&#8217;s gated exotic), the <b>cosmic vein</b> (Primordial-and-up worlds only — foundational and reality-breaking materials), and the <b>✦ exceptional vein</b> (~1 world in 7 hides an ultra-pure seam of one of its own minerals — found only once you land). Exceptional units stack as a ✦ sub-count on the same material card, count one grade higher, and the Fabricator spends them first — forge a piece <b>entirely</b> from exceptional stock and it arrives <b>Exceptionally Forged</b>, carrying a bonus affix like conquest spoils.</p>'},
 {id:'research', t:'Research & ships', k:'research tech technology bench drive ship hull scanner lab fusion antimatter warp travel distance', body:
  '<p>The engineer’s track, parallel to the Prime Codex: the Prime Codex is your legend, the Research Bench is your capability. Research costs mined elements + ☄ Stardust:</p><ul><li><b>🛰 Deep Scanners</b> — survey cards reveal mineral veins from orbit.</li><li><b>🛡 Reinforced Hull</b> — hostile bioscans wound you 25% lighter.</li><li><b>🧪 Xenobotany Lab</b> — flora meals nourish one extra stat point.</li><li><b>The drive ladder</b> — 🚀 Fusion → ⚛ Antimatter → 🌀 Warp Fold. Hyperlane travel scales with real distance; each drive cuts it, and Warp Fold makes every jump arrive in a breath. Distance is never a wall — only a wait, and only ever a short one.</li></ul>'},
 {id:'crafting', t:'The Fabricator & gear', k:'craft crafting fabricator recipe parts components ship systems gear equipment suit tool module instrument charm slot equip mining rig auto extractor anchor', body:
  '<p>The <b>Fabricator</b> lives at the <b>🛠 Shipyard</b> (the dock — or the right rail on desktop) — your ship, her systems, and both workbenches in one place. It turns ore into capability, three rungs up: <b>T1 basic parts</b> (plates, wire, chips, weave) → <b>T2 components</b> (drive coils, nav cores, hull segments) → <b>T3 ship systems</b> and <b>explorer gear</b>. Recipes are fixed and identical for every explorer; nothing waits on a timer.</p><ul><li><b>Ship systems build once and stay built:</b> the ⚡ Jump Drive, 📡 Long-Range Array and 🌌 Intergalactic Drive open the travel rings (see <span data-gt="ascent">Chapters</span>); the 🤖 Auto-Extractor keeps mining every world you&#8217;ve worked while you&#8217;re away.</li><li><b>Gear equips on YOU.</b> Your character screen (tap your nameplate) shows your explorer head to boots, with nine sockets pinned to the body — Helmet at the head, Earpiece at the ear, Necklace below the chin, Suit on the chest, Gloves and Tool at the hands, Leggings, Boots, and the Module — the 🎒 pack on your shoulder. Mining rigs and gloves multiply hauls; suits, visors and leggings blunt field wounds (the T3 hazard suits open molten, crushing and frozen worlds to nearly-sure landings); boots, greaves and the module ladder steady landings up to the Gravitic Anchor, which never waves off; earpieces and necklaces sharpen first contact, rich strikes, meals and travel.</li><li><b>Risk is the frontier — gear is how you tame it.</b> Every roll in the game (landing, contact, bioscan) has a crafted answer.</li></ul>' +
  '<p><b>The hold is three tabs</b> (character screen): <b>Materials</b> — every element stacks by substance, grouped by family, never slot pressure; <b>Craftables</b> — parts and components by kind; <b>Gear</b> — the slot grid the pack module grows. <b>Tap any item for its card</b>: rarity frame, level, its ✦ affix lines with ranges, and a compare against what you&#8217;re wearing. <b>Equip</b> and <b>♺ Salvage</b> are buttons on the card — salvage breaks a piece back into some of its materials (a confirm guards it; toggle in Settings › Gameplay, and <b>Salvage All Junk</b> clears unequipped commons in one press). <b>Affixes</b> — seeded bonus stats on worn gear — come from conquest spoils, or from forging with pure ✦ exceptional stock.</p>'},
 {id:'ascent', t:'Chapters', k:'ascent chapter chapters sol lock jump drive ring ladder progression mainline quest unlock neighborhood galaxy intergalactic', body:
  '<p><b>⬆ The Chapters</b> are the mainline: three of them, pinned at the top of your Charters board, that carry a new explorer from one rock to the whole sky. The rings, in order:</p><ul><li><b>Sol.</b> New expeditions start locked to the home system — the entire sky stays visible and surveyable (looking is always free; moving is what you earn). Mine Sol&#8217;s dead worlds and build the <b>⚡ Jump Drive</b>.</li><li><b>The Neighborhood.</b> The nearby stars open. Hunt life, settle a world, and build the <b>📡 Long-Range Array</b> for the whole galaxy.</li><li><b>Beyond the Rim.</b> Master the trades and build the <b>🌌 Intergalactic Drive</b> — from there the Prime Codex Signatures extend your reach, ring by ring, exactly as they always have.</li></ul><p><b>The spectrum expands with the rings.</b> Rarity is a ladder of distance: the Neighborhood catalogues up to <b>Legendary</b>, the home galaxy up to <b>Primordial</b>, and each region beyond makes <b>Transcendent</b> finds steadily less rare — until the Deep Field, where the ladder’s summit lives. The strangest finds live farthest out; guardians, Paragons and your own bred bloodlines are beyond the law.</p>'},
]},
{icon:'✦', cat:'The Prime Codex', blurb:'Signatures, the frontier, endings', topics:[
 {id:'signatures', t:'The Elemental Signatures (nine titans)', k:'signature prime codex element guardian titan relic blueprint earth wind fire air water electric poison void prism win endgame', body:
  '<p><b>The nine elements are the universe’s master test.</b> Each elemental force is embodied by a unique named titan — the same for every explorer. You won’t know a titan waits until you <b>land and survey</b>, and it may or may not be present when you arrive. Face it, send your strongest bred and tamed champions, prevail, and you master that element. The nine, staggered from near to far:</p><ul><li><b>Earth · Fire · Air · Wind · Water</b> — the basics, near home and its neighboring rings.</li><li><b>Electric · Poison</b> — the middle reach, the Local Cluster and Near Field.</li><li><b>Void · Prism</b> — far out, past the Deep Field.</li></ul><p><b>Every element you master recovers a relic blueprint</b> — nine unique, signature-tier pieces of gear (one per socket) that only the Fabricator of a master can forge. The Codex panel (✦, left rail) names each element’s titan and how far out it dwells, and tracks the blueprints you hold. This is where the whole game becomes one: land, mine and tame and heal, craft and breed stronger champions — then master the titans one element at a time, until you are master of them all.</p>'},
 {id:'regions', t:'Frontier regions', k:'region reach frontier expand charter solar local cluster near deep outer dark travel gate', body:
  '<p>You begin charted for the <b>Solar Reach</b>. Each Signature claimed pushes your charter outward — <em>the Local Cluster, the Near Field, the Deep Field, the Outer Dark</em>, and finally <em>the Frontier</em>. Travel beyond your charter is blocked until you’ve earned it, and farther regions field tougher apex defenders with stranger life.</p>'},
 {id:'endings', t:'Endings & the Celestial Frontier', k:'ending win frontier legacy prismatic complete game finish', body:
  '<p>Master all nine elements and the <b>Celestial Frontier</b> reveals itself — and asks what kind of Pathfinder you are. Your choice becomes your legacy (some legacies must be earned through deeds beyond the Prime Codex). The universe stays open afterward: you cannot finish the infinite, only master it.</p>'},
]},
{icon:'🌌', cat:'The Living Universe', blurb:'Determinism — one shared cosmos, no server', topics:[
 {id:'events', t:'Cosmic events', k:'events supernova timescale minute hour day week month year decade witness', body:
  '<p>The universe is alive on every timescale: somewhere a star is always dying, and rarer spectacles cycle by the minute, hour, day, week, month, year and decade. Open <b>Cosmic Events</b> (left rail) to see what’s live and travel to it. Because everything is deterministic, every explorer sees the same event at the same moment — witnessing one is a shared experience. The <b>📜 Witness Log</b> at the top of the panel remembers every sky you saw with your own eyes.</p>'},
 {id:'determinism', t:'One universe, no server', k:'deterministic seed offline same universe share procedural infinite math', body:
  '<p>There is no server and no download — the entire universe is generated from seeds, on your device, on demand. The same coordinates always hold the same galaxy, the same world, the same creature, for everyone, forever. That’s what makes share codes work, duels fair, and events shared. The universe needs no saving; only <em>your</em> story is saved.</p>'},
]},
{icon:'⚙', cat:'Settings & Saving', blurb:'Toggles, tooltips, your save', topics:[
 {id:'settings', t:'Settings', k:'settings text size sound effects shake notifications tooltips toggle options', body:
  '<p><b>The dock</b> holds your five boards — it rides the BOTTOM edge on phones and the RIGHT rail on desktop, with ⚙ Settings and the ? Guide beside it either way.</p><p>The ⚙ panel (dock ⚙) has four tabs.</p><ul><li><b>Display</b>: <b>Text size</b> (A/A+/A++), <b>Text tone</b> (Soft / Bright / Max — brighter tones lift body text toward white and shift bold to gold), <b>Font</b> (Grotesk / System / Mono), <b>Explorer name</b>, and <b>Tooltips</b> (the short hints on hover, keyboard focus, or long-press — turn them off once you’re fluent).</li><li><b>Graphics</b>: <b>Visual effects</b> (particle bursts), <b>Screen shake</b>, <b>Motion</b> (Auto follows your device’s reduce-motion preference; Reduced stills the travel tunnel, shake, confetti and shimmer), and <b>Panel tint</b> (a glass slider — drag from airy liquid glass to a near-solid backing; a floor keeps text readable).</li><li><b>Gameplay</b>: <b>Confirm before salvaging</b> — the guard that asks before an item (or Salvage All) breaks gear down for parts.</li><li><b>Audio</b>: <b>Sound</b> (the master — off silences everything at once, including a world&#8217;s ambience), the <b>Volume</b> slider, <b>Creature voices</b> (every beast has its own call, inherited and blended when you breed), <b>Battle sound</b> (blow-by-blow impact in duels and conquests), and <b>Notifications</b> (silences pop-ups; the 🔔 tray still logs everything).</li></ul><p>All persist with your save.</p>'},
 {id:'saving', t:'Your save & reset', k:'save localstorage reset erase wipe browser device local', body:
  '<p>Your expedition saves automatically to this browser on this device — no account, no cloud. Clearing site data clears the expedition, so export your best creatures as CFB codes if you’re attached. <b>↺ Reset Game</b> in Settings erases everything after a confirm — the universe itself is unharmed; it’s math.</p>'},
]}] as const satisfies readonly LegacyGuideCategory[];

export type GuideTopicId =
  (typeof LEGACY_GUIDE_CATEGORIES)[number]['topics'][number]['id'];
export type LegacyGuideCategoryName =
  (typeof LEGACY_GUIDE_CATEGORIES)[number]['cat'];

export const LEGACY_DORMANT_TOPIC_IDS =
  Object.freeze(['beacon', 'events'] as const satisfies readonly GuideTopicId[]);

export const GUIDE_CATEGORY_IDS = Object.freeze([
  'getting-around',
  'life-compendium',
  'breeding-feeding',
  'explorer',
  'combat',
  'stardust-progression',
  'prime-codex',
  'living-universe',
  'settings-saving',
] as const);

export type GuideCategoryId = (typeof GUIDE_CATEGORY_IDS)[number];

const CATEGORY_ID_BY_NAME: Readonly<Record<LegacyGuideCategoryName, GuideCategoryId>> =
  Object.freeze({
    'Getting Around': 'getting-around',
    'Life & the Compendium': 'life-compendium',
    'Breeding & Feeding': 'breeding-feeding',
    'You, the Explorer': 'explorer',
    'Combat': 'combat',
    'Stardust & Progression': 'stardust-progression',
    'The Prime Codex': 'prime-codex',
    'The Living Universe': 'living-universe',
    'Settings & Saving': 'settings-saving',
  });

export const GUIDE_CAPABILITIES = Object.freeze([
  'canvas-navigation',
  'survey-cards',
  'planetfall',
  'search',
  'cf1-sharing',
  'charters',
  'beacon',
  'atlas',
  'color-language',
  'life-discovery',
  'compendium-read',
  'species-details',
  'passive-evolution',
  'civilizations',
  'breeding',
  'feeding',
  'explorer-health',
  'ranks',
  'achievements',
  'duels',
  'abilities',
  'creature-progression',
  'conquest',
  'binder',
  'guardians',
  'stardust',
  'harvesting',
  'mining',
  'skimming',
  'shipyard-inspection',
  'inventory-actions',
  'research',
  'crafting',
  'chapters',
  'prime-codex',
  'frontier-reach',
  'endings',
  'cosmic-events',
  'deterministic-world',
  'settings',
  'records',
  'protected-saves',
  'field-training',
] as const);

export type GuideCapability = (typeof GUIDE_CAPABILITIES)[number];
export type GuideAvailability = 'available' | 'partial' | 'unavailable' | 'dormant';

interface GuideTopicSupportBase {
  readonly allOf: readonly GuideCapability[];
  readonly currentNote: string;
  readonly unavailableReason: string;
}

type GuideTopicSupport = GuideTopicSupportBase & (
  | { readonly level: 'available'; readonly currentBody?: never }
  | { readonly level: 'partial'; readonly currentBody: string }
);

const partial = (
  allOf: readonly GuideCapability[],
  currentBody: string,
  currentNote: string,
  unavailableReason: string,
): GuideTopicSupport => Object.freeze({
  allOf,
  level: 'partial',
  currentBody,
  currentNote,
  unavailableReason,
});

const unavailable = (
  allOf: readonly GuideCapability[],
  unavailableReason: string,
): GuideTopicSupport => Object.freeze({
  allOf,
  level: 'available',
  currentNote: 'The complete legacy behavior is available.',
  unavailableReason,
});

export const GUIDE_TOPIC_SUPPORT: Readonly<Record<GuideTopicId, GuideTopicSupport>> =
  Object.freeze({
    zoom: partial(
      ['canvas-navigation'],
      '<p><b>Drag to pan and wheel or pinch to zoom.</b> Tap a galaxy or star once to open its survey card, then press <b>Enter galaxy</b> or <b>Enter system</b>. Deep zoom over the same selected body also descends. <b>Escape</b> closes the top surface or rises one level.</p><p>For keyboard exploration, focus the starfield canvas, use the <b>arrow keys</b> to cycle visible bodies, <b>Enter</b> or <b>Space</b> to survey, and <b>+</b> and <b>−</b> to zoom. When a keyboard target is highlighted, the first <b>Escape</b> releases it; press Escape again to close the card or rise.</p><p>Planetfall remains a separate, guarded action; see <span data-gt="landing">Landing</span>. Charter reach can block a destination; see <span data-gt="regions">Frontier regions</span>.</p>',
      'Continuous v2 canvas navigation is live; the explicit survey-card Enter actions replace timing-sensitive second taps.',
      'Canvas navigation has not been connected in this build.',
    ),
    survey: partial(
      ['survey-cards'],
      '<p>Tap a galaxy, star, or planet once to open its current <b>survey card</b>. A galaxy or star card offers an explicit Enter action. A planet card offers <b>Land</b>, <b>Star Atlas</b>, and <b>Share</b> when those actions are valid.</p><p>The card is bound to the selected object’s full identity, including coordinates, so a same-seed object elsewhere cannot inherit stale actions. This selection is navigation and inspection: it does not spend a resource, catalogue life, make a capture attempt, or authorize extraction.</p><p>After landing on a living world, Planetside reveals the biosphere roster, but landing still catalogues nothing. Its at-most-eight-row strip is only a preview: <b>Tame</b>, <b>Scavenge</b>, and <b>Sample</b> are separate finite actions that choose uniformly from their eligible species across the full biosphere.</p><p>Owned <b>Deep Scanners</b> adds one <b>Mineral veins</b> row to the orbital Survey card for a proven lifeless non-Earth world. It preserves the generated ordinary-deposit order and marks the separate biome vein with ✦; cosmic and exceptional veins, grades, reserve and progress facts, and the Mine action remain grounded Engineering information. After landing, <b>Engineering &amp; Shipyard</b> presents the separate grounded mineral reveal and its finite Mine action. The reveal describes the current opportunity but is not itself a mining receipt. See <span data-gt="landing">Landing</span>, <span data-gt="discover">Discovering life</span>, <span data-gt="mining">Mining &amp; the Cargo hold</span>, and <span data-gt="atlas">The Star Atlas</span>.</p>',
      'The current survey card covers navigation, charting, sharing, and planetfall; Planetside capture and grounded Engineering extraction are separate durable actions.',
      'Interactive survey cards have not been connected in this build.',
    ),
    landing: partial(
      ['planetfall'],
      '<p>Any galaxy, star, or planet route arriving from Search, the Star Atlas, or a saved location is regenerated from the seeded universe before it is accepted; navigation uses only the source-verified destination. A valid planet address inside the expedition’s owned reach returns to its live system survey; it never lands for you. A stale or forged route cannot act. An out-of-reach route leaves you in place. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. A galaxy beyond the saved Prime Signature radius stays blocked because Prime Signature earning is not available in this development slice. Press <b>Land</b> on the current planet card to enter Planetside. Only the first landing earns new landfall progress.</p><p>On touch, press the minimum-size <b>Leave world</b> action to return to the system. Right-click or <b>Escape</b> also lifts off. The legacy descent-risk and wave-off model is not yet part of this slice.</p>',
      'Guarded Land and explicit Leave are live; legacy descent odds and wave-off progression are not yet ported.',
      'Planetfall has not been connected in this build.',
    ),
    search: partial(
      ['search'],
      '<p>The top-bar search accepts discovered species names and deterministic <b>CF1</b> world addresses. Every galaxy, star, or planet code is treated as an address to verify, not as authority: the game regenerates its full hierarchy from the seeded universe and accepts only the source-verified destination. A valid address inside the expedition’s owned reach opens its own navigation level; a planet address reopens the live system survey, where <b>Land</b> remains a separate choice. A stale or forged code leaves the current view unchanged and keeps the exact query in Search for correction. An out-of-reach address leaves the current view unchanged and keeps its query available. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. A galaxy beyond the saved Prime Signature radius stays blocked because Prime Signature earning is not available in this development slice.</p><p>Creature <b>CFB</b> challenge imports are not yet available in the v2 slice. See <span data-gt="codes">Share codes</span>.</p>',
      'Species lookup and CF1 travel are live; the broader legacy discovery index and CFB challenge flow remain open.',
      'Search has not been connected in this build.',
    ),
    codes: partial(
      ['cf1-sharing'],
      '<p><b>Share</b> on a planet card prepares a deterministic <b>CF1</b> address for that exact galaxy, star, and planet. If the browser permits clipboard access it is copied; otherwise the exact address is selected in Search and the game tells you to use your browser’s Copy command. An accepted custom planet name travels with the address. Before any shared galaxy, star, or planet route is accepted, the game regenerates its hierarchy from the seeded universe and uses only the source-verified destination. A stale or forged code leaves the current view unchanged and keeps the exact query in Search. An accepted planet route returns another explorer to the live system survey when the destination is inside that expedition’s owned reach; otherwise the explorer stays put and the query remains available. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. A galaxy beyond the saved Prime Signature radius stays blocked because Prime Signature earning is not available in this development slice. It never bypasses the Land action.</p><p>CFB creature and Champion-code play is not yet available in this v2 slice. See <span data-gt="search">Search</span> and <span data-gt="atlas">The Star Atlas</span>.</p>',
      'Exact CF1 world sharing is live; CFB creature sharing remains unavailable.',
      'CF1 world sharing has not been connected in this build.',
    ),
    charters: partial(
      ['charters'],
      '<p>The <b>Charters</b> board presents only milestones with a real writer: first landfalls, successful <b>Mine</b> actions, and successful fixed <b>Fabricator</b> outputs. A revisit never banks a second landfall. Each Mine press banks one mining-goal tick even when an Auto-Extractor adds mature loads; Research and Skim do not counterfeit mining or fabrication credit. Fabrication banks only the exact matching part, component, gear, or permanent-system goal.</p><p>Chapter 1 can now be completed through its real actions, including building the Jump Drive. A newly built Jump Drive, Long-Range Array, or Intergalactic Drive is actual inventory ownership and changes the ship projection and star reach; chapter numbers or progress alone never mint a drive. Planetside capture is separate and never banks the Charter’s bioscan milestone; that milestone, conquest, and breeding goals stay hidden and unavailable until their writers exist. A successful Land, Mine, or Fabricator action may also reconcile consecutive imported chapters already proved complete by canonical progress and owned reach; it stops at the first incomplete or incompatible chapter and invents no goal, reward, or system.</p><p>A blocked star remains in place until the required owned permanent system extends reach. Saved Prime Signatures separately set the galaxy-distance radius; Prime Signature radius expansion is not available in this development slice. The accepted-chain rewards and weekly-charter economy from v1.8.9 are not yet ported.</p>',
      'Landfall, mining, and fixed fabrication have Charter writers; Planetside capture does not bank the separate unavailable bioscan milestone.',
      'The Charters board and reach contract have not been connected in this build.',
    ),
    beacon: unavailable(
      ['beacon'],
      'Traveler’s Beacon is dormant in v1.8.9 and remains intentionally absent from v2.',
    ),
    atlas: partial(
      ['atlas'],
      '<p>Use <b>Star Atlas</b> on a planet card to chart it. The Atlas lists saved galaxies, stars, and worlds. Each saved galaxy, star, or planet route is regenerated from the seeded universe and must produce a source-verified destination before its row can travel. Choosing a proven entry inside the expedition’s owned reach returns to that destination’s own navigation level. An out-of-reach entry leaves you in place. A star beyond owned ship reach remains blocked until the required permanent system is built in Engineering. A galaxy beyond the saved Prime Signature radius stays blocked because Prime Signature earning is not available in this development slice. A world entry reopens its system survey, where Land remains separate. A stale, forged, or incomplete imported route remains visible but disabled with an honest route-unavailable label instead of pretending it can travel.</p><p>Custom names and source-verified composite identities are preserved. The legacy chart view, favorites, home marker, undo, and hyperlane presentation are not yet ported.</p>',
      'List-based deterministic return travel is live; the full legacy Atlas presentation remains open.',
      'The Star Atlas has not been connected in this build.',
    ),
    colors: unavailable(
      ['color-language'],
      'The complete semantic color-language audit has not yet been ported to the v2 presentation.',
    ),
    discover: partial(
      ['life-discovery'],
      '<p>Landing on a living world reveals its biosphere roster, but it does not add a Compendium page. Planetside shows at most eight rows as a preview. <b>Tame</b>, <b>Scavenge</b>, and <b>Sample</b> each choose uniformly from every eligible species for that action in the full biosphere, including species outside that preview; no species row is a target.</p><p><b>Tame</b> chooses fauna and a hit adds one owned creature. <b>Scavenge</b> chooses flora or fungi and <b>Sample</b> chooses microbes; either hit adds one specimen lot, never a living companion. The selected species and its exact chance are shown with the result.</p><p>The three actions share one finite <b>Biosphere Yield</b>. Every attempt spends 1 Yield on a hit or miss. A successful species leaves that action’s eligible pool for the rest of the world’s current cycle; a miss stays eligible. Empty, worked-out, or protected-save refusals roll nothing and spend nothing. Busy, stale, and failed-write outcomes publish nothing and leave saved Yield and draw counters unchanged. The pool fully recovers at the next <b>20-minute active-play cycle</b>; closing the game or moving the wall clock does not advance recovery.</p><p>The first successful observation of a species adds its one Compendium page plus the creature or specimen lot. A later-world or later-cycle repeat adds another creature or lot without another page or first-find reward. A first successful Legendary-or-better observation earns its one Rare Find Stardust bonus; the result shows the exact amount. A miss adds no page, creature, specimen, or Stardust. Capture never banks the Charter’s separate bioscan milestone; that writer remains unavailable.</p><p>With <b>Sound</b> and <b>Creature voices</b> on, one verified successful wild-fauna Tame can answer once with its deterministic synthesized greeting, only after the durable result and its visible status alert have settled. A miss, refusal, repeated invocation, reload, hidden page, or disabled audio stays silent and never replays. This is the current audio boundary: other creature actions, ambience, music, and combat sound remain unavailable.</p><p>Feeding, breeding, renaming, Field Scouts, duels, conquest, passive evolution, companion assignment, and missions remain unavailable.</p>',
      'Random full-biosphere Tame, Scavenge, and Sample actions are live with finite shared active-play Yield; targeted capture and the Charter bioscan writer remain unavailable.',
      'Planetside capture has not been connected in this build.',
    ),
    kingdoms: partial(
      ['compendium-read'],
      '<p>The read-only <b>Compendium</b> presents up to 1,500 logical entries across Microbe, Flora, Fungi, and Fauna. Search filters those saved records, the count reports the logical matches, and choosing a row opens its detail. The long list mounts the visible viewport plus half a viewport of overscan on each side (about two viewports total), plus at most the focused pinned row.</p><p>Each mounted row starts with a neutral placeholder, then receives an exact <b>132px</b> thumbnail. The complete genome—not only the displayed name or seed—owns visual identity. Planetside shares the same bounded thumbnail lease path, and thumbnails are released when their visible owner leaves.</p><p>The Compendium itself remains a read-only browser. A successful first Planetside capture can add one page: Tame also adds an owned fauna creature, while Scavenge and Sample add specimen lots. Later-world or later-cycle successes add another creature or lot without duplicating the page. Feeding, breeding, husbandry, renaming, and other Compendium-row actions remain unavailable.</p>',
      'The Compendium is a read-only view over the saved catalogue; successful Planetside first finds can add pages and ownership outside the board.',
      'The Compendium catalogue has not been connected in this build.',
    ),
    rarity: partial(
      ['species-details'],
      '<p>Species details display the established grade attached to the saved genome, on the shared ladder from Common through Transcendent. The v2 slice preserves that deterministic classification.</p><p>Rarity lowers a species’ base Tame, Scavenge, or Sample chance. Because each action first chooses uniformly from its eligible full-biosphere pool, the selected species and its exact chance appear with the result rather than pretending the preview row was targeted.</p><p>Only the first successful Legendary-or-better observation earns a Rare Find Stardust bonus; the result shows the exact amount. A later-world or later-cycle repeat can add another creature or specimen lot, but never another Compendium page or first-find reward. The broader rarity economy and breeding outcomes remain unavailable.</p>',
      'Grade display, rarity-weighted capture odds, and first-find Stardust are live; broader rarity economy and breeding remain open.',
      'Species grade details have not been connected in this build.',
    ),
    specimen: partial(
      ['species-details'],
      '<p>Open a Compendium row’s detail to read its name, kingdom, realm, description, grade, five battle-stat bars, and exact <b>440px</b> portrait. The portrait uses the same complete-genome identity as its exact 132px list thumbnail; the 440px image is reserved for this detail rather than the list or Planetside.</p><p><b>Back</b> returns to the saved list position and restores focus to the same logical row. <b>Close</b> returns focus to the exact Compendium opener.</p><p>This profile remains read-only. Capture happens only through Planetside’s random full-biosphere Tame, Scavenge, and Sample pools, never from a Compendium row. A Tame hit adds one owned fauna creature; Scavenge or Sample adds one specimen lot and never a living companion. Feeding, breeding, dueling, Field Scout selection, injury care, renaming, CFB actions, and other husbandry remain unavailable.</p>',
      'The read-only specimen profile is live; Planetside capture can add ownership, while profile actions and husbandry remain open.',
      'Specimen details have not been connected in this build.',
    ),
    drift: unavailable(
      ['passive-evolution'],
      'Passive evolution and cosmic-epoch collection updates are not yet connected to v2 persistence.',
    ),
    sapience: unavailable(
      ['civilizations'],
      'Civilization census, first contact, and sapience interactions are not yet ported.',
    ),
    breeding: unavailable(
      ['breeding'],
      'Breeding, parent consumption, lineage creation, and child outcome persistence are not yet ported.',
    ),
    feeding: unavailable(
      ['feeding'],
      'Feeding, permanent growth, taste discovery, injury care, and poison outcomes are not yet ported.',
    ),
    injuries: unavailable(
      ['feeding', 'explorer-health'],
      'Persistent creature injuries and their healing/loss outcomes are not yet ported.',
    ),
    eating: unavailable(
      ['feeding', 'explorer-health'],
      'Explorer healing, flora consumption, and poison outcomes are not yet ported.',
    ),
    stats: partial(
      ['species-details'],
      '<p>The v2 specimen detail displays the established five combat stats — Vitality, Ferocity, Resilience, Agility, and Instinct — from the deterministic genome through the ported battle-stat facade.</p><p>The explorer character sheet, equipment modifiers, and interactive stat progression are not yet available.</p>',
      'Creature battle-stat reading is live; the full explorer/stat progression surface remains open.',
      'The deterministic species-stat detail has not been connected in this build.',
    ),
    hp: partial(
      ['explorer-health'],
      '<p>The top bar displays the expedition’s imported/current <b>HP</b> and the maximum derived from its preserved explorer stats. The value is durable, not decorative: an unguarded stellar skim at a remnant star previews and then costs exactly <b>3 HP</b>. Engineering refuses that skim when HP is 4 or lower, and connected skim protection reduces the shown damage to zero.</p><p>Other hazards, healing, death/reset, and restoration outcomes are not yet connected, so stellar skimming is the only current HP writer rather than a complete health loop.</p>',
      'Imported/current HP display and persistence plus guarded remnant-skim damage are live; other hazards, healing, death, and restoration outcomes remain open.',
      'The explorer HP display has not been connected in this build.',
    ),
    rank: unavailable(
      ['ranks'],
      'Explorer ranks, score thresholds, and nameplate rewards are not yet ported.',
    ),
    achievements: partial(
      ['records'],
      '<p>The <b>Records</b> board preserves and displays imported exploration totals, Stardust earned, and Journal entries. First landfalls visibly update the worlds-landed total. Mine, Skim, and fixed Fabricator settlements also preserve their compatible expedition counters, but those Arc 3 counters are not yet listed on the Records board and live Journal writing is not connected.</p><p>The mature achievement shelves, named milestones, badges, and reward claims are not yet ported.</p>',
      'Imported Records and Journal data plus live first-landfall counting are visible; Arc 3 counters are durable but not yet presented, and achievement shelves and rewards remain open.',
      'The current Records and Journal surface has not been connected in this build.',
    ),
    duels: unavailable(
      ['duels'],
      'Friendly duel selection, Chronicle outcomes, cooldowns, and rewards are not yet ported.',
    ),
    abilities: unavailable(
      ['abilities'],
      'Live ability selection, effects, and combat presentation are not yet ported.',
    ),
    classes: unavailable(
      ['creature-progression'],
      'Creature XP, levels, classes, and award outcomes are not yet ported.',
    ),
    conquest: unavailable(
      ['conquest'],
      'Conquest selection, simulated odds, defender identity, rewards, and settlement outcomes are not yet ported.',
    ),
    binder: unavailable(
      ['binder'],
      'Binder pages, Paragons, set claims, and their rewards are not yet ported.',
    ),
    guardians: unavailable(
      ['guardians'],
      'Apex Guardian encounters, awards, and Compendium claims are not yet ported.',
    ),
    stardust: partial(
      ['stardust'],
      '<p>The expedition preserves its imported/current <b>Stardust</b>. Engineering shows the exact amount owned beside each cost, and a successful Deep Scanners purchase or eligible fixed Fabricator recipe spends its stated Stardust in the same durable transaction as the result.</p><p>A first successful Legendary-or-better Tame, Scavenge, or Sample observation earns its one Rare Find Stardust bonus in the same durable transaction as its page and ownership; the result shows the exact amount. A miss and every later-world or later-cycle repeat earn none. No other current v2 action earns Stardust; Charter rewards, passive gain, and the rest of the mature economy remain unavailable.</p>',
      'Engineering spends preserved Stardust, while Legendary-or-better first finds provide the one current earning path; Charter and passive rewards remain open.',
      'Stardust spending has not been connected in this build.',
    ),
    harvest: unavailable(
      ['harvesting'],
      'Settled-world harvest outcomes and play-time recharge are not yet ported.',
    ),
    mining: partial(
      ['mining'],
      '<p>Land on a proven <b>lifeless, non-Earth world</b>, then open <b>Engineering &amp; Shipyard → Mining</b>. Grounded Engineering reveals that world’s deterministic deposits, grades, special veins, and exact pulls remaining. The reveal is inspection only; <b>Mine this world</b> is the separate durable action.</p><p>Each press takes one manual pull, deposits its exact ordinary, rich-strike, cosmic, and exceptional results into Cargo, advances durable extraction progress, and eventually leaves the world <b>Worked out</b>. Living worlds and Earth are protected. An owned Auto-Extractor may add matured loads to a later manual press, but its cursor advances only with active play—closing the game or moving the wall clock creates no income. Capacity, revision, stale-tab, protected-save, and failed-write checks refuse before publication; a pending action disables every Engineering action until it settles.</p>',
      'Finite grounded mining, Cargo rewards, active-play Auto-Extractor settlement, and worked-out persistence are live; wall-clock and offline income are not.',
      'Mining has not been connected in this build.',
    ),
    skimming: partial(
      ['skimming'],
      '<p>Enter a proven star system and open <b>Engineering &amp; Shipyard → Stellar Skimming</b>. A fitted Jump Drive is required. Supported star classes show the exact material, finite passes remaining, and next HP damage before <b>Skim this star</b> can be pressed.</p><p>Each successful skim deposits one deterministic material haul and spends one corona pass. An unguarded remnant costs exactly 3 HP; connected skim protection reduces that damage to zero, and HP of 4 or lower blocks the unsafe attempt. A spent corona remains <b>Worked out</b>. Skimming does not bank a mining Charter goal, and there is no wall-clock recharge.</p>',
      'Finite Jump-gated stellar skimming, Cargo rewards, worked-out persistence, and explicit remnant HP risk are live; recharge and broader stellar heat systems are not.',
      'Stellar skimming has not been connected in this build.',
    ),
    research: partial(
      ['shipyard-inspection', 'research', 'crafting'],
      '<p><b>Engineering &amp; Shipyard</b> combines the capability-derived ship preview with Mining, Stellar Skimming, the Research Bench, and the fixed Fabricator. The preview consumes the same owned permanent systems and reach state as travel; no separate visual state is saved. Only actually owned systems and fitted hardpoints are named and drawn. A completed veteran Charter without its Intergalactic Drive remains an honest generic legacy charter refit that never names or draws the missing drive.</p><p>The Research Bench lists exactly six canonical rows. <b>Deep Scanners</b> is the only current purchase: it consumes 6 Iron, 4 Silicon, and 20 Stardust, records durable ownership, and adds a bounded <b>Mineral veins</b> row to eligible orbital Survey cards. Orbit shows only the ordered ordinary deposits plus a separately marked biome vein; cosmic and exceptional veins, grades, reserves and progress, and mining remain grounded. The other five—Reinforced Hull, Xenobotany Lab, and the three speed-research drives—remain visible but disabled because their promised gameplay consumers are not connected; sparse veteran ownership is preserved without granting prerequisites.</p><p>The Fabricator groups all <b>62 fixed recipes</b> and exposes an action only when its output has a connected gameplay effect and its exact materials, parts, Stardust, Signature, prerequisite, revision, and capacity checks pass. Parts, components, permanent ship systems, and supported explorer gear settle durably. A built drive or Array changes the actual ship and reach; supported rigs change Mine or Skim behavior. Outputs with dormant effects, fully exceptional slotted crafting, authored affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable.</p><p>Only one Engineering action can be pending. Close remains available, reopening stays busy, and no reward, HP change, Charter tick, ownership change, or cost is published before the receipt-bearing transaction commits. See <span data-gt="mining">Mining &amp; the Cargo hold</span>, <span data-gt="skimming">Stellar skimming</span>, and <span data-gt="crafting">The Fabricator &amp; gear</span>.</p>',
      'Mining, skimming, the bounded Deep Scanners orbital Survey reveal, eligible fixed fabrication, and capability-derived ship/reach updates are live; unsupported research consumers and advanced crafting remain unavailable.',
      'Engineering actions and capability-derived ship inspection have not been connected in this build.',
    ),
    crafting: partial(
      ['inventory-actions', 'crafting'],
      '<p><b>Inventory</b> is a separate board in the phone dock and desktop rail. It presents each migrated explorer-gear copy as one stable item instance, including its exact slot, base effects, inherited legacy affix when present, provenance, and equipped state. Open an item to compare every effect against the item in the same slot; conditional effects are labelled instead of presented as universal gains.</p><p><b>Equip</b>, <b>Unequip</b>, <b>Salvage</b>, and pending-reward claim are exact, revision-checked actions. Only one action may settle at a time, reload cannot reroll it, and a stale tab cannot publish it. Salvage is confirmed and returns the legacy v1.8.9 rule: half of each direct material cost, rounded down, with the same one-unit non-gated fallback for a cheap item. Equipped, locked, and favorite protection remains explicit. An oversized legacy hold is retained losslessly as <b>inspection only</b>; it is never truncated to invent a capacity.</p><p><b>Engineering &amp; Shipyard → Fabricator</b> now lists all 62 fixed recipes and can settle only rows whose output has a connected effect and whose exact costs and capacity fit. Stackable parts/components, permanent systems, and supported explorer gear update the same Arc 2 inventory authority and legacy mirror in one transaction; eligible slotted gear may auto-equip only into an empty slot. Outputs with dormant effects, fully exceptional slotted crafting, authored affixes/drawbacks, random authored drops, targeting tags, item upgrades, sockets, and vendors remain unavailable.</p>',
      'Exact Inventory actions and eligible fixed Fabricator recipes are live; unsupported effects, advanced item generation, upgrades, sockets, and vendors remain open.',
      'Exact Inventory actions have not been connected in this build.',
    ),
    ascent: partial(
      ['charters'],
      '<p>The <b>Charters</b> board preserves the imported/current Ascent stage and projects only live milestones: first landfalls, successful Mine actions, and successful fixed Fabricator outputs. Revisits do not rebank landfall. One Mine press banks one mining-goal tick, and exact part/component/gear/system recipes bank only their matching fabrication goals; Research and Skim bank neither.</p><p>Chapter 1 is now completable through real play. Building its Jump Drive creates the owned system that backs the next reach stage; Long-Range Array and Intergalactic Drive recipes likewise change actual ship/reach state when their canonical chapters can be proved. Land, Mine, and Fabricator commits reconcile consecutive imported chapters only when canonical progress and owned reach already prove them; incomplete or incompatible records stop without invented goals, rewards, systems, or reach.</p><p>Planetside capture never banks the Charter’s separate bioscan milestone; that writer, conquest, and breeding milestones remain unavailable. Saved Prime Signatures separately set galaxy-distance radius, while mature item rewards, unlock ceremony, and accepted/weekly charters remain open.</p>',
      'Real landfall/mining/fabrication Ascent progress, owned-system reach, and imported chapter reconciliation are live; unsupported milestones and mature rewards remain open.',
      'The current Ascent goals and reach contract have not been connected in this build.',
    ),
    signatures: unavailable(
      ['prime-codex'],
      'The v2 header can preserve an imported Signature count, but titan encounters, claims, and Prime Codex progression are not yet ported.',
    ),
    regions: partial(
      ['frontier-reach'],
      '<p>Entering a galaxy or system beyond the expedition’s owned reach is rejected without changing the current view. Star access comes from permanent ship systems—Jump Drive, Long-Range Array, then Intergalactic Drive—with compatible Charter state. Their eligible fixed Fabricator recipes create real ownership and immediately change the shared ship/reach projection. In-progress chapter state never invents a permanent system; a fully completed imported veteran Charter preserves intergalactic reach as the generic legacy refit described in Engineering.</p><p>Galaxy-distance radius remains a separate fact derived from saved Prime Signatures. A galaxy beyond that radius stays blocked because new Prime Signature earning is not available in this development slice. The complete Signature progression and far-field combat scaling remain open.</p>',
      'Owned-system star reach and Fabricator-driven reach changes are enforced now; new Prime Signature earning and the full far-field progression economy remain open.',
      'Frontier reach checks have not been connected in this build.',
    ),
    endings: unavailable(
      ['endings'],
      'Prime Codex completion, legacy choices, and Celestial Frontier endings are not yet ported.',
    ),
    events: unavailable(
      ['cosmic-events'],
      'Cosmic Events is dormant in v1.8.9 and remains intentionally absent from v2.',
    ),
    determinism: partial(
      ['deterministic-world'],
      '<p>The universe is generated from seeds on your device. A <b>CF1</b> address is a pointer into that shared math, not authority of its own: for every galaxy, star, or planet route, the game regenerates the hierarchy and accepts only a source-verified match. The same supported coordinates therefore resolve to the same galaxy, star, world, and current-slice survey without an account or game server; a stale or forged address cannot replace the current view.</p><p>The universe itself does not need to be stored; your expedition record does. Shared timed events and creature duels from the mature game are not yet available in this v2 development slice.</p>',
      'The deterministic universe and CF1 address contract are live; shared events and duels remain unported.',
      'The deterministic world-generation contract has not been connected in this build.',
    ),
    settings: partial(
      ['settings'],
      '<p><b>Settings</b> currently controls Sound, Volume, Creature voices, Star charts, panel tint, text size, text tone, font, motion, Field Training restart, and protected expedition import. Creature voices currently governs only the one synthesized greeting after a verified successful wild-fauna Tame; turning it or master Sound off stops that greeting immediately and turning it back on never replays an earlier result. Preferences persist with the expedition.</p><p>Restart begins the current six-lesson drill in Sol. A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view. If verification pauses, that exact view stays saved; when Sol can still be verified, Training returns there so a reload can restart safely and retry. Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured; every other expedition field is retained from the surrounding save. That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth. An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged; reload after updating, or import a trusted complete expedition. If persistence fails before restart, restart is cancelled. See <span data-gt="saving">Your save & reset</span>.</p>',
      'The current preference and training controls are live; the remaining legacy options arrive with their owning systems.',
      'Settings has not been connected in this build.',
    ),
    saving: partial(
      ['protected-saves'],
      '<p>The expedition saves to IndexedDB in this browser. Open <b>Settings → Bring expedition</b> to import a complete supported save. A proven backup may recover a damaged primary. On reload, a saved galaxy, star, or planet location is regenerated from the seeded universe and accepted only when it is source-verified. If that saved location is stale, forged, or incomplete, the view returns safely to <b>Cosmos</b> without losing the rest of your expedition progress.</p><p>During Field Training, a normal Finish or Skip source-verifies and immediately restores the exact pre-Training view. If verification pauses, that exact view stays saved; when Sol can still be verified, Training returns there so a reload can restart safely and retry. Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured; every other expedition field is retained from the surrounding save. That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth. An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged; reload after updating, or import a trusted complete expedition.</p><p>A newer-build, incomplete, or corrupt stored expedition is held unchanged and announced as <b>Update required</b> or <b>Save protected</b>. Ordinary play cannot silently overwrite protected bytes. There is no cloud account yet.</p>',
      'IndexedDB persistence, complete imports, backup recovery, and fail-closed save protection are live; account/cloud synchronization is not.',
      'Protected persistence and expedition import have not been connected in this build.',
    ),
  });

/** Capabilities present at the current playable Phase-4 development boundary. */
export const V2_DEVELOPMENT_GUIDE_CAPABILITIES =
  Object.freeze([
    'canvas-navigation',
    'survey-cards',
    'planetfall',
    'search',
    'cf1-sharing',
    'charters',
    'atlas',
    'life-discovery',
    'compendium-read',
    'species-details',
    'stardust',
    'mining',
    'skimming',
    'shipyard-inspection',
    'inventory-actions',
    'research',
    'crafting',
    'explorer-health',
    'frontier-reach',
    'deterministic-world',
    'settings',
    'records',
    'protected-saves',
    'field-training',
  ] as const satisfies readonly GuideCapability[]);

export interface GuideTopicView {
  readonly id: GuideTopicId;
  readonly title: string;
  readonly keywords: readonly string[];
  readonly body: string;
  readonly legacyBody: string;
  readonly crossLinks: readonly GuideTopicId[];
  readonly legacyCrossLinks: readonly GuideTopicId[];
  readonly availability: GuideAvailability;
  readonly availabilityNote: string;
  readonly legacyLive: boolean;
}

export interface GuideCategoryView {
  readonly id: GuideCategoryId;
  readonly icon: string;
  readonly title: LegacyGuideCategoryName;
  readonly blurb: string;
  readonly topics: readonly GuideTopicView[];
}

export interface GuideCatalogueOptions {
  readonly includeUnavailable?: boolean;
  readonly includeDormant?: boolean;
}

const DORMANT_SET: ReadonlySet<GuideTopicId> =
  new Set<GuideTopicId>(LEGACY_DORMANT_TOPIC_IDS);

const ALL_TOPIC_IDS: ReadonlySet<string> =
  new Set(LEGACY_GUIDE_CATEGORIES.flatMap((category) =>
    category.topics.map((topic) => topic.id)));

function crossLinksOf(body: string): readonly GuideTopicId[] {
  const links: GuideTopicId[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(/data-gt="([^"]+)"/g)) {
    const id = match[1];
    if (id && ALL_TOPIC_IDS.has(id) && !seen.has(id)) {
      seen.add(id);
      links.push(id as GuideTopicId);
    }
  }
  return Object.freeze(links);
}

function unavailableBody(reason: string, dormant: boolean): string {
  const lead = dormant
    ? 'Dormant in both the v1.8.9 release and v2 development.'
    : 'Not available in this v2 development slice.';
  return `<p><b>${lead}</b> ${reason}</p>`;
}

function topicView(
  topic: (typeof LEGACY_GUIDE_CATEGORIES)[number]['topics'][number],
  capabilities: ReadonlySet<GuideCapability>,
): GuideTopicView {
  const id = topic.id as GuideTopicId;
  const support = GUIDE_TOPIC_SUPPORT[id];
  const dormant = DORMANT_SET.has(id);
  const supported = support.allOf.every((capability) => capabilities.has(capability));
  let availability: GuideAvailability;
  let body: string;
  if (dormant) {
    availability = 'dormant';
    body = unavailableBody(support.unavailableReason, true);
  } else if (!supported) {
    availability = 'unavailable';
    body = unavailableBody(support.unavailableReason, false);
  } else if (support.level === 'partial') {
    availability = 'partial';
    body = support.currentBody;
  } else {
    availability = 'available';
    body = topic.body;
  }
  const availabilityNote = availability === 'available' || availability === 'partial'
    ? support.currentNote
    : support.unavailableReason;
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
    legacyLive: !dormant,
  });
}

export function getGuideCatalogue(
  capabilities: readonly GuideCapability[] = V2_DEVELOPMENT_GUIDE_CAPABILITIES,
  options: GuideCatalogueOptions = {},
): readonly GuideCategoryView[] {
  const capabilitySet = new Set<GuideCapability>(capabilities);
  const includeUnavailable = options.includeUnavailable ?? true;
  const includeDormant = options.includeDormant ?? false;
  const categories: GuideCategoryView[] = [];

  for (const category of LEGACY_GUIDE_CATEGORIES) {
    const topics = category.topics
      .map((topic) => topicView(topic, capabilitySet))
      .filter((topic) =>
        (includeDormant || topic.availability !== 'dormant')
        && (includeUnavailable || (
          topic.availability !== 'unavailable'
          && topic.availability !== 'dormant'
        )));
    if (topics.length === 0) continue;
    categories.push(Object.freeze({
      id: CATEGORY_ID_BY_NAME[category.cat],
      icon: category.icon,
      title: category.cat,
      blurb: category.blurb,
      topics: Object.freeze(topics),
    }));
  }
  return Object.freeze(categories);
}

export function getGuideTopic(
  id: GuideTopicId,
  capabilities: readonly GuideCapability[] = V2_DEVELOPMENT_GUIDE_CAPABILITIES,
  options: Pick<GuideCatalogueOptions, 'includeDormant'> = {},
): GuideTopicView | undefined {
  for (const category of getGuideCatalogue(capabilities, {
    includeUnavailable: true,
    includeDormant: options.includeDormant ?? false,
  })) {
    const topic = category.topics.find((candidate) => candidate.id === id);
    if (topic) return topic;
  }
  return undefined;
}

function searchableText(topic: GuideTopicView): string {
  return [
    topic.id,
    topic.title,
    topic.keywords.join(' '),
    topic.body.replace(/<[^>]*>/g, ' '),
    topic.availabilityNote,
  ].join(' ').toLocaleLowerCase();
}

export function searchGuide(
  query: string,
  capabilities: readonly GuideCapability[] = V2_DEVELOPMENT_GUIDE_CAPABILITIES,
  options: GuideCatalogueOptions = {},
): readonly GuideTopicView[] {
  const needle = query.trim().toLocaleLowerCase();
  const topics = getGuideCatalogue(capabilities, options)
    .flatMap((category) => category.topics);
  if (!needle) return Object.freeze(topics.slice());
  return Object.freeze(topics.filter((topic) =>
    searchableText(topic).includes(needle)));
}
