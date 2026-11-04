// Thin shared wrapper around the TypeSafe SDK for the offline audit tools.
//
// LAWS (see TYPESAFE_START_HERE.md):
//   * OFFLINE TOOLING ONLY. Nothing here may be reached from main.js or the v2
//     runtime — the shipped game is deterministic, offline, and has no server to
//     hold a key.
//   * The key comes from the TYPESAFE_API_KEY environment variable and nothing
//     else. It is never read from, or written to, a file in this repo.
//   * Jev is text-only. Send names, reference rows and verdict prose, never PNGs.
//   * Every tool has --dry-run (print the first request, call nothing) so its
//     question design can be reviewed without spending.
//   * Answers are cached under tools/reports/ (gitignored) keyed by item so a
//     re-run only pays for what changed; --fresh ignores the cache.
'use strict';
const fs = require('fs');
const path = require('path');

const REPORTS = path.join(__dirname, 'reports');
const PRICE_PER_M_INPUT = 0.042;   // USD per million input tokens (models.md, jev-1.13, output free)

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (!s.startsWith('--')) { a._.push(s); continue; }
    const k = s.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { a[k] = next; i++; } else a[k] = true;
  }
  return a;
}

function hasKey() { return !!(process.env.TYPESAFE_API_KEY || '').trim(); }

function makeClient(args) {
  if (args['dry-run']) return null;
  if (!hasKey()) {
    console.log('TYPESAFE_API_KEY is not set. Set it in this shell and re-run, or pass --dry-run to review the request.');
    process.exit(2);
  }
  const { TypeSafeClient } = require('@typesafe-ai/sdk');
  return new TypeSafeClient({ timeout: Number(args.timeout || 120000) });
}

function loadCache(name, fresh) {
  const f = path.join(REPORTS, name + '.cache.json');
  if (fresh || !fs.existsSync(f)) return {};
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return {}; }
}
function saveCache(name, cache) {
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(path.join(REPORTS, name + '.cache.json'), JSON.stringify(cache));
}
function saveReport(name, data) {
  fs.mkdirSync(REPORTS, { recursive: true });
  const f = path.join(REPORTS, name + '.json');
  fs.writeFileSync(f, JSON.stringify(data, null, 1));
  return f;
}

// Run `items` through Jev in batches. `build(batch)` returns { state, questions,
// keys } where keys maps question-id -> cache key. Cached keys are skipped.
// Returns { answers: {cacheKey: answer}, usage: {input_tokens, output_tokens, requests} }.
async function runBatches({ name, items, batchSize, build, args }) {
  const client = makeClient(args);
  const cache = loadCache(name, !!args.fresh);
  const usage = { input_tokens: 0, output_tokens: 0, requests: 0, cached: 0 };
  const answers = {};
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const req = build(batch);
    const pending = {};
    for (const [qid, key] of Object.entries(req.keys)) {
      if (cache[key] && !args.fresh) { answers[key] = cache[key]; usage.cached++; }
      else pending[qid] = req.questions[qid];
    }
    if (!Object.keys(pending).length) continue;
    if (!client) {
      console.log('--dry-run: first request payload (' + Object.keys(pending).length + ' questions):');
      console.log(JSON.stringify({ state: req.state, questions: pending }, null, 1).slice(0, 6000));
      console.log('... (dry run; nothing sent). Items total: ' + items.length + ', batches: ' + Math.ceil(items.length / batchSize));
      return { answers, usage, dry: true };
    }
    const res = await client.systemOne({ state: req.state, questions: pending });
    usage.requests++;
    usage.input_tokens += (res.usage && res.usage.input_tokens) || 0;
    usage.output_tokens += (res.usage && res.usage.output_tokens) || 0;
    for (const qid of Object.keys(pending)) {
      const key = req.keys[qid];
      answers[key] = res.answers[qid];
      cache[key] = res.answers[qid];
    }
    saveCache(name, cache);
    process.stdout.write('  batch ' + (Math.floor(i / batchSize) + 1) + '/' + Math.ceil(items.length / batchSize)
      + '  tokens so far ' + usage.input_tokens + '\r');
  }
  process.stdout.write('\n');
  return { answers, usage, dry: false };
}

function usageLine(u) {
  const usd = (u.input_tokens / 1e6) * PRICE_PER_M_INPUT;
  return u.requests + ' requests, ' + u.input_tokens + ' input tokens (~$' + usd.toFixed(4) + '), ' + u.cached + ' answers from cache';
}

module.exports = { parseArgs, makeClient, runBatches, saveReport, usageLine, hasKey, REPORTS };
