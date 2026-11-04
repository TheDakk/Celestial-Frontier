from pathlib import Path
from PIL import Image
import json,hashlib
p=Path(__file__).resolve().parent;f=p/'fit-03/parts';x=json.loads((f/'binding.json').read_text());allowed=Image.new('L',(1254,1254))
for id in json.loads((p/'distribution.json').read_text())['allowedPartIds']:
 a=next(r for r in x['parts'] if r['id']==id);box=a['cutout'];src=Image.open(f/'parts'/f'{id}.png').convert('RGBA');alpha=src.getchannel('A');allowed.paste(alpha,(box['x'],box['y']),alpha)
key=Image.open(f/'keyed.png').getchannel('A');av=list(allowed.get_flattened_data());kv=list(key.get_flattened_data());rows=[]
def check(mask):
 vals=list(mask.get_flattened_data());assert all(v<=k and (a>0 or v==0) for v,k,a in zip(vals,kv,av))
for name in ['striped','spotted','banded','mottled','marbled','eye-spotted']:
 mask=Image.open(p/'markings'/f'{name}.png').getchannel('A');check(mask);rows.append(name)
i=next(i for i,(a,k) in enumerate(zip(av,kv)) if a==0 and k==255);mutant=mask.copy();mutant.putpixel((i%1254,i//1254),255)
try:check(mutant);raise RuntimeError('outside-owner mutant passed')
except AssertionError:pass
(p/'distribution-control.json').write_text(json.dumps({'status':'PASS','validMasks':rows,'insideKeyedAlphaOutsideDeclaredFurMutantRefused':True,'mutantPixel':[i%1254,i//1254],'helperSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},indent=2)+'\n')
