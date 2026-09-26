import io,stat,unittest,zipfile
from acquire import archive_members,Page,safe_url

class AcquisitionControls(unittest.TestCase):
    def archive(self,names):
        b=io.BytesIO()
        with zipfile.ZipFile(b,'w') as z:
            for name in names:z.writestr(name,b'original')
        return zipfile.ZipFile(b)
    def test_paths_and_link(self):
        with self.archive(['folder/call.wav','License.txt']) as z:self.assertEqual(len(archive_members(z)),2)
        for name in ('../outside.wav','/outside.wav','C:/outside.wav','A\\outside.wav','x/../../outside.wav'):
            with self.archive([name]) as z:
                with self.assertRaises(ValueError):archive_members(z)
        with self.archive(['Call.wav','call.wav']) as z:
            with self.assertRaises(ValueError):archive_members(z)
        b=io.BytesIO()
        with zipfile.ZipFile(b,'w') as z:
            i=zipfile.ZipInfo('call.wav');i.external_attr=(stat.S_IFLNK|0o777)<<16;z.writestr(i,'/etc/passwd')
        with zipfile.ZipFile(b) as z:
            with self.assertRaises(ValueError):archive_members(z)
    def test_original_file_scope(self):
        p=Page('<a href="preview.ogg">Preview</a><div class="field-name-field-art-files"><a href="original.zip">File</a></div><a href="else.zip">Other</a>','https://opengameart.org/content/example')
        self.assertEqual([l['url'] for l in p.links if l['originalFiles']],['https://opengameart.org/content/original.zip'])
    def test_https_and_origin(self):
        self.assertEqual(safe_url('https://www.nps.gov/file.mp3'),'https://www.nps.gov/file.mp3')
        for url in ('http://www.nps.gov/file.mp3','https://www.nps.gov.evil.test/a','file:///etc/passwd','https://user:pass@www.nps.gov/a','https://www.nps.gov:8080/a'):
            with self.assertRaises(ValueError):safe_url(url)
if __name__=='__main__':unittest.main()
