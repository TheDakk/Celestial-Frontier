/**
 * Canonical release-note data for the v2 browser app.
 *
 * The v1.8.9 bulletin remains immutable legacy history.  V2 development notes
 * live in a separate development channel and cannot trigger a player update
 * popup: v2.0 names the playtest product, while
 * V2_CURRENT_RELEASE_VERSION stays null until a production release is
 * separately authorized.
 */
import VERSION_DATA from '../../../version.json';

export const V2_DEVELOPMENT_VERSION = VERSION_DATA.version;

export type LegacyReleaseSection =
  readonly [heading: string, bullets: readonly string[]];

export interface LegacyRelease {
  readonly v: string;
  readonly title: string;
  readonly date: string;
  readonly sections: readonly LegacyReleaseSection[];
}

export const LEGACY_RELEASE_SYNC = Object.freeze({
  sourcePath: 'celestial-frontier.html',
  sourceAnchor: 'const RELEASES=',
  sourceSha256: 'ed9c836e5e116157d3032d62a1873243b29515b234089e99b75a023e70ccde33',
  sourceGameVersion: '1.8.9',
  releaseCount: 56,
  bulletCount: 398,
} as const);

export const LEGACY_GAME_VERSION = '1.8.9' as const;

export const LEGACY_RELEASES = [
{v:'1.8.9', title:'One Measure', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🐘 A CREATURE IS ONE SIZE EVERYWHERE — a beast from a long bloodline could be described as “tiny” on its card while the game quietly classified it as Megafauna, handing it a rarity boost and noticeably more vitality than its size should allow. Size now means the same thing on the card, in the fight, in its habitat classification and in the Compendium’s Size Classes.',
  '🏝 SIZE CLASSES AND HABITAT READINGS AGREE WITH THE CARD — the same mismatch could file a bred creature under the wrong realm, or count it toward a world’s megafauna when it was nothing of the kind.'],
 ],
 ['🔧 Under the Hood', [
  '📐 ONE DEFINITION OF SIZE — the six places that read the size gene now share a single helper rather than each deciding for themselves. The check that guards it proves a bred creature and its equivalent smaller size are treated identically, and it fails against the previous build.'],
 ],
]},
{v:'1.8.8', title:'Paid for Playing', date:'July 2026', sections:[
 ['⚖ Balancing', [
  '🌍 SETTLED WORLDS NOW PAY YOU FOR EXPLORING, NOT FOR WAITING — a conquered world used to replenish on the calendar: one harvest per hour, whether you were playing or the game was closed. It now replenishes as you explore, roughly forty minutes of play per world. If you play, you earn faster than before. If you leave the game closed for a week, your empire waits for you rather than paying out for time you did not spend. This is the same clock your biosphere pools and creature evolution have always used.',
  '☄ AN EMPIRE YOU LEFT BEHIND PAYS ONCE ON YOUR RETURN — every settled world is ready the first time you open this version, so a long-standing empire is not penalised for the change.'],
 ],
 ['🐛 Bug Fixes', [
  '⏱ THE HARVEST TIMER NO LONGER TRUSTS YOUR DEVICE CLOCK — changing your device’s date could persuade a settled world it had been replenishing for hours. Harvest no longer reads the device clock at all, so there is nothing left to persuade.',
  '🔘 THE HARVEST BUTTON AND THE HARVEST AGREE — the button face, the survey card and the action itself now read readiness from one place, so a world can never look ready and then refuse.'],
 ],
 ['🔧 Under the Hood', [
  '🧪 A NEW CHECK PROVES THE CLOCK CANNOT BE WOUND — it moves a simulated device clock forward a full day and asserts that a settled world stays exactly as ready as the play-time it has earned. It fails against the previous build, which is the only reason to trust it.'],
 ],
]},
{v:'1.8.7', title:'True to Form', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🧬 YOUR BRED CREATURES KEEP THEIR SIZE — a creature from a long bloodline could come back from a reload as a different size entirely, usually the largest one, with the vitality and portrait to match. Its voice, its body and its Size Classes slot all moved with it. Bloodlines now read the same before and after a reload, and a creature you exported yesterday still matches the one in your Compendium today.',
  '📱 THE DOCK STAYS REACHABLE DURING TRAINING — on smaller phones, opening the Compendium, Star Atlas or Charters board during Field Training could cover the entire bottom dock, leaving no way to reach the Compendium, Atlas, Shipyard, Charters, Settings or Guide until the board was closed.',
  '💡 THE "YOU SEEM STUCK" POINTER NO LONGER DISAPPEARS — acting on the suggestion chip could make it vanish for a player with no objective, which is exactly the player who needed it. If you have nothing on your slate, the chip now always offers a next step.'],
 ],
 ['⚖ Balancing', [
  '🗓 WEEKLY CHARTERS — the limit added last release is honest about what it does now; the note in the code no longer claims more than the code delivers.'],
 ],
 ['🔧 Under the Hood', [
  '⚔ FASTER CONQUEST PICKER — the odds meter rebuilt the defending creature’s stats once per row. It now computes them once for the whole list.',
  '🧪 TWO MORE OUTCOME TESTS — one proves a long bloodline survives a save-and-reload with its size intact, the other proves the training dock stays pressable behind every raised board on every phone size. Both were checked against the previous build first, to confirm they actually catch the bug they were written for.'],
 ],
]},
{v:'1.8.6', title:'Kept Promises', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🎓 THE LESSON CARD STAYS READABLE — opening the Compendium, Star Atlas, Charters or Records during Field Training could draw the board straight over the lesson you were following, hiding both the instruction and the Skip button. On a tablet at the "open a shelf, then tap a specimen" step the card was completely buried. Boards now always make room for the lesson.',
  '⚔ DUEL VICTORIES FINALLY PAY — winning a friendly duel awarded your creature nothing at all. Neither did surviving a bout or taking one to the wire. All three now land the XP the Guide has always advertised, and a win no longer quietly eats the cooldown that the next one needed.',
  '🎯 THE CONQUEST ODDS TELL THE TRUTH — the matchup meter cached its estimate too aggressively, so feeding or breeding a champion (or a defender picking up a world bonus) could leave it showing the old number — occasionally the exact opposite of the real result.',
  '🧬 A FIRST-OF-ITS-KIND LINEAGE IS ACTUALLY A FIRST — the lineage bonus announced itself on every successful pairing instead of the first of each kind.',
  '📋 THE QUEST LOG KEEPS ITS HANDLE — while the objective chip was showing a "you seem stuck" suggestion, tapping it could no longer open the quest log — exactly when you would want to check what you were meant to be doing.',
  '📏 SIZE READS THE SAME ON THE CARD AND IN THE FIGHT — a heavily bred creature could describe itself as one size on its specimen sheet while fighting at another.',
  '❤ BLOODLINE NUMBERS STOP OVERSHOOTING — a very well-fed beast, or a child of two large broods, could display a fed/brood count above the game’s own 200 ceiling and then snap back after a reload.'],
 ],
 ['🎨 UI Enhancements', [
  '🐣 THE SPECIMEN SHEET EXPLAINS CARE — the XP line still said victories were the only thing that fed a creature, which has not been true since The Connection. It now names first tastes, unions and new lineages alongside duels, conquests and guardians.'],
 ],
 ['⚖ Balancing', [
  '🗓 WEEKLY CHARTERS KEEP THEIR CADENCE — the weekly slate could be persuaded to reroll far more often than weekly, making completed contracts claimable again.',
  '🔊 CREATURE VOICES USE THEIR FULL RANGE — five of the traits that colour a voice were being folded into far fewer variations than they have, so different creatures sounded more alike than they should. Diets in particular now sound distinct.'],
 ],
 ['🔧 Under the Hood', [
  '🧪 REWARDS ARE NOW TESTED BY OUTCOME — a new check plays a real duel and then reads the ledger to confirm the XP arrived. The previous test called the award function directly, which is why a reward that the game never actually granted could pass it in every build.',
  '📐 THE LAYOUT GATE MEASURES THE LESSON CARD — the browser-based gate grew 80 checks that sample the training card across ten viewports with each board raised, in both card positions.'],
 ],
]},
{v:'1.8.5', title:'First Touch', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🚀 THE FIRST SCREEN ANSWERS AT ONCE — on a phone, a brand-new expedition spent several seconds building world art you could not see yet, behind the naming screen, so the very first thing you touched did not respond. The art now waits its turn.'],
 ],
 ['🔧 Under the Hood', [
  '⏱ A COLD-BOOT GATE — the moment the first screen becomes <i>answerable</i> is now measured in a real browser on a throttled phone, because a screen that is drawn is not the same as a screen that answers. That difference was five seconds, and nothing here was watching for it.',
  '🤖 THE PLAYTEST FLEET PRESSES REAL BUTTONS — a new harness tier takes its actions through the same controls you use instead of reaching past them, so a button that is present but wired to nothing fails here first.'],
 ],
]},
{v:'1.8.4', title:'Clear Ground', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🗺 THE LESSON&#8217;S OWN SCREEN COMES FORWARD — on phones, Earth&#8217;s survey card sat on top of every board, so the two lessons that ask you to open the <b>Star Atlas</b> and the <b>Compendium</b> opened them underneath it. The Compendium button could not be pressed at all. Whatever the current lesson points at now takes the front — except on the landing step, where the card is the thing you need.',
  '📱 THE DOCK IS NEVER BURIED — the survey card stops above the bottom dock instead of running over the buttons a lesson is pointing at.',
  '🪐 THE PLANETSIDE READS CLEARLY DURING TRAINING — the landing view was sliding under the guidance card, hiding its own heading. It settles below the lesson now, so you can read both.',
  '⚙ SETTINGS OPENS OVER A LESSON — the guidance card was covering the Settings panel, the Audio tab especially, on almost every screen size.',
  '🧬 A UNION&#8217;S EXPERIENCE REACHES THE CHILD — both parents are consumed by breeding, and the experience was paid to one of them, so it vanished as it was earned. The newborn carries it now: +2 for the union, +5 the first time you cross two particular species.',
  '🛡 A BOUT SURVIVED FINALLY COUNTS — two of the eight ways a creature earns experience (surviving a bout, and a fight taken to the wire) could never actually pay out. They do now.',
  '💡 THE NUDGE REACHES THE PLAYERS WHO NEED IT — the suggestion that appears when nothing has moved for a while could only ever show for someone who already had a goal. The player with nothing on — the one most likely to give up — was the only one who could never be offered a next step.',
  '☄ SKIMMING A CORONA IS PROGRESS — the game was treating an active skim as if you had stopped playing, and suggested you go do something else.',
  '📋 THE QUEST LOG IS LIVE — it was a snapshot taken when you opened it: charter progress never moved while you watched. It now updates with the objective, closes on Escape, and never strands on screen without a handle.',
  '🔇 SOUND OFF MEANS OFF — switching Sound off left a world&#8217;s ambience playing underneath.',
  '⚔ THE MATCHUP METER STOPS ROUNDING TO CERTAINTY — hopeless and near-certain matchups read <b>&lt;1%</b> and <b>&gt;99%</b> instead of a flat 0% or 100%, and the picker builds its estimate far more cheaply.',
  '❤ THE HEAL TARGET IS A FIXED SIZE — it was sized from the heart glyph, whose width varies by device, and computed under the 44px minimum on phones.',
  '♿ GUIDANCE BUTTONS NO LONGER CLAIM TO BE DISABLED, AND NO LONGER GO DEAD — the shortfall buttons on a specimen card and in the Fabricator now answer when pressed, name what is missing, and sound like a refusal. A verb a lesson has blocked answers too, instead of doing nothing at all.'],
 ],
 ['⚖ Balancing', [
  '🔒 A SPECIES MUST BE CAUGHT TO BE CATALOGUED — tapping a life-form in a world&#8217;s roster added it to your Compendium outright, skipping the tame or scavenge attempt entirely. It now points you at the verb that earns it.',
  '🍽 A WELCOME MEAL IS THE FIRST ONE — the welcome-meal bonus paid on every loved meal forever, and a creature&#8217;s fed bloodline had no ceiling, so a card could promise strength the fighter did not have.',
  '⚔ A LESSON IS LEARNED FROM A WORLD ONCE — losing a conquest was never recorded, so the same world paid its consolation experience on every attempt, indefinitely.',
  '📜 WEEKLY CHARTERS NO LONGER PAY FOR OLD GROUND — a weekly landfall charter completed the moment you accepted it, from worlds you had visited long before, and re-rolled on every clock change.',
  '🌍 HARVESTS KEEP THEIR OWN CLOCK — a settled world&#8217;s hourly harvest measured only the device clock.',
  '💾 A SAVED CREATURE CANNOT CARRY BATTLEFIELD MODIFIERS HOME — the same fields a shared code has always stripped are now stripped on load.',
  '🧪 THE BREEDING PREVIEW TELLS THE TRUTH — the child&#8217;s power range was built from the parents&#8217; fed bloodlines, which a child does not inherit. The range now reflects what the child will actually be, and the card says so.'],
 ],
 ['🔊 Audio', [
  '🐾 CREATURES SOUND FAR MORE LIKE THEMSELVES — the voice read only three things about a creature, so the whole vocabulary was 540 calls: in a collection of fifty, nine in ten had a twin. It now reads its trait, build, gait, diet and senses too.',
  '🎭 TEMPERAMENT IS THE GENE THE CARD PRINTS — the voice&#8217;s character was keyed to the wrong gene entirely, so the most aggressive creatures in the game carried some of the meekest voices.',
  '🦇 NO CREATURE IS PINNED AT THE CEILING — about one in fifty voiced at the top of the range, all of them bats, where size and temperament stopped mattering and the call was simply shrill.',
  '✅ A SUCCESSFUL ACTION SOUNDS LIKE ONE — the confirming tone existed but was never once played, so the contrast the refusal tone depends on only had one side.'],
 ],
 ['📖 Guide', [
  '📖 THE GUIDE CATCHES UP — the class topic covers experience earned through <em>care</em> and says where a union&#8217;s experience lands; breeding repeats it where a breeder will look; conquest explains that the meter is simulated rather than estimated; and Settings lists the <b>Creature voices</b> and <b>Battle sound</b> switches.'],
 ],
]},
{v:'1.8.3', title:'Clear Ground (source only)', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🗺 THE LESSON&#8217;S OWN SCREEN COMES FORWARD — on phones, Earth&#8217;s survey card sat on top of every board, so the two lessons that ask you to open the <b>Star Atlas</b> and the <b>Compendium</b> opened them underneath it, with no way through. Whatever the current lesson points at now takes the front, and the card steps back — except on the landing step, where the card is the thing you need.',
  '📱 THE DOCK IS NEVER BURIED — the survey card now stops above the bottom dock instead of running over the chips a lesson is pointing at.',
  '🪐 THE PLANETSIDE READS CLEARLY DURING TRAINING — the landing view was sliding under the guidance card, hiding its own heading. It now settles below the lesson, the way every other dialog does, so you can read both.',
  '⚙ SETTINGS OPENS OVER A LESSON — the guidance card was covering the Settings panel (the Audio tab especially) on almost every screen size. Settings you opened yourself now comes to the front.',
  '🧬 A UNION&#8217;S EXPERIENCE REACHES THE CHILD — both parents are consumed by breeding, and the experience was being paid to one of them, so it vanished the moment it was earned. The newborn now carries it: +2 for the union, +5 the first time you cross two particular species. (That bonus also only ever recognised &#8220;fauna with fauna&#8221; before, so it never meant what it said.)',
  '🔇 SOUND OFF MEANS OFF — switching Sound off left a world&#8217;s ambience still playing underneath. It stops immediately now.',
  '⚔ THE MATCHUP METER STOPS ROUNDING TO CERTAINTY — 160 simulated duels cannot tell 0% from a half-percent, so hopeless and near-certain matchups now read <b>&lt;1%</b> and <b>&gt;99%</b> instead of a flat 0% or 100%.',
  '♿ GUIDANCE BUTTONS NO LONGER CLAIM TO BE DISABLED — the <b>Breed</b> and <b>Feed</b> buttons that explain what you are missing are pressable and always were, but they told screen readers the opposite. They now announce what they actually do.'],
 ],
 ['📖 Guide', [
  '📖 THE GUIDE CATCHES UP — the class topic now covers experience earned through <em>care</em>, not victories alone, and says where a union&#8217;s experience lands; breeding repeats it where a breeder will look; conquest explains that the meter is simulated rather than estimated; and Settings lists the <b>Creature voices</b> and <b>Battle sound</b> switches.'],
 ],
]},
{v:'1.8.2', title:'Steady Hands', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🍽 THE MEAL AND THE UNION KEEP THEIR CARD — the feed and breed lessons were closing the specimen card and then asking you to open one again. The card stays open now (its own <b>Feed</b> and <b>Breed</b> buttons are the target), and if you close it, reopening any beast works just as well.',
  '❤ A CALMER HEART — the ❤ keeps its full-size touch target, but its glow and focus ring now hug the heart itself instead of drawing a large box across the HP bar.',
  '📊 THE HP BAR STAYS IN ITS TRACK — the fill can no longer paint past its own edge.'],
 ],
]},
{v:'1.8.1', title:'The Field Test', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '📋 A REAL QUEST LOG — the objective pill was one line with a bare &#8220;+1&#8221;. Tap it now and it unfolds into a compact log: your chapter goal and every accepted charter, each with live progress, and a way straight to the board. Tap again to fold it away.'],
 ],
 ['🐛 Bug Fixes', [
  '🪐 THE PLANETSIDE IS NEVER COVERED — during training the survey card could sit on top of the landing view, hiding the very payoff the lesson is about. The card now yields the screen whenever the Planetside is open.',
  '🗂 NOTHING OPENS ITSELF — the Compendium&#8217;s shelves and the Fabricator&#8217;s categories now start closed everywhere, training included; the two lessons that relied on a pre-opened drawer simply ask you to open one, which is a better lesson anyway.'],
 ],
]},
{v:'1.8.0', title:'The Connection', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '🗣 EVERY CREATURE HAS A VOICE — and it is truly its own. Earth&#8217;s animals sound like what they are: wolves roar, sparrows chirp, whales sing, rattlesnakes hiss, cicadas drone. Alien life speaks from its own genome. And when you <b>breed</b>, the child inherits BOTH parents&#8217; voices — a roarer crossed with a chirper carries each of them, and its descendants drift further into the unknown with every generation. No two bloodlines sound alike, and the same creature sounds identical for every explorer who holds its code.',
  '⚔ THE FIGHT HAS A SOUND — duels and conquests were nearly silent. Every blow now lands with weight, critical hits ring above the impact, and ability strikes carry their own voice.',
  '🪐 PLANETFALL ARRIVES — dropping onto a world opens with a chord, and the world itself murmurs underneath while you look out over it: wind on the tundra, surf on the ocean shelves, a low furnace on the magma seas.',
  '💡 THE GAME TELLS YOU WHAT TO DO NEXT — when nothing has moved for a while, the objective chip stops repeating your goal and offers a concrete next step you can actually take right now, and takes you there.'],
 ],
 ['🧭 Gameplay', [
  '🚫 NO MORE DEAD TAPS — every &#8220;can&#8217;t&#8221; now names what is missing, why, and where to get it, with a button that takes you there. Breed and Feed wear their shortfall on the button before you press them, and a blocked action sounds different from a successful one.',
  '⚖ HONEST CONQUEST ODDS — the win estimate was a rough power comparison that could read 50% when the truth was zero, printed beside a warning that losing costs your champion forever. It now runs the real fight hundreds of times behind the scenes and reports what actually happens: Favored, Even, Dangerous or Overwhelming, with the reason why.',
  '🧬 CARE COUNTS — creatures now gain experience from a welcome meal, a taste discovered, a successful union, a first-of-its-kind lineage, a bout survived, a fight taken to the wire and a conquest lost, not from victories alone.',
  '🔮 BREEDING SHOWS ITS PROMISE — a mate&#8217;s row now previews the power band and the rarity a child could reach. Never the exact result: the reveal is the point.',
  '✦ WORLDS NAME THEIR MOST NOTABLE RESIDENT, and every creature card speaks its temperament.'],
 ],
 ['🖱 UI Enhancements', [
  '🔊 TWO NEW SWITCHES — Settings › Audio can silence creature voices and battle sound independently. Both start on.'],
 ],
]},
{v:'1.7.21', title:'Right Values', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🌍 EARTH REALLY KEEPS ITS HISTORY — the last fix only held if you skipped training early. Training step 4 asks you to re-chart Earth, so on any completed run your original entry was quietly replaced by a fresh one. Your ☆ favourite, discovery date, badge and notes now merge back onto it every time, and they ride the save so a mid-training reload keeps them too.',
  '🧬 TRAINING NO LONGER LEAVES A MARK — an emergency restore could bake the practice lessons permanently into your record (hybrid counts, feeding and breeding tallies, even the heal step&#8217;s stat growth). It now restores the numbers you had before you started.',
  '❤ A REAL HEART, FOR FREE — the 44px heal target is back to costing zero layout: v1.7.20 bought it with ~26px of permanent header height on every device.',
  '🛟 AN HONEST FAILURE MESSAGE — if a restore ever cannot complete, the game no longer points you toward the button that erases everything.',
  '⏰ CLOCK SANITY, FINAL FORM — weekly charters are no longer &#8220;repaired&#8221; at startup, which is exactly when a device clock is least trustworthy; a lagging clock can no longer wipe a week you were part-way through.',
  '🎓 THE LESSON CARD KEEPS ITS PLACE — the spotlight ring no longer outranks the card that explains it, and the ? popover is reachable during training again.'],
 ],
]},
{v:'1.7.20', title:'The Proof', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🛟 THE RELOAD PATH, PROVEN — the mid-training reload restore is finally whole: the genome sanitizer it needed is now shared across the codebase, the snapshot survives a failure anywhere in its own construction, and recovery restores your Compendium before it says a word. If it ever cannot, it now tells you the truth instead of a comforting lie.',
  '🌍 EARTH KEEPS ITS HISTORY — restarting training restores your Atlas entry for Earth exactly as it was, ☆ favourite and all, instead of rebuilding it as a fresh stub.',
  '⏰ CLOCKS CAN&#8217;T TOUCH YOUR CHARTERS — a lagging device clock no longer rewinds your weekly slate (which both wiped honest progress and let the week be re-rolled).',
  '⌨ FOCUS AND KEYS — closing a dialog over an open survey card now returns your focus properly, the star map accepts its advertised arrow/Enter/zoom keys under a screen reader again, and the name field holds the 16px floor that stops iPad Safari zooming.',
  '❤ A REAL HEAL TARGET — the heart now measures a true 44×44 on every device, and the training spotlight no longer draws over the lesson card that explains it.'],
 ],
]},
{v:'1.7.19', title:'Trust, Verified', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🛟 THE RELOAD PATH, TRULY SAFE — round four of testing caught three of our fixes placed where they couldn&#8217;t run. The worst let a mid-training reload wipe the Compendium; the restart snapshot now restores through any reload, proven by a new automated journey that walks that exact path on every release.',
  '⚔ THE TIE COIN ACTUALLY FLIPS — the mirror-match fairness fix read a field that didn&#8217;t exist; exact ties now genuinely break on the seeded coin.',
  '📱 THE TABLET TARGETS ACTUALLY GROW — the 44px rules had landed in the wrong stylesheet and lost the cascade; they now apply, along with the titan-title clamp and landscape caps that shared the defect.',
  '🎓 RESTART POLISH — restarting training no longer double-counts your hybrids, falsely pops achievements, rebuilds Earth&#8217;s Atlas entry as a stub (your ☆ and history survive), or hides the lesson spotlight behind the survey card.',
  '🧮 SMALL TRUTHS — the 900th First Arrival pays again, a forward clock jump can&#8217;t freeze the weekly charters, the last two low-contrast texts stepped up, Text Size reaches the settings rows, and the star map introduces itself without hijacking screen-reader browse mode.'],
 ],
]},
{v:'1.7.18', title:'The Honest Frontier', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🛟 RESTART TRAINING KEEPS ITS PROMISE — restarting the Field Training now truly leaves your expedition untouched: your Compendium, cargo, exceptional stock, items and every equipped piece come back exactly as they were, even if you reload mid-training. And a restarted training no longer dead-ends at the Atlas lesson.',
  '⚖ THE ARENA TELLS THE TRUTH — burning abilities no longer tick twice per round (Cinderburn was winning 98% of fights through armor), exact-HP ties no longer secretly favor you, defensive builds can actually win (the damage floor now respects mitigation instead of erasing it), and the battle log names the real first mover. All 17 fighting styles and all 55 rolled abilities are measured inside fair bands now.',
  '🥋 26 CLASSES WAKE UP — Brawler, Ronin, Psion, Chaos Mage, Eldritch Horror and 21 others were silently missing their innate arts due to two misspelled ability names; every class now grants what its description promises.',
  '⏰ THE CLOCK CAN&#8217;T PAY YOU — backward clock changes no longer refund mining reserves, re-roll the weekly charter slate, or (past 900 systems) turn First Arrival into an endless stardust faucet.',
  '👑 COSMIC GEAR RULES ITS TIER — the Protomatter Carapace, Coronal Aegis and Dark Matter Bore were weaker than ordinary tier-2 gear; all three now stand above the ladder they crown.'],
 ],
 ['♿ Accessibility & Touch', [
  '📱 THE TABLET BAND GETS REAL TARGETS — Surface Pro and iPad Pro sizes now receive full 44px touch targets, the 16px input floor and safe-area clearance; the ❤ heal control grew from 12px to a real fingertip target.',
  '⌨ FOCUS COMES HOME — closing any dialog with Escape returns your keyboard focus where it was; achievement and stat folds are keyboard-reachable; the star map introduces itself to assistive technology instead of hiding from it.',
  '🔎 SMALL FIXES WITH BIG READS — dimmed text everywhere steps up to readable contrast, the training card scrolls instead of pushing its button off-screen and honors your Text Size, titan titles stop truncating, Atlas rows wrap instead of crushing names, and toasts stop blocking the survey card.'],
 ],
]},
{v:'1.7.17', title:'Front and Center', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🎓 LESSONS SHOW THEIR WORK — during training the survey card and lesson surfaces now sit above the boards and dock instead of behind them (Earth&#8217;s card was buried on the landing step), and the training dialogue only takes the very top on the one step whose full-screen sheet demanded it.',
  '🔎 A SLIMMER SEARCH — the phone search pill trades some width and padding for a tidier top bar; the 16px type that keeps iOS from zooming stays.'],
 ],
]},
{v:'1.7.16', title:'Clean Slate', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🗂 TRAINING TIDIES UP AFTER ITSELF — the lessons open the shelf they teach (Compendium, Fabricator), but those shelves stayed expanded after graduation; a fresh veteran now opens both to the tidy closed index.',
  '🎓 THE NAMEPLATE LESSON STAYS ON TOP — the character sheet was covering the training card (and its Got It button) on phones, making the step look like it vanished; during training the card now outranks every board.',
  '⛳ EVERY OBJECTIVE WEARS ITS COUNT — one-shot charters on the dock chip showed no progress digits and read like the old dead pill; the tracker now always shows 0 / 1 → 1 / 1.'],
 ],
]},
{v:'1.7.15', title:'The Field Manual', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '📖 THE GUIDE CATCHES UP WITH v1.7 — the Star Atlas topic teaches the 🗺 Chart view, auto-charting and the in-list undo; the survey topic covers worlds of renown, on-the-ground vein grades and ⬆ Leave this world; the Charters topic explains the live objective chip and the always-yours mainline. Search keywords updated to match.'],
 ],
]},
{v:'1.7.14', title:'The Outfitter', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '🛠 EVERY PIECE OF GEAR, HAND-PAINTED — all 41 gear pieces now wear bespoke painterly masters: the rig line grows from a worn pick to a plasma lance, the five suits are true identities on one chassis, four necklaces you can tell apart at a glance, and every Signature relic tells its Beacon&#8217;s story. The seven cosmic pieces look like nothing else in the hold — a world being born inside the Genesis Locket, clock hands that disagree about now, a drill bit that is an absence bending light.',
  '🚀 THE HULL REMEMBERS EVERY REFIT — the survey-fleet era now marks the ship itself with a gold registry band and navigation strobes, completing the ladder from bare scout to luminous intergalactic craft.'],
 ],
 ['🐛 Bug Fixes', [
  '🤫 DISCOVERIES WAIT THEIR TURN — a new-species reveal no longer pops over an open menu or dialog (it could steal your Escape key); it waits quietly and appears the moment you close what you were doing.'],
 ],
]},
{v:'1.7.13', title:'The Cartographer', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '🗺 THE STAR CHART — your Atlas gains a second view: every charted place painted across the universe on one deep-space chart, clustered by galaxy, favorites starred, home marked, a quiet crosshair where you stand. Tap any light to travel there. Your filters apply to the chart too.',
  '🏷 WORLDS OF RENOWN — the rarest worlds now carry names worth saying twice: &#8220;the Shrouded&#8221;, &#8220;the Ringed Court&#8221;, &#8220;the Sky Forever&#8221;. Rare near home, commoner out in the deep field where legends live. The same world bears the same name for every explorer, forever.',
  '⛏ VEINS WORTH READING — stand on a world and its mineral veins now show their grade for that ground; Primordial worlds enrich every seam one step.'],
 ],
 ['⚖ Balancing', [
  '⚔ THE ARENA LEVELED — two fighting styles had quietly drifted stronger than the field (Smite and Roulette); both are back inside the fair band, measured across thousands of simulated duels. Every archetype now wins between 42% and 58% against the field.',
  '🏆 NO DEAD RELICS — the Graven Aegis and the Prismatic Lathe were weaker than ordinary gear in their own slots; both are now true sidegrades with their own identity (the Aegis holds the protection line with steadier landings; the Lathe trades peak yield for the best rich-strike luck in the game).'],
 ],
 ['🐛 Bug Fixes', [
  '⛏ THE DOUBLE VEIN — metal and lava worlds could list the same mineral twice on their survey card; every vein now appears once.'],
 ],
]},
{v:'1.7.12', title:'Quiet Gold', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '🥇 THE PRIMARY SPEAKS SOFTLY — the survey card&#8217;s Land button trades its solid gold slab for a gold outline and gold lettering on the shared dark pill. Still unmistakably the next step; no longer shouting over the card.'],
 ],
]},
{v:'1.7.11', title:'The Waypoint', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '⛳ THE OBJECTIVE CHIP — the pill under the dock is now a real quest tracker: it always carries the thing you&#8217;re doing <i>right now</i> with live progress (&#8220;⬆ Mine Sol&#8217;s dead worlds · 3 / 8&#8221;), pulses when your count moves, follows your accepted charter first and the story chapter otherwise, and opens the board for details.'],
 ],
 ['🖱 UI Enhancements', [
  '📖 THE MAINLINE READS AS STORY — the chapter pinned atop the Charters board no longer looks like a stack of pre-accepted quests: it wears its own &#8220;The Ascent — your mainline&#8221; framing with slim progress bars, clearly apart from the optional charters (the ones with Accept buttons) below.',
  '🗂 THE BINDER MOVES TO RECORDS — type collections, Sets and the Fifty Paragons now live where they belong: a tab on the 🏆 Records board, beside your trophies. The Compendium is purely your living catalogue.'],
 ],
]},
{v:'1.7.10', title:'The Listening Post', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '🔎 SEARCH TAKES THE STAGE — results now drop directly beneath the search box, and everything else falls into shadow while you type, so the answer is the one lit thing on screen.',
  '🗂 TIDY SHELVES EVERYWHERE — the Compendium and the Shipyard&#8217;s Fabricator now open with every shelf and category folded closed; whatever you expand stays expanded for the session. (Training still lays open the shelf a lesson needs.)',
  '📖 THE COMPENDIUM CLEARS ITS OWN NAME — the board no longer rides up over the Compendium chip that opened it.'],
 ],
 ['🧭 Gameplay', [
  '🎓 LESSONS CLEAR THE STAGE — the feed, breed and heal lessons now put away the specimen card left standing by the previous lesson, so &#8220;Open a beast&#8221; is true when you read it and the ❤ heart isn&#8217;t hiding behind a card.',
  '🖼 NO DEAD BUTTONS — the Planetside&#8217;s ⛶ Full screen pill no longer shows during training, where zoom is deliberately paused so the tap can continue the lesson.'],
 ],
 ['🔧 Under the Hood', [
  '🧠 A LIGHTER MEMORY — species lists, search results and roster images now use small thumbnails instead of retaining every full-size portrait; long collecting sessions on phones hold dramatically less memory with no visual change on cards, duels or reveals.'],
 ],
]},
{v:'1.7.9', title:'The Courtesy Pass', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '⬆ LEAVE THIS WORLD — every world you&#8217;ve stood on now carries an explicit button that pulls the camera back to the system overview. No gesture knowledge required; one press and the whole sky returns.',
  '🖼 PLANETSIDE ANSWERS INSTANTLY — the landing panorama no longer ignores quick taps (an anti-ghost timer used to eat everything in its first half-second); real taps act immediately, and Escape closes or un-zooms it like everything else.',
  '↺ THE RESET BUTTON KEEPS ITS DISTANCE — a clear gap and quieter styling separate &#8220;erase everything&#8221; from the harmless Restart-Training row above it. The two-step confirm still stands guard.'],
 ],
 ['♿ Accessibility', [
  '🔇 TRUE MODAL SILENCE — while the Guide, Prime Codex or a duel is up, the world behind the glass is now genuinely unreachable to screen readers and stray taps, and it wakes back up the moment the dialog closes.',
  '🗒 THE JOURNAL READS ALOUD — the Expedition journal announces itself as a proper list, one landing per row, to assistive technology.',
  '🏷 NOTIFICATIONS SPEAK WITH ONE VOICE — every notification title now follows the same casing, so nothing reads like it came from a different game.'],
 ],
]},
{v:'1.7.8', title:'The Courier', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🧭 TRAINING STEP 6, UNSTUCK — Earth&#8217;s survey card could vanish between the Atlas lesson and the landing lesson with no way to bring it back (opening the Atlas, travelling from its Earth row, or a keyboard Escape could each close it). The card now rides safely into the landing step, tapping Earth always reopens it, and keyboard shortcuts respect the lesson like taps do.',
  '⬆ UPDATES ACTUALLY ARRIVE — the game now checks for a newer build the moment it starts and quietly swaps a stale copy for the live one before play begins (your expedition is untouched — saves live on your device, not in the page). The update pill&#8217;s refresh now truly fetches the new build instead of re-serving the cached one.'],
 ],
]},
{v:'1.7.7', title:'The Open Door', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '⌨ THE BOARD ANSWERS THE KEYBOARD — focus the star map and the arrow keys cycle every pickable body nearest-first (a gold dashed ring marks your target), <b>Enter surveys it</b> with full credit, +/− zoom on it, Escape releases. The universe is no longer mouse-only.',
  '🗣 THE GAME SPEAKS — every toast, target change and survey is announced to assistive technology through a live region; boards move focus in when they open and hand it back when they close; Tab stays inside open dialogs; search results walk with ↑/↓ and commit on Enter.',
  '⛳ PLANETFALL CHARTS ITSELF — every world you stand on joins your Star Atlas automatically (the + button stays for orbital bookmarks), and a new ⛳ Visited filter keeps your hand-picked favorites uncrowded. No more losing a world because you forgot to file paperwork.'],
 ],
]},
{v:'1.7.6', title:'The Regression Round', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🛑 A CRASH, CAUGHT — zooming out of a system with a survey card open could throw an error every frame; the card now closes cleanly when its star leaves the view.',
  '🗂 ONE SURFACE AT A TIME — opening any board now puts the survey card away first (boards were stacking on top of it), tapping the card never closes a board, Escape reaches the card too, and on phones the card stops above the dock instead of tangling with it.',
  '🌍 THE WORLD-NAME FIX ACTUALLY SHOWS — the Planetside header&#8217;s lowercase landing region was being re-capitalized by styling; &#8220;PLANETFALL — MERCURY · carbon world&#8221; now reads as intended.',
  '🔔 TOASTS BEHAVE EVERYWHERE — they no longer hide behind the training card (the &#8220;expedition saved&#8221; note now greets you at graduation), short laptop screens get a left-side lane clear of Records, and tablets show one at a time.',
  '🏷 ONE TITLE PER BOARD — Records and Notifications stopped saying their names twice, and every board now carries its title on desktop as well as phones.'],
 ],
 ['🖱 UI Enhancements', [
  '🛠 HONEST SHORTFALLS — an unaffordable recipe lists everything it&#8217;s missing (&#8220;Need 3× Iron + 1× Chromium&#8221;), the buttons can be hovered and tabbed for details, and the Fabricator opens with your <b>closest build</b> and how to close the gap.',
  '📜 DEEDS ALREADY DONE SAY SO — a charter you&#8217;ve already fulfilled shows <b>Claim ✓</b> instead of asking you to do it again, and accepting it pays on the spot.',
  '🗺 UNDO WHERE YOU NEED IT — removing an Atlas entry offers its undo right in the list, under your finger.',
  '🔎 SMALL TYPE, RAISED — the rarity ladder, titan guidance lines, dock captions and the control hint (which now wraps instead of cutting off &#8220;double-tap zooms&#8221;) all stepped up in size or contrast.'],
 ],
]},
{v:'1.7.5', title:'Clear Air', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '📏 ROOM TO BREATHE — the control hint pill, the caption above it, and the training card each step cleanly above the dock instead of brushing the chip tops.'],
 ],
]},
{v:'1.7.4', title:'The Quiet Dock', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '🏷 CAPTIONS THAT GRADUATE — the dock names its boards while you&#8217;re in Field Training; complete it and the labels retire, leaving the clean icon dock (they return if you restart training from ⚙ Settings). Prime Codex keeps its count either way.'],
 ],
]},
{v:'1.7.3', title:'The Tablet Tier', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '📐 TABLETS GET THEIR OWN HOME — iPads, Surfaces and everything up to 900px now use the dock-and-sheet layout built for touch: boards open as titled, centered sheets above the dock with the world dimmed behind them, instead of desktop furniture squeezed to phone width.',
  '🏷 THE DOCK SPEAKS — every board chip carries its name under its icon (no more guessing what the scroll means), and every chip, circle and control on touch screens holds the 44px finger floor — Accept buttons, Atlas stars, settings chips included.',
  '🖼 BIGGER SKIES — the Planetside vista breathes on tablets, and panels on very large monitors finally grow beyond phone-column width.'],
 ],
 ['🎮 Gameplay', [
  '🌀 THE STELLAR SIGNATURE — the Wind Signature is renamed: Zephyrmaw, the Stellar Squall, was always the titan of the <b>solar</b> wind, and now its Signature says so. Air keeps the skies; Stellar takes the stars. Claimed trophies keep their standing — only the name changes.'],
 ],
]},
{v:'1.7.2', title:'The Field Patch', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '📜 THE TITANS SPEAK — every Prime Codex titan now tells its own story (Terrakoth stands where the crust runs richest; Sylphrend rides the cloud decks…), the guidance lines wrap instead of cutting mid-word, and locked rows read clearly.',
  '🔔 TOASTS KNOW THEIR PLACE — on phones they dock at the top, show one at a time, and step aside entirely while a board is open (everything still lands in the 🔔 tray). And they&#8217;re finally <b>tappable</b>: the › deep links work now.',
  '🛬 LAND WEARS THE GOLD — the survey card&#8217;s primary action stands out, every hint names the same landing verb, and the Sun is introduced as Sol, not &#8220;a sun-like star&#8221;.',
  '🛠 THE FABRICATOR ALWAYS HAS A VERB — unaffordable recipes show a disabled Craft button naming exactly what&#8217;s missing (&#8220;Need 3× Iron&#8221;), and every group shows its craftable count.',
  '⎋ ESCAPE CLOSES EVERYTHING — one press dismisses whichever board or dialog is on top, on every panel, even (safely) during training.'],
 ],
 ['🎮 Gameplay', [
  '🎓 TRAINING IS REVERSIBLE — skipping now leads with &#8220;Keep Training&#8221; in gold, plain words explain you lose nothing, and Settings › Gameplay can restart the 21 lessons any time.',
  '📖 A FRESH EXPEDITION SKIPS THE CHANGELOG — release notes greet returning explorers only; new pilots go straight to the stars.',
  '🖱 PLANETS ARE EASIER TO CATCH — mouse clicks get the same forgiving pick radius touch always had, and an assisted landing announces itself.'],
 ],
 ['🐛 Bug Fixes', [
  '🗒 the Expedition Journal reads &#8220;Mercury · Carbon world · 7/26&#8221; instead of &#8220;Mercurycarbon&#8221;, and the Planetside header names the world before its landing region.',
  '☄ a comet&#8217;s tail no longer renders as a giant grey beam at planet zoom.',
  '🏷 the ? button opens the Guide directly; the Star Atlas ✕ explains itself and removal can be undone; clearing notifications asks first; the notification badge clears when you read the tray.',
  '📱 the top bar clears the Dynamic Island, panels keep their close buttons out of the status strip, and the name gate explains itself if a name can&#8217;t be used.'],
 ],
]},
{v:'1.7.1', title:'The Pocket Patch', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '📱 THE PHONE SCREEN FITS AGAIN — on iPhone, typing your name (or searching) could make Safari zoom the whole page and never let go: your nameplate and HP slid off the top, panels spilled past the edges, the Shipyard&#8217;s ✕ went unreachable, and taps on planets landed beside them (training&#8217;s &#8220;tap Earth&#8221; included). The viewport is locked again and text fields no longer trigger the zoom. Pinch-zoom for accessibility still works — iOS never gives that up.'],
 ],
]},
{v:'1.7.0', title:'The Forge', date:'July 2026', sections:[
 ['✦ New Features & Systems', [
  '💎 ONE RARITY LADDER FOR EVERYTHING — ten tiers, Common to Transcendent, now grade every creature, plant, world, star, material and piece of gear the same way. And rarity is a <b>discovery</b>: a world hides its grade until you land, a star until you survey it — the reveal grows grander the rarer the find.',
  '⛏ THE FULL MATERIALS ECONOMY — 47 materials across five families (structural, volatiles, precious, exotic, <b>cosmic</b>), each with its own painterly icon, family-grouped in the hold. Exceptional ✦ units ride your ordinary stacks and forge finer gear.',
  '🌌 THE SEVEN COSMICS — Protomatter, Primordial Ice, Void Essence, Chronal Shard, Dark Matter seam only the deepest worlds; Stellar Plasma and Coronium are <b>skimmed from the coronas of stars</b> (☀ Skim, once your Jump Drive flies). All seven anchor endgame gear, and the Apex Court crowns await their collectors.',
  '🛠 THE FORGE — gear got the ARPG treatment: item windows with rarity frames and affix panels, equip and salvage side by side (a confirm guard if you want it, Salvage All for the junk), and the hold reborn as three tabs — Materials, Craftables, Gear.',
  '🛟 SAVE GUARDIAN — your save now keeps a last-known-good backup; if the primary is ever damaged, the game restores it automatically instead of starting you over.'],
 ],
 ['🖱 UI Enhancements', [
  '🧭 THE BRIDGE, REBUILT — ✦ Prime Codex holds the top center; 📜 Charters and 📖 Compendium stack the left rail, 🌍 Star Atlas and 🛠 Shipyard the right; 🏆 🔔 ? ⚙ sit as circles in the corner. On phones everything docks into two even rows at your thumbs, and every panel opens as a sheet above them.',
  '✨ QUIET SIGNALS — the open board glows gold instead of growing, status dots and number badges are retired (only Prime keeps its 0/9), and the HP bar reads like a gauge: quarter ticks, a lit edge, a bright tip.',
  '🎨 PANEL TINT — a Graphics slider sets how solid the glass panels pour; the character sheet fits phones so your inventory surfaces without a scroll.'],
 ],
 ['🎮 Gameplay', [
  '🎓 TRAINING, GRADUATED — Field Training is 21 lessons and now ends the way an expedition begins: <b>you</b> open the 📜 board and accept your first charter. Nothing is ever accepted for you, and the ? Guide takes over from there.',
  '🛬 EVERY DESCENT, A NEW FACE — the region you touch down in re-rolls on every landing, so returning to a world can find its deserts, jungles, or open seas.',
  '🌊 THE DEEP IS ALIVE — abyssal dives and reef descents now swim with the world&#8217;s <b>own</b> aquatic species, and every vista plant is the true species from your Compendium — a desert&#8217;s cacti finally look like cacti.'],
 ],
 ['⚖ Balancing', [
  '⚔ FAIR MIRRORS — when two perfectly matched fighters meet, the first strike now falls by a fair seeded coin instead of always favoring the challenger.',
  '🧬 BLOODLINES WITH A HORIZON — breeding and feeding still grow a champion without limit in spirit, but the deepest grinds now approach a ceiling (~2.5× a Titan) instead of dwarfing every fight in the game. No real bloodline in the wild loses a single point.',
  '🏋 POWER IS EARNED, NOT WORN — an item&#8217;s rarity is its story; its strength comes from tier and craftsmanship.'],
 ],
 ['🐛 Bug Fixes', [
  '📌 a pinned recipe&#8217;s tracker chip no longer sits on top of the Compendium button.',
  '🎓 restarting training after accepting a charter can no longer strand the final lesson.',
  '🔵 veterans updating no longer see every long-catalogued species wearing the blue new-entry dot.',
  '🛠 the Fabricator now says where every cosmic material is found, like the item cards always did.'],
 ],
 ['🔧 Under the Hood', [
  '🔒 a full security hardening pass over saved data and share codes (two independent external reviews, every finding closed).',
  '📴 the game&#8217;s fonts now live inside the game — no outside requests, fully offline.',
  '🔋 hidden tabs stop rendering entirely; portrait memory is budgeted to the device; browser zoom is re-enabled.',
  '🧪 releases now gate themselves: the deploy refuses to ship unless the full test battery passes.'],
 ],
]},
{v:'1.6.4', title:'The Landing Fix', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🛬 LANDING TRAINING UNSTUCK — for returning pilots who had already set foot on Earth, the Land step could light up but never complete (the descent registered, yet training didn&#8217;t move on). It now always advances. New pilots were never affected.'],
 ],
]},
{v:'1.6.3', title:'Card & Training Polish', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '🃏 SPECIMEN CARD, TIDIED — the action buttons are reordered (Breed · Feed · Duel · Scout · Code), and Rename moved to a small ✎ icon beside the name so the row stays clean.',
  '🧭 TRAINING OUT OF THE WAY — during the Compendium lesson the training card sits at the top, so the creature list below stays scrollable and reachable.'],
 ],
]},
{v:'1.6.2', title:'Mobile Polish', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '📱 THE BEGIN BUTTON STAYS IN VIEW — on short phones the intro&#8217;s name field and Begin button could sit below the bottom of the screen; they&#8217;re now pinned in place while the story scrolls above them.',
  '🔢 CHARTER COUNTERS DON&#8217;T SPLIT — a charter&#8217;s progress count (like 0 / 2) no longer wraps onto two lines on narrow screens.'],
 ],
]},
{v:'1.6.1', title:'The Binder Patch', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '📖 THE BINDER OPENS AGAIN — the Compendium&#8217;s Binder view hit an error and refused to open; it works again.',
  '🛡 SAVE INTEGRITY — loaded saves now clamp a creature&#8217;s bloodline values, so a tampered save can&#8217;t forge an impossibly powerful creature (or share one).',
  '🏴 ONE WORLD, ONE REWARD — a rapid double-tap on a conquest can no longer pay its Stardust or count its win more than once.',
  '🧬 BREEDING GUARD — the breeding core now refuses already-consumed parents, so a stray double-tap can&#8217;t spawn a phantom child.'],
 ],
]},
{v:'1.6', title:'The Living Frontier', date:'July 2026', sections:[
 ['✨ New Features &amp; Systems', [
  '🎨 THE UNIVERSE, REPAINTED — every living thing is hand-painted now. The whole bestiary was redrawn by the game&#8217;s painterly canvas engine: no two clades share a silhouette, and a creature&#8217;s body tells you what it is at a glance.',
  '🌍 A PAINTED EARTH — all 631 of Earth&#8217;s real animals and 334 of its plants wear class-true forms — mammals, birds, fish, reptiles, amphibians, insects, arachnids, crustaceans, cephalopods, primates, bats, corals — each with the anatomy, eyes, and stance of its kind, its true name on the card.',
  '👽 ALIEN LIFE, TRULY ALIEN — procedural creatures no longer share one template. Their genes draw real anatomy now: beaked, mandibled, frilled, tusked, or tendril-fringed heads; one to eight eyes; whip, finned, plumed, or stinger tails; two to eight limbs; and structural skins (scaled, furred, feathered, chitinous, plated, warty, translucent, crystalline). An ocean-dwelling species keeps its signature anatomy as a swimmer instead of collapsing into a generic fish.',
  '🏞 LANDING VISTAS — every world paints its biome as a living scene with its wildlife in habitat: reefs and abyssal deeps, jungle canopies, savannas, dunes, glaciers, ash wastes. Gas giants show native life drifting in the clouds; barren and toxic worlds stay honestly empty.',
  '🧬 THE LINEAGE CARD — bred hybrids carry an expandable family-tree lookup: &#8220;Bred from Lion (62% of traits) and Wolf (38%),&#8221; with a per-trait breakdown of where each feature came from (Body plan &#8592; Lion, Tail &#8592; Wolf). Cross away from Earth and the bloodline visibly drifts — alien features creeping onto the familiar frame.',
  '🏆 CHAMPION CODES — copy a 🏆 Champion code for any leveled creature and send it to a friend; they face it at its full strength in an exhibition duel. Same code, same creature, anywhere.',
  '✦ THE LOOT CHASE BEGINS — conquering a world can imbue a worn piece of gear with a seeded bonus stat (✦ +X%), and the deeper the world, the stronger the roll. Your equipment grows a character of its own.',
  '🌱 BIOSPHERE YIELD — a world&#8217;s wildlife is finite. Each biosphere offers only so many capture attempts before it is worked out, so where you hunt, and how, matters.'],
 ],
 ['🖱 UI Enhancements', [
  '🃏 ITEM CARDS — tap any item to open a card with its full stats and effects, and equip it straight from there.',
  '🐾 PORTRAITS WITH DEPTH — Compendium and survey portraits use the painterly engine end to end, so a specimen looks the same on its card, in its vista, and on the map.'],
 ],
 ['🐾 Gameplay', [
  '🦋 CLASS ROUTING, HARDENED — a species is drawn as what it biologically is: a Butterflyfish is a fish, a Peacock Butterfly an insect, a Peacock a bird. Hundreds of name collisions were resolved so the catalogue reads true.'],
 ],
 ['🔧 Under the Hood', [
  '🎨 ONE PAINTER FOR EVERYTHING — the entire visual layer runs through a single deterministic art engine; the same seed paints the same life on every device, and it ships without touching the universe&#8217;s determinism — share codes and cross-device parity are unchanged.'],
 ],
]},
{v:'1.5.2c', title:'The Titan Hunt', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🔮 THE ELEMENTAL TITAN HUNT — the Prime Codex is nine elements now, each guarded by a unique, named titan (Terrakoth of Earth, Pyraxis of Fire, Nullreth of the Void…). Landing reveals whether a titan stands on this world; send your strongest champions to fell it and claim the element. The basics wait near home, Electric and Poison at mid range, Void and Prism far past the Deep Field.',
  '🐾 TAME &amp; SCAVENGE — life is no longer catalogued on sight. Landing surveys the biosphere; then 🐾 Tame a beast or 🌿 Scavenge a growth to enter it in your Compendium. Odds fall with rarity and rise with crafted gear.',
  '🌍 THE CRADLE — Earth&#8217;s real animals and plants are your first catchable roster: named creatures clamped to starter grades and fighting at starter strength, their true names carried into the Compendium.',
  '✦ MASTERING THE UNIVERSE — the story is retold end to end. The Prime Codex is the master survey; fell each element&#8217;s titan to master it; master all nine to open the Celestial Frontier. You cannot finish the infinite, only master it. (The old Pathfinder and beacon lore is retired.)',
  '🛠 THE SHIPYARD — new right-rail screen for the ship: ship portrait that gains each built system, with the Fabricator and Research Bench beneath, recipes grouped by category. The character screen now holds only the explorer: figure, stats, and cargo hold.',
  '🏆 THE RECORDS BOARD — rarity ladder and all achievement shelves moved from the character sheet into their own right-rail panel.',
  '🛬 TRAINING LEARNS TO LAND — new Field Training lesson: press Land on Earth&#8217;s card (Earth never waves off) to open Planetside. Training is now 20 lessons covering chart, land, catalogue, feed, breed, duel, heal, and forge.',
  '⛏ THE DRILLS RUN THEMSELVES — Mine is a toggle: one press starts continuous mining; press again to stop, or mining ends when the vein runs dry.',
  '🗺 THE SOL TOUR — five new starter charters covering the home system: first landings on Mercury, Mars, the gas giants, and the outer system, plus crafting a working component. Each pays on completion; finishing the tour opens the weekly board.',
  '🎒 THE PACK ON YOUR BACK — the Module socket is now worn gear (ship systems live at the Shipyard); slotting a pack module adds a visible row of cargo slots per tier.'],
 ],
 ['🖱 UI Enhancements', [
  '🎒 THE HOLD IS A BAG — inventory is a Diablo-style slot grid under the portrait, empty slots included, so remaining capacity is always visible.',
  '📊 STAT BARS ON THE SHEET — the explorer&#8217;s five battle stats use the same bar rendering as specimen cards.',
  '⬆ GATED STAR CHARTERS — foreign-galaxy stars beyond your ring now name the required build (the Intergalactic Drive) on their charter row, from any ring.',
  '🎽 EQUIP PICKER — opens <b>below</b> its socket (socket stays visible and tappable) and carries a ✕; an empty socket&#8217;s hint is no longer a dead end.',
  '🔤 ONE FOLD LANGUAGE — every collapsible header uses the world card&#8217;s expand/close pill (replacing arrow glyphs); the Compendium opens with its first occupied shelf expanded; battle stats render as plain bars (definitions live in the Guide); Mega Fauna matches its shelf-mates; specimen-card verbs sit in a grid.',
  '🔭 NAMES ARE NAMES — map labels drop parentheses and glyphs: Pluto, comets, and moons show bare names; type details live on the card. Ring systems no longer clip square at the sprite edge on wide-band worlds.',
  '✕ EVERY PANEL&#8217;S CLOSE — stays pinned to the top corner while the list beneath it scrolls.',
  '🧭 CHARTERS MOVE TO THE LEFT RAIL — the Charters board (and the Chapters spine atop it) take the left rail; the Prime Codex, your endgame, moves to the top-right gold pill.',
  '🐾 THE LIFE FORMS MENU — a surveyed world&#8217;s roster now folds behind the card&#8217;s expand/close pill, with its 🐾 Tame and 🌿 Scavenge actions grouped inside, beside the creatures they draw from.',
  '✕ THE SETTINGS CLOSE, CLEANED — the menu&#8217;s ✕ is a clean corner glyph now, not a filled box over the panel.',
  '🎨 THE NAMEPLATE MENU — Settings now has a <b>Nameplate</b> row that opens one editor for your name and your plate colour; the colour picker moved here from the character sheet, and the old redundant Explorer-name row is gone.',
  '⚙ GRAPHICS TOOLTIPS — the Graphics toggles (visual effects, screen shake) carry tooltips now.'],
 ],
 ['🐛 Bug Fixes', [
  '🪐 THE MAP HOLDS WHILE YOU VISIT — landing on (or zooming in to) a world now freezes its orbit, so the planet stays framed under the camera and its survey card stops drifting across the screen; the sky resumes turning when you pull back out.',
  '🛬 PLANETSIDE HOLDS IN TRAINING — the landing-lesson vista no longer closes on its own; it waits for your tap to continue, exactly like live play.',
  '✎ LONG NAMES STAY IN THE PLATE — a long explorer name is trimmed with an ellipsis in the nameplate and on the character sheet instead of spilling out of the box.',
  '⚒ THE FORGE READS YOUR HOLD — the Fabricator&#8217;s craft buttons re-check what you can afford the moment new ore lands, so a recipe you can suddenly build lights up without reopening the Shipyard.',
  '⛏ DRILL CHARTERS COUNT AGAIN — mining charters tally each pull the drills make.',
  '🛠 SHIPYARD ALWAYS ON THE RAIL — the 🛠 button no longer disappears after training; the Shipyard is always one tap away.'],
 ],
 ['⚖ Balancing', [
  '🩸 MERCY, SHARPENED — the crawl-home mercy now applies only to bloodlines <b>you bred</b> (wild-born crossbreeds die on defeat), and fires once per mend: a champion fielded while still Critical does not crawl home twice. The same rule closes a reroll seam found in the audit — every retry past the first requires real mending.',
  '🤝 WARY FIRST CONTACT — now follows the wave-off law: its automatic landing damage can take you to the brink but never kill. Deep-ring receptions still hit hard.'],
 ],
]},
{v:'1.5.1', title:'The Mirror Polish', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '🧍 THE PORTRAIT, REPAINTED — explorer figure redrawn with true proportions, jointed limbs, and a lit face behind the visor, staged on a landing pad under a ringed world.',
  '🎽 THE PICKER COMES TO YOUR THUMB — tapping a socket opens the gear list beside it instead of below the figure.',
  '🗂 ONE CARD GRAMMAR EVERYWHERE — specimen-card verbs moved above the stats (matching world cards); the character sheet&#8217;s nameplate colors, rarity ladder, and achievement shelves folded into Collection and Achievements groups. The left column is now four lines and three folds.',
  '📱 PHONES BREATHE — the character screen stacks paperdoll, cargo, then stats on phones, putting the Fabricator directly below the sockets.',
  '⬆ THE CHARTER SPEAKS ON THE CARD — out-of-ring stars and galaxies state the gate and the required build on their survey card (&#8220;a view for now — the ⚡ Jump Drive opens this sky&#8221;). Viewing remains free everywhere.'],
 ],
 ['✨ New Features & Systems', [
  '🛠 TRAINING LEARNS THE FORGE — nineteenth Field Training lesson: craft an Iron Plate at the real Fabricator using loaned ore from the 🧰 hold. Fully sandboxed — ore and plate return to the order on exit.',
  '⚔ THE QUEST SYSTEM — the mainline is renamed <b>Chapters</b>; the charter board beneath it is now progressive.',
  '⚔ CHARTER CHAINS — charters arrive in chains (the five trades and the Sol tour), revealing one link at a time.',
  '⚔ ACCEPT TO ACTIVATE — a revealed charter tracks only after <b>Accept</b> (three active at once); a deed already done completes on the spot. The weekly board opens once the five trades are learned.',
  '🎒 CHARTERS PAY GEAR — five early links award a crafted piece on completion (headlamp, mag-boots, meteorite pendant, field leggings, comms earpiece), equipped straight into an empty socket. The Fabricator remains the upgrade path.',
  '🧭 NUDGES LEAD SOMEWHERE — the next-step nudge names the current chain link (accepted charter first, else the link awaiting Accept); tapping a guiding toast (marked ›) opens the Charters board.',
  '🧭 ARRIVAL PAYS — first arrival in a system with no prior expedition record logs a First Arrival line and pays +2 ☄ Stardust.',
  '🌸 THE CARD BLOSSOMS — orbit shows identity, a life-signature count, and a one-line environment summary; landing opens the environment fold, the biosphere survey, and the capture verbs.',
  '🐾 TAME & SCAVENGE — the biosphere survey reveals the roster instead of cataloguing it; each species is caught individually with visible odds (lower for rarer species, raised by crafted gear). Misses cost nothing; every Compendium page is earned.',
  '🔮 THE ELEMENTAL SIGNATURES — the Prime Codex is nine elements now, each ruled by a named titan (Terrakoth of Earth, Pyraxis of Fire, Nullreth of the Void…). The basics wait near home; Electric and Poison at mid range; Void and Prism far past the Deep Field. The beacon lore is retired — the elements are the arc.',
  '⚔ THE TITAN HUNT — each element&#8217;s Signature is guarded by a unique named titan, far mightier than any wild apex — the same creature for every explorer, seeded to its world. The Codex reads a resonance that names the KIND of world to hunt (molten worlds for Fire, the deep dark for the Void) and how far out it lies — <b>tap a resonance in reach to track it</b> and set a bearing for the titan&#8217;s nearest world. You won&#8217;t know a titan waits until you land and survey. Each titan wears its element and fights wrapped in it. Send your bred and tamed champions, fell it, and claim the element. Mine, craft, breed stronger, hunt the titans — the whole game meets here.',
  '🌍 THE CRADLE — Earth now carries a real, catchable biosphere from your first landing: land, survey, and tame or scavenge a full spread of beasts, birds, flora and microbes. Every one is a <b>starter</b> — grade capped at Uncommon, honest stat variance, no ceiling-breakers — so a menagerie on day one never becomes an early armory. Humanity stays on the card; the wildlife joins it.'],
 ],
 ['⚖ Balancing', [
  '⛏ THE MINING BURST — one press runs up to 10 pulls (~16s), then mining stops until pressed again. Prevents AFK reserve drain; burst-extending recipes are planned.',
  '⬆ CHAPTER GOALS COUNT DEEDS — Chapter mining goals now count drill runs (one press = one deed) instead of loads; the hold and the charters still count every load.',
  '👑 GUARDIANS HONOR THE DISTANCE — Apex Guardians now use the standard region scaling (+14% power per region out), matching ordinary apex defenders (in force since v1.4).',
  '🛡 LEGENDS GROW WHERE THE WORLDS ARE RARER — conquest XP now scales with the conquered world&#8217;s tier; each genuinely new species catalogued grants the standing Field Scout +2 XP.',
  '🩸 THE MERCY LAW REACHES CONQUEST — a fallen bred champion returns Critical instead of dying; champion duty can reduce you to the brink but never kill; below quarter health you cannot lead a conquest yourself (send a beast or mend first). Closes a death loop the 5,000-player synthetic panel hit 344 times. Wild-caught champions still die on defeat.',
  '🌡 THE DEPTH TAX — field damage (bioscans, wary receptions) now scales with distance: softer than before in the home galaxy, plus a tax per universe region out, exceeding 2x at the Frontier. Displayed danger % is unchanged; only the damage is graded. Near home an ungeared explorer is near-safe; deep rings are where scouts, hulls, and suits matter.'],
 ],
]},
{v:'1.5', title:'Fresh Start', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🌅 A FRESH START FOR EVERYBODY — all expeditions reset with v1.5; every explorer starts from the same Sol opening (the Ascent is now the canon start). Nothing is grandfathered or carried over; a farewell card records the retired expedition and its rarest find. The universe is untouched: same seeds, worlds, and share codes.',
  '🧍 THE CHARACTER SCREEN — one centered, Diablo-style home: full-length painterly explorer with nine gear sockets pinned to the body (Helmet, Earpiece, Necklace, Suit, Gloves, Tool, Leggings, Boots, plus the ship Module beside the figure); stats in the left column; Cargo hold, Fabricator, and Research Bench beneath. The 🧰 button shortcuts to inventory. Phones stack paperdoll, stats, then hold.',
  '✦ THE PATHFINDERS&#8217; TRAIL — the Prime Codex is now the endgame arc, starting where the Ascent ends. Each Signature names its trail reach; claiming it recovers a relic blueprint — nine unique signature-tier gear pieces, one per socket, forgeable only at a Signature-holder&#8217;s Fabricator. A Legacy prestige layer for completing the Trail is planned.',
  '🧭 QUEST NOTIFICATIONS — a nudge on login and on idle points at the current chapter goal or charter; fires once per goal, never over another conversation; the 🔔 tray keeps a record.'],
 ],
 ['🖱 UI Enhancements', [
  '⚔ CHARTERS TAKE THE PRIME SLOT — Charters and the Ascent move to the gold pill (top right); the Prime Codex (endgame) moves to the left rail.',
  '🐾 SPECIMEN CARDS CONDENSED — identity and battle stats on top; the field-notes wall folds behind a remembered expand group with a one-line digest. Extremophile ⟁ headlines stay visible. Compendium shelf rows clamp to one line; the card holds the prose.',
  '🌙 QUIET SKIES FOR NOW — Cosmic Events and the Traveler&#8217;s Beacon are disabled pending rework; their achievements are shelved with them. They will return.'],
 ],
 ['⚖ Balancing', [
  '🛡 LEVELS YOU CAN ACTUALLY REACH — class level thresholds cut in half: level 3 at ~7 victories, level 6 a multi-session arc, level 9 the long chase. XP awards unchanged (duels +8, conquests +20, guardians +60). A 240-session synthetic panel found only 3% of sessions reached the second innate art on the old curve, and none reached the third.'],
 ],
 ['🐛 Bug Fixes', [
  '🔔 NOTIFICATION TRAY — no longer overlaps the search box during Field Training; each lesson closes the panels the next lesson does not need.',
  '📊 LANDING TALLIES — Groundfall and Trailblazer count again. The worlds-landed tally froze in v1.3.8 when landings stopped leaving space; it now ticks on the landing rite.'],
 ],
]},
{v:'1.4', title:'The Ascent', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '⬆ THE ASCENT — three-chapter mainline pinned atop the Charters board. New expeditions start locked to Sol and mine → craft → build outward: the ⚡ Jump Drive opens the Neighborhood, the 📡 Long-Range Array opens the whole galaxy, the 🌌 Intergalactic Drive opens intergalactic space. The full sky stays visible from day one — looking is free, moving is earned. Veteran saves keep everything.',
  '🧰 THE FABRICATOR — crafting spine in the Cargo hold: T1 basic parts → T2 components → T3 ship systems and explorer gear; ~30 space-made recipes with painterly icons; no wait timers.',
  '🎽 EQUIPMENT — nine gear sockets on the character sheet (Helmet · Earpiece · Necklace · Suit · Gloves · Leggings · Boots · Tool · Module). Mining rigs and grip gloves multiply hauls; hazard suits open molten/crushing/frozen worlds; the Gravitic Anchor removes wave-offs; the Diplomat&#8217;s Beacon wins first contacts; grail pieces require biome-gated exotics.',
  '📡 THE SHIPYARD — the character sheet shows the ship: a bare hull on chemical thrusters that visibly gains each built system (Jump Drive engines, Array dish, Auto-Extractor pod, Intergalactic outriggers).',
  '🗺 THE BEACON, RETUNED — the Traveler&#8217;s Beacon now always targets inside your current charter: Sol, then the Neighborhood, then the galaxy, then the wider cosmos.',
  '💎 BIOME-GATED VEINS — the four exotics each have a source biome: Geode worlds carry Neodymium, Carbon worlds Promethium, Glass deserts Voidglass, magma seas Prismatium. The vein shows on the card with a ✦; every rich strike there hits it.',
  '⛏ MINING REBUILT — hourly timer removed. Each press pulls a variable haul; rich strikes hit rare pockets; reserves are finite — the card counts remaining pulls, and a world can be mined out (hundreds of pulls). The 🤖 Auto-Extractor keeps working every mined world while away.',
  '🏅 ACHIEVEMENTS & GUIDE — nine new Engineering achievements; two new Guide chapters (The Fabricator & gear · The Ascent).'],
 ],
 ['⚖ Balancing', [
  '🌈 THE RING SPECTRUM — find rarity caps expand with the rings: up to Legendary near home, Mythic in the home galaxy, one more band per region out, summit grades in the Deep Field. Bred bloodlines, guardians, and Paragons are exempt; existing catalogue entries never downgrade.',
  '🌈 WORLDS & STARS — the same ladder applies to worlds and stars on new expeditions: spectral designations cap by ring, along with the spoils, veins, and reserves that scale on world tier. Existing expeditions keep every shown designation.',
  '💚 MEDICINE NEVER KILLS — eating flora can reduce the explorer to 1 HP but can no longer end the expedition (beasts can still die of a bad meal — they have a keeper; you are the keeper). The 700-player synthetic panel found the heal button was the top cause of death.',
  '🛠 GRAIL RECIPE SOURCES — grail recipes name their exotic&#8217;s source biome in the cost line (Neodymium reads &#8220;Geode worlds&#8221;, Prismatium &#8220;Magma seas&#8221;).'],
 ],
 ['🖱 UI Enhancements', [
  '🏞 PLANETSIDE — the landing view is renamed <b>Planetside</b> and is now a pop-up card over the game with its ✕ on the frame, not a separate full screen.',
  '⏭ DUEL SKIP — duels gain a ⏭ Skip button to jump straight to the outcome.',
  '🗂 COMPENDIUM SHELVES — unified naming: Land · Aerial · Aquatic · Amphibious · Cave · Extremophile Fauna (gas-giant floaters shelve under Aerial; each card names its precise realm).',
  '📍 SURVEY CARD ANCHORING — cards stay beside their world through pan, zoom, and orbit drift.'],
 ],
 ['🐛 Bug Fixes', [
  '☄ ASTEROID SPRITES — belt and outer-ring asteroids draw as shaded irregular lumps instead of squares, in close-up and card thumbnails.',
  '❔ HELP POPOVER — tapping empty space closes the ? popover, matching every other panel.',
  '🎲 TRAINING ROLLS — every practice roll succeeds, feeding included, on any step; a rig bug poisoned the loaned beast on every training meal.'],
 ],
]},
{v:'1.3.10', title:'Kingdom Shelves', date:'July 2026', sections:[
 ['🖱 UI Enhancements', [
  '🗂 KINGDOM FILTERS — the Compendium sorts itself by kingdom now: filter chips (All · 🐾 Fauna · 🌿 Flora · 🍄 Fungi · 🦠 Microbes) sit above the shelves, and picking one throws open that kingdom&#8217;s shelves. Every shelf header wears its kingdom&#8217;s color for at-a-glance reading, filtered or not.'],
 ],
]},
{v:'1.3.9', title:'Eyes on the Lesson', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🎯 TRAINING TAP GUARD — during Field Training, tapping a world outside the lesson now does nothing at all. Before, a stray tap in the find-Earth step could lock another planet&#8217;s card for the rest of training — and stray taps could even dismiss the lesson&#8217;s own card.'],
 ],
]},
{v:'1.3.8', title:'The View Holds', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🛬 ORBITAL LANDING — the descent never leaves the sky: the camera holds at approach framing while the landing view opens over it. The old flat ground close-up is gone entirely — mining, census, samples, and first contact all still work from orbit, exactly as before.',
  '🏞 VISTA REBUILD — the Landing vista button works on any world you&#8217;ve visited, even after a reload; if this session hasn&#8217;t painted the scene yet, it&#8217;s rebuilt on the spot.'],
 ],
 ['🖱 UI Enhancements', [
  '✕ LANDING VIEW CLOSE — the ✕ shows everywhere now, training included, and the ? popover follows the one-panel rule (no more settings peeking out beneath it).'],
 ],
]},
{v:'1.3.7', title:'One Lesson at a Time', date:'July 2026', sections:[
 ['🐛 Bug Fixes', [
  '🎓 LESSON INPUT SCOPE — Field Training answers only the lesson in front of you: unrelated survey-card buttons (Land included) and specimen-card verbs go quiet, so the feeding lesson can never trip a live breeding roll — while folding rows and closing cards stay free.',
  '🛬 LANDING VIEW BACKDROP — the landing view floats cleanly over open space; the extreme ground close-up no longer renders behind it.'],
 ],
]},
{v:'1.3.6', title:'Quiet Skies', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🔭 STAR CHARTS SETTING — a new Graphics toggle draws orbit paths, the habitable zone, and chart labels in system view. Ships off — flip it on for the full astronomy overlay.'],
 ],
 ['🖱 UI Enhancements', [
  '🤫 TRAINING HOVER QUIET — while a lesson is up, cursor sweeps no longer pop survey glances over the guidance card; only the lesson&#8217;s own target shows (Earth still glances in find-Earth).',
  '🖱 HOVER SCOPE — hover cards appear only at system scale, so sweeping across a galaxy no longer strobes a stream of star cards. A tap still opens anything, anywhere.',
  '🔍 ZOOM CLAMP — zooming into a landed world now stops before the ground texture smears into stripes.'],
 ],
 ['🐛 Bug Fixes', [
  '🎲 RIGGED ROLLS — training rolls can no longer fail. A practice breed used to be able to lose its roll, consume both parents, and strand the lesson; rigged rolls now beat any odds.',
  '🌍 EARTH BIOME — Earth no longer introduces itself as a savanna world; home keeps its true card.'],
 ],
]},
{v:'1.3.5', title:'Soft Landings', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🏞 BIOMES — every world now wears a biome (~35 kinds: swamp worlds, coral shallows, glass deserts, magma seas, carbon worlds, storm-eye giants, and more), named on the survey card and painted into the landing view. Rare biomes are flagged in violet.',
  '🎯 LANDING ODDS — every world sits on a success ladder shown before you commit (a meadow world near-certain, a magma sea ~1 in 10). A failed descent bounces you back to orbit with a scrape, never worse — and each attempt improves the next try on that world. Visited worlds are permanent; return landings never ask again.',
  '⚠ DESCENT CONFIRM — a manual dive into an unvisited world stops at approach altitude and asks first; the survey card&#8217;s Land button skips the ask.',
  '🪐 GAS GIANT LANDINGS — the landing site is the high cloud deck: storm bands, the great spot when the card carries one, rings overhead, deep lightning, and aerial life drifting past where the card grants it.',
  '🌩 WEATHER EVENTS — tornadoes, hurricane walls at sea, sand walls, ice storms, erupting cryogeysers, acid rain that boils off mid-air over Venus-likes, volcanic lightning, fire whirls, iron rain on ember giants — each shown on the surface readout, in the landing view, and on the descent ask.',
  '🦠 EXTREMOPHILE LIFE — a thin slice of hostile worlds (molten, frozen, crushing, airless-adjacent) carries real creatures beyond microbes; the orbital glance flags them in violet as impossible biosignatures.',
  '🐋 LEVIATHAN SIGHTINGS — a world whose roster hides a titanic creature can render it at full scale on the landing-view horizon.',
  '🌊 ABYSSAL LANDINGS — abyssal ocean worlds render underwater: light shafts, glowing plankton, distant vent fire, and lure-bearing deep hunters where the card grants them.',
  '🌿 MARINE & EXTREMOPHILE FLORA — ocean worlds grow kelp towers, seagrass meadows, reef-builders, and sargassum rafts; aerial-life worlds gain drifting veils; and extremophile creatures earn habitat behaviors — vent-clingers, magma-swimmers, storm-riders, winged hunters.'],
 ],
 ['🖱 UI Enhancements', [
  '🪟 ONE PANEL RULE — opening a panel closes the previous one, phone and desktop alike; every panel carries a corner ✕, and tapping empty space closes the open one. Duels, reveals, and dialogs are exempt from stray-tap close.',
  '✕ LANDING VIEW CLOSE — the landing view carries a ✕, and a quick tap right after reopening can no longer strand it open.',
  '🎨 ORBIT COLOR MATCH — orbital art now matches the biome: carbon worlds graphite-dark, obsidian worlds near-black, magma seas glowing warm, blue-ice worlds cold, ember giants red.'],
 ],
 ['⚖ Balancing', [
  '🌩 STORM MODIFIER — an active storm adds 5 points of landing difficulty — never enough to trouble a friendly world.',
  '📋 NEW WEEKLY CHARTER — &#8220;Down the hard way&#8221; pays 35 ☄ for landing on a gas giant, hothouse, or molten world; adding it reshuffles the weekly board once at the next rollover.'],
 ],
 ['🐛 Bug Fixes', [
  '💫 REMNANT RENDERING — the dashes around supernova remnants and the drawn circles around cosmic deaths are gone; everything that dies in space now renders as a cloud.',
  '🪐 GAS GIANT READOUT — gas giant surfaces no longer report themselves as airless with no weather.'],
 ],
 ['🔧 Under the Hood', [
  '⚡ GALAXY RENDER — remnant and merger gradients are baked once instead of allocated every frame — lower battery draw on phones.',
  '💾 WAVE-OFF PERSISTENCE — wave-off progress on hard worlds saves with the expedition, so a reload keeps the climb.'],
 ],
]},
{v:'1.3', title:'The HD Frontier', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🏞 LANDING VISTAS — landing opens a painted surface view drawn straight from the survey card: terrain, weather, time of day, inhabitants, and nearby fauna. The card&#8217;s Landing vista button reopens it anytime.',
  '🎨 PER-WORLD VARIATION — horizon, sun, rivers, and plants all roll per world, with palettes that run to golden, copper, and violet forests. Rare touches: sky-spanning rings, a huge low moon, glowing shores.',
  '🐾 CREATURE PORTRAITS — Compendium art now matches the card&#8217;s traits: tentacled creatures have tentacles, armored ones plates, eyeless ones no eyes. Apex Guardians wear a molten-gold aura; Paragons a silver-teal one.',
  '🌦 WEATHER CYCLES — rain showers and dust storms pass now instead of running forever, and the readout reports clear skies between spells. Snow still lingers in cold country.',
 ]],
 ['🎨 UI Enhancements', [
  '⭐ STAR RENDERING — galaxy-view stars glow in true class colors with halos, spikes on the giants, and a twinkle on the brightest; nebulae, dark clouds, and supernova remnants gain real texture instead of flat circles.',
  '🪐 PLANET ART — the art now honors the survey card: dried seas and salt flats on hot worlds, ice on frozen ones, era-based night lights on civilized worlds, rings on card thumbnails, true moon colors, and per-star lighting in every system.',
  '✨ REVEAL SCALING — the discovery cinematic now escalates past Mythic all the way to the summit; the rarest creatures wear foil in the Compendium list, a caught Paragon&#8217;s Binder slot takes its true grade color, and Silicon earns its own icon color.',
  '🃏 CARD HANDLING — locked cards carry an <b>✕</b> (tapping empty space still closes them), and <b>any open card drags by its header</b>, mouse or finger.',
 ]],
]},
{v:'1.2.6', title:'Ink & Ember', date:'July 2026', sections:[
 ['🎨 UI Enhancements', [
  '🖋 EMPHASIS PASS — bold now marks only pressable items and proper names: some ~100 stray emphasis words across cards, battles, training, and these very notes reverted to plain text. In the brighter Text tones, gold marks the interactive bits.',
  '⚔ BATTLE LOG COLORS — a MUD-style color language: champion cyan, foe ember, damage yellow, crits gold, misses dim, burns orange, mending green, lifesteal violet, thorns lime, deaths red — victory prints gold, defeat red. Shared battle logs stay plain text.',
  '🎨 SYSTEM COLOR LANGUAGE — pop-ups and the bell tray now speak in color: red for harm, gold for milestones, green for gains. Long-range glances tint their readings (water cyan, life green, signals violet), the <b>Compendium</b> marks the Field Scout cyan, and <b>Star Atlas</b> and <b>Cosmic Events</b> follow suit.',
  '✍ COPY PASS — a full grammar and clarity sweep: stale button names corrected, the settings guide updated to its three tabs, one stray “Codex” label returned to the Prime Codex, and the First Contact <em>achievement</em> renamed First Specimen (the real first contact keeps its name).',
 ]],
]},
{v:'1.2.5', title:'First Contact', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🤝 FIRST CONTACT — landing on an inhabited world now attempts contact: a warm reception opens the census on the spot; a wary one wounds you and seals the census until your next landing; a named Field Scout takes that hit in your place. Conquered worlds skip contact entirely.',
  '📦 CARGO GRID — the Cargo hold is a real inventory grid now, with per-element icons: ingots for metals, shards for ices, flasks for gases, cut gems for exotics. The <b>Research Bench</b> moves to its own tab, carrying the same icons into every recipe.',
 ]],
 ['🎨 UI Enhancements', [
  '🛬 ONE LAND BUTTON — every world&#8217;s card shows a single <b>Land</b> button now; what happens next depends on the world. Manual zoom-in still works.',
 ]],
 ['🐞 Bug Fixes', [
  '🩹 CARD OVERFLOW — expanding a survey card&#8217;s Environment fold could push it off-screen with no way to scroll; the card now resizes and repositions itself as it unfolds.',
 ]],
]},
{v:'1.2.1', title:'The Hunt Board', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '📋 EXPEDITION CHARTERS — a hunt board joins the left rail. New explorers get five starter charters that chain the core trades in order — make planetfall, prospect a dead world, discover life, name a Field Scout, conquer a world — each paying ☄ Stardust on completion. A veteran&#8217;s already-proven trades arrive marked complete.',
  '🗓 WEEKLY BOARD — once the trades are learned, three fresh charters arrive each week, identical for every explorer in the universe.',
 ]],
]},
{v:'1.2', title:'The Discovery Arc', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🔎 THREE-STEP DISCOVERY — knowing a world comes in three tiers: a glance shows telescope reads (color class, atmosphere, water signatures, biosignatures, ⟁ signals — hover on desktop; on phone a tap goes straight to survey); the orbital survey reads environment and biosphere; and planetfall runs the full ground survey.',
  '🛬 LAND BUTTONS — an unlanded world carries one right on its card: <b>Land — make contact</b> on civilized worlds, <b>Land to prospect</b> on dead ones. One press flies you down; manual zoom-in still works.',
  '🤝 CIVILIZATION READS — a civilization can&#8217;t be read from orbit (you get ⟁ signals only); land and make contact to learn its tech era, calendar, and population.',
  '⛏ PROSPECTING GATE — a dead world&#8217;s ⛏ Mine Deposits unlocks only after you&#8217;ve landed on it; 🛰 Deep Scanners still read its veins from orbit.',
  '✅ GROUND-SURVEYED MARK — a visited world now carries a Ground-surveyed mark; every world you&#8217;d charted, settled, or mined before this update counts as ground-surveyed already (nothing known is re-hidden).',
  '⛳ FIELD SAMPLES — your first footfall on any world collects samples: a pinch of its elements plus a few ☄ Stardust, richer on rarer worlds.',
  '🐾 FIELD SCOUTS — press <b>Scout</b> on a fauna card to name your expedition&#8217;s scout; it soaks hostile bioscan hits through the standard wounds-and-mending system, and is lost forever at zero. Tougher scouts open deadlier worlds.',
 ]],
 ['🛠 Under the Hood', [
  '⚡ PHONE PERFORMANCE — the star field is painted once instead of every frame, survey readouts stop recomputing sixty times a second, card layout no longer thrashes, and phones render at a tuned resolution.',
 ]],
 ['🎨 UI Enhancements', [
  '🧭 SURVEY HEADINGS — heading emoji removed and alignment tidied; fold rows now read <b>expand</b> / <b>close</b> instead of a small triangle.',
 ]],
 ['🐞 Bug Fixes', [
  '🌍 EARTH MINING — Earth no longer offers <b>⛏ Mine Deposits</b>; it was the only living world with a mining action, a quirk of how home&#8217;s card is built. The dead worlds are where the elements live.',
 ]],
]},
{v:'1.1.2', title:'Clear Signals', date:'July 2026', sections:[
 ['🎨 UI Enhancements', [
  '🃏 SURVEY CARDS CONDENSED — actions on top, then rarity, life, and civilization; the environmental survey (atmosphere, climate, water, gravity, and more) folds behind a 🌍 chevron, and the census (tech era, calendar, population) behind its headline. Your fold choices are remembered.',
  '🔝 CARD ACTIONS — Star Atlas, Conquer, Mine, and Share now sit at the top of every survey card.',
  '📜 VISIBLE SCROLLBARS — every scrolling panel (release notes, survey cards, Guide, Compendium, and more) now shows a visible thumb on a faint track.',
  '⚙ SETTINGS WIDTH — the panel is wider now, and option pills can no longer overflow its right edge at any font size.',
  '📰 BULLETIN CONTEXT — the “What&#8217;s new” bulletin carries its whole release line (1.1.2 shows the 1.1.1 and 1.1 notes beneath it).',
 ]],
]},
{v:'1.1.1', title:'Signal & Polish', date:'July 2026', sections:[
 ['🎨 UI Enhancements', [
  '⚙ SETTINGS SPACING — option pills keep a clean gap from their labels now (Font and Motion had been touching).',
 ]],
 ['🛠 Under the Hood', [
  '🏷 EXTERNAL NAMING — the browser tab, link previews, and search results all say Celestial Frontier now; the old “Cosmic Codex” page subtitle is retired (the Prime Codex keeps its name).',
 ]],
]},
{v:'1.1', title:'Field Reports', date:'July 2026', sections:[
 ['✨ New Features & Systems', [
  '🔊 CORE SOUND EFFECTS — a sonar ping on survey taps; a whoosh on hyperlane travel and planetfall.',
  '🎚 SOUND VOLUME SLIDER — Settings → Audio: one master level for every effect.',
  '♿ MOTION SETTING — Settings → Graphics: <b>Auto</b> honors the device&#8217;s reduce-motion preference (and keeps listening for it); <b>Full</b> / <b>Reduced</b> override. Reduced stills the travel tunnel, screen shake, confetti, and foil shimmer.',
  '✎ EXPLORER RENAME — Settings → Display → Explorer name, or the ✎ link atop the character sheet; your record persists, only the name changes.',
 ]],
 ['🎨 UI Enhancements', [
  '🤫 QUIET TRAINING — during Field Training, pop-ups rest in the 🔔 tray (nothing is lost) and tooltips hold; a blocked scroll nudges the guidance card instead of failing silently.',
  '🔠 LABEL SCALING — survey-card labels are brighter and now scale with the A+ / A++ text sizes.',
  '🖱 DESKTOP HINT — corrected: hovering previews a card, a click surveys it.',
  '👆 TOUCH TARGETS — everything tappable in the sky, plus the small Atlas and Settings controls, gained larger hit areas — no visual change.',
  '⌨ KEYBOARD SUPPORT — Settings, Compendium, Binder, Star Atlas, and Guide entries are tabbable and fire on Enter or Space, each with a visible focus ring.',
 ]],
 ['🚀 Gameplay', [
  '🛬 LANDING ASSIST — zooming into a view-filling, off-center planet glides the camera the rest of the way and lands, instead of silently maxing out; only a deliberate zoom-in triggers it (panning, pinching, and moon-gazing are never hijacked).',
 ]],
 ['🐞 Bug Fixes', [
  '🌙 MOON TAP TARGETS — tiny moons no longer steal taps aimed at their planet (“tap Earth” lands on Earth): a moon’s tap target matches its visible size, the generous grab returns up close, and planet targets grew a little.',
  '🎓 TRAINING RANK UP — the sandbox promotion is handed back with the practice cache; the real Rank Up fanfare waits for the real thing.',
  '✎ RENAME DIALOG — closes with Esc or Cancel now instead of demanding a name.',
 ]],
 ['🛠 Under the Hood', [
  '📰 WELCOME BULLETIN — pinned to the shipped version’s notes, so a fresh expedition always opens on the game overview, never a work-in-progress changelog.',
 ]],
]},
{v:'1.0', title:'The Frontier Opens', date:'June 2026', sections:[
 ['🌌 An Infinite, Shared Universe', [
  '🌱 DETERMINISTIC COSMOS — every galaxy, star, and world is grown from seeds, identical for every explorer, fully offline, no account needed. Four seamless scales: universe → galaxy → star system → planet surface.',
  '🚀 HYPERLANE TRAVEL — jump time scales with distance, and researched drives cut it sharply. The travel tunnel takes on the destination’s light; tap to skip.',
  '🃏 SURVEY CARDS — for worlds, stars, black holes, wormholes, supernovae, and the cosmic microwave background alike, each with a spectral designation color-coded by rarity.',
  '🗺 FRONTIER REGIONS — the charter begins at the Solar Reach and widens with each Signature claimed: Local Cluster, Near Field, Deep Field, Outer Dark, Frontier. The farther out you reach, the tougher the defenders and the stranger the life.',
  '🌠 COSMIC EVENTS — events on every timescale, cycling by the hour, week, month, and year, identical for every explorer at the same moment; the 📜 Witness Log keeps them all.',
 ]],
 ['🧭 The Explorer’s Tools', [
  '🧭 NAVIGATION TOOLS — the <b>Star Atlas</b> bookmarks worlds with favorites and a home marker; <b>search</b> spans everything you&#8217;ve discovered or named, and accepts pasted codes; and the Traveler’s Beacon posts a shared destination every five minutes.',
  '🔗 SHARE CODES — CF1- codes land a friend on your exact world; CFB- codes summon your exact creature for a duel; and 📸 discovery records export Legendary-or-better finds as paste-anywhere keepsakes.',
  '🎓 FIELD TRAINING — a fully sandboxed tutorial for every new expedition: chart Earth, train with a loaned cache, feed, breed, duel, take a scratch, heal. Skippable for veterans, and nothing from training ever carries out.',
  '📖 THE GUIDE — a searchable <b>🧭 Guide to the Universe</b> covering every system; open it with ? anytime (its version line opens these very notes).',
 ]],
 ['🧬 Life & the Compendium', [
  '⚗ THE COMPENDIUM — catalogue life across four kingdoms and sixteen realms; a painterly portrait engine stages every creature in the habitat where you found it.',
  '🏅 RARITY LADDER — a deep rarity ladder runs from Common up to a one-in-a-million summit, with foil frames at the very top. Once earned, a grade never falls.',
  '🧬 BREEDING & FEEDING — <b>Breed</b> hybrids (both parents are consumed) and <b>feed</b> for permanent growth and medicine; rarer flora poison deeper, and only a spent beast dies of it.',
  '👑 APEX GUARDIANS — named, one-of-a-kind summit titans rule rare worlds — the same rulers for every explorer — and defeating one in conquest adds it to your Compendium.',
  '🜲 THE FIFTY PARAGONS — legendary deep-spectrum creatures wait on fixed worlds, shown as Binder silhouettes until found; share the coordinates and every explorer faces the same legend.',
  '🌱 LIVING COLLECTION — the Compendium interbreeds and evolves on the cosmic clock, and worlds re-roll their rosters as the universe ages. Sapience runs from Instinctive to fully Sapient, and worlds host civilizations from stone-age to starfaring.',
 ]],
 ['⚔ Battle', [
  '⚔ CLASSES & LEVELS — every beast is born to one of 180+ classes (Warrior to Worldbreaker, the legendary ones reserved for the summit) with innate, always-on arts. XP comes only from wins — duels, conquests, guardians — and levels wake more arts; raw stats never inflate on their own.',
  '✨ ABILITY MATRIX — hundreds of arts (“Fire Reckoning III”) balanced across thousands of simulated duels; hybrids inherit the other parent’s archetype, and guardians fight with Sovereign arts.',
  '📜 THE CHRONICLE — duels are narrated blow-by-blow: initiative, named arts, executes, thorn recoils, burn ticks, death lines — closing with a statistics ledger and a shareable battle log.',
  '🏴 CONQUEST — champion a world yourself or send a beast; settled worlds fly your flag, scan safely, and pay Stardust, and a world&#8217;s home field lets its defenders fight in their element.',
  '🩹 PERSISTENT WOUNDS — conquest scars and resented meals leave a beast Bruised, Injured, or Critical, fighting below strength until mended; feeding is medicine (loved flavours mend most, rarer flora mend deeper — and poison harder). Hostile bioscans cost you explorer HP, and zero HP ends the expedition.',
 ]],
 ['🛠 Progression', [
  '🔑 THE PRIME CODEX — nine elemental Signatures, each guarded by a named titan; master all nine to command the forces of the universe and open the Celestial Frontier — with multiple endings.',
  '⛏ MINING & RESEARCH — dead worlds carry the elements; stock the 🧰 Cargo and spend at the bench on scanners, hull, lab, and the drive ladder (Fusion → Antimatter → Warp Fold).',
  '🗂 THE BINDER — collect types, not individuals: fixed pages, identical for every explorer, with claimable Sets that pay Stardust bounties.',
  '🏆 RANKS & RECORDS — ten explorer ranks with unlockable nameplate colors (foil at Eternal Frontier), dozens of achievements, the Star Atlas, the Traveler’s Beacon, cosmic events with their 📜 Witness Log, 📸 discovery records, and share codes for worlds and creatures alike.',
 ]],
 ['⚙ The Craft', [
  '📱 PLATFORM — one file, offline-capable, mobile-first, and deterministic to the byte: the same universe on every device, verified by a 50-probe fingerprint and a full headless test fleet on every build.',
  '⚙ OPTIONS — <b>Display / Graphics / Audio</b> tabs: text size, tone, font, tooltips, effects, shake, sound, notifications — all persistent. The version line under <b>?</b> opens these notes. Saves are browser-local; back up favorites as ⇪ creature codes.',
 ]],
]},
] as const satisfies readonly LegacyRelease[];

