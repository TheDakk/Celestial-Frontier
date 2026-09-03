/* personaplaytest.mjs — synthesize existing automated browser evidence.

   This does not impersonate people and never runs the underlying suites.
   It binds one slice-smoke report and one glass-matrix report from the same
   successful source commit into explicitly AUTOMATED persona coverage.
   Human comprehension, fun, visual judgment and physical-device play remain
   required no matter how many automated checks pass.

   Usage: node tools/personaplaytest.mjs [--selftest]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  glassShipyardKeyboardHeartbeatSelftestInventory,
  shipyardKeyboardHeartbeatInventoryErrors,
} from './glassmatrix-evidence-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const evidenceRoot = path.join(v2Root, 'apps', 'game', 'smoke');
const smokePath = path.join(evidenceRoot, 'slice-smoke-report.json');
const glassPath = path.join(evidenceRoot, 'glassmatrix-report.json');
const jsonPath = path.join(evidenceRoot, 'automated-persona-report.json');
const markdownPath = path.join(evidenceRoot, 'automated-persona-report.md');

const PERSONAS = Object.freeze([
  {
    id: 'novice-touch', name: 'Novice touch player',
    evidence: ['Fresh training is populated at every glass viewport.', 'Phone journey and real touch-size controls are exercised by slice smoke.', 'Survey, landing, Guide, Settings, import and toast remain reachable.'],
    remainsHuman: 'Whether a first-time player understands the objective and controls without coaching.',
  },
  {
    id: 'veteran', name: 'Returning veteran',
    evidence: ['Veteran fixture, persisted training skip and import/reload paths are exercised by slice smoke.', 'Settings and Guide remain populated across the responsive matrix.'],
    remainsHuman: 'Whether the changed interface feels familiar, efficient and respectful of learned habits.',
  },
  {
    id: 'keyboard-only', name: 'Keyboard-only player',
    evidence: ['Canvas focus selects a real rendered target; Enter opens the ordinary action and moves focus.', 'Visible focus, accessible names, reachability, Escape close and focus restoration are audited.'],
    remainsHuman: 'Full Tab-order quality and compatibility with a person’s browser or assistive technology.',
  },
  {
    id: 'low-vision', name: 'Low vision / zoom / contrast',
    evidence: ['150% browser reflow, A++ text, max tone, mono font, 44px targets and contrast over bright artwork are measured.', 'No-blur glass fallback is rendered and audited.'],
    remainsHuman: 'Readability with a person’s actual acuity, magnifier, contrast settings and device.',
  },
  {
    id: 'motion-sensitive', name: 'Motion-sensitive player',
    evidence: ['Reduced-motion Pixi transforms must remain still while the same full-motion scene must move.', 'Preference state and live outcome are both checked.'],
    remainsHuman: 'Comfort during a sustained session and any motion not represented by sampled transforms.',
  },
  {
    id: 'share-explorer', name: 'Share / explorer player',
    evidence: ['Survey, explicit travel/landing, Atlas/share-code flows and invalid actions are exercised by slice smoke.', 'Survey, Planetside, Guide and toast geometry are audited across viewports.'],
    remainsHuman: 'Whether exploration feels discoverable, rewarding and worth sharing.',
  },
  {
    id: 'completionist-current-slice', name: 'Completionist (current slice)',
    evidence: ['Current-slice Compendium, Records, Charters, Guide topics and release archive are populated and reachable.', 'This evidence does not imply unported v2 roadmap systems are complete.'],
    remainsHuman: 'Long-session progression clarity, satisfying goals and completeness beyond the bounded playable slice.',
  },
  {
    id: 'hostile-save', name: 'Hostile save / adversarial input',
    evidence: ['Malformed, wrong-type and fixture-backed import/save paths plus stale-action and reward sentinels are exercised by slice smoke.', 'Import focus, close and responsive geometry are audited separately.'],
    remainsHuman: 'Creative exploit attempts and failure messaging outside the encoded cases.',
  },
  {
    id: 'constrained-device', name: 'Constrained device',
    evidence: ['Twelve layouts cover small phones through ultrawide and 8K, real landscape safe insets and dynamic capped DPR.', 'Fresh browser ownership prevents cross-viewport GPU state from making the matrix vacuous.'],
    remainsHuman: 'Heat, battery drain, sustained frame pacing, memory pressure and real-device browser behavior.',
  },
]);

function readJson(file, label) {
  if (!fs.existsSync(file)) throw new Error(`${label} evidence missing: ${path.relative(v2Root, file)}`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`${label} evidence is not valid JSON (${error.message})`); }
}
function validateEvidence(smoke, glass) {
  const failures = [];
  if (smoke.schema !== 'cf-v2-slice-smoke-ci/v2') failures.push(`slice smoke schema ${JSON.stringify(smoke.schema)} is unsupported`);
  if (glass.schema !== 'cf-v2-glassmatrix/v2') {
    failures.push(`glass matrix schema ${JSON.stringify(glass.schema)} is unsupported`);
  } else {
    failures.push(...shipyardKeyboardHeartbeatInventoryErrors(
      glass.shipyardKeyboardHeartbeatInventory,
    ));
  }
  if (!['develop', 'production'].includes(smoke.assuranceProfile)) {
    failures.push(`slice assurance profile ${JSON.stringify(smoke.assuranceProfile)} is unsupported`);
  }
  if (glass.predecessors?.slice?.schema !== smoke.schema
    || glass.predecessors?.slice?.assuranceProfile !== smoke.assuranceProfile) {
    failures.push(`Glass profile-bound Slice predecessor disagrees with current Slice: slice=${JSON.stringify({
      schema: smoke.schema, assuranceProfile: smoke.assuranceProfile,
    })} glass=${JSON.stringify({
      schema: glass.predecessors?.slice?.schema,
      assuranceProfile: glass.predecessors?.slice?.assuranceProfile,
    })}`);
  }
  if (smoke.status !== 'pass') failures.push(`slice smoke status is ${JSON.stringify(smoke.status)}, expected "pass"`);
  if (glass.status !== 'pass') failures.push(`glass matrix status is ${JSON.stringify(glass.status)}, expected "pass"`);
  if (glass.certifying !== true || glass.scope !== 'full-certifying') {
    failures.push(`glass matrix evidence is not full-certifying: scope=${JSON.stringify(glass.scope)} certifying=${JSON.stringify(glass.certifying)}`);
  }
  if (!smoke.source?.commit || !glass.source?.commit || smoke.source.commit !== glass.source.commit) {
    failures.push(`evidence commit mismatch: slice=${JSON.stringify(smoke.source?.commit)} glass=${JSON.stringify(glass.source?.commit)}`);
  }
  if (!smoke.source?.branch || !glass.source?.branch || smoke.source.branch !== glass.source.branch) {
    failures.push(`evidence branch mismatch: slice=${JSON.stringify(smoke.source?.branch)} glass=${JSON.stringify(glass.source?.branch)}`);
  }
  if (!smoke.source?.state || !glass.source?.state || smoke.source.state !== glass.source.state) {
    failures.push(`evidence source-state mismatch: slice=${JSON.stringify(smoke.source?.state)} glass=${JSON.stringify(glass.source?.state)}`);
  }
  if (smoke.source?.state === 'dirty-diagnostic' || glass.source?.state === 'dirty-diagnostic') {
    if (!smoke.source?.workingTreeSha256 || !glass.source?.workingTreeSha256) {
      failures.push('dirty evidence is missing a working-tree snapshot digest; commit identity alone is stale-prone');
    } else if (smoke.source.workingTreeSha256 !== glass.source.workingTreeSha256) {
      failures.push(`evidence working-tree mismatch: slice=${JSON.stringify(smoke.source.workingTreeSha256)} glass=${JSON.stringify(glass.source.workingTreeSha256)}`);
    }
  }
  if (Number(glass.summary?.viewportCount) !== 12 || glass.viewportInventory?.length !== 12) {
    failures.push(`glass matrix does not contain the full 12-viewport inventory`);
  }
  if (Number(glass.summary?.findingCount) !== 0 || Number(glass.summary?.instrumentFailureCount) !== 0) {
    failures.push('glass matrix pass contains retained findings or instrument failures');
  }
  return failures;
}
function reportObject(smoke, glass) {
  return {
    schema: 'cf-v2-automated-persona-playtest/v1',
    status: 'automated-evidence-pass',
    label: 'AUTOMATED PERSONA — NOT A HUMAN PLAYTEST',
    source: {
      commit: smoke.source.commit, branch: smoke.source.branch, state: smoke.source.state,
      workingTreeSha256: smoke.source.workingTreeSha256 || null,
    },
    inputs: {
      sliceSmoke: {
        path: 'apps/game/smoke/slice-smoke-report.json', schema: smoke.schema,
        assuranceProfile: smoke.assuranceProfile, status: smoke.status,
      },
      glassMatrix: {
        path: 'apps/game/smoke/glassmatrix-report.json', schema: glass.schema,
        assuranceProfile: glass.predecessors.slice.assuranceProfile, status: glass.status,
      },
    },
    personas: PERSONAS.map((persona) => ({ ...persona, automatedStatus: 'covered-by-bounded-evidence' })),
    humanRequired: [
      'First-time comprehension and unaided learnability',
      'Fun, delight, pacing, visual quality and perceived continuity',
      'Physical-device touch, screen reader and assistive-technology behavior',
      'Battery, heat, sustained performance and background/foreground behavior',
      'Long-session progression and creative exploit discovery',
    ],
    claimBoundary: 'Automated evidence proves only the encoded current-slice outcomes. It is not a human accessibility, comprehension, comfort, art-quality or fun verdict.',
  };
}
function markdown(report) {
  const lines = [
    '# Automated Persona Playtest — Current v2 Slice', '',
    '> **AUTOMATED PERSONA — NOT A HUMAN PLAYTEST.**', '',
    `Source: \`${report.source.commit}\` on \`${report.source.branch}\`.`,
    `Assurance profile: \`${report.inputs.sliceSmoke.assuranceProfile}\` (Slice and Glass agree).`,
    'Both input reports passed and identify the same source commit and branch.', '',
    'This synthesis proves only encoded browser outcomes. Human comprehension, fun, visual judgment, comfort, assistive-technology use, and physical-device play remain required.', '',
    '## Automated persona coverage', '',
  ];
  for (const persona of report.personas) {
    lines.push(`### ${persona.name}`, '', '**Automated evidence:**', '');
    for (const row of persona.evidence) lines.push(`- ${row}`);
    lines.push('', `**Still requires a human:** ${persona.remainsHuman}`, '');
  }
  lines.push('## Human play still required', '');
  for (const row of report.humanRequired) lines.push(`- ${row}`);
  lines.push('', '## Claim boundary', '', report.claimBoundary, '');
  return lines.join('\n');
}
function selftest() {
  const base = {
    smoke: { schema: 'cf-v2-slice-smoke-ci/v2', assuranceProfile: 'develop',
      status: 'pass', source: { commit: 'a'.repeat(40), branch: 'openai/test', state: 'committed' } },
    glass: { schema: 'cf-v2-glassmatrix/v2', status: 'pass', scope: 'full-certifying', certifying: true,
      source: { commit: 'a'.repeat(40), branch: 'openai/test', state: 'committed' },
      predecessors: { slice: { schema: 'cf-v2-slice-smoke-ci/v2', assuranceProfile: 'develop' } },
      summary: { viewportCount: 12, findingCount: 0, instrumentFailureCount: 0 },
      shipyardKeyboardHeartbeatInventory:
        glassShipyardKeyboardHeartbeatSelftestInventory(),
      viewportInventory: Array.from({ length: 12 }, (_, index) => ({ label: String(index) })) },
  };
  if (validateEvidence(base.smoke, base.glass).length) throw new Error('PERSONA SELFTEST valid fixture was rejected');
  const stale = structuredClone(base); stale.glass.source.commit = 'b'.repeat(40);
  if (!validateEvidence(stale.smoke, stale.glass).some((row) => row.includes('commit mismatch'))) throw new Error('PERSONA SELFTEST stale commit was accepted');
  const sourceState = structuredClone(base); sourceState.glass.source.state = 'dirty-diagnostic';
  if (!validateEvidence(sourceState.smoke, sourceState.glass).some((row) => row.includes('source-state mismatch'))) throw new Error('PERSONA SELFTEST source-state mismatch was accepted');
  const red = structuredClone(base); red.smoke.status = 'fail';
  if (!validateEvidence(red.smoke, red.glass).some((row) => row.includes('slice smoke status'))) throw new Error('PERSONA SELFTEST red input was accepted');
  const partial = structuredClone(base); partial.glass.viewportInventory.pop();
  if (!validateEvidence(partial.smoke, partial.glass).some((row) => row.includes('12-viewport'))) throw new Error('PERSONA SELFTEST partial matrix was accepted');
  const targeted = structuredClone(base); targeted.glass.scope = 'targeted-diagnostic'; targeted.glass.certifying = false;
  if (!validateEvidence(targeted.smoke, targeted.glass).some((row) => row.includes('not full-certifying'))) throw new Error('PERSONA SELFTEST targeted diagnostic was accepted');
  const crossProfile = structuredClone(base);
  crossProfile.glass.predecessors.slice.assuranceProfile = 'production';
  if (!validateEvidence(crossProfile.smoke, crossProfile.glass)
    .some((row) => row.includes('profile-bound Slice predecessor'))) {
    throw new Error('PERSONA SELFTEST cross-profile Glass predecessor was accepted');
  }
  const legacySlice = structuredClone(base);
  legacySlice.smoke.schema = 'cf-v2-slice-smoke-ci/v1';
  legacySlice.glass.predecessors.slice.schema = 'cf-v2-slice-smoke-ci/v1';
  if (!validateEvidence(legacySlice.smoke, legacySlice.glass)
    .some((row) => row.includes('slice smoke schema'))) {
    throw new Error('PERSONA SELFTEST legacy current-pointer Slice was accepted');
  }
  const legacyGlass = structuredClone(base);
  legacyGlass.glass.schema = 'cf-v2-glassmatrix/v1';
  if (!validateEvidence(legacyGlass.smoke, legacyGlass.glass)
    .some((row) => row.includes('glass matrix schema'))) {
    throw new Error('PERSONA SELFTEST legacy current-pointer Glass was accepted');
  }
  const missingShipyardHeartbeat = structuredClone(base);
  delete missingShipyardHeartbeat.glass.shipyardKeyboardHeartbeatInventory;
  if (!validateEvidence(missingShipyardHeartbeat.smoke, missingShipyardHeartbeat.glass)
    .some((row) => row.includes('Shipyard keyboard heartbeat inventory'))) {
    throw new Error('PERSONA SELFTEST incomplete Glass v2 heartbeat inventory was accepted');
  }
  const dirty = structuredClone(base); dirty.smoke.source.state = 'dirty-diagnostic'; dirty.glass.source.state = 'dirty-diagnostic';
  if (!validateEvidence(dirty.smoke, dirty.glass).some((row) => row.includes('snapshot digest'))) throw new Error('PERSONA SELFTEST unbound dirty evidence was accepted');
  dirty.smoke.source.workingTreeSha256 = 'c'.repeat(64); dirty.glass.source.workingTreeSha256 = 'd'.repeat(64);
  if (!validateEvidence(dirty.smoke, dirty.glass).some((row) => row.includes('working-tree mismatch'))) throw new Error('PERSONA SELFTEST mismatched dirty snapshots were accepted');
  const report = reportObject(base.smoke, base.glass);
  const rendered = markdown(report);
  if (report.personas.length !== 9 || !rendered.includes('NOT A HUMAN PLAYTEST')) throw new Error('PERSONA SELFTEST report labeling/grouping drifted');
  if (report.inputs.sliceSmoke.assuranceProfile !== 'develop'
    || report.inputs.glassMatrix.assuranceProfile !== 'develop'
    || !rendered.includes('Assurance profile: `develop` (Slice and Glass agree).')) {
    throw new Error('PERSONA SELFTEST saved profile binding drifted');
  }
  console.log('AUTOMATED PERSONA REPORT SELFTEST: PASS');
  console.log('  commit/dirty-snapshot mismatch, red input, partial matrix, and human-claim boundary controls passed');
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--selftest') {
  selftest();
  process.exit(0);
}
if (args.length) {
  console.error('usage: node tools/personaplaytest.mjs [--selftest]');
  process.exit(2);
}

try {
  const smoke = readJson(smokePath, 'slice smoke');
  const glass = readJson(glassPath, 'glass matrix');
  const failures = validateEvidence(smoke, glass);
  if (failures.length) {
    console.error('AUTOMATED PERSONA REPORT: REFUSED');
    for (const failure of failures) console.error('- ' + failure);
    process.exit(1);
  }
  const report = reportObject(smoke, glass);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(markdownPath, markdown(report));
  console.log('AUTOMATED PERSONA REPORT: PASS — 9 bounded personas synthesized');
  console.log('human comprehension, fun, assistive-technology and physical-device play remain required');
  console.log('evidence: apps/game/smoke/automated-persona-report.{json,md}');
} catch (error) {
  console.error('AUTOMATED PERSONA REPORT: REFUSED');
  console.error('- ' + error.message);
  process.exit(1);
}
