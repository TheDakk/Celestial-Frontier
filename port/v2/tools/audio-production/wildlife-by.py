#!/usr/bin/env python3
"""Nick-authorized CC BY 4.0 supplement, explicit taxon bindings and retained attribution."""
import json
from wildlife import Wildlife,INV
from acquire import BASE,write_json,sha_file,safe_url
BINDINGS={'Jaguar':41970,'Peccary':42113,'Giant Anteater':47107,'Spider Monkey':43411,'Tamarin':43384,
 'Python':540202,'Elephant':43694,'Water Buffalo':81925,'Langur':963196,'Mongoose':41921,'Cobra':1438742,
 'Hyena':41886,'Vulture':4756,'Tortoise':71212,'Glass Frog':65192,'Asian Elephant':43697,'Lynx':41979,
 'Mink':1264432,'Marten':41800,'Shrew':46531,'Moose':522193,'Arctic Fox':233598,'Ibex':42357,
 'Chamois':42347,'Capybara':74442,'Spotted Hyena':41886,'Wildebeest':42280,'Hippopotamus':42149,
 'Hartebeest':42418,'Ant':124150,'Bustard':132,'Maned Wolf':42091,'Puffin':4504,'Snake':29044,
 'Giant Otter':41845,'River Dolphin':41472,'Sea Otter':41860,'Rat':44576,'Horse':209233,
 'Moth':636296,'Desert Owl':507358,'Cassowary':20500,'Pronghorn':42429,'Serow':74144,'Hoatzin':1626}
SID='inat_ccby';LICENSE='https://creativecommons.org/licenses/by/4.0/'
def eligible_by(sound,observation,taxon):
 return (observation.get('quality_grade')=='research' and taxon in (observation.get('taxon') or {}).get('ancestor_ids',[])
  and sound.get('license_code')=='cc-by' and bool(sound.get('attribution')) and not sound.get('hidden')
  and not sound.get('flags') and not sound.get('moderator_actions') and isinstance(sound.get('file_url'),str)
  and sound.get('file_content_type','').startswith('audio/'))
def main():
 exception=json.loads((BASE/'manifests/license-exceptions.json').read_text())
 if 'CC-BY-4.0' not in exception['permitted']:raise ValueError('User exception required')
 mapping=json.loads((BASE/'manifests/inat-license-mapping-evidence.json').read_text())
 p=BASE/mapping['path']
 if sha_file(p)!=mapping['sha256'] or 'CC_VERSION = "4.0"' not in p.read_text():raise ValueError('License mapping evidence changed')
 a=Wildlife();a.receipt=json.loads((BASE/'manifests/acquisition.json').read_text())
 if any(s['id']==SID for s in a.receipt['sources']):raise ValueError('Existing CC BY intake refused')
 cats={t['id']:t for t in json.loads((BASE/'manifests/wildlife-ccby-catalogue.json').read_text())['taxa']}
 game={r['name'] for r in json.loads(INV.read_text())['earth'] if r['kingdom']=='fauna'}
 assert all(n in game and t in cats for n,t in BINDINGS.items())
 supplement=json.loads((BASE/'manifests/supplemental-sources.json').read_text())
 supplement['sources'].append({'id':SID,'title':'Individually CC BY 4.0 iNaturalist recordings','source_page_url':'https://www.inaturalist.org/',
  'license_id':'CC-BY-4.0','creator':'Individual credited sound authors; exact attribution and item links retained per sound','kind':'individual-media-license',
  'notes':'Authorized by Nick September 15. No NC/ND/SA licenses; edits listed per rendered candidate.'})
 write_json(BASE/'manifests/supplemental-sources.json',supplement)
 rec={'id':SID,'status':'RUNNING','licenseUrl':LICENSE,'licenseMapping':mapping,'bindings':[]};a.receipt['sources'].append(rec)
 declarations=[];sound_ids={};downloaded=0
 for name,taxon_id in BINDINGS.items():
  t=cats[taxon_id];binding={'gameName':name,'sourceId':SID,'taxonId':taxon_id,'scientificName':t['name'],
   'recordedCommonName':t['commonName'],'relation':'same_taxon' if name==t['commonName'] else 'narrower_identified_taxon',
   'sourceHashes':[],'context':'Research-grade observation identity; audio behavior and field companions still require review.',
   'classification':'source_identified_reference','accepted':False};declarations.append(binding);rec['bindings'].append(binding)
  try:
   d,e=a.api('observations',{'sounds':'true','sound_license':'cc-by','quality_grade':'research','taxon_id':taxon_id,'per_page':5,'order_by':'id','order':'asc'})
   for o in d['results']:
    for s in o['sounds']:
     if len(binding['sourceHashes'])>=2:break
     if not eligible_by(s,o,taxon_id):continue
     if s['id'] in sound_ids:
      binding['sourceHashes'].append(sound_ids[s['id']]);continue
     if downloaded>512*1024**2:raise ValueError('512 MiB batch budget reached')
     safe_url(s['file_url']);f=a.fetch(s['file_url'],'source-audio/'+SID,32*1024**2)
     a.ingest(f,{'sourceId':SID,'sourceKind':'wildlife_or_environment_recording','title':t['commonName'] or t['name'],
      'recordingTitle':o['taxon'].get('preferred_common_name',o['taxon']['name']),'scientificName':o['taxon']['name'],'taxonId':o['taxon']['id'],
      'queriedTaxonId':taxon_id,'soundId':s['id'],'sourcePage':o['uri'],'creatorProfileName':o['user'].get('name') or o['user']['login'],
      'creatorProfile':'https://www.inaturalist.org/people/'+o['user']['login'],'attribution':s['attribution'],
      'licenseId':'CC-BY-4.0','licenseUrl':LICENSE,'licenseEvidence':e,'licenseMappingEvidence':mapping,'itemEvidence':e,
      'soundLicenseCode':'cc-by','itemMetadataText':o.get('description') or '',
      'recordingContext':binding['context'],'qualityGrade':o['quality_grade'],'sourceProcessing':'Original downloaded bytes unchanged; render modifications recorded in candidate recipe.'})
     downloaded+=f['bytes'];sound_ids[s['id']]=f['sha256'];binding['sourceHashes'].append(f['sha256'])
    if len(binding['sourceHashes'])>=2:break
   if not binding['sourceHashes']:raise ValueError('No eligible sound in first five observations')
  except Exception as ex:binding['gap']=str(ex);a.gap(SID,str(taxon_id),ex)
  write_json(BASE/'manifests/acquisition.json',a.receipt)
  write_json(BASE/'manifests/recording-ccby-bindings.json',{'schema':'cf.recording-bindings/v1','bindings':declarations,'authorization':exception['authorization']})
  print(name,len(binding['sourceHashes']),binding.get('gap',''),flush=True)
 rec['status']='ACQUIRED_WITH_GAPS' if any('gap' in b for b in declarations) else 'ACQUIRED'
 write_json(BASE/'manifests/acquisition.json',a.receipt);write_json(BASE/'manifests/acquisition-gaps.json',a.receipt['gaps'])
 print(json.dumps({'downloadedBytes':downloaded,'bindings':len(declarations),'sourceFiles':len(sound_ids)}))
if __name__=='__main__':main()
