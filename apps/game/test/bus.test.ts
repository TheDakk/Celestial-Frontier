import { describe, expect, it } from 'vitest';
import { createBus } from '../src/bus';

type E = { a: { n: number }; b: { s: string } };

describe('event bus', () => {
  it('delivers a payload to every listener of that type, in subscription order', () => {
    const bus = createBus<E>();
    const seen: string[] = [];
    bus.on('a', (p) => seen.push(`first:${p.n}`));
    bus.on('a', (p) => seen.push(`second:${p.n}`));
    bus.on('b', () => seen.push('wrong type'));
    bus.emit('a', { n: 7 });
    expect(seen).toEqual(['first:7', 'second:7']);
  });
  it('a removed listener hears nothing more', () => {
    const bus = createBus<E>();
    const seen: number[] = [];
    const off = bus.on('a', (p) => seen.push(p.n));
    bus.on('a', (p) => seen.push(p.n * 10));
    bus.emit('a', { n: 1 });
    off();
    off();
    bus.emit('a', { n: 2 });
    expect(seen).toEqual([1, 10, 20]);
  });
  it('the same function subscribed twice is heard twice, and each removal takes away one', () => {
    const bus = createBus<E>();
    let heard = 0;
    const listener = (): void => { heard++; };
    const offFirst = bus.on('a', listener);
    bus.on('a', listener);
    bus.emit('a', { n: 1 });
    expect(heard).toBe(2);
    offFirst();
    bus.emit('a', { n: 1 });
    expect(heard).toBe(3);
  });
  it('a listener that throws does not stop the others; emit rethrows the first error', () => {
    const bus = createBus<E>();
    const seen: string[] = [];
    bus.on('a', () => { seen.push('one'); throw new Error('first'); });
    bus.on('a', () => { seen.push('two'); throw new Error('second'); });
    bus.on('a', () => seen.push('three'));
    expect(() => bus.emit('a', { n: 1 })).toThrow('first');
    expect(seen).toEqual(['one', 'two', 'three']);
  });
  it('an emit made inside a listener is delivered after the current emit finishes', () => {
    const bus = createBus<E>();
    const seen: string[] = [];
    bus.on('a', () => { seen.push('a'); bus.emit('b', { s: 'x' }); seen.push('a-done'); });
    bus.on('a', () => seen.push('a-second'));
    bus.on('b', (p) => seen.push(`b:${p.s}`));
    bus.emit('a', { n: 1 });
    expect(seen).toEqual(['a', 'a-done', 'a-second', 'b:x']);
  });
  it('an error thrown by a queued emit reaches the outermost caller, after everything ran', () => {
    const bus = createBus<E>();
    const seen: string[] = [];
    bus.on('a', () => { bus.emit('b', { s: 'x' }); seen.push('a'); });
    bus.on('b', () => { seen.push('b'); throw new Error('inner'); });
    expect(() => bus.emit('a', { n: 1 })).toThrow('inner');
    expect(seen).toEqual(['a', 'b']);
    seen.length = 0;
    expect(() => bus.emit('a', { n: 2 })).toThrow('inner');
    expect(seen).toEqual(['a', 'b']);
  });
  it('a listener removed during an emit is not called by it; one added is heard from the next emit', () => {
    const bus = createBus<E>();
    const seen: string[] = [];
    const offFirst = bus.on('a', () => { seen.push('first'); offSecond(); bus.on('a', () => seen.push('added')); offFirst(); });
    const offSecond = bus.on('a', () => seen.push('second'));
    bus.emit('a', { n: 1 });
    expect(seen).toEqual(['first']);
    seen.length = 0;
    bus.emit('a', { n: 2 });
    expect(seen).toEqual(['added']);
  });
});
