import unittest
from noaa import permitted
class NoaaRightsControls(unittest.TestCase):
 def test_recording_owner_not_host_or_photo_owner(self):
  self.assertTrue(permitted('Haddock','https://www.fisheries.noaa.gov/s3/Meae-NOAA-PAGroup-01.mp3'))
  self.assertFalse(permitted('Blue Whale','https://www.fisheries.noaa.gov/s3/Cornell-blue.mp3'))
  self.assertFalse(permitted('Killer Whale','https://www.fisheries.noaa.gov/s3/AWI-clip.mp3'))
  self.assertFalse(permitted('Echosounder','https://www.fisheries.noaa.gov/s3/NOAA-PAGroup-01.mp3'))
if __name__=='__main__':unittest.main()
