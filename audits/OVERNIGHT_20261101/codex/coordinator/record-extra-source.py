"""Preserve one untouched O1 supplemental source draw; this grants no admission."""
from pathlib import Path
import hashlib
import json
import shutil
import struct
import sys

meta = json.loads(sys.argv[1])
base = Path('audits/OVERNIGHT_20261101/codex')
source = Path(meta['generatedPath'])
assert source.is_relative_to(Path.home() / '.codex/generated_images')
assert source.is_file()
prompt = Path(meta['actualPrompt'])
assert prompt.is_relative_to(base)
if meta['kind'] == 'guardian':
    out = base / 'guardian/source-r03'
    size, key = 1536, 'magenta'
else:
    assert meta['kind'] == 'registry'
    assert meta['name'] in ['Lionfish', 'Pipefish']
    out = base / 'registry-sources' / (meta['name'].lower() + '-green-r01')
    size, key = 1254, 'green'
out.mkdir(parents=True, exist_ok=False)
shutil.copy2(source, out / 'original.png')
shutil.copy2(prompt, out / 'prompt.txt')
data = (out / 'original.png').read_bytes()
assert data[:8] == b'\x89PNG\r\n\x1a\n'
receipt = dict(
    schema='cf.o1-supplemental-source/v1', name=meta['name'], kind=meta['kind'],
    tool='built-in image_gen', independentFreshDraw=True, numericSeedControl=False,
    original=str(out / 'original.png'), originalSha256=hashlib.sha256(data).hexdigest(),
    actualSize=list(struct.unpack('>II', data[16:24])), requestedSize=[size, size],
    key=key, promptSource=str(prompt), promptSha256=hashlib.sha256(prompt.read_bytes()).hexdigest(),
    generatedPath=str(source).replace(str(Path.home()), '~'),
    reference='audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png',
    referenceSha256='c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62',
    resizeOrPadding=False, sourceReview='PENDING', fitStaticNativeAdmission=False,
    guardianSizeDecision='D47_OPEN_NOT_APPLIED' if meta['kind'] == 'guardian' else None)
(out / 'generation.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
