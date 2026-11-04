"""O1 audit-only proposal: one existing global owner, immutable serial jobs."""
from datetime import datetime
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import sys
import time

REPO = Path.home() / 'Projects/celestial-frontier-openai-mac'
CUTOFF = datetime.fromisoformat('2026-11-02T11:00:00+00:00').timestamp()
HELPER = REPO / 'audits/C504_D43_CERTIFICATION_20261020/coordinator/owned_processes.py'
sys.path.insert(0, str(HELPER.parent))
from owned_processes import OwnedChain


def pin(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def save(file, value):
    file = Path(file)
    temp = file.with_name(file.name + '.tmp')
    with temp.open('x') as stream:
        stream.write(json.dumps(value, indent=2) + '\n')
    os.replace(temp, file)


def inside_repo(value, directory=True):
    resolved = Path(value).resolve(strict=True)
    if not resolved.is_relative_to(REPO.resolve()) or (directory and not resolved.is_dir()):
        raise ValueError('Path must resolve inside the owned repository')
    return resolved


def parse_job(file):
    if file.is_symlink() or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', file.stem):
        raise ValueError('Plain JSON file and fresh safe ID required')
    job = json.loads(file.read_text())
    if set(job) != {'id', 'argv', 'cwd'} or job['id'] != file.stem:
        raise ValueError('Exactly id/argv/cwd, with filename matching ID, required')
    if not isinstance(job['argv'], list) or not job['argv'] or any(
            not isinstance(arg, str) or '\0' in arg for arg in job['argv']):
        raise ValueError('argv must be a nonempty string array without NUL')
    job['cwd'] = str(inside_repo(job['cwd']))
    return job


def stop_before_dispatch(cancelled, stop_exists, now, cutoff=CUTOFF):
    if cancelled:
        return 'CANCELLED'
    if stop_exists:
        return 'STOP_FILE'
    if now >= cutoff:
        return 'CUTOFF'
    return None


def run_queue(queue, cutoff=CUTOFF):
    """Call only beneath with-toolchain-lock; tests use a custom lock path."""
    queue = inside_repo(queue)
    inbox = queue / 'inbox'
    inbox.mkdir(exist_ok=True)
    attempts = queue / 'attempts'
    attempts.mkdir(exist_ok=True)
    with (queue / 'started.json').open('x') as stream:
        json.dump(dict(pid=os.getpid(), pgid=os.getpgrp(), cutoffUnix=cutoff,
                       helper=str(HELPER), helperSha256=pin(HELPER)), stream)
    if os.getpid() != os.getpgrp():
        raise RuntimeError('Must be the existing toolchain-owned process-group leader')
    cancelled = False
    active = None
    def cancel(_signal, _frame):
        nonlocal cancelled
        cancelled = True
        if active is not None:
            active._cancel(_signal, _frame)
    signals = (signal.SIGTERM, signal.SIGINT, signal.SIGHUP, signal.SIGQUIT)
    def idle_handlers():
        for sig in signals:
            signal.signal(sig, cancel)
    idle_handlers()
    completed = {}
    reason = 'INTERNAL_ERROR'
    try:
        while True:
            reason = stop_before_dispatch(cancelled, (queue / 'STOP').exists(), time.time(), cutoff)
            if reason:
                break
            for file, digest in completed.items():
                if not Path(file).is_file() or pin(file) != digest:
                    raise RuntimeError('Submitted immutable job changed or disappeared: ' + file)
            pending = [file for file in sorted(inbox.glob('*.json')) if str(file) not in completed]
            if len(pending) > 1:
                raise RuntimeError('Publish only one immutable pending job at a time')
            if not pending:
                time.sleep(.2)
                continue
            file = pending[0]
            digest = pin(file)
            ident = file.stem
            if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', ident):
                raise RuntimeError('Unsafe submitted filename')
            out = attempts / ident
            out.mkdir()  # Fresh ID only, never reset/retry an attempted job.
            (out / 'submitted.json').write_bytes(file.read_bytes())
            if pin(out / 'submitted.json') != digest:
                raise RuntimeError('Submission changed while claiming it')
            result = dict(id=ident, jobSha256=digest, status='HOLD', startedUnix=time.time())
            try:
                job = parse_job(file)
            except Exception as exc:
                result['error'] = str(exc)
            else:
                reason = stop_before_dispatch(cancelled, (queue / 'STOP').exists(), time.time(), cutoff)
                if reason:
                    result.update(status='NOT_STARTED', stopReason=reason)
                    save(out / 'result.json', result)
                    break
                if pin(file) != digest:
                    raise RuntimeError('Submitted job changed before dispatch')
                active = OwnedChain(out)  # Existing helper unchanged; independent job only.
                idle_handlers()  # Preserve daemon cancellation and the helper's handler.
                old_cwd = Path.cwd()
                try:
                    os.chdir(job['cwd'])
                    active.run_stage('stage', job['argv'])  # shell=False in existing helper.
                    result['status'] = 'PASS'
                except Exception as exc:
                    result['error'] = str(exc)
                finally:
                    os.chdir(old_cwd)
                    active.drain()
                    cancelled = cancelled or active.cancelled
                    idle_handlers()
                stage = json.loads((out / 'stage.json').read_text())
                result.update(stage=str(out / 'stage.json'), log=str(out / 'stage.log'),
                              exitCode=stage.get('exitCode'))
                if stage.get('floorTermination') or stage.get('beforeGiB', 0) < 42:
                    result['floorStop'] = True
                    cancelled = True
                if cancelled:
                    result['status'] = 'HOLD_CANCELLED_OR_FLOOR'
                active = None
            result['endedUnix'] = time.time()
            save(out / 'result.json', result)
            completed[str(file)] = digest
            save(queue / 'state.json', dict(status='WAITING', last=result,
                                           completed=len(completed)))
    except BaseException as exc:
        reason = 'INTERNAL_ERROR'
        save(queue / 'error.json', dict(error=str(exc)))
    finally:
        if active is not None:
            active.drain()
        save(queue / 'terminal.json', dict(status='TERMINAL', reason=reason,
             completed=len(completed), endedUnix=time.time(), descendantsDrained=True))
    return 0 if reason in ('STOP_FILE', 'CUTOFF') else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--queue', required=True)
    args = parser.parse_args()
    os.chdir(REPO)
    raise SystemExit(run_queue(args.queue))
