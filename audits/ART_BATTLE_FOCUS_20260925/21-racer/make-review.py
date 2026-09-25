from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,colorsys
p=Path(__file__).resolve().parent;s=Image.new('RGB',(1800,1180),'#172127');d=ImageDraw.Draw(s);f=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',29);sm=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
d.text((25,20),'RACER — item21 / Earth painting rank14 / plain master + six own masks',font=f,fill='white');d.text((25,65),'12/12 static +945 presentation + exact rest. Native0/0; p95 2.60 / max9.90ms at4x.',font=sm,fill='#c5e3dc')
a=json.loads((p/'authoring.json').read_text());master=Image.open(p/'master.png').convert('RGBA');labels=Image.open(p/'fit-02/labels.png').convert('RGBA');colors=[(0,0,0,0)]+[tuple(round(c*255) for c in colorsys.hsv_to_rgb(i*.618%1,.65,.95))+(255,) for i in range(13)];labels.putdata([colors[q[0]] for q in labels.getdata()]);fit=master.copy();fd=ImageDraw.Draw(fit);tiny=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',25)
for i,(j,(x,y)) in enumerate(a['landmarksPx'].items()):
 fd.ellipse((x-4,y-4,x+4,y+4),fill='cyan');fd.line((x,y,x,y-40-25*(i%2)),fill='cyan',width=2);fd.text((x-18,y-70-25*(i%2)),j,font=tiny,fill='white',stroke_width=2,stroke_fill='#14252b')
for i,(im,title) in enumerate([(master,'1254-square master (unchanged alpha)'),(labels,'13 authored paint owners'),(fit,'Manually observed joint placement')]):
 x=25+i*590;d.text((x,120),title,font=sm,fill='white');im.thumbnail((560,500));s.paste(im,(x,160),im)
for i,(file,title) in enumerate([('turn0-hit-return-end.png','Return — snouts overlap; stage spacing still open'),('turn3-hit-idle-90.png','Final faint — continuous paint, no rig refusal')]):
 x=25+i*895;d.text((x,705),title,font=sm,fill='#ffcc8a');im=Image.open(p/'native-observed-01'/file).convert('RGB');im.thumbnail((870,420));s.paste(im,(x,745))
d.text((25,1150),'Proposed stage bundle; other-lane test work present. Integrated travel/picker/coverage and Nick review pending.',font=sm,fill='#ffcc8a');s.save(p/'review-sheet.png')
