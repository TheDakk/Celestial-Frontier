"""Copy exact generator output into a new packet, never resize or repaint it."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

packet = Path(sys.argv[1])
source = Path(sys.argv[2]).expanduser()
base = Path('audits/C243_ALLOUT_20261011/execution')
assert packet.is_relative_to(base) and packet.is_dir()
assert source.is_file() and source.suffix.lower() == '.png'
assert not (packet / 'master.png').exists()
request = json.loads((packet / 'request.json').read_text())
digest = lambda data: hashlib.sha256(data).hexdigest()
prompt_hash = digest((packet / 'prompt.txt').read_bytes())
assert prompt_hash == request['promptSha256']
shutil.copyfile(source, packet / 'master.png')
assert source.read_bytes() == (packet / 'master.png').read_bytes()
receipt = {
    'tool': 'image_gen.imagegen',
    'sourcePath': str(source).replace(str(Path.home()), '~'),
    'masterSha256': digest(source.read_bytes()),
    'promptSha256': prompt_hash,
    'outputModified': False,
    'sourceHead': request['sourceHead'],
}
(packet / 'generation.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
