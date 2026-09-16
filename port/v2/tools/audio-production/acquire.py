#!/usr/bin/env python3
"""Approved manifest acquisition. Original bytes, evidence and failures survive reruns.
No credentials, paid endpoints, executable archive contents or implicit species claims.
"""
import argparse, hashlib, html, json, os, re, stat, subprocess, tempfile, time
import urllib.error, urllib.parse, urllib.request, zipfile
from pathlib import Path, PurePosixPath
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'audio-production'
MANIFEST = ROOT / 'celestial-frontier-audio-handoff/audio-sources.json'
ALLOWED_HOSTS = {'kenney.nl', 'opengameart.org', 'www.nps.gov', 'nps.gov', 'creativecommons.org', 'api.inaturalist.org', 'www.inaturalist.org', 'static.inaturalist.org', 'inaturalist-open-data.s3.amazonaws.com', 'www.fisheries.noaa.gov', 'media.fisheries.noaa.gov'}
AUDIO = {'.wav', '.ogg', '.mp3', '.flac', '.aif', '.aiff', '.m4a', '.opus'}
SAFE = AUDIO | {'.txt', '.md', '.pdf', '.html', '.url', '.png', '.jpg', '.jpeg', '.license'}
NATURAL = {'Amphibians', 'Birds', 'Geological', 'Hydrological', 'Insects', 'Mammals', 'Meteorological', 'Reptiles'}
SUPPLEMENT = BASE / 'manifests/supplemental-sources.json'

def source_manifest():
    original=json.loads(MANIFEST.read_text())
    extra=json.loads(SUPPLEMENT.read_text())['sources'] if SUPPLEMENT.exists() else []
    sources=original['sources']+extra
    if len({s['id'] for s in sources})!=len(sources): raise ValueError('Duplicate supplemental source identity')
    for s in extra:
        if s['license_id'] not in ('CC0-1.0','Public-Domain'): raise ValueError('Supplemental license requires approval')
        safe_url(s['source_page_url'])
    return {**original,'sources':sources}


def digest(data): return hashlib.sha256(data).hexdigest()
def sha_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()
def write_json(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=p.parent, delete=False) as f:
        f.write((json.dumps(data, indent=2, ensure_ascii=False)+'\n').encode()); name=f.name
    os.replace(name,p)
def safe_url(url):
    p = urllib.parse.urlsplit(url)
    if p.scheme != 'https' or p.hostname not in ALLOWED_HOSTS or p.username or p.password or p.port not in (None,443):
        raise ValueError('Unapproved HTTPS origin: '+url)
    return url
class Redirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, code, msg, headers, safe_url(newurl))

class Page(HTMLParser):
    def __init__(self, text, url):
        super().__init__(); self.url=url; self.links=[]; self.media=[]; self.stack=[]; self.current=None
        self.heading=None; self.section=''; self.text=[]; self.suppressed=0; self.mediaTitles={}; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('script','style'): self.suppressed+=1
        if tag == 'div': self.stack.append(a.get('class',''))
        if tag in ('h2','h3'): self.heading=[]
        if tag == 'a' and a.get('href'):
            self.current={'url':urllib.parse.urljoin(self.url,a['href']), 'attrs':a,'text':'','section':self.section,
                          'originalFiles':any('field-name-field-art-files' in c for c in self.stack)}
        if tag == 'source' and a.get('src') and a.get('type','').startswith('audio/'):
            media=urllib.parse.urljoin(self.url,a['src']); self.media.append(media); self.mediaTitles[media]=self.section
    def handle_data(self, text):
        if self.suppressed: return
        self.text.append(text)
        if self.current: self.current['text']+=text
        if self.heading is not None: self.heading.append(text)
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.suppressed=max(0,self.suppressed-1)
        if tag=='div' and self.stack: self.stack.pop()
        if tag=='a' and self.current: self.links.append(self.current); self.current=None
        if tag in ('h2','h3') and self.heading is not None:
            self.section=''.join(self.heading).strip(); self.heading=None
    def plain(self): return re.sub(r'\s+',' ',' '.join(self.text)).strip()

def archive_members(z):
    members=z.infolist()
    if len(members)>20000 or sum(i.file_size for i in members)>4*1024**3: raise ValueError('Archive expansion budget')
    seen=set()
    for i in members:
        p=PurePosixPath(i.filename); mode=i.external_attr>>16
        if p.is_absolute() or '..' in p.parts or '\\' in i.filename or ':' in i.filename or '\x00' in i.filename:
            raise ValueError('Archive traversal: '+i.filename)
        if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0,stat.S_IFREG,stat.S_IFDIR)):
            raise ValueError('Archive special file: '+i.filename)
        key=str(p).casefold()
        if key in seen: raise ValueError('Archive duplicate/case collision: '+i.filename)
        seen.add(key)
        if i.file_size>512*1024**2 or (i.file_size>1024**2 and i.file_size/max(1,i.compress_size)>1000):
            raise ValueError('Archive member expansion budget: '+i.filename)
    return members

