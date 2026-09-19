#!/usr/bin/env python3
"""Second production recipe: separate phases/roles, missing materials, and environmental components.
Does not replace any first-pass job, source or approved render. Fictional treatments stay labelled.
"""
import json,re
from acquire import BASE,sha_file,write_json
from produce import INVENTORY,validate_jobs

def build(acquisition,inventory):
    media=[m for m in acquisition['media'] if m.get('duration') and m.get('duration')>.02
           and 'preview' not in m.get('originalMember','').lower()]
    def pool(pattern,source=None):
        selected=[m for m in media if (source is None or m['sourceId'] in source)
                  and re.search(pattern,m.get('originalMember',m.get('title','')),re.I)]
        unique={m['sha256']:m for m in sorted(selected,key=lambda m:m['path'],reverse=True)}
        return sorted(unique.values(),key=lambda m:m['path'])
    def require(pattern,n=3,source=None):
        p=pool(pattern,source)
        if len(p)<n:raise ValueError(f'Need {n} distinct sources for {pattern}; found {len(p)}')
        return p
    jobs=[]
    def add(id,group,requirement,sources,duration=None,notes='',profile=None,midi=None,channels=1):
        length=duration or min(3,max(s['duration'] for s in sources)+.12)
        layers=[{'path':s['path'],'sha256':s['sha256'],'sourceId':s['sourceId'],'rate':1,
                 'gain':.35 if i==0 else .10,'delay':.035*i,'duration':s['duration']} for i,s in enumerate(sources)]
        jobs.append({'id':'v2.'+id,'group':group,'kind':'synthetic_fictional' if profile or midi else 'designed',
                     'duration':round(length,4),'channels':channels,'layers':layers,'synthNote':None,'midi':midi or [],
                     'requirements':[requirement],'notes':notes,'synthProfile':profile,
                     'listeningStatus':'not_reviewed','approved':False,'recipeVersion':2})
    # Every cast/impact has three independent primary source hashes. Phase layering differs.
    recipes={
      'fire':('spell_fire','impactPunch_medium'), 'frost':('impactGlass_light','impactGlass_medium'),
      'storm':('thunder|laserLarge','impactMetal_light'), 'tide':('splash_','bubble_'),
      'stone':('stones_','impactMining_'), 'venom':('slime_','bubble_'),
      'void':('forceField_','spaceEngineLow_'), 'sand':('stones_|Paper/(crumples|pageturn)','scrape'),
      'chem':('bubble_|slime_','metal_'), 'psionic':('impactGlass_light','computerNoise_'),
      'wild':('blade_|knifeSlice|cloth[1-4]','impactPunch_medium')}
    if set(recipes)!=set(inventory['abilityThemes']):raise ValueError('Theme registry changed')
    for ti,(theme,(pattern,accent)) in enumerate(recipes.items()):
        primary=require(pattern);detail=require(accent)
        for pi,phase in enumerate(('cast','impact','sustain','release','shield','heal','tick')):
            takes=3 if phase in ('cast','impact') else 1
            for vi in range(takes):
                p=primary[(vi+(3 if phase=='impact' and len(primary)>=6 else 0))%len(primary)]
                q=detail[(vi+pi)%len(detail)]
                duration={'cast':.65,'impact':1.2,'sustain':4,'release':.9,'shield':1.4,'heal':1.8,'tick':.45}[phase]
                notes=[]
                if theme!='wild':
                    motif={'cast':[(0,0)],'impact':[(0,-12)],'sustain':[(i*.6,(i%2)*2) for i in range(6)],
                           'release':[(0,-5)],'shield':[(0,0),(.3,7)],'heal':[(0,0),(.35,4),(.7,7)],'tick':[(0,12)]}[phase]
                    notes=[{'track':'accent-'+theme,'start':at,'duration':min(duration-at,.55),'note':max(24,min(96,45+ti*2+interval)),
                            'gain':.5} for at,interval in motif]
                add(f'ability.{theme}.{phase}.{vi+1}','coverage-'+theme,f'ability.{theme}.{phase}',[p,q],duration,
                    'Version 2 phase-specific design. Independent primary takes for cast/impact; shield, healing and tick roles have separate timing. Not accepted.',theme,notes)
    surfaces={'soil':'footstep_grass','grass':'footstep_grass','leaves':'Paper/(crumples|pageturn)','wood':'impactWood_light',
              'rock':'stones_','sand':'scrape','mud':'slime_','snow':'footstep_snow','ice':'impactGlass_light','water':'splash_'}
    for surface,pattern in surfaces.items():
        for i,m in enumerate(require(pattern)[:3]):add(f'surface.{surface}.{i+1}','coverage-contact','movement.surface.'+surface,[m],
            notes='Designed surface ingredient; leaves/paper, mud/slime, ice/glass and soil/grass are declared material approximations.')
    for contact,pattern in {'body':'scrape','root':'wood_','hoof':'impactWood_light'}.items():
        for i,m in enumerate(require(pattern)[:3]):add(f'contact.{contact}.{i+1}','coverage-contact','movement.contact.'+contact,[m],
            notes='Designed contact layer, not an identified animal footstep recording.')
    materials={'foliage':'Paper/(crumples|pageturn)','wood':'wood_','fungal':'slime_','microbial':'bubble_',
               'scaled':'scrape','feathered':'cloth[1-4]','furred':'blanket-movement','warty':'slime_',
               'slick and wet':'splash_','chitinous':'impactWood_light','plated':'impactMetal_light',
               'translucent':'slime_','crystalline':'impactGlass_light'}
    for material,pattern in materials.items():
        for i,m in enumerate(require(pattern)[:3]):add(f'material.{material.replace(" ","-")}.{i+1}','coverage-contact','material.'+material,[m],
            notes='Designed body-material texture; not a natural voice or proof of the source material.')
    # Distinct physical/contextual layers. No recognizable wildlife in generic alien beds.
    environments={'coast':('^Ocean$',{'nps_natural_sounds'}),'underwater':('loop_bubbles',{'oga_water'}),
      'cold':('footstep_snow',{'kenney_impacts'}),'dry':('scrape',{'oga_foley'}),'rock':('^Rockfall$',{'nps_natural_sounds'}),
      'thermal':('Fumaroles|Steam Vent',{'nps_yellowstone'}),'foliage':('blanket-movement',{'oga_foley'}),
      'rain':('loop_rain',{'oga_water'}),'snow':('footstep_snow',{'kenney_impacts'}),
      'dust':('Paper/(crumples|pageturn)',{'oga_foley'}),'wind':('breath',{'oga_creatures_1','oga_creatures_2'}),
      'thunder':('^Thunder$',{'nps_yellowstone','nps_natural_sounds'})}
    for name,(pattern,sources) in environments.items():
        p=require(pattern,1,sources);m=p[0]
        add('environment.'+name,'coverage-environment','environment.'+name,[m],min(16,m['duration']),channels=2,
            notes='Environmental component. Cold/snow contact, dry abrasion, foliage cloth, wind performed air and dust paper are explicit designed approximations; require listening before looping or promotion.')
    roles={'alert':'error_','ready':'select_','miss':'knifeSlice','deny':'error_',
           'impact':'impactPunch_medium','critical':'impactPunch_heavy','strike':'blade_',
           'heavy-impact':'impactMining','recoil':'impactSoft_medium','heal':'confirmation_',
           'status':'computerNoise','tick':'tick_','defeat':'error_','resolve':'confirmation_','victory':'jingles.*'}
    for role,pattern in roles.items():
        p=require(pattern,1)
        for i,m in enumerate(p[:3]):add(f'battle.{role}.{i+1}','coverage-events','battle-role.'+role,[m],notes='Role-specific settled battle cue candidate.')
    for event,pattern in {'scan':'computerNoise','discovery':'confirmation_','rarity':'jingles.*','inventory':'open_',
          'harvest':'chop|wood_','travel':'spaceEngineSmall','save':'confirmation_','notification':'select_','reward':'item_coins'}.items():
        for i,m in enumerate(require(pattern,1)[:3]):add(f'ui.{event}.{i+1}','coverage-events','ui.'+event,[m],notes='Contextual UI candidate; not a new gameplay event.')
    for family,pattern in {'plant-woody':'wood_','plant-herb':'Paper/(crumples|pageturn)','fungal':'slime_','microbe':'bubble_'}.items():
        p=require(pattern)
        for ci,cue in enumerate(inventory['voiceCues']):
            for i,m in enumerate(p[:3]):
                notes=[{'track':'life-'+family,'start':0,'duration':.35,'note':48+ci%5*3+i,'gain':.3}]
                add(f'{family}.{cue}.{i+1}','coverage-life',f'family.{family}.{cue}',[m],.65,
                    'Fictional botanical/colony sonification. Not a naturally audible vocalization or authentic species coverage.',midi=notes)
    validate_jobs(jobs,acquisition)
    return jobs

if __name__=='__main__':
    path=BASE/'recipes/production-v2.json'
    if path.exists():raise ValueError('Existing version 2 recipe preserved')
    acquisition=json.loads((BASE/'manifests/acquisition.json').read_text());inventory=json.loads(INVENTORY.read_text())
    jobs=build(acquisition,inventory)
    write_json(path,{'schema':'cf.audio-production-jobs/v1','version':2,'inventorySha256':sha_file(INVENTORY),
      'acquisitionSha256':sha_file(BASE/'manifests/acquisition.json'),'jobs':jobs,'requiresListening':True})
    print(json.dumps({'jobs':len(jobs),'groups':sorted({j['group'] for j in jobs})}))
