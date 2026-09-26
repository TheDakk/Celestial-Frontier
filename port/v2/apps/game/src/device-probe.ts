/** @module device-probe [app] — the H1 iPhone device probe page (`?deviceProbe=1`, flag-gated, dynamic import only). Its first section is
 * the D15 Stage 0 CODEC decode check (N5: "one codec, never both — ship Opus if the iPhone probe shows Safari decodes it, otherwise AAC"):
 * each tiny embedded sample (Opus in Ogg/WebM/CAF, AAC in M4A/ADTS) is verified against its SHA-256, then decoded through the REAL
 * `AudioContext.decodeAudioData`, and the decoded buffer must be a real signal (≈0.12 s, non-silent) to PASS. Fully offline: no fetch, no
 * network, no telemetry. The result is shown on the page and copied as plain text for Nick to paste. The PERFORMANCE / HEAT / MEMORY
 * sections (device-probe-performance.ts) run on the real painted battle2 stage when their buttons are pressed; Copy results then carries
 * every section that ran. */
import { CODEC_PROBE_SAMPLES_V1, type CodecProbeSampleV1 } from './device-probe-codec-samples.js';
import { sha256Hex } from './soundkit/derive.js';
import { formatDeviceProbeSectionsV1, readMemoryProbeV1, runHeatProbeV1, runPerformanceProbeV1, type HeatAnalysisV1, type MemorySectionV1, type PerformanceProbePortV1, type PerformanceSectionV1 } from './device-probe-performance.js';

export const DEVICE_PROBE_FLAG = 'deviceProbe' as const;
export type CodecProbeStatusV1 = 'pass' | 'fail' | 'unsupported';
export interface DecodedBufferLike { readonly length: number; readonly duration: number; readonly sampleRate: number; readonly numberOfChannels: number; getChannelData(channel: number): Float32Array; }
export interface ProbeAudioContextLike { readonly sampleRate: number; decodeAudioData(data: ArrayBuffer): Promise<DecodedBufferLike>; close?(): Promise<unknown>; }
export interface CodecProbeRowV1 {
  readonly id: string; readonly codec: 'opus' | 'aac'; readonly container: string; readonly mime: string;
  readonly status: CodecProbeStatusV1; readonly reason: string; readonly canPlayType: string;
  readonly decoded: Readonly<{ sampleRate: number; durationMs: number; channels: number; rms: number }> | null;
}
export interface CodecProbeReportV1 {
  readonly schema: 'cf.device-probe-codecs/v1'; readonly ua: string; readonly contextSampleRate: number | null;
  readonly rows: readonly CodecProbeRowV1[]; readonly recommendation: 'opus' | 'aac' | 'none';
}
export interface CodecProbeInputV1 {
  readonly createContext: () => ProbeAudioContextLike;
  readonly ua: string;
  /** `HTMLMediaElement.canPlayType` — provenance only; the decision is the decode result. */
  readonly canPlayType?: (mime: string) => string;
  readonly samples?: readonly CodecProbeSampleV1[];
}

/** A decoded sample is a PASS only if it is the real tone: 80–300 ms long, at least one channel, RMS above 0.01. */
export const DECODE_ACCEPT = Object.freeze({ minMs: 80, maxMs: 300, minRms: 0.01 });

