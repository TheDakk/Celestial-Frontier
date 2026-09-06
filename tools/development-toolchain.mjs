#!/usr/bin/env node
/* Development-authoring preflight only. No install/upgrade engine, GUI launch,
 * runtime dependency edits, license reads, or application preference writes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TOOLCHAIN = Object.freeze([
  ...['imagemagick', 'ffmpeg', 'python@3.12', 'node', 'gh'].map(name => Object.freeze({ kind: 'formula', name })),
  ...[['blender', 'Blender.app'], ['inkscape', 'Inkscape.app'], ['reaper', 'REAPER.app'], ['surge-xt', 'Surge XT.app']]
    .map(([name, bundle]) => Object.freeze({ kind: 'cask', name, bundle })),
  Object.freeze({ kind: 'npm', name: 'gsap', workspace: 'tools/ui-motion' }),
]);
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const command = (binary, args, allowed = [0]) => {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1', HOMEBREW_NO_ANALYTICS: '1', PYTHONDONTWRITEBYTECODE: '1' } });
  if (result.error || !allowed.includes(result.status)) throw new Error(`${path.basename(binary)} failed (${result.status}): ${result.error?.message ?? result.stderr.slice(-1600)}`);
  return result;
};
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

export function versionState(installed, latest) {
  const numeric = value => typeof value === 'string' && /^\d+(?:\.\d+)*/.exec(value)?.[0].split('.').map(Number);
  const a = numeric(installed), b = numeric(latest);
  if (!installed) return 'not-installed';
  if (installed === latest) return 'current';
  if (!a || !b) return 'unknown';
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) < (b[i] ?? 0)) return 'update-available';
    if ((a[i] ?? 0) > (b[i] ?? 0)) return 'installed-newer';
  }
  return 'metadata-differs'; // Brew revision/build suffixes require a maintainer decision.
}

export function inspectPcm16Wav(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF'
    || bytes.toString('ascii', 8, 12) !== 'WAVE' || bytes.readUInt32LE(4) + 8 !== bytes.length)
    throw new Error('invalid or truncated RIFF/WAVE carrier');
  let fmt, data;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const id = bytes.toString('ascii', offset, offset + 4), size = bytes.readUInt32LE(offset + 4), start = offset + 8;
    if (start + size > bytes.length) throw new Error('truncated WAVE chunk');
    if (id === 'fmt ') {
      if (size < 16 || fmt) throw new Error('invalid WAVE format chunk');
      fmt = { format: bytes.readUInt16LE(start), channels: bytes.readUInt16LE(start + 2),
        sampleRate: bytes.readUInt32LE(start + 4), bitsPerSample: bytes.readUInt16LE(start + 14) };
    }
    if (id === 'data') { if (data) throw new Error('duplicate WAVE data'); data = bytes.subarray(start, start + size); }
    offset = start + size + (size % 2);
  }
  if (!fmt || !data || fmt.format !== 1 || fmt.bitsPerSample !== 16 || fmt.channels !== 1 || data.length % 2)
    throw new Error('expected mono PCM16 WAVE');
  let peak = 0, sumSquares = 0, crossings = 0, previous = 0;
  for (let i = 0; i < data.length; i += 2) {
    const sample = data.readInt16LE(i) / 32768;
    peak = Math.max(peak, Math.abs(sample)); sumSquares += sample * sample;
    if (previous < 0 && sample >= 0) crossings++;
    previous = sample;
  }
  const frames = data.length / 2;
  return { ...fmt, frames, durationSeconds: frames / fmt.sampleRate, peak,
    rms: Math.sqrt(sumSquares / frames), upwardCrossings: crossings, sha256: sha256(bytes) };
}
export function audioWitnessErrors(witness) {
  const { pcm, stream, integratedLufs } = witness;
  return [
    ...(pcm?.sampleRate === 48000 && pcm?.frames === 48000 && pcm?.channels === 1 && pcm?.bitsPerSample === 16 ? [] : ['PCM shape is not one second of mono 48kHz PCM16']),
    ...(pcm?.peak > .12 && pcm?.peak < .13 && pcm?.rms > .08 && pcm?.rms < .10 ? [] : ['PCM signal is silent, clipped or at the wrong level']),
    ...(pcm?.upwardCrossings >= 998 && pcm?.upwardCrossings <= 1001 ? [] : ['PCM signal is not the requested 1kHz tone']),
    ...(stream?.codec_name === 'pcm_s16le' && String(stream?.sample_rate) === '48000' && stream?.channels === 1 && stream?.bits_per_sample === 16 ? [] : ['ffprobe does not corroborate PCM format']),
    ...(Number.isFinite(integratedLufs) && integratedLufs > -24 && integratedLufs < -18 ? [] : ['ebur128 did not measure the generated tone']),
  ];
}
export function parseImageMagickMetric(output) {
  const number = String.raw`(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?`;
  const match = typeof output === 'string' && new RegExp(`^(${number})(?:\\s+\\((${number})\\))?$`).exec(output.trim());
  if (!match) throw new Error('ImageMagick metric is not a numeric value with an optional normalized suffix');
  const absolute = Number(match[1]), normalized = match[2] === undefined ? null : Number(match[2]);
  if (!Number.isFinite(absolute) || absolute < 0 || (normalized !== null
    && (!Number.isFinite(normalized) || normalized < 0 || normalized > 1))) throw new Error('ImageMagick metric is outside its finite range');
  return { absolute, normalized };
}
export function pngComparisonErrors(witness) {
  return witness?.width === 16 && witness?.height === 16 && witness?.format === 'PNG'
    && witness?.sameStatus === 0 && witness?.samePixels === 0
    && witness?.changedStatus === 1 && witness?.changedPixels === 1 ? [] : ['PNG identity/change comparison failed'];
}

