import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import { privateJson, privatePathText } from './compendiummem-v2-privacy.mjs';
import { materializedSources } from './compendiummem-v2-materialize.mjs';

test('new evidence aliases home paths without changing samples, hashes or diagnostic content', () => {
  const home = path.join(os.tmpdir(), 'synthetic-owner-home');
  const input = { source: home + '/Projects/celestial-frontier-openai-mac', commands: [{ args: [home + '/tool.mjs'], error: 'FAIL at ' + home + '/input.json' }], heap: 123456, ceilings: { max: 65536 }, hash: 'a'.repeat(64), status: 'fail', diagnosis: 'native limit exceeded' };
  const before = structuredClone(input), result = JSON.parse(privateJson(input, home));
  assert.equal(result.source, '~/Projects/celestial-frontier-openai-mac');
  assert.equal(result.commands[0].args[0], '~/tool.mjs');
  assert.equal(result.commands[0].error, 'FAIL at ~/input.json');
  for (const key of ['heap','ceilings','hash','status','diagnosis']) assert.deepEqual(result[key], input[key]);
  assert.deepEqual(input, before);
  assert.equal(privatePathText('ordinary game asset and failure'), 'ordinary game asset and failure');
  assert.throws(() => privatePathText('value', ''), /invalid/);
});

test('only the generated v2 writer adds privacy; sealed v1 writer and raw evaluator stay exact', () => {
  const before = fs.readFileSync(new URL('./compendiummem.mjs', import.meta.url), 'utf8');
  const generated = materializedSources().outputs['collector.mjs'];
  assert.ok(before.includes("fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\\n');"));
  assert.ok(!before.includes('privateJson'));
  assert.ok(generated.includes('fs.writeFileSync(temporary, privateJson(value));'));
  assert.ok(generated.includes('compendiummem-v2-privacy.mjs'));
});


test('the actual generated atomic writer removes a synthetic home; omitted-wrapper mutant fails privacy', () => {
  const generated = materializedSources().outputs['collector.mjs'];
  const start = generated.indexOf('function atomicWriteJson('), end = generated.indexOf('\nfunction lifecycleErrorMessage', start);
  assert.ok(start > 0 && end > start);
  const body = generated.slice(start, end), directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-private-writer-'));
  const home = path.join(os.tmpdir(), 'synthetic-home-with-spaces');
  const context = { fs, path, process, crypto, privateJson: value => privateJson(value, home) };
  const value = { error: home + '/proof.mjs:44: limit exceeded', metric: 1234, hash: 'e'.repeat(64), status: 'fail' };
  try {
    const output = path.join(directory, 'report.json');
    vm.runInNewContext('(' + body + ')', context)(output, value);
    const clean = fs.readFileSync(output, 'utf8');
    assert.ok(!clean.includes(home));
    assert.equal(JSON.parse(clean).error, '~/proof.mjs:44: limit exceeded');
    assert.equal(JSON.parse(clean).metric, value.metric);
    const mutant = body.replace('privateJson(value)', "JSON.stringify(value, null, 2) + '\\n'");
    assert.notEqual(mutant, body);
    vm.runInNewContext('(' + mutant + ')', context)(output, value);
    assert.ok(fs.readFileSync(output, 'utf8').includes(home), 'actual omitted wrapper must be caught');
  } finally { fs.rmSync(directory, { recursive: true }); }
});
