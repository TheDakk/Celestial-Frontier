# Art Kit v3 — first-reference review stop

September 12, 2026. Nick resumed from Claude's completed review. This is program step 1's
explicit stop after the first two images; it is not engine completion or art acceptance.

## Preserved input and commits

- Signed checkpoint `77aaeec5bd7c15f5c5b9da772f95ee01c02e055a`: all prior dirty source,
  documents and evidence, including all ten untracked local-image-generation files.
  No integrated chain, pack build or native inference for that checkpoint.
- Signed verbatim import `bcdf351af9cef3431d916f2c207c0be3949c6ba0`: exactly six supplied
  markdown files at their repository paths. ART_KIT.md is 35,728 bytes, SHA-256
  `2266febc5937b447572358cee6bde66b4a710a87cff1a841e2aabe0c989204a3`.
- Both signatures verified against the configured SSH signing key using a temporary
  allowed-signers file; global Git configuration was not changed. No private key read.
- At checkpoint: 14 ahead/0 behind cached origin/openai/mac, 125 ahead/0 behind cached
  origin/develop. At import: 15/0 and 126/0 respectively. No fresh remote fetch.

## Two untouched captures

Both were made with the built-in image_gen tool, one call per image, no reference input,
no local native inference, no retries, no resizing/keying/conversion or pixel edits.
Copies in this directory are byte-identical to the tool outputs. Exact prompts, image
hashes and dimensions are in [captures.json](captures.json).

| Candidate | Requested | Returned | Review status |
| --- | --- | --- | --- |
| [frontier-sheet-01.png](frontier-sheet-01.png) | 1024 square, flat #FF00FF key | 1254×1254 RGBA; transparent corner, not opaque | Technical refusal: wrong key and size; visual review pending |
| [frontier-plate-01.png](frontier-plate-01.png) | 2560×1440, opaque, three panels | 1672×941 RGB, opaque | Technical refusal: wrong size; style review pending |

The sheet carries the requested five classes and orbital planet, with a coherent ochre,
rust and black palette. Some growth bases read as soil/ground, some figures are cramped
against neighbouring subjects or the edge, one helmet hides a face, and exact limb/count
fidelity is not established at this density. Transparent output violates the kit's
standing magenta method: do not silently reclassify it as an approved alpha exception.

The plate carries universe, star and biome panels with a common AMBER/black-glass palette.
The star is too photographic/glowy; its disc exceeds half its panel, and much of the
plate lacks the visible confident oil brushwork and warm/cool range required by the
anchor. The biome has a usable quieter near field, but this is not acceptance of the
reference finish. Nick is the art acceptance authority. Neither PNG is attached as an
approved reference, wired into the game, or used to calibrate further images.

## Prompt provenance and limitation

[Sheet prompt](frontier-sheet-01.prompt.txt) and [plate prompt](frontier-plate-01.prompt.txt)
are the exact UTF-8 text sent, with hashes recorded before generation. Frozen-style
paragraph, shared negative and technical output were extracted without rewording.
The same [AMBER system card](system-card.txt) fills the kit's slots. The initial sheet
and three-panel plate use §9b/§9c's explicit bootstrap layouts; no nonexistent approved
reference is claimed to be attached. The cut-out negative is absent from the scene.

The first bootstrap briefs are not the rebuilt game-data interpreter. The shared
negative was included, but per-class negative additions were not appended separately;
that is a prompt-assembly gap to correct on the next authorized reference revision,
not a compliant production prompt claim. Preserve these sent prompts unchanged.
The full future interpreter must supply applicable per-class blocks as well, in order.
No fenced section or other byte of ART_KIT.md or the imported review packet was changed.

## Decisions and next work

[DECISIONS.md](DECISIONS.md) prepares the Earth-card line, full stellar mapping and proposed
new rows, and current companion-clause recommendation. Pending Nick's answers, current
v3 wording remains in force. The initial AMBER pair needs none of the new proposed rows.
Source inspection confirmed RG/SG and additionally exposed BD/WD; proposed coverage is
an art overlay only. No world generator or genome is edited.

