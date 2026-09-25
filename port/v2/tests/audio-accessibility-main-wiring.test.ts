import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');

function between(source: string, start: string, end: string): string {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  return a >= 0 && b > a ? source.slice(a, b) : '';
}

/* Mono audio / Reduced intensity (2026-09-25): device preferences in Settings that reach the one shared audio runtime. */
function audit(source: string): string[] {
  const findings: string[] = [];
  const settings = between(source, "fillPanel('set',", 'const refillAndFocus');
  for (const [id, field] of [['setmono', 'mono'], ['setsoft', 'reducedIntensity']] as const) {
    if (!settings.includes(`id="${id}"`) || !settings.includes(`aria-pressed="\${audioAccessibility.${field}}"`)) {
      findings.push(`Settings lacks the ${id} toggle bound to audioAccessibility.${field}`);
    }
    const handler = between(source, `el.querySelector('#${id}')!.addEventListener('click', () => {`, `refillAndFocus('#${id}');`);
    if (!handler.includes(`setAudioAccessibility({ ...audioAccessibility, ${field}: !audioAccessibility.${field} })`)) {
      findings.push(`#${id} does not flip ${field} through setAudioAccessibility`);
    }
    if (/persistView|persistSoon|save\./.test(handler)) findings.push(`#${id} writes the save (it is a device preference)`);
  }
  const setter = between(source, 'function setAudioAccessibility(', '\n}\n');
  if (!setter.includes('writeAudioAccessibilityPrefsV1(deviceAudioAccessibilityStorage(), audioAccessibility)')) {
    findings.push('setAudioAccessibility does not keep the choice on this device');
  }
  if (!setter.includes('tameGreetingAudioOwner?.syncSettings()')) findings.push('setAudioAccessibility does not apply the choice live');
  const policy = between(source, 'readPolicy: () => ({', '}),');
  if (!policy.includes('mono: audioAccessibility.mono') || !policy.includes('reducedIntensity: audioAccessibility.reducedIntensity')) {
    findings.push('the audio policy does not carry the modes to the runtime');
  }
  if (!/let audioAccessibility: AudioAccessibilityModes = readAudioAccessibilityPrefsV1\(deviceAudioAccessibilityStorage\(\)\);/.test(source)) {
    findings.push('the modes are not restored from this device at boot');
  }
  if (source.indexOf('let audioAccessibility') > source.indexOf("fillPanel('set',")) {
    findings.push('audioAccessibility is declared after the Settings renderer (temporal dead zone at boot)');
  }
  return findings;
}

describe('Settings → Mono audio / Reduced intensity wiring', () => {
  it('the shipped main.ts wires both toggles to the device store and the live runtime', () => {
    expect(audit(mainSource)).toEqual([]);
  });

  it('negative controls: each broken wiring is named', () => {
    const cases: [string, string, RegExp][] = [
      ['mono: audioAccessibility.mono,', '', /policy does not carry/],
      ["setAudioAccessibility({ ...audioAccessibility, mono: !audioAccessibility.mono });", "save.voiceOn = !save.voiceOn; void persistView();", /#setmono/],
      ['writeAudioAccessibilityPrefsV1(deviceAudioAccessibilityStorage(), audioAccessibility);', '', /keep the choice on this device/],
      ['id="setsoft"', 'id="setsoftx"', /setsoft toggle/],
    ];
    for (const [needle, replacement, expected] of cases) {
      expect(mainSource.split(needle).length, needle).toBe(2);
      expect(audit(mainSource.replace(needle, replacement)).join(' | '), needle).toMatch(expected);
    }
  });
});

/* Battle sounds (v1.8.9 parity, 2026-09-25): the saved `cbx` switch, persisted like Creature voices, reaching the audio policy. */
function auditCombat(source: string): string[] {
  const findings: string[] = [];
  const settings = between(source, "fillPanel('set',", 'const refillAndFocus');
  if (!settings.includes('id="setcombat"') || !settings.includes('aria-pressed="${save.combatSfxOn}"')) findings.push('Settings lacks the Battle sounds toggle bound to save.combatSfxOn');
  const handler = between(source, "el.querySelector('#setcombat')!.addEventListener('click', () => {", "refillAndFocus('#setcombat');");
  if (!handler.includes('save.combatSfxOn = !save.combatSfxOn')) findings.push('#setcombat does not flip save.combatSfxOn');
  if (!handler.includes('tameGreetingAudioOwner?.syncSettings()')) findings.push('#setcombat does not apply live');
  if (!between(source, "el.querySelector('#setcombat')!.addEventListener('click', () => {", '});').concat(between(source, "refillAndFocus('#setcombat');", '\n')).includes('persistView')) findings.push('#setcombat does not persist the save');
  const policy = between(source, 'readPolicy: () => ({', '}),');
  if (!policy.includes('combatSoundsOn: save.combatSfxOn')) findings.push('the audio policy does not carry Battle sounds');
  return findings;
}

describe('Settings → Battle sounds wiring', () => {
  it('the shipped main.ts wires the saved switch to the live policy and persists it', () => {
    expect(auditCombat(mainSource)).toEqual([]);
  });
  it('negative controls', () => {
    const cases: [string, string, RegExp][] = [
      ['combatSoundsOn: save.combatSfxOn,', '', /policy does not carry Battle sounds/],
      ['save.combatSfxOn = !save.combatSfxOn;', 'void 0;', /does not flip/],
      ["refillAndFocus('#setcombat'); void persistView();", "refillAndFocus('#setcombat');", /does not persist/],
    ];
    for (const [needle, replacement, expected] of cases) {
      expect(mainSource.split(needle).length, needle).toBe(2);
      expect(auditCombat(mainSource.replace(needle, replacement)).join(' | '), needle).toMatch(expected);
    }
  });
});

