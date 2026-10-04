"""Package existing art and exact prompts without painting or altering source assets."""
from pathlib import Path
import hashlib, json, sys, zipfile

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) == 2 else Path('/private/tmp/celestial-frontier-art-review-20260912.zip')
PREFIX = 'celestial-frontier-art-review-20260912/'
FIRST = Path('audits/ART_KIT_ENGINE_FIRST_20260912')
PROOF = Path('audits/ART_KIT_ENGINE_PROOF_20260912')
DIRECTION = Path('audits/MIDGAME_ART_DIRECTION_20260908')
payload = {}
sources = {}
def sha(data): return hashlib.sha256(data).hexdigest()
def add_bytes(name, data, source=None):
    assert name not in payload, name
    payload[name] = data
    if source is not None: sources[name] = str(source)
def add_file(relative):
    add_bytes(relative.as_posix(), (ROOT / relative).read_bytes(), relative)

images = sorted(p.relative_to(ROOT) for folder in [FIRST, PROOF, DIRECTION] for p in (ROOT / folder).rglob('*.png'))
assert len(images) == 45, len(images)
for p in images: add_file(p)
for folder in [FIRST / 'prompts', DIRECTION]:
    for p in sorted((ROOT / folder).glob('*-prompt.txt')): add_file(p.relative_to(ROOT))
for p in [Path('ART_KIT.md'),
          FIRST / 'README.md', FIRST / 'capture-intake.json', FIRST / 'canonical-snapshot.json',
          FIRST / 'prompt-reproduction.json', FIRST / 'compiled-inputs.json', FIRST / 'family-compiled-inputs.json',
          PROOF / 'README.md', PROOF / 'recipe.json', PROOF / 'prepared-manifest.json',
          PROOF / 'review.json', PROOF / 'retention-check.json', PROOF / 'native-01/result.json',
          DIRECTION / 'README.md', DIRECTION / 'intake.json']:
    add_file(p)
add_bytes('REVIEW_PROMPT.md', (HERE / 'REVIEW_PROMPT.md').read_bytes(), (HERE / 'REVIEW_PROMPT.md').relative_to(ROOT))
recipe = json.loads(payload[(PROOF / 'recipe.json').as_posix()])
result = json.loads(payload[(PROOF / 'native-01/result.json').as_posix()])
rows = [(r['name'], r['prompt']) for r in recipe['passes']] + [('finisher', recipe['finisherPrompt'])]
slug = ['civet', 'persimmon', 'platypus', 'frog', 'devils-club', 'cranberry', 'finisher']
md = ['# Exact image-generation prompts\n\n'
      'The text inside each fence is copied from the retained prompt or native recipe. '
      'The separate TXT files preserve exact bytes. Runtime chat wrappers are also included '
      'and verified against the native receipt. No prompt has been rewritten.\n\n'
      '## Twelve authoring prompts\n']
for p in sorted((ROOT / FIRST / 'prompts').glob('*-prompt.txt')):
    s = p.read_text()
    assert '`````' not in s
    md += ['\n### ' + p.name + '\n\n`````text\n' + s + ('' if s.endswith('\n') else '\n') + '`````\n']
md += ['\n## Seven native runtime prompts\n']
for i, ((name, prompt), key) in enumerate(zip(rows, slug)):
    measurement = next(m for m in result['details']['measurements'] if m['name'] == name)
    wrapped = '<|im_start|>user\n' + prompt + '<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n'
    assert sha(prompt.encode()) == measurement['promptSha256'], name
    assert sha(wrapped.encode()) == measurement['chatPromptSha256'], name
    stem = f'prompts/runtime/{i+1:02d}-{key}'
    add_bytes(stem + '.txt', prompt.encode())
    add_bytes(stem + '-chat-wrapped.txt', wrapped.encode())
    assert '`````' not in prompt
    md += [f'\n### {i+1}. {name}\n\nActual tokens: {measurement["tokenCount"]}; '
           f'tensor positions: {measurement["sequence"]}.\n\n`````text\n' + prompt +
           ('' if prompt.endswith('\n') else '\n') + '`````\n']
