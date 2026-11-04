"""Before producer signing, use the actual static BodyCard realm for its world."""
from pathlib import Path
import json,hashlib,sys
p=Path(sys.argv[1]);rows=json.loads(p.read_text());assert len(rows)==1
r=rows[0];static=Path(r['staticReport']);j=json.loads(static.read_text());assert j['status']=='PASS_STATIC'
realm=j['realm'];assert realm in ['land','aquatic','aerial']
script=Path(r['script']);s=json.loads(script.read_text())
if realm=='aquatic':s['world']={**s.get('world',{}),'key':'lake','liquid':'water','surfaceWater':True,'cardHash':'lake-1'}
else:assert not s.get('world',{}).get('surfaceWater',False)
temp=script.with_suffix('.tmp');temp.write_text(json.dumps(s,indent=2)+'\n');temp.replace(script)
sha=lambda q:hashlib.sha256(Path(q).read_bytes()).hexdigest()
proof=dict(status='PASS_COMPILED_REALM_WORLD',realm=realm,staticReport=dict(path=str(static),sha256=sha(static)),script=dict(path=str(script),sha256=sha(script)),source='Actual unchanged static owner compileBodyCard realm, no species-name override')
out=p.parent/'realm-proof.json';assert not out.exists();out.write_text(json.dumps(proof,indent=2)+'\n');r['compiledRealm']=realm;r['realmProof']=str(out)
temp=p.with_suffix('.tmp');temp.write_text(json.dumps(rows,indent=2)+'\n');temp.replace(p);print(json.dumps(proof))