export const V2_RELEASE_CATEGORIES = Object.freeze([
  'New Features & Systems',
  'UI Enhancements',
  'Gameplay',
  'Balancing',
  'Bug Fixes',
  'Under the Hood',
] as const);

export type V2ReleaseCategory = (typeof V2_RELEASE_CATEGORIES)[number];

export interface V2ReleaseSection {
  readonly category: V2ReleaseCategory;
  readonly bullets: readonly string[];
}

export interface V2ShippedRelease {
  readonly status: 'shipped';
  readonly version: string;
  readonly title: string;
  readonly date: string;
  readonly sections: readonly V2ReleaseSection[];
}

export interface V2DraftRelease {
  readonly status: 'draft';
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly date: 'Unreleased';
  readonly sections: readonly V2ReleaseSection[];
}

/**
 * Development copy only. v2.0 is the authorized playtest identity, not a
 * shipped production release and not eligible for update-popup comparison.
 */
export const V2_DRAFT_RELEASE = Object.freeze({
  status: 'draft',
  id: 'v2-development',
  version: V2_DEVELOPMENT_VERSION,
  title: 'A New Foundation',
  date: 'Unreleased',
  sections: Object.freeze([
    Object.freeze({
      category: 'New Features & Systems',
      bullets: Object.freeze([
        '🌌 THE FRONTIER HAS A NEW FOUNDATION: A playable TypeScript and Pixi v2 development build carries one deterministic expedition from the infinite universe through galaxies and star systems to Planetside, with the current view preserved across reloads.',
        '✨ A UNIVERSE WORTH CROSSING: The streaming sky layers a cosmic web, galaxy haze and nebulae, named stellar fields, compact objects, wormholes, supernova remnants, belts, rings, moons, comets, clouded worlds, and a seeded deep-space backdrop.',
        '🦋 EARTH LIFE LOOKS LIKE ITSELF: The rebuilt portrait library gives familiar fauna, flora, fungi, and microbes anatomy, materials, poses, markings, and species-true color instead of generic or repeatedly recolored forms.',
        '🧬 ALIEN LIFE SPEAKS THE SAME VISUAL LANGUAGE: Planetside stages deterministic biospheres whose procedural organisms vary by kingdom, body family, habitat, silhouette, substrate, and seeded palette, while imported discoveries keep their exact identity in the Compendium.',
        '🗂 THE EXPLORER’S BOARDS RETURN: Current-slice versions of the Star Atlas, read-only Compendium, Records, Charters, Settings, Field Training, and protected expedition import are open for development playtests.',
        '🎒 EVERY PIECE STAYS ITSELF: Inventory migrates each owned explorer-gear copy into a stable exact item instance with its slot, base effects, legacy affix, provenance, equipped binding, and protection state intact. Oversized legacy holds remain lossless inspection-only evidence instead of being truncated to fit an invented capacity.',
        '🛠 ENGINEERING TURNS OPPORTUNITY INTO REACH: Engineering & Shipyard keeps its capability-derived preview, then adds finite grounded Mine and Jump-gated Skim actions, exactly six Research rows, and all 62 fixed Fabricator recipes. Only Deep Scanners can currently be purchased; its orbital reveal policy is durable, while the current Survey card does not yet render those mineral rows. Fabrication enables only outputs with connected effects and exact cost, prerequisite, revision, and capacity headroom. Fully exceptional slotted crafting, authored affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable. Built permanent systems change the real ship and star reach; a legacy charter refit still never names or draws a missing drive. Remnant skim damage is previewed before it can spend HP, Engineering can spend preserved Stardust but does not earn it, and no reward, cost, Charter tick, or optimistic panel change publishes before the one receipt-bearing transaction commits.',
        '📖 THE WHOLE FIELD MANUAL: The mature Guide returns with nine categories and 41 player topics drawn from 43 authored stable IDs, plus search, cross-links, and explicit current-slice notes, so mechanics that are not yet playable are labelled instead of promised.',
        '💾 EXPEDITIONS HAVE A GUARDED HOME: IndexedDB persistence, last-known-good recovery, complete expedition import, and protected handling for incomplete, corrupt, transiently unavailable, or newer-build saves replace the temporary slice store.',
        '🔊 THE FRONTIER SPEAKS: Survey pings and travel, planetfall, and ascent whooshes answer the live exploration loop, governed by the persistent Sound and Volume controls.',
      ]),
    }),
    Object.freeze({
      category: 'UI Enhancements',
      bullets: Object.freeze([
        '🫧 ONE GLASS LANGUAGE: The v2 command deck unifies the top bar, objective, breadcrumbs, Survey, panels, contextual hints, phone dock, and desktop rails in one responsive presentation.',
        '⚖ COMPARISON TELLS THE WHOLE STORY: Inventory opens from the phone dock or desktop rail, keeps a bounded 48-row page, and gives one selected item a focus-owned detail sheet whose comparison includes every base and affix delta, conditional context, provenance, and equipped state.',
        '📱 PHONE FIRST, EVERYWHERE ELSE READY: Safe areas and measured top, context, and dock heights keep controls clear from 320-pixel phones through tablets, laptops, desktops, ultrawide displays, and short landscape screens.',
        '🪐 PLANETSIDE KEEPS ITS ROOM: On constrained touch layouts the objective and context trail yield when necessary, while an open Survey keeps an 8-pixel clear stack above a useful vertically scrollable biosphere area instead of covering its specimens or capture actions.',
        '↔ SHORT LANDSCAPE KEEPS EVERY COMMAND: Opening the Compendium now gives its variable-height rows a full safe-height left workspace while Search, Survey, and the dock remain visible and usable in a separate right column.',
        '⌨ THE SKY ANSWERS EVERY INPUT: Pointer, touch, wheel, pinch, and keyboard explorers share the same survey outcomes; arrows cycle visible bodies, Enter or Space surveys, plus and minus zoom, and Escape releases focus or rises one level.',
        '♿ ACCESSIBILITY IS PART OF THE SHELL: Text size, text tone, font, panel tint, visible focus, forced-colors treatment, minimum 44-pixel actions, named controls, focus restoration, and true reduced-motion behavior are built into the live surfaces.',
        '🧪 BUILD IDENTITY STAYS IN THE GUIDE: The development page shows Celestial Frontier v2.0 plus its full source commit inside the Guide, without covering the playable sky with a floating DEV badge.',
        '🔔 UTILITIES STAY IN THEIR CORNER: Desktop notifications rise above the measured bottom-right dock edge, and Settings and Records open from that same utility anchor with balanced spacing, dividers, radii, and inset borders.',
        '✕ ONE SURFACE, ONE CLOSE: Every panel and Survey card owns exactly one 44-pixel top-right Close action; refilling a card cannot duplicate it, detach it to the upper-left, or strand keyboard focus behind a hidden surface. Spacing inside either desktop rail belongs to that command deck and leaves the active panel open; a genuine empty-sky press still dismisses it.',
        '🖥 SHARP WHERE IT COUNTS, RESPONSIVE WHERE IT HURTS: Native backing is preserved through UHD, while larger displays use a deterministic capped tier that keeps the live scene answerable without allocating two full-resolution 8K canvases.',
      ]),
    }),
    Object.freeze({
      category: 'Gameplay',
      bullets: Object.freeze([
        '🚀 SURVEY BEFORE YOU TRAVEL: One selection opens a card; explicit Enter galaxy, Enter system, Land, and Leave world actions make descent deliberate on mouse, touch, and keyboard instead of depending on a second tap or timing window.',
        '🔗 WORLD CODES KEEP THE WHOLE DESTINATION: CF1 addresses preserve galaxy, star, planet, coordinates, and accepted custom names. Every accepted galaxy, star, or planet route is regenerated from the seeded universe and source-verified instead of trusting the code. A stale or forged code leaves the current view unchanged and keeps the exact query unchanged. An in-reach planet address returns to Survey without bypassing Land; an out-of-reach address leaves the explorer in place. A star beyond owned ship reach stays blocked until Engineering builds the required permanent system. A galaxy beyond the saved Prime Signature radius stays blocked because Prime Signature earning is not available in this development slice.',
        '🧭 THE ATLAS LEADS BACK: Charted galaxies, stars, and worlds can reopen their own navigation level only after the saved route is regenerated from the seeded universe and source-verified. Stale, forged, or incomplete rows remain visible but disabled with an honest unavailable label; a proven planet entry returns to Survey and Land remains explicit.',
        '🔎 SEARCH UNDERSTANDS DISCOVERIES AND ADDRESSES: The top-bar field filters imported Compendium life and accepts CF1 world codes, with an exact selected-text fallback when browser clipboard access is denied.',
        '🐾 BIOSPHERE CAPTURE HAS HONEST LIMITS: On a living world, Tame chooses uniformly from every eligible fauna in the full biosphere, Scavenge from eligible flora and fungi, and Sample from eligible microbes—not only the at-most-eight-row Planetside preview. All three share one finite Biosphere Yield; every attempt spends 1 on a hit or miss, and the pool fully recovers at the next 20-minute active-play cycle, never from closing the game or moving the wall clock. A successful species leaves that action’s pool for the rest of the cycle, while a miss stays eligible. The first successful observation adds one Compendium page plus one owned creature for Tame or one specimen lot for Scavenge and Sample. A Legendary-or-better first find also awards its one Rare Find Stardust bonus, with the exact amount shown in the result. A later-world or later-cycle repeat adds another creature or lot without another page or first-find reward; a miss adds none of them. Scavenge and Sample never create living companions. Capture never banks the Charter’s separate bioscan milestone. Feeding, breeding, renaming, Field Scouts, duels, conquest, passive evolution, companion assignment, and missions remain unavailable.',
        '🔒 THE FRONTIER HONORS YOUR PROGRESS: Owned Jump Drive, Long-Range Array, and Intergalactic Drive systems—with compatible Charter state—gate star travel; successful fixed fabrication can extend that reach immediately. Saved Prime Signatures separately gate galaxy distance. A blocked destination never moves the camera or quietly skips the requirement, and chapter progress alone never invents a system.',
        '🪐 FIRST PLANETFALL COUNTS: Only a world’s first landing banks the live landfall objective and visible worlds-landed Record; revisits bank and pay nothing. Successful Mine presses and fixed Fabricator outputs now bank only their exact Charter goals, while Research and Skim bank neither. Mine, Skim, and Fabricator compatibility counters persist, but the visible Records board does not list those Arc 3 counters yet. Any successful Land, Mine, or Fabricator commit may reconcile an imported Chapter only when canonical progress and owned reach already prove it.',
        '🧾 GEAR ACTIONS SETTLE ONCE: Equip, Unequip, confirmed Salvage, and pending-reward claim use the tab lease, save revision, exact item identity, and one immutable receipt. A double press, stale tab, failed write, or reload cannot duplicate or reroll the action; salvage follows the exact legacy direct-material-half return instead of inventing scrap or Stardust.',
        '🎓 FIELD TRAINING LIVES IN THE NEW SHELL: Six real lessons teach finding Earth, surveying, charting, opening the Atlas, and landing, followed by an honest Finish for now that points to live Engineering & Shipyard and Planetside capture without pretending the navigation drill performs either action. Restart captures the exact pre-Training view. A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view; if verification pauses, that exact view stays saved, and when Sol can still be verified, Training returns there so a reload can restart safely and retry. Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured; every other expedition field is retained from the surrounding save. That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth. An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged; reload after updating, or import a trusted complete expedition.',
      ]),
    }),
    Object.freeze({
      category: 'Bug Fixes',
      bullets: Object.freeze([
        '💾 PROTECTED MEANS PROTECTED: Sparse, corrupt, transiently unavailable, and newer-build saves are classified before promotion, and a recovery backup is proven safe before it can replace the primary. Invalid or future backup bytes cannot destroy the evidence they were meant to recover.',
        '🔄 AN IMPORT CANNOT BE OVERTAKEN: Expedition replacement cancels and drains queued preference writes, then claims one exclusive reload transaction so an older save cannot overwrite the imported expedition or another flow’s rollback.',
        '🧾 THE ORIGINAL IMPORT STAYS ORIGINAL: When browser storage allows the optional keepsake, it retains the exact submitted text, including legal surrounding JSON whitespace; the moderator-held source file remains the byte-for-byte authority.',
        '🧷 CARDS ACT ON WHAT THEY SHOW: Land, Atlas, Share, and travel actions bind to full composite identity, preventing an equal seed at different coordinates from inheriting stale controls.',
        '🗺 OLD ATLAS ROWS NO LONGER PRETEND: Imported entries with incomplete legacy coordinates stay visible but disabled, rather than offering a travel action that cannot resolve its destination.',
        '📎 COPY FEEDBACK TELLS THE TRUTH: Clipboard denial no longer reports success; the exact world code is selected in Search with a browser-copy instruction.',
        '📋 THE CHARTER STOPS AT THE LIVE FRONTIER: The primary chip and Charter board show only landfall, mining, and fixed-fabrication goals with real outcome writers. Bioscan, conquest, and breeding milestones remain hidden until their actions exist; unavailable progression is not presented as work to do.',
        '📋 COMPLETE IMPORTED CHAPTERS MOVE AGAIN: Saturated veteran Charter records no longer wedge. Any successful planetfall acknowledges every consecutive already-proven, reach-backed chapter without rebanking or inventing progress, while incomplete or unpowered records stay put.',
        '🎓 A LESSON OWNS ITS ESCAPE KEY: Active Field Training keeps the navigation and Survey state needed by the current step instead of ascending or closing the only required action.',
        '🎞 REDUCED MOTION ACTUALLY STILLS THE SCENE: Visual animation clocks, camera easing, fades, and decorative scene transforms stop or settle instead of leaving the most expensive motion running behind a preference.',
        '🌈 RARITY IS NOT A SPECTRAL CLASS: Survey cards no longer show a player-facing Spectral class row. Galaxies and stars show plain Rarity immediately; planets reveal plain Rarity only after landing. Seeded spectral color remains internal art data, and real stellar G/K/M/remnant classification remains astronomical identity.',
        '🖥 RELOADS RELEASE THE OLD SKY: Training restart, expedition import, and storage recovery stop and release the outgoing renderer and full-size canvases before the replacement page starts, preventing overlapping scenes and very-large-display starvation.',
        '↔ RESIZING KEEPS YOUR PLACE: Density and viewport changes refresh canvas, pointer, Survey, and backdrop geometry while preserving the current location and open card, including same-backing 8K-to-5K transitions.',
        '🦋 COLD PLANETSIDE ART NO LONGER FREEZES THE DECK: Loading and painting the first specimen thumbnails now happens away from the renderer thread, so Search, navigation, and browser controls stay answerable while neutral tiles fill in; the globe starts at the resolution its fitted size needs and upgrades only when real zoom or display density asks for a sharper tier.',
      ]),
    }),
    Object.freeze({
      category: 'Under the Hood',
      bullets: Object.freeze([
        '🧱 A MODULAR CORE UNDER ONE UNIVERSE: Deterministic domain facades, strict root and app TypeScript programs, Pixi rendering, and IndexedDB persistence form the current playable Phase-4 foundation without changing seeded world identity.',
        '🔐 ONE DURABLE AUTHORITY AT A TIME: Versioned split-store saves, a per-document tab lease, revision fences, immutable receipts, an active-play-only clock, and isolated SessionRNG counters commit product state together. A losing tab cannot silently rebase, and a failed transaction publishes neither the reward nor its entropy advance.',
        '📦 ART ARRIVES WHEN IT IS NEEDED: Species art loads on demand. The read-only Compendium supports up to 1,500 logical entries while mounting the visible viewport plus half a viewport of overscan on each side (about two viewports total), plus at most the focused pinned row; each visible row moves from a neutral placeholder to an exact 132px thumbnail keyed by the complete genome. Search filters the logical count, Back restores the saved row and focus, and Close returns focus to the exact opener. Planetside shares the same bounded thumbnail lease path, leases release with their visible owners, and only specimen detail publishes and retains an exact 440px portrait; thumbnail scratch art is downsampled to 132px before it crosses the worker boundary.',
        '🧵 ONE BACKGROUND PAINTER AT A TIME, OWNED END TO END: A dedicated worker imports the heavy portrait graph only after a real owner and a serviced boot turn. One broker serializes work, deduplicates complete-genome keys, bounds caches and leases, validates every 132px/440px result, contains failed tiles, revokes stale bfcache work, and terminates an idle or replaced producer without a synchronous renderer fallback.',
        '🪐 HD SURFACES HAVE ONE NAMED OWNER: A named HD surface-planet texture attachment binds each completion to the exact surface generation and planet identity, retains the displayed predecessor until an acquired successor publishes, rejects stale work, suppresses same-texture swaps, and cancels and releases its timer and leases at the owning scene boundary.',
        '📚 HISTORY STAYS HISTORY: All 56 v1 releases and 398 legacy bullets remain byte-parity checked and separate from the v2.0 development bulletin; this draft cannot trigger the shipped-update popup or mutate the seen-release marker.',
        '🧪 THE TEST FLEET DRIVES THE REAL SURFACES: Determinism and parity checks, full TypeScript tests, one-attempt browser smoke, a 12-viewport responsive matrix, deliberate broken-build controls, and nine automated play lenses guard the development package. Automated lenses still do not replace human play.',
        '🔬 RELOADS HAVE AN EVIDENCE CHAIN: Import settlement, renderer release, navigation commit, replacement boot, ready publication, and later page commandability are measured as separate ordered outcomes instead of one blind reload delay.',
        '❤️ THE BROWSER GETS A VOTE: Exact-page checks run beside an independent browser heartbeat, so a scene that cannot answer is reported as a product finding rather than hidden as a test timeout or retried away.',
        '🌐 DEVELOPMENT PUBLISHING IS ISOLATED: A successful develop push battery builds and browser-smokes an exact-commit v2.0 package for the separate noindex development origin, with full Guide identity, origin refusal, and byte inventory; production remains the v1.8.9 main-branch site.',
      ]),
    }),
  ]),
} as const satisfies V2DraftRelease);

