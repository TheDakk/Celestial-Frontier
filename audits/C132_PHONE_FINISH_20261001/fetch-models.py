from pathlib import Path
import json,urllib.request,hashlib
out=Path('audits/C132_PHONE_FINISH_20261001'); cache=out/'model-cache';cache.mkdir(exist_ok=True)
for label,names in [('sdxs',['unet.onnx','vae_decoder.onnx','text_encoder.onnx','tokenizer/merges.txt','tokenizer/vocab.json','README.md']),('taesd',['taesd_encoder.safetensors','README.md','config.json']),('upstream',['scheduler/scheduler_config.json','tokenizer/tokenizer_config.json','tokenizer/special_tokens_map.json'])]:
 info=json.loads((out/(label+'-source.json')).read_text()); rows=[]
 for name in names:
  meta=next(x for x in info['tree'] if x['path']==name); dest=cache/label/name;dest.parent.mkdir(parents=True,exist_ok=True)
  url=f"https://huggingface.co/{info['model']}/resolve/{info['revision']}/{name}"
  assert not dest.exists(); h=hashlib.sha256(); count=0
  with urllib.request.urlopen(url,timeout=90) as response,dest.open('xb') as target:
   while True:
    b=response.read(2**20)
    if not b:break
    target.write(b);h.update(b);count+=len(b)
  assert count==meta['size']; actual=h.hexdigest(); expected=meta.get('lfs',{}).get('oid'); assert not expected or actual==expected
  rows.append({'path':name,'bytes':count,'sha256':actual,'url':url});print(label,name,count,flush=True)
 (out/(label+'-download.json')).write_text(json.dumps({'model':info['model'],'revision':info['revision'],'files':rows},indent=2)+'\n')
