import { TextStyle } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createSceneText } from './scene-text.js';

describe('scene text ownership', () => {
  it('releases each shared-style subscription with its Text owner', () => {
    const style = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12 });
    const first = createSceneText('first', style);
    const second = createSceneText('second', style);

    expect(style.listenerCount('update')).toBe(2);
    first.destroy();
    expect(style.listenerCount('update')).toBe(1);
    expect(second.destroyed).toBe(false);
    first.destroy();
    expect(style.listenerCount('update')).toBe(1);
    second.destroy();
    expect(style.listenerCount('update')).toBe(0);
    expect(() => style.emit('update')).not.toThrow();
  });
});
