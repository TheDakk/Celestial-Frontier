#!/usr/bin/env python3
"""Species-reference excerpts and explicit biome ingredients; no invented behavior labels."""
import json,re
from acquire import BASE,sha_file,write_json
from produce import INVENTORY,slug,validate_jobs

def build(acquisition,inventory,bindings):
 media=[m for m in acquisition['media'] if m.get('intakeStatus')!='quarantined_decode_failure'];by_hash={m['sha256']:m for m in media};jobs=[];matches={r['name']:[] for r in inventory['earth'] if r['kingdom']=='fauna'}
 inat=next((r for r in acquisition['sources'] if r['id']=='inat_cc0'),{'bindings':[]})
 by_sound={m.get('soundId'):m for m in media if m['sourceId']=='inat_cc0'}
 for b in inat['bindings']:
  for sound_id in b['acquired']:
   if sound_id in by_sound:matches[b['gameName']].append(by_sound[sound_id]['sha256'])
 aliases={'Bird - American Coots':'Coot','Bird - American Robin':'Robin','Bird - Bald Eagle':'Eagle',
  'Bird - Black-Billed Magpie':'Magpie','Bird - Canada Goose':'Goose','Bird - Common Raven':'Raven',
  'Bird - Great Horned Owl':'Owl','Bird - Osprey':'Osprey','Bird - Sandhill Crane':'Crane',
  'Bear - Grizzly':'Grizzly Bear','Grizzly Bear':'Grizzly Bear','Coyotes':'Coyote','Wolves':'Wolf',
  'Killer Whale':'Orca','Chickens':'Chicken','Crickets':'Cricket','Green Tree Frog':'Tree Frog',
  'American Robin':'Robin','Common Raven':'Raven','Canada Geese':'Goose','Bald Eagle':'Eagle',
  'American Crow':'Crow','Mallard':'Duck','Wild Turkey':'Turkey','Belted Kingfisher':'Kingfisher',
  'Barn Swallow':'Swallow','Hairy Woodpecker':'Woodpecker','House Wren':None,'European Starling':'Starling',
  'North Atlantic Right Whale 1':'Right Whale','Pilot Whale':'Pilot Whale','Sperm Whale':'Sperm Whale',
  'Atlantic Cod':'Cod','Haddock':'Haddock','Red Grouper':'Grouper','Snapping shrimp':'Shrimp',
  'Bottlenose Dolphin':'Dolphin','Cuvier’s Beaked Whale':'Beaked Whale'}
 for m in media:
  if not (m['sourceId'].startswith('nps_') or m['sourceId']=='noaa_passive_acoustics'):continue
  title=m.get('title','');name=title if title in matches else aliases.get(title)
  # Source-modified playback is educational reference, not native-rate authenticity.
  if name in matches and m.get('sourcePlaybackSpeed',1)==1:matches[name].append(m['sha256'])
 selected={h for hashes in matches.values() for h in hashes}
 # One preview per unique source, bounded to the opening 12 seconds; no vocal event is inferred.
 for i,h in enumerate(sorted(selected)):
  m=by_hash[h]
  if not m.get('duration') or m['duration']<=.02:continue
  names=sorted(n for n,hashes in matches.items() if h in hashes)
  jobs.append({'id':'v4.reference.'+slug(m.get('title','wildlife'))[:70]+'.'+h[:12],
   'group':'ecology-fauna-'+str(i//60+1).zfill(2),'kind':'recording','duration':round(min(m['duration'],12),4),
   'channels':min(m['channels'],2),'layers':[{'path':m['path'],'sha256':h,'sourceId':m['sourceId'],
    'rate':1,'gain':.65,'delay':0,'duration':m['duration']}],'synthNote':None,
   'requirements':['earth.fauna.'+slug(n)+'.recording' for n in names],
   'notes':'Identified recording reference: '+', '.join(names)+'. Actual source: '+m.get('recordingTitle',m.get('title',''))+
    '. Opening excerpt at supplied speed; creator '+m['creator']+'. Not a verified call/attack/hurt/faint cue. Narrower source taxa and field companions remain disclosed.',
   'recipeVersion':4,'listeningStatus':'not_reviewed','approved':False})
 def find(pattern,sid=None):
  pool=[m for m in media if (sid is None or m['sourceId'] in sid) and m.get('duration',0)>.1 and
        re.search(pattern,(m.get('recordingTitle','')+' '+m.get('title','')+' '+m.get('originalMember','')).strip(),re.I)]
  if not pool:raise ValueError('Missing ecological ingredient '+pattern)
  return sorted(pool,key=lambda m:m['path'])[0]
 wind=find('^Wind Soundscape from Gem Lake',{'nps_rocky_mountain'})
 rain=find('^Rain(?: |$)',{'nps_natural_sounds'});water=find('^Stream(?: |$)',{'nps_natural_sounds'})
 coast=find('^Ocean(?: |$)',{'nps_natural_sounds'});thermal=find('Fumaroles|Steam Vent',{'nps_yellowstone'})
 rock=find('^Rockfall(?: |$)',{'nps_natural_sounds'});ice=find('Yellowstone Lake',{'nps_yellowstone'})
 cloth=find('blanket-movement',{'oga_foley'});paper=find('Paper/(crumples|pageturn)',{'oga_foley'})
 glass=find('impactGlass_light',{'kenney_impacts'});bubbles=find('loop_bubbles',{'oga_water'})
 crunch=find('footstep_grass',{'kenney_impacts'});snow=find('footstep_snow',{'kenney_impacts'})
 # Each recipe is described by its actual ingredients, never labelled a field recording of an alien biome.
 definitions={
  'wind':[wind],'foliage':[wind,cloth],'grass':[wind,crunch],'canopy':[wind,water,cloth],
  'wetland':[water,rain],'estuary':[coast,water],'tundra':[wind,snow],'cave':[water,rock],
  'salt':[wind,paper],'spore':[cloth,bubbles],'crystal':[wind,glass],'reef':[bubbles,water],
  'bioluminescent':[bubbles,glass],'glacier':[wind,ice],'packice':[ice,coast],'ice-jet':[thermal,ice],
  'blueice':[ice],'dunes':[wind,paper],'canyon':[wind,rock],'glass':[wind,glass,paper],
  'fault':[rock],'carbon':[rock,paper],'sulfur':[thermal,wind],'acid':[thermal,bubbles],
  'pressure':[wind,thermal],'ash':[wind,paper],'embers':[thermal,paper],'magma':[thermal,bubbles,rock],
  'ice-cloud':[wind,ice],'underwater':[bubbles],'cold':[wind,ice],'dry':[wind,paper],
  'rain':[rain],'snow':[wind,snow],'dust':[wind,paper],'thermal':[thermal],'coast':[coast],'rock':[rock]}
 ingredients=[]
 for name,sources in definitions.items():
  # No wildlife field beds in an alien profile. Wind is a source-context candidate until ears confirm incidental content.
  notes='Designed environment component '+name+'. Ingredients: '+'; '.join(m.get('recordingTitle') or m.get('title') or m.get('originalMember') for m in sources)+'. '
  notes+='Natural wind/water/geology plus explicitly designed material accents; no claim of a complete real biome recording. Loop, incidental wildlife and seam listening pending.'
  job={'id':'v4.environment.'+name,'group':'ecology-environments','kind':'environment_design','duration':16,'channels':2,
    'layers':[{'path':m['path'],'sha256':m['sha256'],'sourceId':m['sourceId'],'rate':1,
      'gain':.35 if i==0 else .08,'delay':0 if i==0 else .6*i,'duration':m['duration']} for i,m in enumerate(sources)],
    'synthNote':None,'requirements':['environment.'+name],'notes':notes,'recipeVersion':4,'approved':False,'listeningStatus':'not_reviewed'}
  jobs.append(job);ingredients.append({'component':name,'sourceHashes':[m['sha256'] for m in sources],'notes':notes})
 validate_jobs(jobs,acquisition,require_headroom=False) # Measured headroom pass is required before rendering.
 rows=[]
 by_name={r['gameName']:r for r in bindings['bindings']}
 for name,hashes in matches.items():
  hashes=sorted(set(hashes));rows.append({'name':name,'sourceHashes':hashes,'binding':by_name.get(name),
    'referenceStatus':'identified_source_candidates' if hashes else 'missing',
    'referenceIds':[j['id'] for j in jobs if 'earth.fauna.'+slug(name)+'.recording' in j['requirements']],
    'behaviors':{cue:'not_established_by_recording_identity' for cue in inventory['voiceCues']},'accepted':False})
 return jobs,rows,ingredients
if __name__=='__main__':
 if (BASE/'recipes/production-v4.json').exists():raise ValueError('Existing ecology recipe refused; preserve the measured/rendered batch')
 acquisition=json.loads((BASE/'manifests/acquisition.json').read_text());inventory=json.loads(INVENTORY.read_text());bindings=json.loads((BASE/'manifests/fauna-source-bindings.json').read_text())
 jobs,rows,ingredients=build(acquisition,inventory,bindings)
 write_json(BASE/'recipes/production-v4.json',{'schema':'cf.audio-production-jobs/v1','version':4,'inventorySha256':sha_file(INVENTORY),
  'acquisitionSha256':sha_file(BASE/'manifests/acquisition.json'),'jobs':jobs,'requiresListening':True})
 write_json(BASE/'manifests/ecology-coverage.json',{'schema':'cf.audio-ecology-coverage/v1','fauna':rows,'components':ingredients,
  'sourceReferences':sum(bool(r['sourceHashes']) for r in rows),'missingSourceReferences':sum(not r['sourceHashes'] for r in rows),
  'accepted':0,'behaviorCoverageComplete':False,'notes':'Taxon-identified reference candidates are separate from completed per-behavior species coverage.'})
 print(json.dumps({'jobs':len(jobs),'faunaReferences':sum(bool(r['sourceHashes']) for r in rows),'groups':sorted({j['group'] for j in jobs})}))
