from pathlib import Path
import json,hashlib,shutil
p=Path('audits/ART_BATTLE_FOCUS_20260925/19-reef-shark');src=Path('/Users/nick/.codex/generated_images/01a0c73f-5f04-7592-8681-402a4e887ffc/exec-13e90721-de4f-449e-a028-7f06ca1e6c04.png');shutil.copyfile(src,p/'master.png');sha=lambda f:hashlib.sha256(Path(f).read_bytes()).hexdigest()
(p/'tool-receipt-02.json').write_text(json.dumps({'tool':'image_gen.imagegen','outputPath':str(src),'sha256':sha(src),'promptFile':'correction-prompt-02.txt','promptSha256':sha(p/'correction-prompt-02.txt'),'reference':'generation-01/master.png','referenceSha256':sha(p/'generation-01/master.png'),'decision':'candidate: complete right-facing shark with both pectorals/pelvics visible, safe transparent margins; Nick review pending'},indent=2)+'\n')
s=1254/1280
L={'root':(878,679),'head':(1026,683),'jaw':(1042,722),'spine0':(804,677),'spine1':(711,675),'spine2':(612,678),'spine3':(517,678),'spine4':(417,677),'spine5':(330,676),'caudal':(263,671),'dorsal':(706,541),'pectoralNear':(772,784),'pectoralFar':(847,794)};P=[]
def part(i,j,pts,l='near'):P.append({'id':i,'joint':j,'polygonPx':[[round(x*s,3),round(y*s,3)]for x,y in pts],'layer':l})
def rect(i,j,x,y,X,Y,l='near'):part(i,j,[(x,y),(X,y),(X,Y),(x,Y)],l)
part('near-pectoral','pectoralNear',[(747,735),(800,716),(842,706),(879,721),(868,752),(814,813),(750,846),(675,867),(673,846),(711,799)])
part('far-pectoral','pectoralFar',[(824,752),(890,746),(884,779),(850,831),(824,842),(809,798)],'far')
part('dorsal','dorsal',[(631,596),(657,559),(670,502),(670,449),(701,455),(746,493),(778,540),(800,579),(812,596)])
part('jaw','jaw',[(987,711),(1040,704),(1093,705),(1092,731),(1045,749),(991,749)])
rect('head','head',929,573,1128,778)
part('caudal','caudal',[(142,480),(213,495),(279,551),(325,631),(338,669),(327,699),(298,732),(246,781),(207,799),(196,779),(236,726),(252,674),(229,616),(191,559)])
rect('root','root',872,673,884,685)
rect('tail-peduncle','spine5',310,570,375,785)
rect('rear-body','spine4',375,575,467,791)
rect('pelvic-body','spine3',467,581,562,791)
rect('mid-body','spine2',562,583,662,786)
rect('front-body','spine1',662,582,758,785)
rect('body','spine0',758,583,934,789)
a={'id':'reef-shark','family':'fish','landmarksPx':{k:[round(x*s,3),round(y*s,3)]for k,(x,y)in L.items()},'groundLineY':.85,'habitat':{'realm':'water','source':'Manually declared Earth Reef Shark swimming fish; paired pectorals and pelvic fins, anal and second dorsal present on source. No terrestrial support inferred.'},'materials':{'surface':'plain grey painted shark skin with pale belly shading, no pigment stripes or spots'},'remainderPart':'body','parts':P,'coverage':{'declarations':'Thirteen existing fish joints. Two separately visible pectoral fins; paired pelvic fins, anal fin and small second dorsal follow their observed axial body region. Complete asymmetric caudal, tall first dorsal, five gill slits, crescent mouth. No absent/hidden/folded contracted anatomy, no new fin joint invented. All polygons and landmarks manually authored on this master.','sourceFacing':'right','visualAcceptance':'Nick pending; no family-wide acceptance'}}
(p/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(p/'presence.json').write_text(json.dumps({'schema':'cf.anatomy-presence/v2','absent':[],'hidden':[],'folded':[]},indent=2)+'\n')
for n in ['weld-flat-master.mjs']:
 t=(p.parent/'sturgeon-facing-04'/n).read_text().replace('sturgeon','reef-shark').replace('Sturgeon','Reef Shark');(p/n).write_text(t)
(p/'finish-masks.mjs').write_text((p.parent/'13-river-otter/finish-masks.mjs').read_text().replace('river-otter','reef-shark'))
b=json.loads((p.parent/'13-river-otter/battle-script.json').read_text().replace('River Otter','Reef Shark'));b['themes']={'A':'lake','B':'lake'};(p/'battle-script.json').write_text(json.dumps(b,indent=2)+'\n')
(p/'prompts').mkdir();(p/'raw').mkdir();patterns={'striped':'five tapering vertical tiger-shark bars descending from the back','spotted':'a regular staggered checkerboard of small round whale-shark spots','banded':'three broad soft vertical bands','mottled':'an irregular scattered cluster of softly mottled patches','marbled':'thin winding connected marbled veins','eye-spotted':'five separated oval rings with transparent centres'}
for k,desc in patterns.items():(p/'prompts'/f'{k}.txt').write_text(f'Use case: stylized-concept. Create one standalone marking alpha mask for the attached Reef Shark master. EXACT 1254 x 1254 canvas and exact registration to the reference. Output ONLY white painted marks with transparency everywhere else, no creature pixels, background or labels. Pattern: {desc}. Cover the flank roughly x=410..830,y=600..685, following its horizontal silhouette. Keep off head, gill slits and fins; preserve a clear pale belly. Retain soft painterly edges and transparent gaps between motifs. This is a mask, not a repainted animal; no movement, rescaling or cropping of the reference.\n')
