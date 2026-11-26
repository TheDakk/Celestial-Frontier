// The storm joined to the descent, and the prompt that tells the player of it.
// Two rules are held: the repaired one (the prompt sees the weather the scene will show; a named improvement) and
// the legacy game's own (LEGACY celestial-frontier.html `_descWx` 13402-13420, which leaves the season out).
// fixtures/v1/recorded/landing-weather.json holds both games' tokens per world and time; landing-descent.json
// holds the legacy prompt (13612-13623) and the two notices of `_descRoll` (13443-13444, 13457-13459).
import { describe, expect, it } from 'vitest';
import { weatherActive, weatherEventAt, WEATHER_EVENT_WORD } from '@cf/domain-landing';
import { createEmptyDescentWaveOffStateV1, projectWorldOpportunity } from '@cf/domain-opportunity';
import { biomeFor } from '@cf/domain-strays';
import { loadRecorded } from '../../../tests/support/v1-recorded.js';
import {
  DESCENT_PROMPT_BUTTONS,
  descentOdds,
  descentPrompt,
  descentStormActive,
  descentTierLabel,
  descentWeather,
  projectDescentApproachV1,
  throughTheFireNotice,
  waveOffNotice,
  type DescentOdds,
} from '../src/landing';
import { recorded, rolled, wearing, world, type Token } from './descent-support';

/** [seconds, season, the scene's token in force, whether it is falling, time of day, the legacy prompt's token, events]. */
type At = [number, number, Token | null, boolean, string, Token | null, unknown];
interface WeatherWorld { group: 'world'; input: { seed: number; type: string; band: string }; env: { wx: Token | null }; at: At[] }
const weatherWorlds = (loadRecorded('landing-weather').cases as Array<WeatherWorld | { group: string }>)
  .filter((c): c is WeatherWorld => c.group === 'world');

const odds = (planet: { seed: number; type: string; band: string }, stormActive: boolean, waveOffCount = 0): DescentOdds =>
  descentOdds({ planet, band: planet.band, stormActive, waveOffCount, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false });

/** One recorded world whose biome lands at `land`. */
function worldLandingAt(land: number): { seed: number; type: string; band: string } {
  const found = recorded('descent').find((c) => c.biome !== null && c.biome[2] === land);
  if (!found) throw new Error(`no recorded world lands at ${land}`);
  return found.input;
}

describe('an active storm takes 5 off the descent', () => {
  it('a base of 95 is 90 in a storm and 95 without; 100 is 95; 90 stays 90', () => {
    expect([odds(worldLandingAt(95), true).successPercent, odds(worldLandingAt(95), false).successPercent]).toEqual([90, 95]);
    expect(odds(worldLandingAt(100), true).successPercent).toBe(95);
    expect([odds(worldLandingAt(90), true).successPercent, odds(worldLandingAt(90), false).successPercent]).toEqual([90, 90]);
  });

  it('below 90 the whole 5 comes off: 85 is 80, 25 is 20, and 10 is 5, the floor', () => {
    expect(odds(worldLandingAt(85), true).successPercent).toBe(80);
    expect(odds(worldLandingAt(25), true).successPercent).toBe(20);
    expect(odds(worldLandingAt(10), true).successPercent).toBe(5);
    expect(odds(worldLandingAt(10), false).successPercent).toBe(10);
  });

  it('the damage rung is the base’s, storm or no storm', () => {
    const planet = worldLandingAt(75);
    expect([odds(planet, true).damageMin, odds(planet, true).damageMax]).toEqual([odds(planet, false).damageMin, odds(planet, false).damageMax]);
    expect(odds(planet, true).successPercent).toBe(70);
  });

  it('Earth is 100 whatever the weather', () => {
    const earth = world(133);
    for (const stormActive of [false, true]) {
      expect(projectDescentApproachV1({
        address: earth, opportunity: projectWorldOpportunity(earth), capabilities: wearing(),
        waveOffs: createEmptyDescentWaveOffStateV1(), stormActive, reinforcedHull: false, trainingActive: false, alreadyLanded: false,
      })).toMatchObject({ successPercent: 100, safeReason: 'earth', stormActive });
    }
  });
});

