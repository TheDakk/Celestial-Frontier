import { describe, expect, it } from 'vitest';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { archPins } from './arch-pin.fixtures.js';

/* negative controls of the per-architecture pin helper in both directions */
describe('arch pins', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-arch-pin-')), file = new URL('file://' + path.join(dir, 'p.json'));
  // strings are hashed as-is: the pin for key k is sha256('x')
  fs.writeFileSync(file, JSON.stringify({ x64: { k: '2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881' } }));
  it('arm64 runs the original assertion and never consults a pin', () => {
    let ran = 0; archPins(file, 'arm64').check('missing', 'anything', () => { ran++; }); expect(ran).toBe(1);
  });
  it('x64 passes only the pinned bytes, fails others, and fails loudly with no pin', () => {
    const p = archPins(file, 'x64');
    p.check('k', 'x', () => { throw new Error('arm64 path must not run on x64'); });
    expect(() => p.check('k', 'y', () => {})).toThrow(/x64 pin k/);
    expect(() => p.check('nokey', 'x', () => {})).toThrow(/no x64 pin for "nokey"/);
    expect(() => p.differs('k', 'x', () => {})).toThrow(/negative control k/); p.differs('k', 'y', () => {});
    expect(() => archPins(file, 'riscv64').check('k', 'x', () => {})).toThrow(/no riscv64 pin/);
  });
  it('capture is refused on arm64', () => {
    const before = process.env.CF_CAPTURE_ARCH_PINS; process.env.CF_CAPTURE_ARCH_PINS = '1';
    try { expect(() => archPins(file, 'arm64')).toThrow(/arm64 holds the original captures/); } finally { if (before === undefined) delete process.env.CF_CAPTURE_ARCH_PINS; else process.env.CF_CAPTURE_ARCH_PINS = before; }
  });
});
