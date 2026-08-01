/* importSaveV2 — the v1.8.9 cfcc_save_v2 LOAD PATH as a pure function.
   Port Phase 2 deliverable 1. Mirrors main.js loadSave (14202–14484) field
   by field; every clamp there is a shipped-defect lesson and each is
   reproduced with its reason. THE TRUTH IS NOT THIS FILE: the parity test
   replays port/baseline-v1.8.9/save-fixtures.json — post-boot state captured
   from the REAL loadSaveWithRecovery — and this importer must match it.

   Deliberate differences from the original, all inert to the output:
   - `now` is INJECTED (the original reads Date.now() — the anti-edit clamps
     need "no later than now", and a test needs to own "now").
   - state lands in a SaveStateV2 object instead of app globals/DOM.
   - the content VALIDATION SURFACE (id sets/maps/bounds) is injected as
     ContentRegistry (port/baseline-v1.8.9/content-registry.json).

   THE LAWS, restated at the sites that own them below:
   - size is NEVER clamped/wrapped at load (v1.8.6's save corruption).
   - `{}` where an array belongs loses THAT field, never the save (CF-RR-002).
   - tut absent ⇒ done · tips/snd/fx/shake/sv/notif absent ⇒ on · conq e
     absent ⇒ READY once (the deliberate pre-v1.8.8 migration). */
import {
  cleanName, _sanitizeSavedGenome, _sanitizeView, ringGrade,
} from '@cf/domain-strays';
import { describeSpecies, classifyRealm, ecologyRole, realmBiome, realmModifiers, sapienceTier } from '@cf/domain-genome';
import type { Genome } from '@cf/domain-genome';

export interface ContentRegistry {
  materials: string[];
  items: Record<string, { slot: string | null }>;
  affixHi: Record<string, number>;
  eqSlots: string[];
  techs: string[];
  binderSets: string[];
  charterStarters: string[];
  charterPool: string[];
  sigIds: string[];
  statKeys: string[];
  achLen: number;
  rankHuesLen: number;
  ascChaptersLen: number;
  tierMax: number;
}

export interface CodexEntry {
  id: string; name: string; kind: string; tier: number | null;
  realm: string; sapient: number; from: string; hybrid: boolean; g: Record<string, unknown>;
}
export interface SaveStateV2 {
  EPOCH_BASE: number; essence: number; explorerName: string; lastAnomKey: string | null;
  stats: Record<string, number>;
  pstats: Record<string, number>; hp: number; HP_MAX: number;
  customNames: Array<[string, string]>;
  conquered: Array<[unknown, { t: number; tier: number; e?: number }]>;
  cargo: Array<[string, number]>; cgx: Array<[string, number]>;
  items: Array<[string, number]>; equip: Record<string, string>;
  equipAff: Record<string, { k: string; v: number; forId: string }>;
  pinnedRecipe: string | null; cargoTab: string;
  seenSp: string[]; journal: Array<{ s: number; n: string; w: string; t: number }>;
  mined: Array<[unknown, number]>; mineX: Array<[unknown, number]>; skimX: Array<[unknown, number]>;
  bioX: Array<[number, [number, number]]>;
  techOwned: string[]; claimedSets: string[]; ascCh: number; ascProg: Record<string, number>;
  nameHue: number; savedView: Record<string, unknown> | null;
  fsMode: string; toneMode: string; fontMode: string;
  sndOn: boolean; fxOn: boolean; chartsOn: boolean; shakeOn: boolean;
  salvageConfirm: boolean; notifOn: boolean; tipsOn: boolean;
  sfxVol: number; glassTint: number; motionMode: number; cardExpand: number;
  notifications: Array<{ id: number; tt: string; ms: string; t: number; read: boolean }>;
  surveyedSet: string[]; galSeen: unknown[]; surfSeen: unknown[]; xpFirsts: string[];
  sysSeen: number[]; starKindsSeen: string[]; ptypesSeen: string[];
  eventKeysSeen: string[]; evAnnounced: string[]; unlocked: string[];
  landed: number[]; contacted: number[];
  waveOffs: Array<[number, number]>;
  primeFill: Record<string, { title: string; sub: string; tier: number; hex: string; where: unknown }>;
  frontierUnlocked: boolean; frontierEnding: string | null; seenGuide: boolean;
  tutDone: boolean; rnSeen: string; tutSnapPending: unknown; scoutId: string | null;
  chWeek: number; chProg: Record<string, number>; chacc: string[]; chDone: string[];
  homeId: string | null; voiceOn: boolean; combatSfxOn: boolean;
  logMap: Array<[string, Record<string, unknown>]>;
  codex: Array<[string, CodexEntry]>;
}

