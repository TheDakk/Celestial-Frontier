// One-off: seals morph-params.golden.json (64 seeds × 2 archetypes). Re-run ONLY on a deliberate params change, and record why.
import { writeFileSync } from 'node:fs';
const { morphParamsV1 } = await import('./morph-params.ts');
const A = 'e493cfa99fa1b658c927b8cf6face727b619f19a5e9e26ce8cfd93875e684a53', B = '7b86007b758640b5caaf149a423b532fcc1941cc1aa8a096a44c8792b99dcedc';
const genomeOf = (seed) => ({ seed, color: seed % 17, accent: (seed * 7) % 17, pattern: seed % 8, head: seed % 8, tail: (seed * 3) % 7, lumin: seed % 4 === 0 });
const params = []; for (const arch of [A, B]) for (let s = 0; s < 64; s++) params.push(morphParamsV1(genomeOf(s), arch));
writeFileSync(new URL('./morph-params.golden.json', import.meta.url), JSON.stringify({ sealed: '2026-09-22', reason: 'first seal (morph step 1)', archetypes: [A, B], seeds: 64, params }, null, 1) + '\n');
console.log('sealed', params.length);
