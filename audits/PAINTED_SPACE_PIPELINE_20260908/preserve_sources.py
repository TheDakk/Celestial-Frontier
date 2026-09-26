"""One bounded local preservation, no source overwrites or cloud operations."""
from pathlib import Path
import hashlib, json, shutil, datetime

root = Path('/Users/nick/Projects/celestial-frontier-openai-mac')
audit = root / 'audits/PAINTED_SPACE_PIPELINE_20260908'
charm = root / 'audits/CREATURE_CHARM_STUDY_20260908'
private = Path('/Users/nick/Projects/Celestial-Frontier-asset-sources')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def copy_file(src, dst):
    assert src.is_file() and not src.is_symlink(), src
    assert not dst.exists(), dst
    dst.parent.mkdir(parents=True, exist_ok=True)
    before = sha(src)
    shutil.copy2(src, dst)
    assert sha(src) == before == sha(dst)
    return {'source': str(src), 'path': str(dst), 'bytes': dst.stat().st_size, 'sha256': before}

cdest = private / 'creature-charm-20260908'
pdest = private / 'painted-space-pipeline-20260908'
assert not cdest.exists() and not pdest.exists()
crecord = []
work = Path('/private/tmp/cf-creature-charm-20260908')
for src in sorted(work.rglob('*')):
    if src.is_file():
        crecord.append(copy_file(src, cdest / src.relative_to(work)))
for treatment in ['natural', 'storybook']:
    crecord.append(copy_file(work / 'first/phenotype.json', cdest / f'first/{treatment}/input/phenotype.json'))
for src in [root / 'port/v2/tools/blender/creature_charm_study.py', charm / 'audit_motion.py', charm / 'package_samples.py', charm / 'package_samples_font.py']:
    crecord.append(copy_file(src, cdest / 'sources' / src.name))
original = private / 'creature-canid-20260908/canid/wolf-canid-v2/wolf-canid.blend'
assert sha(original) == 'a5e635a7587e1e8b8be7a3bd3636f56375ba84654989e696cf251b4a1c188e8a'
(charm / 'private-source-preservation.json').write_text(json.dumps({'status': 'PASS', 'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'destination': str(cdest), 'originalMasterSha256': sha(original), 'independentBackup': False, 'packaging': 'Exact phenotype copies restore existing relative //input/phenotype.json paths for each new master; masters unchanged.', 'files': crecord}, indent=2) + '\n')

precord = []
snapshot = Path('/private/tmp/cf-painted-space-review-20260908')
zipfile = Path('/Users/nick/Library/Mobile Documents/com~apple~CloudDocs/Downloads/space-art-pipeline-2026-09-08.zip')
assert sha(zipfile) == '61ad0c820e248e141776b60e7dc8976ef0b45bd5ea73ab6004c752813c609b14'
precord.append(copy_file(zipfile, pdest / zipfile.name))
for src in sorted(snapshot.rglob('*')):
    if src.is_file():
        precord.append(copy_file(src, pdest / 'supplied-snapshot' / src.relative_to(snapshot)))
generated = Path('/Users/nick/.codex/generated_images/01a0778a-a9bf-7732-ac2b-a44cb106d4ad')
for filename, name in [('exec-9f814ee2-6d58-49d2-88c4-67767e2d4d79.png', 'space-reference-candidate.png'), ('exec-8807a87e-bbe3-410b-831d-df836ba0f13c.png', 'biome-comparison.png'), ('exec-8778ad2b-eca0-4ec2-921d-c6d436134b7f.png', 'universe-reference.png')]:
    src = generated / filename
    precord.append(copy_file(src, pdest / 'generated-captures' / name))
    copy_file(src, audit / name)
for src in sorted(audit.glob('*prompt*.txt')):
    precord.append(copy_file(src, pdest / 'sent-prompts' / src.name))
precord.append(copy_file(audit / 'USER_PROMPT.md', pdest / 'USER_PROMPT.md'))
(audit / 'private-source-preservation.json').write_text(json.dumps({'status': 'PASS', 'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'destination': str(pdest), 'cloudWrite': False, 'originalsUntouched': True, 'independentBackup': False, 'files': precord}, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'creatureFiles': len(crecord), 'pipelineFiles': len(precord), 'originalsUnchanged': True}))
