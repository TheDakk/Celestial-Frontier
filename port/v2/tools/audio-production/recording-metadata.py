"""Offline successor ledger. Never rewrites historical acquisition or source audio."""
import json,hashlib,sys
from pathlib import Path
from acquire import BASE
from report import recording_credit

def verified_credit(media):
    evidence=media['itemEvidence']; raw=(BASE/evidence['path']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=evidence['sha256']:raise ValueError('Changed recording evidence')
    sounds=[sound for obs in json.loads(raw)['results'] for sound in obs.get('sounds',[]) if sound['id']==media['soundId']]
    if len(sounds)!=1 or sounds[0].get('attribution')!=media.get('attribution'):raise ValueError('Recording attribution differs from exact sound evidence')
    return recording_credit(media)

def current_rows(acquisition):
    return [{**{k:v for k,v in m.items() if k!='creator'},'creatorProfileName':m.get('creatorProfileName',m.get('creator')),'recordingCredit':verified_credit(m)} for m in acquisition['media'] if m.get('sourceId')=='inat_ccby']
if __name__=='__main__':
    source=BASE/'manifests/acquisition.json';raw=source.read_bytes();rows=current_rows(json.loads(raw))
    with Path(sys.argv[1]).open('x') as f:json.dump({'schema':'cf.recording-metadata.v2','sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceUnchanged':True,'rows':rows},f,indent=2,ensure_ascii=False);f.write('\n')
