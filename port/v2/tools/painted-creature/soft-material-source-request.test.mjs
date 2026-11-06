import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {compileLibraryMaster} from './compile-library-master.mjs';

const fauna = JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json', import.meta.url)));
const sha = value => createHash('sha256').update(value).digest('hex');

for (const [name, family, profileId, candidate] of [
  ['Comb Jelly', 'ctenophore-body', 'comb-jelly', 'radial'],
  ['Marine Worm', 'errant-soft-worm', 'annelid-water', 'annelid'],
  ['Polychaete Worm', 'errant-soft-worm', 'annelid-water', 'annelid'],
]) {
  test(`actual ${name} compiler preserves canonical taxonomy and writes the new material request`, async () => {
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-soft-material-source-'));
    try {
      const output = path.join(scratch, 'packet');
      const result = await compileLibraryMaster(name, output);
      const request = JSON.parse(fs.readFileSync(path.join(output, 'request.json')));
      const subject = JSON.parse(fs.readFileSync(path.join(output, 'subject-source.json')));
      const prompt = fs.readFileSync(path.join(output, 'prompt.txt'), 'utf8');
      assert.equal(result.family, family);
      assert.equal(request.family, family);
      assert.equal(subject.family, family);
      assert.equal(subject.profile.id, profileId);
      assert.deepEqual(subject.profile.candidateTemplates, [candidate]);
      for (const feature of fauna.find(species => species.name === name).mustRead) {
        assert.ok(prompt.includes(feature), feature);
      }
      assert.equal(request.promptSha256, sha(prompt));
      assert.equal(request.compilerSha256, sha(fs.readFileSync(new URL('./compile-library-master.mjs', import.meta.url))));
      assert.equal(request.authoringCreated, false);
      assert.equal(request.observedVisibleLegs, null);
      assert.deepEqual(request.requestedSize, [1254, 1254]);
      await assert.rejects(compileLibraryMaster(name, output), /New packet directory/);
    } finally {
      fs.rmSync(scratch, {recursive: true});
    }
  });
}
