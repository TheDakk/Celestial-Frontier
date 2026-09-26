/** D15 Stage 3: the living bed and the sparse score. Outcomes: every bed (all 43 biomes; night included), weather layer and music piece the
 * runtime can play passes the measured gate EXACTLY as the runtime renders it (the stored level gains are re-measured here — regenerate with
 * CF_REGENERATE_LEVEL_GAINS=1); the 43-biome derivation covers every biome; loops are seamless; and the soundscape owner, driven through a
 * fake voice port and virtual timers, keeps the sparse rule (a calm piece, then 2–5 minutes of only ambience, deterministic from the
 * presentation seed), stops the bed the moment its reason ends, falls silent on a hidden tab and RESTARTS on return, halves the layers
 * on a phone, and never holds more than 24 MiB decoded. Every check has a control. */
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BIOME_PROFILE_KEYS_V1 } from '@cf/domain-biome-profile';
import type { AudioVoiceRequest } from '@cf/audio';
import { admitLoudnessV1 } from '../apps/game/src/soundkit/loudness.js';
import { applyLevelV1, levelGainV1 } from '../apps/game/src/soundkit/leveler.js';
import { LEVEL_GAINS_V1 } from '../apps/game/src/soundkit/level-gains.generated.js';
import {
  AMBIENCE_FAMILIES_V1, AMBIENCE_RATE, WEATHER_LAYERS_V1, ambiencePlanV1, bedJobV1, bedLevelKeyV1, rawBedJobV1, rawWeatherJobV1, runJobV1, weatherLevelKeyV1,
} from '../apps/game/src/soundkit/ambience.js';
import { MUSIC_PIECES_V1, MUSIC_RATE, MUSIC_TOTAL_SECONDS_V1, musicJobV1, musicLevelKeyV1, rawMusicJobV1 } from '../apps/game/src/soundkit/music.js';
import { CALM_GAP_MS, DECODED_CEILING_BYTES, createSoundscapeV1 } from '../apps/game/src/soundkit/soundscape.js';

const TABLE = new URL('../apps/game/src/soundkit/level-gains.generated.ts', import.meta.url);
const db = (x: Float32Array, dB: number) => { const g = Math.pow(10, dB / 20); return Float32Array.from(x, (v) => v * g); };

describe('level gains (generated) and the gate on the exact runtime output', () => {
  it('every bed, weather layer and music piece: the stored gain equals the meter\'s, and the runtime output passes the gate (beds also at night)', () => {
    const gains: Record<string, number> = {}, failures: string[] = [];
    for (const biome of BIOME_PROFILE_KEYS_V1) { const plan = ambiencePlanV1(biome), raw = runJobV1(rawBedJobV1(plan)); if (!raw) continue;
      const key = bedLevelKeyV1(plan), g = levelGainV1(raw, AMBIENCE_RATE, 'ambience', plan.tint.gainDb); gains[key] = g;
      const out = applyLevelV1(raw, AMBIENCE_RATE, g);
      for (const [label, x] of [['day', out], ['night', db(out, ambiencePlanV1(biome, 'night').timeOfDayDb)]] as const) { const a = admitLoudnessV1(x, AMBIENCE_RATE, 'ambience'); if (!a.ok) failures.push(`${key} ${label}: ${a.reason}`); } }
    for (const w of WEATHER_LAYERS_V1) { const raw = runJobV1(rawWeatherJobV1(w, 0)), key = weatherLevelKeyV1(w), g = levelGainV1(raw, AMBIENCE_RATE, 'ambience'); gains[key] = g;
      const a = admitLoudnessV1(applyLevelV1(raw, AMBIENCE_RATE, g), AMBIENCE_RATE, 'ambience'); if (!a.ok) failures.push(`${key}: ${a.reason}`); }
    for (const p of MUSIC_PIECES_V1) { const raw = runJobV1(rawMusicJobV1(p)), key = musicLevelKeyV1(p), g = levelGainV1(raw, MUSIC_RATE, 'music'); gains[key] = g;
      const a = admitLoudnessV1(applyLevelV1(raw, MUSIC_RATE, g), MUSIC_RATE, 'music'); if (!a.ok) failures.push(`${key}: ${a.reason}`); }
    const text = readFileSync(TABLE, 'utf8').replace(/Object\.freeze\(\{[\s\S]*\}\);\n$/, 'Object.freeze({\n' + Object.keys(gains).sort().map((k) => `  '${k}': ${gains[k]},\n`).join('') + '});\n');
    if (process.env.CF_REGENERATE_LEVEL_GAINS === '1') writeFileSync(TABLE, text);
    expect(failures).toEqual([]);
    expect(readFileSync(TABLE, 'utf8')).toBe(text);
    expect(Object.keys(gains)).toHaveLength(Object.keys(LEVEL_GAINS_V1).length);
  }, 900_000);
  it('the runtime jobs use the stored gain: a bed and a piece equal applyLevel(raw, stored); control: a wrong gain fails the gate', () => {
    const plan = ambiencePlanV1('jungle'), raw = runJobV1(rawBedJobV1(plan))!, bed = runJobV1(bedJobV1(plan))!;
    expect(Buffer.from(bed.left.buffer).equals(Buffer.from(applyLevelV1(raw, AMBIENCE_RATE, LEVEL_GAINS_V1[bedLevelKeyV1(plan)]!).buffer))).toBe(true);
    const piece = MUSIC_PIECES_V1.find((p) => p.id === 'sting-victory')!, rawM = runJobV1(rawMusicJobV1(piece));
    expect(Buffer.from(runJobV1(musicJobV1(piece)).buffer).equals(Buffer.from(applyLevelV1(rawM, MUSIC_RATE, LEVEL_GAINS_V1[musicLevelKeyV1(piece)]!).buffer))).toBe(true);
    expect(admitLoudnessV1(applyLevelV1(raw, AMBIENCE_RATE, LEVEL_GAINS_V1[bedLevelKeyV1(plan)]! + 6), AMBIENCE_RATE, 'ambience').ok).toBe(false);
  }, 300_000);
});

