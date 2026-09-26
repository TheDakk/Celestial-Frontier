/** @module listening-review [app] — the L1 Listening page (D15 / N5 "the listening test Nick runs"): `?audioReview=1` on a built package
 * (the dev URL), flag-gated, dynamic import only. It plays every creature cue set in a FIXED order: one representative creature per voice
 * archetype, each through its ONE voice card (`creatureVoiceCardV1`) and derived exactly as the battle stage derives an identity card's cue
 * (`deriveCue(card, cue, sources, card.seed)`), today from the labelled placeholder library. Nick listens on the iPhone speaker first, then
 * on headphones, and taps Keep / Redo / Cut with an optional note. Ratings stay on this device (guarded localStorage, never the save);
 * **Copy results** gives a plain-text block — commit, pack digest, device, ratings — for Nick to paste. No network beyond reading this
 * package's own `preview.json`; no telemetry. Playback goes through the audio owner's explicit pilot gesture path (decorative only). */
import { makeGenome } from '@cf/domain-genome';
import type { AudioVoiceRequest } from '@cf/audio';
import { createDerivedVoiceRequest, type RenderedCue } from './soundkit/browser-adapter.js';
import { CREATURE_CUES, type CreatureCueId } from './soundkit/cues.js';
import { deriveCue, type SourceLibrary } from './soundkit/derive.js';
import { planCues } from './soundkit/mix.js';
import { originalSourceLibraryV1 } from './soundkit/original-voices.js';
import type { VoiceCard } from './soundkit/voice-card.js';
import { creatureVoiceCardV1 } from './soundkit/voice-identity.js';

export const LISTENING_REVIEW_FLAG = 'audioReview' as const;
export const LISTENING_STORAGE_KEY = 'cf-listening-l1-v1' as const;
/** One representative Earth creature per voice archetype, in VOICE_ARCHETYPES order; the seed fixes its individual voice. */
export const LISTENING_ROSTER_V1 = Object.freeze([
  { archetype: 'quadruped', earthName: 'Civet', seed: 1101 }, { archetype: 'hopper', earthName: 'Tree Frog', seed: 1102 },
  { archetype: 'biped-bird', earthName: 'Eagle', seed: 1103 }, { archetype: 'fish', earthName: 'Salmon', seed: 1104 },
  { archetype: 'insect', earthName: 'Beetle', seed: 1105 }, { archetype: 'arachnid', earthName: 'Tarantula', seed: 1106 },
  { archetype: 'serpent', earthName: 'Python', seed: 1107 }, { archetype: 'myriapod', earthName: 'Centipede', seed: 1108 },
  { archetype: 'radial', earthName: 'Jellyfish', seed: 1109 }, { archetype: 'cephalopod', earthName: 'Octopus', seed: 1110 },
  { archetype: 'flyer-membrane', earthName: 'Fruit Bat', seed: 1111 }, { archetype: 'primate', earthName: 'Chimpanzee', seed: 1112 },
  { archetype: 'brachyuran', earthName: 'Crab', seed: 1113 },
] as const);
export type ListeningRatingV1 = 'keep' | 'redo' | 'cut';
export interface ListeningItemV1 { readonly id: string; readonly archetype: string; readonly earthName: string; readonly cue: CreatureCueId; readonly label: string; readonly genome: Readonly<Record<string, unknown>>; }
export interface ListeningRatingsV1 { readonly [id: string]: Readonly<{ rating: ListeningRatingV1; note: string }>; }

/** The fixed review order: creatures in roster order, each creature's cues in CREATURE_CUES order. */
export function listeningItemsV1(): readonly ListeningItemV1[] {
  const out: ListeningItemV1[] = [];
  for (const r of LISTENING_ROSTER_V1) {
    const genome = Object.freeze({ ...(makeGenome(r.seed, 'fauna', 0.5) as unknown as Record<string, unknown>), _earthName: r.earthName });
    for (const cue of CREATURE_CUES) out.push(Object.freeze({ id: `${r.archetype}.${cue}`, archetype: r.archetype, earthName: r.earthName, cue, label: `${r.earthName} · ${cue}`, genome }));
  }
  return Object.freeze(out);
}
/** The creature's ONE voice card and the exact cue the battle stage would play for it. */
export function listeningCueV1(item: ListeningItemV1, sources: SourceLibrary): RenderedCue & { card: VoiceCard } {
  const result = creatureVoiceCardV1(item.genome);
  if (!result.ok) throw new Error(`${item.label}: no voice (${result.reason})`);
  const derived = deriveCue(result.card, item.cue, sources, result.card.seed >>> 0);
  return { card: result.card, samples: derived.samples, sampleRate: derived.sampleRate };
}
/** A pilot-path request for one review cue (the owner admits only `cf-pilot-` decorative previews). */
export function listeningRequestV1(item: ListeningItemV1, rendered: RenderedCue): AudioVoiceRequest {
  const intent = planCues([`creature:${item.cue}`]).admitted[0];
  if (!intent) throw new Error(`${item.label}: the mix admitted no voice`);
  const key = `cf-pilot-listen-${item.id.replace(/[^a-z0-9-]/gu, '-')}`;
  return createDerivedVoiceRequest({ ...intent, key, category: 'combat-gameplay', cooldownGroup: 'cf-pilot-listen', cooldownMs: 0, concurrencyGroup: 'cf-pilot-listen', maxConcurrent: 1 }, rendered, { kind: 'decorative' });
}

