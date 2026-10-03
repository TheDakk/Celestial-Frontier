import json,pathlib,hashlib,subprocess
E=pathlib.Path('audits/C163_EFFECTS_POLISH_20261002'); A=pathlib.Path('audits/C132_ARENAS_20261001')
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def bind(p):return {'path':str(p),'sha256':sha(p),'bytes':pathlib.Path(p).stat().st_size}
def read(p):return json.loads(pathlib.Path(p).read_text())
def write(p,x):
 with pathlib.Path(p).open('x') as f:f.write(json.dumps(x,indent=2)+'\n')
def samehead(p):
 raw=subprocess.run(['git','show','HEAD:'+str(p)],capture_output=True,check=True).stdout
 assert hashlib.sha256(raw).hexdigest()==sha(p),str(p)
 return bind(p)
findings={
'storm':['Broader white-gold arcs and larger charcoal cloud facets read more clearly on the retained dark, gray and pale static backgrounds.','Actual occupied paint grew despite unchanged canvas registration and anchors. Fine branch tips and charged debris still need native transition and phone-size review.'],
'void':['The dark crescent is larger, with broader neutral gray lit debris and torn facets. Its edges read more clearly against the dark static background.','Dark interior remains intentionally low-contrast. Actual occupied paint grew with registration unchanged; scale and attacker occlusion require new native review.'],
'stone':['Larger pale gray fracture faces make the dominant shards easier to distinguish against the static backgrounds. Several small fragments remain.','The material remains predominantly neutral charcoal/stone, but travel readability and target overlap need native review; no 60 fps or phone claim.'],
'sand':['A stronger burnt-umber core and pale grain faces make the stream easier to see on the pale/gray static backgrounds.','The denser warmer stream looks more orange than its predecessor. Theme identity versus Fire and grain readability need independent scoring and native film.']}
rows=[]
for theme in findings:
 d=E/theme;i=read(d/'intake.json');g=read(d/'generation.json');a=read(d/'anchors.json')
 for x in [g['prompt'],g['editTarget'],g['reference']]:assert sha(x['path'])==x['sha256']
 assert sha(g['master'])==g['sourceSha256']==g['masterSha256'];samehead(g['editTarget']['path']);samehead(i['predecessor']['anchors'])
 for x in i['unchangedPhases']:assert sha(x['source'])==x['sha256'];samehead(x['source'])
 review={'schema':'cf.c163-effect-visual-review/v1','theme':theme,'selectedPhase':i['phase'],'qualityAccepted':False,'registered':False,'nativeProof':False,'inspectedImages':[bind(g['master']),bind(d/'comparison-static.png')]+[bind(d/'registered'/f'{p}.png') for p in ['launch','travel','impact']],'comparisonLayout':'Static 768 x 1152 comparison; old LEFT, candidate RIGHT; rows gray (#464c46), dark (#151820), pale (#d6cebb). This is not a native film or arena proof.','findings':findings[theme],'mechanical':i['validation'],'unchanged':{'timingAndMotionSourcesEdited':False,'sourceRegistration':i['registration'],'phaseOrder':a['phaseOrder'],'unselectedPhases':i['unchangedPhases']},'sourcePreservation':{'target':g['editTarget'],'predecessorAnchors':i['predecessor'],'originalPixelsModified':False},'status':'MECHANICAL_PASS_NEW_ART_AWAITING_SCORING_AND_NATIVE_FILM'}
 write(d/'visual-review.json',review)
 row={'theme':theme,'phase':i['phase'],'anchors':str(d/'anchors.json'),'anchorsSha256':sha(d/'anchors.json'),'generation':bind(d/'generation.json'),'review':bind(d/'visual-review.json'),'qualityAccepted':False,'registered':False};write(d/'delivery.json',row);rows.append(row)
