/* Source-truth voice model: every function is sliced verbatim from the build,
   never re-implemented. Lets us run voiceOf over the real genome corpus. */
import fs from 'fs';
const src = fs.readFileSync('/root/cf/v9/game.html', 'utf8');

const grabFn = (name, from = 0) => {
  const i = src.indexOf('function ' + name + '(', from);
  if (i < 0) throw new Error('missing fn ' + name);
  let d = 0, st = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '{') { d++; st = true; }
    else if (c === '}') { d--; if (st && d === 0) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced ' + name);
};
const grabConst = (name) => {
  const re = new RegExp('(^|\\n)\\s*const ' + name + '\\s*=', '');
  const m = re.exec(src);
  if (!m) throw new Error('missing const ' + name);
  let i = src.indexOf('const ' + name, m.index), d = 0, st = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if ('{[('.includes(c)) { d++; st = true; }
    else if ('}])'.includes(c)) { d--; }
    else if (c === ';' && d === 0) return src.slice(i, k + 1);
  }
  throw new Error('unbalanced const ' + name);
};

const FNS   = ['hashInt', 'mulberry32', 'clamp', '_blendVoice', 'voiceOf', '_earthArt', 'makeGenome', 'crossGenome'];
const CONST = ['SP_COLOR','FA_BODY','FA_LOCO','FA_TRAIT','FA_SIZE','FA_SIZE_M','FA_DIET','FA_HEAD','FA_LIMBS',
               'FA_SKIN','FA_TAIL','FA_PATTERN','FA_EYES','FA_BEHAVIOR','FA_HABITAT','FLORA_DETAIL','FA_TEMPER',
               'FA_SENSE','FA_REPRO','FA_LIFE','FA_METAB','_VOICE','_VOICE_KEYS','_TEMPER_BOLD'];

const parts = [];
for (const c of CONST) parts.push(grabConst(c));
for (const f of FNS)   parts.push(grabFn(f));
const M = new Function(parts.join('\n') + '\nreturn {' + [...CONST, ...FNS].join(',') + '};')();
export default M;
if ((process.argv[1]||'').endsWith('model9.mjs')) console.log('ok:', Object.keys(M).length, 'symbols');
