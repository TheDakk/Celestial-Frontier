import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const controllerSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'capture-card.ts'),
  'utf8',
);
const audioOwnerSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'tame-greeting-audio.ts'),
  'utf8',
);

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function tameGreetingWiringErrors(
  main: string,
  controller: string,
  audioSource: string = audioOwnerSource,
): string[] {
  const errors: string[] = [];
  const click = section(controller, 'readonly #onClick =', '\n\n  #render(): void');
  const trusted = click.indexOf("if (verb === 'tame' && event.isTrusted) this.#onNativeTameGesture?.();");
  const action = click.indexOf('this.#onAction?.(request);');
  if (!(trusted >= 0 && action > trusted)
    || (click.match(/#onNativeTameGesture/g) ?? []).length !== 1) {
    errors.push('native-tame-only-arm');
  }

  const controllerWiring = section(
    main,
    'const captureCardController = new CaptureCardController({',
    '\nfunction surveyOwnsCurrentCaptureSurface(',
  );
  const nativeHook = controllerWiring.indexOf('onNativeTameGesture: () => {');
  const arm = controllerWiring.indexOf('tameGreetingAudioOwner?.armNativeTameGesture();');
  const onAction = controllerWiring.indexOf('onAction: (request) => {');
  const run = controllerWiring.indexOf('void runCaptureCardAction(request, presentationFence);');
  if (!(nativeHook >= 0 && arm > nativeHook && onAction > arm && run > onAction)) {
    errors.push('main-native-arm-order');
  }

  const writer = section(
    main,
    'async function commitArc4CaptureAction(',
    '\nfunction captureActivePlayCountdown(',
  );
  if (writer.includes('tameGreetingAudioOwner') || writer.includes('createCreatureExpression')) {
    errors.push('writer-owned-audio');
  }
  if (!main.includes('__smokeCaptureCurrentSurface: commitArc4CaptureAction,')) {
    errors.push('diagnostic-writer-boundary');
  }
  const outcomeShape = section(
    main,
    'type Arc4CaptureActionOutcome =',
    '\nlet lastArc4CaptureResult:',
  );
  const coherence = writer.indexOf(
    'if (verified.ownership.revision !== verified.ownershipV2.revision) {',
  );
  const publication = writer.indexOf('publishArc4CaptureFields(save, transaction.state);');
  const globalRevision = writer.indexOf('revision: transaction.revision,');
  const ownershipRevision = writer.indexOf(
    'ownershipRevision: verified.ownershipV2.revision,',
  );
  const audioResultShape = section(
    audioSource,
    'export interface TameGreetingCaptureResult {',
    '\n}',
  );
  const audioOwnerClass = section(
    audioSource,
    'class BrowserTameGreetingAudioOwner',
    '\nexport function createTameGreetingAudioOwner(',
  );
  const audioClaim = section(
    audioOwnerClass,
    'claimCommittedTameGreeting(',
    '\n  async playClaimedTameGreeting(',
  );
  if ((outcomeShape.match(/ownershipRevision: number;/g) ?? []).length !== 1
    || (audioResultShape.match(/readonly ownershipRevision: number;/g) ?? []).length !== 1
    || coherence < 0 || publication <= coherence
    || globalRevision <= publication || ownershipRevision <= globalRevision
    || (writer.match(/revision: transaction\.revision,/g) ?? []).length !== 1
    || (writer.match(/ownershipRevision: verified\.ownershipV2\.revision,/g) ?? []).length !== 1
    || !writer.includes("throw new Error('arc4-arc5-ownership-revision-mismatch');")
    || !audioClaim.includes('state.revision !== outcome.result.ownershipRevision')
    || audioClaim.includes('state.revision !== outcome.result.revision')) {
    errors.push('ownership-revision-authority');
  }

  const presentation = section(
    main,
    'async function runCaptureCardAction(',
    '\nfunction engineeringOutcomeConverges(',
  );
  const settle = presentation.indexOf('captureCardController.settle(copy);');
  const refresh = presentation.indexOf('refreshCaptureCardState();');
  const claim = presentation.indexOf('.claimCommittedTameGreeting(outcome, arc5OwnershipState)');
  const toast = presentation.indexOf('toast(copy.title, copy.detail, true);');
  const bind = presentation.indexOf('bindTameToastCounterpart(');
  const play = presentation.indexOf('.playClaimedTameGreeting(greetingClaim, counterpart)');
  if (!(settle >= 0 && refresh > settle && claim > refresh && toast > claim
    && bind > toast && play > bind)) errors.push('postcommit-counterpart-order');
  if ((presentation.match(/playClaimedTameGreeting/g) ?? []).length !== 1
    || !presentation.includes("cancelTameAttempt('presentation-fault')")) {
    errors.push('single-play-fault-fence');
  }

  const toastOwner = section(
    main,
    'const toastEl = document.createElement',
    '\nconst primeCount =',
  );
  for (const needle of [
    "toastEl.getAttribute('role') === 'status'",
    "toastEl.getAttribute('aria-live') === 'assertive'",
    "toastEl.getAttribute('aria-hidden') !== 'true'",
    "toastEl.getAttribute('aria-atomic') === 'true'",
    "toastEl.style.opacity === '1'",
    'receipt.generation === _toastSerial',
    'title?.textContent === registered.title',
    'toastDetailText() === registered.detail',
    'counterpartKey: `capture-toast:${_toastSerial}`',
  ]) if (!toastOwner.includes(needle)) errors.push('exact-toast-counterpart');

  const settings = section(main, 'function fillSettings(): void {', '\n/* ---- GUIDE + RELEASE HISTORY');
  for (const needle of [
    'id="setvoice"',
    'save.voiceOn = !save.voiceOn;',
    "refillAndFocus('#setvoice'); void persistView();",
  ]) if (!settings.includes(needle)) errors.push('creature-voice-setting');
  if ((settings.match(/tameGreetingAudioOwner\?\.syncSettings\(\);/g) ?? []).length !== 3) {
    errors.push('audio-settings-live-sync');
  }

  const releaseWitness = section(
    main,
    'type ReloadReleaseWitness = {',
    '\ntype BootPhaseStage =',
  );
  if (!releaseWitness.includes('audio: TameGreetingAudioDiagnostics | null;')) {
    errors.push('reload-audio-witness-shape');
  }
  const audioPostcondition = section(
    main,
    'function tameGreetingAudioReleasedForReload(',
    '\ntype BootPhaseStage =',
  );
  for (const needle of [
    'diagnostics.schema === TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA',
    'diagnostics.disposed === true',
    'diagnostics.armed === 0',
    'diagnostics.activeVoiceId === null',
    "diagnostics.counterpart.status === 'none'",
    'diagnostics.counterpart.key === null',
    'diagnostics.counterpart.generation === null',
    "diagnostics.counterpart.status === 'lost'",
    'diagnostics.runtime.state === \'disposed\'',
    'diagnostics.runtime.contextState === null',
    'diagnostics.runtime.nodes.active === 0',
    'diagnostics.runtime.voices.active === 0',
    'diagnostics.runtime.voices.ids.length === 0',
    'diagnostics.runtime.creatureEmitters.active === 0',
    'diagnostics.runtime.reservations.voices.active === 0',
    'diagnostics.runtime.reservations.nodes.active === 0',
  ]) if (!audioPostcondition.includes(needle)) errors.push('reload-audio-postcondition');

  const replacement = section(main, 'function scheduleReplacementReload(', '\n/* ---- THE PHASE 4 CHROME');
  const audioOwner = replacement.indexOf('const audioOwner = tameGreetingAudioOwner;');
  const audioDispose = replacement.indexOf('await audioOwner?.dispose()');
  const audioSnapshot = replacement.indexOf('audioRelease = audioOwner?.diagnostics() ?? null;');
  const audioRequired = replacement.indexOf('tameGreetingAudioReleasedForReload(audioRelease)');
  const f4Release = replacement.indexOf('await runtime?.release()');
  const chromeDispose = replacement.indexOf('appChrome.dispose()');
  const rendererRelease = replacement.indexOf('releaseRendererForReload(reason, audioRelease)');
  if (!(audioOwner >= 0 && audioDispose > audioOwner && audioSnapshot > audioDispose
    && audioRequired > audioSnapshot && f4Release > audioRequired
    && chromeDispose > f4Release && rendererRelease > chromeDispose)) {
    errors.push('replacement-release-order');
  }
  const audioDisposeFault = section(
    replacement,
    'try { await audioOwner?.dispose(); }',
    '\n    let audioRelease:',
  );
  if (!audioDisposeFault.includes(
    'audioReleaseErrors.push(error instanceof Error ? error.message : String(error));',
  ) || !replacement.includes("audioReleaseErrors.push('audio release postcondition failed');")
    || !replacement.includes(
      'const ownerReleaseErrors = [...audioReleaseErrors, runtimeReleaseError, appChromeReleaseError]',
    )) {
    errors.push('reload-audio-fault-reporting');
  }
  if (!replacement.includes('audio: audioRelease,')) {
    errors.push('reload-audio-witness-publication');
  }
  const defaultRendererOwner = section(
    main,
    'let releaseRendererForReload = (',
    '\nlet replacementReloadScheduled =',
  );
  if (!defaultRendererOwner.includes('audio: TameGreetingAudioDiagnostics | null,')
    || !defaultRendererOwner.includes('documentToken: DOCUMENT_TOKEN, audio,')) {
    errors.push('reload-audio-witness-publication');
  }
  const rendererOwner = section(
    main,
    'releaseRendererForReload = (reason, audio): ReloadReleaseWitness => {',
    '\n  app.stage.addChild(world);',
  );
  if (!rendererOwner.includes('documentToken: DOCUMENT_TOKEN, audio,')) {
    errors.push('reload-audio-witness-publication');
  }
  if (!main.includes("tameGreetingAudioOwner?.setHidden(document.visibilityState !== 'visible');")
    || !main.includes("tameGreetingAudioOwner?.syncRoute(currentTameGreetingRouteKey());")) {
    errors.push('visibility-route-stop');
  }
  return [...new Set(errors)];
}

function replaceExact(source: string, needle: string, replacement: string): string {
  if (source.split(needle).length !== 2) throw new Error(`expected one source target: ${needle}`);
  return source.replace(needle, replacement);
}

function replaceExactInSection(
  source: string,
  start: string,
  end: string,
  needle: string,
  replacement: string,
): string {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  if (startAt < 0 || endAt < 0) throw new Error(`expected source section: ${start}`);
  const body = source.slice(startAt, endAt);
  if (body.split(needle).length !== 2) {
    throw new Error(`expected one section target: ${needle}`);
  }
  return source.slice(0, startAt) + body.replace(needle, replacement) + source.slice(endAt);
}

describe('Arc 7/8 Tame greeting — Main wiring', () => {
  it('arms only trusted native Tame and plays once after exact postcommit toast settlement', () => {
    expect(tameGreetingWiringErrors(mainSource, controllerSource)).toEqual([]);
  });

  it('negative-controls gesture trust, postcommit order, and counterpart generation', () => {
    const untrusted = replaceExact(
      controllerSource,
      "verb === 'tame' && event.isTrusted",
      "verb === 'tame'",
    );
    expect(tameGreetingWiringErrors(mainSource, untrusted)).toContain('native-tame-only-arm');

    const preToastPlay = replaceExactInSection(
      mainSource,
      'async function runCaptureCardAction(',
      '\nfunction engineeringOutcomeConverges(',
      '    toast(copy.title, copy.detail, true);',
      '    void tameGreetingAudioOwner?.playClaimedTameGreeting(greetingClaim!, {} as never);\n    toast(copy.title, copy.detail, true);',
    );
    expect(tameGreetingWiringErrors(preToastPlay, controllerSource))
      .toContain('single-play-fault-fence');

    const staleGeneration = replaceExact(
      mainSource,
      '    && receipt.generation === _toastSerial',
      '    && receipt.generation > 0',
    );
    expect(tameGreetingWiringErrors(staleGeneration, controllerSource))
      .toContain('exact-toast-counterpart');

    const hiddenCounterpart = replaceExact(
      mainSource,
      "    && toastEl.getAttribute('aria-hidden') !== 'true'",
      '    && true',
    );
    expect(tameGreetingWiringErrors(hiddenCounterpart, controllerSource))
      .toContain('exact-toast-counterpart');
  });

  it('keeps global transaction and ownership revisions distinct through publication and claim', () => {
    const oldCrossCounter = replaceExact(
      audioOwnerSource,
      'state.revision !== outcome.result.ownershipRevision',
      'state.revision !== outcome.result.revision',
    );
    expect(tameGreetingWiringErrors(mainSource, controllerSource, oldCrossCounter))
      .toContain('ownership-revision-authority');

    const globalFromOwnership = replaceExact(
      mainSource,
      '        revision: transaction.revision,',
      '        revision: verified.ownershipV2.revision,',
    );
    expect(tameGreetingWiringErrors(globalFromOwnership, controllerSource))
      .toContain('ownership-revision-authority');

    const ownershipFromGlobal = replaceExact(
      mainSource,
      '        ownershipRevision: verified.ownershipV2.revision,',
      '        ownershipRevision: transaction.revision,',
    );
    expect(tameGreetingWiringErrors(ownershipFromGlobal, controllerSource))
      .toContain('ownership-revision-authority');

    const incoherentPublication = replaceExact(
      mainSource,
      'if (verified.ownership.revision !== verified.ownershipV2.revision) {',
      'if (false) {',
    );
    expect(tameGreetingWiringErrors(incoherentPublication, controllerSource))
      .toContain('ownership-revision-authority');
  });

  it('negative-controls every reload audio field, witness publication, and disposal order', () => {
    const fieldMutants = [
      ['diagnostics.schema === TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA', 'diagnostics.schema === \'wrong-schema\''],
      ['diagnostics.disposed === true', 'diagnostics.disposed === false'],
      ['diagnostics.armed === 0', 'diagnostics.armed === 1'],
      ['diagnostics.activeVoiceId === null', 'diagnostics.activeVoiceId !== null'],
      ["diagnostics.counterpart.status === 'none'", "diagnostics.counterpart.status === 'claimed'"],
      ['diagnostics.counterpart.key === null', 'diagnostics.counterpart.key !== null'],
      ['diagnostics.counterpart.generation === null', 'diagnostics.counterpart.generation !== null'],
      ["diagnostics.counterpart.status === 'lost'", "diagnostics.counterpart.status === 'live'"],
      ["diagnostics.runtime.state === 'disposed'", "diagnostics.runtime.state === 'running'"],
      ['diagnostics.runtime.contextState === null', "diagnostics.runtime.contextState === 'running'"],
      ['diagnostics.runtime.nodes.active === 0', 'diagnostics.runtime.nodes.active === 1'],
      ['diagnostics.runtime.voices.active === 0', 'diagnostics.runtime.voices.active === 1'],
      ['diagnostics.runtime.voices.ids.length === 0', 'diagnostics.runtime.voices.ids.length === 1'],
      ['diagnostics.runtime.creatureEmitters.active === 0', 'diagnostics.runtime.creatureEmitters.active === 1'],
      ['diagnostics.runtime.reservations.voices.active === 0', 'diagnostics.runtime.reservations.voices.active === 1'],
      ['diagnostics.runtime.reservations.nodes.active === 0', 'diagnostics.runtime.reservations.nodes.active === 1'],
    ] as const;
    for (const [needle, replacement] of fieldMutants) {
      const mutant = replaceExact(mainSource, needle, replacement);
      expect(tameGreetingWiringErrors(mutant, controllerSource), needle)
        .toContain('reload-audio-postcondition');
    }

    const removed = replaceExact(
      mainSource,
      '  audio: TameGreetingAudioDiagnostics | null;\n',
      '',
    );
    expect(tameGreetingWiringErrors(removed, controllerSource))
      .toContain('reload-audio-witness-shape');

    const unpublished = replaceExact(
      mainSource,
      '    try { witness = releaseRendererForReload(reason, audioRelease); }',
      '    try { witness = releaseRendererForReload(reason, null); }',
    );
    expect(tameGreetingWiringErrors(unpublished, controllerSource))
      .toContain('replacement-release-order');

    const preDisposeSnapshot = replaceExact(
      mainSource,
      `    const audioReleaseErrors: string[] = [];
    try { await audioOwner?.dispose(); }`,
      `    const audioReleaseErrors: string[] = [];
    try { audioRelease = audioOwner?.diagnostics() ?? null; await audioOwner?.dispose(); }`,
    );
    expect(tameGreetingWiringErrors(preDisposeSnapshot, controllerSource))
      .toContain('replacement-release-order');

    const swallowedDisposeFault = replaceExact(
      mainSource,
      `    catch (error) {
      audioReleaseErrors.push(error instanceof Error ? error.message : String(error));
    }
    let audioRelease:`,
      `    catch { /* injected swallowed disposal fault */ }
    let audioRelease:`,
    );
    expect(tameGreetingWiringErrors(swallowedDisposeFault, controllerSource))
      .toContain('reload-audio-fault-reporting');

    const ignoredPostcondition = replaceExact(
      mainSource,
      "      audioReleaseErrors.push('audio release postcondition failed');",
      "      void 'injected ignored audio release postcondition';",
    );
    expect(tameGreetingWiringErrors(ignoredPostcondition, controllerSource))
      .toContain('reload-audio-fault-reporting');

    const unreportedDisposeFault = replaceExact(
      mainSource,
      'const ownerReleaseErrors = [...audioReleaseErrors, runtimeReleaseError, appChromeReleaseError]',
      'const ownerReleaseErrors = [runtimeReleaseError, appChromeReleaseError]',
    );
    expect(tameGreetingWiringErrors(unreportedDisposeFault, controllerSource))
      .toContain('reload-audio-fault-reporting');
  });
});
