from pathlib import Path
from PIL import Image
import json,hashlib
p=Path(__file__).resolve().parent;f=p.parent/'fit-02/parts';x=json.loads((f/'binding.json').read_text());a=next(r for r in x['parts'] if r['id']=='abdomen');box=a['cutout'];src=Image.open(f/'parts/abdomen.png').convert('RGBA');allowed=Image.new('L',(1254,1254));allowed.paste(src.getchannel('A'),(box['x'],box['y']));key=Image.open(f/'keyed.png').getchannel('A');av=list(allowed.getdata());kv=list(key.getdata());rows=[]
def check(mask):
 vals=list(mask.getdata());assert all(v<=k and (a>0 or v==0) for v,k,a in zip(vals,kv,av))
for name in ['striped','spotted','banded','mottled','marbled','eye-spotted']:
 mask=Image.open(p/'markings'/f'{name}.png').getchannel('A');check(mask);rows.append(name)
i=next(i for i,(a,k) in enumerate(zip(av,kv)) if a==0 and k==255);mutant=mask.copy();mutant.putpixel((i%1254,i//1254),255)
try:check(mutant);raise RuntimeError('outside-owner mutant passed')
except AssertionError:pass
(p/'distribution-control.json').write_text(json.dumps({'status':'PASS','validMasks':rows,'insideKeyedAlphaOutsideDeclaredAbdomenMutantRefused':True,'mutantPixel':[i%1254,i//1254],'helperSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},indent=2)+'\n')