class Acquisition:
    def __init__(self):
        self.cache_path=BASE/'manifests/download-cache.json'
        self.cache=json.loads(self.cache_path.read_text()) if self.cache_path.exists() else {}
        self.receipt={'schema':'cf.audio-acquisition/v1','manifestSha256':sha_file(MANIFEST),'sources':[], 'media':[], 'gaps':[]}
        self.opener=urllib.request.build_opener(Redirect()); self.last_request=0
    def fetch(self,url,folder,limit=512*1024**2):
        safe_url(url)
        if url in self.cache:
            r=self.cache[url]; p=BASE/r['path']
            if not p.is_file() or sha_file(p)!=r['sha256']: raise ValueError('Cached original hash mismatch: '+str(p))
            return r
        # One connection at a time. Retry only transient responses, honour modest backoff.
        for attempt in range(3):
            time.sleep(max(0,.3-(time.monotonic()-self.last_request))); self.last_request=time.monotonic()
            try:
                req=urllib.request.Request(url,headers={'User-Agent':'CelestialFrontierAudioAcquisition/1.0 (personal game asset intake)'})
                with self.opener.open(req,timeout=120) as response:
                    safe_url(response.url); data=response.read(limit+1)
                    if len(data)>limit: raise ValueError('Download exceeds byte budget')
                    headers=dict(response.headers); final=response.url
                break
            except urllib.error.HTTPError as e:
                if e.code not in (429,500,502,503,504) or attempt==2: raise
                delay=e.headers.get('Retry-After','')
                if delay.isdigit() and int(delay)>60: raise
                time.sleep(max(2**(attempt+1),int(delay) if delay.isdigit() else 0))
        name=Path(urllib.parse.unquote(urllib.parse.urlsplit(final).path)).name or 'index.html'
        name=re.sub(r'[^a-zA-Z0-9._-]','_',name)[:180]
        sha=digest(data); p=BASE/folder/(sha[:16]+'-'+name)
        p.parent.mkdir(parents=True,exist_ok=True)
        if p.exists():
            if sha_file(p)!=sha: raise ValueError('Original collision')
        else:
            with p.open('xb') as f: f.write(data)
        r={'url':url,'finalUrl':final,'filename':name,'path':str(p.relative_to(BASE)), 'sha256':sha,'bytes':len(data),
           'fetchedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'contentType':headers.get('Content-Type',headers.get('content-type','unknown'))}
        self.cache[url]=r; write_json(self.cache_path,self.cache); return r
    def page(self,url,source_id):
        r=self.fetch(url,'license-evidence/'+source_id,8*1024**2)
        text=(BASE/r['path']).read_text(errors='replace')
        return Page(text,url),r
    def gap(self,source_id,url,error):
        self.receipt['gaps'].append({'sourceId':source_id,'url':url,'reason':str(error),'status':'unresolved','retry':'explicit future fetch; no access bypass'})
    def audio(self,p,metadata):
        result=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)],capture_output=True,text=True,timeout=30)
        if result.returncode: raise ValueError('Audio decode metadata failed: '+result.stderr[:300])
        info=json.loads(result.stdout); streams=[s for s in info['streams'] if s['codec_type']=='audio']
        if len(streams)!=1 or any(s['codec_type']=='video' and not s.get('disposition',{}).get('attached_pic') for s in info['streams']):
            raise ValueError('Expected one audio stream without video')
        s=streams[0]
        self.receipt['media'].append({**metadata,'path':str(p.relative_to(BASE)),'sha256':sha_file(p),'bytes':p.stat().st_size,
           'codec':s.get('codec_name','unknown'),'sampleRate':int(s['sample_rate']) if s.get('sample_rate') else None,
           'channels':s.get('channels'), 'duration':float(info['format']['duration']) if info['format'].get('duration') else None,
           'container':info['format'].get('format_name'), 'listeningStatus':'not_reviewed','integrationStatus':'source_only'})
    def ingest(self,r,metadata):
        p=BASE/r['path']
        if zipfile.is_zipfile(p):
            with zipfile.ZipFile(p) as z:
                members=archive_members(z) # Validate the entire archive before any extraction.
                for i in members:
                    if i.is_dir(): continue
                    ext=PurePosixPath(i.filename).suffix.lower()
                    if ext not in SAFE:
                        self.gap(metadata['sourceId'],r['url'],'Archive member not extracted (unsupported/non-audio): '+i.filename); continue
                    data=z.read(i); sha=digest(data)
                    dst=BASE/'source-audio'/metadata['sourceId']/(sha[:16]+'-'+re.sub(r'[^a-zA-Z0-9._-]','_',Path(i.filename).name))
                    dst.parent.mkdir(parents=True,exist_ok=True)
                    if dst.exists():
                        if sha_file(dst)!=sha: raise ValueError('Extracted original collision')
                    else:
                        with dst.open('xb') as f: f.write(data)
                    if ext in AUDIO: self.audio(dst,{**metadata,'originalMember':i.filename,'archiveSha256':r['sha256'],'download':r})
        else: self.audio(p,{**metadata,'download':r})
    def run(self,only=None):
        previous=BASE/'manifests/acquisition.json'
        if only and previous.exists():
            old=json.loads(previous.read_text())
            for key in ('sources','media','gaps'):
                self.receipt[key]=[r for r in old[key] if r.get('sourceId',r.get('id')) not in only]
        for source in source_manifest()['sources']:
            if only and source['id'] not in only: continue
            sid=source['id']; url=source['source_page_url']; rec={'id':sid,'status':'RUNNING','downloads':[]}
            self.receipt['sources'].append(rec); print('SOURCE',sid,flush=True)
            try:
                page,evidence=self.page(url,sid); rec['evidence']=evidence
                plain=page.plain()
                if source['kind']=='collection':
                    if 'public domain' not in plain.lower(): raise ValueError('No collection public-domain statement; quarantine pending review')
                    details=[]
                    for link in page.links:
                        u=link['url']; p=urllib.parse.urlsplit(u)
                        if p.hostname!='www.nps.gov': continue
                        if sid=='nps_yellowstone' and '/yell/learn/photosmultimedia/sounds-' in p.path and link['text'].strip() not in ('Snowmobile','Horse-Drawn Wagon'):
                            details.append(link)
                        elif sid=='nps_natural_sounds' and (link['section'] in NATURAL or link['text'].strip()=='Chickens') and p.path.startswith('/subjects/sound/') and p.path.endswith('.htm'):
                            details.append(link)
                        elif sid=='nps_rocky_mountain' and p.path.startswith('/romo/learn/photosmultimedia/sounds-') and p.path.endswith('.htm'):
                            details.append({**link,'url':urllib.parse.urlunsplit(p._replace(fragment=''))})
                    rec['detailPages']=len({x['url'] for x in details})
                    for link in {x['url']:x for x in details}.values():
                        try:
                            detail,proof=self.page(link['url'],sid)
                            if not detail.media: raise ValueError('No official audio source element on detail page')
                            text=detail.plain()
                            # Preserve full item text, including each recordist and description; no photo-credit inference.
                            for media in dict.fromkeys(detail.media):
                                try:
                                    download=self.fetch(media,'source-audio/'+sid)
                                    self.ingest(download,{'sourceId':sid,'sourceKind':'wildlife_or_environment_recording','title':link['text'].strip(),
                                       'category':link['section'],'recordingTitle':detail.mediaTitles.get(media,''),'licenseId':source['license_id'],'licenseEvidence':evidence,
                                       'itemEvidence':proof,'itemMetadataText':text,'creator':'See item Credit / Author in preserved metadata'})
                                    rec['downloads'].append(download)
                                except Exception as e: self.gap(sid,media,e)
                        except Exception as e: self.gap(sid,link['url'],e)
                else:
                    if not any('creativecommons.org/publicdomain/zero/1.0' in x['url'] for x in page.links):
                        raise ValueError('CC0 link absent; rights quarantine pending review')
                    links=[l for l in page.links if l['attrs'].get('id')=='donate-text'] if sid.startswith('kenney_') else [l for l in page.links if l['originalFiles']]
                    if not links: raise ValueError('No original File(s)/free-download link')
                    for link in links:
                        try:
                            download=self.fetch(link['url'],'source-archives/'+sid)
                            self.ingest(download,{'sourceId':sid,'sourceKind':'designed_sound_or_music','creator':source['creator'],
                                'licenseId':source['license_id'],'licenseEvidence':evidence,'notes':source.get('notes'), 'sourcePage':url})
                            rec['downloads'].append(download)
                        except Exception as e: self.gap(sid,link['url'],e)
                rec['status']='ACQUIRED_WITH_GAPS' if any(g['sourceId']==sid for g in self.receipt['gaps']) else 'ACQUIRED'
            except Exception as e: rec['status']='BLOCKED'; self.gap(sid,url,e)
            write_json(BASE/'manifests/acquisition.json',self.receipt)
            write_json(BASE/'manifests/acquisition-gaps.json',self.receipt['gaps'])
        groups={}
        for m in self.receipt['media']: groups.setdefault(m['sha256'],[]).append({'sourceId':m['sourceId'],'path':m['path']})
        self.receipt['duplicateProvenance']={k:v for k,v in groups.items() if len(v)>1}
        write_json(BASE/'manifests/acquisition.json',self.receipt)
        print(json.dumps({'sources':len(self.receipt['sources']),'audio':len(self.receipt['media']),'gaps':len(self.receipt['gaps'])}))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('command',choices=['fetch','verify']); parser.add_argument('--only',nargs='+'); args=parser.parse_args()
    if args.command=='fetch': Acquisition().run(args.only)
    else:
        r=json.loads((BASE/'manifests/acquisition.json').read_text())
        paths={m['path']:m['sha256'] for m in r['media']}
        cache=json.loads((BASE/'manifests/download-cache.json').read_text())
        paths.update({m['path']:m['sha256'] for m in cache.values()})
        for p,h in paths.items():
            if sha_file(BASE/p)!=h: raise ValueError('Hash mismatch: '+p)
        print(json.dumps({'status':'PASS','verifiedFiles':len(paths)}))
