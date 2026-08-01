/* CONTENT REGISTRY probe — extracts the LOAD-PATH VALIDATION SURFACE from the
   live game realm: the id sets, maps and lengths loadSave uses to accept or
   reject save fields. NOT the full content tables (several carry live
   functions and app state); exactly what importSaveV2 needs, nothing more.
   Each entry names the loadSave site that consumes it. */
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  if (!H) { window.__CONTENTREG__ = { error: 'no __PROBE_HOOK__' }; return; }
  try {
    const items = {};
    /* data.items / data.eq / data.pin: ITEM_BY.has(id), .slot must match */
    H.ITEMS.forEach(function (it) { items[it.id] = { slot: it.slot || null }; });
    const affixHi = {};
    /* data.ea: clamp(v, 0, def.hi) against the affix's OWN hi */
    H.AFFIX_DEFS.forEach(function (d) { affixHi[d.k] = d.hi; });
    window.__CONTENTREG__ = {
      materials: Object.keys(H.MATERIALS).sort(),            /* data.cargo/cgx keys */
      items: items,
      affixHi: affixHi,
      eqSlots: H.EQ_SLOTS.map(function (s) { return s.id; }),/* data.eq/ea slot ids */
      techs: H.TECHS.map(function (t) { return t.id; }),     /* data.tech */
      binderSets: H.BINDER_SETS.map(function (b) { return b.id; }),  /* data.setsc */
      charterStarters: H.CHARTER_STARTERS.map(function (c) { return c.id; }), /* data.chs/chacc */
      charterPool: H.CHARTER_POOL.map(function (c) { return c.id; }),         /* data.chacc */
      sigIds: H.SIG_IDS.slice(),                             /* data.prime keys */
      statKeys: H.STAT_KEYS.slice(),                         /* data.pstats keys */
      achLen: H.ACH.length,                                  /* data.ach cap = ACH.length+50 */
      rankHuesLen: H.RANK_HUES.length,                       /* data.nh / data.br clamp */
      ascChaptersLen: H.ASC_CHAPTERS.length,                 /* data.asc clamp */
      tierMax: H.GRADE_TIERS.length - 1,                     /* conq tier / prime tier clamp (TIER_MAX=14) */
      gameVersion: H.GAME_VERSION,
    };
  } catch (e) { window.__CONTENTREG__ = { error: String((e && e.stack) || e) }; }
}());
