from pathlib import Path
import json,hashlib,subprocess,shutil,base64,html
repo=Path('SOURCE_ROOT');bundle=Path('PRIVATE_CANID_BUNDLE');audit=repo/'audits/CREATURE_BLENDER_CANID_20260908';out=audit/'comparison';out.mkdir()
receipt={'schema':'cf-canid-review-derivatives/v1','status':'WORKING','commands':[],'renderedFrames':[1,25,49,81,97],'actualDisplaySizes':[132,300,440],'runtimeIntegrated':False,'humanAccepted':False}
def run(args):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30);receipt['commands'].append({'argv':args,'exitCode':p.returncode});assert p.returncode==0,p.stdout.decode()
def img(name):return 'data:image/png;base64,'+base64.b64encode((out/name).read_bytes()).decode()
for size in [132,300,440]:
 src=Path('PRIVATE_TMP/cf-creature-reference-native-size-20260908')/('wolf-'+str(size)+'.png')
 if not src.exists():
  choices=list(src.parent.glob('*'+str(size)+'*.png'));assert len(choices)==1;src=choices[0]
 shutil.copy2(src,out/('canonical-'+str(size)+'.png'))
 for version in ['v1','v2']:
  frames=[1] if version=='v1' else [1,25,49,81,97]
  for frame in frames:
   source=bundle/('wolf-canid-'+version)/'renders'/('wolf-frame-'+str(frame).zfill(3)+'.png');target=out/(version+'-'+str(frame).zfill(3)+'-'+str(size)+'.png')
   if size==440:shutil.copy2(source,target)
   else:run(['/opt/homebrew/bin/magick',str(source),'-filter','Lanczos','-resize',str(size)+'x'+str(size),str(target)])
# Exact-sized diagnostic proof, no rescaling of canonical references.
for size in [132,300,440]:
 run(['/opt/homebrew/bin/magick',str(out/('canonical-'+str(size)+'.png')),str(out/('v1-001-'+str(size)+'.png')),str(out/('v2-001-'+str(size)+'.png')),'-background','#142137','-alpha','remove','+append',str(out/('comparison-'+str(size)+'.png'))])
style='body{font:16px system-ui;margin:0;background:#0a1423;color:#e9f1ff}main{max-width:1460px;margin:auto;padding:24px}h1{font-size:28px}p{max-width:80ch;line-height:1.6;color:#c1cce0}.strip{display:flex;gap:16px;overflow:auto;padding-bottom:16px}.card{flex:0 0 auto;margin:0;background:#142137;border:1px solid #364761;border-radius:12px;overflow:hidden}figcaption{padding:12px;font-weight:600}img{display:block}button,select{font:inherit;background:#253b59;color:white;border:1px solid #617899;border-radius:8px;padding:10px;margin:6px 8px 12px 0}.note{color:#e6c990}button:focus-visible,select:focus-visible{outline:3px solid #ffdc88}'
body='<h1>Wolf: canonical portrait → connected Blender candidate</h1><p>Same complete genome and visual identity. Left: current game portrait. Middle: first 3D candidate. Right: one surface-sampling correction. Source proportions and bones stay fixed; lateral depth and tissue joins are authored in Blender.</p><p class="note">Offline review candidate. The playable game still uses the canonical portrait. Fur/material detail, limb junctions, battle motions, walking and human art acceptance remain unfinished.</p>'
for size in [132,300,440]:
 body+='<h2>'+str(size)+' × '+str(size)+' pixels</h2><div class="strip">'
 for name,label in [('canonical-'+str(size)+'.png','Current canonical'),('v1-001-'+str(size)+'.png','V1 — initial surface'),('v2-001-'+str(size)+'.png','V2 — smoother surface')]:body+='<figure class="card"><figcaption>'+label+'</figcaption><img width="'+str(size)+'" height="'+str(size)+'" alt="'+label+' Wolf" src="'+img(name)+'"></figure>'
 body+='</div>'
body+='<h2>Rendered pose comparison</h2><p>Choose among five actual rendered poses from the 97-frame finite timeline. This is a pose comparison, not a live skeletal animation.</p><label for="pose">Pose </label><select id="pose">'+''.join('<option value="'+str(frame).zfill(3)+'">Frame '+str(frame)+' — '+label+'</option>' for frame,label in [(1,'rest'),(25,'idle'),(49,'idle settled'),(81,'inspection'),(97,'settled')])+'</select><figure class="card" style="width:440px"><img id="pose-image" width="440" height="440" alt="Wolf frame 1" src="'+img('v2-001-440.png')+'"></figure>'
images={str(frame).zfill(3):img('v2-'+str(frame).zfill(3)+'-440.png') for frame in [1,25,49,81,97]}
script='const poses='+json.dumps(images)+';document.querySelector("#pose").addEventListener("change",e=>{const image=document.querySelector("#pose-image");image.src=poses[e.target.value];image.alt="Wolf frame "+Number(e.target.value);});'
(out/'review.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wolf Blender candidate comparison</title><style>'+style+'</style><main>'+body+'</main><script>'+script+'</script></html>')
receipt['status']='PASS';receipt['files']=[{'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.iterdir()) if p.is_file()]
# Public commands use logical source IDs instead of private storage paths.
receipt['commands']=[{'argv':[v.replace(str(bundle),'PRIVATE_CANID_BUNDLE').replace('PRIVATE_TMP/cf-creature-reference-native-size-20260908','CANONICAL_REFERENCE').replace(str(repo),'SOURCE_ROOT') for v in r['argv']],'exitCode':r['exitCode']} for r in receipt['commands']]
(out/'derivatives.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':'PASS','files':len(receipt['files']),'out':str(out)}))
