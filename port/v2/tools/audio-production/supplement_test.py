import importlib.util,copy,unittest,tempfile,json
from unittest.mock import patch
import acquire
from pathlib import Path
from report import recording_credit

def module(file):
 s=importlib.util.spec_from_file_location(file,Path(__file__).with_name(file+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
animal=module('animal-supplement');by=module('wildlife-by')
prepare=module('prepare-supplement')
class RecordingControls(unittest.TestCase):
 def test_explicit_exception_required_and_cannot_admit_nc(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);(root/'manifests').mkdir();original=root/'original.json';supplement=root/'supplement.json'
   original.write_text(json.dumps({'sources':[]}))
   source={'id':'test','license_id':'CC-BY-4.0','source_page_url':'https://www.inaturalist.org/observations/1'}
   supplement.write_text(json.dumps({'sources':[source]}))
   with patch.object(acquire,'BASE',root),patch.object(acquire,'MANIFEST',original),patch.object(acquire,'SUPPLEMENT',supplement):
    with self.assertRaises(ValueError):acquire.source_manifest()
    (root/'manifests/license-exceptions.json').write_text(json.dumps({'permitted':['CC-BY-4.0','CC-BY-NC-4.0']}))
    self.assertEqual(acquire.source_manifest()['sources'],[source])
    source['license_id']='CC-BY-NC-4.0';supplement.write_text(json.dumps({'sources':[source]}))
    with self.assertRaises(ValueError):acquire.source_manifest()
 def test_reference_requires_decoded_owned_source_and_never_claims_behavior(self):
  source={'sourceId':'test','sha256':'a'*64,'path':'source-audio/a.wav','title':'Fox','creator':'Recorder',
   'licenseId':'Public-Domain','duration':10,'channels':1}
  acq={'media':[source]};coverage={'fauna':[{'name':'Fox'}]}
  binding={'gameName':'Fox','sourceId':'test','sourceHashes':['a'*64],'context':'Field reference'}
  decoded={'files':[{'sha256':'a'*64,'exit':0,'error':''}]}
  jobs=prepare.build(acq,coverage,[binding],decoded)
  self.assertEqual(jobs[0]['requirements'],['earth.fauna.fox.recording']);self.assertFalse(jobs[0]['approved'])
  self.assertEqual(jobs[0]['layers'][0]['rate'],1)
  for bad in [{'gameName':'Invented animal'},{'sourceId':'wrong'}]:
   with self.assertRaises(ValueError):prepare.build(acq,coverage,[{**binding,**bad}],decoded)
  with self.assertRaises(ValueError):prepare.build(acq,coverage,[binding],{'files':[]})
  source['intakeStatus']='quarantined_decode_failure'
  with self.assertRaises(ValueError):prepare.build(acq,coverage,[binding],decoded)
 def test_lossy_alternate_does_not_become_a_second_take(self):
  source={'sourceId':'test','path':'source-audio/a.wav','title':'Fox','creator':'Recorder','licenseId':'Public-Domain','duration':10,'channels':1}
  media=[{**source,'sha256':c*64,'originalMember':member} for c,member in [('a','flac/fox_01.flac'),('b','ogg/fox_01.ogg')]]
  binding={'gameName':'Fox','sourceId':'test','sourceHashes':[m['sha256'] for m in media],'context':'Same take'}
  jobs=prepare.build({'media':media},{'fauna':[{'name':'Fox'}]},[binding],{'files':[{'sha256':m['sha256'],'exit':0,'error':''} for m in media]})
  self.assertEqual(len(jobs),1);self.assertEqual(jobs[0]['layers'][0]['sha256'],'a'*64)
 def test_ccby_is_per_sound_not_observation_or_photo(self):
  sound={'license_code':'cc-by','attribution':'(c) Recorder (CC BY)','file_url':'https://static.inaturalist.org/sounds/a.wav','file_content_type':'audio/wav'}
  obs={'quality_grade':'research','taxon':{'ancestor_ids':[1,99]},'license_code':'cc-by-nc'}
  self.assertTrue(by.eligible_by(sound,obs,99))
  for changed in [{'license_code':'cc-by-nc'},{'license_code':'cc-by-sa'},{'license_code':'cc-by-nd'},{'attribution':''},{'hidden':True},{'flags':[1]},{'moderator_actions':[1]}]:self.assertFalse(by.eligible_by({**sound,**changed},obs,99))
  self.assertFalse(by.eligible_by(sound,obs,100));self.assertFalse(by.eligible_by(sound,{**obs,'quality_grade':'casual'},99))
 def test_file_pd_not_commons_metadata_license(self):
  values={'License':'pd','LicenseShortName':'Public domain','Copyrighted':'False','Categories':'PD US FWS|Audio'}
  row={'mime':'application/ogg','extmetadata':{k:{'value':v} for k,v in values.items()}}
  self.assertTrue(animal.fws_allowed(row))
  for key,value in [('License','cc-by-sa-4.0'),('Categories','Audio'),('Copyrighted','True')]:
   bad=copy.deepcopy(row);bad['extmetadata'][key]['value']=value;self.assertFalse(animal.fws_allowed(bad))
 def test_imitation_never_fills_recording_gap(self):
  row={'licenses':['https://creativecommons.org/publicdomain/zero/1.0/'],'text':'Recording of a dog barking'}
  self.assertTrue(animal.oga_allowed(row))
  self.assertFalse(animal.oga_allowed({**row,'text':'Human imitation of a donkey'}))
  self.assertFalse(animal.oga_allowed({**row,'licenses':['https://creativecommons.org/licenses/by-nc/4.0/']}))
 def test_credit_cannot_drop_attribution_or_license_version(self):
  m={'sourceId':'inat_ccby','creator':'login','attribution':'(c) Full Artist Name (CC BY)','sourcePage':'https://www.inaturalist.org/observations/1','licenseId':'CC-BY-4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/'}
  self.assertEqual(recording_credit(m)['creator'],m['attribution'])
  for field,value in [('attribution',''),('sourcePage',''),('licenseUrl','https://creativecommons.org/licenses/by-nc/4.0/'),('licenseUrl','https://creativecommons.org/licenses/by/3.0/')]:
   with self.assertRaises(ValueError):recording_credit({**m,field:value})
if __name__=='__main__':unittest.main()
