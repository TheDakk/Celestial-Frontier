#!/usr/bin/env python3
"""Prepare portable REAPER jobs, render installed host, validate review WAV/Opus.
Candidates only. No approved game asset is overwritten or automatically promoted.
Run render through tools/with-toolchain-lock.mjs (see LOCAL_RUN.md).
"""
import argparse, collections, hashlib, json, math, re, shutil, subprocess, sys
from pathlib import Path
from acquire import ROOT, BASE, sha_file, write_json

APP='/Applications/REAPER.app/Contents/MacOS/REAPER'
INVENTORY=ROOT/'audits/AUDIO_PRODUCTION_20260915/game-inventory-v2.json'
def slug(s): return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
def run(args,timeout=180):
    r=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
    if r.returncode: raise RuntimeError(str(args[:3])+': '+r.stderr[-1500:])
    return r
def prepare():
    acq=json.loads((BASE/'manifests/acquisition.json').read_text()); inv=json.loads(INVENTORY.read_text())
    media=[m for m in acq['media'] if m.get('duration') and 'preview' not in m.get('originalMember','').lower() and m.get('title') not in ('Snowmobile','Horse-Drawn Wagon')]
    jobs=[]; gaps=[]
    def choose(pattern,sources=None):
        return sorted([m for m in media if (not sources or m['sourceId'] in sources) and re.search(pattern,m.get('originalMember',m.get('title','')),re.I)],key=lambda m:(m['sourceId'],m['path']))
    def add(id,group,sources,kind='designed',duration=None,rate=1,synth=None,requirements=None,notes='',channels=1):
        if not sources: gaps.append({'id':id,'reason':'No matching approved source; no substitute claimed'}); return
        primary=sources[0]; length=min(duration or (primary['duration']/rate+.08),24)
        jobs.append({'id':id,'group':group,'kind':kind,'duration':round(length,4),'channels':channels,
          'layers':[{'path':s['path'],'sha256':s['sha256'],'sourceId':s['sourceId'],'rate':rate if i==0 else 1,
                     'gain':.70 if i==0 else .12,'delay':0 if i==0 else .035,'duration':s['duration']} for i,s in enumerate(sources)],
          'synthNote':synth,'requirements':requirements or [id],'notes':notes,'listeningStatus':'not_reviewed','approved':False})
    # Exact item title matches are candidates, not automatic species identification or behavior claims.
    for m in media:
        if not m['sourceId'].startswith('nps_'): continue
        id='recording.'+slug(m.get('title','unknown'))+'.'+m['sha256'][:8]
        add(id,'authentic-recordings',[m],'recording',duration=min(m['duration'],20),channels=min(m['channels'],2),
            notes='Unedited opening excerpt for review. Species/context remain those of the source item; no inferred battle behavior.')
    voices=choose(r'^(cute|grunt|bug|burble|barking|alien|roar|breath|attack|hurt|die|slime|weird)',{'oga_creatures_1','oga_creatures_2'})
    cloth=choose(r'cloth[1-4]',{'kenney_rpg'})
    family_patterns={'quadruped':'grunt|barking','hopper':'burble|cute','biped-bird':'cute|weird','fish':'burble|slime','insect':'bug',
       'arachnid':'bug|weird','serpent':'breath|weird','myriapod':'bug','radial':'alien|burble','cephalopod':'slime|burble','flyer-membrane':'roar|breath','primate':'grunt|cute'}
    for family in inv['recordedVoiceArchetypes']:
        for cue in inv['voiceCues']:
            pattern={'attack-vocal':'attack','hurt':'hurt','faint':'die','breath-idle':'breath'}.get(cue,family_patterns[family])
            pool=[m for m in voices if re.search(pattern,m['originalMember'])]
            if cue=='land-thud': pool=choose(r'impactSoft_medium|stomp_',{'kenney_impacts','oga_creatures_2'})
            for i,m in enumerate(pool[:3]):
                secondary=[v for v in voices if v['path']!=m['path'] and re.search(family_patterns[family],v['originalMember'])]
                layers=[m]+secondary[:1]+(cloth[:1] if family in ('quadruped','primate','flyer-membrane') else [])
                add(f'{family}.{cue}.{i+1}', 'fictional-voices',layers,'synthetic_fictional',
                    requirements=[f'family.{family}.{cue}'],notes='Performed/designed source, not authentic Earth wildlife. Primary and secondary ingredients; morphology treatment pending listening.')
    # Three identity examples share the same archetype; these are treatments, not three recordings of species.
    pool=[m for m in voices if re.search(r'^grunt',m['originalMember'])]
    for name,rate in [('civet-fictional',1.1),('fox-fictional',1.2),('procedural-quadruped',.85)]:
        add(name,'identity-comparison',pool[:1]+cloth[:1],'synthetic_fictional',rate=rate,
            notes='One quadruped archetype. Playback-rate treatment changes pitch and time together; not a formant transform or species recording.')
    for surface in ('grass','snow','wood','concrete','carpet'):
        for i,m in enumerate(choose('footstep_'+surface,{'kenney_impacts'})[:5]):
            add(f'movement.surface.{surface}.{i+1}','movement',[m],requirements=[f'movement.surface.{surface}'],notes='Contact ingredient, not anatomy-specific footsteps.')
    for material,pattern in {'furred':'cloth','scaled':'scrape','chitinous':'impactWood_light','slick and wet':'slime','plated':'impactMetal_light','warty':'slime','feathered':'cloth','translucent':'slime','crystalline':'impactGlass_light'}.items():
        pool=choose(pattern,{'kenney_impacts','kenney_rpg','oga_water','oga_creatures_2'})
        for i,m in enumerate(pool[:3]): add(f'material.{slug(material)}.{i+1}','movement',[m],requirements=['material.'+material],notes='Material design candidate; cloth is an approximation, not a feather or fur recording.')
    theme_patterns={'fire':'spell_fire','frost':'impactGlass_light','storm':'thunder|electric','tide':'splash','stone':'stones_','venom':'slime',
        'void':'forceField','sand':'sand|stones_','chem':'bubbl|slime','psionic':'glass_|computerNoise','wild':'blade_|knifeSlice|cloth'}
    for n,theme in enumerate(inv['abilityThemes']):
        pool=choose(theme_patterns[theme])
        for phase in ('cast','impact','sustain','release'):
            for i,m in enumerate(pool[:3]):
                dur=min(m['duration']+.1,4) if phase!='sustain' else min(m['duration'],8)
                add(f'ability.{theme}.{phase}.{i+1}','ability-'+theme,[m],'designed',duration=dur,
                  synth=None if theme=='wild' else 40+n*3+i+(12 if phase=='cast' else 0),
                  requirements=[f'ability.{theme}.{phase}'],notes='Theme candidate; sustain is a finite treatment, loop acceptance still pending.')
    for i,event in enumerate(inv['events']['combat']):
        pattern='error_' if event in ('defeat','guardian-defeat') else 'confirmation_' if event in ('guardian-victory','resolution','regen') else 'impactGeneric_light'
        for v,m in enumerate(choose(pattern,{'kenney_interface','kenney_impacts'})[:3]):
            add(f'battle.{event}.{v+1}','battle-ui',[m],requirements=['battle.'+event],notes='Mapped to actual combat event; audition only until accepted.')
    for event,pattern in {'select':'select_','confirm':'confirmation_','back':'back_','error':'error_','open':'open_','close':'close_','tick':'tick_'}.items():
        for i,m in enumerate(choose(pattern,{'kenney_interface'})[:3]): add(f'ui.{event}.{i+1}','battle-ui',[m],requirements=['ui.'+event])
    for m in media:
        if m['sourceId'].startswith('music_'):
            add(m['sourceId'],'music-candidates',[m],'licensed_stereo_mix',duration=24,channels=2,
                notes='24-second opening audition only. Full original retained; no stems inferred and no state assigned before listening.')
    # Separate contact/wing banks; different ingredients, never a renamed universal footstep.
    for contact,pattern in {'paw':'footstep_grass','hoof':'impactWood_medium','claw':'scrape','fin':'splash','tentacle':'slime',
        'wing-feather':'cloth[1-4]','wing-membrane':'blanket-movement','wing-insect':'bug_'}.items():
        pool=choose(pattern)
        for i,m in enumerate(pool[:3]): add(f'movement.contact.{contact}.{i+1}','movement',[m],requirements=['movement.contact.'+contact],
            notes='Contact/wing design ingredient; biological authenticity unverified. Feather cloth and membrane blanket are labelled approximations.')
    natural=[m for m in media if m['sourceId'].startswith('nps_')]
    for weather in inv['weather']:
        if weather=='airless': continue # Physical lack of atmospheric sound; separately declared, never a filled wildlife gap.
        pattern='Thunder|Rain' if any(w in weather for w in ('storm','squall','cyclone')) else 'Ocean' if weather in ('swell','calm','glow-calm') else 'Fumaroles|Vent' if any(w in weather for w in ('heat','ember','ash','haze','steam')) else 'Stream'
        pool=[m for m in natural if re.search(pattern,m['title'],re.I)]
        add('weather.'+weather,'ambience-weather',pool[:1],'environment_design',duration=16,channels=2,
            notes='Finite design candidate, not a verified recording of alien weather. Atmospheric/card filtering and loop listening pending.')
    for biome,profile in inv['biomes'].items():
        if profile['weather']=='airless': continue
        pattern='Ocean' if any(w in biome for w in ('sea','coral','archipelago','ice')) else 'Fumaroles|Vent' if profile['hazard'] in ('heat','magma','ember','ashfall','acid') else 'Stream'
        pool=[m for m in natural if re.search(pattern,m['title'],re.I)]
        add('biome.'+biome,'ambience-weather',pool[:1],'environment_design',duration=16,channels=2,
            notes='Base environmental ingredient only. Local fauna, density and transitions are still unreviewed; not completed biome soundscape.')
    # Original three-part MIDI sketches. Independent tracks are actual stems, not splits of a stereo mix.
    for index,state in enumerate(('menu','calm','wonder','tension','battle','major-battle','victory-discovery')):
        notes=[]; beat=.5 if state in ('battle','major-battle') else .75; length=beat*32
        roots=[40,36,43,38] if state not in ('victory-discovery','wonder') else [43,48,45,50]
        for bar in range(8):
            root=roots[bar%4]; at=bar*4*beat
            notes.append({'track':'bass','start':at,'duration':beat*3.5,'note':root,'gain':.7})
            for interval in (12,15,19): notes.append({'track':'harmony','start':at,'duration':beat*3.5,'note':root+interval,'gain':.45})
            for tick,interval in enumerate((24,27,31,26)):
                notes.append({'track':'melody','start':at+tick*beat,'duration':beat*.6,'note':root+interval,'gain':.55})
        jobs.append({'id':'music.original.'+state,'group':'music-original','kind':'synthetic_fictional','duration':length,'channels':2,
            'layers':[],'synthNote':None,'midi':notes,'requirements':['music.'+state],
            'notes':'Original MIDI composition sketch with saved Surge state. Three editable instrument parts; mixing and loop/listening review pending.',
            'listeningStatus':'not_reviewed','approved':False})
    # Save declared requirements even where no source exists; no family stand-in becomes Earth coverage.
    requirements=[]
    for e in inv['earth']:
        matches=[m for m in media if m['sourceId'].startswith('nps_') and m.get('title','').casefold()==e['name'].casefold()]
        requirements.append({'id':'earth.'+e['kingdom']+'.'+slug(e['name']),'name':e['name'],'kingdom':e['kingdom'],
          'classification':'missing','candidateSourceHashes':[m['sha256'] for m in matches],
          'acquisitionStatus':'candidate_requires_species_context_review' if matches else 'missing',
          'renderStatus':'not_assigned','integrationStatus':'not_assigned','listeningStatus':'not_reviewed',
          'note':'Authenticity and context require review; no generic voice counts as species coverage.'})
    vocabulary={**{'family':inv['recordedVoiceArchetypes'],'material':inv['traits']['FA_SKIN'],'locomotion':inv['traits']['FA_LOCO']+inv['traits']['EX_LOCO'],
        'biome':list(inv['biomes']),'weather':inv['weather'],'music':['menu','calm','wonder','tension','battle','major-battle','victory-discovery']}}
    for kind,values in vocabulary.items():
        for value in values: requirements.append({'id':kind+'.'+value,'name':value,'category':kind,'acquisitionStatus':'recipe_or_gap','renderStatus':'pending','integrationStatus':'not_promoted','listeningStatus':'not_reviewed'})
    for theme in inv['abilityThemes']:
        for phase in ('cast','impact','sustain','release'): requirements.append({'id':f'ability.{theme}.{phase}','category':'ability','listeningStatus':'not_reviewed'})
    for kind,events in inv['events'].items():
        for event in events: requirements.append({'id':('battle.' if kind=='combat' else 'creature-event.')+event,'category':kind,'listeningStatus':'not_reviewed'})
    data={'schema':'cf.audio-production-jobs/v1','inventorySha256':sha_file(INVENTORY),'acquisitionSha256':sha_file(BASE/'manifests/acquisition.json'),
          'jobs':jobs,'gaps':gaps,'requiresListening':True}
    write_json(BASE/'recipes/production-v1.json',data)
    write_json(BASE/'manifests/audio-coverage.json',{'schema':'cf.audio-coverage/v1','requirements':requirements,'jobs':len(jobs),'complete':False})
    print(json.dumps({'jobs':len(jobs),'groups':sorted(set(j['group'] for j in jobs)),'requirements':len(requirements),'sourceGaps':len(gaps)}))

