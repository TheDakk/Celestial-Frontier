import fs from 'node:fs';

const CSV = 'C:/Users/Nick/AppData/Local/Temp/claude/C--Projects/63354f8d-17f2-4574-9712-a2a57f788098/scratchpad/nickaudit/Celestial_Frontier_Current_One_By_One_Audit/engine_data/all_1250_current_one_by_one_audit.csv';
const MINE = 'C:/Projects/Celestial-Frontier/port/v2/reference/goldpass2-results.json';

/* minimal RFC4180 parse — fields contain commas inside quotes */
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = parseCSV(fs.readFileSync(CSV, 'utf8'));
const head = raw[0];
const col = (n) => head.indexOf(n);
const his = raw.slice(1).filter((r) => r.length > 5).map((r) => ({
  category: r[col('category')],
  name: r[col('display_name')],
  status: r[col('current_status')],
  changed: r[col('changed_from_previous_submission')],
  risk: r[col('global_body_template_risk')],
  fix: r[col('current_assessment_and_required_fix')],
  sha: r[col('sha256')], prevSha: r[col('previous_sha256')],
}));

const mine = JSON.parse(fs.readFileSync(MINE, 'utf8')).rows;
const mineBy = new Map(mine.map((r) => [r.species, r]));

/* HOLD ≡ POLISH */
const norm = (b) => (b === 'HOLD' ? 'POLISH' : b);

let joined = 0; const miss = [];
const M = {}; for (const a of ['FAIL', 'POLISH', 'PASS']) { M[a] = { FAIL: 0, POLISH: 0, PASS: 0 }; }
const bothFail = [], hisFailOnly = [], myFailOnly = [];
for (const h of his) {
  const m = mineBy.get(h.name);
  if (!m) { miss.push(h.name); continue; }
  joined++;
  const hb = norm(h.status), mb = m.band;
  M[hb][mb]++;
  if (hb === 'FAIL' && mb === 'FAIL') bothFail.push(h.name);
  else if (hb === 'FAIL') hisFailOnly.push(`${h.name} (mine: ${mb})`);
  else if (mb === 'FAIL') myFailOnly.push(`${h.name} (his: ${hb})`);
}
console.log('joined on species:', joined, '· unjoined:', miss.length);
if (miss.length) console.log('  unjoined sample:', miss.slice(0, 6).join(' | '));
console.log();
console.log('AGREEMENT MATRIX   rows = Nick engine, cols = my gold pass 2');
console.log('              →FAIL  →POLISH   →PASS');
for (const a of ['FAIL', 'POLISH', 'PASS']) {
  console.log('  ' + a.padEnd(8) + ['FAIL', 'POLISH', 'PASS'].map((b) => String(M[a][b]).padStart(7)).join(' '));
}
const agree = M.FAIL.FAIL + M.POLISH.POLISH + M.PASS.PASS;
console.log('  exact band agreement: ' + agree + '/' + joined + ' = ' + (100 * agree / joined).toFixed(1) + '%');
const bothBad = M.FAIL.FAIL + M.FAIL.POLISH + M.POLISH.FAIL + M.POLISH.POLISH;
console.log('  agree "not shippable as PASS": ' + bothBad + '/' + joined);
console.log();
console.log('BOTH SAY FAIL — certain work: ' + bothFail.length);
console.log('  ' + bothFail.slice(0, 25).join(', '));
console.log();
console.log('HE FAILS, I DO NOT: ' + hisFailOnly.length);
console.log('  ' + hisFailOnly.slice(0, 20).join(', '));
console.log();
console.log('I FAIL, HE DOES NOT: ' + myFailOnly.length);
console.log('  ' + myFailOnly.slice(0, 20).join(', '));

/* per-category divergence */
console.log('\nPER CATEGORY');
for (const c of [...new Set(his.map((h) => h.category))]) {
  const rows = his.filter((h) => h.category === c && mineBy.has(h.name));
  const hf = rows.filter((h) => h.status === 'FAIL').length;
  const mf = rows.filter((h) => mineBy.get(h.name).band === 'FAIL').length;
  const both = rows.filter((h) => h.status === 'FAIL' && mineBy.get(h.name).band === 'FAIL').length;
  console.log('  ' + c.padEnd(12) + ' n=' + String(rows.length).padStart(4)
    + '   his FAIL ' + String(hf).padStart(3) + '   my FAIL ' + String(mf).padStart(3)
    + '   overlap ' + String(both).padStart(3));
}

/* did the pixels actually change since his previous submission? */
const changedPix = his.filter((h) => h.sha && h.prevSha && h.sha !== h.prevSha).length;
const samePix = his.filter((h) => h.sha && h.prevSha && h.sha === h.prevSha).length;
console.log('\nSHA EVIDENCE  changed since his previous submission: ' + changedPix + ' · byte-identical: ' + samePix);

fs.writeFileSync('C:/Users/Nick/AppData/Local/Temp/claude/C--Projects/63354f8d-17f2-4574-9712-a2a57f788098/scratchpad/joined.json',
  JSON.stringify({ bothFail, hisFailOnly, myFailOnly }, null, 1));