describe('the storm the descent prompt sees', () => {
  it('the fixture holds 256 worlds at 29 times', () => {
    expect(weatherWorlds.length).toBe(256);
    expect(weatherWorlds.every((w) => w.at.length === 29)).toBe(true);
  });

  it('the storm flag at 0 s and at 90 s follows the weather spell of the same world, for a stormy and a clear case', () => {
    const desert = weatherWorlds.filter((w) => w.env.wx === 'dust');
    const flags = desert.flatMap((w) => [0, 90].map((seconds) => {
      const active = weatherActive(w.input.seed, 'dust', seconds);
      expect(descentStormActive(w.input, w.input.band, seconds), JSON.stringify(w.input)).toBe(active);
      return active;
    }));
    expect(flags).toContain(true);
    expect(flags).toContain(false);
  });

  it('the legacy rule gives the token the legacy prompt saw, at every recorded world and time', () => {
    for (const w of weatherWorlds) for (const a of w.at) {
      const weather = descentWeather(w.input, w.input.band, a[0], 'legacy');
      expect([weather.token, weather.stormActive], JSON.stringify([w.input, a[0]])).toEqual([a[5], a[5] !== null]);
    }
  });

  it('the repaired rule gives the token the legacy scene showed, at every recorded world and time, and is the default', () => {
    for (const w of weatherWorlds) for (const a of w.at) {
      const scene = a[3] ? a[2] : null;
      const weather = descentWeather(w.input, w.input.band, a[0]);
      expect([weather.rule, weather.token, weather.stormActive], JSON.stringify([w.input, a[0]])).toEqual(['repaired', scene, scene !== null]);
      expect(descentStormActive(w.input, w.input.band, a[0])).toBe(scene !== null);
    }
  });

  it('the two rules differ only in deep winter on a rainy world: the prompt says snow where it said rain, and sees the snow it missed', () => {
    const seen = { same: 0, snowForRain: 0, stormOnlyRepaired: 0 };
    for (const w of weatherWorlds) for (const a of w.at) {
      const legacy = descentWeather(w.input, w.input.band, a[0], 'legacy');
      const repaired = descentWeather(w.input, w.input.band, a[0], 'repaired');
      const label = JSON.stringify([w.input, a[0]]);
      if (legacy.token === repaired.token) { seen.same++; continue; }
      // Every difference is on a world whose base weather is rain, in deep winter (season below -0.45).
      expect(w.env.wx, label).toBe('rain');
      expect(a[1], label).toBeLessThan(-0.45);
      expect(repaired.token, label).toBe('snow');
      if (legacy.token === 'rain') seen.snowForRain++;
      else { expect(legacy.token, label).toBeNull(); seen.stormOnlyRepaired++; }
    }
    // The repaired rule never loses a storm the legacy prompt had: snow's odds (0.58) are above rain's (0.42).
    expect(seen.snowForRain).toBeGreaterThan(0);
    expect(seen.stormOnlyRepaired).toBeGreaterThan(0);
    expect(seen.same).toBeGreaterThan(7000);
  });

  it('where only the repaired rule sees a storm, the repaired odds are 5 lower (or held at 90) and the legacy odds are untouched', () => {
    let lower = 0;
    let held = 0;
    for (const w of weatherWorlds) for (const a of w.at) {
      const legacy = descentWeather(w.input, w.input.band, a[0], 'legacy');
      const repaired = descentWeather(w.input, w.input.band, a[0]);
      if (legacy.stormActive === repaired.stormActive) continue;
      const before = odds(w.input, legacy.stormActive);
      const after = odds(w.input, repaired.stormActive);
      expect(before.successPercent).toBe(before.baseSuccessPercent);
      expect(after.successPercent).toBe(Math.max(before.baseSuccessPercent >= 90 ? 90 : 5, before.baseSuccessPercent - 5));
      if (after.successPercent < before.successPercent) lower++; else held++;
    }
    expect(lower).toBeGreaterThan(0);
    expect(lower + held).toBeGreaterThan(0);
  });

  it('the prompt’s event is asked with the world’s anchor biome and the rule’s own token', () => {
    let differing = 0;
    for (const w of weatherWorlds) for (const a of w.at) {
      const biome = biomeFor(w.input, w.input.band);
      const anchor = biome && typeof biome.k === 'string' ? biome.k : null;
      for (const rule of ['legacy', 'repaired'] as const) {
        const weather = descentWeather(w.input, w.input.band, a[0], rule);
        expect(weather.event, JSON.stringify([w.input, a[0], rule])).toBe(weatherEventAt(w.input, anchor, weather.token, a[0]));
      }
      if (descentWeather(w.input, w.input.band, a[0], 'legacy').event !== descentWeather(w.input, w.input.band, a[0]).event) differing++;
    }
    // In the recorded worlds the repair changes the event somewhere (an ice storm for a tornado, or one of them alone).
    expect(differing).toBeGreaterThan(0);
  });
});