describe('the 43-biome derivation and loops', () => {
  it('every biome maps to a family; airless is silence; underwater has no weather; all ten families and four weather layers are used; ~6.5 min of music', () => {
    const fams = new Set<string>(), weathers = new Set<string>();
    for (const b of BIOME_PROFILE_KEYS_V1) { const p = ambiencePlanV1(b); fams.add(p.family); if (p.weather) weathers.add(p.weather); if (p.family === 'underwater') expect(p.weather, b).toBeNull(); }
    expect(ambiencePlanV1('cratered').family).toBe('silence');
    for (const f of AMBIENCE_FAMILIES_V1) expect(fams.has(f), f).toBe(true);
    for (const w of WEATHER_LAYERS_V1) expect(weathers.has(w), w).toBe(true);
    expect(BIOME_PROFILE_KEYS_V1).toHaveLength(43);
    expect(MUSIC_TOTAL_SECONDS_V1).toBeGreaterThanOrEqual(6 * 60); expect(MUSIC_TOTAL_SECONDS_V1).toBeLessThanOrEqual(7 * 60);
    expect(ambiencePlanV1('temperate', 'night').timeOfDayDb).toBeLessThan(0);
  });
  it('a bed loops seamlessly (the jump from its last sample to its first is no bigger than an ordinary step); control: a hard cut is', () => {
    const bed = runJobV1(bedJobV1(ambiencePlanV1('coral')))!, x = bed.left, n = x.length;
    let mean = 0; for (let i = 1; i < n; i++) mean += Math.abs(x[i]! - x[i - 1]!); mean /= n - 1;
    expect(Math.abs(x[0]! - x[n - 1]!)).toBeLessThan(mean * 6);
    // control: cutting the same texture anywhere else (no crossfade) jumps far more than an ordinary step, on average over 40 cuts
    let jump = 0; for (let k = 1; k <= 40; k++) jump += Math.abs(x[0]! - x[Math.floor((n * k) / 41)]!); jump /= 40;
    expect(jump).toBeGreaterThan(mean * 6);
  }, 120_000);
});

// ---- the owner, through a fake port and virtual timers ----
function harness(options: { phone?: boolean; seed?: number } = {}) {
  let now = 0; const tasks: { at: number; fn: () => void; id: number }[] = []; let nextId = 0;
  const schedule = (fn: () => void, ms: number) => { const t = { at: now + ms, fn, id: nextId++ }; tasks.push(t); return () => { const i = tasks.indexOf(t); if (i >= 0) tasks.splice(i, 1); }; };
  const advance = (ms: number) => { const end = now + ms; for (;;) { tasks.sort((a, b) => a.at - b.at || a.id - b.id); const t = tasks[0]; if (!t || t.at > end) break; tasks.shift(); now = Math.max(now, t.at); t.fn(); } now = end; };
  const started: { id: string; key: string; category: string; loop: boolean; bounded: boolean }[] = [], stopped: string[] = []; let hiddenPort = false, n = 0;
  const ctx = { currentTime: 0, createBuffer: (c: number, len: number) => ({ copyToChannel() {}, c, len }), createGain: () => ({ gain: { setValueAtTime() {} }, connect() {}, disconnect() {} }),
    createBufferSource: () => ({ buffer: null, loop: false, connect() {}, start() {}, stop() {}, disconnect() {}, onended: null }) };
  const port = { playVoice: (r: AudioVoiceRequest) => { if (hiddenPort) return { kind: 'rejected' as const, reason: 'not-running' as const };
      const g = r.create(ctx as never, { voiceId: 'x' } as never); const id = `v${n++}`; started.push({ id, key: r.key, category: r.category, loop: (g.source as { loop?: boolean }).loop === true, bounded: r.maxDurationMs !== undefined }); return { kind: 'started' as const, voiceId: id }; },
    stopVoice: (id: string) => { stopped.push(id); return true; } };
  const s = createSoundscapeV1({ port, schedule, nowMs: () => now, presentationSeed: options.seed ?? 42, ...(options.phone ? { phone: true } : {}) });
  const live = () => started.filter((v) => !stopped.includes(v.id));
  return { s, advance, started, stopped, live, setPortHidden: (h: boolean) => { hiddenPort = h; }, now: () => now };
}

