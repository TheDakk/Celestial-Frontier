/* Extract the real functions from v1.8.2 and measure two quantitative claims:
   B1 — does the breeding preview band actually bracket the child?
   A2 — what does the conquest matchup meter cost per row?
   Nothing is re-implemented; every function is sliced from the build by brace matching. */
import fs from 'fs';
import { performance } from 'perf_hooks';

const src = fs.readFileSync('/root/cf/v7/game.html', 'utf8');

const fn = (name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('missing function ' + name);
  let d = 0, started = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '{') { d++; started = true; }
    else if (c === '}') { d--; if (started && d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced ' + name);
};
// a top-level `const NAME = ...;` or `const NAME = (()=>{...})();`
const konst = (name) => {
  const re = new RegExp('^const ' + name + '\\s*=', 'm');
  const m = re.exec(src);
  if (!m) throw new Error('missing const ' + name);
  let i = m.index, d = 0, started = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '{' || c === '[' || c === '(') { d++; started = true; }
    else if (c === '}' || c === ']' || c === ')') { d--; }
    else if (c === ';' && started && d === 0) return src.slice(i, k + 1);
    else if (c === ';' && !started) return src.slice(i, k + 1);
  }
  throw new Error('unbalanced const ' + name);
};

const WANT_FN = process.env.FNS ? process.env.FNS.split(',') : [];
const parts = [];
for (const n of WANT_FN) { try { parts.push(fn(n)); } catch (e) { console.error('  [skip fn]', n, e.message); } }
const WANT_K = process.env.KONSTS ? process.env.KONSTS.split(',') : [];
for (const n of WANT_K) { try { parts.push(konst(n)); } catch (e) { console.error('  [skip const]', n, e.message); } }

const mod = new Function(`
  ${parts.join('\n')}
  return { ${[...WANT_FN, ...WANT_K].filter(Boolean).join(', ')} };
`)();
export default mod;
console.log('extracted:', Object.keys(mod).filter(k => mod[k] !== undefined).join(', '));
