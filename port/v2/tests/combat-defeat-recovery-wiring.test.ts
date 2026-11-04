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
  const authority = source.slice(source.indexOf('const settlementAuthority = Object.freeze({'), source.indexOf('const battleId = '));
  if (!authority.includes('activePlayMs: availability.activePlayMs,')) f.push('the live fight does not plan its settlement on the validated active-play clock');
  // both planning paths (the legacy single fight and the §20 party) must use that one authority
  if ((source.match(/authority: settlementAuthority,/g) ?? []).length !== 2) f.push('a planning path bypasses the active-play settlement authority');
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
