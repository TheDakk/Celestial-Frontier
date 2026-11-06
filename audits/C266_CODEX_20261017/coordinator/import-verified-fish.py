"""One verified representative per whale, ray and ordinary-fish source class."""
from pathlib import Path
import hashlib, json, shutil
peer = Path('~/Projects/celestial-frontier-anthropic-mac')
base = Path('audits/C266_ALLOUT_20261017/intake-fish-birds-other')
out = Path('audits/C266_CODEX_20261017/coordinator')
assert '## Verifier' in (peer/base/'README.md').read_text()
assert '29 of 29 PACKET_STATIC_PASS claims reproduced' in (peer/base/'verify/README.md').read_text()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
pins = {}
def copy(rel):
    p, q = peer/rel, Path(rel)
    before = sha(p)
    if q.exists(): assert sha(q) == before, str(q)
    else:
        q.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, q)
    assert sha(p) == sha(q) == before
    pins[str(q)] = {'sha256':before, 'size':q.stat().st_size}
for name in ['README.md', 'verify/README.md']: copy(base/name)
jobs = []
for slug, name, packet_slug in [('blue-whale-01','Blue Whale','03-blue-whale-c1'),
                                ('dragonfish-01','Dragonfish','06-dragonfish-c3'),
                                ('eagle-ray-01','Eagle Ray','07-eagle-ray-c1-a4')]:
    packet = base/'packets'/packet_slug
    for p in (peer/packet).iterdir():
        if p.is_file(): copy(p.relative_to(peer))
    fit = packet/'qual-r01/islands/fit'
    for p in sorted((peer/fit).rglob('*')):
        if p.is_file(): copy(p.relative_to(peer))
    for name0 in ['static.json', 'static.json.sources.json', 'result.json']:
        p=packet/'qual-r01'/name0
        if (peer/p).is_file(): copy(p)
    record = json.loads((fit/'record.json').read_text())
    assert record['source'] == str(packet/'master.png')
    manifest = json.loads((fit/'parts/manifest.json').read_text())
    run = out/slug
    assert not run.exists(); run.mkdir()
    script = json.loads((out/'giant-clam-01/script.json').read_text())
    for row in script['rows']: row['an'] = row['dn'] = name
    (run/'script.json').write_text(json.dumps(script, indent=2)+'\n')
    row = {'id':manifest['creatureId'],'name':name,'family':record['kind'],
           'packet':str(packet),'fit':str(fit),'packetId':slug,
           'script':str(run/'script.json'),'nativeDir':str(run/'native'),
           'nativeReport':str(run/'native/report.json'),'masterSha256':sha(packet/'master.png'),
           'scope':'One independently verified source-class representative; no propagation before C261 checkpoint CLEAN'}
    (run/'plan.json').write_text(json.dumps([row], indent=2)+'\n'); jobs.append(row)
p = out/'fish-representatives-import.json'; assert not p.exists()
p.write_text(json.dumps({'status':'PASS','files':pins,'jobs':jobs,'runtimeChanges':False,
 'heldBeforePropagation':['Other ordinary fish await Dragonfish','Other whales await Blue Whale','Other rays await Eagle Ray',
 'Birds await Kakapo representative','Snake remains held with unapplied shared axial motion decision',
 'Tripod Fish and Peacock have independently observed source-keying paint loss']},indent=2)+'\n')
print(json.dumps({'status':'PASS','exactFiles':len(pins),'plans':[j['packetId'] for j in jobs]}))
