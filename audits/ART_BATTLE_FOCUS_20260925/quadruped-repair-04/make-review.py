from pathlib import Path
import json,hashlib,subprocess
from PIL import Image,ImageDraw,ImageFont
root=Path('/Users/nick/Projects/celestial-frontier-openai-mac'); p=root/'audits/ART_BATTLE_FOCUS_20260925/quadruped-repair-04'
rows=[]
for name,fit,static,run in [('impala','impala-fit-02','impala-static-02.json','native-impala-04'),('marmot','marmot-fit-02','marmot-static-02.json','native-marmot-04'),('cattle','cattle-fit-02','cattle-static-02.json','native-cattle-05'),('lizard','lizard-fit-03','lizard-static-03.json','native-lizard-05'),('bear','../14-brown-bear/fit-02','bear-static-03.json','native-bear-04')]:
 d=json.loads((p/static).read_text()); rows.append(dict(name=name,fit=fit,static=static,run=run,recordRecipeHash=d['recordRecipeHash'],bindingHash=d['bindingHash'],rows=len(d['rows']),staticStatus=d['status'],exactRest=d['exactRest'],sourcePixelRest=d['sourcePixelRest']))
(p/'final-candidates.json').write_text(json.dumps(rows,indent=2)+'\n')
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',26); small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)
sheet=Image.new('RGB',(1800,1840),'#172127'); draw=ImageDraw.Draw(sheet)
draw.text((24,18),'QUADRUPED REPAIR 04 — PROPOSED STAGE BUNDLE / NOT LIVE ADMISSION',fill='white',font=font)
draw.text((24,60),'All five: 19/19 static + exact rest. Remaining spacing, art and Cattle performance issues below.',fill='#b9ccd7',font=small)
notes={'impala':'5.9 ms p95 (rounded); visible flank patch/crease remains','marmot':'6.4 ms p95 (rounded); neck opening closed; heads overlap','cattle':'15.0 ms p95; 34 CPU frames >16.667 ms; NOT 60 fps','lizard':'3.8 ms p95; max 9.7 ms; no >16.667 ms CPU frame','bear':'7.4 ms p95; heads overlap; sixth mask still tool-refused'}
for i,r in enumerate(rows):
 y=110+i*340;draw.text((24,y),r['name'].upper()+' | '+r['run']+' | 0/0 refusals',fill='white',font=font)
 draw.text((24,y+36),notes[r['name']],fill='#ffd995',font=small)
 for j,f in enumerate(['turn1-hit-approach-50.png','turn3-hit-idle-90.png']):
  im=Image.open(p/r['run']/f).convert('RGB');im.thumbnail((850,270));sheet.paste(im,(24+j*884,y+66))
sheet.save(p/'review-sheet.png')
