/* Independent cost check: how long does ONE runDuel take, and therefore what
   does a 160-duel matchup sample cost per row? runDuel is sliced verbatim. */
import fs from 'fs';
import { performance } from 'perf_hooks';
const src = fs.readFileSync('/root/cf/v7/game.html', 'utf8');
const fn = (name) => { const i = src.indexOf('function ' + name + '(');
  let d = 0, s = false;
  for (let k = i; k < src.length; k++) { const c = src[k];
    if (c === '{') { d++; s = true; } else if (c === '}') { d--; if (s && !d) return src.slice(i, k + 1); } } };
const m = new Function(`${fn('mulberry32')}\n${fn('hashInt')}\n${fn('runDuel')}\nreturn {runDuel,hashInt};`)();
const F = (n, seed, st) => ({ name: n, genome: { seed }, stats: st });
const A = { vit: 60, fer: 45, res: 35, agi: 25, ins: 22, total: 187, ab: {} };
const B = { vit: 55, fer: 48, res: 30, agi: 28, ins: 20, total: 181, ab: { dmg: 1.2 } };
// warm
for (let i = 0; i < 2000; i++) m.runDuel(F('a', i, A), F('b', i * 7, B));
const N = 20000, t0 = performance.now();
for (let i = 0; i < N; i++) m.runDuel(F('a', i, A), F('b', i * 7, B));
const per = (performance.now() - t0) / N;
console.log(`one runDuel               ${per.toFixed(4)} ms   (${N.toLocaleString()} iterations, JIT-warm)`);
console.log(`160-duel matchup sample   ${(per*160).toFixed(2)} ms   ← per champion row, duels only`);
console.log();
console.log('rows are uncapped: champs = [player, ...every Fauna in the codex]');
for (const n of [25, 50, 100, 200, 400]) {
  console.log(`  ${String(n).padStart(3)} fauna → ${String((per*160*(n+1)).toFixed(0)).padStart(5)} ms of duels alone` +
    (n>=200 ? '   (plus 320 redundant battleStats per row — see the source finding)' : ''));
}
