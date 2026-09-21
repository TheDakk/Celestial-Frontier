// Packet-only P1 subject/layout fill. Does not call or modify the intake writers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../../..');
const templatePath = 'audits/VISION_P1_FOUR_CRABS_20260920/crab/generation-01/sent-prompt.txt';
const cataloguePath = 'port/v2/reference/fauna.json';
const guidePath = 'port/v2/apps/game/smoke/hybrid-platinum-repair-provisional-2026-08-11-r1/portraits/wolf/01-pure.png';
const atlasPath = 'audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = p => fs.readFileSync(path.join(root, p));
const write = (p, value) => fs.writeFileSync(path.join(out, p), value, { flag: 'wx' });
const json = (p, value) => write(p, JSON.stringify(value, null, 2) + '\n');
const matches = JSON.parse(read(cataloguePath)).filter(row => row.name === 'Wolf');
if (matches.length !== 1 || matches[0].posture !== 'quadruped') throw Error('Wolf catalogue contract');
const wolf = matches[0];
if (sha(read(atlasPath)) !== 'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62') throw Error('Style lock changed');
const counts = 'one head, exactly one head; four legs, two forelegs and two hindlegs, exactly four legs with four separately readable paws; two ears, exactly two ears; two anatomical eyes, with the far eye naturally occluded in side view; one straight bushy tail, exactly one tail';
const subject = `One Earth Wolf (Canis lupus), a natural quadruped mammal; a fraction of human height; ${counts}; ${wolf.mustRead.join('; ')}; ${wolf.note}. Natural grey fur with warm grey-brown guard hairs, pale muzzle, throat and lower limbs, dark nose and darker tail tip; no armour, harness, gear, horns, added growth or bioluminescence. The supplied side-on painter guide is the anatomy and pose reference: face right, tail to the left, stand on all four paws with the far legs visibly offset from the near legs as in the guide. Preserve the guide's stance, body proportions, limb arrangement and facing. Render organic volume, connected joints and grouped tactile fur in the approved painted hand; do not copy the guide's flat graphic shading or its dark background.`;
let prompt = read(templatePath).toString('utf8');
const replaceSection = (start, end, value) => {
  if (prompt.split(start).length !== 2 || prompt.split(end).length !== 2) throw Error('Nonunique packet section');
  prompt = prompt.slice(0, prompt.indexOf(start) + start.length) + value + prompt.slice(prompt.indexOf(end));
};
const adaptation = prompt.split('\n').filter(line => line.startsWith('  Fauna adaptation:'));
if (adaptation.length !== 1) throw Error('Nonunique system-card fauna slot');
prompt = prompt.replace(adaptation[0], `  Fauna adaptation: Earth named anatomy and natural materials take priority over raw procedural genes. Painted-master authoring subject: Wolf, quadruped mammal, land; ${wolf.mustRead.join('; ')}; natural grey fur. This isolated master is not a claim about the landing roster.`);
replaceSection('SUBJECT\n', '\n\nACCURACY\n', subject);
replaceSection('ACCURACY\n', '\n\nLAYOUT\n', `  Anatomy/count constraints: ${counts}.\n  Must include: the complete creature, all four legs and paws, muzzle, ears and whole tail.\n  Must exclude: ground; floor plane; cast shadow; base; scenery; text; a second creature; extra or missing limbs; top-down view.\n  Scale relationship: a fraction of human height.`);
replaceSection('LAYOUT\n', '\n\nTECHNICAL OUTPUT\n', '  One isolated standing full-body Wolf, centred, weighty and readable.\n  Side-on view facing right, matching the supplied painter guide. Four paws separately visible; no deliberate hidden leg.\n  Entire anatomy in frame. No floor plane.\n  Framing target: 80 percent. Safe margin: at least 8 percent on every side.');
write('prompt.txt', prompt);
write('anatomy-guide.png', read(guidePath));
json('subject-source.json', { species: wolf, source: cataloguePath, guideSource: guidePath, handLandmarks: false });
json('request.json', {
  schema: 'cf.painted-master-request/v1', species: 'Wolf', generation: 1,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  compilation: 'Packet-only bounded subject, system-card fauna and side-on layout fill of the retained P1 compiled prompt; reference, frozen style, technical output and negatives unchanged.',
  compiler: 'compile-prompt.mjs', compilerSha256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
  template: { path: templatePath, sha256: sha(read(templatePath)) },
  catalogue: { path: cataloguePath, sha256: sha(read(cataloguePath)) },
  kit: { path: 'ART_KIT.md', sha256: sha(read('ART_KIT.md')) },
  sentPromptSha256: sha(prompt), tool: 'image_gen.imagegen', model: 'not exposed by built-in tool', seed: null, seedReason: 'No seed parameter exposed',
  references: [
    { role: 'approved Discovery Atlas style lock', path: path.join(root, atlasPath), sha256: sha(read(atlasPath)) },
    { role: 'side-on painter anatomy guide; no masks or landmarks reused', path: path.join(out, 'anatomy-guide.png'), source: guidePath, sha256: sha(read(guidePath)) }
  ],
  requestedSize: [1024, 1024], requestedFormat: 'PNG', requestedBackground: '#FF00FF; same P1 technical block',
  generationCount: 1, retriesAuthorized: false, handLandmarks: false, fitPerformed: false, rigPerformed: false, intakePerformed: false, ic3Writers: 'FROZEN'
});
