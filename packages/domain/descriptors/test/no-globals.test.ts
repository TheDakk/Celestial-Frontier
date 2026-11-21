import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { galaxiesInCell, systemFor } from '@cf/domain-worldgen';
import {
  beltDescriptor, CAPTURE_THUMB, cmbDescriptor, describePickWithState, galaxyDescriptor, galaxyStats,
  kuiperDescriptor, moonDescriptor, oortDescriptor, planetDescriptor, planetDescriptorAtEcologyEpoch,
  starDescriptor, visitorDescriptor, wormholeDescriptor,
  type DescriptorNavigationState, type DescriptorPick,
} from '@cf/domain-descriptors';

/* The descriptors package reads its app hooks by import: no descriptor, and no part of the package,
   puts a hook, the sprite pool, the ecology epoch or the app's `st` on the global object. This file
   calls every descriptor kind (directly, and every pick kind of descriptors-misc.json through the card
   router) and the epoch wrapper, then looks for each of those names on globalThis. */
const GLOBALS = ['_cardFactsSet', '_earthNamePass', 'GAL_KIND', 'planetThumb', 'starThumb', 'galaxyThumb',
  'moonThumb', 'cometThumb', 'beltThumb', 'GAL_SPRITES', 'COSMIC_EPOCH', 'st'];

type Raw = Record<string, unknown>;
interface Row { input: { pick: DescriptorPick; nav: DescriptorNavigationState; epoch?: number } }
const misc = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/descriptors-misc.json', import.meta.url), 'utf8'),
) as { sections: Record<string, Row[]> };

const definedGlobals = (): string[] => GLOBALS.filter((name) => name in globalThis);

describe('@cf/domain-descriptors — no app hook is a global', () => {
  it('every descriptor kind and the epoch wrapper run, and leave none of the hook names on globalThis', () => {
    expect(definedGlobals()).toEqual([]);

    const sol = systemFor(424242) as unknown as Raw & { planets: Array<Raw & { P: Raw }> };
    const earth = sol.planets.find((pl) => pl.P.seed === 133)!;
    const jupiter = sol.planets.find((pl) => pl.P.type === 'gas')!;
    const home = galaxiesInCell(0, -1)[0] as unknown as Raw;
    const cards = [
      galaxyDescriptor(home), starDescriptor(424242), planetDescriptor(earth.P, sol, earth),
      planetDescriptor(jupiter.P, sol, jupiter), planetDescriptorAtEcologyEpoch(earth.P, sol, earth, 12),
      moonDescriptor(earth, 0 as never), beltDescriptor(sol, 424242), kuiperDescriptor(sol, 424242), oortDescriptor(424242),
      visitorDescriptor(424242), wormholeDescriptor(), cmbDescriptor(),
    ] as unknown as Array<{ thumb?: string | null; species?: unknown[] }>;
    expect(galaxyStats(home)).toBeTruthy();

    // The imported hooks answered: the thumb stub on each card that draws one, and the Earth name pass.
    expect(cards.slice(0, 7).map((c) => c.thumb)).toEqual(new Array(7).fill(CAPTURE_THUMB));
    expect((cards[4]!.species as Raw[]).some((g) => typeof g._earthName === 'string')).toBe(true);

    // Every pick kind of the misc fixture through the router, the comet and quasar cards among them.
    const kinds = new Set<string>();
    for (const rows of Object.values(misc.sections)) {
      for (const { input } of rows) {
        kinds.add(input.pick.kind);
        describePickWithState(structuredClone(input.pick), input.nav, () => undefined, input.epoch ?? 0);
      }
    }
    expect([...kinds].sort()).toEqual(['belt', 'cmb', 'comet', 'deco', 'dwarf', 'galaxy', 'kuiper', 'moon', 'nothing',
      'oort', 'planet', 'protostar', 'quasar', 'radio', 'snova', 'star', 'starsys', 'visitor', 'worm']);

    expect(definedGlobals()).toEqual([]);
  });
  it('notices each hook name when it is put on globalThis (control)', () => {
    for (const name of GLOBALS) {
      try {
        Reflect.set(globalThis, name, undefined);
        expect(definedGlobals(), name).toEqual([name]);
      } finally {
        Reflect.deleteProperty(globalThis, name);
      }
    }
    expect(definedGlobals()).toEqual([]);
  });
});
