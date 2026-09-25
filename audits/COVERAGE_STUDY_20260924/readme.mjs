// Regenerates README.md from painting-plan.json + verdicts.json. Run from this folder: node readme.mjs
import fs from 'node:fs';
const plan = JSON.parse(fs.readFileSync('painting-plan.json', 'utf8')), v = JSON.parse(fs.readFileSync('verdicts.json', 'utf8'));
const rows = Object.entries(v.tally).map(([k, t]) => ({ k, ...t, n: t.good + t.caveat + t.misleading })).sort((a, b) => b.n - a.n);
const total = rows.reduce((s, r) => ({ n: s.n + r.n, g: s.g + r.good, c: s.c + r.caveat, m: s.m + r.misleading }), { n: 0, g: 0, c: 0, m: 0 });
const verdict = new Map(v.rows.map((r) => [r.name, r.verdict]));
let cum = 0;
const top = plan.archetypes.slice(0, 20).map((a, i) => { const fixes = a.covers.filter((n) => verdict.get(n) === 'misleading').length; cum += fixes; const tpl = a.bodyPlan.startsWith('NEW') ? a.bodyPlan.split(' (')[0] : a.bodyPlan; return `| ${i + 1} | ${a.exemplar} | ${tpl} | ${a.covers.length} | ${fixes} | ${cum} |`; });
const masks = plan.masks.filter((m) => m.unlocks.length).map((m) => `   - **${m.archetype}** → ${m.unlocks.join(', ')}`);
const noStand = plan.noStandInPlans.map((p) => `   - **${p.exemplar}** (${p.covers.length}): ${p.covers.join(', ')}`);
const md = `# Body-plan coverage study (2026-09-24)

**Question.** The vision says each new painted archetype is worth its whole body plan. If every Earth species were drawn as its
body plan's ONE painted archetype, recoloured and re-proportioned by the morph system, which species would a player accept?
**This is decision material for Nick. Nothing is wired.**

## Method
- \`dataset.mjs\` → \`dataset.json\`: all 631 Earth fauna (\`reference/fauna.json\`, with each species' \`mustRead\` recognition features)
  mapped through the presentation profiles to a body-plan template and its stand-in archetype. 17 are painted themselves; **53 have no
  template with a painted archetype** (snails, worms, shrimp, clams, lobsters…); **${total.n}** were judged.
- \`coverage-judges.workflow.js\`: per chunk of about 24 species, two independent judges, an ANATOMIST (part inventory, silhouette) and a
  PLAYER (would you recognise it at phone size?). Each looked at the stand-in painting and was told exactly what the morph can and cannot
  change: palette; markings only where painted masks exist; head 0.85–1.2 and tail 0.7–1.35; no parts added or removed. A third judge
  settled disagreements, and a synthesis stage clustered the misleading species into proposed new paintings.
  Raw verdicts are in \`verdicts.json\` and the plan is in \`painting-plan.json\`.
- These are model judgements, not measurements. Use them to rank work; Nick's eye decides the art.

## Result: ${total.g} good, ${total.c} caveat, ${total.m} misleading (of ${total.n})

| stand-in | species | good | caveat | misleading |
|---|---|---|---|---|
${rows.map((r) => `| ${r.k} | ${r.n} | ${r.good} | ${r.caveat} | ${r.misleading} |`).join('\n')}

**The multiplier alone does not cover the vision.** With one painting per body plan, the Civet stands in for ${rows.find((r) => r.k === 'Civet').n}
mammals and reptiles, the Eagle for ${rows.find((r) => r.k === 'Eagle').n} birds and the Salmon for ${rows.find((r) => r.k === 'Salmon').n} fish and whales.
The morph system does its own job (the individuals of one silhouette); the library needs more paintings, but far fewer than one per species.

## The painting plan, ranked by species fixed (top 20 of ${plan.archetypes.length}; the full list is in \`painting-plan.json\`)

| # | paint | template | covers | misleading fixed | cumulative fixed |
|---|---|---|---|---|---|
${top.join('\n')}

"covers" counts every species the painting would stand in for; "misleading fixed" counts only those judged misleading today.
Breadth beats fidelity: the top 10 fix 120 species, the top 20 fix 195 and the top 35 fix 267. The last 53 each fix one.
Each entry in \`painting-plan.json\` carries a \`mustPaint\` list (the features the painting must show) for the painter's brief.

## Four rules the study surfaced
1. **Paint every new archetype on a PLAIN base coat, with its own six-mask set.** The morph keeps luminance, so a painting's own marks
   (the Civet's spots and ringed tail) appear on everything it stands in for. No mask can turn a spotted civet into a striped tiger.
2. **Cheap wins with no new painting.** Mask sets on existing paintings:
${masks.join('\n')}

   Moving Fiddler Crab's profile to brachyuran also lets the painted Crab stand in.
3. **The 53 with no stand-in.** Their profiles need pointing at specialized templates that exist but are unused (crustacean-small,
   annelid, gastropod, bivalve, sessile-filter…). Then these paintings cover most of them:
${noStand.join('\n')}
4. **Five archetypes need a rig change before painting:** primate + tail (Capuchin, Aye-Aye), hopper + tail (Kangaroo), decapod
   cephalopod (Squid), arachnid + tail (Scorpion) and shelled cephalopod (Nautilus).

In the game an Earth name is ASSIGNED to a procedurally generated genome, so a species' colours and pattern gene are procedural. A mask
shows only when that individual's pattern gene selects it, so check the genes before painting a mask for one species.

## Owners
- **Nick:** which paintings, in what order. The plan is ranked by coverage; the art is his call.
- **Codex (painting and the anatomy chain):** paint and fit the chosen archetypes, make the five rig changes and wire the unused-template profiles.
- **Claude:** each new archetype joins the card and the arena the day it lands (one generated list). A species → stand-in registry waits for
  Nick's word, because it would put a morphed painting on species this study marks caveat or misleading.
`;
fs.writeFileSync('README.md', md); console.log(md.split('\n').length, 'lines');
