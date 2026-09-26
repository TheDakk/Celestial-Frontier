/** G1 run: for each corpus subject, AUTO-author its packet from the OTHER subjects' hand-authored packets (leave-one-subject-out),
 * run Codex's unchanged intake + the re-rooted static gate, and score against the subject's own hand authoring (which the author
 * never reads). Run from the worktree root: node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs [--tag=NAME] [id ...]
 * Writes auto[-TAG]/<id>/{packet/, fit/, static.json, evidence.json, score.json} and auto[-TAG]/summary.json. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {autoAuthor, prepareSubject, mirrorSubject, referenceStats, skeletonStats} from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
const HERE = import.meta.dirname, ROOT = path.resolve(HERE, '../..');
const require = createRequire(path.join(ROOT, 'port/v2/package.json'));
const sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const { earthFaunaProfile } = await import(path.join(ROOT, 'port/v2/apps/game/src/earth-fauna-profiles.ts'));
const args = process.argv.slice(2), tag = (args.find((a) => a.startsWith('--tag=')) ?? '').slice(6), only = args.filter((a) => !a.startsWith('--'));
const skipStatic = args.includes('--no-static');
const ridgeArg = args.find((x) => x.startsWith('--ridge=')), ridgeFrac = ridgeArg ? Number(ridgeArg.slice(8)) : 0;
const nudgeArg = args.find((x) => x.startsWith('--nudge=')), nudgeFrac = nudgeArg ? Number(nudgeArg.slice(8)) : 0;
const useCounter = args.includes('--counter'), thinArg = args.find((x) => x.startsWith('--nudge-thin=')), nudgeThinFrac = thinArg ? Number(thinArg.slice(13)) : null;
const nudgeSkipChains = args.includes('--nudge-skip-chains');
const fallbackArg = args.find((x) => x.startsWith('--fallback=')), fallbackN = fallbackArg ? Number(fallbackArg.slice(11)) : 0;
const { familyContract, familyContactChains } = await import(path.join(ROOT, 'port/v2/tools/creature-animation/family-contracts.mjs'));
const topkArg = args.find((x) => x.startsWith('--topk=')), topK = topkArg ? Number(topkArg.slice(7)) : 3;
const useChains = args.includes('--chains');
const useSkeleton = args.includes('--skeleton'), graphOf = (family) => familyContract(family).graph;
const terminalsOf = (family) => { try { return new Set(familyContactChains(familyContract(family)).map((c) => c.terminal).filter(Boolean)); } catch { return new Set(); } };
const OUT = path.join(HERE, 'auto' + (tag ? '-' + tag : ''));
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'corpus.json'), 'utf8')).subjects;
// materials (Codex G1 review): a family default misdescribes species (a salamander is not fur, an eel is not scales), and the
// motion kit REFUSES an unclassified surface (body-card `unsupported-materials`), so a neutral string can never pass a gate. The
// material is therefore the SPECIES GROUP's integument, keyed by the pinned Earth fauna profile id (biology of the group, not a
// reading of the painting and never permission for a finisher to add texture). A group absent here REFUSES; nothing is guessed.
const SPECIES_MATERIAL = Object.freeze({
  fur: ['felid', 'canid', 'hyena', 'bear', 'small-clawed-mammal', 'aquatic-pawed-mammal', 'gliding-mammal', 'aardvark', 'rabbit-hopper', 'marsupial-hopper', 'koala', 'primate', 'hoofed-horned', 'hoofed-unhorned', 'tapir', 'suid', 'bat'],
  scales: ['constricting-snake', 'snake', 'lizard', 'special-lizard', 'marine-iguana', 'crocodilian', 'fish', 'predatory-shark', 'filter-shark', 'tube-snouted-fish'],
  feathers: ['raptor', 'flightless-bird', 'penguin', 'swimming-bird', 'wading-bird', 'ground-foraging-bird', 'bird', 'pheasant'],
  chitin: ['mandibulate-insect', 'soft-mouth-insect', 'aquatic-insect', 'spider', 'scorpion', 'other-arachnid', 'centipede', 'millipede'],
  'smooth skin': ['frog', 'salamander', 'caecilian', 'eel', 'jawless-fish', 'cephalopod', 'mudskipper'],
  warty: ['echinoderm'], translucent: ['cnidarian', 'comb-jelly'],
});
const materialForProfile = (profileId) => Object.entries(SPECIES_MATERIAL).find(([, ids]) => ids.includes(profileId))?.[0] ?? null;
// habitat = biological capability from the pinned Earth fauna profile (id, media and its hash retained in the provenance envelope);
// it says nothing about the painted pose or observed supports. `ground+air` is `land` here and does NOT imply no adult flight.
const profileHash = (p) => createHash('sha256').update(JSON.stringify(p)).digest('hex');
const habitatFor = (name) => { const p = earthFaunaProfile(name); if (!p) return null; const m = p.media;
  const realm = m.includes('water') && m.includes('ground') ? 'amphibious' : m.includes('water') ? 'aquatic' : m.includes('ground') ? 'land' : m.includes('air') ? 'aerial' : null;
  return realm ? { realm, source: `G1 automatic: Earth fauna profile ${p.id} media ${m.join('+')} (capability, not painted pose; adult flight is a separate declaration)` } : null; };
const rgbaOf = async (file) => { const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { rgba: new Uint8ClampedArray(data), w: info.width, h: info.height }; };

// prepare every subject once
const subjects = [];
for (const s of corpus) {
  const dir = path.join(ROOT, s.packet), img = await rgbaOf(path.join(dir, 'master.png')), prepared = prepareSubject(img.rgba, img.w, img.h);
  const authoring = JSON.parse(fs.readFileSync(path.join(dir, 'authoring.json'), 'utf8'));
  subjects.push({ ...s, dir, img, prepared, authoring, subject: JSON.parse(fs.readFileSync(path.join(dir, 'subject-source.json'), 'utf8')), stats: referenceStats(prepared, authoring), skeleton: useSkeleton ? skeletonStats(prepared, authoring, graphOf(s.family)) : null });
}
// --targets=<pilot.json>: author INDEPENDENT paintings (e.g. the G2 pilot) that have no hand authoring; the 40 corpus packets are the
// references. Leave-one-SPECIES-out: a corpus packet of the target's own species is never its reference (Codex G1 review).
const targetsArg = args.find((x) => x.startsWith('--targets=')), targets = [];
if (targetsArg) for (const t of JSON.parse(fs.readFileSync(path.join(ROOT, targetsArg.slice(10)), 'utf8'))) {
  const dir = path.join(ROOT, t.packet), img = await rgbaOf(path.join(dir, 'master.png')), subject = JSON.parse(fs.readFileSync(path.join(dir, 'subject-source.json'), 'utf8'));
  targets.push({ id: t.id, family: subject.family, packet: t.packet, dir, img, prepared: prepareSubject(img.rgba, img.w, img.h), authoring: null, subject }); }
const refOf = (s) => ({ ...s.prepared, family: s.family, subjectId: s.id, authoring: s.authoring, partPaint: s.stats.partPaint, unclaimedFrac: s.stats.unclaimedFrac, skeleton: s.skeleton });

const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
const ownerAt = (a, x, y) => { const k = a.parts.findIndex((p) => inside(x, y, p.polygonPx)); return k < 0 ? a.remainderPart : a.parts[k].id; };
function score(auto, hand, prepared) {
  const pts = Object.values(hand.landmarksPx); let bl = 0; for (const p of pts) for (const q of pts) bl = Math.max(bl, Math.hypot(p[0] - q[0], p[1] - q[1]));
  const errs = Object.entries(hand.landmarksPx).filter(([k]) => auto.landmarksPx[k]).map(([k, p]) => ({ joint: k, e: Math.hypot(p[0] - auto.landmarksPx[k][0], p[1] - auto.landmarksPx[k][1]) / bl }));
  let n = 0, same = 0; for (let y = 0; y < prepared.h; y += 6) for (let x = 0; x < prepared.w; x += 6) { if (!prepared.mask[y * prepared.w + x]) continue; n++; if (ownerAt(auto, x + 0.5, y + 0.5) === ownerAt(hand, x + 0.5, y + 0.5)) same++; }
  const sorted = errs.map((e) => e.e).sort((a, b) => a - b);
  return { bodyLengthPx: +bl.toFixed(1), landmarkMedian: +(sorted[(sorted.length - 1) >> 1] ?? NaN).toFixed(4), landmarkMax: +(sorted.at(-1) ?? NaN).toFixed(4), worst: errs.sort((a, b) => b.e - a.e).slice(0, 3).map((e) => `${e.joint} ${e.e.toFixed(3)}`), labelAgreement: +(same / Math.max(1, n)).toFixed(4), missingJoints: Object.keys(hand.landmarksPx).filter((k) => !auto.landmarksPx[k]) };
}

fs.mkdirSync(OUT, { recursive: true });
const rows = [];
// one automatic candidate: author from the reference of rank `rank`, then (if admitted) Codex's unchanged intake and the static gate
function runCandidate(s, rank, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const refs = subjects.filter((o) => o.id !== s.id && o.subject.name !== s.subject.name).map(refOf); // leave-one-subject-out, and leave-one-species-out
  const mirrored = mirrorSubject(s.img.rgba, s.img.w, s.img.h);
  // identity (Codex G1 review): subject-source.json is species/genome identity, never anatomy; its name, family, genome and
  // visualKey must agree with the corpus row and the pinned Earth profile, or the subject refuses before any authoring
  const profile = earthFaunaProfile(s.subject.name), idReasons = [];
  if (s.subject.family !== s.family) idReasons.push(`identity: subject-source family ${s.subject.family} ≠ corpus family ${s.family}`);
  if (!profile) idReasons.push(`identity: no pinned Earth fauna profile for ${s.subject.name}`);
  if (!(s.subject.genome && Number.isInteger(s.subject.genome.seed))) idReasons.push('identity: subject-source genome has no integer seed');
  if (!(typeof s.subject.visualKey === 'string' && s.subject.visualKey.length > 5)) idReasons.push('identity: subject-source visualKey missing');
  const material = profile ? materialForProfile(profile.id) : null; if (!material) idReasons.push(`materials-unknown: no species-group material for profile ${profile?.id ?? '(none)'}; the motion kit refuses an unclassified surface`);
  const res0 = autoAuthor({ target: s.prepared, mirrored, family: s.family, id: s.id, refs, refRank: rank, materials: { surface: material ?? 'unclassified' }, habitat: habitatFor(s.subject.name), topK, nudgeFrac, nudgeThinFrac, nudgeSkipChains, counter: useCounter ? {} : null, ridge: ridgeFrac > 0 ? { radiusFrac: ridgeFrac, keep: terminalsOf(s.family) } : null, skeleton: useSkeleton ? { graph: graphOf(s.family) } : null, chains: useChains ? (() => { try { return familyContactChains(familyContract(s.family)); } catch { return null; } })() : null });
  const res = idReasons.length ? { ...res0, verdict: 'REFUSE', reasons: [...idReasons, ...res0.reasons] } : res0;
  fs.writeFileSync(path.join(dir, 'evidence.json'), JSON.stringify({ verdict: res.verdict, reasons: res.reasons, ...res.evidence }, null, 1) + '\n');
  // outer provenance envelope (Codex G1 review): intake stays unchanged and still writes manualAuthoring=true and
  // sourceLandmarksReused=false; this envelope records that the packet is an AUTOMATIC TRANSFER and those inner fields are not an
  // automatic-origin attestation
  const sha = (f) => createHash('sha256').update(fs.readFileSync(f)).digest('hex'), ref = subjects.find((o) => o.id === res.evidence?.bestReference);
  fs.writeFileSync(path.join(dir, 'provenance.json'), JSON.stringify({ schema: 'cf.g1-auto-provenance/v1', subject: s.id, verdict: res.verdict,
    origin: 'automatic transfer (G1 auto-author): landmarks and part polygons transferred from a registered same-family reference; no manual observation',
    intakeLegacyFields: 'intake-authored.mjs writes manualAuthoring=true and sourceLandmarksReused=false unconditionally; for this packet they are NOT an automatic-origin attestation. Landmarks ARE transferred from the reference below.',
    targetMasterSha256: sha(path.join(s.dir, 'master.png')), subjectSourceSha256: sha(path.join(s.dir, 'subject-source.json')),
    identity: { name: s.subject.name, family: s.subject.family, visualKey: s.subject.visualKey ?? null, seed: s.subject.genome?.seed ?? null, checks: idReasons.length ? idReasons : 'PASS' },
    reference: ref ? { subject: ref.id, authoringSha256: sha(path.join(ref.dir, 'authoring.json')), masterSha256: sha(path.join(ref.dir, 'master.png')) } : null,
    habitat: profile ? { profileId: profile.id, media: profile.media, profileSha256: profileHash(profile), meaning: 'capability, not painted pose or observed supports' } : 'unknown',
    materials: { surface: material, source: profile ? `species group ${profile.id} (Earth fauna profile)` : null, meaning: 'the species group\'s integument; not an observation of the painting, not a finisher permission' },
    visibleInventory: res.evidence?.inventory ? { measuredBy: 'limb-counter.mjs (paint only)', target: res.evidence.inventory.target, reference: res.evidence.inventory.reference } : 'unmeasured',
    presence: res.verdict === 'ADMIT' ? 'all-visible, backed by the measured visible inventory above; nothing declared absent, hidden or folded' : 'not asserted (refused)' }, null, 1) + '\n');
  const row = { id: s.id, family: s.family, verdict: res.verdict, reasons: res.reasons };
  if (res.authoring) {
    if (s.authoring) Object.assign(row, score(res.authoring, s.authoring, s.prepared)); // independent targets have no hand authoring to score against
    const packet = path.join(dir, 'packet'); fs.mkdirSync(packet, { recursive: true });
    fs.copyFileSync(path.join(s.dir, 'master.png'), path.join(packet, 'master.png'));
    fs.copyFileSync(path.join(s.dir, 'subject-source.json'), path.join(packet, 'subject-source.json')); // species metadata, not anatomy
    fs.writeFileSync(path.join(packet, 'authoring.json'), JSON.stringify(res.authoring, null, 2) + '\n');
    fs.writeFileSync(path.join(packet, 'presence.json'), JSON.stringify(res.presence, null, 2) + '\n');
    if ((res.verdict === 'ADMIT' || args.includes('--diagnostic-static')) && !skipStatic) { if (res.verdict !== 'ADMIT') row.diagnosticOnly = 'static run on a REFUSED author (diagnostic; never an admission)';
      const fit = path.join(dir, 'fit');
      if (!fs.existsSync(fit)) { const r = spawnSync(process.execPath, ['port/v2/tools/creature-animation/intake-authored.mjs', packet, fit], { cwd: ROOT, encoding: 'utf8', timeout: 900000 }); fs.writeFileSync(path.join(dir, 'intake.log'), (r.stdout || '') + (r.stderr || '')); }
      if (fs.existsSync(path.join(fit, 'binding.json'))) {
        const report = path.join(dir, 'static.json');
        if (!fs.existsSync(report)) { const r = spawnSync(process.execPath, [path.join(HERE, 'harness/static-runner.mjs'), fit, report], { cwd: ROOT, encoding: 'utf8', timeout: 1800000 }); fs.writeFileSync(path.join(dir, 'static.log'), (r.stdout || '') + (r.stderr || '')); }
        let st = null; try { st = JSON.parse(fs.readFileSync(report, 'utf8')); } catch {}
        row.static = st ? st.status : 'STATIC_ERROR'; row.staticFails = st?.rows?.filter((r) => r.status !== 'PASS').map((r) => r.id) ?? null;
        if (!st) { const log = fs.readFileSync(path.join(dir, 'static.log'), 'utf8'); row.staticError = (log.match(/"error":"([^"]{0,200})/) ?? [])[1] ?? log.slice(-200); }
      } else { row.static = 'INTAKE_REFUSED'; try { row.intakeError = JSON.parse(fs.readFileSync(path.join(fit, 'refusal.json'), 'utf8')).error.slice(0, 200); } catch {} }
    }
  }
  fs.writeFileSync(path.join(dir, 'score.json'), JSON.stringify(row, null, 1) + '\n');
  return row;
}

for (const s of targets.length ? targets : subjects) {
  if (only.length && !only.includes(s.id)) continue;
  let row = runCandidate(s, 0, path.join(OUT, s.id));
  // --fallback=N (labelled): ONLY when the best reference's packet was ADMITTED by the author but refused by intake or static, try the
  // next-ranked references; each candidate must earn its own ADMIT. A REFUSED author is never shopped to another reference.
  const tried = [{ rank: 0, verdict: row.verdict, static: row.static ?? null }];
  for (let k = 1; k <= fallbackN && row.verdict === 'ADMIT' && row.static && row.static !== 'PASS_STATIC'; k++) {
    const alt = runCandidate(s, k, path.join(OUT, s.id, 'fallback-' + k)); tried.push({ rank: k, verdict: alt.verdict, static: alt.static ?? null, reasons: alt.reasons?.slice(0, 2) });
    if (alt.verdict === 'ADMIT' && alt.static === 'PASS_STATIC') { row = { ...alt, fallbackFrom: row.static }; break; }
    if (alt.verdict !== 'ADMIT') break; }
  if (tried.length > 1) row.candidates = tried;
  fs.writeFileSync(path.join(OUT, s.id, 'score.json'), JSON.stringify(row, null, 1) + '\n');
  rows.push(row); console.log(JSON.stringify({ id: row.id, verdict: row.verdict, static: row.static, lm: row.landmarkMedian, lab: row.labelAgreement, reasons: row.reasons?.slice(0, 2), err: row.staticError ?? row.intakeError }));
}
fs.writeFileSync(path.join(OUT, 'summary' + (only.length ? '-partial' : '') + '.json'), JSON.stringify(rows, null, 1) + '\n');
