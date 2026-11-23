/** Every device preference of this game is stored under a key that starts with this. A preference stays
 *  on the device: it is not part of the save, so a reset, a backup or a restore never touches it. */
export const DEVICE_PREFERENCE_PREFIX = 'cf-v2-pixel/';

export interface DevicePreferences {
  /** The stored value, or null when there is none or the device's storage cannot be read. */
  read(name: string): string | null;
  /** Whether the device kept the value. */
  write(name: string, value: string): boolean;
}

/** The device's storage, or null when the browser refuses it. */
export function deviceStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function devicePreferences(storage: Pick<Storage, 'getItem' | 'setItem'> | null): DevicePreferences {
  return {
    read(name) {
      try {
        return storage?.getItem(DEVICE_PREFERENCE_PREFIX + name) ?? null;
      } catch {
        return null;
      }
    },
    write(name, value) {
      try {
        if (storage === null) return false;
        storage.setItem(DEVICE_PREFERENCE_PREFIX + name, value);
        return true;
      } catch {
        return false;
      }
    },
  };
}
