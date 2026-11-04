/** node --test audits/G1_AUTO_AUTHOR_20260926/remainder-islands.test.mjs — outcomes of the remainder-island rule, each with a control. */
import test from 'node:test'; import assert from 'node:assert/strict';
import { placeRemainderIslands } from './remainder-islands-fit.mjs';
/* grid legend: '.' unpainted, 'B' remainder(1), 'H' head(2), 'W' wing(3) */
const grid = (rows) => { const h = rows.length, w = rows[0].length, L = { '.': 0, B: 1, H: 2, W: 3 }; return { w, h, labels: Uint8Array.from(rows.join(''), (c) => L[c]) }; };
const show = (l, w) => [...l].map((v) => '.BHW'[v]).join('').match(new RegExp(`.{${w}}`, 'g'));
const BODY = ['BBBBBBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBBBBBB'];
test('a sliver between two parts goes to the part it borders most; the main body and every other owner are untouched', () => {
  const g = grid(['HHHHHWWWWW..........', 'HHBHHWWWWW..........', 'HHHHHWWWWW..........', ...BODY]);
  const r = placeRemainderIslands(g.labels, g.w, g.h, 1);
  assert.deepEqual(r.islands.map((s) => s.to), [2]); assert.equal(r.moved, 1);
  for (let i = 0; i < g.labels.length; i++) if (g.labels[i] !== 1 || i === 22) assert.equal(r.labels[i], i === 22 ? 2 : g.labels[i]);
});
test('ties and longer borders: an island touching wing on 3 sides and head on 1 goes to wing', () => {
  const g = grid(['HWWW................', 'HBWW................', 'HWWW................', '....................', ...BODY]);
  assert.deepEqual(placeRemainderIslands(g.labels, g.w, g.h, 1).islands.map((s) => s.to), [3]);
});
test('control: an island with no painted neighbour stays remainder; a diagonal touch counts as connected (not an island)', () => {
  const g = grid(['B...................', '....................', ...BODY]);
  const r = placeRemainderIslands(g.labels, g.w, g.h, 1); assert.equal(r.moved, 0); assert.equal(r.islands[0].to, null); assert.equal(r.labels[0], 1);
  const d = grid(['....................', '....................', '....................', 'B...................', '.BBBBBBBBBBBBBBBBBBB', ...BODY.slice(1)]);
  assert.equal(placeRemainderIslands(d.labels, d.w, d.h, 1).islands.length, 0);
});
test('control: an island over an explicit 5% cap refuses as structural; the D28 default (0.5) admits it', () => {
  const g = grid(['HHHHHHHH............', 'HBBBBBBH............', 'HHHHHHHH............', ...BODY]);
  assert.throws(() => placeRemainderIslands(g.labels, g.w, g.h, 1, 0.05), /structural, not a sliver/);
  assert.equal(placeRemainderIslands(g.labels, g.w, g.h, 1).moved, 6, 'D28 default admits it');
  assert.equal(placeRemainderIslands(g.labels, g.w, g.h, 1, 0.1).moved, 6, 'the same island passes a looser cap, so the refusal is the cap');
});
test('mutation: moving the MAIN component instead would change the body — the rule never does', () => {
  const g = grid(['HHHHH...............', 'HHBHH...............', 'HHHHH...............', ...BODY]);
  const r = placeRemainderIslands(g.labels, g.w, g.h, 1); assert.equal(show(r.labels, g.w).slice(3).join(''), BODY.join(''));
});
