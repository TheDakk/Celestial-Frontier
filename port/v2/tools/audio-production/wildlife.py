#!/usr/bin/env python3
"""Bounded CC0 wildlife intake. Never infer sound rights from observation/photo licenses.
Discover a catalogue, review explicit game/taxon bindings, then acquire <=2 takes/binding.
"""
import argparse,json,time,urllib.parse
from acquire import Acquisition,BASE,ROOT,write_json,sha_file,safe_url
INV=ROOT/'audits/AUDIO_PRODUCTION_20260915/game-inventory-v2.json'
API='https://api.inaturalist.org/v1/'
class Wildlife(Acquisition):
    def fetch(self,*args,**kwargs):
        time.sleep(max(0,1.1-(time.monotonic()-self.last_request)))
        return super().fetch(*args,**kwargs)
    def api(self,path,params):
        url=API+path+'?'+urllib.parse.urlencode(params)
        evidence=self.fetch(url,'license-evidence/inat_cc0',16*1024**2)
        return json.loads((BASE/evidence['path']).read_text()),evidence

def eligible(sound,observation,taxon_id):
    taxon=observation.get('taxon') or {}
    return (observation.get('quality_grade')=='research'
        and taxon_id in taxon.get('ancestor_ids',[]) and sound.get('license_code')=='cc0'
        and not sound.get('hidden') and not sound.get('flags') and not sound.get('moderator_actions')
        and isinstance(sound.get('file_url'),str) and sound.get('file_content_type','').startswith('audio/'))

def discover():
    a=Wildlife();rows=[];proof=[]
    for page in range(1,21):
        j,e=a.api('observations/species_counts',{'sounds':'true','sound_license':'cc0','quality_grade':'research','taxon_id':1,'per_page':500,'page':page})
        proof.append(e);rows+=j['results'];print('catalogue',len(rows),'of',j['total_results'],flush=True)
        if len(rows)>=j['total_results']:break
    else:raise ValueError('Catalogue exceeds bounded 10k metadata scope; use published dataset')
    write_json(BASE/'manifests/wildlife-catalogue.json',{'schema':'cf.wildlife-catalogue/v1','licenseFilter':'cc0','evidence':proof,
        'taxa':[{'id':r['taxon']['id'],'name':r['taxon']['name'],'commonName':r['taxon'].get('preferred_common_name',''),
           'ancestors':r['taxon'].get('ancestor_ids',[]),'rank':r['taxon']['rank'],'count':r['count']} for r in rows]})

def acquire(resume_gaps=False):
    a=Wildlife();a.receipt=json.loads((BASE/'manifests/acquisition.json').read_text())
    bindings=json.loads((BASE/'manifests/fauna-source-bindings.json').read_text())['bindings']
    game={r['name'] for r in json.loads(INV.read_text())['earth'] if r['kingdom']=='fauna'}
    catalogue={r['id']:r for r in json.loads((BASE/'manifests/wildlife-catalogue.json').read_text())['taxa']}
    sound_ids={m.get('soundId') for m in a.receipt['media'] if m['sourceId']=='inat_cc0'}
    prior_bytes=sum(m['bytes'] for m in a.receipt['media'] if m['sourceId']=='inat_cc0')
    existing=next((s for s in a.receipt['sources'] if s['id']=='inat_cc0'),None)
    if existing and not resume_gaps:raise ValueError('Collection already acquired; use explicit gap continuation')
    if resume_gaps:
        if not existing or existing['status']=='RUNNING':raise ValueError('Initial intake must finish before gap continuation')
        before=BASE/'reports/wildlife-before-gap-continuation.json'
        if before.exists():raise ValueError('Gap continuation already attempted')
        write_json(before,a.receipt)
        names={r['gameName'] for r in existing['bindings'] if not r['acquired']}
        bindings=[b for b in bindings if b['gameName'] in names]
        existing['bindings']=[b for b in existing['bindings'] if b['gameName'] not in names]
        rec=existing;rec['status']='RUNNING';rec['priorReceiptSha256']=sha_file(before)
    else:
        rec={'id':'inat_cc0','status':'RUNNING','bindings':[]};a.receipt['sources'].append(rec)
    for b in bindings:
        assert b['gameName'] in game and b['taxonId'] in catalogue and b['relation'] in ('same_taxon','narrower_identified_taxon')
        taxon=catalogue[b['taxonId']];result={'gameName':b['gameName'],'taxonId':b['taxonId'],'acquired':[]};rec['bindings'].append(result)
        try:
            j,e=a.api('observations',{'sounds':'true','sound_license':'cc0','quality_grade':'research','taxon_id':b['taxonId'],'per_page':5,'order_by':'id','order':'asc'})
            for observation in j['results']:
                for sound in observation['sounds']:
                    if len(result['acquired'])>=2:break
                    if not eligible(sound,observation,b['taxonId']):continue
                    if sound['id'] in sound_ids:
                        result['acquired'].append(sound['id']);continue
                    if prior_bytes>=1024**3:raise ValueError('1 GiB total intake budget reached')
                    safe_url(sound['file_url'])
                    d=a.fetch(sound['file_url'],'source-audio/inat_cc0',32*1024**2)
                    a.ingest(d,{'sourceId':'inat_cc0','sourceKind':'wildlife_or_environment_recording','title':taxon['commonName'] or taxon['name'],
                        'recordingTitle':observation['taxon'].get('preferred_common_name',observation['taxon']['name']),
                        'scientificName':observation['taxon']['name'],'taxonId':observation['taxon']['id'],'queriedTaxonId':b['taxonId'],
                        'soundId':sound['id'],'sourcePage':observation['uri'],'creator':observation['user']['login'],
                        'licenseId':'CC0-1.0','licenseEvidence':e,'itemEvidence':e,
                        'soundLicenseCode':sound['license_code'],'attribution':sound['attribution'],
                        'itemMetadataText':observation.get('description') or '',
                        'recordingContext':'Community research-grade identification; excerpt/behavior still requires listening. No exact location distributed.',
                        'qualityGrade':observation['quality_grade']})
                    prior_bytes+=d['bytes'];sound_ids.add(sound['id']);result['acquired'].append(sound['id'])
                if len(result['acquired'])>=2:break
            if not result['acquired']:raise ValueError('No eligible unflagged public CC0 audio in first five observations')
        except Exception as error:
            result['gap']=str(error);a.gap('inat_cc0',str(b['taxonId']),error)
        write_json(BASE/'manifests/acquisition.json',a.receipt)
        print(b['gameName'],len(result['acquired']),result.get('gap',''),flush=True)
    rec['status']='ACQUIRED_WITH_GAPS' if any('gap' in r for r in rec['bindings']) else 'ACQUIRED'
    write_json(BASE/'manifests/acquisition.json',a.receipt);write_json(BASE/'manifests/acquisition-gaps.json',a.receipt['gaps'])
    print(json.dumps({'sourceAudio':len(a.receipt['media']),'bytes':prior_bytes,'bindings':len(rec['bindings'])}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['discover','acquire']);p.add_argument('--resume-gaps',action='store_true');args=p.parse_args()
    if args.command=='discover':discover()
    else:acquire(args.resume_gaps)
