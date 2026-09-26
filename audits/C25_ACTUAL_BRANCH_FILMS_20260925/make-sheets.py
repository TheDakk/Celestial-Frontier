from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
p=Path(__file__).resolve().parent;rows=json.loads((p/'summaries.json').read_text());font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17)
marks=['turn0-hit-approach-50.png','turn0-hit-impact.png','turn2-dodge-return-end.png','turn3-hit-idle-90.png']
for start in range(0,len(rows),5):
 subset=rows[start:start+5];im=Image.new('RGB',(1536,len(subset)*246+35),'#10151b');d=ImageDraw.Draw(im);d.text((8,6),'C25 actual anthropic/mac 4093ebca — approach | impact | return | faint; 4x CPU diagnostic',font=font,fill='white')
 for i,r in enumerate(subset):
  y=35+i*246;label=f"{r['name']} | refusals {r['refusals']['left']}/{r['refusals']['right']} | p95 {r['cpuP95Ms']:.2f}ms max {r['cpuMaxMs']:.2f}ms | >16.667ms: {len(r['overBudgetFrames'])}"
  d.text((8,y+3),label,font=font,fill='#ff9084'if r['status']=='FAIL'or r['overBudgetFrames'] else 'white')
  for k,m in enumerate(marks):
   img=Image.open(p/r['runId']/m).convert('RGB').resize((384,216));im.paste(img,(k*384,y+27))
 im.save(p/f'review-{start//5+1:02}.jpg',quality=94)
