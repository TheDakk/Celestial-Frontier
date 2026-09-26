from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
p=Path(__file__).resolve().parent;rows=json.loads((p/'native-summary-final.json').read_text())['rows'];s=Image.new('RGB',(1700,1150),'#172127');d=ImageDraw.Draw(s);f=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',27);small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',21)
d.text((20,18),'GROUNDED BIRD REPAIR — actual painted supports / proposed stage bundle',font=f,fill='white');d.text((20,61),'14/14 static + exact rest. All films 0/0 refusals, zero CPU frames >16.667ms at4x.',font=small,fill='#c2d7df')
for i,r in enumerate(rows):
 y=110+i*340;d.text((20,y),f"{r['name'].upper()} | {r['runId']} | p95 {r['cpuP95Ms']:.2f} ms / max {r['cpuMaxMs']:.2f} ms",font=f,fill='white')
 for j,file in enumerate(['turn2-dodge-reaction-50.png','turn3-hit-idle-90.png']):
  im=Image.open(p/r['runId']/file).convert('RGB');im.thumbnail((800,280));s.paste(im,(20+j*840,y+42))
d.text((20,1120),'Sparrow remains blocked: alert tail fold, claw contact and wing-root holes. Fullstage/picker pending.',font=small,fill='#ffd995');s.save(p/'review-sheet.png')
