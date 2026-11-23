import { describe, expect, it, vi } from 'vitest';
import { createNavController } from '../src/nav';
import { HOME, NEW_GAME, portsFor } from './nav-support';

// The game's sources fail while the stored route is being proven.
vi.mock('@cf/scene', async (original) => ({
  ...await original<typeof import('@cf/scene')>(),
  resolveViewToNav: () => ({ ok: false, reason: 'source-error' }),
}));

describe('a saved route the sources could not check', () => {
  it('seats the universe, keeps the stored route as it is and asks for no save until the player travels', () => {
    const storedRoute = { type: 'star', gal: { ...HOME, size: 86 }, star: { x: 1, y: 2, seed: 3 } };
    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    nav.restore(storedRoute);
    expect(nav.nav.mode).toBe('universe');
    expect(nav.route()).toBe(storedRoute);
    expect(h.saves).toBe(0);

    expect(nav.enterGalaxy(HOME).ok).toBe(true);
    expect(nav.route()).toMatchObject({ type: 'galaxy' });
    expect(h.saves).toBe(1);
  });
});