export function audioRenderVenvErrors(selected, existing, expectedRoot) {
  const same = key => typeof selected?.[key] === 'string' && selected[key].length > 0 && existing?.[key] === selected[key];
  return [
    ...(selected?.major === 3 && selected?.minor === 12 && existing?.major === 3 && existing?.minor === 12
      && same('version') ? [] : ['existing audio-render venv does not use the selected Python3.12 version']),
    ...(existing?.isolatedVenv === true && existing?.prefixRealPath === expectedRoot ? [] : ['existing audio-render venv identity is missing or wrong']),
    ...(same('architecture') && same('basePrefixRealPath') && same('baseExecutableRealPath')
      && same('executableRealPath') ? [] : ['existing audio-render venv points to a different interpreter/base/architecture']),
    ...(same('ssl') && same('sslModuleRealPath') && same('sslModuleSha256')
      && same('sslExtensionRealPath') && same('sslExtensionSha256') ? [] : ['existing audio-render venv SSL differs from selected Python']),
    ...(existing?.sslContextReady === true && existing?.zlibRoundTrip === true
      && existing?.digest === sha256(Buffer.from('cf-toolchain')) ? [] : ['existing audio-render venv standard-library exercise failed']),
  ];
}
const PYTHON_IDENTITY_PROBE = `import json,sys,ssl,_ssl,venv,hashlib,zlib,sqlite3,platform,pathlib
real=lambda value:str(pathlib.Path(value).resolve())
digest=lambda value:hashlib.sha256(pathlib.Path(value).read_bytes()).hexdigest()
print(json.dumps({"version":sys.version,"major":sys.version_info.major,"minor":sys.version_info.minor,"architecture":platform.machine(),"isolatedVenv":sys.prefix!=sys.base_prefix,"prefixRealPath":real(sys.prefix),"basePrefixRealPath":real(sys.base_prefix),"executableRealPath":real(sys.executable),"baseExecutableRealPath":real(sys._base_executable),"ssl":ssl.OPENSSL_VERSION,"sslModuleRealPath":real(ssl.__file__),"sslModuleSha256":digest(ssl.__file__),"sslExtensionRealPath":real(_ssl.__file__),"sslExtensionSha256":digest(_ssl.__file__),"sslContextReady":isinstance(ssl.create_default_context(),ssl.SSLContext),"sqlite":sqlite3.sqlite_version,"digest":hashlib.sha256(b"cf-toolchain").hexdigest(),"zlibRoundTrip":zlib.decompress(zlib.compress(b"cf-toolchain"))==b"cf-toolchain"}))`;

