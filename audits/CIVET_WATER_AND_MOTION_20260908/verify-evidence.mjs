#!/usr/bin/env node
/* Read-only verification of one retained native run. This does not rerun the
 * native instrument, replay motion, render media, or certify product admission.
 * Output is exclusive; existing evidence and verification receipts are refused. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { acquireToolchainLock, LOCK_DIRECTORY } from '../../tools/with-toolchain-lock.mjs';

const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
const audit = path.dirname(fileURLToPath(import.meta.url));
const run = path.join(audit, 'native-filter-state');
const reportPath = path.join(run, 'report.json');
const outputPath = path.join(audit, 'evidence-verification.json');
const ffprobe = '/opt/homebrew/bin/ffprobe';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const relative = file => path.relative(repo, file).split(path.sep).join('/');
const checks = new Map();
const result = {
  schema: 'cf-civet-water-motion-evidence-verification/v1', status: 'RUNNING',
  startedAt: new Date().toISOString(), report: relative(reportPath),
  verificationScript: relative(fileURLToPath(import.meta.url)),
  verificationScriptSha256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
  sourceHashField: 'sources', sources: [], retainedSourceCopies: [], dist: [],
  mediaCarriers: [], media: [], supplementaryObservedMedia: [], videos: [],
  limitations: [
    'Checks retained bytes and video metadata only; does not rerun native outcomes or render media.',
    'Repeated report references are checked independently against the same retained file.',
    'Supplementary files without earlier report hash carriers are observed here, not retrospectively bound to the native report.',
    'Packet counts are encoded packet observations, not proof that every requested native recording frame was encoded.',
    'No product admission, physical-device qualification or human art/motion acceptance follows.',
  ],
};
let lock;
function safePath(root, supplied) {
  assert.equal(typeof supplied, 'string', 'Evidence path must be a string');
  assert(supplied.length && !path.isAbsolute(supplied) && !supplied.includes('\\')
    && !supplied.split('/').includes('..'), 'Unsafe evidence path: ' + supplied);
  const absolute = path.resolve(root, supplied);
  assert(absolute.startsWith(root + path.sep), 'Evidence escaped its directory: ' + supplied);
  assert.equal(fs.realpathSync(absolute), absolute, 'Symlinked evidence is not admitted: ' + supplied);
  assert(fs.statSync(absolute).isFile(), 'Expected regular evidence file: ' + supplied);
  return absolute;
}
function actual(file) {
  if (!checks.has(file)) {
    const bytes = fs.readFileSync(file);
    const row = { path: relative(file), bytes: bytes.length, sha256: sha(bytes) };
    if (/\.png$/iu.test(file)) {
      assert(bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        && bytes.subarray(12, 16).toString('ascii') === 'IHDR', 'Invalid PNG header: ' + row.path);
      row.width = bytes.readUInt32BE(16); row.height = bytes.readUInt32BE(20);
      assert(row.width > 0 && row.height > 0, 'Empty PNG dimensions: ' + row.path);
    }
    checks.set(file, row);
  }
  return checks.get(file);
}
function verify(file, expectedHash, expectedBytes) {
  assert.match(expectedHash, /^[a-f0-9]{64}$/u, 'Missing SHA-256 for ' + relative(file));
  const row = actual(file);
  assert.equal(row.sha256, expectedHash, 'SHA-256 mismatch: ' + row.path);
  if (expectedBytes !== undefined) {
    assert(Number.isSafeInteger(expectedBytes) && expectedBytes > 0, 'Invalid recorded byte length: ' + row.path);
    assert.equal(row.bytes, expectedBytes, 'Byte length mismatch: ' + row.path);
  }
  return row;
}
function filesBelow(directory) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    assert(!entry.isSymbolicLink(), 'Unexpected evidence symlink: ' + entry.name);
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...filesBelow(file));
    else { assert(entry.isFile(), 'Unexpected evidence entry: ' + file); found.push(file); }
  }
  return found;
}
function collectMedia(value, location = '$', found = []) {
  if (!value || typeof value !== 'object') return found;
  if (typeof value.path === 'string' && /\.(png|webm)$/iu.test(value.path)) {
    assert(Object.hasOwn(value, 'bytes') && Object.hasOwn(value, 'sha256'), 'Incomplete media carrier at ' + location);
    found.push({ location, path: value.path, bytes: value.bytes, sha256: value.sha256 });
  }
  for (const [key, child] of Object.entries(value)) collectMedia(child, location + '.' + key, found);
  return found;
}
try {
  assert.equal(process.argv.length, 2, 'This verifier accepts no alternate run or output');
  assert(!fs.existsSync(outputPath), 'Verification receipt exists; no retry/overwrite');
  assert.equal(fs.realpathSync(process.cwd()), repo);
  assert.equal(process.platform, 'darwin');
  assert.equal(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(), repo);
  assert.equal(execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(), 'openai/mac');
  lock = acquireToolchainLock('Civet retained evidence hashes and ffprobe');
  result.lock = { directory: LOCK_DIRECTORY, pid: lock.owner.pid, label: lock.owner.label, acquiredAt: lock.owner.startedAt, released: false };

  const reportBytes = fs.readFileSync(reportPath), report = JSON.parse(reportBytes);
  result.reportSha256 = sha(reportBytes); result.reportBytes = reportBytes.length;
  assert.equal(report.schema, 'cf-civet-water-motion-native/v1');
  assert.equal(report.status, 'PASS'); assert.equal(report.certification, false);
  assert.equal(report.browserClosed, true); assert.equal(report.pending, null);
  assert.deepEqual(report.runtimeErrors, []); assert.deepEqual(report.cleanupErrors, []);
  assert.deepEqual(report.modes.map(mode => [mode.name, mode.status]), [['desktop', 'PASS'], ['phone', 'PASS']]);
  assert(report.sources && typeof report.sources === 'object' && !Array.isArray(report.sources));
  assert.equal(Object.keys(report.sources).length, 10, 'Unexpected retained source inventory');
  result.nativeSourceCommit = report.sourceCommit;
  for (const [name, expectedHash] of Object.entries(report.sources)) {
    result.sources.push(verify(safePath(repo, name), expectedHash));
    if (name.startsWith(relative(audit) + '/')) {
      result.retainedSourceCopies.push(verify(safePath(run, path.basename(name)), expectedHash));
    }
  }

  const dist = safePath(repo, report.dist.path + '/study.html');
  const distRoot = path.dirname(dist);
  assert.equal(distRoot, path.join(run, 'dist'));
  assert(Array.isArray(report.dist.inventory) && report.dist.inventory.length === 15);
  const listed = new Set();
  for (const entry of report.dist.inventory) {
    assert(!listed.has(entry.path), 'Duplicate dist file: ' + entry.path); listed.add(entry.path);
    result.dist.push(verify(safePath(distRoot, entry.path), entry.sha256, entry.bytes));
  }
  assert.deepEqual(filesBelow(distRoot).map(file => path.relative(distRoot, file)).sort(), [...listed].sort(), 'Dist file inventory differs');

  const media = new Map();
  for (const carrier of collectMedia(report)) {
    const file = safePath(run, carrier.path);
    const row = verify(file, carrier.sha256, carrier.bytes);
    result.mediaCarriers.push(carrier); media.set(file, row);
  }
  result.media = [...media.values()].sort((a, b) => a.path.localeCompare(b.path));
  assert(result.mediaCarriers.length > 0 && media.size > 0, 'No retained media were verified');
  for (const entry of fs.readdirSync(run, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(png|webm)$/iu.test(entry.name)) continue;
    const file = safePath(run, entry.name);
    if (!media.has(file)) result.supplementaryObservedMedia.push({ ...actual(file), previouslyHashBound: false });
  }

  result.ffprobe = {
    executable: fs.realpathSync(ffprobe),
    version: execFileSync(ffprobe, ['-version'], { encoding: 'utf8', maxBuffer: 1024 * 1024 }).split('\n')[0],
    method: 'One metadata/packet demux per WebM; no decoding, rendering, transcoding or output media',
  };
  const videoPaths = new Set();
  for (const mode of report.modes) {
    assert.equal(mode.videos.length, 3, 'Expected exactly three native recordings per viewport');
    const firstFrame = mode.frames[0];
    for (const clip of ['breathe', 'strike', 'recoil']) {
      const name = mode.name + '-' + clip + '-native.webm';
      const video = mode.videos.find(row => row.path === name);
      assert(video && !videoPaths.has(name), 'Missing/duplicate native video: ' + name); videoPaths.add(name);
      const file = safePath(run, name); verify(file, video.sha256, video.bytes);
      const args = ['-v', 'error', '-select_streams', 'v:0', '-show_packets',
        '-show_entries', 'stream=index,codec_type,codec_name,width,height,duration,nb_frames:packet=pts_time,duration_time:format=format_name,duration,size',
        '-of', 'json', file];
      const metadata = JSON.parse(execFileSync(ffprobe, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 30000 }));
      assert.equal(metadata.streams?.length, 1, 'Expected one inspected video stream: ' + name);
      const stream = metadata.streams[0];
      assert.equal(stream.codec_type, 'video');
      assert.equal(stream.codec_name, /vp9/iu.test(video.mime) ? 'vp9' : /vp8/iu.test(video.mime) ? 'vp8' : 'unsupported-recorded-codec');
      assert.equal(stream.width, firstFrame.width, 'Video/native canvas width differs: ' + name);
      assert.equal(stream.height, firstFrame.height, 'Video/native canvas height differs: ' + name);
      assert.equal(Number(metadata.format.size), video.bytes, 'ffprobe byte size differs: ' + name);
      assert.match(metadata.format.format_name, /webm/u);
      assert(Array.isArray(metadata.packets) && metadata.packets.length > 0, 'No encoded video packets: ' + name);
      let first = Infinity, last = -Infinity;
      for (const packet of metadata.packets) {
        const pts = Number(packet.pts_time), duration = packet.duration_time === undefined ? 0 : Number(packet.duration_time);
        assert(Number.isFinite(pts) && Number.isFinite(duration) && duration >= 0, 'Invalid packet timing: ' + name);
        first = Math.min(first, pts); last = Math.max(last, pts + duration);
      }
      const formatDuration = Number(metadata.format.duration);
      const durationSeconds = Number.isFinite(formatDuration) ? formatDuration : last - first;
      assert(Number.isFinite(durationSeconds) && durationSeconds > 0, 'No positive observed video duration: ' + name);
      result.videos.push({ path: relative(file), sha256: video.sha256, bytes: video.bytes,
        codec: stream.codec_name, width: stream.width, height: stream.height, durationSeconds,
        durationAuthority: Number.isFinite(formatDuration) ? 'ffprobe format duration' : 'ffprobe packet end minus first packet timestamp',
        formatDurationSeconds: Number.isFinite(formatDuration) ? formatDuration : null,
        firstPacketSeconds: first, lastPacketEndSeconds: last, encodedPacketCount: metadata.packets.length,
        nativeFrameRequests: video.frames, nominalClipMs: firstFrame.state.durations[clip],
        ffprobeStream: stream, ffprobeFormat: metadata.format });
    }
  }
  assert.equal(videoPaths.size, 6);
  assert.equal(result.supplementaryObservedMedia.filter(row => row.path.endsWith('.webm')).length, 0, 'Unrecorded native video found');

  // Bind observations across the complete hash/ffprobe interval without touching
  // source files, report carriers, native products or earlier red evidence.
  for (const [file, expected] of checks) {
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.length, expected.bytes, 'Evidence length changed during verification: ' + expected.path);
    assert.equal(sha(bytes), expected.sha256, 'Evidence changed during verification: ' + expected.path);
  }
  assert.equal(sha(fs.readFileSync(reportPath)), result.reportSha256, 'Native report changed during verification');
  result.summary = { sourceFiles: result.sources.length, retainedSourceCopies: result.retainedSourceCopies.length,
    distFiles: result.dist.length, distBytes: result.dist.reduce((sum, row) => sum + row.bytes, 0),
    mediaCarriers: result.mediaCarriers.length, uniqueRecordedMedia: result.media.length,
    supplementaryObservedMedia: result.supplementaryObservedMedia.length, probedVideos: result.videos.length,
    immutableReadbackFiles: checks.size };
  result.status = 'PASS';
} catch (error) {
  result.status = 'FAIL'; result.failure = String(error?.stack || error); process.exitCode = 1;
} finally {
  if (lock) {
    try { lock.release(); result.lock.released = true; }
    catch (error) { result.status = 'FAIL'; result.lockReleaseFailure = String(error?.stack || error); process.exitCode = 1; }
  }
  result.finishedAt = new Date().toISOString();
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: result.status, output: relative(outputPath), summary: result.summary,
    videos: result.videos.map(({ path: file, codec, width, height, durationSeconds }) => ({ path: file, codec, width, height, durationSeconds })),
    failure: result.failure, lockReleased: result.lock?.released }));
}
