"""Prepare one immutable verified C266 prompt, without creative text changes."""
from pathlib import Path
import hashlib, json, shutil, sys
jobs = {'frigatebird-01':'identity-prompts/frigatebird', 'mite-01':'identity-prompts/mite',
        'macaw-01':'identity-prompts/macaw', 'swift-01':'identity-prompts/swift',
        'caecilian-01':'identity-prompts/caecilian', 'sea-spider-01':'identity-prompts/sea-spider',
        'leafcutter-ant-01':'identity-prompts/leafcutter-ant', 'mud-crab-01':'crabs/source-prompts/mud-crab'}
slug = sys.argv[1]
assert slug in jobs
peer = Path('~/Projects/celestial-frontier-anthropic-mac/audits/C266_ALLOUT_20261017/identity-static-classstops')
assert '**PROMPT_READY (16 prompts): verified.**' in (peer/'README.md').read_text()
source = peer/jobs[slug]
receipt = json.loads((source/'prompt-receipt.json').read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(source/'prompt.txt') == receipt['newPromptSha256']
packet = Path('audits/C266_CODEX_20261017/coordinator/paintings')/slug
assert not packet.exists()
packet.mkdir()
for a,b in [('prompt.txt','prompt.txt'),('prompt-receipt.json','verified-prompt-receipt.json')]:
    shutil.copy2(source/a, packet/b)
metadata = Path(receipt['basePrompt']).parent/'subject-source.json'
shutil.copy2(metadata, packet/'subject-source.json')
subject = json.loads(metadata.read_text())
assert subject['name'] == receipt['species']
reference = Path('audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png')
assert sha(reference) == 'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62'
request = {'status':'VERIFIED_PROMPT_READY_ONE_CLASS_REPRESENTATIVE', 'name':subject['name'],
           'family':subject['family'], 'sourcePrompt':str(source/'prompt.txt'),
           'promptSha256':sha(packet/'prompt.txt'), 'verifierReadme':str(peer/'verify/README.md'),
           'verifierReadmeSha256':sha(peer/'verify/README.md'), 'groupReadmeSha256':sha(peer/'README.md'),
           'reference':str(reference), 'referenceSha256':sha(reference), 'requestedSize':[1254,1254],
           'tool':'image_gen.imagegen', 'transparentBackground':False,
           'classPropagation':'One independent representative only; no propagation from a request or raw painting',
           'originalsModified':False, 'generated':False}
(packet/'request.json').write_text(json.dumps(request,indent=2)+'\n')
print(json.dumps({'slug':slug,'prompt':(packet/'prompt.txt').read_text(), 'reference':str(reference.resolve()),
                  'packet':str(packet.resolve()), 'promptSha256':request['promptSha256']}))
