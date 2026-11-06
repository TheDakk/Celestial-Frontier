#!/usr/bin/env python3
"""Hash-verified review copies, deterministic ZIP entries, strictly below 30 MB each."""
import json, zipfile, sys, re
from pathlib import Path
from acquire import BASE, sha_file, write_json

ROOT = BASE.parent
LIMIT = 28_000_000

def package():
    name=sys.argv[1] if len(sys.argv)==2 else '20260915'
    if not re.fullmatch('[a-z0-9-]+',name):raise ValueError('Review directory name')
    out = BASE / 'review-packs' / name
    if out.exists():
        raise ValueError('Existing review pack refused')
    out.mkdir(parents=True)
    reports = [json.loads(p.read_text()) for p in sorted((BASE / 'reports').glob('*.json'))]
    cues = [c for r in reports if r.get('schema') == 'cf.audio-render/v1' for c in r['outputs']]
    loops = json.loads((BASE / 'reports/loop-candidates-v2.json').read_text())
    if loops['failures']:
        raise ValueError('Loop pass has failures')
    manifest = {'schema': 'cf.audio-review-pack/v1', 'maxBytesExclusive': 30_000_000,
                'listeningAccepted': False, 'archives': []}
    prompt = BASE / 'REVIEW_PROMPT.md'
    def emit(name, entries):
        destination = out / (name + '.zip')
        entries = [(prompt, 'REVIEW_PROMPT.md')] + entries
        names = [name for _, name in entries]
        if len(names) != len(set(names)):
            raise ValueError('Duplicate ZIP names')
        contents = []
        with zipfile.ZipFile(destination, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for source, arcname in sorted(entries, key=lambda e: e[1]):
                if source.is_symlink() or not source.resolve().is_relative_to(ROOT):
                    raise ValueError('Review input outside repository')
                b = source.read_bytes()
                info = zipfile.ZipInfo(arcname, (2026, 9, 15, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                z.writestr(info, b)
                contents.append({'path': arcname, 'bytes': len(b), 'sha256': sha_file(source)})
        if destination.stat().st_size >= 30_000_000:
            raise ValueError('Review archive exceeds Claude limit')
        with zipfile.ZipFile(destination) as z:
            if z.testzip() is not None:
                raise ValueError('ZIP CRC failure')
        manifest['archives'].append({'path': str(destination.relative_to(BASE)),
            'bytes': destination.stat().st_size, 'sha256': sha_file(destination), 'contents': contents})

    entries = []
    for folder in [BASE / 'manifests', BASE / 'recipes', BASE / 'reports', ROOT / 'port/v2/tools/audio-production']:
        for p in sorted(folder.glob('*')):
            if p.is_file() and p.suffix in ('.json', '.md', '.py', '.mjs', '.lua') and p.name != 'download-cache.json':
                entries.append((p, str(p.relative_to(ROOT))))
    for p in sorted(BASE.glob('*.md')):
        if p != prompt:
            entries.append((p, str(p.relative_to(ROOT))))
    for p in sorted((ROOT / 'port/v2/apps/game/src').glob('audio-production-*')):
        entries.append((p, str(p.relative_to(ROOT))))
    for p in [ROOT / 'port/v2/apps/game/audio-production-assets.ts', ROOT / 'audits/AUDIO_PRODUCTION_20260915/EXECUTION.md']:
        entries.append((p, str(p.relative_to(ROOT))))
    for folder in [ROOT / 'port/v2/tools/asset-intake', ROOT / 'celestial-frontier-audio-handoff',
                   ROOT / 'audits/AUDIO_PRODUCTION_20260915/native-review-04',
                   ROOT / 'audits/AUDIO_PRODUCTION_20260915/checks']:
        for p in sorted(folder.glob('*')):
            if p.is_file() and p.suffix in ('.mjs', '.md', '.json', '.png', '.log', '.txt'):
                entries.append((p, str(p.relative_to(ROOT))))
    for relative in ['port/v2/apps/game/src/main.ts', 'port/v2/apps/game/vite.config.ts',
                     'port/v2/tests/pwa-offline.test.ts', 'audits/AUDIO_PRODUCTION_20260915/preservation-final.json']:
        p = ROOT / relative
        entries.append((p, relative))
    for audit_name in ['AUDIO_GAME_COVERAGE_20260915','AUDIO_FAUNA_BIOMES_20260915','AUDIO_FAUNA_CONTINUATION_20260915']:
        audit=ROOT/'audits'/audit_name
        if audit.exists():
            for p in sorted(audit.rglob('*')):
                if p.is_file() and p.suffix in ('.md','.json','.png','.log'):entries.append((p,str(p.relative_to(ROOT))))
    emit('00-review-code-and-ledgers', entries)

    selected = [c for c in cues if c['group'] == 'identity-comparison'
        or (c['group'].startswith('ability-') and c['id'].endswith('.impact.1'))
        or c['id'].startswith(('recording.red-fox.', 'recording.osprey.', 'recording.humpback-whale.', 'recording.bee.'))
        or (c['id'].startswith('v2.ability.') and c['id'].endswith(('.cast.1','.impact.1','.heal.1','.shield.1')))
        or c['group'] in ('coverage-score','coverage-environment','ecology-environments')
        or c['group'].startswith('fauna-supplement-')
        or c['id'].startswith(('v4.reference.lion.', 'v4.reference.wood-frog.', 'v4.reference.bottlenose-dolphin.', 'v4.reference.koala.', 'v4.reference.ash-cicada.', 'v4.reference.lily-leaf-beetle.'))
        or (c['id'].startswith('v2.material.') and c['id'].endswith('.1'))]
    if not all(any(c['id'] == x for c in selected) for x in ['civet-fictional', 'fox-fictional', 'procedural-quadruped']):
        raise ValueError('Missing identity comparison')
    def checked(row, field):
        p = BASE / row[field]
        if sha_file(p) != row[field + 'Sha256']:
            raise ValueError('Changed audio: ' + str(p))
        return p
    # Short, full-resolution WAVs first; longer field recordings are in the complete Opus set.
    samples = [(checked(c, 'master'), 'listening/' + c['id'] + '.wav') for c in selected]
    batch,size,index=[],0,1
    for entry in samples:
        n=entry[0].stat().st_size+500
        if batch and size+n>LIMIT:
            emit(f'{index:02d}-focused-listening',batch);index+=1;batch=[];size=0
        batch.append(entry);size+=n
    if batch:emit(f'{index:02d}-focused-listening',batch);index+=1
    audio = [(checked(c, 'opus'), 'candidates/' + c['id'] + '.opus') for c in cues]
    audio += [(checked(c, 'opus'), 'loops/' + c['id'] + '.loop.opus') for c in loops['outputs']]
    batch, size = [], 0
    for entry in sorted(audio, key=lambda e: e[1]):
        n = entry[0].stat().st_size + len(entry[1]) * 2 + 200
        if n >= LIMIT:
            raise ValueError('Individual review file exceeds budget')
        if batch and size + n > LIMIT:
            emit(f'{index:02d}-complete-opus', batch)
            index += 1
            batch, size = [], 0
        batch.append(entry)
        size += n
    if batch:
        emit(f'{index:02d}-complete-opus', batch)
    manifest['candidateCount'] = len(cues)
    manifest['loopCount'] = len(loops['outputs'])
    manifest['focusedCount'] = len(selected)
    write_json(BASE / 'reports'/('review-packs-'+name+'.json'), manifest)
    print(json.dumps({k: v for k, v in manifest.items() if k != 'archives'}))
    for a in manifest['archives']:
        print(a['path'], a['bytes'])

if __name__ == '__main__':
    package()
