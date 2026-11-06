import unittest
from wildlife import eligible
from acquire import Page
class WildlifeControls(unittest.TestCase):
    def test_media_rights_and_taxon_are_independent(self):
        obs={'quality_grade':'research','taxon':{'ancestor_ids':[1,41964]},'license_code':'cc-by-nc'}
        sound={'license_code':'cc0','file_url':'https://static.inaturalist.org/sounds/1.mp3','file_content_type':'audio/mpeg'}
        self.assertTrue(eligible(sound,obs,41964))
        for change in ({'license_code':'cc-by-nc'},{'license_code':None},{'hidden':True},{'flags':[1]},{'moderator_actions':[1]},{'file_content_type':'image/jpeg'}):
            self.assertFalse(eligible({**sound,**change},{**obs,'license_code':'cc0'},41964))
        self.assertFalse(eligible(sound,obs,41740)) # Sea lion is not a lion.
        self.assertFalse(eligible(sound,{**obs,'quality_grade':'needs_id'},41964))
        self.assertTrue(eligible(sound,{**obs,'obscured':True},41964)) # Geographic privacy does not hide the public licensed audio; coordinates are never exported.
    def test_each_nps_recording_keeps_own_heading(self):
        page=Page('<h3>Elk alarm bark</h3><audio><source src="alarm.mp3" type="audio/mp3"></audio><h3>Wind</h3><audio><source src="wind.mp3" type="audio/mp3"></audio>','https://www.nps.gov/example/')
        self.assertEqual(list(page.mediaTitles.values()),['Elk alarm bark','Wind'])
if __name__=='__main__':unittest.main()
