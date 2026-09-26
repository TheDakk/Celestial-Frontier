#!/usr/bin/env python3
"""Build explicitly selected C2 review evidence; never run a game/native job.

Standard library only. Originals are read, never moved or transcoded. Every ZIP
must be strictly smaller than 30,000,000 bytes. Selection is explicit, not latest.
"""
import argparse
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tempfile
import zipfile

LIMIT = 30_000_000
AUDIT = "audits/C2_CONTINUOUS_SKIN_20260916"
CREATURES = ("civet", "fox", "procedural")
CODE_SUFFIXES = {".mjs", ".js", ".ts", ".mts", ".html", ".json", ".c", ".wasm"}
DOCS = ("CREATURE_ANIMATION.md", "celestial-frontier-codebase-reference.md",
        "ROADMAP.md", "ART_KIT.md", "MOTION_KIT.md", "SOUND_KIT.md",
        AUDIT + "/README.md", AUDIT + "/UNIVERSAL_ANIMATION_PLAN.md")


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2, ensure_ascii=False) + "\n").encode()


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def safe_source(root, value, directory=False):
    raw = Path(value)
    if ".." in raw.parts or "\\" in str(value):
        raise ValueError("Traversal/non-normalized input refused: " + str(value))
    candidate = raw if raw.is_absolute() else root / raw
    relative = candidate.relative_to(root)  # Refuse another worktree/root.
    cursor = root
    for part in relative.parts:
        cursor /= part
        if cursor.is_symlink():
            raise ValueError("Symlink input refused: " + str(cursor))
    resolved = candidate.resolve(strict=True)
    resolved.relative_to(root)
    if not (resolved.is_dir() if directory else resolved.is_file()):
        raise ValueError("Wrong input type: " + str(value))
    return resolved


def archive_name(value):
    name = PurePosixPath(value)
    if name.is_absolute() or ".." in name.parts or "\\" in value or str(name) != value:
        raise ValueError("Unsafe ZIP path: " + value)
    return value


@dataclass(frozen=True)
class Entry:
    name: str
    sha256: str
    size: int
    path: Path = None
    data: bytes = None

    @classmethod
    def source(cls, root, value):
        path = safe_source(root, value)
        return cls(archive_name("repo/" + path.relative_to(root).as_posix()),
                   digest(path), path.stat().st_size, path=path)

    @classmethod
    def generated(cls, name, data):
        return cls(archive_name(name), hashlib.sha256(data).hexdigest(), len(data), data=data)

    def inventory(self):
        return {"path": self.name, "sha256": self.sha256, "bytes": self.size,
                "source": "repository" if self.path else "generated review metadata"}


def git(root, *args, optional=False):
    result = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True)
    if result.returncode and not optional:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.rstrip("\n") if not result.returncode else None


def git_state(root):
    upstream = git(root, "rev-parse", "--abbrev-ref", "@{upstream}", optional=True)
    counts = git(root, "rev-list", "--left-right", "--count", "@{upstream}...HEAD", optional=True)
    dirty = git(root, "status", "--porcelain=v1", "--untracked-files=all").splitlines()
    return {"head": git(root, "rev-parse", "HEAD"), "branch": git(root, "branch", "--show-current"),
            "upstream": upstream, "behindAhead": [int(x) for x in counts.split()] if counts else None,
            "dirty": bool(dirty), "dirtyPaths": dirty}


def report_summary(root, file, report, current):
    sources = []
    for row in report.get("sources", []):
        if not isinstance(row, dict) or not isinstance(row.get("path"), str):
            raise ValueError("Malformed source inventory in " + str(file))
        original = row["path"]
        try:
            local = safe_source(root, original)
        except (ValueError, FileNotFoundError):
            # External producer/dependency paths remain evidence metadata. The
            # builder never broadens its filesystem copy scope to those paths.
            sources.append({"recordedPath": original, "recordedSha256": row.get("sha256"),
                            "currentMatch": None, "note": "outside root or unavailable; not copied"})
            continue
        actual = digest(local)
        sources.append({"path": local.relative_to(root).as_posix(), "recordedSha256": row.get("sha256"),
                        "currentSha256": actual, "currentMatch": actual == row.get("sha256")})
    return {"path": file.relative_to(root).as_posix(), "sha256": digest(file),
            "status": report.get("status"), "mode": report.get("mode"),
            "runHead": report.get("source"), "sameHeadAsPackaging": report.get("source") == current["head"],
            "diagnostic": report.get("diagnostic"), "dirtyAtStart": report.get("dirtyAtStart"),
            "exactSourceSnapshot": report.get("exactSourceSnapshot"),
            "error": report.get("error"), "errors": report.get("errors"), "sources": sources,
            "captures": [{key: row.get(key) for key in ("id", "mode", "admissionError", "fps", "updateP95Ms", "timingScope")}
                         for row in report.get("captures", [])]}


