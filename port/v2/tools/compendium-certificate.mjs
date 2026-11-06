/* D57 (Dakk 2026-11-04): the Compendium step of the develop/production browser chain — local and hosted (`test.yml`
   "one-attempt Compendium memory certification" + "verify current Compendium memory evidence") — verifies the ACTIVE v2 I5
   certificate against the exact built bytes (rules in compendiummem-v2-gate.mjs). It lives in its own file on purpose: the v1
   collector (`compendiummem.mjs`) and `package.json` are inputs of the certificate's measurement authority, so this gate never
   edits them. The v1 collector stays runnable as history (`npm run compendiummem`), it is just no longer the gate.
   Usage (from port/v2):
     node tools/compendium-certificate.mjs                       build (evidence mode) once, verify, write the run record
     node tools/compendium-certificate.mjs --verify-run=<run-id>  named verification of that record against the current build
   The run id is CF_COMPENDIUMMEM_RUN_ID when set (the hosted workflow sets it), else a timestamped local id. */
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadActiveCompendiumEvidence } from './compendiummem-active.mjs';
import { compendiumV2GateRecord, verifyCompendiumV2GateRecord } from './compendiummem-v2-gate.mjs';
import { stableJson } from './compendiummem-fixture.mjs';
import { collectCurrentProducerAuthorities, readPreparedProducerAuthorities } from './print-producer-authorities.mjs';

const v2Root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(v2Root, '..', '..');
export const COMPENDIUM_CERTIFICATE_REPORT = path.join(v2Root, 'apps', 'game', 'smoke', 'compendiummem-report.json');
const RUN_ID = /^[a-z0-9][a-z0-9-]{0,95}$/i;
const git = (args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });

/** The checked-out source: commit, and whether anything tracked or untracked differs from it (digest, not contents). */
export function certificateSourceIdentity() {
  const commit = git(['rev-parse', 'HEAD']).trim(), status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('git HEAD is not one full commit: ' + commit);
  if (process.env.GITHUB_SHA !== undefined && process.env.GITHUB_SHA !== commit) throw new Error(`GITHUB_SHA ${process.env.GITHUB_SHA} is not HEAD ${commit}`);
  return { commit, state: status === '' ? 'committed' : 'dirty-diagnostic', statusSha256: crypto.createHash('sha256').update(status).digest('hex') };
}
function runId() {
  const explicit = process.env.CF_COMPENDIUMMEM_RUN_ID;
  if (explicit !== undefined) { if (!RUN_ID.test(explicit)) throw new Error('CF_COMPENDIUMMEM_RUN_ID is invalid'); return explicit; }
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 17) + '-compendium-certificate';
}

export function runCompendiumCertificateGate() {
  const id = runId(), source = certificateSourceIdentity();
  const observed = collectCurrentProducerAuthorities();
  if (stableJson(certificateSourceIdentity()) !== stableJson(source)) throw new Error('source changed during the certificate gate');
  const record = compendiumV2GateRecord({ runId: id, source, observed, epochDirectory: loadActiveCompendiumEvidence().selector.epochDirectory });
  fs.mkdirSync(path.dirname(COMPENDIUM_CERTIFICATE_REPORT), { recursive: true });
  fs.writeFileSync(COMPENDIUM_CERTIFICATE_REPORT, JSON.stringify(record, null, 2) + '\n');
  for (const finding of record.findings) console.error('  ' + finding);
  console.log(`COMPENDIUM CERTIFICATE: ${record.status.toUpperCase()} — ${id} (active v2 certificate ${record.epochDirectory}, source ${source.state})`);
  return record.status === 'pass' ? 0 : 1;
}

export function verifyCompendiumCertificateRun(expectedRunId) {
  if (!RUN_ID.test(expectedRunId)) throw new Error('verify run ID is invalid');
  if (!fs.existsSync(COMPENDIUM_CERTIFICATE_REPORT)) { console.error('COMPENDIUM CERTIFICATE VERIFY: no run record'); return 2; }
  const record = JSON.parse(fs.readFileSync(COMPENDIUM_CERTIFICATE_REPORT, 'utf8'));
  let observed; try { observed = readPreparedProducerAuthorities(record.build); } catch (error) { console.error('COMPENDIUM CERTIFICATE VERIFY: ' + error.message); return 2; }
  const result = verifyCompendiumV2GateRecord(record, expectedRunId, { source: certificateSourceIdentity(), observed, epochDirectory: loadActiveCompendiumEvidence().selector.epochDirectory });
  for (const error of result.errors) console.error('COMPENDIUM CERTIFICATE VERIFY: ' + error);
  console.log(`COMPENDIUM CERTIFICATE VERIFY: ${result.ok ? 'PASS' : 'FAIL'} — ${expectedRunId}`);
  return result.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), verify = args.length === 1 && args[0].startsWith('--verify-run=');
  try {
    if (args.length === 0) process.exitCode = runCompendiumCertificateGate();
    else if (verify) process.exitCode = verifyCompendiumCertificateRun(args[0].slice('--verify-run='.length));
    else { console.error('usage: node tools/compendium-certificate.mjs [--verify-run=<run-id>]'); process.exitCode = 2; }
  } catch (error) { console.error('COMPENDIUM CERTIFICATE: ' + error.message); process.exitCode = 2; }
}
