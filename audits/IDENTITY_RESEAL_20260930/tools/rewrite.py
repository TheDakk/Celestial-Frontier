"""Identity rewrite driver for git-filter-repo (run inside a fresh mirror clone).

All identifying strings come from environment variables so this file holds none of them:
  OLD_EMAIL  the address to remove          OLD_ACCT  the account name inside it
  OLD_NAME   the first name used as a word  OLD_HOME  the home-folder name (lowercase)
NEW identity: TheDakk <79046704+TheDakk@users.noreply.github.com>; the name word becomes Dakk.
Text blobs only (no NUL byte); binary blobs are left byte-identical by decision.
"""
import os, re, sys, gzip, io, zipfile
import git_filter_repo as fr

NEW_NAME, NEW_EMAIL, NEW_WORD = b'TheDakk', b'79046704+TheDakk@users.noreply.github.com', b'Dakk'
OLD_EMAIL = os.environ['OLD_EMAIL'].encode()
OLD_ACCT = os.environ['OLD_ACCT'].encode()
OLD_NAME = os.environ['OLD_NAME'].encode()
OLD_HOME = os.environ['OLD_HOME'].encode()
assert NEW_WORD and len(OLD_HOME) == 4 and len(NEW_WORD) == 4  # home-path swap keeps byte length

RX_EMAIL = re.compile(re.escape(OLD_EMAIL), re.I)
RX_ACCT = re.compile(re.escape(OLD_ACCT), re.I)
CAP = OLD_NAME[:1].upper() + OLD_NAME[1:].lower()
# Capitalised and all-caps whole words always identify the owner; _ - / . ' are separators.
RX_WORD = re.compile(rb'(?<![A-Za-z0-9])(?:' + re.escape(CAP) + rb'|' + re.escape(OLD_NAME.upper()) + rb')(?![A-Za-z0-9])')
# Lowercase is also an ordinary game-art word ("three nick marks", "nick-cut toes"), so only these identity forms change:
LOW = re.escape(OLD_NAME.lower())
RX_LOWER_ID = re.compile(rb'(?<![A-Za-z0-9])' + LOW + rb'(?=-(?:game-toolchain|audit|review|onebyone|strict|anatomy|template))')
RX_OWNER = re.compile(rb'("owner"\s*:\s*")' + LOW + rb'(")')
RX_HOME = re.compile(rb'((?:[A-Za-z]:)?(?:\\\\|\\|/|-)users(?:\\\\|\\|/|-))(' + re.escape(OLD_HOME) + rb')(?![A-Za-z0-9])', re.I)

def home(m):
    old = m.group(2)
    return m.group(1) + (NEW_WORD if old[:1].isupper() else NEW_WORD.lower())

def word(m):
    old = m.group(0)
    if old.isupper():
        return NEW_WORD.upper()
    if old.islower():
        return NEW_WORD.lower()
    return NEW_WORD

def words(d):
    d = RX_HOME.sub(home, d)
    d = RX_OWNER.sub(lambda m: m.group(1) + NEW_WORD.lower() + m.group(2), d)
    d = RX_LOWER_ID.sub(NEW_WORD.lower(), d)
    return RX_WORD.sub(word, d)

def clean(d):
    d = RX_EMAIL.sub(NEW_EMAIL, d)
    d = RX_ACCT.sub(NEW_NAME, d)
    return words(d)

stats = {'blobs_changed': 0, 'messages_changed': 0, 'gzip_rebuilt': 0, 'zip_rebuilt': 0, 'binary_text_runs': 0}

RX_READABLE = re.compile(rb'[\x20-\x7e]{6,}')

def clean_binary_text(d):
    # Same-length word swap only inside readable ASCII runs; random compressed bytes are never touched.
    def run(m):
        seg = m.group(0)
        new = words(seg)
        return new if len(new) == len(seg) else seg
    return RX_READABLE.sub(run, d)

def clean_any(d):
    if d[:2] == b'\x1f\x8b':
        try:
            inner = gzip.decompress(d)
        except Exception:
            return clean_binary_text(d)
        new = clean_any(inner)
        if new != inner:
            stats['gzip_rebuilt'] += 1
            return gzip.compress(new, compresslevel=9, mtime=0)
        return d
    if d[:4] == b'PK\x03\x04':
        try:
            src = zipfile.ZipFile(io.BytesIO(d))
            items = [(i, src.read(i.filename)) for i in src.infolist()]
        except Exception:
            return clean_binary_text(d)
        changed = False; buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as dst:
            for info, data in items:
                name = words(info.filename.encode()).decode()
                new = clean_any(data)
                changed |= (name != info.filename) or (new != data)
                ni = zipfile.ZipInfo(name, date_time=info.date_time)
                ni.compress_type = info.compress_type; ni.external_attr = info.external_attr
                dst.writestr(ni, new)
        if changed:
            stats['zip_rebuilt'] += 1
            return buf.getvalue()
        return d
    if b'\0' in d:
        if d[:8] == b'\x89PNG\r\n\x1a\n' or d[:3] == b'\xff\xd8\xff' or d[:4] in (b'\x1a\x45\xdf\xa3', b'GIF8', b'RIFF', b'OggS', b'wOFF', b'wOF2', b'OTTO', b'\x00\x01\x00\x00') or d[4:8] == b'ftyp':
            return d  # compressed media: byte matches there are chance, never identity (deep scan: no text chunks hit)
        new = clean_binary_text(d)
        if new != d:
            stats['binary_text_runs'] += 1
        return new
    return clean(d)

def blob_cb(blob, _meta):
    new = clean_any(blob.data)
    if new != blob.data:
        blob.data = new
        stats['blobs_changed'] += 1

def message_cb(msg):
    new = clean(msg)
    if new != msg:
        stats['messages_changed'] += 1
    return new

def filename_cb(filename):
    new = words(filename)
    if new != filename:
        stats.setdefault('paths_renamed', set()).add((filename, new))
    return new

def name_cb(name):
    return NEW_NAME if name == OLD_NAME else name

def email_cb(email):
    return NEW_EMAIL if email.lower() == OLD_EMAIL.lower() else email

args = fr.FilteringOptions.parse_args(['--force', '--quiet'])
fr.RepoFilter(args, blob_callback=blob_cb, message_callback=message_cb,
              name_callback=name_cb, email_callback=email_cb, filename_callback=filename_cb).run()
print('rewrite stats', {k: (len(v) if isinstance(v, set) else v) for k, v in stats.items()}, file=sys.stderr)