function bytesOf(base64: string): Uint8Array { const bin = atob(base64), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

export async function runCodecProbeV1(input: CodecProbeInputV1): Promise<CodecProbeReportV1> {
  const samples = input.samples ?? CODEC_PROBE_SAMPLES_V1;
  let ctx: ProbeAudioContextLike | null = null, ctxError = '';
  try { ctx = input.createContext(); } catch (error) { ctxError = error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
  const rows: CodecProbeRowV1[] = [];
  for (const s of samples) {
    const base = { id: s.id, codec: s.codec, container: s.container, mime: s.mime, canPlayType: (() => { try { return input.canPlayType?.(s.mime) ?? 'n/a'; } catch { return 'n/a'; } })() };
    const bytes = bytesOf(s.base64);
    if (bytes.length !== s.bytes || sha256Hex(bytes) !== s.sha256) { rows.push(Object.freeze({ ...base, status: 'fail', reason: 'embedded sample does not match its SHA-256 (corrupted)', decoded: null })); continue; }
    if (!ctx) { rows.push(Object.freeze({ ...base, status: 'unsupported', reason: `no AudioContext (${ctxError || 'unavailable'})`, decoded: null })); continue; }
    let buffer: DecodedBufferLike;
    try { buffer = await ctx.decodeAudioData(bytes.slice().buffer); }
    catch (error) { rows.push(Object.freeze({ ...base, status: 'unsupported', reason: `decodeAudioData rejected (${error instanceof Error ? `${error.name}: ${error.message}` : String(error)})`, decoded: null })); continue; }
    const channels = buffer.numberOfChannels, durationMs = buffer.duration * 1000;
    let sum = 0; const data = channels > 0 && buffer.length > 0 ? buffer.getChannelData(0) : new Float32Array(0); for (let i = 0; i < data.length; i++) sum += data[i]! * data[i]!;
    const rms = data.length ? Math.sqrt(sum / data.length) : 0, decoded = Object.freeze({ sampleRate: buffer.sampleRate, durationMs: Math.round(durationMs * 10) / 10, channels, rms: Math.round(rms * 10000) / 10000 });
    const ok = channels >= 1 && durationMs >= DECODE_ACCEPT.minMs && durationMs <= DECODE_ACCEPT.maxMs && rms > DECODE_ACCEPT.minRms;
    rows.push(Object.freeze({ ...base, status: ok ? 'pass' : 'fail', reason: ok ? 'decoded the tone' : `decoded but not the tone (${decoded.durationMs} ms, rms ${decoded.rms})`, decoded }));
  }
  try { await ctx?.close?.(); } catch { /* the probe result stands */ }
  const any = (codec: 'opus' | 'aac') => rows.some((r) => r.codec === codec && r.status === 'pass');
  return Object.freeze({ schema: 'cf.device-probe-codecs/v1', ua: input.ua, contextSampleRate: ctx?.sampleRate ?? null, rows: Object.freeze(rows), recommendation: any('opus') ? 'opus' : any('aac') ? 'aac' : 'none' });
}

export function formatCodecProbeV1(report: CodecProbeReportV1, identity: Readonly<{ commit: string }>): string {
  return [
    'Celestial Frontier — H1 device probe · codec decode (D15 Stage 0)',
    `commit: ${identity.commit}`,
    `device: ${report.ua}`,
    `audio context sample rate: ${report.contextSampleRate ?? 'n/a'}`,
    `recommendation: ${report.recommendation}`,
    ...report.rows.map((r) => `${r.id} | ${r.status} | canPlayType=${r.canPlayType || '""'} | ${r.decoded ? `${r.decoded.sampleRate} Hz ${r.decoded.durationMs} ms ch${r.decoded.channels} rms ${r.decoded.rms}` : '-'} | ${r.reason}`),
  ].join('\n');
}

export interface DeviceProbeMountV1 {
  readonly doc: Document;
  readonly commit: string;
  readonly ua: string;
  readonly createContext: () => ProbeAudioContextLike;
  readonly canPlayType?: (mime: string) => string;
  readonly copyText?: (text: string) => Promise<void>;
  /** H1 performance/heat/memory: builds the runtime port LAZILY (only when a Run is pressed, long after boot). Absent = codec section only. */
  readonly performance?: () => PerformanceProbePortV1;
  readonly readPackDigest?: () => Promise<string>;
  readonly dpr?: number;
  readonly viewport?: string;
}
/** The probe page as an overlay: Run (a user gesture creates the AudioContext), the results table, Copy results. */
export function mountDeviceProbeV1(options: DeviceProbeMountV1): { readonly root: HTMLElement; run(): Promise<CodecProbeReportV1>; runPerformance(): Promise<void>; runHeat(): Promise<void>; readMemory(): Promise<void>; text(): string; dispose(): void } {
  const d = options.doc, root = d.createElement('section');
  root.dataset.deviceProbe = 'codecs'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Device probe');
  root.style.cssText = 'position:fixed;inset:0;z-index:10050;overflow:auto;background:#0b1428;color:#edf3fa;padding:16px;font:16px/1.45 system-ui';
  const h = d.createElement('h2'); h.textContent = 'Device probe · audio codecs';
  const p = d.createElement('p'); p.textContent = 'Decodes five tiny embedded samples through this device’s audio engine. Nothing is sent anywhere. Press Run, then Copy results and paste them to Claude.';
  const run = d.createElement('button'), copy = d.createElement('button'), close = d.createElement('button'), status = d.createElement('p'), out = d.createElement('pre');
  run.textContent = 'Run codec check'; copy.textContent = 'Copy results'; close.textContent = 'Close'; copy.disabled = true;
  run.dataset.probeRun = ''; copy.dataset.probeCopy = ''; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  out.dataset.probeOut = ''; out.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px';
  for (const b of [run, copy, close]) b.style.cssText = 'min-height:44px;min-width:44px;margin:6px 8px 6px 0;padding:10px 14px;font:inherit';
  const perfBtn = d.createElement('button'), heatBtn = d.createElement('button'), memBtn = d.createElement('button');
  perfBtn.textContent = 'Run performance (≈45 s)'; heatBtn.textContent = 'Run heat (3 min)'; memBtn.textContent = 'Read memory';
  perfBtn.dataset.probePerf = ''; heatBtn.dataset.probeHeat = ''; memBtn.dataset.probeMem = '';
  const sectionButtons = options.performance ? [perfBtn, heatBtn, memBtn] : [];
  for (const b of sectionButtons) b.style.cssText = 'min-height:44px;min-width:44px;margin:6px 8px 6px 0;padding:10px 14px;font:inherit';
  root.append(h, p, run, ...sectionButtons, copy, close, status, out); d.body.append(root);
  let last = '';
  const sections: { performance?: PerformanceSectionV1; heat?: HeatAnalysisV1 & { vs: string; loadError: string | null }; memory?: MemorySectionV1 } = {};
  let sectionText = '';
  const fullText = (): string => [last, sectionText].filter(Boolean).join('\n\n');
  const refreshSections = async (): Promise<void> => {
    let pack = 'unavailable'; try { pack = options.readPackDigest ? await options.readPackDigest() : 'unavailable'; } catch { /* a local build has no preview.json */ }
    sectionText = formatDeviceProbeSectionsV1({ commit: options.commit, packDigest: pack, ua: options.ua, dpr: options.dpr ?? 1, viewport: options.viewport ?? 'unknown' }, sections);
    out.textContent = fullText(); copy.disabled = false;
  };
  const busy = (on: boolean): void => { for (const b of [run, ...sectionButtons]) b.disabled = on; };
  const runSection = async (label: string, work: (port: PerformanceProbePortV1) => Promise<void>): Promise<void> => {
    if (!options.performance) return; busy(true); status.textContent = `${label}…`;
    try { await work(options.performance()); await refreshSections(); status.textContent = `${label}: done.`; }
    catch (error) { status.textContent = `${label} could not run: ${error instanceof Error ? error.message : String(error)}`; }
    finally { busy(false); }
  };
  const runPerformance = (): Promise<void> => runSection('Performance', async (port) => { sections.performance = await runPerformanceProbeV1(port, undefined, (t) => { status.textContent = `Performance — ${t}`; }); });
  const runHeat = (): Promise<void> => runSection('Heat', async (port) => { sections.heat = await runHeatProbeV1(port, undefined, undefined, (t) => { status.textContent = `Heat — ${t}`; }); });
  const readMemory = (): Promise<void> => runSection('Memory', async (port) => { sections.memory = await readMemoryProbeV1(port); });
  perfBtn.onclick = () => { void runPerformance(); }; heatBtn.onclick = () => { void runHeat(); }; memBtn.onclick = () => { void readMemory(); };
  const doRun = async (): Promise<CodecProbeReportV1> => {
    run.disabled = true; status.textContent = 'Decoding…';
    const report = await runCodecProbeV1({ createContext: options.createContext, ua: options.ua, ...(options.canPlayType ? { canPlayType: options.canPlayType } : {}) });
    last = formatCodecProbeV1(report, { commit: options.commit }); out.textContent = fullText(); copy.disabled = false; run.disabled = false;
    status.textContent = `Done: ${report.rows.filter((r) => r.status === 'pass').length} of ${report.rows.length} decoded. Recommendation: ${report.recommendation}.`;
    return report;
  };
  run.onclick = () => { void doRun(); };
  copy.onclick = () => { void (options.copyText ?? ((t: string) => navigator.clipboard.writeText(t)))(fullText()).then(() => { status.textContent = 'Copied.'; }, () => { status.textContent = 'Copy failed — select the text below.'; }); };
  close.onclick = () => root.remove();
  return { root, run: doRun, runPerformance, runHeat, readMemory, text: fullText, dispose: () => root.remove() };
}
