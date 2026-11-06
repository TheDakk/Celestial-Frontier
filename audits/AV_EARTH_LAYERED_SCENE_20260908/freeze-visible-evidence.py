from pathlib import Path
import json,hashlib,shutil
root=Path(__file__).resolve().parents[2];audit=Path(__file__).resolve().parent
assert json.loads((audit/'browser-free-visible.json').read_text())['status']=='PASS'
previous=json.loads((audit/'browser-free-verified.json').read_text())
assert [x['exitCode'] for x in previous['steps'][:4]]==[0,0,0,0]
source=root/'port/v2/apps/game/dist';target=root/'port/v2/apps/game/smoke/earth-layered-visible-evidence-dist-20260908'
assert not target.exists()
files=[]
for path in sorted(source.rglob('*')):
 if path.is_file():
  data=path.read_bytes();relative=path.relative_to(source)
  files.append({'path':relative.as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
producer=json.loads((audit/'producer-visible.json').read_text())['build']
assert len(files)==producer['fileCount']
digest=hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest()
assert digest==producer['sha256'],(digest,producer['sha256'])
shutil.copytree(source,target)
for item in files:
 data=(target/item['path']).read_bytes()
 assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256']
receipt={'status':'FROZEN_COPY_VERIFIED','source':str(source),'root':str(target),'fileCount':len(files),'files':files,'certification':False}
with (audit/'evidence-dist-visible.json').open('x') as out:json.dump(receipt,out,indent=2);out.write('\n')
print(json.dumps({'status':receipt['status'],'files':len(files),'root':str(target)}))
