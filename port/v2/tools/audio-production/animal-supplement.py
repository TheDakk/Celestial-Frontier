#!/usr/bin/env python3
"""Explicit recording declarations; never infer fauna identity from a filename match."""
import json,urllib.parse,sys
from acquire import Acquisition,BASE,write_json,sha_file
SID='fws_commons'
FWS={
 'File:Alligatorhiss.ogg':('Alligator','American alligator hiss; defensive context, not a game hurt cue'),
 'File:Alligatorbellow1.ogg':('Alligator','American alligator bellow'),
 'File:Baby pelican.ogg':('Pelican','Unidentified Pelecanus chick; not adult-species coverage'),
 'File:Baby Wood Storks (Mycteria americana).ogg':('Stork','Wood stork chicks; not adult-species coverage'),
 'File:Ducks landing in water.ogg':('Duck','Ducks landing, movement and water; not a vocalization'),
 'File:Elkbellow.ogg':('Elk','Elk bellow'),
 'File:Geese Honking (loud).ogg':('Goose','Geese honking'),
 'File:Loons.ogg':('Loon','Loon recording; exact species context retained on item page'),
 'File:Rattlesnake.ogg':('Rattlesnake','Rattle; physical mechanism, not a vocalization'),
 'File:Tundra swans.ogg':('Swan','Tundra swans'),
 'File:Wolf howls.ogg':('Wolf','Wolf howls'),
 'File:Woodpecker tapping.ogg':('Woodpecker','Tapping; contact sound, not a vocalization')}
# Source-specific declarations after reading the recording descriptions. Imitation entries excluded.
OGA={
 'Camel Groan':('Camel','craigsmith / USC archive; edited by AntumDeluge','Vintage archived recording as described by contributor; not a field identification'),
 'Cat Flapping Ears sound':('Cat','Bashar3A / Bashar from Skirmish.io','Ear movement, not vocal behavior'),
 'Crow caw':('Crow','zeroisnotnull','Crow recorded in Cairo; source-described identity'),
 'Rabbit Eating':('Rabbit','Voltiment555','Rabbit eating salad; chewing, not vocal behavior'),
 'Dog barking mono':('Dog','Brandon Morris / HaelDB','Recorded dog bark with noise reduction; incidental insect noise possible'),
 'Dog Grunt':('Dog','qubodup','Frieda the dog playing with a toy; grunt, not injury'),
 'Peacock scream':('Peacock','popthebubbles4; extracted by qubodup','Public-domain permission correspondence retained; extracted scream'),
 'Bat Screeches':('Fruit Bat','polymorpheva; edited by AntumDeluge','Fruit bats, Sydney field recording; water fountain and source noise reduction'),
 'Penguin Sounds':('Penguin','Bidone; edited by AntumDeluge','Leipzig zoo penguins with other birds/water; source noise reduction'),
 'Quail Sound':('Quail','PrincessGrace; edited by AntumDeluge','Source-described bobwhite quail extracted from summer ambience'),
 'Sheep Baa':('Sheep','mikewest; edited by AntumDeluge','Recorded sheep baa as attributed by contributor')}

def fws_allowed(info):
 m=info.get('extmetadata',{});v=lambda k:m.get(k,{}).get('value','')
 return (v('License')=='pd' and v('LicenseShortName')=='Public domain' and v('Copyrighted')=='False'
   and 'PD US FWS' in v('Categories').split('|') and info.get('mime') in ('application/ogg','audio/ogg'))
def oga_allowed(row):
 text=row.get('text','').lower()
 return (any('/publicdomain/zero/1.0' in x for x in row.get('licenses',[]))
  and not any(x in text for x in ('human imitation','me... imitating','imitation i did','modified human','made using a jacket')))