function installedInventory(report) {
  const brew = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'].find(file => fs.existsSync(file));
  const prefix = brew ? command(brew, ['--prefix']).stdout.trim() : null;
  report.homebrew = brew ? { executable: brew, prefix, version: command(brew, ['--version']).stdout.trim().split('\n')[0] } : { installed: false };
  return TOOLCHAIN.map(tool => {
    try {
      if (tool.kind === 'formula') {
        const opt = prefix && path.join(prefix, 'opt', tool.name);
        if (!opt || !fs.existsSync(opt)) return { ...tool, installed: false, version: null };
        const real = fs.realpathSync(opt);
        return { ...tool, installed: true, version: path.basename(real), prefix: opt, realPath: real };
      }
      if (tool.kind === 'cask') {
        const bundle = ['/Applications', path.join(os.homedir(), 'Applications')]
          .map(root => path.join(root, tool.bundle)).find(file => fs.existsSync(path.join(file, 'Contents', 'Info.plist')));
        if (!bundle) return { ...tool, installed: false, version: null };
        const info = path.join(bundle, 'Contents', 'Info.plist');
        const version = command('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', info]).stdout.trim();
        return { ...tool, installed: true, version, bundlePath: bundle, verification: 'bundle metadata only; not launched or license-validated' };
      }
      const workspace = path.join(REPO, tool.workspace), manifest = readJson(path.join(workspace, 'package.json'));
      const pkg = path.join(workspace, 'node_modules', tool.name, 'package.json');
      return { ...tool, installed: fs.existsSync(pkg), version: fs.existsSync(pkg) ? readJson(pkg).version : null,
        declaredVersion: manifest.dependencies?.gsap ?? null, packagePath: pkg };
    } catch (error) { return { ...tool, installed: false, version: null, error: String(error) }; }
  });
}
async function checkLatest(inventory) {
  return Promise.all(inventory.map(async tool => {
    const url = tool.kind === 'npm' ? 'https://registry.npmjs.org/gsap/latest'
      : `https://formulae.brew.sh/api/${tool.kind}/${encodeURIComponent(tool.name)}.json`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json(), latest = tool.kind === 'formula' ? data.versions?.stable : data.version;
      if (typeof latest !== 'string' || !latest) throw new Error('missing official version metadata');
      const installationVersion = tool.kind === 'formula' && Number(data.revision) > 0 ? `${latest}_${data.revision}` : latest;
      return { name: tool.name, kind: tool.kind, url, latest, installationVersion, license: data.license ?? null,
        state: versionState(tool.version, installationVersion), formulaRevision: data.revision ?? null };
    } catch (error) { return { name: tool.name, kind: tool.kind, url, error: String(error) }; }
  }));
}

