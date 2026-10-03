/** G1 v3 rule study (no new runs): replay a recorded mutation battery (`mutants/summary-<tag>.json`, run with --counter so every
 * reason and the counter's inventory assignment are retained) under candidate admission rules, and score positives kept, erased and
 * duplicated refused. The v2 checks (coverage, unexplained, facing, wrong family) are always on; each rule set adds counter reasons.
 * Run from the worktree root: node audits/G1_AUTO_AUTHOR_20260926/simulate-rules.mjs [tag] */
import fs from 'node:fs';
import path from 'node:path';
const HERE = import.meta.dirname, tag = process.argv[2] ?? 'v3diag';
const s = JSON.parse(fs.readFileSync(path.join(HERE, 'mutants', 'summary-' + tag + '.json'), 'utf8'));
const old = (e) => e.reasonsAll.some((x) => !/\((counted|merged|detached)\)/.test(x));
const limbish = (a) => a.names.some((n) => n === 'leg' || n === 'tail');
export const RULES = {
  base: {},
  detached: { detached: true },
  'detached+extra≥1.2%': { detached: true, extraMin: 1.2 },
  'detached+extra≥3%': { detached: true, extraMin: 3 },
  'detached+merged': { detached: true, merged: true },
  'detached+leg/tail<0.12': { detached: true, filter: (a) => limbish(a) && a.refFrac >= 0.02, t: 0.12 },
  'detached+leg/tail/fin8%<0.15': { detached: true, filter: (a) => (limbish(a) && a.refFrac >= 0.02) || (a.names.includes('fin') && a.refFrac >= 0.08), t: 0.15 },
  'counted (all v3a rules)': { detached: true, extraMin: 1.2, merged: true, filter: () => true, t: 0.25 },
  'unassigned≥6%': { detached: true, unassignedMin: 6 },
  'unassigned≥5%': { detached: true, unassignedMin: 5 },
  'unassigned≥6% + biggest-rear<0.15': { detached: true, unassignedMin: 6, biggestRear: 0.15 },
  'unassigned≥6% + biggest-rear<0.2': { detached: true, unassignedMin: 6, biggestRear: 0.2 },
  'unassigned≥6% + leg/tail<0.12': { detached: true, unassignedMin: 6, filter: (a) => limbish(a) && a.refFrac >= 0.02, t: 0.12 },
  'unassigned≥6% + floor(rear)×0.8': { detached: true, unassignedMin: 6, floor: { classes: ['rear'], rho: 0.8 } },
  'unassigned≥6% + floor(rear)×0.9': { detached: true, unassignedMin: 6, floor: { classes: ['rear'], rho: 0.9 } },
  'unassigned≥6% + floor(rear,limb-down)×0.8': { detached: true, unassignedMin: 6, floor: { classes: ['rear', 'limb-down'], rho: 0.8 } },
  'unassigned≥6% + floor(all)×0.7': { detached: true, unassignedMin: 6, floor: { classes: null, rho: 0.7 } },
  'unassigned≥6% + floor(rear, present)×0.7': { detached: true, unassignedMin: 6, floor: { classes: ['rear'], rho: 0.7, presentOnly: true } },
  'unassigned≥6% + floor(rear, present)×0.6': { detached: true, unassignedMin: 6, floor: { classes: ['rear'], rho: 0.6, presentOnly: true } },
  'unassigned≥6% + floor(all, present)×0.6': { detached: true, unassignedMin: 6, floor: { classes: null, rho: 0.6, presentOnly: true } },
  'unassigned≥5% + floor(all, present)×0.6': { detached: true, unassignedMin: 5, floor: { classes: null, rho: 0.6, presentOnly: true } },
};
/** Family floor per class from the OTHER same-family paintings' own counts (their positive runs): the smallest "largest appendage of
 * that class" among them, in % of paint. Leave-one-subject-out. */
const largestByClass = (e) => { const o = {}; for (const a of e.inv.tApp) o[a.class] = Math.max(o[a.class] ?? 0, 100 * a.frac); return o; };
const floorFor = (r, classes) => { const others = s.rows.filter((o) => o.family === r.family && o.id !== r.id && o.posEv?.inv).map((o) => largestByClass(o.posEv)), out = {};
  for (const c of classes ?? [...new Set(others.flatMap((o) => Object.keys(o)))]) { if (!others.length || others.some((o) => !(c in o))) continue; out[c] = Math.min(...others.map((o) => o[c])); } return out; };
/** The target appendages no reference appendage lands on (≥ 10 % overlap), as % of paint. */
const unassigned = (e) => { const used = new Set(e.inv.assign.filter((a) => a.target >= 0 && a.overlap >= 0.1).map((a) => a.target)); return e.inv.tApp.filter((a) => !used.has(a.k)).map((a) => 100 * a.frac); };
export function refuses(e, cfg, r = null) {
  if (!e) return null; if (old(e)) return true; const R = e.reasonsAll;
  if (cfg.detached && R.some((x) => x.includes('(detached)'))) return true;
  if (cfg.extraMin && R.some((x) => x.startsWith('extra-anatomy (counted)') && parseFloat(x.match(/of ([0-9.]+)% paint/)[1]) >= cfg.extraMin)) return true;
  if (cfg.merged && R.some((x) => x.includes('(merged)'))) return true;
  if (cfg.filter && (e.inv?.assign ?? []).some((a) => cfg.filter(a) && a.overlap < cfg.t)) return true;
  if (cfg.unassignedMin && e.inv && Math.max(0, ...unassigned(e)) >= cfg.unassignedMin) return true;
  // the reference's LARGEST inventory appendage (a fish's caudal, a quadruped's tail or leg) must land on the target
  if (cfg.floor && r && e.inv) { const f = floorFor(r, cfg.floor.classes), mine = largestByClass(e); for (const [c, v] of Object.entries(f)) { if (cfg.floor.presentOnly && !(c in mine)) continue; if ((mine[c] ?? 0) < cfg.floor.rho * v) return true; } }
  if (cfg.biggestRear && e.inv?.assign?.length) { const big = [...e.inv.assign].sort((x, y) => y.refFrac - x.refFrac)[0]; if (big.overlap < cfg.biggestRear) return true; }
  return false;
}
const out = [];
for (const [name, cfg] of Object.entries(RULES)) { let pa = 0, pn = 0, er = 0, en = 0, dr = 0, dn = 0;
  for (const r of s.rows) { if (r.posEv) { pn++; if (!refuses(r.posEv, cfg, r)) pa++; } if (r.erEv) { en++; if (refuses(r.erEv, cfg, r)) er++; } if (r.dupEv) { dn++; if (refuses(r.dupEv, cfg, r)) dr++; } }
  const lost = s.rows.filter((r) => r.posEv && !refuses(r.posEv, RULES.base, r) && refuses(r.posEv, cfg, r)).map((r) => r.id);
  const row = { rules: name, positivesKept: `${pa}/${pn}`, erasedRefused: `${er}/${en}`, duplicatedRefused: `${dr}/${dn}`, positivesLostVsBase: lost }; out.push(row); console.log(JSON.stringify(row)); }
fs.writeFileSync(path.join(HERE, 'mutants', 'rules-' + tag + '.json'), JSON.stringify(out, null, 1) + '\n');