def validate_jobs(jobs, acquisition, require_headroom=True):
    approved={(m['path'],m['sha256'],m['sourceId']) for m in acquisition['media'] if m.get('intakeStatus')!='quarantined_decode_failure'}
    ids=set()
    for job in jobs:
        if not re.fullmatch('[a-z0-9._-]{1,180}',job['id']) or job['id'] in ids: raise ValueError('Invalid/duplicate job ID')
        ids.add(job['id'])
        if not re.fullmatch('[a-z0-9-]+',job['group']): raise ValueError('Invalid job group')
        if not isinstance(job['duration'],(int,float)) or not math.isfinite(job['duration']) or not 0<job['duration']<=24: raise ValueError('Job duration')
        if job.get('channels') not in (1,2): raise ValueError('Job channel count')
        if not isinstance(job['layers'],list) or len(job['layers'])>4: raise ValueError('Layer budget')
        if require_headroom and job.get('recipeVersion')==4 and job.get('kind')=='recording':
            proof=job.get('inputHeadroom')
            if not proof or len(job['layers'])!=1:raise ValueError('Recording needs measured input headroom before fixed-point render')
            layer=job['layers'][0]
            if proof['sourceSha256']!=layer['sha256'] or proof['gain']!=layer['gain'] or proof['duration']!=job['duration']:
                raise ValueError('Input headroom is not bound to this source/gain/excerpt')
            if not math.isfinite(proof['sourceDbTP']) or not 0<layer['gain']<=proof['priorGain']<=1:
                raise ValueError('Invalid input headroom measurement')
            if proof['sourceDbTP']+20*math.log10(layer['gain'])> -9+.0001:raise ValueError('Input headroom ceiling')
        midi=job.get('midi',[])
        if not isinstance(midi,list) or len(midi)>512: raise ValueError('MIDI budget')
        for note in midi:
            if not re.fullmatch('[a-z-]{1,64}',note['track']): raise ValueError('MIDI track')
            if not isinstance(note['note'],int) or not 24<=note['note']<=100: raise ValueError('MIDI pitch')
            for key,low,high in [('start',0,job['duration']),('duration',.02,24),('gain',0,1)]:
                if not isinstance(note[key],(int,float)) or not math.isfinite(note[key]) or not low<=note[key]<=high: raise ValueError('MIDI '+key)
            if note['start']+note['duration']>job['duration']+.0001: raise ValueError('MIDI outside region')
        for layer in job['layers']:
            p=Path(layer['path'])
            if not p.parts or p.is_absolute() or '..' in p.parts or '\\' in layer['path'] or p.parts[0] not in ('source-audio','source-archives'): raise ValueError('Source path escapes acquisition')
            if (layer['path'],layer['sha256'],layer['sourceId']) not in approved: raise ValueError('Source is not in the approved acquisition ledger')
            if not re.fullmatch('[a-f0-9]{64}',layer['sha256']): raise ValueError('Source hash')
            for key,low,high in [('rate',.5,2),('gain',0,1),('delay',0,job['duration'])]:
                if not math.isfinite(layer[key]) or not low<=layer[key]<=high: raise ValueError('Invalid layer '+key)