function verifyCapabilities(inventory, report) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-development-toolchain-'));
  const record = (name, operation) => { try { const evidence = operation(); report.capabilities.push({ name, pass: true, ...evidence }); }
    catch (error) { report.capabilities.push({ name, pass: false, error: String(error) }); } };
  const binary = (name, executable) => {
    const tool = inventory.find(row => row.name === name);
    if (!tool?.installed || !tool.prefix) throw new Error(`missing managed formula ${name}`);
    const file = path.join(tool.prefix, 'bin', executable);
    if (!fs.existsSync(file)) throw new Error(`missing ${name} capability ${executable}`);
    return file;
  };
  try {
    record('FFmpeg PCM16 / ffprobe / ebur128', () => {
      const ffmpeg = binary('ffmpeg', 'ffmpeg'), ffprobe = binary('ffmpeg', 'ffprobe'), wav = path.join(temp, 'tone.wav');
      const version = command(ffmpeg, ['-version']).stdout.split('\n')[0];
      command(ffmpeg, ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=1000:sample_rate=48000:duration=1', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
      const probe = JSON.parse(command(ffprobe, ['-v', 'error', '-show_streams', '-of', 'json', wav]).stdout);
      const measured = command(ffmpeg, ['-nostdin', '-v', 'info', '-i', wav, '-af', 'ebur128', '-f', 'null', '-']);
      const matches = [...measured.stderr.matchAll(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/g)];
      const witness = { pcm: inspectPcm16Wav(fs.readFileSync(wav)), stream: probe.streams?.[0], integratedLufs: Number(matches.at(-1)?.[1]) };
      const errors = audioWitnessErrors(witness); if (errors.length) throw new Error(errors.join('; '));
      const silence = { ...witness, pcm: { ...witness.pcm, peak: 0, rms: 0, upwardCrossings: 0 } };
      if (!audioWitnessErrors(silence).length) throw new Error('silent-media negative control stayed green');
      let truncatedRejected = false;
      try { inspectPcm16Wav(fs.readFileSync(wav).subarray(0, -1)); } catch { truncatedRejected = true; }
      if (!truncatedRejected) throw new Error('truncated-media negative control stayed green');
      return { version, ...witness, controls: { silentRejected: true, truncatedRejected } };
    });
    record('ImageMagick PNG compare', () => {
      const magick = binary('imagemagick', 'magick'), original = path.join(temp, 'original.png'), changed = path.join(temp, 'changed.png');
      const version = command(magick, ['-version']).stdout.split('\n')[0];
      // Black/white gives one full-contrast pixel even when AE reports fractional channel distance.
      command(magick, ['-size', '16x16', 'xc:black', original]);
      command(magick, [original, '-fill', '#ffffff', '-draw', 'point 0,0', changed]);
      const shape = command(magick, ['identify', '-format', '%m %w %h', original]).stdout.trim().split(/\s+/);
      const same = command(magick, ['compare', '-metric', 'AE', original, original, 'null:']);
      const different = command(magick, ['compare', '-metric', 'AE', original, changed, 'null:'], [0, 1]);
      const sameMetric = parseImageMagickMetric(same.stderr), changedMetric = parseImageMagickMetric(different.stderr);
      const witness = { format: shape[0], width: Number(shape[1]), height: Number(shape[2]), sameStatus: same.status,
        samePixels: sameMetric.absolute, changedStatus: different.status, changedPixels: changedMetric.absolute, sameMetric, changedMetric };
      const errors = pngComparisonErrors(witness); if (errors.length) throw new Error(errors[0] + ': ' + JSON.stringify(witness));
      return { version, ...witness, originalSha256: sha256(fs.readFileSync(original)), changedSha256: sha256(fs.readFileSync(changed)) };
    });
    record('Python3.12 isolated venv / SSL / standard-library imports', () => {
      const python = binary('python@3.12', 'python3.12'), venv = path.join(temp, 'venv');
      command(python, ['-I', '-m', 'venv', '--without-pip', venv]);
      const code = 'import json,sys,ssl,venv,hashlib,zlib,sqlite3; print(json.dumps({"version":sys.version,"major":sys.version_info.major,"minor":sys.version_info.minor,"isolatedVenv":sys.prefix!=sys.base_prefix,"ssl":ssl.OPENSSL_VERSION,"sqlite":sqlite3.sqlite_version,"digest":hashlib.sha256(b"cf-toolchain").hexdigest(),"zlibRoundTrip":zlib.decompress(zlib.compress(b"cf-toolchain"))==b"cf-toolchain"}))';
      const result = JSON.parse(command(path.join(venv, 'bin', 'python'), ['-I', '-c', code]).stdout);
      if (result.major !== 3 || result.minor !== 12 || !result.isolatedVenv || !result.ssl || !result.zlibRoundTrip
        || result.digest !== sha256(Buffer.from('cf-toolchain'))) throw new Error('Python venv/import outcome failed: ' + JSON.stringify(result));
      return result;
    });
    record('existing audio-render venv matches selected Python3.12', () => {
      const python = binary('python@3.12', 'python3.12'), root = path.join(REPO, 'tools/audio-render/.venv');
      const interpreter = path.join(root, 'bin/python');
      if (!fs.existsSync(interpreter)) throw new Error('existing tools/audio-render/.venv interpreter is missing or broken');
      const selected = JSON.parse(command(python, ['-I', '-c', PYTHON_IDENTITY_PROBE]).stdout);
      const existing = JSON.parse(command(interpreter, ['-I', '-c', PYTHON_IDENTITY_PROBE]).stdout);
      const errors = audioRenderVenvErrors(selected, existing, fs.realpathSync(root));
      if (errors.length) throw new Error(errors.join('; ') + ': ' + JSON.stringify({ selected, existing }));
      return { workspace: 'tools/audio-render/.venv', selected, existing };
    });
    record('isolated GSAP paused interpolation', () => {
      const workspace = path.join(REPO, 'tools/ui-motion'), require = createRequire(path.join(workspace, 'package.json'));
      const expectedRoot = fs.realpathSync(path.join(workspace, 'node_modules/gsap'));
      if (!fs.realpathSync(require.resolve('gsap')).startsWith(expectedRoot + path.sep))
        throw new Error('GSAP resolved outside its isolated authoring installation');
      const module = require('gsap'), gsap = module.gsap ?? module.default ?? module;
      gsap.ticker.sleep(); const target = { x: 0 }; let tween;
      try {
        tween = gsap.to(target, { x: 10, duration: 1, ease: 'none', paused: true });
        tween.progress(.5); const midpoint = target.x; tween.progress(1); const endpoint = target.x;
        if (Math.abs(midpoint - 5) > 1e-8 || Math.abs(endpoint - 10) > 1e-8 || !tween.paused())
          throw new Error('paused interpolation did not reach its requested midpoint/end');
        return { version: gsap.version, midpoint, endpoint, paused: tween.paused(), workspace: 'tools/ui-motion' };
      } finally { tween?.kill(); gsap.ticker.sleep(); }
    });
    record('Node executable', () => ({ version: command(binary('node', 'node'), ['--version']).stdout.trim(), runner: process.version }));
    record('GitHub CLI executable', () => ({ version: command(binary('gh', 'gh'), ['--version']).stdout.trim().split('\n')[0], verification: 'local version only; no GitHub access' }));
  } finally { fs.rmSync(temp, { recursive: true }); report.syntheticScratchRemoved = true; }
}

export async function main(args = process.argv.slice(2)) {
  if (args.length !== 1 || !['--check', '--verify'].includes(args[0])) throw new Error('Usage: node tools/development-toolchain.mjs --check|--verify');
  const mode = args[0].slice(2), report = { schema: 'cf-development-toolchain/v1', mode, at: new Date().toISOString(),
    platform: process.platform, architecture: process.arch, status: 'RUNNING', inventory: [], capabilities: [],
    scope: 'development tools only; no installation, upgrades, GUI launches, license reads, or runtime/workspace pin changes' };
  try {
    report.inventory = installedInventory(report);
    if (mode === 'check') { report.available = await checkLatest(report.inventory); report.status = report.available.every(row => !row.error) ? 'PASS' : 'FAIL'; }
    else { verifyCapabilities(report.inventory, report); report.status = report.inventory.every(row => row.installed) && report.capabilities.every(row => row.pass) ? 'PASS' : 'FAIL'; }
  } catch (error) { report.status = 'FAIL'; report.error = String(error); }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.status !== 'PASS') process.exitCode = 1;
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
