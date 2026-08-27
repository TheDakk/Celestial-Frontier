import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  f4AuthorityConvergenceWitnessErrors,
  latchF4AuthorityConvergenceReload,
} from '../apps/game/src/f4-convergence-latch.js';

const mainSource = readFileSync(
  new URL('../apps/game/src/main.ts', import.meta.url),
  'utf8',
);

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}

function integrationErrors(source: string): string[] {
  const errors: string[] = [];
  const convergence = section(
    source,
    'function scheduleF4AuthorityConvergenceReload(',
    '\ntype F4HeartbeatStorageError',
  );
  const convergenceProtected = convergence.indexOf("persistHold = 'transient-read';");
  const convergenceLatch = convergence.indexOf('latchF4AuthorityConvergenceReload({');
  const convergenceSchedule = convergence.indexOf('schedule: scheduleReload,');
  const convergenceRefresh = convergence.indexOf(
    "if (openPanelId() === 'shipyard') refreshEngineeringPanelState();",
  );
  const repaintReporter = convergence.indexOf('f4AuthorityProtectionRenderError ??=');
  const witnessErrors = convergence.indexOf('const errors = f4AuthorityConvergenceWitnessErrors(');
  if (convergenceProtected < 0 || convergenceLatch < 0 || convergenceSchedule < 0
    || convergenceRefresh < 0 || repaintReporter < 0 || witnessErrors < 0
    || convergenceProtected >= convergenceLatch
    || convergenceLatch >= convergenceSchedule || convergenceSchedule >= convergenceRefresh) {
    errors.push('open-shipyard-protection');
  }

  const helper = section(
    source,
    'function handleF4HeartbeatStorageError(',
    '\nasync function ensureF4RevisionCurrent',
  );
  if (!helper.includes("persistenceBootKind = 'transient-protected';")
    || !helper.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('fail-closed-helper');
  }

  const heartbeat = section(source, 'const heartbeatF4 =', '\nconst settleF4Heartbeat =');
  const heartbeatFailure = heartbeat.indexOf(
    "handleF4HeartbeatStorageError(runtime, outcome, 'periodic F4 heartbeat');",
  );
  const heartbeatOwned = heartbeat.indexOf("heartbeatOwned = outcome.kind === 'owned';");
  if (heartbeatFailure < 0 || heartbeatOwned < 0 || heartbeatFailure >= heartbeatOwned
    || !heartbeat.includes('if (!heartbeatOwned) return;')) {
    errors.push('periodic-heartbeat');
  }

  const show = section(source, 'const showF4 =', "\naddEventListener('pagehide'");
  const showFailure = show.indexOf(
    "handleF4HeartbeatStorageError(runtime, outcome, 'visible F4 heartbeat');",
  );
  const showRestart = show.indexOf('startF4Heartbeat();');
  if (showFailure < 0 || showRestart < 0 || showFailure >= showRestart
    || !show.slice(showFailure, showRestart).includes('return;')) {
    errors.push('visible-heartbeat');
  }

  const importCatch = section(
    source,
    '    /* A repository I/O exception leaves the same authority eligible for a',
    '  /* Best-effort extra keepsake only:',
  );
  if (!importCatch.includes(
    "handleF4HeartbeatStorageError(runtime, renewal, 'failed-import F4 heartbeat');",
  ) || !importCatch.includes("persistHold = 'protected-payload';")
    || !importCatch.includes('stopF4Heartbeat();')) {
    errors.push('failed-import-heartbeat');
  }

  const boot = section(
    source,
    '      const leaseOutcome = f4PageVisible()',
    '      /* A newly minted crypto seed becomes durable',
  );
  if (!boot.includes("if (leaseOutcome.kind === 'storage-error')")
    || !boot.includes('throw new Error(`boot F4 lease ${leaseOutcome.operation} storage failure')) {
    errors.push('boot-heartbeat');
  }
  return errors;
}

describe('F4 lease-storage failure app integration', () => {
  it('protects boot, periodic, visible, and failed-import heartbeat paths', () => {
    expect(integrationErrors(mainSource)).toEqual([]);
  });

  it('rejects every missing fail-closed integration independently', () => {
    const required = [
      "if (openPanelId() === 'shipyard') refreshEngineeringPanelState();",
      'latchF4AuthorityConvergenceReload({',
      'const errors = f4AuthorityConvergenceWitnessErrors(',
      'f4AuthorityProtectionRenderError ??=',
      "persistenceBootKind = 'transient-protected';\n  scheduleF4AuthorityConvergenceReload(",
      "handleF4HeartbeatStorageError(runtime, outcome, 'periodic F4 heartbeat');",
      'if (!heartbeatOwned) return;',
      "handleF4HeartbeatStorageError(runtime, outcome, 'visible F4 heartbeat');",
      "handleF4HeartbeatStorageError(runtime, renewal, 'failed-import F4 heartbeat');",
      "if (leaseOutcome.kind === 'storage-error')",
    ] as const;
    for (const [index, marker] of required.entries()) {
      expect(mainSource.split(marker).length - 1, marker).toBe(1);
      const mutant = mainSource.replace(marker, `__F4_MAIN_MUTANT_${index}__`);
      expect(integrationErrors(mutant), marker).not.toEqual([]);
    }
  });

  it('schedules exactly one convergence before a throwing Shipyard repaint', () => {
    let scheduled = false;
    let scheduleCount = 0;
    const events: string[] = [];
    const invoke = () => latchF4AuthorityConvergenceReload({
      alreadyScheduled: scheduled,
      latch: () => { events.push('latch'); scheduled = true; },
      schedule: () => { events.push('schedule'); scheduleCount++; },
      repaint: () => { events.push('repaint'); throw new Error('injected repaint failure'); },
      onRepaintError: (error) => {
        events.push(error instanceof Error ? error.message : String(error));
      },
    });
    expect(invoke).not.toThrow();
    expect(invoke).not.toThrow();
    expect(scheduled).toBe(true);
    expect(scheduleCount).toBe(1);
    expect(events).toEqual([
      'latch', 'schedule', 'repaint', 'injected repaint failure',
      'repaint', 'injected repaint failure',
    ]);
  });

  it('seeds the release witness with a captured Shipyard repaint error', () => {
    expect(f4AuthorityConvergenceWitnessErrors(null)).toEqual([]);
    expect(f4AuthorityConvergenceWitnessErrors('injected repaint failure')).toEqual([
      'Shipyard protection repaint: injected repaint failure',
    ]);
  });
});