def render(group,recipe='production-v1.json'):
    import os
    if not re.fullmatch(r'production-v[0-9]+\.json',recipe): raise ValueError('Recipe filename')
    jobs=[j for j in json.loads((BASE/'recipes'/recipe).read_text())['jobs'] if j['group']==group]
    if not jobs: raise ValueError('Unknown group')
    validate_jobs(jobs,json.loads((BASE/'manifests/acquisition.json').read_text()))
    out=BASE/'reaper'/group
    if out.exists(): raise ValueError('Existing production directory refused; preserve previous evidence')
    out.mkdir(parents=True); (out/'media').mkdir(); rows=[]; cursor=0; regions=[]; prepared_media=[]
    for j in jobs:
        regions.append({**j,'start':cursor})
        for layer in j['layers']:
            source=BASE/layer['path']
            if not source.resolve().is_relative_to(BASE.resolve()): raise ValueError('Source symlink escapes acquisition')
            if sha_file(source)!=layer['sha256']: raise ValueError('Source hash changed')
            if j.get('recipeVersion')==4 and j.get('kind')=='recording':
                # Containers may disagree with their URL suffix. Decode a bounded editable
                # excerpt to float (not fixed-point) before REAPER; preserve original bytes.
                excerpt=min(layer['duration'],(j['duration']-layer['delay'])*layer['rate'])
                name=layer['sha256']+'-'+str(round(excerpt,6))+'s.f32.wav';dest=out/'media'/name
                if not dest.exists():
                    run(['ffmpeg','-nostdin','-v','error','-xerror','-n','-i',str(source),'-t',str(excerpt),
                         '-ar','48000','-c:a','pcm_f32le',str(dest)])
                    info=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(dest)]).stdout)
                    if info['streams'][0]['codec_name']!='pcm_f32le':raise ValueError('Prepared recording is not float PCM')
                    prepared_media.append({'sourcePath':layer['path'],'sourceSha256':layer['sha256'],'path':'media/'+name,
                        'sha256':sha_file(dest),'codec':'pcm_f32le','sampleRate':48000,'duration':excerpt,'start':0,
                        'purpose':'Decoder-compatible bounded copy. Original source preserved; input headroom applied by REAPER.'})
            else:
                name=layer['sha256']+source.suffix; dest=out/'media'/name
                if not dest.exists(): shutil.copyfile(source,dest)
            rows.append(['audio',j['id'],'media/'+name,cursor+layer['delay'],min(j['duration']-layer['delay'],layer['duration']/layer['rate']),layer['rate'],layer['gain'],0,'mono' if j['channels']==1 else 'stereo'])
        if j['synthNote'] is not None: rows.append(['synth',j['id'],'accent',cursor,j['duration'],1,1,j['synthNote'],'mono'])
        for note in j.get('midi',[]): rows.append(['synth',j['id'],note['track'],cursor+note['start'],note['duration'],1,note['gain'],note['note'],'stereo'])
        rows.append(['region',j['id'],'-',cursor,j['duration'],1,1,0,'mono' if j['channels']==1 else 'stereo'])
        cursor+=j['duration']+1
    (out/'jobs.tsv').write_text('\n'.join('\t'.join(str(v) for v in row) for row in rows)+'\n')
    write_json(out/'regions.json',regions)
    write_json(out/'prepared-media.json',{'schema':'cf.audio-prepared-media/v1','files':prepared_media})
    script=Path(__file__).with_name('produce.lua'); env={**os.environ,'CF_AUDIO_JOB_OUT':str(out)}
    stages=[]
    for name,args in [('prepare',['-newinst','-new','-nosplash',str(script)]),('render',['-newinst','-nosplash','-renderproject',str(out/'production.rpp')])]:
        r=subprocess.run([APP]+args,capture_output=True,text=True,env=env,timeout=180)
        (out/(name+'.log')).write_text(r.stdout+r.stderr); stages.append({'stage':name,'exit':r.returncode})
        if r.returncode or (out/'failure.txt').exists(): raise RuntimeError('REAPER '+name+' failed; no automatic retry')
    if not (out/'timeline.wav').exists(): raise ValueError('REAPER did not render')
    rpp=(out/'production.rpp').read_text()
    media_paths=re.findall(r'^\s*FILE "([^"]+)"',rpp,re.M)
    if any(Path(p).is_absolute() for p in media_paths): raise ValueError('Project media is not portable')
    write_json(out/'render-receipt.json',{'stages':stages,'projectSha256':sha_file(out/'production.rpp'),'timelineSha256':sha_file(out/'timeline.wav'),
        'luaSha256':sha_file(script),'regions':len(regions),'portableMedia':media_paths,'listeningAccepted':False})
    export_group(out,regions)

