import copy,unittest
from produce import validate_jobs

class ProductionAdmission(unittest.TestCase):
    def test_sources_are_exactly_ledger_bound_before_reaper_runs(self):
        media={'path':'source-audio/test/source.wav','sha256':'a'*64,'sourceId':'approved'}
        job={'id':'quadruped.call.1','group':'fictional-voices','duration':1,'channels':1,
             'layers':[{**media,'rate':1,'gain':.7,'delay':0}]}
        validate_jobs([job],{'media':[media]})
        with self.assertRaises(ValueError):validate_jobs([job],{'media':[{**media,'intakeStatus':'quarantined_decode_failure'}]})
        for field,value in [('path',''),('path','../../secret.wav'),('path','/private/secret.wav'),('path','source-audio/test/other.wav'),
                            ('sha256','b'*64),('sourceId','unapproved'),('rate',float('nan')),('gain',2)]:
            bad=copy.deepcopy(job);bad['layers'][0][field]=value
            with self.assertRaises(ValueError):validate_jobs([bad],{'media':[media]})
        for mutation in [{'channels':3},{'midi':[{'track':'../other','note':60,'start':0,'duration':.2,'gain':.5}]},
                         {'midi':[{'track':'melody','note':60,'start':.9,'duration':.2,'gain':.5}]}]:
            with self.assertRaises(ValueError):validate_jobs([{**job,**mutation}],{'media':[media]})
        with self.assertRaises(ValueError):validate_jobs([job,job],{'media':[media]})
        bad=copy.deepcopy(job);bad['group']='../escape'
        with self.assertRaises(ValueError):validate_jobs([bad],{'media':[media]})
    def test_high_level_recording_requires_measured_pre_render_attenuation(self):
        media={'path':'source-audio/test/overfull.mp3','sha256':'a'*64,'sourceId':'approved'}
        gain=10**((-9-8.8)/20)
        layer={**media,'rate':1,'gain':gain,'delay':0}
        proof={'sourceSha256':media['sha256'],'sourceDbTP':8.8,'priorGain':.65,'gain':gain,'duration':12}
        job={'id':'v4.reference.test','group':'ecology-fauna','duration':12,'channels':1,'layers':[layer],
             'recipeVersion':4,'kind':'recording','inputHeadroom':proof}
        validate_jobs([job],{'media':[media]})
        for bad in [{**job,'inputHeadroom':None},{**job,'layers':[{**layer,'gain':.65}],'inputHeadroom':{**proof,'gain':.65}},
                    {**job,'duration':8},{**job,'inputHeadroom':{**proof,'sourceSha256':'b'*64}}]:
            with self.assertRaises(ValueError):validate_jobs([bad],{'media':[media]})
if __name__=='__main__':unittest.main()
