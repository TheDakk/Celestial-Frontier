"""Snapshot verified C266 representatives without editing the peer lane or runtime."""
from pathlib import Path
import hashlib, json, shutil

peer = Path('~/Projects/celestial-frontier-anthropic-mac')
base = Path('audits/C266_ALLOUT_20261017')
out = Path('audits/C266_CODEX_20261017/coordinator')
selected = [
    ('wallaby-01', 'Wallaby', 'seams-mammals/wallaby/r01/islands/fit', 'seams-mammals/wallaby/r01/packet'),
    ('monkey-01', 'Monkey', 'seams-mammals/monkey/r01/islands/fit', None),
    ('kakapo-01', 'Kakapo', 'seams-birds-shells/kakapo/cand09/fit', None),
    ('giant-clam-01', 'Giant Clam', 'seams-birds-shells/giant-clam/fit-pairs', 'seams-birds-shells/giant-clam/packet-pairs'),
]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
pins = {}
def copy_file(rel):
    rel = Path(rel)
    source, target = peer/rel, rel
    before = sha(source)
    if target.exists():
        assert sha(target) == before, f'Existing different bytes: {target}'
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    assert sha(source) == sha(target) == before
    pins[str(rel)] = {'sha256': before, 'size': target.stat().st_size}
def copy_tree(rel):
    for p in sorted((peer/rel).rglob('*')):
        if p.is_file(): copy_file(p.relative_to(peer))

groups = ['seams-mammals', 'seams-birds-shells', 'intake-insects-arachnids']
for group in groups:
    text = (peer/base/group/'README.md').read_text()
    assert '## Verifier' in text
    copy_file(base/group/'README.md')
    copy_file(base/group/'verify/README.md')

jobs = []
for slug, name, fit_rel, packet_rel in selected:
    fit = base/fit_rel
    copy_tree(fit)
    if packet_rel: copy_tree(base/packet_rel)
    record = json.loads((fit/'record.json').read_text())
    source = Path(record['source'])
    copy_file(source)
    for filename in ['prompt.txt', 'subject-source.json']:
        p = source.parent/filename
        if (peer/p).is_file(): copy_file(p)
    manifest = json.loads((fit/'parts/manifest.json').read_text())
    packet = Path(packet_rel) if packet_rel else source.parent
    if packet_rel: packet = base/packet
    run = out/slug
    assert not run.exists()
    run.mkdir()
    script = json.loads((out/'fruit-bat-01/script.json').read_text())
    for row in script['rows']:
        row['an'] = name
        row['dn'] = name
    if record.get('habitat', {}).get('realm') == 'aquatic':
        script['world'] = json.loads((out/'chiton-02-water/script.json').read_text())['world']
    (run/'script.json').write_text(json.dumps(script, indent=2)+'\n')
    job = {'id':manifest['creatureId'], 'name':name, 'family':record['kind'],
           'packet':str(packet), 'fit':str(fit), 'packetId':slug,
           'script':str(run/'script.json'), 'nativeDir':str(run/'native'),
           'nativeReport':str(run/'native/report.json'), 'masterSha256':sha(source),
           'scope':'One source-side representative; no runtime adoption or class propagation before C261 W2 CLEAN'}
    (run/'plan.json').write_text(json.dumps([job], indent=2)+'\n')
    jobs.append(job)

# Insect fits were path-scrubbed by the author: recompile the exact packet locally.
copy_tree(base/'intake-insects-arachnids/packets/11-grasshopper')
for filename in ['qualify.mjs']:
    copy_file(base/'intake-insects-arachnids/tools'/filename)
report = {'status':'PASS', 'independentVerifierRequired':True, 'jobs':jobs,
          'files':pins, 'runtimeChanges':False, 'notes':[
              'Kangaroo is NOT verifier-ready; Gibbon diagnosis only; Oyster patch held.',
              'Kakapo all-action thorax ownership is diagnostic source evidence; Dakk adoption question remains.',
              'Grasshopper must be recompiled from its unchanged packet, then independently checkpointed before hexapod propagation.']}
target = out/'representatives-import.json'
assert not target.exists()
target.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'status':'PASS','exactFiles':len(pins),'plans':[j['packetId'] for j in jobs]}))
