import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import { planCombatSettlementV1, projectGuardianPrimeEncounterV1, runDuel } from '@cf/domain-combatcore';
import { createAudioRuntime, AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, type AudioContextLike,
  type AudioCounterpartReceipt, type AudioVoiceRequest } from '../../packages/audio/src/runtime.js';
import { combatCuePlan, projectCombatCueParticipantsV1 } from '../../packages/audio/src/combat-cues.js';
import { createCombatGameplayVoiceRequest } from '../../packages/audio/src/combat-gameplay-voice.js';

const RATE = 48000, LENGTH = 19200, LEVEL = 0.02;
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw Error(message); }
type CaseKind = 'overlap' | 'interruption';
type Fault = 'none' | 'neutral' | 'immediate' | 'early-restore';
type Mark = { action: string; time: number; ownerCount: number; musicBase: number; ambienceBase: number };
type NodeRecord = { node: AudioNode; owner: 'runtime' | 'observer'; kind: string; disconnects: number; edges: Set<AudioNode> };
interface Observation {
  kind: CaseKind; fault: Fault; marks: Mark[]; rate: number; frames: number;
  channels: Float32Array[]; cleanup: Record<string, unknown>; identity: Record<string, unknown>;
  automation: { bus: string; method: string; args: number[] }[];
}

function fixture() {
  installCaptureHooks();
  const world = resolveCF1WorldAddress({ galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
    star: { seed: 4077594722, x: -271.54, y: -67.36 }, planet: { seed: 488332735 } });
  requireValue(world.ok, 'Fixed native audio world must resolve');
  const encounter = projectGuardianPrimeEncounterV1({ world: world.address, descriptor: { worldType: 'airless' }, regionIndex: 0,
    faunaRoster: [{ speciesId: 'audio-impact-defender', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: [], conquered: false });
  requireValue(encounter, 'Fixed native audio encounter must exist');
  const genome = makeGenome(1, 'fauna', 0.5);
  const champion = { kind: 'owned-fauna' as const, creatureId: 'native-mix-champion-1', name: 'Native Mix Champion', genome, legacyBredLineage: true };
  const transcript = runDuel({ name: champion.name, genome }, { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome });
  const winner = (transcript as { winner?: unknown }).winner;
  const settled = planCombatSettlementV1({ battleId: 'native-mix-fixed-duel-1', receiptOrdinal: 41, encounter, champion, transcript,
    outcome: winner === 'A' ? 'champion-win' : winner === 'B' ? 'defender-win' : 'draw', worldTier: 4,
    authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 } } });
  requireValue(settled.status === 'planned', 'Fixed native audio duel must produce registered settlement');
  const plan = combatCuePlan(settled, projectCombatCueParticipantsV1(settled));
  const cues = plan.cues.slice(0, 2);
  requireValue(cues.length === 2, 'Two registered cues required');
  const counterparts = cues.map(cue => ({ counterpartKey: cue.counterparts[0]!.captionToken, eventKey: cue.cueId, generation: 1 }));
  document.getElementById('captions')!.textContent = cues.map(cue => cue.counterparts[0]!.captionToken).join('\n');
  return { plan, cues, counterparts };
}

function encode(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let text = '';
  for (let index = 0; index < bytes.length; index += 8192) text += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(text);
}

