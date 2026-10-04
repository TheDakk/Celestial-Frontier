from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent
s=Image.new('RGB',(1700,1160),'#172127');d=ImageDraw.Draw(s);f=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',28);sm=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
d.text((22,18),'SPARROW REPAIR03 — painted ownership, tail pivot and grounded claw',font=f,fill='white')
d.text((22,60),'14/14 static + presentation + exact rest. Native 0/0 refusals. Performance remains RED.',font=sm,fill='#ffcb83')
for file,box,label in [('authoring-01/master.png',(22,118,450,450),'Unchanged painted master'),('fit-02/labels.png',(600,118,450,450),'18 authored part owners'),('native-observed-01/turn0-hit-reaction-50.png',(22,665,800,450),'Connected shoulders / hit reaction'),('native-observed-01/turn3-hit-idle-90.png',(860,665,800,450),'Final faint — settle CPU spikes')]:
 x,y,w,h=box;im=Image.open(p/file).convert('RGBA')
 if file.endswith('labels.png'):
  import colorsys,json
  ids=json.loads((p/'fit-02/declaration.json').read_text())['parts'];colors=[(0,0,0,0)]+[tuple(round(v*255) for v in colorsys.hsv_to_rgb((i*.618)%1,.65,.95))+(255,) for i in range(len(ids))]
  im.putdata([colors[q[0]] for q in im.getdata()])
  for i,part in enumerate(ids):
   yy=120+i*24;d.rectangle((1080,yy,1100,yy+18),fill=colors[i+1]);d.text((1110,yy-2),part['id'],font=sm,fill='white')
 im.thumbnail((w,h));s.paste(im,(x,y),im);d.text((x,y-35),label,font=sm,fill='white')
d.text((22,590),'Proposed stage bundle / observed painted supports. p95 7.20 ms, max 29.70 ms at4x.',font=sm,fill='#c9dfe4')
d.text((22,1125),'15 CPU frames >16.667 ms; 6 frame intervals >=25 ms. Fullstage/picker and integrated review pending.',font=sm,fill='#ffcb83');s.save(p/'review-sheet.png')
