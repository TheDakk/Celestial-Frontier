/* SAVE FIXTURES probe — snapshots the game's LOAD-OBSERVABLE state after a
   boot whose localStorage was seeded with a curated save (savefixtures.js
   seeds it via bootProbe's beforeBoot, so the game's own boot-time
   loadSaveWithRecovery ran — the exact player-device flow).

   THE SNAPSHOT IS THE IMPORTER'S CONTRACT: port Phase 2's importSaveV2 must
   reproduce every field here from the same input save. Fields are read
   through __PROBE_HOOK__ with per-field try/catch — a missing hook name
   reports as "«unreadable:...»" instead of killing the snapshot silently.

   ⚠ DETERMINISM RULE FOR FIXTURE AUTHORS: loadSave clamps several stamps
   against Date.now(). Every curated input must keep its timestamps in the
   PAST and valid, or the captured value would encode capture time. The
   driver double-boots fixture[0] and compares as a self-check. */
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  if (!H) { window.__SAVEFX__ = { error: 'no __PROBE_HOOK__' }; return; }

  /* canonical form — same rules as codefixtures-probe.js, plus Map/Set */
  function san(v, d, seen) {
    d = d || 0; seen = seen || new WeakSet();
    if (d > 8) return '«deep»';
    if (v === undefined || v === null) return null;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : String(v);
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'function') return '«fn»';
    if (t === 'object') {
      if (typeof HTMLElement !== 'undefined' && v instanceof HTMLElement) return '«el»';
      if (v instanceof Map) return Array.from(v.entries()).map(function (e) { return san(e, d + 1, seen); });
      if (v instanceof Set) return Array.from(v.values()).map(function (e) { return san(e, d + 1, seen); });
      if (Array.isArray(v)) return v.map(function (e) { return san(e, d + 1, seen); });
      if (seen.has(v)) return '«cycle»';
      seen.add(v);
      const o = {}; const ks = Object.keys(v).sort();
      for (let i = 0; i < ks.length; i++) o[ks[i]] = san(v[ks[i]], d + 1, seen);
      return o;
    }
    return String(v);
  }
  const canon = function (v) { try { return JSON.stringify(san(v, 0, new WeakSet())); } catch (e) { return 'ERR:' + (e && e.message); } };

  /* the load-observable surface, one canonical string per field */
  const FIELDS = [
    'EPOCH_BASE', 'COSMIC_EPOCH', 'essence', 'explorerName', 'lastAnomKey',
    'stats', 'pstats', 'hp', 'HP_MAX',
    'customNames', 'conquered', 'cargo', 'cgx', 'items', 'equip', 'equipAff',
    'pinnedRecipe', 'cargoTab', 'seenSp', 'journal', 'mined', 'mineX', 'skimX',
    'bioX', 'techOwned', 'claimedSets', 'ascCh', 'ascProg', 'nameHue',
    '_savedView', 'fsMode', 'toneMode', 'fontMode', 'sndOn', 'fxOn', 'chartsOn',
    'shakeOn', 'salvageConfirm', 'notifOn', 'tipsOn', 'sfxVol', 'glassTint',
    'motionMode', 'cardExpand', 'notifications', 'surveyedSet', 'galSeen',
    'surfSeen', 'xpFirsts', 'sysSeen', 'starKindsSeen', 'ptypesSeen',
    'eventKeysSeen', '_evAnnounced', 'unlocked', 'landed', 'contacted',
    '_waveOffs', 'primeFill', 'frontierUnlocked', 'frontierEnding', 'seenGuide',
    'tutDone', '_rnSeen', '_tutSnapPending', 'scoutId', 'chWeek', 'chProg',
    'chacc', 'chDone', 'homeId', 'voiceOn', 'combatSfxOn', 'logMap',
  ];
  const out = {};
  for (let i = 0; i < FIELDS.length; i++) {
    const f = FIELDS[i];
    try { out[f] = canon(H[f]); }
    catch (e) { out[f] = '«unreadable:' + (e && e.message) + '»'; }
  }
  /* notifications minted DURING load (the recovery path's loud "restored
     from backup" toast) carry Date.now() — normalize any stamp after the
     fixture anchor so the TEXT stays pinned and the clock does not leak.
     Found by the --check gate itself: recovery_from_backup.notifications
     mismatched on every re-run until this. */
  try {
    const anchor = window.__SAVEFX_ANCHOR__ || Infinity;
    out.notifications = canon((H.notifications || []).map(function (n) {
      if (n && typeof n.t === 'number' && n.t > anchor) { const c = {}; for (const k in n) c[k] = n[k]; c.t = '«minted-at-boot»'; return c; }
      return n;
    }));
  } catch (e) { out.notifications = '«unreadable:' + (e && e.message) + '»'; }
  /* codex: entries carry live descriptor text + lazy art — snapshot the
     STABLE surface: id, name, kind, grade tier, and the genome itself
     (the field the sizedrift law protects) */
  try {
    const cx = [];
    H.codex.forEach(function (e, id) {
      cx.push([id, {
        name: e && e.name, kind: e && e.kind,
        tier: e && e.grade ? e.grade.tier : null,
        realm: e && e.realm, sapient: e && e.sapient,
        from: e && e.from, hybrid: !!(e && e.hybrid),
        g: e && e.genome,
      }]);
    });
    out.codex = canon(cx);
  } catch (e) { out.codex = '«unreadable:' + (e && e.message) + '»'; }

  window.__SAVEFX__ = { fields: out };
}());
