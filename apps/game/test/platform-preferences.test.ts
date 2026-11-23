import { describe, expect, it } from 'vitest';
import { DEVICE_PREFERENCE_PREFIX, devicePreferences, deviceStorage } from '../src/platform/preferences';
import { withDeviceStorage } from './save-support';

describe('device preferences', () => {
  it('a written preference reads back, and is stored under the game\'s own key prefix', async () => {
    await withDeviceStorage((rows) => {
      const preferences = devicePreferences(deviceStorage());
      expect(preferences.read('sound/v1')).toBeNull();
      expect(preferences.write('sound/v1', '{"mono":true}')).toBe(true);
      expect(preferences.read('sound/v1')).toBe('{"mono":true}');
      expect(DEVICE_PREFERENCE_PREFIX).toBe('cf-v2-pixel/');
      expect([...rows]).toEqual([['cf-v2-pixel/sound/v1', '{"mono":true}']]);
    });
  });

  it('a key of another game on the same origin is never read as this game\'s preference', async () => {
    await withDeviceStorage((rows) => {
      rows.set('sound/v1', 'old');
      expect(devicePreferences(deviceStorage()).read('sound/v1')).toBeNull();
    });
  });

  it('a device that refuses storage reads nothing and reports the write as not kept', () => {
    const refusing = {
      getItem(): string | null { throw new Error('denied'); },
      setItem(): void { throw new Error('denied'); },
    };
    for (const preferences of [devicePreferences(null), devicePreferences(refusing)]) {
      expect(preferences.read('sound/v1')).toBeNull();
      expect(preferences.write('sound/v1', 'x')).toBe(false);
    }
  });
});
