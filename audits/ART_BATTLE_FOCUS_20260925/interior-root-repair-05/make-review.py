from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent
sheet=Image.new('RGB',(1600,1040),'#172127');d=ImageDraw.Draw(sheet);font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',28);small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
d.text((22,20),'IMPALA INTERIOR ROOT REPAIR — proposed-stage comparison',font=font,fill='white')
d.text((22,65),'Same painted master; authored root patch 69x64 -> 12x12. Static19/19, exact-rest0.',font=small,fill='#c3d7df')
for y,title,f in [(110,'Before: root rectangle / flank crease retained',p.parent/'quadruped-repair-04/native-impala-04/turn3-hit-idle-90.png'),(550,'After: new candidate fit02, no visible rectangular flank defect',p/'native-impala-01/turn3-hit-idle-90.png')]:
 d.text((22,y),title,font=small,fill='white');im=Image.open(f).convert('RGB');im.thumbnail((750,390));sheet.paste(im,(22,y+35)); crop=Image.open(f).crop((540,290,805,455));crop=crop.resize((795,495));crop.thumbnail((750,390));sheet.paste(crop,(805,y+35))
d.text((22,1000),'0/0 refusals | p95 5.90 ms, max 14.30 ms at4x | full-stage/picker integration still pending',font=small,fill='#ffd995');sheet.save(p/'review-sheet.png')
