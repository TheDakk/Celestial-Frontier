import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(
  new URL('../apps/game/src/compendium-feed.ts', import.meta.url), 'utf8',
);
const actionSource = readFileSync(
  new URL('../apps/game/src/arc5-feed-action.ts', import.meta.url), 'utf8',
);
const audioOwnerSource = readFileSync(
  new URL('../apps/game/src/tame-greeting-audio.ts', import.meta.url), 'utf8',
);

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}

function replaceExact(source: string, needle: string, replacement: string): string {
  const count = source.split(needle).length - 1;
  if (count !== 1) throw new Error(`Expected one mutation target, found ${count}: ${needle}`);
  return source.replace(needle, replacement);
}

function replaceFeedCommit(source: string, needle: string, replacement: string): string {
  const owner = section(source, 'async function commitCompendiumFeedAction(',
    '\nfunction compendiumFeedOutcomeCopy(');
  if (owner.length === 0) throw new Error('Missing exact Feed commit owner');
  return replaceExact(source, owner, replaceExact(owner, needle, replacement));
}

function replaceFeedPresentation(source: string, needle: string, replacement: string): string {
  const owner = section(source, 'async function runCompendiumFeedAction(',
    '\ntype Arc5ExplorerMealCommitOutcome');
  if (owner.length === 0) throw new Error('Missing exact Feed presentation owner');
  return replaceExact(source, owner, replaceExact(owner, needle, replacement));
}