/** No v2 production release has been authorized or shipped. */
export const V2_CURRENT_RELEASE_VERSION: null = null;
export const V2_SHIPPED_RELEASES =
  Object.freeze([] as V2ShippedRelease[]);

export interface ReleaseNoteSectionView {
  readonly heading: string;
  readonly bullets: readonly string[];
}

export interface ReleaseNoteView {
  readonly channel: 'v2' | 'legacy';
  readonly status: 'draft' | 'shipped' | 'legacy';
  readonly version: string | null;
  readonly title: string;
  readonly date: string;
  readonly sections: readonly ReleaseNoteSectionView[];
}

export interface ReleaseHistoryOptions {
  /** Historical v1 releases, clearly labelled legacy. Defaults to true. */
  readonly includeLegacy?: boolean;
  /** Unshipped internal copy. Defaults to false and must never drive a popup. */
  readonly includeDraft?: boolean;
  /** Test/release-coordinator injection; defaults to the authorized list. */
  readonly shippedReleases?: readonly V2ShippedRelease[];
}

function legacyView(release: LegacyRelease): ReleaseNoteView {
  return Object.freeze({
    channel: 'legacy',
    status: 'legacy',
    version: release.v,
    title: release.title,
    date: release.date,
    sections: Object.freeze(release.sections.map(([heading, bullets]) =>
      Object.freeze({
        heading,
        bullets: Object.freeze(bullets.slice()),
      }))),
  });
}

