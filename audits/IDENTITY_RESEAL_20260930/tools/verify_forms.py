"""Per-form proof scan over everything reachable from branches + tags. Identity strings come from argv.
usage: verify_forms.py <repo.git> <email> <account> <CapName> [<compare-repo.git>]
With a compare repo (the backup), also prints the leave-alone phrase counts in both, to prove they survived."""
import sys, subprocess, re, gzip, io, zipfile, threading, collections
repo, email, acct, cap = sys.argv[1], sys.argv[2].encode(), sys.argv[3].encode(), sys.argv[4].encode()
cmp_repo = sys.argv[5] if len(sys.argv) > 5 else None
low, up = cap.lower(), cap.upper()
B = rb'(?<![A-Za-z0-9])'; E = rb'(?![A-Za-z0-9])'
FORMS = {
    '1 identity email (author/committer/tagger)': None,
    '2 message <Name>/<NAME> word': re.compile(B + rb'(?:' + cap + rb'|' + up + rb')' + E),
    '3 text <Name>/<NAME> word': re.compile(B + rb'(?:' + cap + rb'|' + up + rb')' + E),
    '4 home path /Users/<n>/ file:///Users/<n>/ \\Users\\<n>': re.compile(rb'(?:[\\/]{1,2})users(?:[\\/]{1,2})' + low + E, re.I),
    '5 encoded -Users-<n>-': re.compile(rb'-users-' + low + rb'-', re.I),
    '6 "owner": "<n>"': re.compile(rb'"owner"\s*:\s*"' + low + rb'"'),
    '7 identity file/folder names': re.compile(B + rb'(?:' + cap + rb'|' + up + rb')' + E + rb'|' + B + low + rb'-(?:game-toolchain|audit|review|onebyone|strict|anatomy|template)'),
    'email/account anywhere': re.compile(re.escape(email) + rb'|' + re.escape(acct), re.I),
}
KEEP = [b'three nick marks', b'nick-cut toes', b'nick out of it', b'white nick for an eye', b'Nicholas Moray Williams', b'nickname', b'nicked', b'nickel']
def git(r, *a):
    return subprocess.run(['git', '-C', r, *a], capture_output=True).stdout
def scan(r):
    out = collections.Counter()
    refs = ['--branches', '--tags']
    for l in git(r, 'log', *refs, '--format=%ae%x09%ce').split(b'\n'):
        if email.lower() in l.lower(): out['1 identity email (author/committer/tagger)'] += 1
    for l in git(r, 'for-each-ref', 'refs/tags', '--format=%(taggeremail)%09%(contents)').split(b'\n'):
        if email.lower() in l.lower(): out['1 identity email (author/committer/tagger)'] += 1
        out['2 message <Name>/<NAME> word'] += len(FORMS['2 message <Name>/<NAME> word'].findall(l))
    for rec in git(r, 'log', *refs, '--format=%B%x00').split(b'\0'):
        out['2 message <Name>/<NAME> word'] += len(FORMS['2 message <Name>/<NAME> word'].findall(rec))
        out['email/account anywhere'] += len(FORMS['email/account anywhere'].findall(rec))
    objs = git(r, 'rev-list', *refs, '--objects').split(b'\n')
    blobs = set(); names = set()
    for o in objs:
        if b' ' in o:
            sha, path = o.split(b' ', 1); blobs.add(sha.decode()); names.add(path)
    for n in names:
        if FORMS['7 identity file/folder names'].search(n): out['7 identity file/folder names'] += 1
    kinds = dict(l.split()[:2] for l in git(r, 'cat-file', '--batch-check=%(objectname) %(objecttype)', '--batch-all-objects').decode().split('\n') if l)
    blob_list = [b for b in blobs if kinds.get(b) == 'blob']
    keep = collections.Counter()
    p = subprocess.Popen(['git', '-C', r, 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    def feed():
        for b in blob_list: p.stdin.write((b + '\n').encode())
        p.stdin.close()
    threading.Thread(target=feed, daemon=True).start()
    def text_forms(d, readable_only=False):
        segs = re.findall(rb'[\x20-\x7e]{6,}', d) if readable_only else [d]
        for s in segs:
            for k in ('3 text <Name>/<NAME> word', '4 home path /Users/<n>/ file:///Users/<n>/ \\Users\\<n>', '5 encoded -Users-<n>-', '6 "owner": "<n>"', 'email/account anywhere'):
                out[k] += len(FORMS[k].findall(s))
    for _ in blob_list:
        h = p.stdout.readline().split(); d = p.stdout.read(int(h[2])); p.stdout.read(1)
        inner = [d]
        if d[:2] == b'\x1f\x8b':
            try: inner = [gzip.decompress(d)]
            except Exception: pass
        elif d[:4] == b'PK\x03\x04':
            try:
                z = zipfile.ZipFile(io.BytesIO(d)); inner = [z.read(n) for n in z.namelist()] + [n.encode() for n in z.namelist()]
            except Exception: pass
        for x in inner:
            media = x[:8] == b'\x89PNG\r\n\x1a\n' or x[:3] == b'\xff\xd8\xff' or x[:4] in (b'\x1a\x45\xdf\xa3', b'GIF8', b'RIFF', b'OggS', b'wOFF', b'wOF2', b'OTTO') or x[4:8] == b'ftyp'
            if media: continue
            text_forms(x, readable_only=b'\0' in x)
            for k in KEEP: keep[k] += x.count(k)
    return out, keep, len(blob_list)
out, keep, nb = scan(repo)
print(repo.rsplit('/', 1)[-1], '| blobs reachable from branches+tags:', nb)
for k in FORMS: print(f'  {out[k]:8d}  {k}')
if cmp_repo:
    _, keep0, _ = scan(cmp_repo)
    print('  leave-alone phrases (backup -> rewrite):')
    for k in KEEP: print(f'    {keep0[k]:6d} -> {keep[k]:6d}  {k.decode()}')
