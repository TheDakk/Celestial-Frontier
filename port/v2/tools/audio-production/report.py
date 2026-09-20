#!/usr/bin/env python3
"""Join actual downloads, source hashes, production receipts and explicit coverage gaps."""
import collections, hashlib, json, wave
from pathlib import Path
from acquire import BASE, ROOT, MANIFEST, write_json, sha_file, source_manifest

def recording_credit(media):
    """Keep the supplied attribution and exact license on every attributed derivative."""
    license_id=media['licenseId'];url=media.get('licenseUrl','')
    if license_id.startswith('CC-BY-'):
        expected='https://creativecommons.org/licenses/by/'+license_id.removeprefix('CC-BY-')+'/'
        if url!=expected or not media.get('attribution') or not media.get('sourcePage'):
            raise ValueError('Attributed recording lacks exact license/source/attribution')
    return {'sourceId':media['sourceId'],'creator':media.get('attribution') or media.get('creatorProfileName') or media['creator'],
        'license':license_id+(' ('+url+')' if url else ''),'licenseId':license_id,'licenseUrl':url,
        'url':media.get('sourcePage',''),'attribution':media.get('attribution','')}

def main():
    acquisition=json.loads((BASE/'manifests/acquisition.json').read_text())
    manifest=source_manifest(); sources={s['id']:s for s in manifest['sources']}
    source_media={(m['sourceId'],m['sha256']):m for m in acquisition['media']}
    ecology_path=BASE/'manifests/ecology-coverage.json'
    ecology=json.loads(ecology_path.read_text()) if ecology_path.exists() else None
    for p in (BASE/'manifests/audio-lock.json',BASE/'manifests/audio-coverage.json'):
        if p.exists():
            old=json.loads(p.read_text())
            if any(r.get('approved') or r.get('productionAccepted') for r in old.get('candidates',[])+old.get('requirements',[])):
                raise ValueError('Accepted output present; a general report rebuild cannot reset approval')
    coverage=json.loads((BASE/'manifests/audio-coverage.json').read_text())
    decode=json.loads((BASE/'reports/source-decode.json').read_text())
    expected={m['sha256'] for m in acquisition['media']}
    decoded={r['sha256']:r for r in decode['files']}
    quarantined={m['sha256'] for m in acquisition['media'] if m.get('intakeStatus')=='quarantined_decode_failure'}
    failures={h for h,r in decoded.items() if r['exit'] or r['error']}
    if set(decoded)!=expected or failures!=quarantined:
        raise ValueError('Current decode evidence incomplete or failures not explicitly quarantined')
    outputs=[]
    for p in sorted((BASE/'reports').glob('*.json')):
        report=json.loads(p.read_text())
        if report.get('schema')=='cf.audio-render/v1': outputs+=report['outputs']
    if len({r['id'] for r in outputs})!=len(outputs): raise ValueError('Duplicate candidate IDs across render receipts')
    for row in outputs:
        if any(l['sha256'] in quarantined for l in row['layers']):raise ValueError('Render references quarantined source')
        row['sourceCredits']=[recording_credit(source_media[(l['sourceId'],l['sha256'])]) for l in row['layers']]
        for credit in row['sourceCredits']:
            if not credit['url']:credit['url']=sources[credit['sourceId']]['source_page_url']
        if not row['layers']:
            row['sourceCredits']=[{'sourceId':'original_surge','creator':'Celestial Frontier original MIDI sketch','license':'Original synthesis; no external sample imported','url':''}]
    write_json(BASE/'audition/catalog.json',{'schema':'cf.audio-audition/v1','outputs':outputs})
    content={}; locks=[]
    for row in outputs:
        master=BASE/row['master']; opus=BASE/row['opus']; preview=BASE/'audition'/Path(row['previewUrl']).name
        for p,h in ((master,row['masterSha256']),(opus,row['opusSha256']),(preview,row['previewSha256'])):
            if sha_file(p)!=h: raise ValueError('Changed rendered output: '+str(p))
        with wave.open(str(master),'rb') as f:
            raw=f.readframes(f.getnframes()); signature=hashlib.sha256(str((f.getnchannels(),f.getframerate(),f.getsampwidth())).encode()+raw).hexdigest()
        content.setdefault(signature,[]).append(row['id'])
        locks.append({'id':row['id'],'masterSha256':row['masterSha256'],'opusSha256':row['opusSha256'],'decodedPcmSha256':signature,
          'recipe':row,'approved':False,'rights':[{'sourceId':x['sourceId'],'creator':recording_credit(source_media[(x['sourceId'],x['sha256'])])['creator'],
            'licenseId':source_media[(x['sourceId'],x['sha256'])]['licenseId'],
            'sourceUrl':source_media[(x['sourceId'],x['sha256'])].get('sourcePage',sources[x['sourceId']]['source_page_url']),
            'inputSha256':x['sha256'],**recording_credit(source_media[(x['sourceId'],x['sha256'])]),
            'modifications':row['notes']} for x in row['layers']]})
    aliases={h:ids for h,ids in content.items() if len(ids)>1}
    write_json(BASE/'reports/duplicate-treatments.json',{'schema':'cf.audio-duplicate-treatments/v1',
        'meaning':'Identical decoded PCM counts once as a distinct performance, regardless of filename or event mapping.',
        'groups':aliases,'uniquePerformances':len(content),'renderedFiles':len(outputs)})
    by_requirement=collections.defaultdict(list)
    for row in outputs:
        for key in row['requirements']:by_requirement[key].append(row['id'])
    for r in coverage['requirements']:
        ecological=next((e for e in ecology['fauna'] if e['name']==r.get('name')),None) if ecology and r.get('kingdom')=='fauna' else None
        if ecological:
            r['candidateSourceHashes']=ecological['sourceHashes'];r['sourceBinding']=ecological['binding'];r['supplementalSourceBindings']=ecological.get('supplementalBindings',[])
            r['behaviorStatus']=ecological['behaviors']
        ids=by_requirement[r['id']]
        if r.get('category')=='family':ids=[x['id'] for x in outputs if any(k.startswith(r['id']+'.') for k in x['requirements'])]
        if r.get('candidateSourceHashes'): ids=[x['id'] for x in outputs if x['kind']=='recording' and any(l['sha256'] in r['candidateSourceHashes'] for l in x['layers'])]
        r['candidateIds']=ids;r['renderStatus']='validated_candidates' if ids else 'missing'
        r['integrationStatus']='developer_audition_only' if ids else 'not_assigned';r['listeningStatus']='not_reviewed';r['productionAccepted']=False
        if r.get('kingdom')=='fauna' and r.get('candidateSourceHashes'):
            r['classification']='identified_recording_reference'
            r['renderStatus']='source_excerpt_available' if ids else 'source_only'
            r['acquisitionStatus']='identified_source_candidate'
            r['note']='Source taxon retained; a broader game label may bind a narrower identified taxon explicitly. Reference only, not verified call/attack/hurt/faint coverage. Context and listening remain open.'
        elif r['id']=='weather.airless' or r['id']=='biome.cratered':
            r['classification']='intentional_silence';r['note']='No atmospheric sound in the airless environment; does not fill organism or UI sound gaps.'
    coverage['renderedCandidates']=len(outputs);coverage['uniquePcmPerformances']=len(content);coverage['complete']=False
    write_json(BASE/'manifests/audio-coverage.json',coverage)
    protected=[]
    for p in sorted((ROOT/'port/v2/apps/game/assets/pilot/audio').glob('*')):
        if p.is_file(): protected.append({'path':str(p.relative_to(ROOT)),'sha256':sha_file(p),'role':'existing game asset, unchanged by this batch'})
    write_json(BASE/'manifests/audio-lock.json',{'schema':'cf.audio-lock/v1','manifestSha256':sha_file(MANIFEST),
       'sourceContent':[{'sha256':h,'provenance':[{'sourceId':m['sourceId'],'path':m['path']} for m in acquisition['media'] if m['sha256']==h]} for h in sorted({m['sha256'] for m in acquisition['media']})],
       'protectedGameAssets':protected,'candidates':locks,'promotion':'No candidate accepted or automatically substituted'})
    credits=['# Audio credits and source evidence','','Original recordings remain unchanged in local audio-production/source-audio and source-archives. No source archive or master is implicitly shipped.','']
    for s in manifest['sources']:
        count=sum(m['sourceId']==s['id'] for m in acquisition['media'])
        credits += [f"- **{s['title']}** — {s['creator']}; {s['license_id']}. [Source]({s['source_page_url']}). {count} inspected audio entries. Evidence and item-level recordists: manifests/acquisition.json."]
        if s.get('notes'):credits.append('  '+s['notes'])
    credits += ['','Original MIDI/Surge sketches: Celestial Frontier production candidates, installed Surge XT 1.3.4 initialized classic oscillator; saved state in each REAPER project. No third-party wavetable was imported. REAPER is the existing licensed installation; $0 spent.','','No creator was contacted. Item-level NPS Credit / Author and description are preserved in acquisition.json. Collection public-domain statements are not relabelled CC0.']
    (BASE/'AUDIO-CREDITS.md').write_text('\n'.join(credits)+'\n')
    attributed=['# Attributed recording credits','','Unapproved candidate derivatives; original downloaded bytes retained. No creator endorsement is implied.','']
    for m in acquisition['media']:
        if not m['licenseId'].startswith('CC-BY-'):continue
        c=recording_credit(m)
        derivatives=[r['id'] for r in outputs if any(l['sha256']==m['sha256'] for l in r['layers'])]
        attributed += ['## '+m.get('recordingTitle',m.get('title','Recording')),'',c['attribution'],
            '[Original observation]('+c['url']+') · [License]('+c['licenseUrl']+')',
            'Original SHA-256: '+m['sha256'],
            ('Rendered candidates: '+', '.join(derivatives)+'. Changes: bounded opening excerpt; input attenuation, 48 kHz PCM conversion, short edge fades, stock REAPER track/render and WAV/Opus encoding. Per-file recipe records exact rates, gains and duration. No listening acceptance.' if derivatives else 'Original only; no rendered derivative yet.'),'']
    (BASE/'RECORDING_CREDITS.md').write_text('\n'.join(attributed)+'\n')
    counts=collections.Counter(r.get('classification','recipe_or_gap') for r in coverage['requirements'])
    gaps=[r for r in coverage['requirements'] if not r['candidateIds'] and r.get('classification')!='intentional_silence']
    report={'schema':'cf.audio-production-status/v1','sourcePages':len(acquisition['sources']),'sourceAudioEntries':len(acquisition['media']),
      'uniqueSourceAudio':len({m['sha256'] for m in acquisition['media']}),'quarantinedSources':len(quarantined),'eligibleDecodedSources':len(expected-quarantined),'renderedCandidates':len(outputs),'uniquePcmPerformances':len(content),
      'requirements':len(coverage['requirements']),'requirementsWithoutAssignedCandidate':len(gaps),'classifications':dict(counts),
      'listeningAccepted':0,'gameplayPromotions':0,'spendUsd':0,'sourceGaps':[g for g in acquisition['gaps'] if g['status']=='unresolved'],'sourceGapHistory':acquisition['gaps'],
      'limits':['Candidate passes measure decoding, hashes, format and true peak, not sound design quality.',
        'Version 2 has phase-specific theme designs and three distinct primary inputs per cast/impact; sound quality and duplicate treatments still require review.',
        'Original music is a MIDI sketch with editable parts and separately rendered instrument stems, not a listening-approved score.',
        'Most named Earth animals have no authentic recording in these collections; no fictional family substitute fills those entries.',
        'Resolved-body plans, actual painter-record hash binding and explicit biome/weather composition are implemented for audition; game promotion and loop listening remain open.',
        'Audition is integrated into local development only; no candidate replaces approved runtime assets.',
        'Physical speakers/headphones, iPhone/Safari/PWA, offline and listening approval are unverified.']}
    write_json(BASE/'reports/status.json',report)
    lines=['# Audio coverage','','Matches source inventory and rendered files as of 2026-09-15.','','This is an expanded production candidate library, not completed species authenticity or accepted sound design.','',
      f"- {report['sourceAudioEntries']} inspected source audio entries ({report['uniqueSourceAudio']} unique byte hashes); {report['eligibleDecodedSources']} fully decoded, {report['quarantinedSources']} damaged originals quarantined from production.",
      f"- {len(outputs)} validated candidate WAV/Opus pairs, {len(content)} distinct decoded PCM performances. Identical treatments are listed in reports/duplicate-treatments.json.",
      f"- {len(coverage['requirements'])} actual-vocabulary requirements; {len(gaps)} have no assigned candidate. Named-Earth exact-source matches are flagged separately from fictional voices.",
      '- 0 listening approvals and 0 gameplay promotions. The supplied handoff and kits remain unchanged.','',
      'Use manifests/audio-coverage.json for every requirement, manifests/audio-lock.json for hashes/provenance, reports/status.json for limits, and AUDIO-CREDITS.md for credits.','']
    lines+=['- '+l for l in report['limits']]
    if ecology:
        lines += ['',f"Ecology continuation: {ecology['sourceReferences']} of {len(ecology['fauna'])} named fauna have identified source-reference candidates; {ecology['missingSourceReferences']} remain missing. Narrower identified taxa are disclosed and do not establish all behavior cues.",
          'All 43 canonical biomes have explicit compiler profiles. Render resolution is checked separately in reports/functional-coverage-ecology.json; listening and incidental field content remain open.',
          'See manifests/ecology-coverage.json and ../audits/AUDIO_FAUNA_BIOMES_20260915/README.md.']
    (BASE/'AUDIO-COVERAGE.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps({k:report[k] for k in ('sourceAudioEntries','uniqueSourceAudio','renderedCandidates','uniquePcmPerformances','requirementsWithoutAssignedCandidate')}))

if __name__=='__main__':main()
