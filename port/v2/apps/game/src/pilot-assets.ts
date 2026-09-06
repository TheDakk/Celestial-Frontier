import type { AudioCategory } from '@cf/audio';

export const PILOT_SHIP_IMAGES = Object.freeze({
  132: new URL('../assets/pilot/ship/scout-chemical-132.webp', import.meta.url).href,
  300: new URL('../assets/pilot/ship/scout-chemical-300.webp', import.meta.url).href,
  512: new URL('../assets/pilot/ship/scout-chemical-512.webp', import.meta.url).href,
});
export const PILOT_VISTA_LAYERS: readonly string[] = Object.freeze([new URL('../assets/pilot/biome/earth-rainy-landscape.webp', import.meta.url).href]);
export const PILOT_VISTA_PHONE = new URL('../assets/pilot/biome/earth-rainy-phone.webp', import.meta.url).href;
export const PILOT_FONT_URL = new URL('../assets/pilot/fonts/InterVariable.woff2', import.meta.url).href;
export const PILOT_FONT_LICENSE_URL = new URL('../assets/pilot/fonts/Inter-LICENSE.txt', import.meta.url).href;

export interface PilotCueDefinition {
  readonly id: string;
  readonly title: string;
  readonly caption: string;
  readonly category: AudioCategory;
  readonly url: string;
  readonly durationMs: number;
  readonly gain: number;
}
export const PILOT_CUES: readonly PilotCueDefinition[] = Object.freeze([
  { id: 'cf-pilot-exploration-music', title: 'Exploration phrase', caption: 'A restrained exploration motif, then silence.', category: 'music',
    url: new URL('../assets/pilot/audio/cf-pilot-exploration-music.wav', import.meta.url).href, durationMs: 24000, gain: .65 },
  { id: 'cf-pilot-temperate-bed', title: 'Temperate woodland', caption: 'Wind and foliage; no undiscovered animal calls.', category: 'ambience',
    url: new URL('../assets/pilot/audio/cf-pilot-temperate-bed.wav', import.meta.url).href, durationMs: 24000, gain: .5 },
  { id: 'cf-pilot-ui-nav', title: 'Navigation', caption: 'A light navigation tap.', category: 'ui',
    url: new URL('../assets/pilot/audio/cf-pilot-ui-nav.wav', import.meta.url).href, durationMs: 280, gain: .65 },
  { id: 'cf-pilot-ui-refusal', title: 'Refusal', caption: 'A soft downward response.', category: 'ui',
    url: new URL('../assets/pilot/audio/cf-pilot-ui-refusal.wav', import.meta.url).href, durationMs: 450, gain: .65 },
  { id: 'cf-pilot-ui-settlement', title: 'Settlement', caption: 'A short settling confirmation; this audition grants nothing.', category: 'ui',
    url: new URL('../assets/pilot/audio/cf-pilot-ui-settlement.wav', import.meta.url).href, durationMs: 700, gain: .65 },
  { id: 'cf-pilot-scout-approach', title: 'Scout approach', caption: 'A contained propulsion swell.', category: 'combat-gameplay',
    url: new URL('../assets/pilot/audio/cf-pilot-scout-approach.wav', import.meta.url).href, durationMs: 2400, gain: .6 },
  { id: 'cf-pilot-scout-landing', title: 'Scout landing', caption: 'Propulsion settles into a soft landing transient.', category: 'combat-gameplay',
    url: new URL('../assets/pilot/audio/cf-pilot-scout-landing.wav', import.meta.url).href, durationMs: 1400, gain: .6 },
  { id: 'cf-pilot-combat-contact', title: 'Combat contact', caption: 'A restrained contact transient; no battle is simulated here.', category: 'combat-gameplay',
    url: new URL('../assets/pilot/audio/cf-pilot-combat-contact.wav', import.meta.url).href, durationMs: 350, gain: .65 },
].map((cue) => Object.freeze(cue as PilotCueDefinition)));
