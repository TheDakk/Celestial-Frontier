#!/usr/bin/env python3
"""Intake the inspected NOAA-authored subset; third-party hosting is not a license."""
import json,re
from acquire import Acquisition,BASE,write_json
POLICY='https://www.fisheries.noaa.gov/national/about-us/website-policies-and-disclaimers'
CITATIONS='https://www.fisheries.noaa.gov/s3/2023-06/SoundsPageCitations-2023-0.pdf'
PAGES=['mammals','fish-and-invertebrates','environmental-and-anthropogenic']
# Recording credit inspected in citation PDF; never use the photograph/spectrogram credit.
TITLES={'Fin Whale','Humpback Whale','Minke Whale','North Atlantic Right Whale 1','Sei Whale',
 'Atlantic Spotted Dolphin','Atlantic White-sided Dolphin','Bottlenose Dolphin','Cuvier’s Beaked Whale',
 'Humpback Dolphin','Pilot Whale','Risso’s Dolphin','Short-Beaked Common Dolphin','Sperm Whale',
 'Striped Dolphin','True’s Beaked Whale','White-Beaked Dolphin','Atlantic Cod','Haddock','Red Grouper',
 'Toadfish','Snapping shrimp','Earthquake','Rain','Soundscape','Thunderstorm'}
def permitted(title,url):return title in TITLES and ('NOAA-PAGroup-' in url or (title=='Earthquake' and 'NOAA-Kline-' in url))
def main():
 a=Acquisition();a.receipt=json.loads((BASE/'manifests/acquisition.json').read_text())
 if any(s['id']=='noaa_passive_acoustics' for s in a.receipt['sources']):raise ValueError('Preserve existing NOAA intake; use explicit subsequent batch')
 policy,proof=a.page(POLICY,'noaa_passive_acoustics')
 if 'not subject to copyright in the United States' not in policy.plain():raise ValueError('NOAA policy changed')
 citations=a.fetch(CITATIONS,'license-evidence/noaa_passive_acoustics',8*1024**2)
 rec={'id':'noaa_passive_acoustics','status':'RUNNING','evidence':proof,'citationEvidence':citations,'excluded':[]};a.receipt['sources'].append(rec)
 for suffix in PAGES:
  url='https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-'+suffix
  page,evidence=a.page(url,'noaa_passive_acoustics')
  for link in page.links:
   if not re.search(r'\.(mp3|wav)(?:\?|$)',link['url']):continue
   title=link['section']
   if not permitted(title,link['url']):rec['excluded'].append({'title':title,'url':link['url'],'reason':'Third-party or outside the selected natural NOAA-authored subset'});continue
   try:
    d=a.fetch(link['url'],'source-audio/noaa_passive_acoustics',32*1024**2)
    speed=re.search(r'(?:x([0-9.]+)speed|([0-9.]+)x-)',link['url'])
    a.ingest(d,{'sourceId':'noaa_passive_acoustics','sourceKind':'wildlife_or_environment_recording','title':title,'recordingTitle':link['text'],
      'sourcePage':url,'creator':'NOAA Fisheries, NEFSC, Passive Acoustics Branch (2023); see recording citation',
      'licenseId':'Public-Domain','licenseEvidence':proof,'itemEvidence':evidence,'citationEvidence':citations,
      'itemMetadataText':page.plain(),'sourcePlaybackSpeed':float(speed.group(1) or speed.group(2)) if speed else 1,
      'sourceProcessing':'Published educational clip; any speed, amplification and filtering remain as supplied. Not a raw hydrophone master.'})
    print(title,flush=True)
   except Exception as e:a.gap('noaa_passive_acoustics',link['url'],e)
   write_json(BASE/'manifests/acquisition.json',a.receipt)
 rec['status']='ACQUIRED_WITH_GAPS' if any(g['sourceId']==rec['id'] for g in a.receipt['gaps']) else 'ACQUIRED'
 write_json(BASE/'manifests/acquisition.json',a.receipt);write_json(BASE/'manifests/acquisition-gaps.json',a.receipt['gaps'])
if __name__=='__main__':main()