async function observe(kind: CaseKind, fault: Fault): Promise<Observation> {
  const canonical = fixture();
  const offline = new OfflineAudioContext(3, LENGTH, RATE);
  const records: NodeRecord[] = [], runtimeGains: GainNode[] = [];
  const automation: Observation['automation'] = [];
  const own = <T extends AudioNode>(node: T, owner: NodeRecord['owner'], label: string): T => {
    const row: NodeRecord = { node, owner, kind: label, disconnects: 0, edges: new Set() }; records.push(row);
    const connect = node.connect, disconnect = node.disconnect;
    Object.defineProperty(node, 'connect', { configurable: true, value: (...args: unknown[]) => {
      const result = Reflect.apply(connect, node, args); row.edges.add(args[0] as AudioNode); return result;
    } });
    Object.defineProperty(node, 'disconnect', { configurable: true, value: (...args: unknown[]) => {
      const result = Reflect.apply(disconnect, node, args); row.disconnects++; if (!args.length) row.edges.clear(); return result;
    } });
    return node;
  };
  const merger = own(offline.createChannelMerger(3), 'observer', 'channel-merger');
  const fullMix = own(offline.createGain(), 'observer', 'full-mix-tap');
  merger.connect(offline.destination); fullMix.connect(merger, 0, 2);
  let logicalState = 'running', closeCalls = 0;
  // The adapter changes scheduling/lifecycle only. Every DSP node/param/time is native.
  // Offline suspension is an observer checkpoint, not product context loss.
  const adapter = {
    get currentTime() { return offline.currentTime; }, get sampleRate() { return offline.sampleRate; },
    get state() { return logicalState; }, destination: fullMix,
    createGain: () => { const node = own(offline.createGain(), 'runtime', 'gain'); runtimeGains.push(node); return node; },
    createAnalyser: () => own(offline.createAnalyser(), 'runtime', 'analyser'),
    createDynamicsCompressor: () => own(offline.createDynamicsCompressor(), 'runtime', 'limiter'),
    createOscillator: () => own(offline.createOscillator(), 'runtime', 'oscillator'),
    createBufferSource: () => own(offline.createBufferSource(), 'runtime', 'buffer-source'),
    createBiquadFilter: () => own(offline.createBiquadFilter(), 'runtime', 'filter'),
    createBuffer: (channels: number, frames: number, rate: number) => offline.createBuffer(channels, frames, rate),
    resume: async () => {}, close: async () => { closeCalls++; logicalState = 'closed'; },
  } as unknown as AudioContextLike;
  const verifyCounterpart = (receipt: AudioCounterpartReceipt) => canonical.counterparts.some(row =>
    row.counterpartKey === receipt.counterpartKey && row.eventKey === receipt.eventKey && row.generation === receipt.generation);
  const runtime = createAudioRuntime({ createContext: () => adapter, nowMs: () => offline.currentTime * 1000,
    categoryGains: { music: 0.8, ambience: 0.6 }, verifyCounterpart,
    // Native source stops and explicit test stops own this <400ms render. The existing
    // 250ms watchdog allowance cannot expire before the explicit stops below.
    scheduleVoiceDeadline: () => () => {} });
  const marks: Mark[] = [], voices: string[] = [];
  let rendered: AudioBuffer | null = null;
  let rendering: Promise<AudioBuffer> | null = null;
  let peakNodes = 0;
  const mark = (action: string) => {
    const state = runtime.diagnostics(); peakNodes = Math.max(peakNodes, state.nodes.peak);
    marks.push({ action, time: offline.currentTime, ownerCount: state.voiceMix.activeOwners,
      musicBase: state.gains.categories.music, ambienceBase: state.gains.categories.ambience });
  };
  try {
    requireValue((await runtime.activate()).kind === 'running', 'Production runtime must activate in audit scheduling adapter');
    requireValue(runtimeGains.length === 6, 'Source-bound master + five category bus inventory changed');
    const music = runtimeGains[1]!, ambience = runtimeGains[2]!;
    music.connect(merger, 0, 0); ambience.connect(merger, 0, 1);
    for (const [label, node] of [['music', music], ['ambience', ambience]] as const) {
      for (const method of ['setValueAtTime', 'cancelScheduledValues', 'linearRampToValueAtTime'] as const) {
        const original = node.gain[method];
        Object.defineProperty(node.gain, method, { configurable: true, value: (...args: number[]) => {
          automation.push({ bus: label, method, args: [...args] });
          if (fault === 'immediate' && method === 'linearRampToValueAtTime') return node.gain.setValueAtTime(args[0]!, offline.currentTime);
          return Reflect.apply(original, node.gain, args);
        } });
      }
    }
    for (const category of ['music', 'ambience'] as const) {
      const request: AudioVoiceRequest = { key: `calibration-${category}`, category, priority: 1, cooldownGroup: `calibration-${category}`, cooldownMs: 0,
        concurrencyGroup: `calibration-${category}`, maxConcurrent: 1, nodeCount: 1,
        mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, meaning: { kind: 'decorative' },
        create: (_context, reservation) => {
          const source = own(offline.createConstantSource(), 'runtime', 'calibration-source'); source.offset.value = LEVEL;
          return { source, sources: [source], output: source, nodes: [source], reservation };
        } };
      requireValue(runtime.playVoice(request).kind === 'started', 'Native calibration voice must start through production runtime');
    }
    const start = (index: number) => {
      const request = createCombatGameplayVoiceRequest({ plan: canonical.plan, cue: canonical.cues[index]!, counterpart: canonical.counterparts[index]! });
      const result = runtime.playVoice(fault === 'neutral' ? { ...request, mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1 } : request);
      requireValue(result.kind === 'started', 'Canonical combat cue must start'); voices[index] = result.voiceId;
    };
    const stop = (index: number) => requireValue(runtime.stopVoice(voices[index]!), 'Exact combat owner must still be live at explicit stop');
    const steps = kind === 'overlap'
      ? [{ at: 0.04, action: 'first', run: () => start(0) }, { at: 0.055, action: 'second', run: () => start(1) },
        { at: 0.08, action: 'stop-first', run: () => { stop(0); if (fault === 'early-restore') {
          music.gain.cancelScheduledValues(offline.currentTime); music.gain.setValueAtTime(0.8, offline.currentTime);
          ambience.gain.cancelScheduledValues(offline.currentTime); ambience.gain.setValueAtTime(0.6, offline.currentTime);
        } } }, { at: 0.11, action: 'stop-last', run: () => stop(1) }]
      : [{ at: 0.04, action: 'first', run: () => start(0) }, { at: 0.075, action: 'stop-first', run: () => stop(0) },
        { at: 0.1, action: 'second', run: () => start(1) }, { at: 0.145, action: 'saved-volume', run: () => runtime.setCategoryGain('music', 0.4) },
        { at: 0.18, action: 'zero', run: () => runtime.setCategoryGain('music', 0) }, { at: 0.21, action: 'stop-last', run: () => stop(1) }];
    const pauses = steps.map(step => offline.suspend(step.at));
    const shutdown = offline.suspend(0.33);
    mark('baseline'); rendering = offline.startRendering();
    for (const [index, step] of steps.entries()) { await pauses[index]; step.run(); mark(step.action); await offline.resume(); }
    await shutdown; mark('before-dispose'); await runtime.dispose(); mark('disposed');
    for (const row of records.filter(row => row.owner === 'observer')) row.node.disconnect();
    await offline.resume(); rendered = await rendering;
    const state = runtime.diagnostics();
    const cleanup = { voices: state.voices.active, mixOwners: state.voiceMix.activeOwners, nodes: state.nodes.active, faults: state.faults.total,
      peakRuntimeNodes: peakNodes, runtimeNodeCount: records.filter(row => row.owner === 'runtime').length,
      observerNodeCount: records.filter(row => row.owner === 'observer').length,
      connectedNodes: records.filter(row => row.edges.size > 0).length,
      undisconnectedNodes: records.filter(row => row.disconnects < 1).map(row => row.kind), closeCalls, logicalState,
      sourceHandlers: records.filter(row => row.node instanceof AudioScheduledSourceNode && row.node.onended !== null).length };
    return { kind, fault, marks, rate: RATE, frames: LENGTH, channels: [0, 1, 2].map(channel => rendered!.getChannelData(channel).slice()), cleanup,
      identity: { planId: canonical.plan.planId, cueIds: canonical.cues.map(cue => cue.cueId), seed: 1, reference: 'fixed registered duel fixture; no species or world mutation' }, automation };
  } finally {
    await runtime.dispose();
    for (const row of records) if (row.edges.size) { try { row.node.disconnect(); } catch {} }
    if (rendering && !rendered && offline.state === 'suspended') { try { await offline.resume(); } catch {} }
  }
}