export function loadListeningRatingsV1(storage: Pick<Storage, 'getItem'> | null): ListeningRatingsV1 {
  let raw: string | null = null; try { raw = storage?.getItem(LISTENING_STORAGE_KEY) ?? null; } catch { return {}; }
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as { schema?: unknown; ratings?: Record<string, { rating?: unknown; note?: unknown }> };
    if (v.schema !== 'cf.listening-l1/v1' || !v.ratings || typeof v.ratings !== 'object') return {};
    const ids = new Set(listeningItemsV1().map((i) => i.id)), out: Record<string, { rating: ListeningRatingV1; note: string }> = {};
    for (const [id, r] of Object.entries(v.ratings)) if (ids.has(id) && (r?.rating === 'keep' || r?.rating === 'redo' || r?.rating === 'cut')) out[id] = { rating: r.rating, note: typeof r.note === 'string' ? r.note.slice(0, 280) : '' };
    return out;
  } catch { return {}; }
}
export function saveListeningRatingsV1(storage: Pick<Storage, 'setItem'> | null, ratings: ListeningRatingsV1): void {
  try { storage?.setItem(LISTENING_STORAGE_KEY, JSON.stringify({ schema: 'cf.listening-l1/v1', ratings })); } catch { /* a private window keeps ratings for this visit only */ }
}

export function formatListeningResultsV1(input: Readonly<{ commit: string; packDigest: string; ua: string; ratings: ListeningRatingsV1 }>): string {
  const items = listeningItemsV1(), rated = items.filter((i) => input.ratings[i.id]);
  const n = (r: ListeningRatingV1) => rated.filter((i) => input.ratings[i.id]!.rating === r).length;
  return [
    'Celestial Frontier — L1 listening review (D15, placeholder-derived voices)',
    `commit: ${input.commit}`,
    `pack: ${input.packDigest}`,
    `device: ${input.ua}`,
    'order: iPhone speaker first, then headphones',
    `rated: ${rated.length} of ${items.length} (keep ${n('keep')} · redo ${n('redo')} · cut ${n('cut')})`,
    ...rated.map((i) => { const r = input.ratings[i.id]!; return `${i.id} | ${r.rating}${r.note ? ` | ${r.note.replace(/\s+/gu, ' ').trim()}` : ''}`; }),
  ].join('\n');
}

