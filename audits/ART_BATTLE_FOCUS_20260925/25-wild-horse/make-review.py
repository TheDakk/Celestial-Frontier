from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,colorsys
p=Path(__file__).resolve().parent;s=Image.new('RGB',(1800,1240),'#172127');d=ImageDraw.Draw(s);f=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',29);sm=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
d.text((25,20),'WILD HORSE — item25 / Earth painting rank24 / plain master + six own masks',font=f,fill='white');d.text((25,65),'19/19 static +1680 presentation + exact rest. Native0/0; p95 5.80 / max14.20ms at4x.',font=sm,fill='#c5e3dc')
a=json.loads((p/'authoring.json').read_text());master=Image.open(p/'fit-05/parts/keyed.png').convert('RGBA');labels=Image.open(p/'fit-05/parts/ownership.png').convert('RGBA');fit=master.copy();fd=ImageDraw.Draw(fit);tiny=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',25)
for i,(j,(x,y)) in enumerate(a['landmarksPx'].items()):
 fd.ellipse((x-4,y-4,x+4,y+4),fill='cyan');fd.line((x,y,x,y-40-25*(i%2)),fill='cyan',width=2);fd.text((x-18,y-70-25*(i%2)),j,font=tiny,fill='white',stroke_width=2,stroke_fill='#14252b')
for i,(im,title) in enumerate([(master,'1254-square master, established keyer'),(labels,'31 authored paint owners'),(fit,'Manually observed joint placement')]):
 x=25+i*590;d.text((x,120),title,font=sm,fill='white');im.thumbnail((560,500));s.paste(im,(x,160),im)
for i,(file,title) in enumerate([('turn1-hit-return-end.png','Return — positive head gap'),('turn3-hit-idle-90.png','Final faint — repaired neck/body seam')]):
 x=25+i*895;d.text((x,705),title,font=sm,fill='#ffcc8a');im=Image.open(p/'native-observed-02'/file).convert('RGB');im.thumbnail((870,420));s.paste(im,(x,745))
d.text((25,1205),'Proposed stage bundle; integrated full-stage travel, picker, coverage and Nick review pending.',font=sm,fill='#ffcc8a');s.save(p/'review-sheet.png')