/** Independent expected envelope from observed operation times. No production
 * transition state, automation log or fault tag is read by this acceptor. */
function acceptWaveform(row: Observation) {
  requireValue(row.rate === RATE && row.frames === LENGTH && row.channels.length === 3, 'Exact native PCM shape');
  const errors: string[] = [], checks: Record<string, number> = {};
  const time = (name: string) => { const mark = row.marks.find(mark => mark.action === name); requireValue(mark, `Missing ${name}`); return mark.time; };
  const first = time('first'), second = time('second'), last = time('stop-last'), stopFirst = time('stop-first');
  const sample = (channel: number, at: number) => row.channels[channel]![Math.round(at * RATE)]! / LEVEL;
  const near = (name: string, actual: number, expected: number, tolerance = 0.0015) => {
    checks[name] = actual; if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) errors.push(`${name}: ${actual}, expected ${expected}`);
  };
  // Dense interior samples distinguish true interpolation from either an early or late step.
  for (const [channel, base] of [[0, 0.8], [1, 0.6]] as const) {
    near(`${channel}:baseline`, sample(channel, first - 0.01), base);
    for (let fraction = 0.1; fraction < 1; fraction += 0.1) near(`${channel}:attack-${fraction.toFixed(1)}`,
      sample(channel, first + 0.025 * fraction), base * (1 - 0.25 * fraction));
    if (row.kind === 'overlap') {
      near(`${channel}:overlap`, sample(channel, stopFirst + (last - stopFirst) / 2), base * 0.75);
      near(`${channel}:not-restarted`, sample(channel, first + 0.027), base * 0.75);
      for (let fraction = 0.1; fraction < 1; fraction += 0.1) near(`${channel}:release-${fraction.toFixed(1)}`,
        sample(channel, last + 0.09 * fraction), base * (0.75 + 0.25 * fraction));
      near(`${channel}:restored`, sample(channel, last + 0.095), base);
    } else {
      const fractionRecovered = (second - stopFirst) / 0.09;
      const held = base * (0.75 + 0.25 * fractionRecovered);
      near(`${channel}:recovery-interior`, sample(channel, (stopFirst + second) / 2), base * (0.75 + 0.125 * fractionRecovered));
      near(`${channel}:reverse-held`, sample(channel, second), held);
      near(`${channel}:reverse-interior`, sample(channel, second + 0.0125), (held + base * 0.75) / 2);
      if (channel === 0) {
        const saved = time('saved-volume'), zero = time('zero');
        near('music:saved-down', sample(channel, saved + 0.0125), 0.45);
        near('music:saved-target', sample(channel, saved + 0.028), 0.3);
        near('music:immediate-zero', sample(channel, zero + 1 / RATE), 0, 0.000001);
        let peak = 0; for (let frame = Math.ceil((zero + 1 / RATE) * RATE); frame < Math.floor(0.32 * RATE); frame++) peak = Math.max(peak, Math.abs(row.channels[0]![frame]!));
        near('music:zero-tail', peak, 0, 0.0000001);
      } else near('ambience:restored', sample(channel, last + 0.095), 0.6);
    }
  }
  const expectedOwners = row.kind === 'overlap' ? [2, 3, 4, 3, 2, 2, 0] : [2, 3, 2, 3, 3, 3, 2, 2, 0];
  if (JSON.stringify(row.marks.map(mark => mark.ownerCount)) !== JSON.stringify(expectedOwners)) errors.push('Ownership timeline drift');
  if (!row.channels.every(channel => channel.every(Number.isFinite))) errors.push('Nonfinite PCM');
  if (!row.channels[2]!.some(value => Math.abs(value) > 0.0001)) errors.push('Full mix is empty');
  const cleanup = row.cleanup;
  if (cleanup.voices !== 0 || cleanup.mixOwners !== 0 || cleanup.nodes !== 0 || cleanup.faults !== 0 || cleanup.connectedNodes !== 0
    || cleanup.sourceHandlers !== 0 || cleanup.closeCalls !== 1 || cleanup.logicalState !== 'closed'
    || JSON.stringify(cleanup.undisconnectedNodes) !== '[]' || cleanup.observerNodeCount !== 2) errors.push('Native node/adapter cleanup incomplete');
  return { accepted: errors.length === 0, checks, errors };
}

