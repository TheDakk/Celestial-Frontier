"""Zero-check a repo for identity leaks. Patterns come from argv so this file holds none of them.
usage: verify.py <repo.git> <email> <account> <name-word>
Checks: author/committer/tagger identities, commit + tag messages, every blob (text: all patterns;
binary: email/account only, since short words occur by chance in compressed data), every path."""
import sys, subprocess, re, threading, collections
repo, email, acct, word = sys.argv[1], sys.argv[2].encode(), sys.argv[3].encode(), sys.argv[4].encode()
RX = {
    'email': re.compile(re.escape(email), re.I),
    'account': re.compile(re.escape(acct), re.I),
    'name': re.compile(rb'(?<![A-Za-z0-9])' + re.escape(word) + rb'(?![A-Za-z0-9])', re.I),
}
def git(*a):
    return subprocess.run(['git', '-C', repo, *a], capture_output=True).stdout
fails = collections.Counter(); samples = collections.defaultdict(list)
def hit(kind, data, where, text_ok=True):
    for k, rx in RX.items():
        if not text_ok and k == 'name':
            continue
        m = rx.search(data)
        if m:
            fails[f'{kind}:{k}'] += 1
            if len(samples[f'{kind}:{k}']) < 5:
                samples[f'{kind}:{k}'].append(where)
for line in git('log', '--all', '--format=%an%x09%ae%x09%cn%x09%ce').split(b'\n'):
    hit('identity', line, line[:0] + b'commit identity')
for line in git('for-each-ref', 'refs/tags', '--format=%(taggername)%09%(taggeremail)%09%(contents)').split(b'\n\n'):
    hit('tag', line, b'tag')
for rec in git('log', '--all', '--format=%H%x09%B%x00').split(b'\0'):
    hit('message', rec, rec[:12])
objs = git('rev-list', '--all', '--objects').split(b'\n')
for o in objs:
    if b' ' in o:
        hit('path', o.split(b' ', 1)[1], o.split(b' ', 1)[1])
chk = git('cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype) %(objectsize)').decode().split('\n')
blobs = [l.split()[0] for l in chk if ' blob ' in l]
p = subprocess.Popen(['git', '-C', repo, 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
def feed():
    for b in blobs:
        p.stdin.write((b + '\n').encode())
    p.stdin.close()
threading.Thread(target=feed, daemon=True).start()
binary_name = 0
for _ in blobs:
    h = p.stdout.readline().split(); data = p.stdout.read(int(h[2])); p.stdout.read(1)
    is_bin = b'\0' in data
    hit('binary-blob' if is_bin else 'text-blob', data, h[0], text_ok=not is_bin)
    if is_bin and RX['name'].search(data):
        binary_name += 1
print(repo.rsplit('/', 1)[-1], 'blobs', len(blobs), 'FAILS', dict(fails) or 0,
      '| binary blobs with the word by chance (left by decision):', binary_name)
for k, v in samples.items():
    print('  ', k, [x.decode('utf8', 'replace')[:60] if isinstance(x, bytes) else x for x in v])
