/* N1 ice giant: a small, cold, blue gas giant. It is picked by rule alone from numbers the legacy game already
   made (planetParams, LEGACY 2681 and 2684; climateBand 4140), so no roll is taken. Neptune is one by the rule. */
import type { WorldTypeDefinition } from '../rules.js';

export const iceGiant: WorldTypeDefinition = {
  key: 'iceGiant',
  label: 'Ice giant',
  slice: [
    { name: 'gas giant', test: (P) => P.type === 'gas' },
    { name: 'size under 1.9', test: (P) => typeof P.sizeMul === 'number' && P.sizeMul < 1.9 },
    { name: 'hue 185 to 225, the blue family', test: (P) => typeof P.hue === 'number' && P.hue >= 185 && P.hue <= 225 },
    { name: 'band cold or frozen', test: (_P, band) => band === 'cold' || band === 'frozen' },
  ],
  source: null,
  bodies: null,
  rogue: null,
  rules: null,
};