function v2ShippedView(release: V2ShippedRelease): ReleaseNoteView {
  return Object.freeze({
    channel: 'v2',
    status: 'shipped',
    version: release.version,
    title: release.title,
    date: release.date,
    sections: Object.freeze(release.sections.map((section) =>
      Object.freeze({
        heading: section.category,
        bullets: Object.freeze(section.bullets.slice()),
      }))),
  });
}

function v2DraftView(release: V2DraftRelease): ReleaseNoteView {
  return Object.freeze({
    channel: 'v2',
    status: 'draft',
    version: release.version,
    title: release.title,
    date: release.date,
    sections: Object.freeze(release.sections.map((section) =>
      Object.freeze({
        heading: section.category,
        bullets: Object.freeze(section.bullets.slice()),
      }))),
  });
}

export function getLegacyRelease(version: string): LegacyRelease | undefined {
  return LEGACY_RELEASES.find((release) => release.v === version);
}

/** Mirrors the mature latest-popup rule: include the shipped patch's full minor line. */
export function getLegacyReleaseLine(
  version: string = LEGACY_GAME_VERSION,
): readonly LegacyRelease[] {
  const shippedIndex = LEGACY_RELEASES.findIndex((release) => release.v === version);
  const start = shippedIndex < 0 ? 0 : shippedIndex;
  const minorLine = version.split('.').slice(0, 2).join('.');
  const line = LEGACY_RELEASES.filter((release, index) =>
    index >= start
    && (release.v === minorLine || release.v.startsWith(`${minorLine}.`)));
  return Object.freeze((line.length ? line : [LEGACY_RELEASES[0]]).slice());
}

