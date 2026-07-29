/* Extract runDuel verbatim from the build and measure the burn/regen asymmetry
   and the victory-tie bias. Nothing is re-implemented — the real loop is used. */
import fs from 'fs';

const src = fs.readFileSync('/root/cf/v5/game.html', 'utf8');

// brace-matched extraction of a single top-level function
const fn = (name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('missing ' + name);
  let d = 0, started = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '{') { d++; started = true; }
    else if (c === '}') { d--; if (started && d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced ' + name);
};
const rngSrc = fn('mulberry32') + '\n' + fn('hashInt');
const duelSrc = fn('runDuel');

const mod = new Function(`
  ${rngSrc}
  ${duelSrc}
  return { runDuel };
`)();
const { runDuel } = mod;

// a fighter is just {name, genome:{seed}, stats:{...}} — runDuel uses .stats when present
const F = (name, seed, o = {}) => ({
  name, genome: { seed },
  stats: Object.assign({ vit: 50, fer: 40, res: 30, agi: 20, ins: 20, total: 160, ab: {} }, o),
});

const run = (mk, n = 4000) => {
  let a = 0, b = 0, draw = 0, capped = 0, ties = 0;
  for (let s = 1; s <= n; s++) {
    const [A, B] = mk(s);
    const r = runDuel(A, B);
    if (r.winner === 'A') a++; else if (r.winner === 'B') b++; else draw++;
    if (r.hpA > 0 && r.hpB > 0) { capped++; if (Math.abs(r.hpA / r.maxA - r.hpB / r.maxB) < 1e-12) ties++; }
  }
  return { aPct: +(100 * a / n).toFixed(1), bPct: +(100 * b / n).toFixed(1),
           drawPct: +(100 * draw / n).toFixed(1),
           cappedPct: +(100 * capped / n).toFixed(1), exactTiePct: +(100 * ties / n).toFixed(1) };
};

console.log('=== B2: burn is not halved, regen is ===');
console.log('Cinderburn (burn 0.05) vs identical no-ability :',
  JSON.stringify(run(s => [F('Burner', s * 7919, { ab: { burn: 0.05 } }), F('Plain', s * 104729)])));
console.log('Mend V (regen 0.054) vs identical no-ability   :',
  JSON.stringify(run(s => [F('Regen', s * 7919, { ab: { regen: 0.054 } }), F('Plain', s * 104729)])));
console.log('  -> equal-magnitude sustain abilities, opposite outcomes\n');

console.log('with the *0.5 the regen line already has, applied to burn:');
{
  // re-run with burn halved to show what the fix yields
  const patched = new Function(`
    ${rngSrc}
    ${duelSrc.replace(
      "_bB=Math.max(1,Math.round(maxB*A.ab.burn))", "_bB=Math.max(1,Math.round(maxB*A.ab.burn*0.5))")
      .replace(
      "_bA=Math.max(1,Math.round(maxA*B.ab.burn))", "_bA=Math.max(1,Math.round(maxA*B.ab.burn*0.5))")}
    return { runDuel };
  `)().runDuel;
  let a = 0; const n = 4000;
  for (let s = 1; s <= n; s++) {
    const r = patched(F('Burner', s * 7919, { ab: { burn: 0.05 } }), F('Plain', s * 104729));
    if (r.winner === 'A') a++;
  }
  console.log('Cinderburn vs identical no-ability             :', (100 * a / n).toFixed(1) + '% (was 75%+)\n');
}

console.log('=== B4: every exact HP-fraction tie goes to side A (always the player) ===');
const tank = { vit: 120, fer: 12, res: 90, agi: 20, ins: 10, total: 252, ab: { cap: 0.22 } };
console.log('bulwark tank mirror (identical stats both sides):',
  JSON.stringify(run(s => [F('Player', s * 7919, tank), F('Native', s * 104729, tank)])));
const lowfer = { vit: 90, fer: 10, res: 80, agi: 8, ins: 8, total: 196, ab: {} };
console.log('low-ferocity mirror                            :',
  JSON.stringify(run(s => [F('Player', s * 7919, lowfer), F('Native', s * 104729, lowfer)])));

console.log('\n=== B7: is the defensive half of the stat sheet playable? ===');
const wall = { vit: 90, fer: 10, res: 80, agi: 8, ins: 8, total: 196, ab: {} };
const glass = { vit: 20, fer: 80, res: 20, agi: 40, ins: 36, total: 196, ab: {} };
console.log('vit/res wall  vs  glass cannon (IDENTICAL total power):',
  JSON.stringify(run(s => [F('Wall', s * 7919, wall), F('Cannon', s * 104729, glass)])));

console.log('\n=== CF1715-06 follow-up: does the new ferocity-scaled floor help? ===');
console.log('floor = Math.max(2, round(att.fer*0.10), round(dmg)) — so it only bites above fer 20');
for (const fer of [10, 20, 40, 60, 80]) {
  const wall = { vit: 100 - fer / 2, fer, res: 90 - fer / 2, agi: 10, ins: 10, total: 200, ab: {} };
  const cannon = { vit: 20, fer: 80, res: 20, agi: 40, ins: 36, total: 200, ab: {} };
  let a = 0; const n = 2000;
  for (let s = 1; s <= n; s++) {
    const r = runDuel(F('Wall', s * 7919, wall), F('Cannon', s * 104729, cannon));
    if (r.winner === 'A') a++;
  }
  console.log(`  wall fer=${String(fer).padStart(2)} (floor ${Math.max(2, Math.round(fer * 0.1))}) → wins ${(100 * a / n).toFixed(1)}%`);
}

console.log('\n=== B4 proof: the tie-break reads A.genome, which does not exist ===');
{
  const one = runDuel(F('P', 111, { vit: 120, fer: 12, res: 90, agi: 20, ins: 10, total: 252, ab: { cap: 0.22 } }),
                      F('N', 222, { vit: 120, fer: 12, res: 90, agi: 20, ins: 10, total: 252, ab: { cap: 0.22 } }));
  console.log('  res.A has .genome?', 'genome' in one.A, '| res.B has .genome?', 'genome' in one.B);
  console.log('  A keys:', Object.keys(one.A).join(','));
}
