import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end <= start) throw new Error(`source section is missing: ${startText}`);
  const body = source.slice(start, end);
  if (body.split(needle).length !== 2) {
    throw new Error(`source section must contain exactly one mutation target: ${needle}`);
  }
  return source.slice(0, start) + body.replace(needle, replacement) + source.slice(end);
}

const SETTINGS_START = 'function fillSettings(): void {';
const SETTINGS_END = '\n/* ---- GUIDE + RELEASE HISTORY';
const SOUND_LISTENER = "el.querySelector('#setsnd')!.addEventListener('click',";
const VOLUME_LISTENER = "el.querySelector('#setvol')!.addEventListener('input',";

function listenerBody(source: string, marker: string): string {
  const settings = section(source, SETTINGS_START, SETTINGS_END);
  const listener = settings.indexOf(marker);
  const bodyStart = settings.indexOf('=> {', listener);
  const bodyEnd = settings.indexOf('\n  });', bodyStart);
  if (listener < 0 || bodyStart < listener || bodyEnd <= bodyStart) return '';
  return settings.slice(bodyStart + '=> {'.length, bodyEnd);
}

function audioSettingsWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const sound = listenerBody(source, SOUND_LISTENER);
  const volume = listenerBody(source, VOLUME_LISTENER);
  if (sound.length === 0 || volume.length === 0) return ['settings-audio-listeners'];

  const toggle = sound.indexOf('save.sndOn = !save.sndOn;');
  const soundSync = sound.indexOf('applySfxGain();');
  const refill = sound.indexOf("refillAndFocus('#setsnd');");
  const persist = sound.indexOf('void persistView();');
  if (!(toggle >= 0 && soundSync > toggle && refill > soundSync && persist > refill)
    || (sound.match(/applySfxGain\(\);/g) ?? []).length !== 1
    || sound.includes('save.sfxVol =')) {
    errors.push('sound-settings-sync');
  }

  const volumeWrite = volume.indexOf('save.sfxVol =');
  const volumeSync = volume.indexOf('applySfxGain();');
  const persistSoon = volume.indexOf('persistSoon();');
  if (!(volumeWrite >= 0 && volumeSync > volumeWrite && persistSoon > volumeSync)
    || (volume.match(/applySfxGain\(\);/g) ?? []).length !== 1) {
    errors.push('volume-settings-sync');
  }
  return errors;
}

type SettingsTraceRow = Readonly<{
  action: 'apply' | 'refill' | 'persist-view' | 'persist-soon';
  sound: boolean;
  volume: number;
}>;

function executeListener(
  body: string,
  save: { sndOn: boolean; sfxVol: number },
  trace: SettingsTraceRow[],
  event?: Readonly<{ target: Readonly<{ value: string }> }>,
): void {
  const javascript = body.replace('(e.target as HTMLInputElement)', 'e.target');
  const evaluator = new Function(
    'save', 'applySfxGain', 'refillAndFocus', 'persistView', 'persistSoon',
    'tameGreetingAudioOwner', 'e',
    javascript,
  ) as (...args: unknown[]) => void;
  const record = (action: SettingsTraceRow['action']) => {
    trace.push({ action, sound: save.sndOn, volume: save.sfxVol });
  };
  evaluator(
    save,
    () => record('apply'),
    () => record('refill'),
    () => record('persist-view'),
    () => record('persist-soon'),
    { syncSettings: () => undefined },
    event,
  );
}

function runAudioSettingsOutcome(source: string): Readonly<{
  off: readonly SettingsTraceRow[];
  volumeWhileOff: readonly SettingsTraceRow[];
  on: readonly SettingsTraceRow[];
}> {
  const sound = listenerBody(source, SOUND_LISTENER);
  const volume = listenerBody(source, VOLUME_LISTENER);
  if (sound.length === 0 || volume.length === 0) throw new Error('audio Settings source is missing');
  const save = { sndOn: true, sfxVol: 0.4 };
  const trace: SettingsTraceRow[] = [];
  executeListener(sound, save, trace);
  const off = trace.splice(0);
  executeListener(volume, save, trace, { target: { value: '73' } });
  const volumeWhileOff = trace.splice(0);
  executeListener(sound, save, trace);
  return { off, volumeWhileOff, on: trace.splice(0) };
}

describe('v2 Settings — master Sound wiring', () => {
  it('synchronizes the actual toggled Sound outcome and retains live Volume wiring', () => {
    expect(audioSettingsWiringErrors(mainSource)).toEqual([]);
    expect(runAudioSettingsOutcome(mainSource)).toEqual({
      off: [
        { action: 'apply', sound: false, volume: 0.4 },
        { action: 'refill', sound: false, volume: 0.4 },
        { action: 'persist-view', sound: false, volume: 0.4 },
      ],
      volumeWhileOff: [
        { action: 'apply', sound: false, volume: 0.73 },
        { action: 'persist-soon', sound: false, volume: 0.73 },
      ],
      on: [
        { action: 'apply', sound: true, volume: 0.73 },
        { action: 'refill', sound: true, volume: 0.73 },
        { action: 'persist-view', sound: true, volume: 0.73 },
      ],
    });
  });

  it('negative-controls the former Volume-only implementation and a destructive mute surrogate', () => {
    const volumeOnly = replaceInSectionExact(
      mainSource,
      SETTINGS_START,
      SETTINGS_END,
      '    applySfxGain();   /* Sound Off zeros and suspends the live sting bus */\n',
      '    /* injected missing Sound synchronization */\n',
    );
    expect(audioSettingsWiringErrors(volumeOnly)).toContain('sound-settings-sync');
    const volumeOnlyOutcome = runAudioSettingsOutcome(volumeOnly);
    expect(volumeOnlyOutcome.off.some((row) => row.action === 'apply')).toBe(false);
    expect(volumeOnlyOutcome.volumeWhileOff.some((row) => row.action === 'apply')).toBe(true);

    const destructiveMute = replaceInSectionExact(
      mainSource,
      SETTINGS_START,
      SETTINGS_END,
      '    applySfxGain();   /* Sound Off zeros and suspends the live sting bus */',
      '    save.sfxVol = save.sndOn ? save.sfxVol : 0;',
    );
    expect(audioSettingsWiringErrors(destructiveMute)).toContain('sound-settings-sync');
    expect(runAudioSettingsOutcome(destructiveMute).off).toEqual([
      { action: 'refill', sound: false, volume: 0 },
      { action: 'persist-view', sound: false, volume: 0 },
    ]);
  });
});
