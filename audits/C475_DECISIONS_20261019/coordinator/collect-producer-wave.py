"""Select frozen audit assets and exact applied paths; never stage worker scratch."""
from pathlib import Path
import hashlib,json,sys
B=Path('audits/C475_DECISIONS_20261019'); C=B/'coordinator'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
paths=set()
for name in ['w2-worm-radial/manifest-r01.json','w2-worm-radial/soft-worms-r01/manifest-r01.json','w2-worm-radial/integration-staging-r01/freeze-final-r02.json','w2-worm-radial/integration-staging-r01/instrument-delta-r01/freeze-r01.json']:
    p=B/name;j=json.loads(p.read_text());paths.add(str(p))
    for r in j['files']:
        assert sha(r['path'])==r['sha256'],r['path']
        paths.add(r['path'])
for name in ['d41-d42-applied-r01.json','instrument-applied-r01.json','nautiloid-route-applied-r01.json','soft-materials-applied-r03.json']:
    j=json.loads((C/name).read_text())
    for r in j['rows']:paths.add(r['path'])
for path in ['MOTION_KIT.md','ROADMAP.md','audits/MAILBOX/TO_CLAUDE.md','port/v2/apps/game/src/release-content.ts','port/v2/tools/slicesmoke.mjs','port/v2/tools/painted-creature/README.md']:
    paths.add(path)
for p in C.rglob('*'):
    if p.is_file() and not p.is_symlink() and 'node_modules' not in p.parts and p.suffix!='.tmp':paths.add(str(p))
for s in ['tube-worm-d41','ice-worm-d41','flatworm-d41','sea-urchin-d41','sand-dollar-d41']:
    row=json.loads((C/'plans'/s/'plan.json').read_text())[0]
    for key in ['fit','observedPacket']:
        d=Path(row[key]);assert d.is_dir(),d
        for p in d.rglob('*'):
            if p.is_file() and not p.is_symlink() and 'node_modules' not in p.parts:paths.add(str(p))
for name in sys.argv[2:]:
    d=Path(name);assert d.exists()
    if d.is_dir():
        for p in d.rglob('*'):
            if p.is_file() and not p.is_symlink() and 'node_modules' not in p.parts:paths.add(str(p))
    else:paths.add(str(d))
paths.discard(sys.argv[1])
Path(sys.argv[1]).write_text('\n'.join(sorted(paths))+'\n')
print(json.dumps(dict(files=len(paths),bytes=sum(Path(p).stat().st_size for p in paths))))
