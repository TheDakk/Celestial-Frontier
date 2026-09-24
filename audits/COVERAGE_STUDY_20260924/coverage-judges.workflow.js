export const meta = {
  name: 'coverage-study-judges',
  description: 'Judge, for 561 Earth species, whether a morphed painted archetype of their body plan is an acceptable stand-in; synthesize a painting plan',
  whenToUse: 'Deciding which species the painted library + morph system can cover and which need their own painting',
  phases: [
    { title: 'Judge', detail: 'anatomist and player lenses per chunk of ~24 species' },
    { title: 'Tiebreak', detail: 'third judge on disputed species only' },
    { title: 'Synthesize', detail: 'cluster misleading species into proposed new archetypes; mask priorities' },
  ],
}

const DIR = '/Users/nick/Projects/celestial-frontier-anthropic-mac/audits/COVERAGE_STUDY_20260924/chunks'
const MORPH = `WHAT THE MORPH SYSTEM CAN AND CANNOT CHANGE on a painted archetype (a painting of ONE species, fitted to a rig):
- PALETTE: the base coat takes the species' colour gene (17 colours incl. greys/black/white; near-grey paintings are tinted); the accent colour goes ONLY on the body plan's trim groups (listed per chunk as accentGroups). Luminance is preserved: the painting's shading, fur/scale/feather texture and its own painted markings stay.
- MARKINGS: painted marking masks exist ONLY for the Crab, the Civet and the Salmon (striped, spotted, banded, mottled, marbled, eye-spotted). Any other archetype shows only its own painted pattern (plus an optional emissive glow). A marking nobody painted does not appear.
- PROPORTION: head scale 0.85–1.2, tail 0.7–1.35, ears/antennae slightly with the head. NOTHING ELSE: no limb length, body length, neck length, body depth/width, or silhouette change; no parts can be added or removed (no horns, antlers, trunk, tusks, shell, mane, crest, hump, long neck, webbed feet, fins, beak shape, extra legs).
- POSE/SILHOUETTE: exactly the archetype's painting (look at it — the master PNG path is in the chunk file).
The stand-in is shown on the Compendium card and fights in the arena as THIS species (named, with its stats).`

const JUDGED = {
  type: 'object',
  properties: {
    species: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          verdict: { type: 'string', enum: ['good', 'caveat', 'misleading'] },
          missing: { type: 'array', items: { type: 'string' }, description: 'mustRead features the stand-in cannot express' },
          newArchetype: { type: ['string', 'null'], description: 'for misleading: short kebab name of the painted archetype this species needs (shared across similar species), else null' },
          reason: { type: 'string' },
        },
        required: ['name', 'verdict', 'missing', 'newArchetype', 'reason'],
      },
    },
  },
  required: ['species'],
}

const LENSES = {
  anatomist: 'Lens: ANATOMIST. Compare part inventory and silhouette class. Does the species have major parts the archetype lacks (horns, trunk, shell, long neck, flippers, wings, crest, hump, webbed feet, beak type) or lack parts the archetype has? Is the body plan proportion (aspect, head fraction, limb length) within what a morph can express?',
  player: 'Lens: PLAYER. Picture the card and the arena at phone size. Would an ordinary player who knows this animal accept the recoloured, lightly re-proportioned archetype as it — or say "that is a civet/salmon/eagle wearing the wrong name"? Weigh the mustRead features a player uses to recognise it.',
}
const RUBRIC = `Verdicts: good = a player accepts it; the distinguishing mustRead features are expressible by palette/markings/proportion. caveat = right kind of animal, but a named mustRead feature is lost (list it in missing). misleading = wrong silhouette or anatomy; needs its own painting (give newArchetype, a short shared kebab-case name like "shark", "horned-ungulate", "penguin", "turtle", "elephant", "long-neck-wader", "owl", "seahorse" — reuse the same name for similar species). Judge EVERY species in the chunk, in order, exactly once.`

const judge = (c, lens, extra = '') => agent(`You are judging stand-ins for Celestial Frontier's painted creature library. Read the chunk file ${DIR}/${c.id}.json (its species, the stand-in archetype "${c.standIn}", its joints, accentGroups and marking masks) and LOOK at the stand-in painting (the chunk's archetype.master PNG — use the Read tool on it).\n\n${MORPH}\n\n${LENSES[lens]}\n\n${RUBRIC}${extra}`, { label: `${lens}:${c.id}`, phase: 'Judge', schema: JUDGED })

