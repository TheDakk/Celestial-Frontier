import { describe, expect, it } from 'vitest';
import { isRegisteredCF1WorldAddress } from '@cf/domain-worldidentity';
import { registerCF1WorldAddressAuthority } from '@cf/domain-worldidentity/mint-internal';

function deepFrozenWorld() {
  return Object.freeze({
    format: 'CF1' as const,
    key: 'CF1:g999@90,-60/s424242@560,170/p133#2',
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
    planet: Object.freeze({ seed: 133, ordinal: 2 }),
  });
}

describe('@cf/domain-worldidentity authority registry', () => {
  it('rejects malformed and only-shallow-frozen mint inputs', () => {
    const valid = deepFrozenWorld();
    expect(() => registerCF1WorldAddressAuthority(Object.freeze({
      ...valid,
      galaxy: { ...valid.galaxy },
    }))).toThrow('deeply frozen canonical address');
    expect(() => registerCF1WorldAddressAuthority(Object.freeze({
      ...valid,
      planet: Object.freeze({ seed: 133, ordinal: -1 }),
    }))).toThrow('deeply frozen canonical address');
    expect(isRegisteredCF1WorldAddress(valid)).toBe(false);
  });

  it('registers only the exact object and refuses a deeply frozen structural clone publicly', () => {
    const valid = deepFrozenWorld();
    const registered = registerCF1WorldAddressAuthority(valid);
    const clone = deepFrozenWorld();
    expect(registered).toBe(valid);
    expect(isRegisteredCF1WorldAddress(valid)).toBe(true);
    expect(isRegisteredCF1WorldAddress(clone)).toBe(false);
    expect(isRegisteredCF1WorldAddress(structuredClone(valid))).toBe(false);
  });
});
