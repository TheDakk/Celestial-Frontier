#!/usr/bin/env python3
"""Render actual saved instrument tracks, not splits of a stereo mix. Requires job lock."""
import json,re,subprocess,argparse
from pathlib import Path
from acquire import BASE,sha_file,write_json
from produce import APP,run

parser=argparse.ArgumentParser();parser.add_argument('--group',default='music-original');args=parser.parse_args()
if args.group not in ('music-original','coverage-score'):raise ValueError('Unknown score group')
voices=('bass','harmony','melody') if args.group=='music-original' else ('score-bass','score-harmony','score-melody','score-rhythm')
original=BASE/'reaper'/args.group/'production.rpp';source=original.read_bytes();text=source.decode()
out=BASE/'reaper'/('music-stems' if args.group=='music-original' else 'coverage-score-stems')
if out.exists():raise ValueError('Existing stem projects refused')
out.mkdir();regions=json.loads((original.parent/'regions.json').read_text());report=[]
parts=re.split(r'(?=^  <TRACK )',text,flags=re.M)
if len(parts)!=len(voices)+1:raise ValueError('Unexpected saved instrument track inventory')
for voice in voices:
    altered=[parts[0]]
    for block in parts[1:]:
        names=re.findall(r'^    NAME "Surge ([a-z-]+)"',block,re.M)
        if len(names)!=1 or block.count('    MUTESOLO 0 0 0')!=1:raise ValueError('Ambiguous saved track or mute state')
        altered.append(block if names[0]==voice else block.replace('    MUTESOLO 0 0 0','    MUTESOLO 1 0 0',1))
    output=out/(voice+'.wav');old='RENDER_FILE "'+str(original.parent/'timeline.wav')+'"';current=''.join(altered)
    if current.count(old)!=1:raise ValueError('Ambiguous render path')
    project=out/(voice+'.rpp');project.write_bytes(current.replace(old,'RENDER_FILE "'+str(output)+'"',1).encode())
    r=subprocess.run([APP,'-newinst','-nosplash','-renderproject',str(project)],capture_output=True,text=True,timeout=180)
    (out/(voice+'.log')).write_text(r.stdout+r.stderr)
    if r.returncode or not output.exists():raise ValueError('Stem render failed; no retry')
    entries=[]
    for region in regions:
        p=out/(region['id']+'.'+voice+'.wav')
        run(['ffmpeg','-nostdin','-v','error','-n','-i',str(output),'-ss',str(region['start']),'-t',str(region['duration']),'-af','volume=0.8','-c:a','pcm_s24le',str(p)])
        info=json.loads(run(['ffprobe','-v','error','-show_streams','-of','json',str(p)]).stdout)['streams'][0]
        if info['codec_name']!='pcm_s24le' or info['sample_rate']!='48000' or info['channels']!=2:raise ValueError('Stem format')
        entries.append({'id':region['id'],'part':voice,'path':str(p.relative_to(BASE)),'sha256':sha_file(p),'frames':info['duration_ts'],'sampleRate':48000,'channels':2})
    report.append({'part':voice,'projectSha256':sha_file(project),'timelineSha256':sha_file(output),'muteScope':'other instrument tracks only','entries':entries})
if original.read_bytes()!=source:raise ValueError('Original project changed')
for region in regions:
    frames={e['frames'] for r in report for e in r['entries'] if e['id']==region['id']}
    if len(frames)!=1:raise ValueError('Stem lengths differ')
write_json(BASE/'reports'/('music-stems.json' if args.group=='music-original' else 'coverage-score-stems.json'),{'schema':'cf.audio-music-stems/v1','sourceProjectSha256':sha_file(original),'sourceUnchanged':True,
    'tracks':report,'stems':len(voices)*len(regions),'sameStartAndFrameLengths':True,'listeningAccepted':False,'loopReview':'pending'})
print(str(len(voices)*len(regions))+' real instrument stems rendered; original project unchanged')
