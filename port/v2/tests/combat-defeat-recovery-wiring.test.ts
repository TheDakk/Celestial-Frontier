import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const action = fs.readFileSync(path.join(here, '../apps/game/src/arc6-combat-action.ts'), 'utf8');

/* §20 (2026-09-25): a defeat's Recovery ends on the ACTIVE-PLAY clock. `authority.activePlayMs` is optional in the planner type (so
   pre-§20 fixtures keep compiling), which makes this pin the only thing stopping the live fight from silently planning at clock 0. */
function audit(source: string): string[] {
  const f: string[] = [];
  const planCall = source.slice(source.indexOf('const plan = planCombatSettlementV1({'), source.indexOf('if (plan.status !== \'planned\')'));
  if (!planCall.includes('activePlayMs: availability.activePlayMs,')) f.push('the live fight does not plan its settlement on the validated active-play clock');
  if (!source.includes("if (availability.kind !== 'available') {")) f.push('the champion availability (Recovery) check is gone');
  return f;
}

describe('combat defeat Recovery wiring', () => {
  it('the live action plans every settlement on the validated active-play clock', () => { expect(audit(action)).toEqual([]); });
  it('negative control: dropping the clock is named', () => {
    const needle = 'activePlayMs: availability.activePlayMs,';
    expect(action.split(needle).length).toBe(2);
    expect(audit(action.replace(needle, '')).join(' | ')).toMatch(/active-play clock/);
  });
});
