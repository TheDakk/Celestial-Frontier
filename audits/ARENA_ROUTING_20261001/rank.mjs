/** Arena painting order (Claude 2026-10-01): for each of the 43 live biomes, how many Earth roster species (earth-fauna-profiles.ts,
 * 631) and how many ACCEPTED generated creatures (GENERATED_GALLERY_20260927/coverage.json, 179) belong to a fauna family that the
 * biome's profile lists (BIOME_PROFILES_V1 `fauna`, the live content contract). Earth's roster carries no per-species biome, so the
 * biome's own fauna families are the join; the profile-group → fauna-family table below is the only authored step (stated per row).
 * Usage (repo root): node audits/ARENA_ROUTING_20261001/rank.mjs > audits/ARENA_ROUTING_20261001/rank.json */
import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
// roster: name -> profile group (the same parse coverage.mjs uses)
const roster = new Map(); for (const m of read('port/v2/apps/game/src/earth-fauna-profiles.ts').matchAll(/group\("([^"]+)",\[([^\]]*)\]/g)) for (const n of m[2].matchAll(/"([^"]+)"/g)) roster.set(n[1], m[1]);
const accepted = new Set(JSON.parse(read('audits/GENERATED_GALLERY_20260927/coverage.json')).families.flatMap((f) => f.names));
// profile group -> BIOME_PROFILES fauna family (mammal bird insect amphibian primate reptile fish crust arachnid gastropod marine jelly ceph sessile)
const FAMILY = {
  felid: 'mammal', canid: 'mammal', hyena: 'mammal', bear: 'mammal', 'small-clawed-mammal': 'mammal', 'aquatic-pawed-mammal': 'mammal', 'gliding-mammal': 'mammal', 'toothless-clawed-mammal': 'mammal',
  xenarthran: 'mammal', aardvark: 'mammal', 'rabbit-hopper': 'mammal', 'marsupial-hopper': 'mammal', koala: 'mammal', 'hoofed-horned': 'mammal', 'hoofed-unhorned': 'mammal', tapir: 'mammal', suid: 'mammal',
  elephant: 'mammal', rhino: 'mammal', hippo: 'mammal', platypus: 'mammal', bat: 'mammal', primate: 'primate',
  pinniped: 'marine', 'toothed-cetacean': 'marine', 'baleen-cetacean': 'marine', sirenian: 'marine',
  raptor: 'bird', 'flightless-bird': 'bird', penguin: 'bird', 'swimming-bird': 'bird', 'wading-bird': 'bird', 'ground-foraging-bird': 'bird', bird: 'bird', pheasant: 'bird',
  'constricting-snake': 'reptile', snake: 'reptile', crocodilian: 'reptile', lizard: 'reptile', 'special-lizard': 'reptile', 'marine-iguana': 'reptile', tortoise: 'reptile', 'freshwater-turtle': 'reptile', 'sea-turtle': 'reptile',
  frog: 'amphibian', salamander: 'amphibian', caecilian: 'amphibian',
  fish: 'fish', eel: 'fish', 'jawless-fish': 'fish', 'tube-snouted-fish': 'fish', mudskipper: 'fish', 'predatory-shark': 'fish', 'filter-shark': 'fish', ray: 'fish', stingray: 'fish',
  cephalopod: 'ceph', cnidarian: 'jelly', 'comb-jelly': 'jelly',
  echinoderm: 'sessile', sponge: 'sessile', 'sessile-tunicate': 'sessile', tunicate: 'sessile', bivalve: 'sessile', barnacle: 'sessile',
  'land-gastropod': 'gastropod', 'water-gastropod': 'gastropod',
  'observed-crab': 'crust', 'fiddler-crab': 'crust', 'clawed-crustacean': 'crust', 'small-crustacean': 'crust', 'horseshoe-crab': 'crust', 'terrestrial-crab': 'crust',
  spider: 'arachnid', scorpion: 'arachnid', 'other-arachnid': 'arachnid',
  // myriapods and insects share the profile's "insect" family (the profile has no myriapod family)
  centipede: 'insect', millipede: 'insect', 'mandibulate-insect': 'insect', 'soft-mouth-insect': 'insect', 'aquatic-insect': 'insect', larva: 'insect', springtail: 'insect',
  // no profile family: annelids and the tardigrade are left out of every biome's count (listed in `unmapped`)
};
const unmapped = [...new Set([...roster.values()].filter((g) => !FAMILY[g]))].sort();
// live biomes: world type + weight from the generator's BIOME_SETS, fauna families from BIOME_PROFILES_V1
const sets = read('port/v2/packages/domain/strays/src/strays.verbatim.js'), body = sets.slice(sets.indexOf('const BIOME_SETS={'), sets.indexOf('function biomeFor'));
const biomes = []; let type = null; for (const line of body.split('\n')) { const t = line.match(/^ (\w+):\[/); if (t) type = t[1]; const b = line.match(/\{k:'(\w+)',\s*n:'([^']+)',\s*w:([\d.]+)/); if (b) biomes.push({ biome: b[1], name: b[2], type, weight: +b[3], rare: /rare:1/.test(line) }); }
const prof = read('port/v2/packages/domain/biome-profile/src/index.ts'); for (const b of biomes) { const m = prof.match(new RegExp(`\\['${b.biome}', \\{[^}]*fauna: \\[([^\\]]*)\\]`)); b.fauna = m ? [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : []; }
if (biomes.length !== 43) throw new Error('expected 43 live biomes, got ' + biomes.length);
for (const b of biomes) { const fam = new Set(b.fauna); b.roster = [...roster].filter(([, g]) => fam.has(FAMILY[g])).length; b.accepted = [...roster].filter(([n, g]) => fam.has(FAMILY[g]) && accepted.has(n)).length; }
const ranked = [...biomes].sort((a, b) => b.accepted - a.accepted || b.roster - a.roster || b.weight - a.weight || (a.biome < b.biome ? -1 : 1)).map((b, i) => ({ rank: i + 1, ...b }));
// per world type: distinct species that live in ANY biome of the type
const types = [...new Set(biomes.map((b) => b.type))].map((t) => { const fam = new Set(biomes.filter((b) => b.type === t).flatMap((b) => b.fauna)); const r = [...roster].filter(([, g]) => fam.has(FAMILY[g]));
  return { type: t, biomes: biomes.filter((b) => b.type === t).length, faunaFamilies: [...fam].sort(), roster: r.length, accepted: r.filter(([n]) => accepted.has(n)).length }; }).sort((a, b) => b.accepted - a.accepted || b.roster - a.roster);
console.log(JSON.stringify({ schema: 'cf.arena-painting-order/v1', roster: roster.size, accepted: [...roster.keys()].filter((n) => accepted.has(n)).length, unmappedProfileGroups: unmapped, worldTypes: types, biomes: ranked }, null, 1));