export function getCurrentV2Release(
  currentVersion: string | null = V2_CURRENT_RELEASE_VERSION,
  shippedReleases: readonly V2ShippedRelease[] = V2_SHIPPED_RELEASES,
): V2ShippedRelease | undefined {
  if (currentVersion === null) return undefined;
  return shippedReleases.find((release) => release.version === currentVersion);
}

/** A draft can never be "unseen"; only an authorized shipped version can. */
export function hasUnseenV2Release(
  seenVersion: string | null | undefined,
  current: V2ShippedRelease | undefined = getCurrentV2Release(),
): boolean {
  return current !== undefined && seenVersion !== current.version;
}

export function getReleaseHistory(
  options: ReleaseHistoryOptions = {},
): readonly ReleaseNoteView[] {
  const includeLegacy = options.includeLegacy ?? true;
  const includeDraft = options.includeDraft ?? false;
  const shippedReleases = options.shippedReleases ?? V2_SHIPPED_RELEASES;
  const releases: ReleaseNoteView[] =
    shippedReleases.map(v2ShippedView);
  if (includeDraft) releases.unshift(v2DraftView(V2_DRAFT_RELEASE));
  if (includeLegacy) releases.push(...LEGACY_RELEASES.map(legacyView));
  return Object.freeze(releases);
}
