from pathlib import Path
import json,hashlib,shutil
p=Path('audits/ART_BATTLE_FOCUS_20260925/20-pike');src=Path('/Users/nick/.codex/generated_images/01a0c73f-5f04-7592-8681-402a4e887ffc/exec-a3897f9a-87fe-470c-a999-25cab803c3c8.png');shutil.copyfile(src,p/'master.png');sha=lambda f:hashlib.sha256(Path(f).read_bytes()).hexdigest()
(p/'tool-receipt-02.json').write_text(json.dumps({'tool':'image_gen.imagegen','outputPath':str(src),'sha256':sha(src),'promptFile':'correction-prompt-02.txt','promptSha256':sha(p/'correction-prompt-02.txt'),'reference':'generation-01/master.png','referenceSha256':sha(p/'generation-01/master.png'),'decision':'candidate: complete plain olive Pike, fine low-contrast scales and fin rays, no bean spots; separate paired fins; safe margins. Nick review pending'},indent=2)+'\n')
s=1254/1280;L={'root':(817,626),'head':(963,630),'jaw':(1051,653),'spine0':(749,629),'spine1':(670,630),'spine2':(589,630),'spine3':(508,630),'spine4':(424,629),'spine5':(335,628),'caudal':(248,628),'dorsal':(378,549),'pectoralNear':(774,716),'pectoralFar':(807,730)};P=[]
def part(i,j,pts,l='near'):P.append({'id':i,'joint':j,'polygonPx':[[round(x*s,3),round(y*s,3)]for x,y in pts],'layer':l})
def rect(i,j,x,y,X,Y,l='near'):part(i,j,[(x,y),(X,y),(X,Y),(x,Y)],l)
part('near-pectoral','pectoralNear',[(743,690),(791,675),(827,668),(842,681),(825,707),(779,750),(735,769),(726,743),(729,707)])
part('far-pectoral','pectoralFar',[(805,708),(837,683),(849,697),(837,729),(799,766),(777,775),(761,748)],'far')
part('dorsal','dorsal',[(320,568),(320,536),(342,500),(374,504),(426,528),(465,560),(411,577),(354,594)])
part('jaw','jaw',[(944,655),(1010,641),(1100,636),(1122,644),(1122,669),(1042,686),(957,690)])
rect('head','head',854,533,1128,711)
rect('caudal','caudal',130,505,288,756)
rect('root','root',811,620,823,632)
rect('tail-peduncle','spine5',288,583,379,781)
rect('rear-body','spine4',379,559,466,786)
rect('pelvic-body','spine3',466,541,549,787)
rect('mid-body','spine2',549,541,628,787)
rect('front-body','spine1',628,538,710,787)
rect('body','spine0',710,536,858,787)
a={'id':'pike','family':'fish','landmarksPx':{k:[round(x*s,3),round(y*s,3)]for k,(x,y)in L.items()},'groundLineY':.85,'habitat':{'realm':'aquatic','source':'Manually declared Earth Pike swimming fish; source has both pectorals/pelvics, anal and rear-set dorsal. No terrestrial support inferred.'},'materials':{'surface':'plain olive painted fish scales, low-contrast fine scale structure, soft pale belly shading and plain fin rays'},'remainderPart':'body','parts':P,'coverage':{'declarations':'Thirteen existing fish joints manually located. Both pectorals separately visible; pelvic pair and anal fin follow observed axial body regions. Complete forked caudal, rear-set dorsal and long flattened toothy snout. No absent, hidden or folded contracted anatomy. No source labels/landmarks reused and no new joint invented.','sourceFacing':'right','visualAcceptance':'Nick pending; no family-wide acceptance'}}
(p/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(p/'presence.json').write_text(json.dumps({'schema':'cf.anatomy-presence/v2','absent':[],'hidden':[],'folded':[]},indent=2)+'\n')
for n in ['weld-flat-master.mjs','inspect-boundaries.mjs']:(p/n).write_text((p.parent/'19-reef-shark'/n).read_text().replace('reef-shark','pike').replace('Reef Shark','Pike'))
(p/'finish-masks.mjs').write_text((p.parent/'13-river-otter/finish-masks.mjs').read_text().replace('river-otter','pike'))
(p/'battle-script.json').write_text((p.parent/'sturgeon-facing-04/battle-script.json').read_text().replace('Sturgeon','Pike'))
(p/'prompts').mkdir();(p/'raw').mkdir();patterns={'striped':'five thin tapering vertical stripes','spotted':'small separated oval bean spots in staggered rows','banded':'three broad soft vertical bands','mottled':'an irregular scattered cluster of soft mottled patches','marbled':'thin branching marbled veins','eye-spotted':'five small oval rings with transparent centres'}
for k,desc in patterns.items():(p/'prompts'/f'{k}.txt').write_text(f'Use case: stylized-concept. Create one standalone marking alpha mask for the attached exact Pike master. EXACT 1254 x 1254 canvas, exact registration. Output ONLY white painted marks on transparent background, no creature pixels or text. Pattern: {desc}. Confine it to a compact horizontal patch on UPPER FLANK x=420..780,y=568..625. Transparent everywhere else, especially head, fins and pale underside. Do not extend markings towards the long snout or tail. Soft painterly edges, readable transparent gaps, no cropping/translation/resizing. This is a mask, not a repainted fish.\n')
