from pathlib import Path
import subprocess,shutil,json,hashlib
root=Path(__file__).resolve().parents[2];audit=Path(__file__).resolve().parent;out=audit/'samples'
assert not out.exists();out.mkdir()
private=Path('/private/tmp/cf-creature-charm-20260908');first=private/'first'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
commands=[]
def run(c):
 commands.append(c);subprocess.run(c,check=True)
magick=shutil.which('magick');ffmpeg=shutil.which('ffmpeg');assert magick and ffmpeg
for treatment in ['natural','storybook']:
 for frame in [1,13,21,41,53]:
  src=first/treatment/f'pose-{frame:03d}.png';dest=out/f'{treatment}-{frame:03d}-640.webp'
  run([magick,str(src),'-quality','94',str(dest)])
 for size in [132,300,440]:
  run([magick,str(first/treatment/'pose-001.png'),'-filter','Lanczos','-resize',f'{size}x{size}','-quality','94',str(out/f'{treatment}-001-{size}.webp')])
old=root/'audits/CREATURE_BLENDER_CANID_20260908/comparison/v2-001-440.png'
for size in [132,300,440]:
 run([magick,str(old),'-filter','Lanczos','-resize',f'{size}x{size}','-quality','94',str(out/f'previous-{size}.webp')])
rows=[]
for label,path in [('Previous construction study',out/'previous-440.webp'),('Fine coat study',out/'natural-001-440.webp'),('Broad coat study',out/'storybook-001-440.webp')]:
 tile=out/(path.stem+'-tile.png');rows.append(tile)
 run([magick,str(path),'-background','#142035','-alpha','remove','-alpha','off','-gravity','south','-splice','0x48','-font','Helvetica','-pointsize','19','-fill','#dfeafa','-annotate','+0+14',label,str(tile)])
run([magick,*map(str,rows),'+append',str(out/'comparison.png')])
for tile in rows:tile.unlink()
video=out/'wolf-articulated-study.mp4'
run([ffmpeg,'-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=0x142035:s=512x512:r=12:d=2.75','-framerate','12','-i',str(private/'motion-check/frames/%03d.png'),'-filter_complex','[0:v][1:v]overlay=shortest=1:format=auto,format=yuv420p[v]','-map','[v]','-frames:v','33','-an','-c:v','libx264','-crf','18','-movflags','+faststart',str(video)])
probe=subprocess.check_output([shutil.which('ffprobe'),'-v','error','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate:format=duration','-of','json',str(video)],text=True)
meta=json.loads(probe);assert meta['streams'][0]['width']==512 and int(meta['streams'][0]['nb_frames'])==33
for src,dst in [(first/'study.json',audit/'render-study.json'),(private/'motion-check/motion.json',audit/'saved-motion.json')]:
 assert not dst.exists();shutil.copy2(src,dst)
record={'schema':'cf-charm-sample-package/v1','status':'PASS','commands':commands,'video':meta,'originalRenderStudySha256':sha(first/'study.json'),'files':[{'path':str(p.relative_to(audit)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.iterdir()) if p.is_file()]}
(audit/'sample-package.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'status':'PASS','files':len(record['files']),'video':meta}))