def export_group(out,regions):
    results=[]; masters=BASE/'masters'/out.name; masters.mkdir(parents=True,exist_ok=True)
    audition=BASE/'audition'; audition.mkdir(exist_ok=True)
    for j in regions:
        master=masters/(j['id']+'.wav'); opus=masters/(j['id']+'.opus'); preview=audition/(j['id']+'.wav')
        # A common conservative attenuation; no destructive normalization of originals.
        prefix=['ffmpeg','-nostdin','-v','error','-n','-i',str(out/'timeline.wav'),'-ss',str(j['start']),'-t',str(j['duration']),'-ar','48000','-ac',str(j['channels'])]
        run(prefix+['-af','volume=0.8','-c:a','pcm_s24le',str(master)])
        run(['ffmpeg','-nostdin','-v','error','-n','-i',str(master),'-c:a','libopus','-b:a','96k' if j['channels']==1 else '160k',str(opus)])
        run(['ffmpeg','-nostdin','-v','error','-n','-i',str(master),'-c:a','pcm_s16le',str(preview)])
        def measure(p):
            r=run(['ffmpeg','-nostdin','-hide_banner','-i',str(p),'-af','ebur128=peak=true','-f','null','-'])
            matches=re.findall(r'Peak:\s*([-\w.]+) dBFS',r.stderr)
            if not matches: raise ValueError('Missing true peak')
            peak=float(matches[-1]);
            if not math.isfinite(peak) or peak> -1: raise ValueError(f'Silent or over-ceiling output: {p}, {peak}')
            return peak
        peaks={'masterDbTP':measure(master),'opusDbTP':measure(opus)}
        fact=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(master)]).stdout)
        s=fact['streams'][0]
        if s['codec_name']!='pcm_s24le' or int(s['sample_rate'])!=48000 or s['channels']!=j['channels']: raise ValueError('Output format mismatch')
        results.append({**j,'master':str(master.relative_to(BASE)),'masterSha256':sha_file(master),'opus':str(opus.relative_to(BASE)),
            'opusSha256':sha_file(opus),'previewSha256':sha_file(preview),'previewBytes':preview.stat().st_size,
            'previewUrl':'/__cf-audio-review/'+preview.name,'renderStatus':'validated','integrationStatus':'developer_audition',**peaks})
    write_json(BASE/'reports'/(out.name+'.json'),{'schema':'cf.audio-render/v1','outputs':results,'listeningAccepted':False})
    catalog=[]
    for p in sorted((BASE/'reports').glob('*.json')):
        report=json.loads(p.read_text())
        if report.get('schema')=='cf.audio-render/v1': catalog+=report['outputs']
    write_json(BASE/'audition/catalog.json',{'schema':'cf.audio-audition/v1','outputs':catalog})
    print(json.dumps({'group':out.name,'validatedRenders':len(results)}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['prepare','render','export']);p.add_argument('--group');p.add_argument('--recipe',default='production-v1.json');a=p.parse_args()
    if a.command=='prepare':prepare()
    elif a.command=='render':render(a.group,a.recipe)
    else:
        out=BASE/'reaper'/a.group;export_group(out,json.loads((out/'regions.json').read_text()))
