// Film harness options without a browser: the delivery-manifest plates, the guardian-choreography script option, the film timeline and
// the guardian capture check (each with a mutant that must refuse).
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { arenaPlateFiles, ARENA_SETS_FILE } from './arena-plates.mjs';
import { filmTimeline, parseGuardianScript, requireGuardianFilmTimeline, segmentAt } from './guardian-script.mjs';

const here = import.meta.dirname, repo = path.resolve(here, '../../../..');
const SIDES = { leftName: 'Crab', rightName: 'Brown Bear', guardianRigs: { left: false, right: true } };
const rows = [{ side: 'A', an: 'Crab', dn: 'Brown Bear', dmg: 12, hpA: 30, hpB: 28 }, { side: 'A', an: 'Crab', dn: 'Brown Bear', dmg: 10, hpA: 30, hpB: 18 }];

test('films draw the game\'s runtime plates: the registered temperate set, despilled MID, never the proof dir keyed MID', () => {
  const p = arenaPlateFiles(repo), sets = JSON.parse(fs.readFileSync(ARENA_SETS_FILE, 'utf8')), row = sets.sets.find((s) => s.id === 'earth-temperate-v1');
  assert.equal(p.setId, 'earth-temperate-v1');
  assert.deepEqual(Object.fromEntries(Object.entries(p.files).map(([n, f]) => [n, path.relative(repo, f)])), { 'arena-recipe.json': row.recipe, 'arena-far.png': row.far, 'arena-mid.png': row.mid, 'arena-near.png': row.near });
  assert.equal(path.relative(repo, p.files['arena-mid.png']), 'audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png');
  for (const f of Object.values(p.files)) assert.ok(fs.existsSync(f), f);
  // every harness takes its plates from the registry: no hard-coded keyed MID left, and each one calls arenaPlateFiles
  for (const name of ['native-runner.mjs', 'archetype-native-runner.mjs', 'build.mjs']) {
    const src = fs.readFileSync(path.join(here, name), 'utf8');
    assert.doesNotMatch(src, /keyed\/arena-mid\.png|'arena-(far|mid|near)\.png': (A \+|path\.join\(arena)/, name);
    assert.match(src, /arenaPlateFiles\(repo\)/, name);
  }
  // mutants: an unregistered set, a path outside audits/, a wrong schema
  assert.throws(() => arenaPlateFiles(repo, 'ocean-v9'), /not registered/);
  assert.throws(() => arenaPlateFiles(repo, 'earth-temperate-v1', { ...sets, sets: [{ ...row, mid: '../etc/passwd' }] }), /under audits/);
  assert.throws(() => arenaPlateFiles(repo, 'earth-temperate-v1', { sets: sets.sets }), /cf.arena-sets\/v1/);
});

test('guardian script option: absent = today, true = the program for the right-side guardian; every malformed field refuses', () => {
  assert.equal(parseGuardianScript({ rows }, SIDES), null);
  assert.equal(parseGuardianScript({ rows, guardianChoreo: false }, SIDES), null);
  assert.deepEqual(parseGuardianScript({ rows, guardianChoreo: true }, SIDES), { kind: 'guardian', maxB: null, startHpB: null, guardianSide: 'right', defenderName: 'Brown Bear', reducedMotion: false });
  assert.deepEqual(parseGuardianScript({ rows, guardianChoreo: true, reducedMotion: true, guardian: { kind: 'titan', maxB: 40, startHpB: 30 } }, SIDES), { kind: 'titan', maxB: 40, startHpB: 30, guardianSide: 'right', defenderName: 'Brown Bear', reducedMotion: true });
  const film = JSON.parse(fs.readFileSync(path.join(repo, 'audits/GUARDIAN_CHOREOGRAPHY_20261001/script-d2-bear-guardian.json'), 'utf8'));
  assert.deepEqual(parseGuardianScript(film, SIDES), { kind: 'guardian', maxB: 40, startHpB: null, guardianSide: 'right', defenderName: 'Brown Bear', reducedMotion: false });
  for (const [bad, why] of [
    [{ rows, guardianChoreo: 1 }, /must be true or false/], [{ rows, guardian: { kind: 'guardian' } }, /not true/],
    [{ rows, guardianChoreo: true, guardian: { kind: 'wild' } }, /kind must be/], [{ rows, guardianChoreo: true, guardian: { maxB: 0 } }, /maxB/],
    [{ rows, guardianChoreo: true, guardian: { startHpB: 5 } }, /startHpB/], [{ rows, guardianChoreo: true, guardian: { maxB: 10, startHpB: 11 } }, /startHpB/],
    [{ rows, guardianChoreo: true, guardian: { hp: 3 } }, /unknown guardian field/], [{ rows, guardianChoreo: true, reducedMotion: 'yes' }, /reducedMotion/],
    [{ rows: [], guardianChoreo: true }, /rows/], [{ rows: [{ an: 'Crab', dn: 'Brown Bear', dodge: true }], guardianChoreo: true, guardian: { maxB: 40 } }, /no row carries hpB/],
  ]) assert.throws(() => parseGuardianScript(bad, SIDES), why, JSON.stringify(bad));
  // the guardian is the defender: on the left, or a right fit without a guardian block, refuses with the fix
  assert.throws(() => parseGuardianScript({ rows, guardianChoreo: true }, { ...SIDES, guardianRigs: { left: true, right: false } }), /RIGHT fit .*left fit carries/);
  assert.throws(() => parseGuardianScript({ rows, guardianChoreo: true }, { ...SIDES, guardianRigs: { left: false, right: false } }), /RIGHT fit/);
});

const piece = (name, durationMs) => ({ piece: name, durationMs, beats: [{ beat: 'a', start: 0, end: durationMs / 2 }, { beat: 'b', start: durationMs / 2, end: durationMs }] });
const program = (afterTurn) => ({ entrance: piece('guardian-entrance', 2000), phase: afterTurn === null ? null : { afterTurn, piece: piece('guardian-phase', 1000) }, finale: piece('guardian-fall', 1500) });

test('film timeline: the wiring\'s order (entrance, phase where it changed, turns, finale), contiguous, and turns only without a program', () => {
  const plain = filmTimeline([4000, 3000], null);
  assert.deepEqual(plain.segments.map((s) => [s.kind, s.turn, s.offsetMs]), [['turn', 0, 0], ['turn', 1, 4000]]); assert.equal(plain.totalMs, 7000);
  const g = filmTimeline([4000, 3000, 2000], program(1));
  assert.deepEqual(g.segments.map((s) => s.name ?? s.turn), ['guardian-entrance', 0, 1, 'guardian-phase', 2, 'guardian-fall']);
  assert.deepEqual(g.segments.map((s) => s.offsetMs), [0, 2000, 6000, 9000, 10000, 12000]); assert.equal(g.totalMs, 13500);
  assert.deepEqual(filmTimeline([4000], program(-1)).segments.map((s) => s.name ?? s.turn), ['guardian-entrance', 'guardian-phase', 0, 'guardian-fall']);
  assert.deepEqual(filmTimeline([4000], program(null)).segments.map((s) => s.name ?? s.turn), ['guardian-entrance', 0, 'guardian-fall']);
  assert.equal(segmentAt(g, 0), 0); assert.equal(segmentAt(g, 1999.9), 0); assert.equal(segmentAt(g, 2000), 1); assert.equal(segmentAt(g, 9500), 3); assert.equal(segmentAt(g, 99999), 5);
  assert.throws(() => filmTimeline([], null), /turn durations/); assert.throws(() => filmTimeline([4000], { entrance: { piece: 'x', durationMs: 0 } }), /no duration/);
});

const BEATS = { readyEnd: 600, commandEnd: 900, actionStart: 1800, impactAt: 2000, hitstopEnd: 2070, actionEnd: 3000, returnEnd: 3400, end: 4000 };
function guardianFixture() {
  const tl = filmTimeline([4000, 4000], program(0));
  const turns = tl.segments.filter((s) => s.kind === 'turn').map((s) => ({ turn: s.turn, offsetMs: s.offsetMs, beats: { ...BEATS } }));
  const gates = { totalMs: tl.totalMs, turns, guardian: { segments: tl.segments.map((s) => (s.kind === 'piece' ? { kind: 'piece', name: s.name, offsetMs: s.offsetMs, durationMs: s.durationMs, beats: s.piece.beats } : { kind: 'turn', turn: s.turn, offsetMs: s.offsetMs, durationMs: s.durationMs })) } };
  const target = Math.max(10000, tl.totalMs), names = ['ready', 'command', 'approach', 'action', 'hitstop', 'impact', 'return', 'idle'], ends = [600, 900, 1800, 2000, 2070, 3000, 3400, 4000];
  const frameSamples = Array.from({ length: Math.ceil(target / (1000 / 60)) + 1 }, (_, i) => {
    const ms = i * 1000 / 60, k = segmentAt(tl, ms), s = tl.segments[k], local = Math.min(ms - s.offsetMs, s.durationMs - 1e-6);
    return s.kind === 'turn' ? { ms, turn: s.turn, localMs: local, phase: names[ends.findIndex((e) => local < e)], cpuMs: 3 } : { ms, turn: null, piece: s.name, segment: k, localMs: local, phase: s.piece.beats.find((b) => local >= b.start && local < b.end).beat, cpuMs: 3 };
  });
  return { gates, capture: { plannedDurationMs: target, frames: frameSamples.length, durationMs: frameSamples.at(-1).ms, frameSamples } };
}
test('guardian capture check: every set piece and every turn phase observed in order; skipped, reordered or mislabelled samples refuse', () => {
  const { gates, capture } = guardianFixture(), r = requireGuardianFilmTimeline(gates, capture);
  assert.deepEqual(r.segments.map((s) => s.name ?? s.turn), ['guardian-entrance', 0, 'guardian-phase', 1, 'guardian-fall']);
  assert.ok(r.segments.every((s) => s.samples > 0 && s.beats.every((b) => b.samples > 0)));
  for (const [mutate, why] of [
    [(g, c) => { c.frameSamples = c.frameSamples.filter((f) => f.piece !== 'guardian-phase'); c.frames = c.frameSamples.length; }, /not on segment|missing live frames|is not set piece|never observed/],
    [(g, c) => { for (const f of c.frameSamples) if (f.piece === 'guardian-entrance') f.piece = 'guardian-fall'; }, /is not set piece guardian-entrance/],
    [(g, c) => { for (const f of c.frameSamples) if (f.piece === 'guardian-fall' && f.phase === 'b') f.phase = 'a'; }, /beat a differs/],
    [(g, c) => { for (const f of c.frameSamples) if (f.turn === 1) f.turn = 0; }, /skipped\/reordered turn 1/],
    [(g) => { g.guardian.segments[2].offsetMs += 1; }, /not contiguous/],
    [(g) => { g.guardian.segments.splice(2, 1); }, /not contiguous|planned duration/],
    [(g, c) => { c.plannedDurationMs = 10000; }, /another stop time/],
    [(g, c) => { for (const f of c.frameSamples) if (f.piece === 'guardian-phase' && f.phase === 'b') f.localMs = 0; }, /not on segment/],
  ]) { const { gates: g, capture: c } = guardianFixture(); mutate(g, c); assert.throws(() => requireGuardianFilmTimeline(g, c), why); }
});