/** The legacy markup of the prompt's risk element (13618-13622), rebuilt from the prompt's data. */
function legacyRiskHtml(p: ReturnType<typeof descentPrompt>): string {
  return (p.biomeName !== null ? `${p.biomeName} — ` : '') + `<span class="dtier">${p.tierLabel}</span> · ${p.successPercent}% success`
    + (p.stormLine !== null ? `<br><span class="dwx">${p.stormLine}</span>` : '')
    + (p.eventLine !== null ? `<br><span class="dwx">${p.eventLine}</span>` : '')
    + (p.waveOffLine !== null ? `<br><span class="dhp">${p.waveOffLine}</span>` : '');
}

describe('the descent prompt', () => {
  it('the word for every percent is the recorded one', () => {
    const { label } = recorded('tiers')[0]!.output;
    expect(label.length).toBe(101);
    expect(label.map((_, p) => descentTierLabel(p))).toEqual(label);
  });

  it('under the legacy rule every recorded prompt is reproduced, title and lines', () => {
    const prompts = recorded('prompt');
    expect(prompts.length).toBe(8 * 4 * 2 * 2 * 2);
    const seen = { storm: 0, calm: 0, event: 0, certain: 0 };
    for (const { input, output } of prompts) {
      const weather = descentWeather(input, input.band, input.seconds, 'legacy');
      const prompt = descentPrompt(input.name, odds(input, weather.stormActive), weather);
      expect([prompt.title, legacyRiskHtml(prompt)], JSON.stringify(input)).toEqual(output);
      if (prompt.stormLine !== null) seen.storm++; else seen.calm++;
      if (prompt.eventLine !== null) seen.event++;
      if (prompt.waveOffLine === null) seen.certain++;
    }
    expect(Object.values(seen).every((n) => n > 0)).toBe(true);
  });

  it('says "storm in progress −5" when, and only when, the storm is active, under either rule', () => {
    for (const w of weatherWorlds) for (const a of w.at) for (const rule of ['legacy', 'repaired'] as const) {
      const weather = descentWeather(w.input, w.input.band, a[0], rule);
      const prompt = descentPrompt('X', odds(w.input, weather.stormActive), weather);
      expect(prompt.stormLine, JSON.stringify([w.input, a[0], rule])).toBe(weather.stormActive ? 'storm in progress −5' : null);
      expect(prompt.eventLine).toBe(weather.event === null ? null : WEATHER_EVENT_WORD[weather.event]);
    }
  });

  it('refuses odds worked out for another weather than the one it is told of', () => {
    const planet = worldLandingAt(85);
    const calm = { rule: 'repaired', token: null, stormActive: false, event: null } as const;
    expect(() => descentPrompt('X', odds(planet, true), calm)).toThrow(/weather/);
  });

  it('offers Begin descent and Stay in orbit', () => {
    expect(DESCENT_PROMPT_BUTTONS).toEqual({ go: 'Begin descent', stay: 'Stay in orbit' });
  });

  it('the two notices of a roll read as the legacy game’s, with an icon where it drew a picture', () => {
    const PICTURES: Record<string, string> = { trophy: '🏆', landing: '🛬', blood: '🩸' };
    const text = (parts: ReadonlyArray<string | { icon: string }>): string =>
      parts.map((part) => typeof part === 'string' ? part : PICTURES[part.icon]).join('');
    let fire = 0;
    let waved = 0;
    for (const { input, output } of recorded('roll')) {
      const [landed, , , toast] = output;
      if (landed) {
        if (toast === null) continue;
        fire++;
        const notice = throughTheFireNotice('Testworld');
        expect([`${PICTURES[notice.icon]} ${notice.title}`, text(notice.message)]).toEqual(toast);
        continue;
      }
      waved++;
      // The notice is built from the game's own roll, not from the recorded numbers.
      const { roll } = rolled(input);
      if (roll.landed) throw new Error('the game landed a recorded wave-off');
      const notice = waveOffNotice(roll.damage, roll.nextSuccessPercent);
      expect([`${PICTURES[notice.icon]} ${notice.title}`, text(notice.message)], JSON.stringify(input)).toEqual(toast);
    }
    expect(fire).toBeGreaterThan(0);
    expect(waved).toBeGreaterThan(100);
    expect(text(throughTheFireNotice(null).message)).toBe('A hostile world let you in — few explorers ever stand here.');
  });
});
