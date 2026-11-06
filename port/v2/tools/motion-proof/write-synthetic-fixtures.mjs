#!/usr/bin/env node
/* Writes the SYNTHETIC A11 fixture records (see synthetic.ts) to fixtures/.
 * Usage: node tools/motion-proof/write-synthetic-fixtures.mjs
 * Deterministic: byte-identical output on every run; the tests assert the
 * files on disk equal the generator so neither can drift alone. */
import './ts-loader.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { SYNTHETIC_IDS, syntheticRecordOf, syntheticGenomeOf } = await import('./synthetic.ts');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
mkdirSync(dir, { recursive: true });
for (const id of SYNTHETIC_IDS) {
  writeFileSync(path.join(dir, `${id}.synthetic.landmarks.json`), JSON.stringify(syntheticRecordOf(id), null, 2) + '\n');
  writeFileSync(path.join(dir, `${id}.synthetic.genome.json`), JSON.stringify(syntheticGenomeOf(id), null, 2) + '\n');
  console.log(`${id}: fixtures/${id}.synthetic.{landmarks,genome}.json (SYNTHETIC — not painter output)`);
}
