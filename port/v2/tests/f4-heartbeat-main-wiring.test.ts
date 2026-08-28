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

function replaceInSectionExact(
  source: string,
  start: string,
  end: string,
  needle: string,
  replacement: string,
): string {
  const body = section(source, start, end);
  if (body.length === 0 || body.split(needle).length !== 2) {
    throw new Error(`source section must contain exactly one mutation target: ${needle}`);
  }
  return source.replace(body, body.replace(needle, replacement));
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

  const heartbeatCycle = section(
    source,
    'const runF4HeartbeatCycle =',
    '\nconst heartbeatF4 =',
  );
  const heartbeatFailure = heartbeatCycle.indexOf(
    "handleF4HeartbeatStorageError(runtime, outcome, 'periodic F4 heartbeat');",
  );
  const heartbeatOwned = heartbeatCycle.indexOf("heartbeatOwned = outcome.kind === 'owned';");
  if (heartbeatFailure < 0 || heartbeatOwned < 0 || heartbeatFailure >= heartbeatOwned
    || !heartbeatCycle.includes('if (!heartbeatOwned) return;')) {
    errors.push('periodic-heartbeat');
  }

  const heartbeat = section(source, 'const heartbeatF4 =', '\nconst settleF4Heartbeat =');
  const smokeHold = heartbeat.indexOf(
    'if (f4HeartbeatSmokeQuiesced) return Promise.resolve();',
  );
  const reuseCycle = heartbeat.indexOf(
    'if (f4HeartbeatCycleInFlight) return f4HeartbeatCycleInFlight;',
  );
  const startCycle = heartbeat.indexOf('const run = runF4HeartbeatCycle();');
  const trackCycle = heartbeat.indexOf('const tracked = run.finally(() => {');
  const clearCycle = heartbeat.indexOf(
    'if (f4HeartbeatCycleInFlight === tracked) f4HeartbeatCycleInFlight = null;',
  );
  const publishCycle = heartbeat.indexOf('f4HeartbeatCycleInFlight = tracked;');
  const returnCycle = heartbeat.indexOf('return tracked;');
  if (!source.includes('let f4HeartbeatCycleInFlight: Promise<void> | null = null;')
    || !source.includes('let f4HeartbeatSmokeQuiesced = false;')
    || !(smokeHold >= 0 && reuseCycle > smokeHold && startCycle > reuseCycle
      && trackCycle > startCycle && clearCycle > trackCycle
      && publishCycle > clearCycle && returnCycle > publishCycle)) {
    errors.push('heartbeat-cycle-coalescing');
  }

  const settle = section(source, 'const settleF4Heartbeat =', '\nconst startF4Heartbeat =');
  if (!settle.includes('const cycle = f4HeartbeatCycleInFlight;')
    || !settle.includes('if (cycle) await cycle;')
    || settle.includes('await f4HeartbeatInFlight')) {
    errors.push('heartbeat-full-cycle-settlement');
  }

  const persist = section(source, 'async function persistView(', '\nlet _persistT');
  const checkpointOwner = 'F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER';
  const checkpointCall = `persistView(null, 'ordinary', ${checkpointOwner})`;
  if (!source.includes(
    `const ${checkpointOwner} = Symbol('f4-heartbeat-cycle-checkpoint-owner');`,
  )
    || !persist.includes(
      `heartbeatCycleOwner: typeof ${checkpointOwner} | null = null,`,
    )
    || !persist.includes(`if (heartbeatCycleOwner !== ${checkpointOwner}) {`)
    || !persist.includes('await settleF4Heartbeat();')
    || !heartbeatCycle.includes(checkpointCall)
    || (source.match(new RegExp(`\\b${checkpointOwner}\\b`, 'g')) ?? []).length !== 4
    || (source.match(new RegExp(checkpointCall.replace(/[()]/g, '\\$&'), 'g')) ?? []).length !== 1) {
    errors.push('heartbeat-checkpoint-owner');
  }
  if (!heartbeatCycle.includes(
    'if (checkpointDue && !productActionInFlight && !activePersist) {',
  )) {
    errors.push('heartbeat-checkpoint-tail-guard');
  }

  const quiesce = section(
    source,
    'const quiesceF4HeartbeatForSmoke =',
    '\nconst resumeF4HeartbeatForSmoke =',
  );
  const startHeartbeat = section(
    source,
    'const startF4Heartbeat =',
    '\nconst quiesceF4HeartbeatForSmoke =',
  );
  const quiesceHold = quiesce.indexOf('f4HeartbeatSmokeQuiesced = true;');
  const quiesceStop = quiesce.indexOf('stopF4Heartbeat();');
  const quiesceDrain = quiesce.indexOf(
    'while (f4HeartbeatCycleInFlight) await f4HeartbeatCycleInFlight;',
  );
  const resume = section(
    source,
    'const resumeF4HeartbeatForSmoke =',
    '\nlet persistedPagehideCount',
  );
  const resumeRelease = resume.indexOf('f4HeartbeatSmokeQuiesced = false;');
  const resumeStart = resume.indexOf('startF4Heartbeat();');
  if (!startHeartbeat.includes('if (f4HeartbeatSmokeQuiesced || !f4Runtime || persistHold')
    || !startHeartbeat.includes(
      'f4HeartbeatTimer = window.setInterval(() => { void heartbeatF4(); }, F4_HEARTBEAT_MS);',
    )
    || !(quiesceHold >= 0 && quiesceStop > quiesceHold && quiesceDrain > quiesceStop)
    || !quiesce.includes("schema: 'cf-v2-f4-heartbeat-quiescence/v1'")
    || !quiesce.includes('documentToken: DOCUMENT_TOKEN,')
    || !quiesce.includes('stopped: f4HeartbeatTimer === 0,')
    || !quiesce.includes('cycleSettled: f4HeartbeatCycleInFlight === null,')
    || !(resumeRelease >= 0 && resumeStart > resumeRelease)
    || !resume.includes("schema: 'cf-v2-f4-heartbeat-resume/v1'")
    || !resume.includes('documentToken: DOCUMENT_TOKEN,')
    || !resume.includes('running: f4HeartbeatTimer !== 0,')
    || !source.includes('__smokeQuiesceF4Heartbeat: quiesceF4HeartbeatForSmoke,')
    || !source.includes('__smokeResumeF4Heartbeat: resumeF4HeartbeatForSmoke,')) {
    errors.push('heartbeat-smoke-quiescence');
  }

  const storageArm = section(
    source,
    '__smokeArmF4HeartbeatStorageFailure: () => {',
    '\n      __smokeArmF4RevisionVerificationFailure',
  );
  const revisionArm = section(
    source,
    '__smokeArmF4RevisionVerificationFailure: () => {',
    '\n      __smokeRunF4Heartbeat',
  );
  const fullCycleArmGuard =
    '|| f4HeartbeatInFlight !== null || f4HeartbeatCycleInFlight !== null) return false;';
  if (!storageArm.includes(fullCycleArmGuard) || !revisionArm.includes(fullCycleArmGuard)) {
    errors.push('heartbeat-smoke-arm-tail-window');
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

  it('rejects heartbeat overlap and smoke-quiescence regressions independently', () => {
    const wrapperMutations = [
      [
        'if (f4HeartbeatSmokeQuiesced) return Promise.resolve();',
        'if (false) return Promise.resolve();',
      ],
      [
        'if (f4HeartbeatCycleInFlight) return f4HeartbeatCycleInFlight;',
        'if (false) return f4HeartbeatCycleInFlight!;',
      ],
      ['const run = runF4HeartbeatCycle();', 'const run = Promise.resolve();'],
      [
        'if (f4HeartbeatCycleInFlight === tracked) f4HeartbeatCycleInFlight = null;',
        'f4HeartbeatCycleInFlight = null;',
      ],
    ] as const;
    for (const [needle, replacement] of wrapperMutations) {
      const mutant = replaceInSectionExact(
        mainSource,
        'const heartbeatF4 =',
        '\nconst settleF4Heartbeat =',
        needle,
        replacement,
      );
      expect(integrationErrors(mutant), needle).toContain('heartbeat-cycle-coalescing');
    }

    const restartWhileHeld = replaceInSectionExact(
      mainSource,
      'const startF4Heartbeat =',
      '\nconst quiesceF4HeartbeatForSmoke =',
      'if (f4HeartbeatSmokeQuiesced || !f4Runtime || persistHold',
      'if (!f4Runtime || persistHold',
    );
    expect(integrationErrors(restartWhileHeld)).toContain('heartbeat-smoke-quiescence');

    const quiesceOrder = replaceInSectionExact(
      mainSource,
      'const quiesceF4HeartbeatForSmoke =',
      '\nconst resumeF4HeartbeatForSmoke =',
      'f4HeartbeatSmokeQuiesced = true;\n  stopF4Heartbeat();',
      'stopF4Heartbeat();\n  f4HeartbeatSmokeQuiesced = true;',
    );
    expect(integrationErrors(quiesceOrder)).toContain('heartbeat-smoke-quiescence');

    const undrained = replaceInSectionExact(
      mainSource,
      'const quiesceF4HeartbeatForSmoke =',
      '\nconst resumeF4HeartbeatForSmoke =',
      'while (f4HeartbeatCycleInFlight) await f4HeartbeatCycleInFlight;',
      'await Promise.resolve();',
    );
    expect(integrationErrors(undrained)).toContain('heartbeat-smoke-quiescence');

    const heldAfterResume = replaceInSectionExact(
      mainSource,
      'const resumeF4HeartbeatForSmoke =',
      '\nlet persistedPagehideCount',
      'f4HeartbeatSmokeQuiesced = false;',
      'f4HeartbeatSmokeQuiesced = true;',
    );
    expect(integrationErrors(heldAfterResume)).toContain('heartbeat-smoke-quiescence');

    const storageArmTailWindow = replaceInSectionExact(
      mainSource,
      '__smokeArmF4HeartbeatStorageFailure: () => {',
      '\n      __smokeArmF4RevisionVerificationFailure',
      ' || f4HeartbeatCycleInFlight !== null',
      '',
    );
    expect(integrationErrors(storageArmTailWindow))
      .toContain('heartbeat-smoke-arm-tail-window');

    const revisionArmTailWindow = replaceInSectionExact(
      mainSource,
      '__smokeArmF4RevisionVerificationFailure: () => {',
      '\n      __smokeRunF4Heartbeat',
      ' || f4HeartbeatCycleInFlight !== null',
      '',
    );
    expect(integrationErrors(revisionArmTailWindow))
      .toContain('heartbeat-smoke-arm-tail-window');
  });

  it('settles the full tail while only its owning checkpoint may bypass itself', () => {
    const innerOnlySettle = replaceInSectionExact(
      mainSource,
      'const settleF4Heartbeat =',
      '\nconst startF4Heartbeat =',
      'const cycle = f4HeartbeatCycleInFlight;\n  if (cycle) await cycle;',
      'const cycle = f4HeartbeatInFlight;\n  if (cycle) await cycle;',
    );
    expect(integrationErrors(innerOnlySettle)).toContain('heartbeat-full-cycle-settlement');

    const ownerlessCheckpoint = replaceInSectionExact(
      mainSource,
      'const runF4HeartbeatCycle =',
      '\nconst heartbeatF4 =',
      "persistView(null, 'ordinary', F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER)",
      'persistView()',
    );
    expect(integrationErrors(ownerlessCheckpoint)).toContain('heartbeat-checkpoint-owner');

    const ordinaryBypass = replaceInSectionExact(
      mainSource,
      "chartsDockEl.addEventListener('click', () => {",
      '\n\n/* ---- SETTINGS',
      'void persistView();',
      "void persistView(null, 'ordinary', F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER);",
    );
    expect(integrationErrors(ordinaryBypass)).toContain('heartbeat-checkpoint-owner');

    for (const removedGuard of ['!productActionInFlight && ', '&& !activePersist'] as const) {
      const unguardedTail = replaceInSectionExact(
        mainSource,
        'const runF4HeartbeatCycle =',
        '\nconst heartbeatF4 =',
        removedGuard,
        '',
      );
      expect(integrationErrors(unguardedTail), removedGuard)
        .toContain('heartbeat-checkpoint-tail-guard');
    }

    const ordinarySettlementBypass = replaceInSectionExact(
      mainSource,
      'async function persistView(',
      '\nlet _persistT',
      'if (heartbeatCycleOwner !== F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER) {',
      'if (false) {',
    );
    expect(integrationErrors(ordinarySettlementBypass)).toContain('heartbeat-checkpoint-owner');
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
