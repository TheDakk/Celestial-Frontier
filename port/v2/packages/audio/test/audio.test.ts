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

  setValueAtTime(value: number): void {
    this.value = value;
    this.setValues.push(value);
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
    this.rampValues.push(value);
  }
}

interface AudioLog {
  contexts: number;
  resumeCalls: number;
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
  throwResume?: boolean;
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
    }

    resume(): Promise<void> {
      log.resumeCalls++;
      if (options.throwResume) throw new Error('injected synchronous resume refusal');
      if (options.rejectResume) return Promise.reject(new Error('injected resume rejection'));
      if (options.completeResume) {
        return Promise.resolve().then(() => { this.state = 'running'; });
      }
      return Promise.resolve();
    }

    createGain(): GainNode {
      const gain = new FakeAudioParam();
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
      'AUDIO_CATEGORIES', 'AUDIO_PALETTE_POLICY', 'AUDIO_RESOLVER_VERSION', 'applySfxGain',
      'createAudioIdentityProfile', 'createAudioRuntime', 'createAudioSignature', 'createCreatureCallPlan',
      'createCreatureExpressionCue', 'createDistantEcologyHintPlan',
      'creatureExpressionAudioEvent', 'deserializeAudioSignature',
      'distantEcologyAudioEvent', 'initAudio', 'playRaritySting', 'playSurveyPing',
      'playWhoosh', 'serializeAudioSignature',
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

  it('keeps init lazy, dispatches all three stings, reuses one context, and reads live settings', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log));
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
    volume = 0.3;
    api.applySfxGain();
    expect(bus!.setValues.at(-1)).toBeCloseTo(0.09, 12);

    sound = false;
    const mutedStarts = log.oscillatorStarts;
    api.playSurveyPing();
    expect(log.oscillatorStarts).toBe(mutedStarts);
    sound = true;
    api.playSurveyPing();
    expect(log.oscillatorStarts).toBe(mutedStarts + 1);
    expect(log.contexts).toBe(1);
  });

  it('mutes before context creation and preserves the live sound getter', async () => {
    const log = audioLog();
    setGlobal('AudioContext', contextConstructor(log));
    const api = await import('../src/index.js');
    let sound = false;
    api.initAudio({ sndOn: () => sound, sfxVol: () => 1 });

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
