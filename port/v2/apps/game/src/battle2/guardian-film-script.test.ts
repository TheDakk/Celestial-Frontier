/* The D2 Brown Bear guardian film's script (audits/GUARDIAN_CHOREOGRAPHY_20261001/script-d2-bear-guardian.json, FILM.md) plans the
 * whole boss program when the native film harness reads it the way the game wiring reads a settled Guardian fight: the entrance, the
 * phase set piece right after the row that takes the bear to half health, heavy strikes on the bear's hits (phase-active after the
 * phase), and the fall finale. No browser: the same adapter path the native entry runs (turnPlanInputFromTranscriptEvent → program). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { planGuardianProgramV1 } from './guardian-choreo.js';
import { turnPlanInputFromTranscriptEvent, type TurnOutcomeContext } from './stage.js';
import type { TurnPlanInput } from './choreography.js';

const SCRIPT = JSON.parse(readFileSync(new URL('../../../../../../audits/GUARDIAN_CHOREOGRAPHY_20261001/script-d2-bear-guardian.json', import.meta.url), 'utf8')) as {
  guardianChoreo: boolean; guardian: { kind: string; maxB: number }; rows: Record<string, unknown>[] };
const RECORD = (dir: string) => JSON.parse(readFileSync(new URL(`../../../../../../audits/${dir}/record.json`, import.meta.url), 'utf8')) as { identity: { earthName: string }; guardian?: unknown };
const BEAR = RECORD('VISION_D2_GUARDIAN_20260921/fit-01'), CRAB = RECORD('ANATOMY_COMPLETION_20260917/crab-fits-03/crab');
const ARENA = { groundLineY: 0.78, stands: { left: { x: 0.18, y: 0.78 }, right: { x: 0.7, y: 0.78 } } };

function plan(rows: Record<string, unknown>[], maxB: number | null) {
  const left = CRAB.identity.earthName, right = BEAR.identity.earthName;
  const ctx: TurnOutcomeContext = { A: { side: 'A', name: left, mass: 1, card: null, theme: 'stone', seed: 1 }, B: { side: 'B', name: right, mass: 1.6, card: null, theme: 'wild', seed: 2 },
    arena: ARENA, seed: 9, anchorsForTheme: () => null, readyMs: 600, commandMs: 300 };
  const turns: TurnPlanInput[] = [], turnRows: number[] = [], ord = { A: 0, B: 0 };
  for (const [i, row] of rows.entries()) { const side = row.side === 'B' || (row.dodge === true && row.an === right) ? 'B' : 'A'; const t = turnPlanInputFromTranscriptEvent(row, ctx, ord[side]); if (t.kind === 'turn') { turns.push(t.input); turnRows.push(i); ord[side]++; } }
  return planGuardianProgramV1({ defender: { name: right, kind: SCRIPT.guardian.kind }, guardianSide: 'right', seed: 9, guardian: { side: 'right', mass: 1.6, card: null, seed: 2, label: right },
    opponent: { side: 'left', mass: 1, card: null, seed: 1, label: left }, log: rows, maxB, startHpB: null, turns, turnRows, riseFromDy: 0.5 });
}

describe('D2 bear guardian film script', () => {
  it('names the real fits: the crab (left, challenger) and the guardian-block Brown Bear (right, defender)', () => {
    expect(BEAR.guardian).toBeTruthy(); expect(CRAB.guardian).toBeUndefined();
    expect(SCRIPT.guardianChoreo).toBe(true);
    for (const r of SCRIPT.rows) { expect([CRAB.identity.earthName, BEAR.identity.earthName]).toContain(r.an); expect([CRAB.identity.earthName, BEAR.identity.earthName]).toContain(r.dn); }
  });
  it('plans every set piece: entrance, the phase after the half-health row, heavy strikes (phase-active after it), the fall', () => {
    const p = plan(SCRIPT.rows, SCRIPT.guardian.maxB)!;
    expect(p).not.toBeNull(); expect(p.entrance.piece).toBe('guardian-entrance');
    expect(p.phase).toMatchObject({ afterTurn: 2, rowIndex: 2 }); expect(p.phaseReason).toBe('row 2 took the guardian to half health');
    const strikes = p.turns.map((t, i) => (t.guardianStrike ? i : -1)).filter((i) => i >= 0);
    expect(strikes).toEqual([1, 3]); // the bear's two hits; the dodged swing (turn 4) carries none
    expect(p.turns[3]!.guardianStrike!.hitstopMs).toBeGreaterThan(p.turns[1]!.guardianStrike!.hitstopMs); // phase-active critical vs early hit
    expect(p.finale?.piece).toBe('guardian-fall');
    // control: without maxB the phase beat is not placed (labelled), the rest of the program stays
    const q = plan(SCRIPT.rows, null)!; expect(q.phase).toBeNull(); expect(q.phaseReason).toMatch(/no defender max HP/); expect(q.finale?.piece).toBe('guardian-fall');
  });
});
