import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const dir = import.meta.dirname, sourcePath = dir + '/train04-01/engine.mjs';
const source = fs.readFileSync(sourcePath, 'utf8');
const needle = 'if (!defender.phase && input.party.length === 1 &&';
assert.equal(source.split(needle).length, 2);
const mutant = source.replace(needle, 'if (input.party.length === 1 &&');
const mutantPath = dir + '/dispatch-control-mutant.mjs';
fs.writeFileSync(mutantPath, mutant, { flag: 'wx' });
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const hash = x => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(canonical(x))).digest('hex');
const fixtures = JSON.parse(fs.readFileSync(dir + '/train04-01/guardian-solo.json'));
async function measure(file) {
  const api = await import(pathToFileURL(file).href); api.installCaptureHooks();
  const world = api.resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }, planet: { seed: 2456455053 } });
  assert(world.ok);
  const encounter = api.projectGuardianPrimeEncounterV1({ world: world.address, descriptor: { worldType: 'airless' },
    regionIndex: 0, faunaRoster: [{ speciesId: 'native', genome: api.makeGenome(1, 'fauna', .5) }], claimedSignatureIds: [], conquered: false });
  let mismatches = 0;
  for (const row of fixtures) {
    const p = row.plan, f = p.party[0], expected = api.runEncounterV1(p), leg = expected.legs.at(-1);
    const result = api.planCombatPartySettlementV1({ battleId: 'dispatch-control-' + f.genome.seed, receiptOrdinal: 21,
      encounter, worldTier: 4, mode: 'auto', party: [{ stance: 'balanced', champion: { kind: 'owned-fauna',
        creatureId: 's4-' + f.genome.seed, name: f.name, genome: f.genome, legacyBredLineage: true } }],
      authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: 5000 } });
    assert.equal(result.status, 'planned');
    const wanted = Object.fromEntries(['A', 'B', 'log', 'winner', 'hpA', 'hpB', 'maxA', 'maxB', 'turnA0'].map(k => [k, leg[k]]));
    if (hash(result.transcript) !== hash(wanted)) mismatches++;
  }
  return { cases: fixtures.length, mismatches };
}
const positive = await measure(sourcePath), negative = await measure(mutantPath), restored = await measure(sourcePath);
assert.equal(positive.mismatches, 0); assert(negative.mismatches > 0); assert.equal(restored.mismatches, 0);
const report = { status: 'PASS', scope: 'training fixtures only; no held-out evaluation', sourceHash: hash(source),
  mutantHash: hash(mutant), mutation: 'restore the pre-C32 solo-Auto phase bypass', positive, negative, restored };
fs.writeFileSync(dir + '/production-dispatch-control.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