const HARVEST_CD = 3600e3;   /* key anchor (CLAUDE.md) — the harvest stamp floor window */

export function importSaveV2(raw: string | null | undefined, registry: ContentRegistry, now: number): { ok: false } | { ok: true; state: SaveStateV2 } {
  try {
    if (!raw) return { ok: false };
    const data = JSON.parse(raw) as Record<string, unknown>;

    const num = (v: unknown, d?: number): number => { const x = +(v as number); return Number.isFinite(x) ? x : (d || 0); };
    const clamp = (v: number, a: number, b: number): number => (v < a ? a : (v > b ? b : v));
    /* CF-RR-002: `{}` where an array belongs loads EMPTY; the save survives */
    const _capA = (a: unknown, n: number): unknown[] => (Array.isArray(a) ? a.slice(0, n) : []);
    const itemBy = registry.items;
    const TIER_MAX = registry.tierMax;

    const EPOCH_BASE = num(data.epoch);
    const customNames = new Map<string, string>();
    for (const kv of _capA(data.names, 5000) as Array<[unknown, unknown]>) {
      if (kv && typeof kv[0] === 'string') { const nm = cleanName(kv[1]); if (nm) customNames.set(kv[0], nm); }
    }
    const stats: Record<string, number> = {
      /* hybrids/best/maxGen: DECLARATION-initialized in the game, never
         load-restored (they rebuild from play) — present so the observable
         shape matches the real post-load stats object */
      hybrids: 0, best: 0, maxGen: 0,
      shares: num(data.shares), jumps: num(data.jumps), anomalies: num(data.anomalies),
      events: num(data.events), duels: num(data.duels), duelwins: num(data.duelwins),
      breeds: num(data.breeds), breedwins: num(data.breedwins),
      feeds: num(data.feeds), feedfails: num(data.feedfails),
      harvests: num(data.harvests), essenceEarned: num(data.essenceEarned),
      guardians: num(data.guardians), paragons: num(data.paragons),
      mines: num(data.mines), crafts: num(data.crafts), minedout: num(data.minedout),
      skims: num(data.skims), cosmics: num(data.cosmics),
      landings: num(data.landings), charters: num(data.charters),
      surveys: 0, bestRank: clamp(num(data.br), 0, registry.rankHuesLen - 1),
    };
    const lastAnomKey = (data.anomKey as string) || null;
    const explorerName = cleanName((data.me as string) || '');
    const essence = clamp(num(data.essence), 0, 1e9);

    /* the save's own wall-clock stamp — the anti-edit anchor. `now` injected. */
    const _nowL = now;
    const _atL = clamp(num(data.at, _nowL), 0, _nowL);
    /* v1.8.8: `t` is a DISPLAY stamp and gates nothing; readiness rides `e`,
       bounded to the epoch clock's own range — a future epoch would hold a
       world hostage forever, a wild negative would mint free harvests.
       ABSENT e ⇒ READY (one deliberate migration cycle per world). */
    const _hvFloor = Math.max(0, _atL - HARVEST_CD);
    const conquered: SaveStateV2['conquered'] = [];
    for (const kv of _capA(data.conq, 20000) as Array<[unknown, Record<string, unknown>]>) {
      if (!kv || kv[0] == null || !kv[1]) continue;
      const _row: { t: number; tier: number; e?: number } = { t: clamp(num(kv[1].t), _hvFloor, _nowL), tier: clamp(num(kv[1].tier), 0, TIER_MAX) };
      if (kv[1].e != null) _row.e = clamp(num(kv[1].e), 0, EPOCH_BASE);
      conquered.push([kv[0], _row]);
    }
    const claimedSets: string[] = [];
    for (const s of _capA(data.setsc, 200)) if (registry.binderSets.includes(s as string)) claimedSets.push(s as string);
    const cargo = new Map<string, number>();
    for (const kv of _capA(data.cargo, 200) as Array<[string, unknown]>) { if (kv && registry.materials.includes(kv[0])) cargo.set(kv[0], clamp(num(kv[1]), 0, 1e6)); }
    /* exceptional sub-counts clamp to the HELD quantity — a crafted save can never mint grade */
    const cgx = new Map<string, number>();
    for (const kv of _capA(data.cgx, 200) as Array<[string, unknown]>) { if (kv && registry.materials.includes(kv[0])) cgx.set(kv[0], clamp(num(kv[1]), 0, cargo.get(kv[0]) || 0)); }
    const pinnedRecipe = (typeof data.pin === 'string' && itemBy[data.pin]) ? data.pin : null;
    const cargoTab = (data.ctb === 'mat' || data.ctb === 'craft' || data.ctb === 'gear') ? data.ctb : 'mat';
    const seenSp = new Set<string>();
    if (Array.isArray(data.seen)) for (const id of data.seen.slice(0, 3000)) { if (typeof id === 'string') seenSp.add(id.slice(0, 24)); }
    const journal: SaveStateV2['journal'] = [];
    if (Array.isArray(data.jrn)) for (const j of data.jrn.slice(-24) as Array<Record<string, unknown>>) {
      if (j && j.n) journal.push({ s: num(j.s) | 0, n: String(j.n).slice(0, 28), w: String(j.w || '').slice(0, 16), t: clamp(num(j.t), 0, 4102444800000) });
    }
    /* exploit audit: a mined stamp edited to 0 pre-armed 30 loads on every
       world — floor each stamp to one accrual window before the save's own
       stamp; legitimate players are unaffected (the 30-load cap dominates) */
    const _minT = Math.max(0, _atL - 30 * 6e5);
    const mined = new Map<unknown, number>();
    for (const kv of (Array.isArray(data.minedw) ? data.minedw.slice(0, 60000) : []) as Array<[unknown, unknown]>) { if (kv && kv[0] != null) mined.set(kv[0], clamp(num(kv[1]), _minT, _nowL)); }
    const skimX = new Map<unknown, number>();
    if (Array.isArray(data.skx)) { for (const kv of data.skx.slice(0, 60000) as Array<[unknown, unknown]>) { if (kv && kv[0] != null) skimX.set(kv[0], clamp(num(kv[1]), 0, 1e7) | 0); } }
    /* mx capped while minedw is not — a mined world fallen off the cap must
       never read untouched, or its finite reserve silently refills */
    const mineX = new Map<unknown, number>();
    if (Array.isArray(data.mx)) {
      for (const kv of data.mx.slice(0, 60000) as Array<[unknown, unknown]>) { if (kv && kv[0] != null) mineX.set(kv[0], clamp(num(kv[1]), 0, 1e7) | 0); }
      for (const k of mined.keys()) if (!mineX.has(k)) mineX.set(k, 1);
    } else {
      for (const k of mined.keys()) mineX.set(k, 1);
    }
    const bioX: SaveStateV2['bioX'] = [];
    if (Array.isArray(data.bx)) for (const kv of data.bx.slice(0, 60000) as Array<[unknown, unknown[]]>) {
      if (kv && kv[0] != null && Array.isArray(kv[1])) bioX.push([num(kv[0]), [clamp(num(kv[1][0]), 0, 999) | 0, clamp(num(kv[1][1]), 0, 1e9) | 0]]);
    }
    const techOwned: string[] = [];
    for (const t of _capA(data.tech, 100)) if (registry.techs.includes(t as string)) techOwned.push(t as string);
    /* absent ⇒ empty bench — veterans start crafting from zero like everyone */
    const items = new Map<string, number>();
    for (const kv of _capA(data.items, 300) as Array<[string, unknown]>) { if (kv && itemBy[kv[0]]) items.set(kv[0], clamp(num(kv[1]), 0, 999) | 0); }
    const equip: Record<string, string> = {};
    if (data.eq && typeof data.eq === 'object') {
      for (const sid of registry.eqSlots) {
        const id = (data.eq as Record<string, unknown>)[sid];
        if (typeof id === 'string' && itemBy[id] && itemBy[id]!.slot === sid && (items.get(id) || 0) > 0) equip[sid] = id;
      }
    }
    const equipAff: SaveStateV2['equipAff'] = {};
    if (data.ea && typeof data.ea === 'object') for (const sid of registry.eqSlots) {
      const a = (data.ea as Record<string, Record<string, unknown>>)[sid];
      const hi = a && registry.affixHi[a.k as string];   /* clamp to the affix's OWN hi */
      if (hi !== undefined && a && typeof a.forId === 'string' && equip[sid] === a.forId)
        equipAff[sid] = { k: a.k as string, v: clamp(num(a.v), 0, hi), forId: a.forId };
    }
    const ascCh = clamp(num(data.asc), 0, registry.ascChaptersLen) | 0;
    const ascProg: Record<string, number> = {};
    if (data.ascp && typeof data.ascp === 'object' && !Array.isArray(data.ascp)) {
      for (const k in data.ascp as Record<string, unknown>) { const v = +((data.ascp as Record<string, unknown>)[k] as number); if (typeof k === 'string' && k.length < 24 && Number.isFinite(v) && v >= 0) ascProg[k] = Math.min(v | 0, 999); }
    }
    const nameHue = Number.isFinite(+(data.nh as number)) ? clamp((+(data.nh as number)) | 0, -1, registry.rankHuesLen - 1) : -1;
    const savedView = _sanitizeView(data.view);
    const pstats: Record<string, number> = { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 };   /* the game's declared defaults */
    if (data.pstats && typeof data.pstats === 'object') { for (const _k of registry.statKeys) { const v = (data.pstats as Record<string, unknown>)[_k]; if (typeof v === 'number') pstats[_k] = clamp(Math.round(v), 1, 330); } }
    const HP_MAX = Math.max(20, Math.round(pstats.vit! * 2));   /* hpMaxFromVit */
    let hp = HP_MAX;
    if (typeof data.hp === 'number') hp = clamp(data.hp, 1, HP_MAX);   /* never load in dead */
    const fsMode = (data.fs === 'fs-lg' || data.fs === 'fs-xl') ? data.fs : '';   /* whitelist — becomes a body class */
    const toneMode = (data.tone === 'tone-bright' || data.tone === 'tone-max') ? data.tone : '';
    const fontMode = (data.font === 'font-sys' || data.font === 'font-mono') ? data.font : '';
    const sndOn = data.snd !== 0;
    const fxOn = data.fx !== 0;
    const chartsOn = data.chart === 1;   /* absent ⇒ off — the clean sky is the default */
    const shakeOn = data.shake !== 0;
    const salvageConfirm = data.sv !== 0;
    const notifOn = data.notif !== 0;
    const tipsOn = data.tips !== 0;
    const sfxVol = data.vol === undefined ? 1 : clamp(num(data.vol, 100), 0, 100) / 100;
    const glassTint = data.gt === undefined ? 0.72 : clamp(num(data.gt, 72) / 100, 0.40, 0.98);
    const _rmv = num(data.rm, -1);
    const motionMode = _rmv === 1 ? 1 : (_rmv === 0 ? 0 : -1);
    /* the old 0..7 clamp DESTROYED fold bits 8/16 on every reload — full mask */
    const cardExpand = clamp(num(data.cx), 0, 31) | 0;
    const notifications: SaveStateV2['notifications'] = [];
    for (const n of _capA(data.notifs, 60) as Array<Record<string, unknown>>) {
      if (n && n.tt != null && notifications.length < 60)
        notifications.push({ id: num(n.id) | 0, tt: String(n.tt).slice(0, 200), ms: String(n.ms == null ? '' : n.ms).slice(0, 400), t: clamp(num(n.t), 0, 4e12) || now, read: !!n.read });
    }
    const surveyedSet = new Set<string>();
    for (const s of _capA(data.surveyed, 60000)) surveyedSet.add(s as string);
    stats.surveys = surveyedSet.size;
    const galSeen = new Set<unknown>(); for (const s of _capA(data.gals, 20000)) galSeen.add(s);
    const surfSeen = new Set<unknown>(); for (const s of _capA(data.surf, 60000)) surfSeen.add(s);
    const xpFirsts = new Set<string>(); for (const s of _capA(data.xpf, 4000)) if (typeof s === 'string') xpFirsts.add(s.slice(0, 64));
    const sysSeen = new Set<number>(); for (const s of _capA(data.sysv, 60000)) { const n = +(s as number); if (Number.isFinite(n)) sysSeen.add(n); }
    const starKindsSeen = new Set<string>(); for (const s of _capA(data.starK, 200)) starKindsSeen.add(s as string);
    const ptypesSeen = new Set<string>(); for (const s of _capA(data.ptypes, 200)) ptypesSeen.add(s as string);
    const eventKeysSeen = new Set<string>(); for (const s of _capA(data.evts, 400)) eventKeysSeen.add(s as string);
    const evAnnounced = new Set<string>(); for (const s of _capA(data.evann, 120)) evAnnounced.add(s as string);
    const unlocked = new Set<string>(); for (const a of _capA(data.ach, registry.achLen + 50)) unlocked.add(a as string);

    /* codex — every genome through THE sanitizer; size survives UNWRAPPED
       (the v1.8.6 lesson). Entry shape mirrors _storeSpecies' snapshot
       surface; the grade rides ringGrade's region cap. */
    const codex = new Map<string, CodexEntry>();
    for (const e of _capA(data.codex, 1500) as Array<Record<string, unknown>>) {
      const _sg = e && e.g && _sanitizeSavedGenome(e.g);
      if (!_sg) continue;
      const g = _sg as unknown as Genome;
      const from = String(e.f || '').replace(/[<>&"']/g, '').slice(0, 48) || null;
      const where = _sanitizeView(e.w) || null;
      const id = 's' + (g as { seed: number }).seed;   /* codexId */
      if (codex.has(id)) continue;                     /* _storeSpecies: first sighting wins */
      const d = describeSpecies(g);
      const grade = ringGrade(g as never, d.grade as never, where) as { tier?: number } | null;
      let name = d.name;
      const cn = customNames.get('c' + id);
      if (cn) name = cn;
      /* realmModifiers/ecologyRole/realmBiome are computed by _storeSpecies
         too — called here so a future snapshot extension stays cheap */
      void realmModifiers(g); void ecologyRole(g); void realmBiome(g);
      const entry: CodexEntry = {
        id, name, kind: d.kind, tier: grade && typeof grade.tier === 'number' ? grade.tier : null,
        realm: classifyRealm(g), sapient: sapienceTier(g),
        from: from || 'Unknown world', hybrid: !!(g as { parents?: unknown }).parents,
        g: _sg as Record<string, unknown>,
      };
      codex.set(id, entry);
      /* onSpeciesStored's DERIVED stats — recomputed as the codex restores,
         not read from the save (found when veteran_rich pinned best=4,
         hybrids=1 against this importer's declaration zeros) */
      if (entry.hybrid) stats.hybrids = (stats.hybrids || 0) + 1;
      if (entry.tier != null && entry.tier > stats.best!) stats.best = entry.tier;
      /* ⚠ BUG-FOR-BUG (ROADMAP 9i, found BY this parity test 2026-07-31):
         _sanitizeSavedGenome clamps brood/fed/xp/hurt but NOT gen, and
         onSpeciesStored assigns entry.gen RAW after a coercing comparison —
         so a hostile save's gen:'2' (string) lands in stats.maxGen and
         PERSISTS into every future save (maxGen+1 anywhere would concat).
         The fixture pins the string; the port reproduces it until the fix
         ships upstream as a deliberate v1.9 change. */
      const _gen = (_sg as { gen?: number | string }).gen || 0;
      if ((_gen as number) > (stats.maxGen as unknown as number)!) stats.maxGen = _gen as number;
    }
    /* pre-v1.7 veteran: `seen` ABSENT (not empty) ⇒ everything already
       catalogued counts as viewed — the new-dot flood guard */
    if (!Array.isArray(data.seen)) for (const id of codex.keys()) seenSp.add(id);

    const voiceOn = data.vce != null ? !!data.vce : true;
    const combatSfxOn = data.cbx != null ? !!data.cbx : true;
    const tutSnapPending = (data.tsnap && typeof data.tsnap === 'object' && !data.tut) ? data.tsnap : null;
    const scoutId = (typeof data.scout === 'string' && codex.has(data.scout)) ? data.scout : null;
    const chDone: string[] = [];
    for (const s of _capA(data.chs, 500)) if (registry.charterStarters.includes(s as string)) chDone.push(s as string);
    const chWeek = num(data.chw, -1);
    const chProg: Record<string, number> = {};
    if (data.chp && typeof data.chp === 'object' && !Array.isArray(data.chp)) {
      for (const k in data.chp as Record<string, unknown>) { const v = +((data.chp as Record<string, unknown>)[k] as number); if (typeof k === 'string' && k.length < 24 && Number.isFinite(v) && v >= 0) chProg[k] = Math.min(v | 0, 999); }
    }
    const chacc: string[] = [];
    for (const s of _capA(data.chacc, 50)) if (typeof s === 'string' && !chDone.includes(s) && (registry.charterStarters.includes(s) || registry.charterPool.includes(s))) chacc.push(s);

    /* Atlas — rebuilt with COERCED fields only (renderLog's innerHTML sinks) */
    const _cs = (v: unknown, n: number): string => cleanName(v == null ? '' : v, n);
    const _cw = (w: unknown): Record<string, unknown> | null => {
      if (!w || typeof w !== 'object') return null;
      const src = w as Record<string, unknown>;
      const o: Record<string, unknown> = {};
      if (src.gal && typeof src.gal === 'object') {
        const g = src.gal as Record<string, unknown>;
        const gx = num(g.x), gy = num(g.y);
        if (Number.isFinite(gx) && Number.isFinite(gy)) {
          const gal: Record<string, unknown> = { x: gx, y: gy };
          for (const gk of ['size', 'sp', 'tilt', 'rot', 'seed']) { const gv = num(g[gk], NaN); if (Number.isFinite(gv)) gal[gk] = gv; }
          for (const gk of ['home', 'quasar', 'dwarf']) if (g[gk]) gal[gk] = true;
          o.gal = gal;
        }
      }
      for (const k of ['pseed', 'sseed', 'seed', 'orb', 'm', 'pi']) { const v2 = num(src[k], NaN); if (Number.isFinite(v2)) o[k] = v2; }
      if (src.star && typeof src.star === 'object') { const ss2 = num((src.star as Record<string, unknown>).seed, NaN); if (Number.isFinite(ss2)) o.star = { seed: ss2 }; }
      if (typeof src.type === 'string' && ['planet', 'star', 'galaxy'].includes(src.type)) o.type = src.type;
      return Object.keys(o).length ? o : null;
    };
    const logMap = new Map<string, Record<string, unknown>>();
    for (const it of _capA(data.log, 150) as Array<Record<string, unknown>>) {
      if (it && it.id != null) {
        const _id = _cs(it.id, 24);
        if (!_id) continue;   /* an all-stripped id must not mint an empty key */
        logMap.set(_id, {
          id: _id, title: _cs(it.title, 60) || 'Charted place', sub: _cs(it.sub, 120),
          /* CF-RR-001: STRICT base64 charset — no quotes, no attribute breakout */
          thumb: (typeof it.thumb === 'string' && it.thumb.length < 300000 &&
            /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(it.thumb)) ? it.thumb : null,
          sq: !!it.sq, badge: _cs(it.badge, 18), where: _cw(it.where), fav: !!it.fav, t: clamp(num(it.t), 0, 4102444800000),
        });
      }
    }
    const homeId = (() => { const _h = _cs(data.home, 24); return (_h && logMap.has(_h)) ? _h : null; })();
    const landed = new Set<number>(); for (const s of _capA(data.land, 60000)) { const n = +(s as number); if (Number.isFinite(n)) landed.add(n); }
    const contacted = new Set<number>(); for (const s of _capA(data.cont, 4000)) { const n = +(s as number); if (Number.isFinite(n)) contacted.add(n); }
    const waveOffs: SaveStateV2['waveOffs'] = [];
    if (Array.isArray(data.wvo)) for (const e2 of data.wvo.slice(-400) as unknown[]) {
      if (!Array.isArray(e2)) continue;
      const s2 = +(e2[0] as number), n2 = Math.max(0, Math.min(5, (+(e2[1] as number)) | 0));
      if (Number.isFinite(s2) && n2 > 0) waveOffs.push([s2, n2]);
    }
    const primeFill: SaveStateV2['primeFill'] = {};
    if (data.prime && typeof data.prime === 'object' && !Array.isArray(data.prime)) {
      const _sanS = (v: unknown, n2: number): string => String(v == null ? '' : v).replace(/[<>&"']/g, '').slice(0, n2);
      for (const k in data.prime as Record<string, unknown>) {
        const f = (data.prime as Record<string, Record<string, unknown>>)[k];
        if (!registry.sigIds.includes(k) || !f || typeof f !== 'object') continue;
        primeFill[k] = {
          title: _sanS(f.title, 48) || 'a lost record', sub: _sanS(f.sub, 32),
          tier: clamp(num(f.tier), 0, TIER_MAX) | 0,
          hex: /^#[0-9a-fA-F]{3,8}$/.test(String(f.hex || '')) ? String(f.hex) : '#9fb6d6',
          where: _sanitizeView(f.where) || null,
        };
      }
    }
    /* applyNameplate's "unlocks never demote" raise, run at load exactly as
       renderRank does: the RANK the restored record already earns lifts
       bestRank above the saved br (found when pre_v17_veteran pinned
       bestRank=1 from br-less data — score 52 ⇒ Scout). Formula verbatim
       from rankInfo/rankIdx (main.js 13803/13824). */
    {
      const RANKS_FLOORS = [0, 30, 90, 220, 460, 900, 1700, 3000, 5200, 8200];
      const score = stats.surveys! * 4 + codex.size * 2 + stats.best! * 12 + unlocked.size * 6 + stats.hybrids! + galSeen.size * 3;
      const last = RANKS_FLOORS[RANKS_FLOORS.length - 1]!;
      const floor = score >= last ? last + Math.floor((score - last) / 3000) * 3000
        : RANKS_FLOORS.reduce((f, r) => (score >= r ? r : f), 0);
      let idx = 0; for (let k = 0; k < RANKS_FLOORS.length; k++) if (floor >= RANKS_FLOORS[k]!) idx = k;
      if (idx > (stats.bestRank || 0)) stats.bestRank = idx;
    }
    const frontierUnlocked = !!data.frontier;
    const frontierEnding = (data.ending as string) || null;
    const seenGuide = !!data.guide;
    const tutDone = data.tut === undefined ? true : !!data.tut;   /* absent ⇒ done — never force training on a held run */
    const rnSeen = typeof data.rn === 'string' ? data.rn.slice(0, 12) : '0';

    return {
      ok: true,
      state: {
        EPOCH_BASE, essence, explorerName, lastAnomKey, stats, pstats, hp, HP_MAX,
        customNames: [...customNames.entries()], conquered,
        cargo: [...cargo.entries()], cgx: [...cgx.entries()],
        items: [...items.entries()], equip, equipAff, pinnedRecipe, cargoTab,
        seenSp: [...seenSp.values()], journal,
        mined: [...mined.entries()], mineX: [...mineX.entries()], skimX: [...skimX.entries()],
        bioX, techOwned, claimedSets, ascCh, ascProg, nameHue, savedView,
        fsMode, toneMode, fontMode, sndOn, fxOn, chartsOn, shakeOn, salvageConfirm,
        notifOn, tipsOn, sfxVol, glassTint, motionMode, cardExpand, notifications,
        surveyedSet: [...surveyedSet.values()], galSeen: [...galSeen.values()],
        surfSeen: [...surfSeen.values()], xpFirsts: [...xpFirsts.values()],
        sysSeen: [...sysSeen.values()], starKindsSeen: [...starKindsSeen.values()],
        ptypesSeen: [...ptypesSeen.values()], eventKeysSeen: [...eventKeysSeen.values()],
        evAnnounced: [...evAnnounced.values()], unlocked: [...unlocked.values()],
        landed: [...landed.values()], contacted: [...contacted.values()],
        waveOffs, primeFill, frontierUnlocked, frontierEnding, seenGuide, tutDone,
        rnSeen, tutSnapPending, scoutId, chWeek, chProg, chacc, chDone, homeId,
        voiceOn, combatSfxOn, logMap: [...logMap.entries()],
        codex: [...codex.entries()],
      },
    };
  } catch {
    return { ok: false };
  }
}
