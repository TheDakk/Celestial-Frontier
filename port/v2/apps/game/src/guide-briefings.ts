/** D19: read-only v2 briefings; each link opens the capability-aware Guide. */
export const V2_ADVANCED_BRIEFINGS = Object.freeze([
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
].map(row => Object.freeze(row)));