function contractErrors(
  main: string,
  controller = controllerSource,
  action = actionSource,
  audioOwner = audioOwnerSource,
): string[] {
  const errors: string[] = [];
  const commit = section(
    main,
    'async function commitCompendiumFeedAction(',
    '\nfunction compendiumFeedOutcomeCopy(',
  );
  const presentation = section(
    main,
    'async function runCompendiumFeedAction(',
    '\ntype Arc5ExplorerMealCommitOutcome',
  );
  const controllerOwner = section(
    main,
    'const compendiumFeedController = new CompendiumFeedController({',
    '\nfunction projectCurrentCompendiumFeed(',
  );
  const detail = section(main, 'function fillCodexDetail(', '\nfunction fillRecords(');
  const selector = section(main, 'const READ_ONLY_MUTATION_SELECTOR = [', "\n].join(',');");
  const controllerClick = section(
    controller,
    '  readonly #onClick = (event: Event): void => {',
    '\n  #render(): void {',
  );
  const audioOwnerClass = section(
    audioOwner,
    'class BrowserTameGreetingAudioOwner',
    '\nexport function createTameGreetingAudioOwner(',
  );
  const feedClaim = section(
    audioOwnerClass,
    '  claimCommittedFeedExpression(',
    '\n  async playClaimedFeedExpression(',
  );
  const expressionPlay = section(
    audioOwnerClass,
    '  async #playClaimedExpression(',
    '\n  cancelTameAttempt(',
  );
  const feedCounterpart = section(
    main,
    'function compendiumFeedStatusCounterpartIsCurrent(',
    '\nfunction creatureExpressionCounterpartIsCurrent(',
  );
  const feedCounterpartBind = section(
    main,
    'function bindCompendiumFeedStatusCounterpart(',
    '\nfunction currentTameGreetingRouteKey(',
  );
  const ordinaryToast = section(
    main,
    'function showToast(',
    '\nfunction showCompendiumFeedVisualToast(',
  );
  const feedVisualToast = section(
    main,
    'function showCompendiumFeedVisualToast(',
    '\nfunction toast(',
  );

  const launchAction = controllerOwner.indexOf('void runCompendiumFeedAction(request);');
  if (!controllerOwner.includes('onAction: (request) => {') || launchAction < 0) {
    errors.push('controller-action-owner');
  }
  const directGestureOwner = [
    'onNativeFeedGesture: () => {',
    '    invalidateCompendiumFeedStatusCounterpart();',
    '    tameGreetingAudioOwner?.armNativeFeedGesture();',
    '  },',
    '  onAction: (request) => {',
    '    void runCompendiumFeedAction(request);',
    '  },',
  ].join('\n');
  const pending = controllerClick.indexOf('this.#pending = request;');
  const render = controllerClick.indexOf('this.#render();', pending);
  const nativeArm = controllerClick.indexOf('if (event.isTrusted) this.#onNativeFeedGesture?.();');
  const dispatch = controllerClick.indexOf('this.#onAction?.(request);');
  if (!controllerOwner.includes(directGestureOwner)
    || !(pending >= 0 && render > pending && nativeArm > render && dispatch > nativeArm)
    || controllerClick.split('this.#onNativeFeedGesture?.();').length - 1 !== 1) {
    errors.push('trusted-native-feed-arm');
  }
  if (controllerOwner.includes('prepareStingAudioForGesture')
    || presentation.includes('prepareStingAudioForGesture')
    || presentation.includes('playSurveyPing')) {
    errors.push('no-generic-feed-audio');
  }
  if (main.split('createTameGreetingAudioOwner({').length - 1 !== 1
    || main.split('new AudioContext()').length - 1 !== 1
    || audioOwner.split('createAudioRuntime({').length - 1 !== 1) {
    errors.push('single-creature-audio-owner');
  }
  if (!detail.includes('data-arc5-feed-body')
    || !detail.includes('compendiumFeedController.attach(')
    || !detail.includes("feedModel.availability !== 'non-fauna'")
    || !detail.includes("feedModel.availability !== 'fixture'")) {
    errors.push('real-fauna-detail-mount');
  }
  if (!selector.includes("'[data-arc5-feed-confirm]'")) errors.push('read-only-selector');

  const claim = commit.indexOf("productActionCoordinator.tryClaim('arc5.companion-feed')");
  const firstAwait = commit.indexOf('await ');
  if (claim < 0 || firstAwait < 0 || claim > firstAwait) errors.push('claim-before-first-await');
  for (const marker of [
    'const parent = arc5OwnershipState;',
    'const parentEvidence = arc5OwnershipEvidence;',
    'const parentRevision = parent.revision;',
    'const parentDigest = ownershipStateDigestV2(parent);',
  ]) if (!commit.includes(marker) || commit.indexOf(marker) > firstAwait) {
    errors.push(`captured-before-await:${marker}`);
  }
  if (commit.split('commitArc5FeedActionV1({').length - 1 !== 1) {
    errors.push('one-feed-attempt');
  }
  if (!commit.includes('arc5FeedWritesMatchFixedInventory(attempt)')
    || !main.includes('attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length')
    || !main.includes('write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment')
    || !main.includes('write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace')) {
    errors.push('exact-five-carriers');
  }
  for (const marker of [
    'arc5OwnershipState = attempt.ownershipV2;',
    'arc5OwnershipEvidence = attempt.ownershipV2Evidence;',
    'arc5OwnershipProtection = null;',
  ]) if (!commit.includes(marker)) errors.push(`verified-publication:${marker}`);
  if (/\barc4OwnershipState\s*=|\bsave\.[A-Za-z0-9_$]+\s*=/u.test(commit)) {
    errors.push('cross-owner-publication');
  }
  if (/\b(?:for|while)\s*\([^)]*\)[\s\S]{0,600}commitArc5FeedActionV1\(/u.test(commit)) {
    errors.push('feed-retry-loop');
  }

  const settle = presentation.indexOf('compendiumFeedController.settle(copy);');
  const refresh = presentation.indexOf('refreshCompendiumFeedState();');
  const toast = presentation.indexOf('showCompendiumFeedVisualToast(copy.title, copy.detail);');
  const audioClaim = presentation.indexOf('?.claimCommittedFeedExpression(outcome, arc5OwnershipState)');
  const bind = presentation.indexOf('bindCompendiumFeedStatusCounterpart(');
  const sound = presentation.indexOf('playClaimedFeedExpression(feedClaim, counterpart)');
  if (!(settle >= 0 && refresh > settle && toast > refresh
    && audioClaim > toast && bind > audioClaim && sound > bind)) {
    errors.push('settled-visible-event-order');
  }
  if (presentation.includes('toast(copy.title, copy.detail, true);')
    || presentation.split('showCompendiumFeedVisualToast(copy.title, copy.detail);').length - 1 !== 1) {
    errors.push('single-accessible-feed-status');
  }
  const ordinaryRole = ordinaryToast.indexOf("toastEl.setAttribute('role', 'status');");
  const ordinaryLive = ordinaryToast.indexOf(
    "toastEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');",
  );
  const ordinaryHidden = ordinaryToast.indexOf("toastEl.removeAttribute('aria-hidden');");
  const ordinaryContent = ordinaryToast.indexOf('toastEl.innerHTML =');
  if (!(ordinaryRole >= 0 && ordinaryLive > ordinaryRole && ordinaryHidden > ordinaryLive
    && ordinaryContent > ordinaryHidden)) {
    errors.push('ordinary-toast-accessibility-restore');
  }
  const visualRole = feedVisualToast.indexOf("toastEl.setAttribute('role', 'presentation');");
  const visualLive = feedVisualToast.indexOf("toastEl.setAttribute('aria-live', 'off');");
  const visualHidden = feedVisualToast.indexOf("toastEl.setAttribute('aria-hidden', 'true');");
  const visualContent = feedVisualToast.indexOf('toastEl.innerHTML =');
  if (!(visualRole >= 0 && visualLive > visualRole && visualHidden > visualLive
    && visualContent > visualHidden)) {
    errors.push('feed-visual-toast-at-exclusion');
  }
  if (!presentation.includes("cancelFeedAttempt('counterpart-unavailable')")
    || !presentation.includes("releaseCompendiumFeedExpression('presentation-fault')")) {
    errors.push('feed-presentation-fail-closed');
  }
  for (const marker of [
    "if (arm.kind !== 'feed')",
    "outcome.kind !== 'committed'",
    "outcome.durability !== 'committed'",
    "outcome.convergence !== 'none'",
    'state.revision !== result.ownershipRevision',
    'state.creatures.find((row) => row.creatureId === result.creatureId)',
    'creature.fed !== result.fedAfter',
    '`arc5:feed-completed:${result.revision}:${result.receiptOrdinal}:${creature.creatureId}`',
    'this.#claimedFeedOwnership?.eventKey === eventKey',
    'result.ownershipRevision <= this.#claimedFeedOwnership.ownershipRevision',
    'this.#claimedFeedOwnership = Object.freeze({',
    "expressionKind: 'feed-completed'",
  ]) if (!feedClaim.includes(marker)) errors.push(`exact-feed-claim:${marker}`);
  for (const marker of [
    "{ kind: 'feed-completed' as const, outcome: 'accepted' as const }",
    'eventKey: record.eventKey',
    'captionKey: counterpart.counterpartKey',
    'started = this.#runtime.playVoice(request);',
    "if (started.kind !== 'started')",
  ]) if (!expressionPlay.includes(marker)) errors.push(`exact-feed-play:${marker}`);
  for (const marker of [
    'diagnostics.pendingWork === 0',
    'diagnostics.lastOutcome === registered.outcome',
    'diagnostics.surfaceKey === registered.outcome.request.surface.surfaceKey',
    'codexGeneration === registered.outcome.request.surface.generation',
    "codexMode === 'detail'",
    "openPanelId() === 'codex'",
    'ownership.revision === registered.result.ownershipRevision',
    'creature?.fed === registered.result.fedAfter',
    'status.isConnected',
    '!status.hidden',
    "status.closest('[hidden],[inert]') === null",
    "status.getAttribute('role') === 'status'",
    "status.getAttribute('aria-live') === 'polite'",
    "status.getAttribute('aria-atomic') === 'true'",
    "status.dataset.kind === 'committed'",
    "status.dataset.convergence === 'none'",
    'status.textContent === `${registered.outcome.title} ${registered.outcome.detail}`',
  ]) if (!feedCounterpart.includes(marker)) errors.push(`settled-feed-counterpart:${marker}`);
  if (!feedCounterpartBind.includes("outcome.kind !== 'committed'")
    || !feedCounterpartBind.includes("outcome.convergence !== 'none'")
    || !feedCounterpartBind.includes('compendiumFeedStatusCounterpartIsCurrent(receipt)')) {
    errors.push('feed-counterpart-bind');
  }
  if (main.split("releaseCompendiumFeedExpression('detail-closed')").length - 1 !== 1
    || main.split("releaseCompendiumFeedExpression('detail-replaced')").length - 1 !== 2) {
    errors.push('feed-counterpart-lifecycle');
  }
  if (!main.includes("if (openPanelId() === 'codex' && codexMode === 'detail') {\n        refreshCompendiumFeedState();")) {
    errors.push('convergence-repaint');
  }
  if (!main.includes("heartbeatOwned && openPanelId() === 'codex' && codexMode === 'detail'")) {
    errors.push('heartbeat-refresh');
  }

  if (!controller.includes('ownership.revision === MAX_OWNERSHIP_REVISION')
    || !controller.includes('reached its revision ceiling')) {
    errors.push('ceiling-projection');
  }
  if (!action.includes("preflight.reason === 'ownership-revision-exhausted'")
    || !action.includes("? 'read-only-reload' : 'none'")) {
    errors.push('ceiling-action');
  }
  return errors;
}

