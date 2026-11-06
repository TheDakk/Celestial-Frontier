from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]; OUT=Path(__file__).resolve().parent
kit=(ROOT/'ART_KIT.md').read_text()
def section(h): return kit.split('## '+h+'\n',1)[1].split('\n## ',1)[0]
def block(h): return section(h).split('```text\n',1)[1].split('\n```',1)[0]
def between(s,a,b):
 assert s.count(a)==1,a
 return s.split(a,1)[1].split(b,1)[0]
reference=block('1. Reference lock');style=block('2. Frozen style')
source=ROOT/'audits/ART_KIT_CONTACT_REVISION_20260912/prepared/compiler-final/earth-temperate-prompt.txt'
card=between(source.read_text(),'SYSTEM CARD - ','\n\nSUBJECT');card='SYSTEM CARD - '+card
assert 'Sol / Earth' in card and 'weather rain' in card
(OUT/'system-card.txt').write_text(card+'\n')
tech=block('5. Technical output');negative=block('6. Shared negative')
shared=between(negative,"Paste in every prompt, then add the class's NEGATIVE ADDITIONS.\n\n",'\n\n  For CUT-OUT')
cutneg=between(negative,'  For CUT-OUT classes, add:\n','\n\n  For SCENE')
arenaneg=negative.split('  For Arena MID/NEAR, replace those object-isolation clauses with:\n')[1]
scene=between(tech,'SCENE BLOCK (paste for universe, stars, planet biomes):\n','\n\nGlow')
keytech=tech.split('ARENA KEY-PAINTED BLOCK (paste for Arena MID and NEAR):\n')[1]
cuttech=between(tech,'table says 1536, 512 or 256):\n','\n\nSCENE BLOCK')
arena=section('4C. Planets (orbital cut-out, biome scene)').split('### Arena scene profile\n')[1].split('```text\n')[1].split('\n```')[0]
alayout=between(arena,'ARENA - LAYOUT (paste):\n','\n\nARENA - OUTPUT:')
aneg=arena.split('ARENA - NEGATIVE ADDITIONS:\n')[1]
aaccuracy=between(arena,'ARENA MID/NEAR - ACCURACY:\n','\n\nARENA - NEGATIVE')
fx=block('4K. Effects (cut-out sequences)');flayout=between(fx,'LAYOUT (paste):\n','\n\nNEGATIVE ADDITIONS:');fneg=between(fx,'NEGATIVE ADDITIONS:\n','\n\nOUTPUT:');faccuracy=between(fx,'ACCURACY:\n','\n\nLAYOUT')
subjects={
'arena-far':'Earth temperate riverbank arena template, FAR plate only. Distant temperate wooded hills, restrained distant river water in cool slate blue, wet green banks fading into blue-grey rainy atmosphere, overcast cloud-filtered day. Low eye level. Horizon band y=0.66; shared virtual fighting-ground line y=0.78 is hidden under the future MID ground layer, not a drawn line. Distant atmosphere fills the upper field; the bottom continues the distant river and bank softly behind later terrain. No nearby trees, rocks, plants or fighting ground in this FAR layer. A single uninterrupted landscape, not the triptych layout. Output exactly 2560x1440, landscape 16:9.',
'arena-mid':'Earth temperate riverbank arena template, MID plate only. One continuous broad flat band of damp grey-brown compacted riverbank earth and small stones, with blue-grey wet sheen. The open side-view fighting surface crosses y=0.78 at both x=1/3 and x=2/3; empty walkable ground continues across the full width and down to the bottom edge. Its restrained horizon bank starts near y=0.66; a few low green bank growths sit behind it near the outer edges only. The entire field above this terrain is pure magenta, with no painted sky or river backdrop. Keep x=0.18 to0.82 free of tall landmarks. One uninterrupted layer, not tiles. Output exactly 2560x1440, landscape16:9.',
'arena-near':'Earth temperate riverbank arena template, NEAR plate only. One quiet continuous damp grey-brown ground edge occupying only the lowest tenth of the frame, from y=0.90 to the bottom. Fine small riverbank pebbles and very short grouped moss strokes, wet sheen in muted slate and earth tones. The entire upper90percent is flat pure magenta. No tall grass, fern fronds or large stones. Keep the virtual fighting-ground line y=0.78 and both stands above this edge completely magenta and unobstructed. Full-width lower strip, not a floating island or display base. Output exactly2560x1440, landscape16:9.',
'wild-launch':'Wild ability theme, source ability maw / Savage Maw: the beginning of a vicious opening strike, represented by three short curved tapered force strokes grouped as one compact painted shape. Muted slate-blue (#9fb6d6 translated to pigment), warm ivory and dark slate inner brush accents, solid opaque material, not light emission. LAUNCH phase, left-to-right. The three short strokes curl just to the right of normalized origin(0.20,0.55), contained within x0.18–0.43 and y0.35–0.68. Contact anchor(0.80,0.55) is empty space in this phase. No actual jaw, teeth, claw, creature or body part. One1024square image.',
'wild-travel':'Wild ability theme, source ability maw / Savage Maw: a vicious opening strike travelling as a short directional sweep, represented by three parallel tapered curved force strokes grouped as one crisp painted shape. Muted slate-blue (#9fb6d6 translated to pigment), warm ivory and dark slate inner brush accents, solid opaque material, not light emission. TRAVEL phase, left-to-right. Three strokes lengthen from normalized origin(0.20,0.55) toward contact(0.80,0.55), contained within x0.18–0.82 and y0.30–0.72. Connected directional grouping, no projectile invented. No actual jaw, teeth, claw, creature or body part. One1024square image.',
'wild-impact':'Wild ability theme, source ability maw / Savage Maw: the contact of a vicious opening strike, represented by three short tapered curved force strokes meeting a compact fan of solid painted impact wedges. Muted slate-blue (#9fb6d6 translated to pigment), warm ivory and dark slate inner brush accents, solid opaque material, not light emission. IMPACT phase, left-to-right. The compact strike fan centres on normalized contact(0.80,0.55), staying inside x0.57–0.91 and y0.30–0.78. The origin(0.20,0.55) is empty space in this phase. No actual jaw, teeth, claw, creature, body part, target, ground or shadow. One1024square image.'}
for name,subject in subjects.items():
 is_arena=name.startswith('arena'); far=name=='arena-far'
 prompt=[reference,style,card,'SUBJECT\n'+subject]
 if not far: prompt+=['ACCURACY\n'+(aaccuracy if is_arena else faccuracy)]
 prompt+=['LAYOUT\n'+(alayout if is_arena else flayout),'TECHNICAL OUTPUT\n'+(scene if far else keytech if is_arena else cuttech),'NEGATIVE\n'+shared+'\n'+(aneg if far else arenaneg+'\n'+aneg if is_arena else cutneg+'\n'+fneg)]
 (OUT/(name+'.prompt.txt')).write_text('\n\n'.join(prompt)+'\n')
context={'schema':'cf.arena.proof-context/v1','encounterKind':'wild','worldKey':'CF1|g:999@90,-60|s:424242@560,170|p:133#2','combatants':['Civet','Platypus'],'round':0,'biomeFamily':'temperate'}
serialized=json.dumps(context,sort_keys=True,separators=(',',':'));seed=int.from_bytes(hashlib.sha256(serialized.encode()).digest()[:4],'big')
recipe={'schema':'cf.arena.authoring-proof/v1','battleContext':context,'seed':seed,'seedDerivation':'first4bytes big-endian SHA256 of sorted compact battleContext JSON; no clock','groundLineNormalized':.78,'horizonBandNormalized':.66,'standsNormalizedX':[1/3,2/3],'systemCard':card,'systemCardSource':str(source.relative_to(ROOT)),'systemCardSourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'kitSha256':hashlib.sha256(kit.encode()).hexdigest(),'layers':{'far':'opaque scene','mid':'magenta-keyed terrain','near':'magenta-keyed terrain'},'extractedMasks':False,'qualityAccepted':False,'scope':'authored proof recipe, not live-game arena implementation'}
(OUT/'arena-recipe.json').write_text(json.dumps(recipe,indent=2)+'\n')
