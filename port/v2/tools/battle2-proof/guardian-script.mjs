/** Guardian choreography in the battle2 native film (2026-10-02; audits/GUARDIAN_CHOREOGRAPHY_20261001/DESIGN.md §10). Pure, no browser:
 * the film script's option and the film's one global timeline of set pieces and turns, in the order the game wiring plays them
 * (battle2-wiring.ts: entrance → phase before the first turn when the phase changed in an earlier leg → turns, the phase set piece after
 * the turn that took the guardian to half health → the fall/triumph finale).
 *
 * Script fields (all optional; absent = today's film, byte for byte):
 *   "guardianChoreo": true              play the program (`planGuardianProgramV1`), exactly as `?guardianChoreo=1` does in the game
 *   "guardian": { "kind": "guardian" | "titan",   the settled defender's kind (default "guardian"; only these two get a program)
 *                 "maxB": 40,                      the decisive leg's defender max HP — places the phase beat (absent: no phase beat, labelled)
 *                 "startHpB": 40 }                 the defender's HP at the leg's start (default maxB; at or below half = phased from the start)
 *   "reducedMotion": true               the reduced-motion program (set pieces at rest)
 * The guardian is the DEFENDER, as in every live Guardian/Titan fight: the right fit (side B; the rows' hpB is its HP), and that fit's record
 * must carry a guardian block (the guardian frame fill, D2). */
export const GUARDIAN_KINDS = Object.freeze(['guardian', 'titan']);
const pos = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function parseGuardianScript(script, sides) {
  if (!script || typeof script !== 'object') throw Error('guardian script: the battle script must be an object');
  if (script.guardianChoreo === undefined || script.guardianChoreo === false) {
    if (script.guardian !== undefined) throw Error('guardian script: "guardian" is set but "guardianChoreo" is not true');
    return null;
  }
  if (script.guardianChoreo !== true) throw Error('guardian script: "guardianChoreo" must be true or false');
  if (!sides?.guardianRigs?.right) throw Error(`guardian script: the guardian is the defender — pass its fit (a record with a guardian block) as the RIGHT fit${sides?.guardianRigs?.left ? ' (the left fit carries the guardian block)' : ''}`);
  const g = script.guardian ?? {};
  if (typeof g !== 'object' || Array.isArray(g)) throw Error('guardian script: "guardian" must be an object');
  for (const k of Object.keys(g)) if (!['kind', 'maxB', 'startHpB'].includes(k)) throw Error(`guardian script: unknown guardian field "${k}"`);
  const kind = g.kind ?? 'guardian'; if (!GUARDIAN_KINDS.includes(kind)) throw Error(`guardian script: kind must be one of ${GUARDIAN_KINDS.join(', ')}`);
  if (g.maxB !== undefined && !pos(g.maxB)) throw Error('guardian script: maxB must be a positive number');
  if (g.startHpB !== undefined && (!pos(g.startHpB) || g.maxB === undefined || g.startHpB > g.maxB)) throw Error('guardian script: startHpB needs maxB and must lie in (0, maxB]');
  if (script.reducedMotion !== undefined && typeof script.reducedMotion !== 'boolean') throw Error('guardian script: reducedMotion must be a boolean');
  if (!Array.isArray(script.rows) || !script.rows.length) throw Error('guardian script: rows required');
  if (g.maxB !== undefined && !script.rows.some((r) => typeof r?.hpB === 'number')) throw Error('guardian script: maxB given but no row carries hpB (the guardian\'s HP)');
  return Object.freeze({ kind, maxB: g.maxB ?? null, startHpB: g.startHpB ?? null, guardianSide: 'right', defenderName: sides.rightName, reducedMotion: script.reducedMotion === true });
}

/** The film's one global timeline: `turnDurations[i]` = turn i's `beats.end`; `program` = the planned guardian program (or null). */
export function filmTimeline(turnDurations, program) {
  if (!Array.isArray(turnDurations) || !turnDurations.length || !turnDurations.every(pos)) throw Error('film timeline: positive turn durations required');
  const segments = []; let at = 0;
  const piece = (p) => { if (!p) return; if (!pos(p.durationMs)) throw Error(`film timeline: set piece ${p.piece} has no duration`); segments.push(Object.freeze({ kind: 'piece', name: p.piece, piece: p, offsetMs: at, durationMs: p.durationMs })); at += p.durationMs; };
  if (program) piece(program.entrance);
  if (program?.phase?.afterTurn === -1) piece(program.phase.piece);
  turnDurations.forEach((d, turn) => { segments.push(Object.freeze({ kind: 'turn', turn, offsetMs: at, durationMs: d })); at += d; if (program?.phase && program.phase.afterTurn === turn) piece(program.phase.piece); });
  if (program?.finale) piece(program.finale);
  return Object.freeze({ segments: Object.freeze(segments), totalMs: at });
}
/** The segment index showing at global time `g` (clamped to the film). */
export function segmentAt(timeline, g) {
  let i = 0; while (i + 1 < timeline.segments.length && g >= timeline.segments[i + 1].offsetMs) i++;
  return i;
}