export interface ListeningAudioPortV1 { arm(): boolean; play(request: AudioVoiceRequest): Promise<{ kind: string; reason?: string }>; stop(): void; }
export interface ListeningMountV1 {
  readonly doc: Document;
  readonly port: ListeningAudioPortV1;
  readonly commit: string;
  readonly ua: string;
  readonly readPackDigest: () => Promise<string>;
  readonly storage: Storage | null;
  readonly copyText?: (text: string) => Promise<void>;
  readonly sources?: SourceLibrary;
  /** Only a trusted (native) press plays; tests inject `() => true`. */
  readonly trusted?: (event: Event) => boolean;
}
export function mountListeningReviewV1(o: ListeningMountV1): { readonly root: HTMLElement; ratings(): ListeningRatingsV1; resultsText(): Promise<string>; dispose(): void } {
  const d = o.doc, items = listeningItemsV1(), trusted = o.trusted ?? ((e: Event) => e.isTrusted);
  let sources: SourceLibrary | null = o.sources ?? null; const lib = (): SourceLibrary => (sources ??= originalSourceLibraryV1().sources);
  let ratings: Record<string, { rating: ListeningRatingV1; note: string }> = { ...loadListeningRatingsV1(o.storage) };
  const root = d.createElement('section'); root.dataset.listeningReview = 'l1'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Listening review');
  root.style.cssText = 'position:fixed;inset:0;z-index:10040;overflow:auto;background:#0b1428;color:#edf3fa;padding:12px 16px 48px;font:16px/1.45 system-ui';
  const btn = (text: string, data: Record<string, string> = {}): HTMLButtonElement => { const b = d.createElement('button'); b.type = 'button'; b.textContent = text; Object.assign(b.dataset, data); b.style.cssText = 'min-height:44px;min-width:44px;margin:4px 6px 4px 0;padding:8px 12px;font:inherit'; return b; };
  const bar = d.createElement('div'); bar.style.cssText = 'position:sticky;top:0;background:#0b1428;padding:4px 0;z-index:1';
  const h = d.createElement('h2'); h.textContent = 'Listening review · L1';
  const intro = d.createElement('p'); intro.textContent = 'Play each sound on the iPhone speaker first, then again on headphones. Tap Keep, Redo or Cut, and add a note if you like. Nothing reaches players without Keep. Ratings stay on this device; Copy results and paste the text to Claude.';
  const copy = btn('Copy results', { listenCopy: '' }), stop = btn('Stop', { listenStop: '' }), close = btn('Close', { listenClose: '' });
  const status = d.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.dataset.listenStatus = '';
  bar.append(h, copy, stop, close, status); root.append(bar, intro);
  const persist = (): void => saveListeningRatingsV1(o.storage, ratings);
  let group: HTMLDetailsElement | null = null, lastCreature = '';
  for (const item of items) {
    if (item.earthName !== lastCreature) { lastCreature = item.earthName; group = d.createElement('details'); group.open = root.querySelectorAll('details').length === 0; const s = d.createElement('summary'); s.textContent = `${item.earthName} (${item.archetype})`; s.style.cssText = 'min-height:44px;padding:10px 0;font-weight:600'; group.append(s); root.append(group); }
    const row = d.createElement('div'); row.dataset.listenItem = item.id; row.style.cssText = 'border-top:1px solid #2a3b55;padding:6px 0';
    const label = d.createElement('div'); label.textContent = item.cue;
    const play = btn('▶ Play', { listenPlay: item.id });
    const choices = (['keep', 'redo', 'cut'] as const).map((r) => btn(r[0]!.toUpperCase() + r.slice(1), { listenRate: r }));
    const note = d.createElement('input'); note.type = 'text'; note.maxLength = 280; note.placeholder = 'note (optional)'; note.setAttribute('aria-label', `${item.label} note`); note.style.cssText = 'min-height:44px;width:100%;box-sizing:border-box;font:inherit';
    const paint = (): void => { for (const c of choices) c.setAttribute('aria-pressed', String(ratings[item.id]?.rating === c.dataset.listenRate)); note.value = ratings[item.id]?.note ?? ''; };
    for (const c of choices) c.onclick = () => { ratings = { ...ratings, [item.id]: { rating: c.dataset.listenRate as ListeningRatingV1, note: ratings[item.id]?.note ?? '' } }; persist(); paint(); };
    note.onchange = () => { const r = ratings[item.id]; if (!r) { status.textContent = 'Rate the sound first, then add a note.'; note.value = ''; return; } ratings = { ...ratings, [item.id]: { ...r, note: note.value.slice(0, 280) } }; persist(); };
    play.onclick = (event) => {
      if (!trusted(event)) return;
      if (!o.port.arm()) { status.textContent = 'Sound is off or the game is not ready — turn Sound on in Settings.'; return; }
      let request: AudioVoiceRequest; try { request = listeningRequestV1(item, listeningCueV1(item, lib())); } catch (error) { status.textContent = String(error instanceof Error ? error.message : error); return; }
      status.textContent = `Playing ${item.label}…`;
      void o.port.play(request).then((r) => { status.textContent = r.kind === 'started' ? `Playing ${item.label}.` : `${item.label} did not start: ${r.reason ?? r.kind}`; });
    };
    paint(); row.append(label, play, ...choices, note); group!.append(row);
  }
  const resultsText = async (): Promise<string> => { let pack = 'unavailable'; try { pack = await o.readPackDigest(); } catch { /* local build */ } return formatListeningResultsV1({ commit: o.commit, packDigest: pack, ua: o.ua, ratings }); };
  copy.onclick = () => { void resultsText().then((t) => (o.copyText ?? ((x: string) => navigator.clipboard.writeText(x)))(t)).then(() => { status.textContent = 'Copied — paste it to Claude.'; }, () => { status.textContent = 'Copy failed.'; }); };
  stop.onclick = () => { o.port.stop(); status.textContent = 'Stopped.'; };
  close.onclick = () => { o.port.stop(); root.remove(); };
  d.body.append(root);
  return { root, ratings: () => ({ ...ratings }), resultsText, dispose: () => { o.port.stop(); root.remove(); } };
}