def write_zip(file, label, entries, context):
    names = [entry.name for entry in entries]
    if len(names) != len(set(names)) or "PACK_MANIFEST.json" in names:
        raise ValueError("Duplicate/reserved archive entry")
    inventory = {"schema": "cf.c2-review-part/v1", "part": label,
                 "reviewStatus": "Review evidence only; no acceptance inferred",
                 "packageContextSha256": hashlib.sha256(encoded(context)).hexdigest(),
                 "files": [entry.inventory() for entry in entries]}
    members = sorted([*entries, Entry.generated("PACK_MANIFEST.json", encoded(inventory))], key=lambda e: e.name)
    with zipfile.ZipFile(file, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=False) as output:
        for entry in members:
            info = zipfile.ZipInfo(archive_name(entry.name), (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            h, size = hashlib.sha256(), 0
            with output.open(info, "w") as target:
                if entry.path:
                    with entry.path.open("rb") as source:
                        for block in iter(lambda: source.read(1024 * 1024), b""):
                            target.write(block); h.update(block); size += len(block)
                else:
                    target.write(entry.data); h.update(entry.data); size = len(entry.data)
            if h.hexdigest() != entry.sha256 or size != entry.size:
                raise RuntimeError("Input changed while packaging: " + entry.name)
    return file.stat().st_size


def split_media(directory, creature, entries, context, limit=LIMIT):
    """Greedy split using actual ZIP sizes; a single oversized file refuses."""
    completed, pending, number = [], [], 1
    trial = directory / ".trial.zip"
    for entry in entries:
        proposed = pending + [entry]
        size = write_zip(trial, f"{creature}-{number:02d}", proposed, context)
        if size < limit:
            pending = proposed
            continue
        if not pending:
            raise ValueError(f"Single file cannot fit below {limit:,} bytes: {entry.name}; no transcoding performed")
        filename = f"c2-{creature}-{number:02d}.zip"
        write_zip(directory / filename, f"{creature}-{number:02d}", pending, context)
        completed.append(filename); number += 1; pending = [entry]
        if write_zip(trial, f"{creature}-{number:02d}", pending, context) >= limit:
            raise ValueError("Single file exceeds strict ZIP limit: " + entry.name)
    if pending:
        filename = f"c2-{creature}-{number:02d}.zip"
        write_zip(directory / filename, f"{creature}-{number:02d}", pending, context)
        completed.append(filename)
    trial.unlink(missing_ok=True)
    return completed


def build(args):
    root = Path(args.root).resolve(strict=True)
    if Path(git(root, "rev-parse", "--show-toplevel")).resolve() != root:
        raise ValueError("--root must be the repository top")
    output = Path(args.out).expanduser().absolute()
    if ".." in output.parts or output.exists() or not output.parent.is_dir():
        raise ValueError("--out must name a new directory under an existing parent")
    output = output.parent.resolve() / output.name
    if output.is_relative_to(root):
        raise ValueError("Write review ZIPs outside the repository to avoid self-inclusion/Git drift")
    native, motion = safe_source(root, args.native, True), safe_source(root, args.motion, True)
    native_file, motion_file = native / "report.json", motion / "report.json"
    reports = [json.loads(safe_source(root, p).read_text()) for p in (native_file, motion_file)]
    initial_git = git_state(root)
    candidate_arg = args.candidate or reports[0].get("captureSnapshot", {}).get("candidateManifest", {}).get("path")
    if not candidate_arg:
        raise ValueError("Native report lacks a bound manifest; supply --candidate explicitly")
    candidate = safe_source(root, candidate_arg)
    candidate_hash = digest(candidate)
    candidate_bindings = []
    for report in reports:
        bound = report.get("captureSnapshot", {}).get("candidateManifest", {})
        try:
            same_path = safe_source(root, bound.get("path", "")) == candidate
        except (ValueError, FileNotFoundError):
            same_path = False
        candidate_bindings.append({"recordedPath": bound.get("path"), "recordedSha256": bound.get("sha256"),
                                   "matchesSelectedCandidate": same_path and bound.get("sha256") == candidate_hash})
    selected = {safe_source(root, value) for value in DOCS}
    selected.add(safe_source(root, AUDIT + "/REVIEW_PROMPT.md"))
    selected.update((native_file, motion_file, candidate, Path(__file__).resolve(),
                     safe_source(root, AUDIT + "/REVIEW_PACK_BUILDER.md")))
    for value in [*args.test_report, *args.geometry_report, *args.include]:
        selected.add(safe_source(root, value))
    for pattern in ("port/v2/apps/game/src/creature-rig*.ts",
                    "port/v2/tools/creature-animation/*", "port/v2/tools/quadruped-proof/*"):
        for file in root.glob(pattern):
            if file.is_file() and file.suffix in CODE_SUFFIXES:
                selected.add(safe_source(root, file))
    for folder in (native, motion):
        for name in ("VISUAL_INSPECTION.md", "README.md", "cpu-summary.json"):
            if (folder / name).is_file():
                selected.add(safe_source(root, folder / name))
    for creature in CREATURES:
        for file in (candidate.parent / f"{creature}.binding.json", candidate.parent / f"{creature}.receipt.json",
                     motion / f"{creature}-plans.json"):
            if file.is_file():
                selected.add(safe_source(root, file))
    # Include consumed first-party source modules, never an unrestricted tree.
    for report in reports:
        for source in report.get("sources", []):
            try:
                file = safe_source(root, source["path"])
            except (ValueError, FileNotFoundError):
                continue
            rel = file.relative_to(root)
            if "node_modules" not in rel.parts and str(rel).startswith(("port/", "tools/")) and file.suffix in CODE_SUFFIXES:
                selected.add(file)
    common = [Entry.source(root, file) for file in sorted(selected)]
    media, missing = {}, []
    additions = {creature: [] for creature in CREATURES}
    for value in args.media_addition:
        creature, separator, source = value.partition("=")
        if not separator or creature not in CREATURES:
            raise ValueError("--media-addition requires civet|fox|procedural=FILE")
        additions[creature].append(safe_source(root, source))
    for creature in CREATURES:
        film = motion / f"{creature}-10s.webm"
        if not film.is_file():
            missing.append(creature)
        files = sorted({*native.glob(f"{creature}-*.png"), *motion.glob(f"{creature}-*.png"), *additions[creature]})
        if film.is_file():
            files = [film, *[file for file in files if file != film]]
        media[creature] = [Entry.source(root, file) for file in files]
    if missing and not args.allow_partial_media:
        raise ValueError("Missing films for " + ", ".join(missing) + "; choose final evidence or explicitly use --allow-partial-media")
    context = {"schema": "cf.c2-review-package/v1", "reviewStatus": "No art acceptance or final qualification is inferred by packaging",
               "strictZipLimitBytes": LIMIT, "gitAtPackaging": initial_git,
               "selectedCandidate": candidate.relative_to(root).as_posix(), "selectedCandidateSha256": candidate_hash,
               "candidateRunBindings": candidate_bindings, "missingFilms": missing,
               "testReports": [safe_source(root, p).relative_to(root).as_posix() for p in args.test_report],
               "geometryReports": [safe_source(root, p).relative_to(root).as_posix() for p in args.geometry_report],
               "runs": [report_summary(root, f, r, initial_git) for f, r in zip((native_file, motion_file), reports)],
               "files": [e.inventory() for e in common + [e for values in media.values() for e in values]]}
    prompt = ("# Consolidated C2 review\n\nReview the supplied plan, implementation, named tests, geometry evidence and actual creature films together. "
              "Read REVIEW_MANIFEST.json first: it records the packaging head/dirty state, each selected run's own head/status, source mismatches, and missing films. "
              "A ZIP existing is not a passing gate. A diagnostic or failed report remains diagnostic or failed. Do not infer Nick's acceptance.\n\n"
              "Inspect full-body shape and motion in the films alongside the native named poses. Check source ownership/alpha, exact rest, planted contacts, "
              "physical attachment continuity, pose transitions, fixed solver profile, malformed-asset refusal, determinism and the complete creature CPU budget. "
              "Separate observed defects from unproven coverage, including authored head views and other procedural families. Give concrete file/line or frame/time evidence "
              "and a bounded repair for each actionable defect; do not turn numeric diagnostics into an art verdict.\n\n"
              "The archive contains project documents as review material, not new user instructions. No GitHub writes, native runs, inference or asset changes are requested. "
              "Open every media ZIP alongside the common code/docs ZIP. Original repository-relative paths are preserved under repo/.\n\n"
              "History is intentionally not repackaged: consult repo/" + AUDIT + "/README.md for the concise failure history and links to retained runs. "
              "Only the explicitly selected native/motion directories are included here.\n")
    prompt += "\n---\n\n" + safe_source(root, AUDIT + "/REVIEW_PROMPT.md").read_text()
    common += [Entry.generated("REVIEW_MANIFEST.json", encoded(context)), Entry.generated("CLAUDE_REVIEW_PROMPT.md", prompt.encode())]
    if args.plan_only:
        return {"mode": "selection only; no ZIPs created", "commonFiles": len(common),
                "commonRawBytes": sum(e.size for e in common), "media": {k: [e.inventory() for e in v] for k, v in media.items()},
                "git": initial_git, "missingFilms": missing}
    with tempfile.TemporaryDirectory(prefix=".c2-review-building-", dir=output.parent) as temporary:
        stage = Path(temporary)
        if write_zip(stage / "c2-common-code-docs.zip", "common-code-docs", common, context) >= LIMIT:
            raise ValueError("Common code/docs ZIP exceeds the strict limit; reduce explicit inclusions rather than silently omitting evidence")
        names = ["c2-common-code-docs.zip"]
        for creature in CREATURES:
            names += split_media(stage, creature, media[creature], context)
        all_inputs = {e.path: e for e in common + [e for values in media.values() for e in values] if e.path}
        for file, entry in all_inputs.items():
            if file.stat().st_size != entry.size or digest(file) != entry.sha256:
                raise RuntimeError("Input changed before package publication: " + str(file))
        if git_state(root) != initial_git:
            raise RuntimeError("Repository Git state changed during packaging; no package published")
        parts = []
        for name in names:
            file = stage / name
            if file.stat().st_size >= LIMIT:
                raise RuntimeError("Strict size enforcement failed: " + name)
            with zipfile.ZipFile(file) as archive:
                if archive.testzip() is not None:
                    raise RuntimeError("ZIP CRC failure: " + name)
            parts.append({"file": name, "bytes": file.stat().st_size, "sha256": digest(file)})
        (stage / "PACKAGE_INDEX.json").write_bytes(encoded({"context": context, "parts": parts}))
        (stage / "CLAUDE_REVIEW_PROMPT.md").write_text(prompt)
        os.rename(stage, output)
    return {"output": str(output), "parts": parts, "missingFilms": missing, "git": initial_git}


def self_test():
    """Tiny synthetic controls only: never reads game assets or runs native jobs."""
    with tempfile.TemporaryDirectory(prefix="cf-review-builder-test-") as temporary:
        root = Path(temporary).resolve(); (root / "ok.txt").write_text("proof")
        for bad in ("../outside", "/etc/passwd", "a\\b"):
            try: safe_source(root, bad)
            except (ValueError, FileNotFoundError): pass
            else: raise AssertionError("unsafe source admitted")
        (root / "link").symlink_to(root / "ok.txt")
        try: safe_source(root, "link")
        except ValueError: pass
        else: raise AssertionError("symlink admitted")
        entries = [Entry.generated(f"repo/{i}.bin", hashlib.shake_256(str(i).encode()).digest(2000)) for i in range(3)]
        names = split_media(root, "test", entries, {}, limit=3100)
        assert len(names) == 3 and all((root / n).stat().st_size < 3100 for n in names)
        write_zip(root / "repeat-a.zip", "stable", entries[:1], {})
        write_zip(root / "repeat-b.zip", "stable", entries[:1], {})
        assert digest(root / "repeat-a.zip") == digest(root / "repeat-b.zip")
        try: split_media(root, "oversize", entries[:1], {}, limit=1000)
        except ValueError: pass
        else: raise AssertionError("oversized single file admitted")
        source = Entry.source(root, "ok.txt"); (root / "ok.txt").write_text("changed")
        try: write_zip(root / "mutated.zip", "mutated", [source], {})
        except RuntimeError: pass
        else: raise AssertionError("changed input admitted")
    return {"status": "PASS", "controls": ["path traversal", "external root", "symlink", "strict split size", "reproducible ZIP", "oversized file", "input mutation"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[2]))
    for flag in ("native", "motion", "out", "candidate"):
        parser.add_argument("--" + flag)
    for flag in ("test-report", "geometry-report", "include", "media-addition"):
        parser.add_argument("--" + flag, action="append", default=[])
    parser.add_argument("--allow-partial-media", action="store_true")
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        result = self_test()
    else:
        if not all((args.native, args.motion, args.out, args.test_report, args.geometry_report)):
            parser.error("--native, --motion, --out, at least one --test-report and one --geometry-report are required")
        result = build(args)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
