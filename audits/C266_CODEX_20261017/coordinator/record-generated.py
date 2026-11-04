"""Retain exact built-in output; never resize, repair, overwrite or discard."""
from pathlib import Path
import hashlib, json, shutil, subprocess, sys
slug, filename = sys.argv[1:]
assert slug in ['frigatebird-01','mite-01','macaw-01','swift-01','caecilian-01','sea-spider-01','leafcutter-ant-01','mud-crab-01']
packet = Path('audits/C266_CODEX_20261017/coordinator/paintings')/slug
source, target = Path(filename), packet/'master.png'
assert source.is_file() and str(source).startswith('~/.codex/generated_images/')
assert not target.exists()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
shutil.copy2(source,target)
assert sha(source) == sha(target)
shape = subprocess.run(['magick','identify','-format','%m %w %h',str(target)],capture_output=True,text=True,check=True).stdout
request = json.loads((packet/'request.json').read_text())
assert sha(packet/'prompt.txt') == request['promptSha256']
row = {'status':'GENERATED_UNMODIFIED_SOURCE_REVIEW_PENDING' if shape=='PNG 1254 1254' else 'SOURCE_DIMENSION_HOLD',
       'name':request['name'], 'master':str(target), 'masterSha256':sha(target), 'generatedPath':str(source),
       'prompt':str(packet/'prompt.txt'), 'promptSha256':request['promptSha256'], 'tool':'image_gen.imagegen',
       'outputModified':False, 'actualShape':shape, 'referenceSha256':request['referenceSha256'],
       'lease':str(packet/'lease.json'), 'classification':'Original source only; independent visual review required before packet work'}
(packet/'generation.json').write_text(json.dumps(row,indent=2)+'\n')
index = packet.parent/'index.json'
old = index.read_text()
data = json.loads(old)
assert all(sha(Path(r['master']))==r['masterSha256'] for r in data['masters'])
assert str(target) not in [r['master'] for r in data['masters']]
data['masters'].append(row)
assert index.read_text()==old and index.read_text().count(old)==1
temporary=index.with_suffix('.tmp'); temporary.write_text(json.dumps(data,indent=2)+'\n'); temporary.replace(index)
print(json.dumps({'name':row['name'],'masterSha256':row['masterSha256'],'shape':shape,'outputModified':False}))
