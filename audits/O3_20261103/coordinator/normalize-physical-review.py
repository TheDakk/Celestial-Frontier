"""Validated paperwork view of a frozen physical review; never changes a verdict."""
from pathlib import Path
import hashlib,json,struct,sys
source,out,planfile=map(Path,sys.argv[1:]);assert not out.exists()
raw=json.loads(source.read_text());plan=json.loads(planfile.read_text())[0];native=Path(plan['nativeDir']).resolve(strict=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
value=json.loads(json.dumps(raw));assert raw['status'] in ['PHYSICAL_CLEAN','PHYSICAL_HOLD'];assert raw['producerCommit']==plan['sourceHead']==json.loads((native/'report.json').read_text())['source']
media=raw['film'];assert isinstance(media,dict);file=media.get('path',media.get('filepath'));p=Path(file).resolve(strict=True);assert p.parent==native and p.name=='battle-full.webm';assert sha(p)==media['sha256'];assert media.get('bytes',p.stat().st_size)==p.stat().st_size
value['film']={**media,'path':str(p)}
expected={'turn1-hit-reaction-50','turn2-dodge-reaction-50','turn3-hit-reaction-50','turn3-hit-idle-50','turn3-hit-idle-90'};seen=set();assert len(raw['frames'])==5
for f in value['frames']:
 pin=f.get('file',f);file=pin.get('path',pin.get('filepath'));p=Path(file).resolve(strict=True);assert p.parent==native and p.suffix=='.png' and p.stem in expected and p.stem not in seen;seen.add(p.stem);assert sha(p)==pin['sha256'];data=p.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';assert struct.unpack('>II',data[16:24])==(1024,576);assert pin.get('bytes',len(data))==len(data);assert f['independentFullsizeViewed'] is True;f['file']={'path':str(p),'sha256':pin['sha256'],'bytes':len(data)}
assert seen==expected
value['paperworkNormalization']={'originalReview':{'path':str(source),'sha256':sha(source)},'changes':['film.filepath is also exposed as film.path','direct frame pins are also exposed as frame.file'],'verdictChanged':False,'observationsChanged':False,'producerChanged':False,'mediaBytesChanged':False,'reviewerIdentityChanged':False,'priorPrecheck':'Root checkpoint helper rejected the frozen filepath schema before creating output; no product stage, measure, review or retry occurred.'}
out.write_text(json.dumps(value,indent=2)+'\n');assert sha(source)==value['paperworkNormalization']['originalReview']['sha256'];print(out)