const state = { status: 'READY', cases: [] as Record<string, unknown>[], error: null as string | null };
let running = false;
async function run() {
  requireValue(!running && state.status === 'READY', 'Native proof runs once per page'); running = true; state.status = 'RUNNING';
  try {
    requireValue(new Uint8Array(new Uint32Array([1]).buffer)[0] === 1, 'f32le artifact requires little-endian browser');
    for (const [kind, fault] of [['overlap', 'none'], ['interruption', 'none'], ['overlap', 'neutral'], ['overlap', 'immediate'], ['overlap', 'early-restore'], ['overlap', 'none']] as const) {
      const observation = await observe(kind, fault), verdict = acceptWaveform(observation);
      const { channels, ...metadata } = observation;
      state.cases.push({ ...metadata, verdict, pcm: channels.map(encode), pcmLayout: 'three planar f32le channels: music tap, ambience tap, full mix' });
      requireValue(fault === 'none' ? verdict.accepted : !verdict.accepted, `Unexpected ${kind}/${fault} waveform verdict: ${verdict.errors.join('; ')}`);
    }
    state.status = 'PASS';
  } catch (error) { state.status = 'FAIL'; state.error = String(error instanceof Error ? error.stack : error); throw error; }
  finally { running = false; document.getElementById('status')!.textContent = `${state.status}: native waveform proof; human listening remains open`; }
  return state;
}
Object.assign(window, { cfNativeAudioMix: { run, state } });
document.getElementById('run')!.onclick = () => { void run().catch(() => {}); };
