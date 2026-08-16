# v1.8.9 baseline — Gate A evidence

**Port Phase 0 deliverable.** See `port/PORT_MASTER_PLAN_v4.0.md` §20 (Phase 0) and §22 (Gate A).

The baseline itself is the **git tag `v1.8.9`** at commit `92098e9`. This directory holds the
things git does *not* hold: the gate outputs, and the environment they were produced in.

| File | What it is |
|---|---|
| `environment.json` | Toolchain, browser revision, and every gate figure, machine-readable |
| `fingerprint-current.json` | The 50-probe determinism output, captured 2026-07-31 08:35:56 |
| `uilayout-report.json` | The 787-check / 10-viewport layout report |
| `training-restart-fixture.json` | Action-derived v1.8.9 Settings → Restart Training checkpoint, with source/driver/snapshot provenance |

---

## 1a. Field Training restart checkpoint

`training-restart-fixture.json` is produced by the real legacy control path, not
by hand: `tools/training-restart-fixture.js` boots `veteran_rich` through
`_probeboot.js`, clicks `#setbtn`, clicks `#retrainopt` twice, and reads the
saved `tsnap`. Run `npm run trainingcheckpoint` to verify it. The paired
`trainingcheckpoint:capture` command prints a candidate and never writes this
file.

The snapshot has exactly eleven outer fields
`{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` and is 2,074 JSON bytes. SHA-256:
`2e2f7c566a27e79398ea18650de9ac6acf236e92235fc293e4815b8bfefa22e3`.
Driver SHA-256:
`c3f710d90782f7ba812a2082288ce860e5f41ce16cec2c28b3eaba1fb9ec454a`.
Source `veteran_rich` fixture-JSON SHA-256:
`26da9dc04940132a2dd4627391ef4a1be57d6a758bf3b6efb4dc6b217c273a16`.
There is no `view` field in the snapshot. It therefore cannot prove or request
legacy pre-Training route restore: Skip from Welcome retains Sol and full
completion after Land retains Earth. Current-v2 `{view}` is a separate shape.

This is jsdom/action-derived legacy provenance, not real-browser evidence or
Nick's real veteran-save Gate-C proof. The synthetic
`save-fixtures.json:tut_midtraining.tsnap` object remains a separate
unknown/refusal negative control and is not represented as a genuine checkpoint.

---

## 1. Why the source is not archived here

It does not need to be. `celestial-frontier.html` is **tracked** at the tagged commit, so git
already stores it immutably and reproduces it byte-exact on demand:

```sh
git show v1.8.9:celestial-frontier.html          # the exact shipped build
git archive v1.8.9 | tar -x -C <dir>             # the whole tree
```

Verified: the html from the tag hashes identically to the working tree at capture time —
`9f90f506a7cfcf5b721d80e7b956e0ef717edf04d004edf825ddb4f0303b3c88`, 1,963,584 bytes.

A second copy under this directory would be 1.9 MB of duplication of something git holds better.
The same reasoning applies to `tools/baseline.json` (the v1.0 fingerprint), which is also tracked
— reference it at `tools/baseline.json`, sha256
`6f9a42a29c7a3276a72417267254b59be4ebf9999dfa5656073988c1fbf8081c`.

**`main.js` is gitignored by design.** `celestial-frontier.html` is the tracked canonical artifact
and `main.js` is derived from it. On a *fresh clone only*, bootstrap with `node tools/extract.js`.
⚠ Never run `extract.js` in a working tree that has unbuilt `main.js` edits — it regenerates
`main.js` from the html and silently discards them (CLAUDE.md rule 4).

## 2. Why not `releases/`

`releases/` is **gitignored** (`.gitignore` line 19). The one archive that lives there,
`releases/v1.7.0-4264b2e/`, exists on exactly one machine and nowhere else. That is the same
failure mode that lost the v3.x port plan — reviewed at length, then gone with the session.
Gate A asks for *reproducible*, which a local-only directory is not. This evidence lives under
`port/`, which is tracked, next to the plan that requires it.

## 3. ⚠ The browser is an undeclared dependency

**This is a real Gate A gap, found during capture.**

`package.json` declares only `acorn` and `jsdom`. But `tools/uilayout.js` and `tools/bootperf.js`
drive a **real browser** — they `spawn` a system binary directly over CDP. There is no Playwright,
no Puppeteer, no npm driver anywhere in `tools/`.

Consequences:

- `npm install` on a clean clone does **not** provision a browser. Two of the nine suites cannot
  run in a fresh CI environment without a separate, undocumented provisioning step.
- The binary resolved here was **Microsoft Edge 150.0.4078.83**, which **auto-updates silently on
  Windows**. Nothing pins it.
- Addendum D warns that a layout gate whose thresholds were set on one browser revision drifts on
  the next. `uilayout.js` compares against stored numbers, so the 787/10 result is only meaningful
  against a known revision — which is why it is recorded in `environment.json`.

Resolution order is `CF_BROWSER` env → local Windows Edge → common Linux/macOS Chrome paths, so CI
provisioning is possible today via `CF_BROWSER`; it is simply not declared or documented anywhere
outside this file.

**Phase 0 owes:** declare and pin the browser as part of "reproduce all executable dependencies in
a clean CI environment," and treat any future revision bump as an explicit re-baseline rather than
a regression.

## 4. What this evidence does and does not prove

**Re-verified in this environment on 2026-07-31, not copied from the roadmap:**

- `validate` — 9/9 PASS
- fingerprint — **MATCH 50/50** against the v1.0 baseline
- `uilayout` — PASS, 787 checks across 10 viewports

That distinction matters here more than most places. This project has logged **seven** cases of a
check passing while the thing it guarded was broken, plus four more inside a single afternoon
during round 9. A gate figure transcribed from a document is a claim; a gate figure observed is
evidence. Only the three above are evidence.

**Not re-run** (claimed PASS at ship, carried forward): `smoke`, `balance`, `simrun dom`,
`duelxp`, `sizedrift`, `harvestclock`, `bootperf`. Listed in `environment.json` under
`gates_not_re_run` so this archive does not overstate itself.

## 5. Reproducing this

```sh
git checkout v1.8.9
npm install                     # acorn + jsdom only — see §3, this does NOT get you a browser
node tools/extract.js           # fresh clone ONLY — see §1
node tools/validate.js          # expect 9/9 and FINGERPRINT MATCH 50/50
CF_BROWSER=<path> node tools/uilayout.js   # expect PASS 787/10 on Edge 150.0.4078.83
```

## 6. The freeze rule — this tag does not freeze anything

v4.0 §20/§23 **replaced** the old hard-freeze language. Until Phase 4 UI parity, the HTML build
remains the reference product and the emergency fallback, and may keep taking critical fixes.
Tagging the baseline fixes what the port is measured *against*; it does not stop the live game
moving. If a critical fix does ship before Phase 4, that is a new release tag and an explicit,
recorded decision about whether the parity baseline moves with it.
