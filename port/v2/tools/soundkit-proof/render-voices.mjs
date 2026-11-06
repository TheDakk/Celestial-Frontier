/* A4 listening evidence: one PLACEHOLDER quadruped archetype (synthesized,
   not a recording, never shippable) derived into the Civet, the fox and the
   procedural quadruped voices. Writes nine WAVs plus a manifest with recipe
   hashes. Usage: node tools/soundkit-proof/render-voices.mjs [outDir] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const outDir = path.resolve(process.argv[2] ?? path.join(repo, 'audits/LONG_SESSION_20260913/a4-voices'));
const proof = path.join(repo, 'audits/CIVET_2D_PROOF_20260912');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soundkit-proof-'));
const bundle = await rolldown({ input: path.join(here, 'entry.mjs'), platform: 'node' });
try { await bundle.write({ dir: tmp, format: 'es', entryFileNames: 'soundkit.mjs' }); } finally { await bundle.close(); }
const kit = await import(pathToFileURL(path.join(tmp, 'soundkit.mjs')).href);

/** Decode the tuple-encoded speciesVisualKey the Civet record carries into a genome. */
function decodeKeyGenome(key) {
  const walk = (node) => {
    const [kind, value] = node;
    if (kind === 'object') return Object.fromEntries(value.map(([k, v]) => [k, walk(v)]));
    if (kind === 'number') return Number(value);
    if (kind === 'boolean') return value === true || value === 'true';
    return value;
  };
  return walk(JSON.parse(key));
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const civet = readJson(path.join(proof, 'civet.landmarks.json'));
const fox = readJson(path.join(proof, 'fox.landmarks.json'));
const procedural = readJson(path.join(proof, 'procedural-genome.json'));

const subjects = [
  { id: 'civet', record: civet, genome: decodeKeyGenome(civet.identity.speciesVisualKey) },
  { id: 'fox', record: fox, genome: null },
  { id: 'procedural', record: { template: { id: 'quadruped' }, identity: { seed: procedural.seed, speciesVisualKey: `genome:${procedural.seed}` } }, genome: procedural },
];
const cues = ['call', 'attack-vocal', 'hurt'];
const archetype = kit.synthesizePlaceholderQuadruped();
const SEED = 0xA4;

fs.mkdirSync(outDir, { recursive: true });
const manifest = {
  schema: 'cf.soundkit.proof-manifest/v1',
  archetype: { key: archetype.archetypeKey, placeholder: true, shippable: false, label: archetype.label,
    note: 'Synthesized stand-in for the C3 recorded quadruped masters. Listening evidence for the derivation engine only; never ship.' },
  seed: SEED, sampleRate: 48000, renders: [],
};
for (const s of subjects) {
  const card = kit.compileVoiceCard(s.record, s.genome, null);
  if (!card.ok) throw new Error(`${s.id}: ${card.reason}`);
  for (const cue of cues) {
    const derived = kit.deriveCue(card.card, cue, archetype.sources, SEED);
    const file = `placeholder-quadruped.${s.id}.${cue}.wav`;
    const wav = kit.encodeWav16(derived.samples, derived.sampleRate);
    fs.writeFileSync(path.join(outDir, file), wav);
    manifest.renders.push({
      subject: s.id, cue, file, placeholder: true, durationMs: Math.round((derived.samples.length / 48000) * 1000),
      recipeHash: derived.recipeHash, wavSha256: kit.sha256Hex(wav), flags: derived.flags,
      card: { archetype: card.card.archetype, sizeClass: card.card.sizeClass, pitchSemitones: card.card.pitchSemitones,
        formantPercent: card.card.formantPercent, timePercent: card.card.timePercent, material: card.card.material,
        aggression: card.card.aggression, medium: card.card.medium, luminous: card.card.luminous, seed: card.card.seed },
    });
  }
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${kit.stableJson(manifest)}\n`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${manifest.renders.length} placeholder renders -> ${path.relative(repo, outDir)}`);
for (const r of manifest.renders) console.log(`${r.file}  ${r.durationMs} ms  ${r.recipeHash.slice(0, 16)}  ${JSON.stringify(r.card)}`);
