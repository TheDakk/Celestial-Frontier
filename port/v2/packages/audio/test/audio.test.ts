import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GLOBAL_KEYS = ['AudioContext', 'webkitAudioContext', 'ac', 'sfxVol'] as const;
let originalGlobals = new Map<string, PropertyDescriptor | undefined>();

function setGlobal(key: string, value: unknown): void {
  Object.defineProperty(globalThis, key, {
    value, configurable: true, writable: true,
  });
}

beforeEach(() => {
  vi.resetModules();
  originalGlobals = new Map(GLOBAL_KEYS.map((key) => [
    key, Object.getOwnPropertyDescriptor(globalThis, key),
  ]));
  for (const key of GLOBAL_KEYS) {
    if (!Reflect.deleteProperty(globalThis, key)) {
      throw new Error(`audio test could not isolate globalThis.${key}`);
    }
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  for (const key of GLOBAL_KEYS) {
    const descriptor = originalGlobals.get(key);
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

class FakeAudioParam {
  value = 0;
  readonly setValues: number[] = [];
  readonly rampValues: number[] = [];
  refuseSet = false;
  traceLabel: string | null = null;

  constructor(private readonly log?: AudioLog) {}

  setValueAtTime(value: number): void {
    if (this.refuseSet) throw new Error('injected gain-parameter refusal');
    this.value = value;
    this.setValues.push(value);
    if (this.traceLabel) this.log?.events.push(`${this.traceLabel}:set:${value}`);
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
    this.rampValues.push(value);
  }
}

interface AudioLog {
  contexts: number;
  resumeCalls: number;
  resumeResolvers: Array<() => void>;
  suspendCalls: number;
  suspendResolvers: Array<() => void>;
  stateSetters: Array<(state: AudioContextState) => void>;
  events: string[];
  gainParams: FakeAudioParam[];
  oscillatorStarts: number;
  oscillatorStops: number;
  bufferStarts: number;
  bufferStops: number;
  filters: number;
}

function audioLog(): AudioLog {
  return {
    contexts: 0,
    resumeCalls: 0,
    resumeResolvers: [],
    suspendCalls: 0,
    suspendResolvers: [],
    stateSetters: [],
    events: [],
    gainParams: [],
    oscillatorStarts: 0,
    oscillatorStops: 0,
    bufferStarts: 0,
    bufferStops: 0,
    filters: 0,
  };
}

interface ContextOptions {
  state?: AudioContextState;
  rejectResume?: boolean;
  completeResume?: boolean;
  deferResume?: boolean;
  throwResume?: boolean;
  rejectSuspend?: boolean;
  deferSuspend?: boolean;
  throwSuspend?: boolean;
}

type TestAudioContextConstructor = new () => AudioContext;

function contextConstructor(
  log: AudioLog,
  options: ContextOptions = {},
): TestAudioContextConstructor {
  return class FakeAudioContext {
    readonly currentTime = 12;
    readonly sampleRate = 8;
    readonly destination = {};
    state: AudioContextState = options.state ?? 'running';

    constructor() {
      log.contexts++;
      log.stateSetters.push((state) => { this.state = state; });
    }

    resume(): Promise<void> {
      log.resumeCalls++;
      log.events.push('resume:call');
      if (options.throwResume) throw new Error('injected synchronous resume refusal');
      if (options.rejectResume) return Promise.reject(new Error('injected resume rejection'));
      if (options.deferResume) {
        return new Promise((resolve) => {
          log.resumeResolvers.push(() => {
            this.state = 'running';
            log.events.push('resume:complete');
            resolve();
          });
        });
      }
      if (options.completeResume) {
        return Promise.resolve().then(() => {
          this.state = 'running';
          log.events.push('resume:complete');
        });
      }
      return Promise.resolve();
    }

    suspend(): Promise<void> {
      log.suspendCalls++;
      log.events.push('suspend:call');
      if (options.throwSuspend) throw new Error('injected synchronous suspend refusal');
      if (options.rejectSuspend) return Promise.reject(new Error('injected suspend rejection'));
      if (options.deferSuspend) {
        return new Promise((resolve) => {
          log.suspendResolvers.push(() => {
            this.state = 'suspended';
            log.events.push('suspend:complete');
            resolve();
          });
        });
      }
      this.state = 'suspended';
      return Promise.resolve();
    }

    createGain(): GainNode {
      const gain = new FakeAudioParam(log);
      log.gainParams.push(gain);
      return {
        gain,
        context: this,
        connect: (target: unknown) => target,
      } as unknown as GainNode;
    }

    createOscillator(): OscillatorNode {
      return {
        type: 'sine',
        frequency: new FakeAudioParam(),
        detune: new FakeAudioParam(),
        connect: (target: unknown) => target,
        start: () => { log.oscillatorStarts++; },
        stop: () => { log.oscillatorStops++; },
      } as unknown as OscillatorNode;
    }

    createBuffer(_channels: number, length: number): AudioBuffer {
      const data = new Float32Array(length);
      return { getChannelData: () => data } as unknown as AudioBuffer;
    }

    createBufferSource(): AudioBufferSourceNode {
      return {
        buffer: null,
        connect: (target: unknown) => target,
        start: () => { log.bufferStarts++; },
        stop: () => { log.bufferStops++; },
      } as unknown as AudioBufferSourceNode;
    }

    createBiquadFilter(): BiquadFilterNode {
      log.filters++;
      return {
        type: 'lowpass',
        Q: new FakeAudioParam(),
        frequency: new FakeAudioParam(),
        connect: (target: unknown) => target,
      } as unknown as BiquadFilterNode;
    }
  } as unknown as TestAudioContextConstructor;
}

function throwingConstructor(attempts: { count: number }): TestAudioContextConstructor {
  return class ThrowingAudioContext {
    constructor() {
      attempts.count++;
      throw new Error('injected constructor refusal');
    }
  } as unknown as TestAudioContextConstructor;
}

describe('@cf/audio — bounded sting facade', () => {
  it('reproduces the raw pre-init defect while all four non-initializer public operations stay inert', async () => {
    const raw = await import('../src/stings.verbatim.js');
    expect(() => raw.playSurveyPing()).toThrow(ReferenceError);

    /* Give the raw module a working seam and bus. This makes the facade check
       non-vacuous: an unguarded re-export would now create nodes or retaper. */
    const log = audioLog();
    const Context = contextConstructor(log);
    const context = new Context();
    setGlobal('ac', () => context);
    setGlobal('sfxVol', 0.5);
    raw.playSurveyPing();
    expect(log.oscillatorStarts).toBe(1);
    const bus = log.gainParams.find((param) => param.setValues.includes(0.25));
    expect(bus, 'raw setup did not establish the shared squared-taper bus').toBeDefined();

    const api = await import('../src/index.js');
    expect(Object.keys(api).sort()).toEqual([
      'AUDIO_ASSET_RIGHTS_MANIFEST', 'AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT',
      'AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST', 'AUDIO_ASSET_RIGHTS_MANIFEST_VERSION',
      'AUDIO_ASSET_ROLES', 'AUDIO_CATEGORIES', 'AUDIO_KINGDOM_ORDER', 'AUDIO_LEGACY_FALLBACK',
      'AUDIO_PALETTE_POLICY', 'AUDIO_RESOLVER_VERSION', 'AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS',
      'AUDIO_ROUTE_INVENTORY_DIGEST',
      'AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION', 'AUDIO_ROUTE_MANIFEST',
      'AUDIO_ROUTE_MANIFEST_AUDIT', 'AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS',
      'AUDIO_STATIC_PURITY_RULES', 'AUDIO_TAXONOMY',
      'applySfxGain',
      'assertPinnedAudioRouteInventory', 'audioAssetRightsManifestDigest',
      'audioCatalogueRouteKey',
      'audioRouteInventoryDigest', 'audioRouteManifestRow',
      'auditAudioAssetRightsManifest', 'auditAudioLabLifecycleTrace',
      'auditAudioRouteManifest', 'auditAudioRouteSoundOutputs', 'auditAudioStaticPurity',
      'captureAudioLabSample',
      'createAudioIdentityProfile', 'createAudioRuntime', 'createAudioSignature',
      'createAudioSoundOutputWitness', 'createCreatureCallPlan',
      'createCreatureExpressionCue', 'createCreatureExpressionVoiceRequest', 'createDistantEcologyHintPlan',
      'creatureExpressionAudioEvent', 'deserializeAudioSignature',
      'distantEcologyAudioEvent', 'initAudio', 'inspectAudioStaticPurity',
      'isAudioKingdom', 'playRaritySting',
      'playSurveyPing', 'playWhoosh', 'serializeAudioSignature',
      'serializeAudioSoundOutputWitness',
    ]);
    const before = {
      oscillators: log.oscillatorStarts,
      buffers: log.bufferStarts,
      gainSets: bus!.setValues.length,
    };
    setGlobal('sfxVol', 0.2);
    expect(() => {
      api.playRaritySting(3);
      api.playSurveyPing();
      api.playWhoosh();
      api.applySfxGain();
    }).not.toThrow();
    expect(log.oscillatorStarts).toBe(before.oscillators);
    expect(log.bufferStarts).toBe(before.buffers);
    expect(bus!.setValues).toHaveLength(before.gainSets);
  });

  it('keeps init lazy, dispatches all three stings, reuses one context, and synchronizes live settings', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, { completeResume: true }));
    const api = await import('../src/index.js');
    let sound = true;
    let volume = 0.5;

    api.initAudio({ sndOn: () => sound, sfxVol: () => volume });
    expect(log.contexts, 'initAudio must not create a context').toBe(0);

    api.playRaritySting(2);
    expect(log.oscillatorStarts, 'rarity wrapper did not preserve the tier-2 route').toBe(8);
    api.playRaritySting(3);
    expect(log.oscillatorStarts, 'rarity wrapper did not forward the tier argument').toBe(23);
    const afterRarity = log.oscillatorStarts;
    api.playSurveyPing();
    expect(log.oscillatorStarts, 'survey wrapper did not start its oscillator').toBe(afterRarity + 1);
    api.playWhoosh();
    expect(log.bufferStarts, 'whoosh wrapper did not start its noise source').toBe(1);
    expect(log.filters, 'whoosh wrapper did not create its bandpass').toBe(1);
    expect(log.contexts, 'the three stings did not reuse the singleton context').toBe(1);

    const bus = log.gainParams.find((param) => param.setValues.includes(0.25));
    expect(bus, 'the shared bus did not receive the initial squared taper').toBeDefined();
    bus!.traceLabel = 'bus';
    volume = 0.3;
    api.applySfxGain();
    expect(bus!.setValues.at(-1)).toBeCloseTo(0.09, 12);

    sound = false;
    api.applySfxGain();
    expect(bus!.setValues.at(-1), 'Sound Off did not immediately zero the active bus').toBe(0);
    expect(log.suspendCalls, 'Sound Off did not invoke the context mute backstop').toBe(1);

    volume = 0.9;
    api.applySfxGain();
    expect(bus!.setValues.at(-1), 'Volume retaper escaped the master mute').toBe(0);
    expect(log.suspendCalls).toBe(2);

    const mutedStarts = log.oscillatorStarts;
    const mutedBuffers = log.bufferStarts;
    api.playRaritySting(2);
    api.playSurveyPing();
    api.playWhoosh();
    expect(log.oscillatorStarts).toBe(mutedStarts);
    expect(log.bufferStarts).toBe(mutedBuffers);

    log.events.length = 0;
    sound = true;
    api.applySfxGain();
    expect(bus!.setValues.at(-1), 'Sound On did not restore the squared Volume taper')
      .toBeCloseTo(0.81, 12);
    await Promise.resolve();
    expect(log.resumeCalls).toBe(1);
    expect(log.events).toEqual([
      'bus:set:0.81',
      'resume:call',
      'resume:complete',
    ]);
    api.playSurveyPing();
    expect(log.oscillatorStarts).toBe(mutedStarts + 1);
    expect(log.contexts).toBe(1);
  });

  it('mutes before context creation and preserves the live sound getter', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log));
    const api = await import('../src/index.js');
    let sound = false;
    let volume = 1;
    api.initAudio({ sndOn: () => sound, sfxVol: () => volume });

    api.applySfxGain();
    volume = 0.35;
    api.applySfxGain();

    api.playRaritySting(1);
    api.playSurveyPing();
    api.playWhoosh();
    expect(log.contexts).toBe(0);
    expect(log.oscillatorStarts).toBe(0);
    expect(log.bufferStarts).toBe(0);

    sound = true;
    api.playSurveyPing();
    expect(log.contexts).toBe(1);
    expect(log.oscillatorStarts).toBe(1);
  });

  it('clamps the live Volume seam before preserving the raw squared taper', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log));
    const api = await import('../src/index.js');
    let volume = 2;
    api.initAudio({ sndOn: () => true, sfxVol: () => volume });
    api.playSurveyPing();

    const bus = log.gainParams.find((param) => param.setValues.includes(1));
    expect(bus, 'the clamped shared bus was not established').toBeDefined();
    volume = -0.5;
    api.applySfxGain();
    expect(bus!.setValues.at(-1)).toBe(0);
    volume = Number.NaN;
    api.applySfxGain();
    expect(bus!.setValues.at(-1)).toBe(0);
  });

  it('falls back to context suspension when the active bus refuses its zero gain', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log));
    const api = await import('../src/index.js');
    let sound = true;
    api.initAudio({ sndOn: () => sound, sfxVol: () => 0.6 });
    api.playSurveyPing();
    const bus = log.gainParams.find((param) => param.setValues.includes(0.36));
    expect(bus, 'the shared bus was not established before the injected fault').toBeDefined();
    bus!.refuseSet = true;

    sound = false;
    expect(() => api.applySfxGain()).not.toThrow();
    expect(log.suspendCalls).toBe(1);
    const mutedStarts = log.oscillatorStarts;
    api.playSurveyPing();
    expect(log.oscillatorStarts).toBe(mutedStarts);
  });

  it('retapers and resumes after a delayed mute settles behind a rapid Off-to-On toggle', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, {
      deferSuspend: true, completeResume: true,
    }));
    const api = await import('../src/index.js');
    let sound = true;
    let volume = 0.5;
    api.initAudio({ sndOn: () => sound, sfxVol: () => volume });
    api.playSurveyPing();
    const bus = log.gainParams.find((param) => param.setValues.includes(0.25));
    expect(bus).toBeDefined();
    bus!.traceLabel = 'bus';

    sound = false;
    api.applySfxGain();
    expect(bus!.setValues.at(-1)).toBe(0);
    expect(log.suspendResolvers).toHaveLength(1);
    volume = 0.8;
    sound = true;
    log.events.length = 0;
    api.applySfxGain();
    expect(log.resumeCalls, 'On must not claim a still-running context was resumed').toBe(0);

    log.suspendResolvers.shift()!();
    await Promise.resolve();
    await Promise.resolve();
    expect(log.resumeCalls, 'the completed stale suspension was not overridden').toBe(1);
    expect(log.events).toEqual([
      'bus:set:0.6400000000000001',
      'suspend:complete',
      'bus:set:0.6400000000000001',
      'resume:call',
      'resume:complete',
    ]);
    const before = log.oscillatorStarts;
    api.playSurveyPing();
    expect(log.oscillatorStarts).toBe(before + 1);
  });

  it('lets a later Off re-suspend a deferred Settings resume when gain zero refuses', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, { deferResume: true }));
    const api = await import('../src/index.js');
    let sound = true;
    api.initAudio({ sndOn: () => sound, sfxVol: () => 0.5 });
    api.playSurveyPing();
    const bus = log.gainParams.find((param) => param.setValues.includes(0.25));
    expect(bus).toBeDefined();

    sound = false;
    api.applySfxGain();
    sound = true;
    api.applySfxGain();
    expect(log.resumeResolvers).toHaveLength(1);
    bus!.refuseSet = true;
    sound = false;
    expect(() => api.applySfxGain()).not.toThrow();
    expect(log.suspendCalls).toBe(2);

    log.resumeResolvers.shift()!();
    await Promise.resolve();
    await Promise.resolve();
    expect(log.suspendCalls, 'the stale resume completion did not reassert master mute').toBe(3);
  });

  it('tracks a source-triggered resume and lets later Sound Off win after gain refusal', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, { deferResume: true }));
    const api = await import('../src/index.js');
    let sound = true;
    api.initAudio({ sndOn: () => sound, sfxVol: () => 0.5 });
    api.playSurveyPing();
    const bus = log.gainParams.find((param) => param.setValues.includes(0.25));
    expect(bus).toBeDefined();
    log.stateSetters[0]!('suspended');

    const before = log.oscillatorStarts;
    api.playSurveyPing();
    api.playSurveyPing();
    expect(log.resumeCalls, 'a second source bypassed the tracked pending resume').toBe(1);
    expect(log.oscillatorStarts).toBe(before);
    expect(log.resumeResolvers).toHaveLength(1);

    bus!.refuseSet = true;
    sound = false;
    expect(() => api.applySfxGain()).not.toThrow();
    expect(log.suspendCalls).toBe(1);
    log.resumeResolvers.shift()!();
    await Promise.resolve();
    await Promise.resolve();
    expect(log.suspendCalls, 'the stale source resume escaped master Sound Off').toBe(2);
  });

  it.each([
    ['asynchronous', { rejectSuspend: true }],
    ['synchronous', { throwSuspend: true }],
  ] as const)('contains an %s context-suspension refusal after zeroing the bus', async (_kind, options) => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, options));
    const api = await import('../src/index.js');
    let sound = true;
    api.initAudio({ sndOn: () => sound, sfxVol: () => 0.7 });
    api.playSurveyPing();
    const bus = log.gainParams.find((param) =>
      param.setValues.some((value) => Math.abs(value - 0.49) < 1e-12));
    expect(bus).toBeDefined();

    sound = false;
    expect(() => api.applySfxGain()).not.toThrow();
    await Promise.resolve();
    expect(bus!.setValues.at(-1)).toBe(0);
    expect(log.suspendCalls).toBe(1);
    const mutedStarts = log.oscillatorStarts;
    api.playSurveyPing();
    expect(log.oscillatorStarts).toBe(mutedStarts);
  });

  it.each([
    ['asynchronous', { rejectResume: true }],
    ['synchronous', { throwResume: true }],
  ] as const)('contains an %s Settings-sync resume refusal after restoring the taper', async (_kind, options) => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, options));
    const api = await import('../src/index.js');
    let sound = true;
    api.initAudio({ sndOn: () => sound, sfxVol: () => 0.4 });
    api.playSurveyPing();
    const bus = log.gainParams.find((param) =>
      param.setValues.some((value) => Math.abs(value - 0.16) < 1e-12));
    expect(bus).toBeDefined();

    sound = false;
    api.applySfxGain();
    sound = true;
    expect(() => api.applySfxGain()).not.toThrow();
    expect(log.resumeCalls, 'Settings sync did not reach the injected resume refusal').toBe(1);
    expect(bus!.setValues.at(-1)).toBeCloseTo(0.16, 12);
    await Promise.resolve();
  });

  it('does not enable the facade until both global seams install successfully', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log));
    const api = await import('../src/index.js');
    const defineProperty = Object.defineProperty;
    const seamFailure = vi.spyOn(Object, 'defineProperty').mockImplementation(
      (target, property, attributes) => {
        if (target === globalThis && property === 'sfxVol') {
          throw new TypeError('injected seam refusal');
        }
        return defineProperty(target, property, attributes);
      },
    );

    expect(() => api.initAudio({ sndOn: () => true, sfxVol: () => 1 }))
      .toThrow('injected seam refusal');
    seamFailure.mockRestore();
    api.playSurveyPing();
    expect(log.contexts, 'a partially installed seam must not enable dispatch').toBe(0);

    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });
    api.playSurveyPing();
    expect(log.contexts).toBe(1);
    expect(log.oscillatorStarts).toBe(1);
  });

  it('delegates after initialization without adding a facade-level catch', async () => {
    const api = await import('../src/index.js');
    api.initAudio({
      sndOn: () => { throw new Error('injected application seam failure'); },
      sfxVol: () => 1,
    });

    expect(() => api.playSurveyPing()).toThrow('injected application seam failure');
  });

  it('prefers the standard constructor when both standard and WebKit constructors exist', async () => {
    const standard = audioLog();
    const webkit = audioLog();
    setGlobal('AudioContext', contextConstructor(standard));
    setGlobal('webkitAudioContext', contextConstructor(webkit));
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });
    api.playSurveyPing();

    expect(standard.contexts).toBe(1);
    expect(standard.oscillatorStarts).toBe(1);
    expect(webkit.contexts).toBe(0);
  });

  it('does not fall back to WebKit when the present standard constructor refuses creation', async () => {
    const standardAttempts = { count: 0 };
    const webkit = audioLog();
    setGlobal('AudioContext', throwingConstructor(standardAttempts));
    setGlobal('webkitAudioContext', contextConstructor(webkit));
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });

    expect(() => api.playSurveyPing()).not.toThrow();
    expect(standardAttempts.count).toBe(1);
    expect(webkit.contexts).toBe(0);
    expect(webkit.oscillatorStarts).toBe(0);
  });

  it('uses the WebKit fallback when the standard constructor is absent', async () => {
    const webkit = audioLog();
    setGlobal('AudioContext', undefined);
    setGlobal('webkitAudioContext', contextConstructor(webkit));
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });
    api.playSurveyPing();

    expect(webkit.contexts).toBe(1);
    expect(webkit.oscillatorStarts).toBe(1);
  });

  it('fails silently when constructors are absent or refuse creation', async () => {
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });
    expect(() => {
      api.playRaritySting(1);
      api.playSurveyPing();
      api.playWhoosh();
    }).not.toThrow();

    const standardAttempts = { count: 0 };
    setGlobal('AudioContext', throwingConstructor(standardAttempts));
    expect(() => api.playSurveyPing()).not.toThrow();
    expect(standardAttempts.count).toBe(1);

    const webkitAttempts = { count: 0 };
    setGlobal('AudioContext', undefined);
    setGlobal('webkitAudioContext', throwingConstructor(webkitAttempts));
    expect(() => api.playWhoosh()).not.toThrow();
    expect(webkitAttempts.count).toBe(1);
  });

  it('contains a suspended-context resume rejection without creating a second context', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, {
      state: 'suspended', rejectResume: true,
    }));
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });

    expect(() => api.playSurveyPing()).not.toThrow();
    await Promise.resolve();
    expect(log.contexts).toBe(1);
    expect(log.resumeCalls).toBe(1);
    expect(log.oscillatorStarts).toBe(0);

    expect(() => api.playWhoosh()).not.toThrow();
    await Promise.resolve();
    expect(log.contexts).toBe(1);
    expect(log.resumeCalls).toBe(2);
    expect(log.bufferStarts).toBe(0);
  });

  it('uses a successfully resumed suspended singleton on the next dispatch', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, {
      state: 'suspended', completeResume: true,
    }));
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });

    api.playSurveyPing();
    expect(log.contexts).toBe(1);
    expect(log.resumeCalls).toBe(1);
    expect(log.oscillatorStarts).toBe(0);
    await Promise.resolve();

    api.playSurveyPing();
    expect(log.contexts).toBe(1);
    expect(log.resumeCalls).toBe(1);
    expect(log.oscillatorStarts).toBe(1);
  });

  it('contains a synchronous suspended-context resume refusal', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log, {
      state: 'suspended', throwResume: true,
    }));
    const api = await import('../src/index.js');
    api.initAudio({ sndOn: () => true, sfxVol: () => 1 });

    expect(() => api.playSurveyPing()).not.toThrow();
    expect(() => api.playWhoosh()).not.toThrow();
    expect(log.contexts).toBe(1);
    expect(log.resumeCalls).toBe(2);
    expect(log.oscillatorStarts).toBe(0);
    expect(log.bufferStarts).toBe(0);
  });
});