**Stop for Nick to inspect both candidates.** Fix/reference revisions and the eleven-image
calibration follow feedback; do not automatically repaint now. Then proceed to the
engine program in ROADMAP/LOCAL_AI_GENERATION: one kit interpreter, six Earth cut-outs,
Earth biome anchor, per-organism composition, low-strength finisher, warm sessions,
one VAE encoder, in-worker expansion, one measured native painting with organism boxes.
The engine remains the main deliverable and has not been implemented in this stop.
Only blocking Part K 1–11, 17, 33–35 are in the engine batch; every fix needs a negative
control. The ten files are now tracked, but K35 still needs its boot/missing-file control.
No unit tests took the checkout lock here.

One actual target-iPhone probe precedes any storage/delivery engineering. Artwork
durability follows it. Remaining register, pruning/WAV changes, broad stale-claim cleanup
and PR42 split wait for painting acceptance. No new pack, native inference, hosted
Actions, push, label, dispatch, merge, release or deployment occurred.

## Verification and retained instrument error

- ZIP exact path inventory, all six byte comparisons and Art Kit size/hash passed.
- Original generation captures copied without modification and individually hashed.
- ImageMagick confirmed dimensions/channels/opacity and a transparent sheet corner.
  An initial combined identify expression attempting a magenta fraction failed with
  `Not a real operator` and a pixel-expression parse error. No fraction was measured.
  The corrected simpler read-only inspection above proves the stated technical defects;
  the invalid expression is not a product failure or a hidden successful measurement.
- Root `node tools/validate.js` passed: zero boot errors and exact 50-probe v1.0 fingerprint.
  [Log](validate.log). No UI source change; no smoke/browser battery, integrated chain,
  pack build or native run was appropriate for this authoring/documentation stop.
- The old roadmap handoff was prepended verbatim to ROADMAP_ARCHIVE.md, not deleted.
- Startup queried official Homebrew/npm stable metadata at 2026-09-12T14:20:30Z. Node
  26.8.2 was available; all other allowlisted tools current (REAPER suffix resolved with
  brew outdated). Process-name inspection showed no managed authoring job; bundled app
  Node processes were separate. brew update refreshed core/cask; dry-run and actual
  scoped upgrade changed only Node 26.8.1 → 26.8.2, no dependent upgrade/cleanup. Seven
  capability checks passed, including existing negative controls. [Receipt](toolchain-verify.json).
  Unrelated libheif/simdutf updates were not installed. Personal toolchain skill refreshed.

The first final-adoption commit attempt was refused by the configured 1Password signer
(`agent returned an error`; no commit object written). Configuration still points to
op-ssh-sign and 1Password is running. One bounded retry returned the same error. The adoption files remain STAGED BUT
UNCOMMITTED; Nick must unlock/allow 1Password signing before the local commit can finish.
No signer/key/configuration override. The earlier two verified commits remain.

## Paired handoff

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`,
tracking `origin/openai/mac`. Two local commits only; this adoption record and its images/docs are staged, awaiting
1Password signing. Current HEAD remains bcdf351a, 15 ahead/0 behind cached upstream and
126 ahead/0 behind cached origin/develop. GitHub step none. PR42 stays parked, base develop/source openai/mac;
no title/body mutation now. No new PR needed at this stop. Budget remains recorded
UNFROZEN/PUBLIC, private fallback 3,000; exact hosted authorization zero.

Claude Code does not have these local commits and need not be opened now. After eventual
authorized develop integration, clean anthropic/mac may fetch/merge origin/develop at its
next batch; never copy between worktrees. Develop/main/live site unchanged. SSH origin
is git@github.com:TheDakk/Celestial-Frontier.git; no fresh network authentication/read was
needed or performed for this local-only work.