describe('the soundscape owner', () => {
  it('a world\'s bed plays as a loop with its weather layer; a phone gets the bed only; airless is silent; the bed stops the moment its reason ends', () => {
    const h = harness(); h.s.setAmbience({ biome: 'stormsea' }); h.advance(10);
    expect(h.live().map((v) => v.key).sort()).toEqual(['soundscape:ambience:bed:coast', 'soundscape:ambience:weather:storm']);
    expect(h.live().every((v) => v.loop && !v.bounded && v.category === 'ambience')).toBe(true);
    h.s.setAmbience(null); expect(h.live()).toEqual([]);
    const p = harness({ phone: true }); p.s.setAmbience({ biome: 'stormsea' }); p.advance(10); expect(p.live().map((v) => v.key)).toEqual(['soundscape:ambience:bed:coast']);
    const a = harness(); a.s.setAmbience({ biome: 'cratered' }); a.advance(10); expect(a.started).toEqual([]);
  }, 120_000);
  it('HIDDEN TAB = SILENCE: every continuous voice stops and nothing starts while hidden; visibility RESTARTS the bed and the battle loop', () => {
    const h = harness(); h.s.setAmbience({ biome: 'temperate' }); h.s.setMusicState('battle'); h.advance(10);
    const before = h.live().length; expect(before).toBeGreaterThanOrEqual(2);
    h.s.setHidden(true); h.setPortHidden(true); expect(h.live()).toEqual([]);
    const count = h.started.length; h.advance(60_000); expect(h.started.length, 'nothing starts while hidden').toBe(count);
    h.setPortHidden(false); h.s.setHidden(false); h.advance(10);
    expect(h.live().map((v) => v.key).sort()).toEqual(['soundscape:ambience:bed:temperate', 'soundscape:music:battle-theme']);
    expect(h.live().find((v) => v.key.includes('battle-theme'))!.loop).toBe(true);
  }, 120_000);
  it('THE SPARSE RULE: a calm piece plays once, then 2–5 minutes of only ambience before the next; the gaps come from the presentation seed (control: another seed gives other gaps)', () => {
    // poll once a second: a piece's END is when the owner clears its piece; the GAP is from that end to the next music start
    const gaps = (seed: number) => { const h = harness({ seed }); h.s.setAmbience({ biome: 'temperate' }); h.s.setMusicState('calm');
      const out: number[] = []; let ended = -1, playing = false, starts = 0;
      for (let t = 0; t < 30 * 60_000 && out.length < 3; t += 1000) { h.advance(1000); const piece = h.s.status().musicPiece, nStarts = h.started.filter((v) => v.category === 'music').length;
        if (nStarts > starts) { if (ended >= 0) out.push(h.now() - ended); starts = nStarts; playing = true; ended = -1; }
        if (playing && piece === null) { playing = false; ended = h.now(); } }
      return { out, h }; };
    const a = gaps(42), b = gaps(42), c = gaps(7);
    expect(a.out.length).toBeGreaterThanOrEqual(2);
    for (const g of a.out) { expect(g).toBeGreaterThanOrEqual(CALM_GAP_MS.min - 2000); expect(g).toBeLessThanOrEqual(CALM_GAP_MS.max + 2000); }
    expect(a.out).toEqual(b.out); expect(c.out).not.toEqual(a.out);
    expect(a.h.started.filter((v) => v.category === 'music').every((v) => !v.loop && v.bounded)).toBe(true);
  }, 600_000);
  it('battle loops only while in battle; a sting ends it and plays once; the decoded cache never passes 24 MiB across many worlds and pieces', () => {
    const h = harness(); h.s.setMusicState('major-battle'); h.advance(10);
    expect(h.live().filter((v) => v.category === 'music').map((v) => v.loop)).toEqual([true]);
    h.s.sting('victory'); h.advance(10);
    const music = h.live().filter((v) => v.category === 'music'); expect(music).toHaveLength(1); expect(music[0]!.loop).toBe(false); expect(music[0]!.key).toBe('soundscape:music:victory-fanfare');
    for (const b of ['temperate', 'jungle', 'coral', 'glacier', 'dunesea', 'magmasea', 'geode', 'fungal', 'ammonia', 'abyssal'] as const) { h.s.setAmbience({ biome: b }); h.advance(10); expect(h.s.status().residentBytes).toBeLessThanOrEqual(DECODED_CEILING_BYTES); }
    for (const st of ['menu', 'wonder', 'tension', 'battle'] as const) { h.s.setMusicState(st); h.advance(10); expect(h.s.status().residentBytes).toBeLessThanOrEqual(DECODED_CEILING_BYTES); }
  }, 600_000);
});
