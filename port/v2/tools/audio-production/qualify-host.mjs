/** Installed REAPER -> saved Surge state -> two actual renders -> independent PCM checks.
 * Diagnostic sound only. No accepted asset, original recording or game mapping is created. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {acquireToolchainLock} from '../../../../tools/with-toolchain-lock.mjs';
import {sha256, wavFacts} from '../asset-intake/contracts.mjs';
import {measureAudio} from '../asset-intake/audio-export.mjs';

const root = path.resolve(import.meta.dirname, '../../../..');
const out = path.resolve(process.argv[2] ?? '');
if (process.argv.length !== 3 || fs.existsSync(out)) throw Error('Usage: qualify-host.mjs NEW_OUTPUT_DIRECTORY');
const app = '/Applications/REAPER.app/Contents/MacOS/REAPER';
const script = path.join(import.meta.dirname, 'qualify-reaper.lua');
if (!fs.existsSync(app)) throw Error('Installed REAPER is unavailable; see LOCAL_RUN.md');
// Create the output atomically before acquiring a job lock; a bad parent cannot leak the lock.
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.mkdirSync(out);
const release = acquireToolchainLock('C3 REAPER/Surge saved-state qualification');
const report = {schema: 'cf.reaper-host-qualification/v1', status: 'RUNNING',
  spend: 0, assetClass: 'technical-synth-diagnostic', listeningAccepted: false,
  sources: {script: sha256(fs.readFileSync(script)), runner: sha256(fs.readFileSync(import.meta.filename))}, stages: []};
function stage(name, args, env = {}) {
  const result = spawnSync(app, args, {cwd: root, env: {...process.env, ...env},
    timeout: 30000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8'});
  fs.writeFileSync(path.join(out, name + '.log'), (result.stdout ?? '') + (result.stderr ?? ''), {flag: 'wx'});
  report.stages.push({name, exit: result.status, signal: result.signal, error: result.error?.message ?? null});
  if (result.error || result.status !== 0) throw Error(name + ' failed; no next stage or automatic retry');
}
function pcm(bytes) {
  wavFacts(bytes, 2);
  for (let i = 12; i < bytes.length;) {
    const length = bytes.readUInt32LE(i + 4);
    if (bytes.toString('ascii', i, i + 4) === 'data') return bytes.subarray(i + 8, i + 8 + length);
    i += 8 + length + length % 2;
  }
  throw Error('Missing PCM');
}
try {
  stage('prepare', ['-newinst','-new','-nosplash',script], {CF_AUDIO_QUALIFICATION_OUT: out});
  const prepared = JSON.parse(fs.readFileSync(path.join(out, 'prepared.json')));
  if (prepared.status !== 'PROJECT_PREPARED') throw Error('Project preparation incomplete');
  const project = path.join(out, 'host-qualification.rpp'), before = fs.readFileSync(project);
  stage('render', ['-newinst','-nosplash','-renderproject',project]);
  const first = fs.readFileSync(path.join(out, 'host-qualification.wav'));
  const facts = wavFacts(first,2), measurement = measureAudio(first,'wav',facts.durationSeconds);
  if (facts.frames !== 144000 || measurement.truePeakDbTP > -1) throw Error('Wrong frames or peak');
  const replay = path.join(out,'replay'); fs.mkdirSync(replay);
  const old = 'RENDER_FILE "' + path.join(out,'host-qualification.wav') + '"';
  const next = 'RENDER_FILE "' + path.join(replay,'host-qualification.wav') + '"';
  const source = before.toString('utf8');
  if (source.split(old).length !== 2) throw Error('Unique render destination required');
  const replayProject = path.join(replay,'host-qualification.rpp');
  fs.writeFileSync(replayProject,source.replace(old,next),{flag:'wx'});
  stage('replay', ['-newinst','-nosplash','-renderproject',replayProject]);
  const second = fs.readFileSync(path.join(replay,'host-qualification.wav'));
  const secondFacts = wavFacts(second,2), secondMeasurement = measureAudio(second,'wav',secondFacts.durationSeconds);
  if (secondFacts.frames !== 144000 || secondMeasurement.truePeakDbTP > -1) throw Error('Replay frames or peak');
  if (!fs.readFileSync(project).equals(before)) throw Error('Original project changed');
  if (!fs.readFileSync(path.join(out,'host-qualification.wav')).equals(first)) throw Error('Original render changed');
  const a = pcm(first), b = pcm(second);
  let changed = 0, maxSampleDelta = 0;
  for (let i = 0; i < a.length; i += 3) {
    const delta = Math.abs(a.readIntLE(i,3)-b.readIntLE(i,3));
    if (delta) changed++;
    maxSampleDelta = Math.max(maxSampleDelta, delta);
  }
  const mutant = Buffer.from(a); mutant[30] ^= 1;
  if (a.equals(mutant)) throw Error('Changed-PCM control was accepted');
  report.audio = {first: {sha256:sha256(first),...facts,measurement},
    replay: {sha256:sha256(second),...secondFacts,measurement:secondMeasurement},
    identicalPcm:a.equals(b),changedSamples:changed,maxSampleDelta,changedPcmControlRejected:true};
  report.projectSha256 = sha256(before);
  report.status = a.equals(b) ? 'PASS' : 'RENDERED_REPLAY_DIFFERS';
  report.limits = ['This diagnostic is not an animal voice or a music-state asset.',
    'Only the measured installed instrument/settings are qualified; no universal preset determinism claim.',
    'No listening approval, download, game integration or species coverage is implied.'];
  if (!a.equals(b)) process.exitCode = 1;
} catch (error) {
  report.status = 'FAIL'; report.error = String(error.stack ?? error); process.exitCode = 1;
} finally {
  report.sourceUnchanged = report.sources.script === sha256(fs.readFileSync(script))
    && report.sources.runner === sha256(fs.readFileSync(import.meta.filename));
  if (!report.sourceUnchanged) {report.status = 'FAIL'; process.exitCode = 1;}
  fs.writeFileSync(path.join(out,'qualification.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  release.release();
}
console.log(JSON.stringify({status:report.status,output:out,audio:report.audio?.identicalPcm}));
