"""Snapshot exact verified inputs for eight distinct contact/anatomy representatives."""
from pathlib import Path
import hashlib, json, shutil
peer=Path('~/Projects/celestial-frontier-anthropic-mac')
base=Path('audits/C266_ALLOUT_20261017/intake-quadrupeds')
out=Path('audits/C266_CODEX_20261017/coordinator')
assert '## Verifier' in (peer/base/'README.md').read_text()
assert '26/26 PACKET_STATIC_PASS claims reproduced' in (peer/base/'verify/README.md').read_text()
selected=['01-tortoise-a04','07-sea-turtle','08-fur-seal','13-goat-a02','14-shrew','22-anole-a02','25-olm-a02','26-chimpanzee-a02']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pins={}
def copy(rel):
 p,q=peer/rel,Path(rel);before=sha(p)
 if q.exists():assert sha(q)==before,str(q)
 else:
  q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
 assert sha(p)==sha(q)==before
 pins[str(q)]={'sha256':before,'size':q.stat().st_size}
for f in ['README.md','verify/README.md','selected.json','tools/qualify.mjs']:copy(base/f)
for slug in selected:
 for p in (peer/base/'packets'/slug).iterdir():
  if p.is_file():copy(p.relative_to(peer))
p=out/'quadruped-representatives-import.json';assert not p.exists()
p.write_text(json.dumps({'status':'PASS','files':pins,'selected':selected,'runtimeChanges':False,
 'scope':'New independently authored intake packets, separate from the held Monkey seam-relabel class. First representative per contact/anatomy class before propagation.',
 'holds':['Seal template conflict','Squirrel canonical sitting/food pose absent','All runtime patches unapplied']},indent=2)+'\n')
print(json.dumps({'status':'PASS','exactFiles':len(pins),'selected':selected}))