def main(only_oga=False):
 a=Acquisition();a.receipt=json.loads((BASE/'manifests/acquisition.json').read_text())
 supplemental=json.loads((BASE/'manifests/supplemental-sources.json').read_text())
 before=BASE/('reports/acquisition-before-oga-continuation.json' if only_oga else 'reports/acquisition-before-animal-supplement.json')
 if before.exists():raise ValueError('Supplement already attempted; preserve first result')
 write_json(before,a.receipt)
 declarations=[]
 def source(sid,title,url,creator,license_id):
  if any(s['id']==sid for s in supplemental['sources']):raise ValueError('Source already present')
  supplemental['sources'].append({'id':sid,'title':title,'source_page_url':url,'creator':creator,'license_id':license_id,'kind':'inspected_recordings'})
  write_json(BASE/'manifests/supplemental-sources.json',supplemental)
  rec={'id':sid,'status':'RUNNING','downloads':[]};a.receipt['sources'].append(rec);return rec
 if not only_oga:
  q={'action':'query','format':'json','prop':'imageinfo','titles':'|'.join(FWS),'iiprop':'url|extmetadata|mime|size'}
  proof=a.fetch('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(q),'license-evidence/'+SID)
  pages=json.loads((BASE/proof['path']).read_text())['query']['pages']
  rec=source(SID,'US Fish and Wildlife recordings on Commons','https://commons.wikimedia.org/wiki/Category:Audio_files_of_animal_sounds_from_the_United_States_Fish_and_Wildlife_Service','U.S. Fish and Wildlife Service','Public-Domain')
  for p in pages.values():
   info=p.get('imageinfo',[{}])[0]
   if p['title'] not in FWS or not fws_allowed(info):raise ValueError('Unqualified FWS file: '+p['title'])
   name,context=FWS[p['title']];detail,e=a.page(info['descriptionurl'],SID)
   d=a.fetch(info['url'],'source-audio/'+SID,16*1024**2)
   a.ingest(d,{'sourceId':SID,'title':p['title'].removeprefix('File:'),'recordingTitle':context,'sourceKind':'wildlife_or_environment_recording',
    'creator':'U.S. Fish and Wildlife Service; Commons contributor/conversion credit in item metadata','licenseId':'Public-Domain',
    'licenseEvidence':proof,'itemEvidence':e,'itemMetadataText':detail.plain(),'sourcePage':info['descriptionurl'],
    'recordingContext':context,'sourceProcessing':'Acquired Commons Ogg derivative; upstream USFWS field master is not claimed.'})
   declarations.append({'gameName':name,'sourceId':SID,'sourceHashes':[d['sha256']],'context':context,'classification':'source_identified_reference','accepted':False})
   rec['downloads'].append(d);write_json(BASE/'manifests/acquisition.json',a.receipt);print(name,flush=True)
  rec['status']='ACQUIRED'
 else:
  rec=next(r for r in a.receipt['sources'] if r['id']==SID)
  if rec['status']!='RUNNING':raise ValueError('Expected preserved interrupted FWS intake')
  rec['status']='BLOCKED_RATE_LIMIT';rec['failure']='HTTP 429 from Wikimedia original-file host; first failure preserved, no subsequent retry'
  for m in a.receipt['media']:
   if m['sourceId']==SID:
    name,context=FWS['File:'+m['title']]
    declarations.append({'gameName':name,'sourceId':SID,'sourceHashes':[m['sha256']],'context':context,'classification':'source_identified_reference','accepted':False})
  write_json(BASE/'manifests/acquisition.json',a.receipt)
 discovery=json.loads((BASE/'manifests/oga-animal-discovery.json').read_text())
 for title,(name,creator,context) in OGA.items():
  row=next(r for r in discovery['items'] if r.get('title')==title)
  if not oga_allowed(row):raise ValueError('CC0/recording control: '+title)
  sid='oga_animal_'+row['url'].rsplit('/',1)[1].replace('-','_');rec=source(sid,title,row['url'],creator,'CC0-1.0')
  for link in row['files']:
   # Preserve lossless source when separately offered; archives preserve every member verbatim.
   if link['url'].lower().endswith('.ogg') and any(l['url'].lower().endswith(('.flac','.wav')) for l in row['files']):continue
   d=a.fetch(link['url'],'source-archives/'+sid,32*1024**2)
   a.ingest(d,{'sourceId':sid,'title':title,'recordingTitle':title,'sourceKind':'wildlife_or_environment_recording',
    'creator':creator,'licenseId':'CC0-1.0','licenseEvidence':row['evidence'],'itemEvidence':row['evidence'],
    'itemMetadataText':row['text'],'sourcePage':row['url'],'recordingContext':context,
    'sourceProcessing':'Acquired creator-published edit; full upstream field master not claimed.'})
   rec['downloads'].append(d)
  hashes=[m['sha256'] for m in a.receipt['media'] if m['sourceId']==sid]
  if not hashes:raise ValueError('No acquired audio')
  declarations.append({'gameName':name,'sourceId':sid,'sourceHashes':hashes,'context':context,'classification':'source_identified_reference','accepted':False})
  rec['status']='ACQUIRED';write_json(BASE/'manifests/acquisition.json',a.receipt);print(name,len(hashes),flush=True)
 write_json(BASE/'manifests/recording-supplement-bindings.json',{'schema':'cf.recording-bindings/v1','bindings':declarations,'meaning':'Explicit source-described identities and mechanisms; no behavior or listening approval'})
 write_json(BASE/'manifests/acquisition.json',a.receipt)
if __name__=='__main__':
 if sys.argv[1:] not in ([],['--only-oga']):raise ValueError('Expected --only-oga or no argument')
 main(sys.argv[1:]==['--only-oga'])