write(E/'delivery.json',{'schema':'cf.c163-effects-polish-delivery/v1','status':'FOUR_MECHANICAL_CANDIDATES_AWAITING_SCORING','qualityAccepted':False,'registered':False,'nativeProof':False,'sourceAndTargetAnchorsChanged':False,'timingChanged':False,'validation':bind(E/'validation.json'),'rows':rows,'scope':'Additive audit-only replacement candidates. Existing registered effects remain unchanged. Fresh artwork does not inherit predecessor acceptance.'})
arearows=[]
ref=pathlib.Path('audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png')
for id,old,newroles in [('marsh-r3','marsh',['mid','near']),('dunesea-r2','dunesea',['mid','near']),('freshwater-lake-v3','freshwater-lake-v2',['near'])]:
 d=A/id;prev=A/old;edits=[];reused=[]
 for role in ['far','mid','near']:
  samehead(prev/f'arena-{role}.png')
  if role not in newroles:
   assert sha(d/f'arena-{role}.png')==sha(prev/f'arena-{role}.png');reused.append({'role':role,'original':bind(prev/f'arena-{role}.png'),'copy':bind(d/f'arena-{role}.png')});continue
  if role=='mid':edits.append({'role':role,'master':bind(d/'arena-mid.png'),'receipt':bind(d/'arena-mid.generation.json'),'editTarget':bind(prev/'arena-mid.png'),'reference':bind(ref),'selected':True})
  else:
   edits.append({'role':role,'master':bind(d/'arena-near-attempt-1.png'),'receipt':bind(d/'arena-near-attempt-1.generation.json'),'editTarget':bind(prev/'arena-near.png'),'reference':bind(ref),'selected':False,'hold':'Preserved too much predecessor shelf/plant/color texture; immutable predecessor retained.'})
   target=(d if id!='freshwater-lake-v3' else prev)/'arena-mid.png'
   edits.append({'role':role,'master':bind(d/'arena-near.png'),'receipt':bind(d/'arena-near.generation.json'),'editTarget':bind(target),'reference':bind(ref),'selected':True})
 for x in edits:
  g=read(x['receipt']['path']);assert g['sourceSha256']==x['master']['sha256'];assert sha(g['prompt']['path'])==g['prompt']['sha256'];x['prompt']=g['prompt'];x['inputOrder']=['editTarget','reference']
 write(d/'edit-provenance.json',{'schema':'cf.c163-arena-edit-provenance/v1','id':id,'qualityAccepted':False,'originalsModified':False,'edits':edits,'reused':reused})
 r=read(d/'d29/webp-receipt.json');write(d/'webp-visual-review.json',{'schema':'cf.c163-arena-webp-review/v1','id':id,'qualityAccepted':False,'inspected':[bind(d/'arena-composed-review.png'),bind(d/'arena-composed-webp-review.png')],'findings':['Native-size PNG and decoded WebP compositions reviewed. The WebP preserves the observed composition and the same visible texture joins and plant-edge holds; it does not repair them.','No additional obvious composition change was seen at native size. RGB is lossy q88; this observation is not pixel identity or independent scoring. All nine plate alpha planes are independently checked byte-identical to PNG runtimes.'],'metrics':{k:{q:v[q] for q in ['psnr','ssim','ssimMinBlock','alphaIdentical']} for k,v in r['plates'].items()},'d29Review':bind(d/'d29/delivery-review.json'),'webpReceipt':bind(d/'d29/webp-receipt.json')})
 arearows.append({'id':id,'predecessor':old,'pngManifest':bind(d/'d29/delivery.pending.json'),'webpManifest':bind(d/'d29/delivery.webp.pending.json'),'provenance':bind(d/'edit-provenance.json'),'visualReview':bind(d/'visual-notes.d29.json'),'webpReview':bind(d/'webp-visual-review.json'),'pngBytes':r['pngBytes'],'webpBytes':r['webpBytes'],'qualityAccepted':False,'registered':False})
write(A/'effects-agent-repaint-c163.json',{'schema':'cf.c163-arena-repaint-delivery/v1','status':'THREE_MECHANICAL_CANDIDATES_WITH_REMAINING_VISUAL_HOLDS','qualityAccepted':False,'registered':False,'nativeProof':False,'newOriginals':8,'selectedNewOriginals':5,'heldNewOriginals':3,'reusedOriginals':4,'canvas':{'width':1672,'height':941},'originalsModified':False,'runtimeEncoding':'D30 q88 WebP, decoded alpha byte-identical; PNG masters/runtimes retained','totals':{'pngRuntimeBytes':sum(r['pngBytes'] for r in arearows),'webpRuntimeBytes':sum(r['webpBytes'] for r in arearows)},'rows':arearows,'next':'Independent full-size scoring of the recorded seam/fringe issues and new Dakk acceptance before any replacement registration. Existing accepted originals remain active.'})
print(json.dumps({'effects':bind(E/'delivery.json'),'arenas':bind(A/'effects-agent-repaint-c163.json')}))