describe('player-live Compendium Feed wiring', () => {
  it('owns one exact nonoptimistic action from real fauna detail through durable publication', () => {
    expect(contractErrors(mainSource)).toEqual([]);
  });

  it('rejects broken ownership, retry, publication, audio, counterpart and ceiling wiring', () => {
    const mutants: Array<[string, string, string, string?]> = [
      [
        'claim removed',
        replaceFeedCommit(
          mainSource,
          "productActionCoordinator.tryClaim('arc5.companion-feed')",
          "productActionCoordinator.peek('arc5.companion-feed')",
        ),
        'claim-before-first-await',
      ],
      [
        'await before claim',
        replaceFeedCommit(
          mainSource,
          "  const actionClaim = productActionCoordinator.tryClaim('arc5.companion-feed');",
          "  await Promise.resolve();\n  const actionClaim = productActionCoordinator.tryClaim('arc5.companion-feed');",
        ),
        'claim-before-first-await',
      ],
      [
        'second attempt',
        replaceFeedCommit(
          mainSource,
          'attempt = await commitArc5FeedActionV1({',
          'void commitArc5FeedActionV1({ ...({} as never) });\n      attempt = await commitArc5FeedActionV1({',
        ),
        'one-feed-attempt',
      ],
      [
        'carrier check removed',
        replaceFeedCommit(mainSource, 'arc5FeedWritesMatchFixedInventory(attempt)', 'true'),
        'exact-five-carriers',
      ],
      [
        'cross-owner publication',
        replaceFeedCommit(
          mainSource,
          'arc5OwnershipState = attempt.ownershipV2;',
          'arc4OwnershipState = attempt.ownershipV2 as never;',
        ),
        'cross-owner-publication',
      ],
      [
        'sound before settlement',
        replaceExact(
          mainSource,
          '    compendiumFeedController.settle(copy);',
          '    void tameGreetingAudioOwner?.playClaimedFeedExpression(feedClaim, counterpart);\n'
            + '    compendiumFeedController.settle(copy);',
        ),
        'settled-visible-event-order',
      ],
      [
        'native Feed owner removed',
        replaceExact(mainSource, '    tameGreetingAudioOwner?.armNativeFeedGesture();\n', ''),
        'trusted-native-feed-arm',
      ],
      [
        'generic Feed ping restored',
        replaceExact(
          mainSource,
          '    updateChips();\n    showCompendiumFeedVisualToast(copy.title, copy.detail);\n'
            + '    const feedClaim: FeedExpressionClaim | null = tameGreetingAudioOwner',
          '    updateChips();\n    showCompendiumFeedVisualToast(copy.title, copy.detail);\n    playSurveyPing();\n'
            + '    const feedClaim: FeedExpressionClaim | null = tameGreetingAudioOwner',
        ),
        'no-generic-feed-audio',
      ],
      [
        'Feed restored the duplicate assertive global announcement',
        replaceFeedPresentation(
          mainSource,
          '    showCompendiumFeedVisualToast(copy.title, copy.detail);',
          '    toast(copy.title, copy.detail, true);',
        ),
        'single-accessible-feed-status',
      ],
      [
        'Feed visual carrier lost presentation-only role',
        replaceExact(
          mainSource,
          "  toastEl.setAttribute('role', 'presentation');",
          "  toastEl.setAttribute('role', 'status');",
        ),
        'feed-visual-toast-at-exclusion',
      ],
      [
        'Feed visual carrier lost live-off exclusion',
        replaceExact(
          mainSource,
          "  toastEl.setAttribute('aria-live', 'off');",
          "  toastEl.setAttribute('aria-live', 'assertive');",
        ),
        'feed-visual-toast-at-exclusion',
      ],
      [
        'Feed visual carrier lost aria-hidden exclusion',
        replaceExact(
          mainSource,
          "  toastEl.setAttribute('aria-hidden', 'true');",
          "  toastEl.removeAttribute('aria-hidden');",
        ),
        'feed-visual-toast-at-exclusion',
      ],
      [
        'Feed supplemental carrier became a second accessible assertive status',
        replaceExact(
          mainSource,
          "  toastEl.setAttribute('role', 'presentation');\n"
            + "  toastEl.setAttribute('aria-live', 'off');\n"
            + "  toastEl.setAttribute('aria-hidden', 'true');",
          "  toastEl.setAttribute('role', 'status');\n"
            + "  toastEl.setAttribute('aria-live', 'assertive');\n"
            + "  toastEl.removeAttribute('aria-hidden');",
        ),
        'feed-visual-toast-at-exclusion',
      ],
      [
        'ordinary toast failed to restore accessible status semantics',
        replaceExact(
          mainSource,
          "  toastEl.setAttribute('role', 'status');\n"
            + "  toastEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');\n"
            + "  toastEl.removeAttribute('aria-hidden');",
          "  toastEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');",
        ),
        'ordinary-toast-accessibility-restore',
      ],
      [
        'counterpart pending check removed',
        replaceExact(
          mainSource,
          '    && diagnostics.pendingWork === 0',
          '    && true',
        ),
        'settled-feed-counterpart:diagnostics.pendingWork === 0',
      ],
      [
        'counterpart current outcome check removed',
        replaceExact(
          mainSource,
          '    && diagnostics.lastOutcome === registered.outcome',
          '    && diagnostics.lastOutcome !== null',
        ),
        'settled-feed-counterpart:diagnostics.lastOutcome === registered.outcome',
      ],
      [
        'counterpart accessibility role weakened',
        replaceExact(
          mainSource,
          "    && status.getAttribute('role') === 'status'",
          "    && status.getAttribute('role') !== null",
        ),
        "settled-feed-counterpart:status.getAttribute('role') === 'status'",
      ],
      [
        'counterpart exact text weakened',
        replaceExact(
          mainSource,
          '    && status.textContent === `${registered.outcome.title} ${registered.outcome.detail}`',
          '    && status.textContent !== null',
        ),
        'settled-feed-counterpart:status.textContent === `${registered.outcome.title} ${registered.outcome.detail}`',
      ],
      [
        'read-only selector removed',
        replaceExact(mainSource, "  '[data-arc5-feed-confirm]',\n", ''),
        'read-only-selector',
      ],
    ];
    for (const [label, mutant, expected] of mutants) {
      expect(contractErrors(mutant), label).toContain(expected);
    }

    expect(contractErrors(
      mainSource,
      replaceExact(
        controllerSource,
        'ownership.revision === MAX_OWNERSHIP_REVISION',
        'false',
      ),
    )).toContain('ceiling-projection');
    expect(contractErrors(
      mainSource,
      controllerSource,
      actionSource.replace(
        "preflight.reason === 'ownership-revision-exhausted'",
        'false',
      ),
    )).toContain('ceiling-action');

    expect(contractErrors(
      mainSource,
      replaceExact(
        controllerSource,
        'if (event.isTrusted) this.#onNativeFeedGesture?.();',
        'this.#onNativeFeedGesture?.();',
      ),
    )).toContain('trusted-native-feed-arm');
    expect(contractErrors(
      mainSource,
      replaceExact(
        controllerSource,
        '      if (event.isTrusted) this.#onNativeFeedGesture?.();\n      this.#onAction?.(request);',
        '      this.#onAction?.(request);\n      if (event.isTrusted) this.#onNativeFeedGesture?.();',
      ),
    )).toContain('trusted-native-feed-arm');

    for (const [label, mutant, expected] of [
      [
        'ownership successor revision removed',
        replaceExact(audioOwnerSource, 'state.revision !== result.ownershipRevision', 'false'),
        'exact-feed-claim:state.revision !== result.ownershipRevision',
      ],
      [
        'exact successor creature removed',
        replaceExact(
          audioOwnerSource,
          'state.creatures.find((row) => row.creatureId === result.creatureId)',
          'state.creatures[0]',
        ),
        'exact-feed-claim:state.creatures.find((row) => row.creatureId === result.creatureId)',
      ],
      [
        'fed successor value removed',
        replaceExact(audioOwnerSource, 'creature.fed !== result.fedAfter', 'false'),
        'exact-feed-claim:creature.fed !== result.fedAfter',
      ],
      [
        'Feed expression kind replaced',
        replaceExact(
          audioOwnerSource,
          "{ kind: 'feed-completed' as const, outcome: 'accepted' as const }",
          "{ kind: 'selected' as never, outcome: 'accepted' as const }",
        ),
        "exact-feed-play:{ kind: 'feed-completed' as const, outcome: 'accepted' as const }",
      ],
      [
        'Feed replay fence removed',
        replaceExact(
          audioOwnerSource,
          "if (eventKey.length > 192) return silent('feed-event-key-invalid');\n"
            + "    if (this.#claimedFeedOwnership?.eventKey === eventKey) {\n"
            + "      return silent('event-already-claimed');\n"
            + '    }',
          "if (eventKey.length > 192) return silent('feed-event-key-invalid');\n"
            + "    if (false) return silent('event-already-claimed');",
        ),
        'exact-feed-claim:this.#claimedFeedOwnership?.eventKey === eventKey',
      ],
      [
        'Feed bounded ownership revision fence removed',
        replaceExact(
          audioOwnerSource,
          'result.ownershipRevision <= this.#claimedFeedOwnership.ownershipRevision',
          'false',
        ),
        'exact-feed-claim:result.ownershipRevision <= this.#claimedFeedOwnership.ownershipRevision',
      ],
    ] satisfies ReadonlyArray<readonly [string, string, string]>) {
      expect(contractErrors(mainSource, controllerSource, actionSource, mutant), label)
        .toContain(expected);
    }
  });
});
