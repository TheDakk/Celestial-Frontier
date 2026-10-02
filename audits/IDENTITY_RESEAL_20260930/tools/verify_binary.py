"""Deep check of binary blobs: readable ASCII runs around a match, PNG text chunks, and the decompressed
contents of gzip/zip blobs. Patterns come from argv. usage: verify_binary.py <repo.git> <email> <account> <word>"""
import sys, subprocess, re, threading, zlib, gzip, io, zipfile, collections
repo = sys.argv[1]; pats = [re.compile(re.escape(a.encode()), re.I) for a in sys.argv[2:4]]
word = re.compile(rb'(?<![A-Za-z0-9])' + re.escape(sys.argv[4].encode()) + rb'(?![A-Za-z0-9])', re.I)
def any_hit(d):
    return any(p.search(d) for p in pats) or word.search(d)
paths = {}
for l in subprocess.run(['git', '-C', repo, 'rev-list', '--all', '--objects'], capture_output=True).stdout.split(b'\n'):
    if b' ' in l:
        s, p = l.split(b' ', 1); paths.setdefault(s.decode(), p.decode('utf8', 'replace'))
chk = subprocess.run(['git', '-C', repo, 'cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], capture_output=True, text=True).stdout.split('\n')
blobs = [l.split()[0] for l in chk if ' blob ' in l]
pr = subprocess.Popen(['git', '-C', repo, 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
def feed():
    for b in blobs: pr.stdin.write((b + '\n').encode())
    pr.stdin.close()
threading.Thread(target=feed, daemon=True).start()
out = collections.Counter(); ex = {}
for _ in blobs:
    h = pr.stdout.readline().split(); sha = h[0].decode(); d = pr.stdout.read(int(h[2])); pr.stdout.read(1)
    if b'\0' not in d: continue
    path = paths.get(sha, '?')
    inner = []
    if d[:2] == b'\x1f\x8b':
        try: inner.append(('gzip', gzip.decompress(d)))
        except Exception: pass
    if d[:4] == b'PK\x03\x04':
        try:
            z = zipfile.ZipFile(io.BytesIO(d))
            for n in z.namelist(): inner.append(('zip:' + n, n.encode() + b'\n' + z.read(n)))
        except Exception: pass
    if d[:8] == b'\x89PNG\r\n\x1a\n':
        i = 8
        while i + 8 <= len(d):
            ln = int.from_bytes(d[i:i+4], 'big'); typ = d[i+4:i+8]
            if typ in (b'tEXt', b'iTXt', b'zTXt'):
                body = d[i+8:i+8+ln]
                if typ == b'zTXt':
                    try: body = zlib.decompress(body.split(b'\0', 1)[1][1:])
                    except Exception: pass
                inner.append(('png-' + typ.decode(), body))
            i += 12 + ln
    for kind, data in inner:
        if any_hit(data):
            out[kind.split(':')[0]] += 1; ex.setdefault(kind.split(':')[0], (path, kind))
    for m in word.finditer(d):
        run = re.search(rb'[\x20-\x7e]{0,40}$', d[:m.start()]).group(0) + d[m.start():m.end()] + re.match(rb'[\x20-\x7e]{0,40}', d[m.end():]).group(0)
        if len(run) >= 16:
            out['readable-ascii'] += 1; ex.setdefault('readable-ascii', (path, run.decode('ascii', 'replace')))
print(repo.rsplit('/', 1)[-1], dict(out) or 'CLEAN', ex)
