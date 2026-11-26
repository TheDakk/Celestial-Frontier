/* The new world types the game plays with. All are off: every world plays by the legacy rules.
   Turning one on is one line here and one new recorded fixture, on Dakk's word. */
import type { WorldSwitches } from '@cf/domain-worldkinds';

export const WORLD_SWITCHES: WorldSwitches = Object.freeze({
  iceGiant: false,
  hycean: false,
  megaEarth: false,
  dwarf: false,
  rogue: false,
  double: false,
  greatMoon: false,
  trojan: false,
  protoplanet: false,
  shattered: false,
  smallBody: false,
  artefact: false,
  eccentric: false,
  kindRow: false,
});