const TURN_WINDOWS = (b) => [['ready', 0, b.readyEnd], ['command', b.readyEnd, b.commandEnd], ['approach', b.commandEnd, b.actionStart], ['action', b.actionStart, b.impactAt], ['hitstop', b.impactAt, b.hitstopEnd], ['impact', b.hitstopEnd, b.actionEnd], ['return', b.actionEnd, b.returnEnd], ['idle', b.returnEnd, b.end]].filter(([, a, z]) => z > a);
/** Capture integrity for a guardian film (the turns-only `requireBattleCaptureTimeline` refuses interleaved set pieces by design): every
 * segment in order with no gap, every turn phase AND every set piece observed live, each sample on the segment and beat its time names.
 * A set-piece beat shorter than two 60 Hz frames may fall between samples and is reported, not required. */
export function requireGuardianFilmTimeline(gates, capture, captureDuration = (ms) => Math.max(10000, ms)) {
  const need = (ok, why) => { if (!ok) throw Error('Guardian capture: ' + why); };
  const segs = gates?.guardian?.segments, frames = capture?.frameSamples, turns = gates?.turns;
  need(Array.isArray(segs) && segs.length > 0 && Array.isArray(turns) && turns.length > 0, 'missing segment plan');
  let at = 0, t = 0;
  for (const s of segs) {
    need(s.offsetMs === at && s.durationMs > 0, 'segments not contiguous');
    if (s.kind === 'turn') { need(s.turn === t && turns[t]?.offsetMs === at && turns[t].beats.end === s.durationMs, 'turn segment differs from the turn plan'); t++; }
    else need(s.kind === 'piece' && Array.isArray(s.beats) && typeof s.name === 'string', 'invalid set piece segment');
    at += s.durationMs;
  }
  need(t === turns.length && at === gates.totalMs, 'planned duration differs');
  const target = captureDuration(gates.totalMs);
  need(capture.plannedDurationMs === target, 'capture used another stop time');
  need(Array.isArray(frames) && frames.length >= Math.ceil(target / 1000 * 57) + 1 && capture.frames === frames.length, 'missing live frames');
  need(frames[0].ms === 0 && frames.at(-1).ms >= target && frames.at(-1).ms <= target + 750, 'incomplete live endpoints');
  const beatsOf = (s) => (s.kind === 'turn' ? TURN_WINDOWS(turns[s.turn].beats) : s.beats.map((b) => [b.beat, b.start, b.end]));
  const seen = segs.map((s) => beatsOf(s).map(() => 0)), samples = segs.map(() => 0);
  let previous = -1;
  for (const f of frames) {
    need(Number.isFinite(f.ms) && f.ms > previous && Number.isFinite(f.cpuMs) && f.cpuMs >= 0, 'invalid live sample'); previous = f.ms;
    const k = segmentAt({ segments: segs }, f.ms), s = segs[k], local = Math.min(f.ms - s.offsetMs, s.durationMs - 1e-6), w = beatsOf(s);
    need(Number.isFinite(f.localMs) && Math.abs(f.localMs - local) < 1e-7, `sample at ${f.ms} ms is not on segment ${k}`);
    const j = w.findIndex(([, a, z]) => local >= a && local < z);
    if (s.kind === 'turn') {
      need(f.turn === s.turn && f.piece === undefined, `sample at ${f.ms} ms skipped/reordered turn ${s.turn}`);
      need(j >= 0 && f.phase === w[j][0], `sample at ${f.ms} ms: phase ${f.phase} differs`);
    } else {
      need(f.turn === null && f.piece === s.name && f.segment === k, `sample at ${f.ms} ms is not set piece ${s.name}`);
      need(f.phase === (j >= 0 ? w[j][0] : 'card'), `sample at ${f.ms} ms: beat ${f.phase} differs`);
    }
    if (j >= 0) seen[k][j]++; samples[k]++;
  }
  const segments = segs.map((s, k) => ({ kind: s.kind, ...(s.kind === 'turn' ? { turn: s.turn } : { name: s.name }), samples: samples[k], beats: beatsOf(s).map(([name, a, z], j) => ({ name, start: a, end: z, samples: seen[k][j] })) }));
  for (const r of segments) { const what = r.kind === 'turn' ? `turn ${r.turn}` : r.name; need(r.samples > 0, `${what} never observed`); for (const b of r.beats) need(b.samples > 0 || (r.kind === 'piece' && b.end - b.start < 34), `${what} ${b.name} never observed`); }
  return { schema: 'cf.guardian-film-timeline/v1', plannedDurationMs: target, totalScriptMs: gates.totalMs, frames: frames.length, segments };
}