add_bytes('PROMPTS.md', ''.join(md).encode())
index = ['# Image index — 45 PNGs\n\n'
         'Approved direction images and new candidates are separately labelled below. '
         'Masters, fitted inputs, raw/keyed passes and review montages are distinct stages.\n\n']
for title, selection in [
    ('Approved direction (4)', [p for p in images if DIRECTION in p.parents]),
    ('Authoring masters (12)', [p for p in images if FIRST / 'masters' in p.parents]),
    ('First authoring review sheets (2)', [p for p in images if p.parent == FIRST]),
    ('Offline fitted engine inputs (9)', [p for p in images if PROOF / 'inputs' in p.parents]),
    ('Native outputs (14)', [p for p in images if PROOF / 'native-01' in p.parents]),
    ('Native comparison and review images (4)', [p for p in images if p.parent == PROOF])]:
    index += ['## ' + title + '\n\n']
    index += [f'- [{p.name}]({p.as_posix()})\n' for p in selection]
    index += ['\n']
add_bytes('IMAGE_INDEX.md', (''.join(index).rstrip() + '\n').encode())
readme = '''# Celestial Frontier — review bundle, September 12, 2026

Start with **REVIEW_PROMPT.md**, then **IMAGE_INDEX.md**. **PROMPTS.md** contains the
exact twelve authoring prompts and seven native runtime prompts. Raw prompt TXT files
and all seven chat-wrapped runtime strings are included. The runtime strings have
been verified against their SHA-256 values in the measured run receipt.

This archive contains all 45 PNGs in the three current review directories: the four
approved direction images, twelve new masters, two authoring sheets, nine fitted inputs,
fourteen native outputs and four comparison images. Nothing has been resized or repainted
for this export. Rejected v3 images are excluded; they are not current references.

ART_KIT.md is the unchanged current v4. Original repository paths are retained so the
audit Markdown's image links resolve. Native execution used signed source30ef7d15;
painting evidence was retained atb5a577f9. The painting remains unaccepted.

MANIFEST.json lists every included file's SHA-256 and byte count. Model weights,
raw RGBA buffers, runnable engine bundles and unrelated historical art are not included.
This is a review archive, not a runtime/delivery pack or a new inference run.
'''
add_bytes('README.md', readme.encode())
manifest = {'schema': 'cf.art-review-export.v1', 'date': '2026-09-12',
            'nativeSourceCommit': result['head'], 'evidenceCommit': 'b5a577f99aa7ba6490b66a3a78ae78f8f64c2cb5',
            'imageCount': len(images), 'authoringPromptCount': 12, 'runtimePromptCount': 7,
            'exactRuntimeChatPromptsVerified': 7, 'qualityAccepted': False,
            'files': [{'path': name, 'bytes': len(data), 'sha256': sha(data),
                       **({'source': sources[name]} if name in sources else {})}
                      for name, data in sorted(payload.items())]}
manifest_bytes = (json.dumps(manifest, indent=2) + '\n').encode()
add_bytes('MANIFEST.json', manifest_bytes)
with zipfile.ZipFile(OUT, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name, data in sorted(payload.items()):
        info = zipfile.ZipInfo(PREFIX + name, date_time=(2026, 9, 12, 12, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, data)
with zipfile.ZipFile(OUT) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(payload)
    for name, data in payload.items(): assert z.read(PREFIX + name) == data, name
# Persist small review records in the repository; the export itself stays outside it.
(HERE / 'MANIFEST.json').write_bytes(manifest_bytes)
(HERE / 'PROMPTS.md').write_bytes(payload['PROMPTS.md'])
(HERE / 'IMAGE_INDEX.md').write_bytes(payload['IMAGE_INDEX.md'])
receipt = {'schema':'cf.art-review-archive-receipt.v1', 'archive': str(OUT),
           'bytes': OUT.stat().st_size, 'sha256': sha(OUT.read_bytes()),
           'entries': len(payload), 'pngs': len(images), 'crcAndExactBytesVerified': True,
           'runtimePromptHashesVerified': 7, 'runtimeChatPromptHashesVerified': 7}
(HERE / 'archive-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
