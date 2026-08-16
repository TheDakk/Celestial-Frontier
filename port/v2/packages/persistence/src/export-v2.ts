/* exportSaveV2 — the v1.8.9 SAVE-WRITE path (main.js doSave, ~14074–14140)
   as a pure function over SaveStateV2. Phase 2 deliverable: "save
   sanitization and backup behavior" — the write half.

   CLOCK LAYERING: this pure exporter serializes the EPOCH_BASE compatibility
   field as `epoch`; it cannot know whether a caller refreshed that carrier.
   The ordinary app save path must assign EpochClock.current() immediately
   before export. EpochClock.base() is only the immutable construction origin.

   THE INVARIANT THAT PINS IT (test): import → export → import is a FIXED
   POINT from the second round on. Round one legitimately moves data the
   way doSave does on a live game:
   - regenerable Atlas thumbs are STRIPPED (CF-CR-005 — image base64 was
     the whole save-bloat risk);
   - `land` unions in conquered + mined keys (cap eviction must never
     re-hide a census you demonstrably hold);
   - `seen` filters to ids the codex actually holds;
   - bounded slices (log 120 by t desc · notifs 50 · cont/land 4000 ·
     evts 200 · evann 60 · xpf 4000).
   After one pass those transforms are idempotent — hence the fixed-point
   form f(f(x)) === f(f(f(x))), plus direct survival assertions for the
   fields that must not move at all. */
import type { SaveStateV2 } from './import-v2.js';

export function exportSaveV2(s: SaveStateV2, now: number): string {
  /* CF-CR-005: strip every thumb atlasThumb can rebuild */
  const _thumbRegens = (e: Record<string, unknown>): boolean => {
    const k = e.id ? String(e.id)[0] : '';
    if (k === 'p' || k === 's' || k === 'm' || k === 'c' || k === 'b') return true;
    if (k === 'g' || k === 'r') return !!(e.where && (e.where as { gal?: { seed?: unknown } }).gal && (e.where as { gal: { seed?: unknown } }).gal.seed != null);
    return false;
  };
  const log = s.logMap.map(([, e]) => e)
    .sort((a, b) => (b.t as number) - (a.t as number)).slice(0, 120)
    .map((e) => (_thumbRegens(e) ? { ...e, thumb: null } : e));
  const landUnion = (() => {
    const _l = new Set<unknown>(s.landed);
    for (const [k] of s.conquered) _l.add(k);
    for (const [k] of s.mined) _l.add(k);
    return [..._l].slice(-4000);
  })();
  const codexIds = new Set(s.codex.map(([id]) => id));
  const data: Record<string, unknown> = {
    v: 4, epoch: s.EPOCH_BASE,   /* ordinary app caller refreshes this from current() */
    view: s.savedView,
    hp: s.hp, pstats: s.pstats, fs: s.fsMode, tone: s.toneMode, font: s.fontMode,
    snd: s.sndOn ? 1 : 0, fx: s.fxOn ? 1 : 0, chart: s.chartsOn ? 1 : 0, shake: s.shakeOn ? 1 : 0,
    sv: s.salvageConfirm ? 1 : 0, notif: s.notifOn ? 1 : 0, tips: s.tipsOn ? 1 : 0,
    vol: Math.round(s.sfxVol * 100), gt: Math.round(s.glassTint * 100), rm: s.motionMode, cx: s.cardExpand,
    vce: s.voiceOn ? 1 : 0, cbx: s.combatSfxOn ? 1 : 0,
    land: landUnion,
    scout: s.scoutId, landings: s.stats.landings || 0,
    wvo: s.waveOffs.slice(-400),
    cont: s.contacted.slice(-4000),
    chs: [...s.chDone], chw: s.chWeek, chp: s.chProg, chacc: [...s.chacc], charters: s.stats.charters || 0,
    notifs: s.notifications.slice(0, 50),
    me: s.explorerName,
    essence: s.essence,
    conq: s.conquered,
    breeds: s.stats.breeds || 0, breedwins: s.stats.breedwins || 0,
    feeds: s.stats.feeds || 0, feedfails: s.stats.feedfails || 0,
    harvests: s.stats.harvests || 0, essenceEarned: s.stats.essenceEarned || 0,
    guardians: s.stats.guardians || 0, paragons: s.stats.paragons || 0,
    nh: s.nameHue, br: s.stats.bestRank || 0, setsc: [...s.claimedSets],
    at: now,   /* wall-clock save stamp — anchors offline-accrual clamps on load */
    cargo: s.cargo, cgx: s.cgx, jrn: s.journal.slice(-24),
    pin: s.pinnedRecipe || undefined, ctb: s.cargoTab,
    seen: s.seenSp.filter((id) => codexIds.has(id)),
    minedw: s.mined, mx: s.mineX, skx: s.skimX, bx: s.bioX,
    tech: [...s.techOwned], mines: s.stats.mines || 0,
    items: s.items, eq: s.equip, ea: s.equipAff,
    crafts: s.stats.crafts || 0, minedout: s.stats.minedout || 0,
    xpf: s.xpFirsts.slice(-4000),
    skims: s.stats.skims || 0, cosmics: s.stats.cosmics || 0,
    asc: s.ascCh, ascp: s.ascProg,
    names: s.customNames,
    shares: s.stats.shares, jumps: s.stats.jumps,
    anomalies: s.stats.anomalies, anomKey: s.lastAnomKey,
    events: s.stats.events, duels: s.stats.duels, duelwins: s.stats.duelwins,
    surveyed: s.surveyedSet,
    gals: s.galSeen, surf: s.surfSeen, sysv: s.sysSeen,
    starK: s.starKindsSeen, ptypes: s.ptypesSeen,
    evts: s.eventKeysSeen.slice(-200),
    evann: s.evAnnounced.slice(-60),
    ach: s.unlocked,
    log, home: s.homeId,
    prime: s.primeFill, frontier: s.frontierUnlocked ? 1 : 0, ending: s.frontierEnding,
    guide: s.seenGuide ? 1 : 0, tut: s.tutDone ? 1 : 0, rn: s.rnSeen,
    codex: s.codex.map(([, e]) => ({ g: e.g, f: e.from, w: e.where || null })),
    /* CF1715-01: a reload mid-retrain must not lose the pre-training
       expedition — the loaded pending snapshot rides back out verbatim */
    tsnap: s.tutSnapPending != null ? s.tutSnapPending : undefined,
  };
  return JSON.stringify(data);
}
