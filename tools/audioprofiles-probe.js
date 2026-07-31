/* AUDIO PROFILE probe — runs in the game's realm via __PROBE_HOOK__.
   Port Phase 0 / Gate A: "capture current audio-profile outputs for
   representative genomes". Feeds §15 and Gate G.

   TWO JOBS, deliberately:

   1. THE FIXTURE — voiceOf() for a curated genome set, hashed the same way as
      golden-seeds.json. A port must reproduce every profile.

   2. THE MEASUREMENT — re-derive the vocabulary statistics at scale. The claim
      that "the listening test is now unblocked" rests on numbers measured
      against v1.8.6 by an external reviewer (533 distinct voices -> 199,707 of
      200,000; duplicate-in-50 91.3% -> 0.6%). Phase 0's job is not to transcribe
      those; it is to RE-MEASURE them against v1.8.9. It also produces the
      evidence for two open §23 decisions that are Nick's:
        · the `legacy` voice family — _VOICE_KEYS is Object.keys(_VOICE) and
          _VOICE INCLUDES `legacy`, so procedural creatures can be assigned it
          as a first-class family. This measures how often.
        · the bat/high-frequency ceiling — voiceOf clamps f0 to [60, 6000].
          This measures how many creatures land pinned at either bound, which is
          the thing that makes a voice stop varying.

   voiceOf returns {kind, f0, rich, nz, vib, vibD, dur, sweep}. Two creatures
   "share a voice" here when the ROUNDED profile is identical — rounding at the
   same 1e-9 the rest of the fixtures use, so the notion of "equal" is shared. */
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  if (!H) { window.__AUDIO__ = { error: 'no __PROBE_HOOK__' }; return; }

  const CFG = window.__AUDIO_CFG__ || { fixture: 200, population: 200000, collection: 50, trials: 400 };
  const { voiceOf, makeGenome, hashInt } = H;

  function san(v, d, seen) {
    d = d || 0; seen = seen || new WeakSet();
    if (d > 8) return '«deep»';
    if (v === undefined || v === null) return null;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : String(v);
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'function') return '«fn»';
    if (t === 'object') {
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
  function fnv(s, b) { let h = b >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  const hx = function (n) { return ('0000000' + n.toString(16)).slice(-8); };
  const hash = function (s) { return hx(fnv(s, 0x811c9dc5)) + hx(fnv(s, 0x9e3779b9)); };

  const F0_MIN = 60, F0_MAX = 6000;   /* the clamps inside voiceOf */

  /* ---------- 1. the fixture ---------- */
  const fixture = { perCase: [], rollup: '' };
  const samples = [];
  let roll = '';
  for (let i = 0; i < CFG.fixture; i++) {
    const seed = hashInt(i, 0x5011D, 0x0A17) >>> 0;
    const kind = ['fauna', 'flora', 'fungi', 'microbe'][i % 4];
    const g = makeGenome(seed, kind, (i % 10) / 10);
    let v; try { v = voiceOf(g); } catch (e) { v = 'THROW:' + (e && e.message); }
    const c = canon(v);
    const h = hash(c);
    fixture.perCase.push({ seed: seed, kingdom: kind, h: h });
    roll = hash(roll + h);
    if (i < 6) samples.push({ seed: seed, kingdom: kind, profile: c });
  }
  fixture.rollup = roll;

  /* ---------- 2. the vocabulary measurement ---------- */
  const N = CFG.population;
  const voices = new Set();
  const kindCount = {};
  /* the FAMILY (mammal/bat/…/legacy) is chosen from the seed, not returned by
     voiceOf — which reports `kind`, the SOUND ARCHETYPE (chirp/roar/…). The two
     are different vocabularies and conflating them hides the `legacy` question
     entirely, since _VOICE.legacy.kind is one of the ordinary archetypes.
     voiceKeys is read from source by the driver; never hand-typed here. */
  const VK = CFG.voiceKeys || null;
  const famCount = {};
  let pinnedHigh = 0, pinnedLow = 0;
  let f0min = Infinity, f0max = -Infinity, f0sum = 0;
  const perCreature = new Array(N);   /* voice hash, reused for the collection test */

  for (let i = 0; i < N; i++) {
    const seed = hashInt(i, 0x5A0D10, 0x77) >>> 0;
    const g = makeGenome(seed, 'fauna', (i % 100) / 100);
    let v; try { v = voiceOf(g); } catch (e) { v = null; }
    if (!v) continue;
    const h = hash(canon(v));
    perCreature[i] = h;
    voices.add(h);
    kindCount[v.kind] = (kindCount[v.kind] || 0) + 1;
    if (VK) {
      /* mirrors voiceOf's own selection for a wholly procedural creature */
      const fam = VK[((hashInt((g.seed >>> 0), 0x5F0C, 0x2D) >>> 4) % VK.length)];
      famCount[fam] = (famCount[fam] || 0) + 1;
    }
    const f = +v.f0;
    if (f >= F0_MAX - 1e-6) pinnedHigh++;
    if (f <= F0_MIN + 1e-6) pinnedLow++;
    if (f < f0min) f0min = f;
    if (f > f0max) f0max = f;
    f0sum += f;
  }

  /* how often does a 50-creature collection contain a duplicate voice?
     Sample `trials` disjoint windows rather than all of them — the statistic is a
     rate, and windows are independent enough at this population size. */
  let dupCollections = 0;
  const C = CFG.collection, T = Math.min(CFG.trials, Math.floor(N / C));
  for (let t = 0; t < T; t++) {
    const s = new Set();
    let dup = false;
    for (let k = 0; k < C; k++) {
      const h = perCreature[t * C + k];
      if (h === undefined) continue;
      if (s.has(h)) { dup = true; break; }
      s.add(h);
    }
    if (dup) dupCollections++;
  }

  /* how many creatures share their voice with at least one other? */
  const counts = new Map();
  for (let i = 0; i < N; i++) { const h = perCreature[i]; if (h !== undefined) counts.set(h, (counts.get(h) || 0) + 1); }
  let shared = 0;
  for (const [, c] of counts) if (c > 1) shared += c;

  const kinds = Object.keys(kindCount).sort().map(function (k) {
    return { kind: k, count: kindCount[k], pct: +((kindCount[k] / N) * 100).toFixed(3) };
  });
  const families = Object.keys(famCount).sort().map(function (k) {
    return { family: k, count: famCount[k], pct: +((famCount[k] / N) * 100).toFixed(3) };
  });

  window.__AUDIO__ = {
    fixture: fixture,
    samples: samples,
    measurement: {
      population: N,
      distinctVoices: voices.size,
      distinctPct: +((voices.size / N) * 100).toFixed(3),
      creaturesSharingAVoice: shared,
      creaturesSharingAVoicePct: +((shared / N) * 100).toFixed(3),
      collectionSize: C,
      collectionsTested: T,
      collectionsWithDuplicate: dupCollections,
      collectionsWithDuplicatePct: +((dupCollections / T) * 100).toFixed(3),
      f0: {
        clampLow: F0_MIN, clampHigh: F0_MAX,
        observedMin: +f0min.toFixed(3), observedMax: +f0max.toFixed(3),
        mean: +(f0sum / N).toFixed(3),
        pinnedAtCeiling: pinnedHigh, pinnedAtCeilingPct: +((pinnedHigh / N) * 100).toFixed(3),
        pinnedAtFloor: pinnedLow, pinnedAtFloorPct: +((pinnedLow / N) * 100).toFixed(3),
      },
      kinds: kinds,
      kindCount: kinds.length,
      families: families,
      familyCount: families.length,
      familySource: VK ? 'read from main.js _VOICE (' + VK.length + ' keys)' : 'unavailable — key list could not be read; family shares NOT computed',
    },
  };
}());
