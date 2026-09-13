"""Split the verified art review into three independently extractable <30 MB zips."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib, json

HERE = Path(__file__).resolve().parent
receipt = json.loads((HERE / 'archive-receipt.json').read_text())
source = Path(receipt['archive'])
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(source.read_bytes()) == receipt['sha256'], 'Source archive changed'
LIMIT = 29_000_000  # Decimal bytes, leaving headroom below the user's 30 MB limit.
PREFIX = 'celestial-frontier-art-review-20260912/'
labels = ['direction-and-native-painting', 'masters-and-fitted-inputs', 'sheets-and-comparisons']
with ZipFile(source) as z:
    assert z.testzip() is None
    original = {i.filename: z.read(i) for i in z.infolist()}
images = {name for name in original if name.endswith('.png')}
shared = set(original) - images
parts = [set(), set(), set()]
for name in images:
    if '/MIDGAME_ART_DIRECTION_' in name or '/native-01/' in name or name.endswith('/painting-beside-living-worlds.png'):
        parts[0].add(name)
    elif '/masters/' in name or '/inputs/' in name:
        parts[1].add(name)
    else:
        parts[2].add(name)
assert set.union(*parts) == images and sum(map(len, parts)) == len(images) == 45
files = [source.with_name(f'celestial-frontier-art-review-20260912-part-{i+1}-of-3-{label}.zip') for i, label in enumerate(labels)]
assert all(not f.exists() for f in files), 'Part already exists; do not overwrite'
output = []
for i, (group, destination) in enumerate(zip(parts, files)):
    guide = f'''# Review upload — part {i+1} of 3

Upload all three numbered ZIP files to the same Claude conversation. Ask Claude to
wait until all three are uploaded, then follow REVIEW_PROMPT.md.

- Part 1: four approved direction images, all fourteen native output PNGs, and the
  complete painting-beside-Living-Worlds comparison.
- Part 2: twelve untouched authoring masters and nine fitted engine inputs.
- Part 3: two authoring contact sheets and the three additional comparison PNGs.

Each ZIP opens independently; these are ordinary archives, not binary fragments.
Every part includes the same review prompt, exact prompts, Art Kit v4, full image index
and source evidence. The original README and MANIFEST describe the complete three-part
set. PART_CONTENTS.md lists only the images present in this part. No image bytes changed.

Together the parts contain all 45 original PNGs, each in exactly one part. To browse
locally, extract all three into the same folder; shared Markdown and metadata copies
are identical. This packaging does not change painting acceptance or authorize work.
'''
    contents = f'# Part {i+1} image contents — {len(group)} PNGs\n\n'
    contents += ''.join(f'- [{Path(n).name}]({n.removeprefix(PREFIX)})\n' for n in sorted(group))
    payload = {name: original[name] for name in shared | group}
    payload[PREFIX + '00_UPLOAD_GUIDE.md'] = guide.encode()
    payload[PREFIX + 'PART_CONTENTS.md'] = contents.encode()
    with ZipFile(destination, 'x', compression=ZIP_DEFLATED, compresslevel=6) as z:
        for name, data in sorted(payload.items()):
            info = ZipInfo(name, date_time=(2026, 9, 12, 12, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, data)
    assert destination.stat().st_size < LIMIT, 'Part exceeds conservative byte limit'
    with ZipFile(destination) as z:
        assert z.testzip() is None
        assert len(z.infolist()) == len(payload)
        for name, data in payload.items(): assert z.read(name) == data, name
    output.append({'part': i+1, 'archive': str(destination), 'bytes': destination.stat().st_size,
                   'sha256': sha(destination.read_bytes()), 'pngs': len(group),
                   'imagePaths': sorted(group), 'crcAndExactBytesVerified': True})
report = {'schema': 'cf.art-review-split.v1', 'sourceSha256': receipt['sha256'],
          'maximumBytesPerPart': LIMIT, 'totalUniquePngs': len(images),
          'everySourceFileIncluded': True, 'sharedSourceFilesIdentical': True, 'parts': output}
(HERE / 'split-archive-receipt.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({**report, 'parts': [{k:v for k,v in p.items() if k != 'imagePaths'} for p in output]}, indent=2))
