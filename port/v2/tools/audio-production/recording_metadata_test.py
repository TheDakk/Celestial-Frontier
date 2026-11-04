import unittest,json,importlib.util
from pathlib import Path
from acquire import BASE
from report import recording_credit
spec=importlib.util.spec_from_file_location('metadata',Path(__file__).with_name('recording-metadata.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class RecordingMetadataControls(unittest.TestCase):
 def test_two_profile_names_never_replace_exact_recording_credit(self):
  media=json.loads((BASE/'manifests/acquisition.json').read_text())['media']
  for sound_id in [619339,858791]:
   row=next(m for m in media if m.get('soundId')==sound_id);credit=module.verified_credit(row)
   self.assertEqual(credit['creator'],row['attribution']);self.assertNotEqual(credit['creator'],row['creator'])
   current={**{k:v for k,v in row.items() if k!='creator'},'creatorProfileName':row['creator']}
   self.assertEqual(module.verified_credit(current),credit)
   for mutant in [{**current,'attribution':current['creatorProfileName']},{**current,'attribution':''}]:
    with self.assertRaises(ValueError):module.verified_credit(mutant)
 def test_legacy_unattributed_reader(self):
  self.assertEqual(recording_credit({'sourceId':'old','licenseId':'CC0-1.0','creator':'legacy'})['creator'],'legacy')
if __name__=='__main__':unittest.main()