const results = await pipeline(
  args.chunks,
  (c) => parallel([() => judge(c, 'anatomist'), () => judge(c, 'player')]),
  async (pair, c) => {
    const [a, p] = pair
    const byName = (r) => new Map(((r && r.species) || []).map((s) => [s.name, s]))
    const A = byName(a), P = byName(p)
    const names = c.names
    const settled = [], disputed = []
    for (const n of names) {
      const x = A.get(n), y = P.get(n)
      if (x && y && x.verdict === y.verdict) settled.push({ ...x, missing: [...new Set([...(x.missing || []), ...(y.missing || [])])], newArchetype: x.newArchetype || y.newArchetype, reason: `anatomist: ${x.reason} | player: ${y.reason}`, votes: [x.verdict, y.verdict] })
      else disputed.push({ name: n, anatomist: x || null, player: y || null })
    }
    let tiebroken = []
    if (disputed.length) {
      const t = await agent(`Two judges disagree on whether a morphed "${c.standIn}" painting is an acceptable stand-in for these species. Read ${DIR}/${c.id}.json and LOOK at the stand-in painting (archetype.master PNG). Decide each disputed species once, weighing both opinions.\n\n${MORPH}\n\n${RUBRIC}\n\nDisputed (with both judges' views; a null judge means that judge omitted it):\n${JSON.stringify(disputed)}`, { label: `tiebreak:${c.id}`, phase: 'Tiebreak', schema: JUDGED })
      const T = byName(t)
      tiebroken = disputed.map((d) => { const f = T.get(d.name); return f ? { ...f, votes: [d.anatomist && d.anatomist.verdict, d.player && d.player.verdict, f.verdict], tiebreak: true } : { name: d.name, verdict: 'unjudged', missing: [], newArchetype: null, reason: 'no judge returned this species', votes: [] } })
    }
    return { id: c.id, standIn: c.standIn, template: c.template, rows: [...settled, ...tiebroken] }
  },
)

const chunks = results.filter(Boolean)
const rows = chunks.flatMap((c) => c.rows.map((r) => ({ ...r, standIn: c.standIn, template: c.template })))
const tally = {}
for (const r of rows) { const t = (tally[r.standIn] ??= { good: 0, caveat: 0, misleading: 0, unjudged: 0 }); t[r.verdict] = (t[r.verdict] || 0) + 1 }
const clusters = {}
for (const r of rows.filter((x) => x.verdict === 'misleading')) (clusters[r.newArchetype || '(unnamed)'] ??= []).push(`${r.name} [${r.standIn}]`)
log(`judged ${rows.length} species: ${Object.entries(tally).map(([k, v]) => `${k} ${v.good}/${v.caveat}/${v.misleading}`).join(', ')}`)

phase('Synthesize')
const PLAN = {
  type: 'object',
  properties: {
    archetypes: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, exemplar: { type: 'string', description: 'the one Earth species to paint' }, covers: { type: 'array', items: { type: 'string' } },
      bodyPlan: { type: 'string', description: 'existing template it would use, or "NEW: <plan>"' }, mustPaint: { type: 'array', items: { type: 'string' } }, why: { type: 'string' } },
      required: ['name', 'exemplar', 'covers', 'bodyPlan', 'mustPaint', 'why'] } },
    masks: { type: 'array', items: { type: 'object', properties: { archetype: { type: 'string' }, patterns: { type: 'array', items: { type: 'string' } }, unlocks: { type: 'array', items: { type: 'string' } }, why: { type: 'string' } }, required: ['archetype', 'patterns', 'unlocks', 'why'] } },
    noStandInPlans: { type: 'array', items: { type: 'object', properties: { plan: { type: 'string' }, exemplar: { type: 'string' }, covers: { type: 'array', items: { type: 'string' } } }, required: ['plan', 'exemplar', 'covers'] } },
    summary: { type: 'string' },
  },
  required: ['archetypes', 'masks', 'noStandInPlans', 'summary'],
}
const plan = await agent(`Synthesize a PAINTING PLAN for Celestial Frontier's painted library from these judgments.\n\n${MORPH}\n\n1) MISLEADING species grouped by the judges' proposed archetype names (merge synonyms; split a cluster when one painting cannot serve all of it): ${JSON.stringify(clusters)}\n\n2) CAVEAT species and the features they lose (look for features a MARKING MASK could restore — e.g. stripes, rosettes, bands — and for features only a new painting restores): ${JSON.stringify(rows.filter((r) => r.verdict === 'caveat').map((r) => ({ name: r.name, standIn: r.standIn, missing: r.missing })))}\n\n3) Species with NO body plan that has a painted archetype yet (read ${DIR}/_no-stand-in.json): group them into the fewest sensible new body plans with one exemplar each.\n\nReturn: archetypes = the new paintings ranked by species covered (most first), each with one Earth exemplar to paint, the species it covers, the template it would use (existing or NEW), the features it must paint; masks = marking-mask sets to paint on EXISTING archetypes, what species each unlocks from caveat to good; noStandInPlans; summary = 5-8 sentences a busy owner can act on.`, { label: 'synthesize', phase: 'Synthesize', schema: PLAN })

return { tally, rows, clusters, plan }
