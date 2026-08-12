# Celestial Frontier — Save System

> **2026-08-12 v2 port overlay (matches `port/v2` code):** The browser slice now
> distinguishes a fresh store, a supported coherent save, an unsupported future
> version, a corrupt/sparse payload, and a transient storage failure. Only a
> supported coherent payload may replace the last-known-good backup. Corrupt
> primaries attempt one recovery; without a proven backup they remain protected
> from writes, as do future-version bytes. A thrown primary read is unknown—not
> proof of corruption—so it never calls recovery or rolls a valid newer primary
> back to an older backup. Its transient hold clears only after a later read
> proves a genuinely fresh store; a supported or protected payload reloads or
> stays protected instead. Rejected/blocked IndexedDB open Promises are no
> longer cached forever, and a blocked native request that succeeds after its
> bounded attempt was abandoned immediately closes that late orphan database.
> Explicit import uses the same envelope guard, so `{}`, `{view:null}`, arrays
> and primitives cannot erase progress.
> The player-facing import door now lives at **Settings → Bring expedition**;
> moving it out of the eighth dock slot did not create a second loader or weaken
> any byte-protection rule. That dock slot now opens the canonical v2 Guide
> catalogue (9 categories /43 authored ids /41 legacy-live topics); first open
> updates the existing `guide`/`seenGuide` save field through the ordinary
> protected persistence path. Guide content itself is source-addressed code, not
> duplicated into the save. The complete 56-entry v1 release archive is likewise
> immutable content; `rn`/`rnSeen` remains only a seen-version marker. The
> separate v2 development bulletin is deliberately unversioned and cannot mark
> itself seen or fire an update surface. No version was bumped.
> The import door is a top-layer `aria-modal` dialog: Tab stays inside its live
> textarea/button/file controls are explicitly named, the file picker has a
> keyboard-operable visible trigger, Escape closes only the dialog and restores
> Settings focus, and a real 390×844 browser control proves the old low-z layer
> would expose the dock.
>
> The importer also normalizes `gen`/`maxGen` to nonnegative safe integers,
> contains a malformed Compendium row instead of rejecting the whole expedition,
> caps cosmic epoch at 10,000 to bound retained O(epoch) ecology work, timestamps
> new Atlas rows, and preserves/requires complete galaxy/star coordinates for
> travelable Atlas destinations. Imported legacy Atlas entries whose routes
> lack those coordinates remain visible with a disabled, explicit
> route-unavailable label rather than a dead travel action. Honest
> out-of-range bred `size` remains
> untouched. A live planet card snapshots and compares the complete galaxy/star
> `{seed,x,y}` identity before Land, Atlas or Share may act, so an equal seed at
> different coordinates cannot rebase stale actions. Imported `fs`, `tone`,
> `font`, `rm` and `gt` values are not inert metadata: the v2 Settings surface
> now applies the whitelisted body classes, true reduced-motion policy and a
> contrast-safe 0.82..0.98 rendered glass-tint floor. Older stored 0.40/0.72
> values remain byte-compatible until the player moves the slider; the UI
> never renders below 0.82, while an explicit new choice persists through the
> same exporter. Clipboard success/failure is session UI state only and writes
> nothing. Current-v2 Field Training restart uses a reversible `{view}`
> snapshot; restoring the older v1 full-expedition `tsnap` schema is still a
> Gate-C blocker. The repository still stores one exported blob rather than the
> planned split/CAS records, so multi-tab last-writer-wins is also open.
>
> One historical compatibility bridge remains exact and narrow: the first
> IndexedDB slice's two-field `{nav,view}` envelope is accepted only when those
> are the only top-level keys, `nav` has exactly `mode/gal/star/planet`, and both
> route copies agree after sanitization. It preserves that route and immediately
> migrates to the complete v4 envelope; nearby sparse shapes remain protected.
> Future/corrupt-save notices are critical boot outcomes, so they bypass the
> ordinary toast debounce and are browser-tested as both visible and
> byte-preserving before the fast-boot notification window can hide them.
>
> Explicit replacement import is serialized against ordinary persistence. It
> cancels the pending preference debounce, waits for any already-started save
> write to finish, holds new ordinary writes, and only then stores the proven
> complete replacement envelope. This prevents an older same-tab settings
> autosave from racing behind and overwriting the imported expedition. JSON
> classification and the live primary use the whitespace-trimmed candidate,
> while the best-effort `cf_v2_import_original` keepsake receives the exact
> submitted text, including legal surrounding whitespace. File selection is
> decoded to text by the browser; the moderator's external source file remains
> the authoritative byte-for-byte backup, including when browser storage refuses
> the extra keepsake.
>
> The three intentional v2 replacement-page transitions—current Training
> restart after its view snapshot commits, supported expedition import after the
> replacement envelope commits, and storage-health retry after real bytes are
> rediscovered—share one code-owned reload path. It blocks new ordinary writes,
> and each flow synchronously claims the one replacement transaction before its
> first await, so Training restart cannot tear down the page while an import is
> still committing (or vice versa). The claim also stops the outgoing Pixi ticker
> synchronously, before any persistence wait. A refused/failed transaction may
> restart it only when that exact claim stopped a previously running ticker; a
> successful replacement destroys the already-quiescent renderer. Invalid import
> bytes are rejected before any claim, so ordinary play and its ticker are left
> unchanged.
> The chosen flow
> cancels the preference debounce, removes renderer-resize listeners, destroys
> the Pixi application with its global/child texture resources, detaches the
> application view, and collapses both the application and backdrop canvases to
> at most 1×1 before a one-task-boundary `location.reload()`. The optional CDP
> seam reports those postconditions, the exact replacement reason and the outgoing
> document token outside the dying execution context. The replacement document's
> separate optional `cf-v2-slice-ready/v1` tail binding is emitted only after load,
> persistence and complete input/slice wiring, the first ticker turn, an animation
> frame and a later task. Glass accepts it only from the exact target session and
> new default top context on the committed changed loader, with a changed token and
> phase-owned deadline, then performs one at-most-2-second confirmation in that
> context. It then requires a second no-retry target confirmation from a later
> post-render Pixi ticker turn. Both target commands run concurrently with a
> root-session `Browser.getVersion` heartbeat and own their own strict two-second
> bounds. A timely browser heartbeat plus an unanswerable exact target is a
> product finding; an unhealthy heartbeat is instrument/transport failure. The
> tail witness is boot-publication evidence, not by itself a claim of sustained
> answerability. This
> teardown is deliberately not installed on generic `pagehide`: a browser-cache
> restore must never revive a Pixi application that the app destroyed.
> For diagnostic imports, a separate event-owned `cf-v2-import-phase/v1` stream
> binds one phase id and the outgoing document/session/context/loader. Its exact
> successful sequence is `invoked` (ticker running) → `claimed` → either
> `no-active-persist` or `waiting-active-persist` / `active-persist-settled` →
> `primary-write-started` → `primary-write-complete` → `release-started` →
> `release-complete`, with the ticker stopped after `invoked`. The one 20-second
> import deadline begins before the bounded, non-awaiting CDP arm command; neither
> that command nor any later witness gets a fresh clock. There is no timeout
> increase, automatic retry, or `Promise.race` around IndexedDB durability.
> The replacement app also initializes Pixi with `autoStart:false`. Save loading,
> scene render, slice publication and complete input wiring happen while its
> ticker is stopped; only then does the app start it and require one real tick/
> render, animation frame and later task before emitting ready. A separate exact
> 12-stage `cf-v2-boot-phase/v1` stream binds the new session/context/generation/
> origin/loader/document token, requires ticker false through `wiring-complete`
> and true from `ticker-started`, and stays inside the original boot deadline.
> Browser load/FCP is not a substitute for this application-owned sequence.
> The Pixi and backdrop canvases use a two-tier simultaneous-owner budget. Native
> backing is retained through UHD 3,840×2,160. A viewport strictly above
> 8,388,608 CSS pixels selects 3,145,728 backing pixels per canvas /6,291,456
> aggregate, fitted against the *rounded* backing dimensions; desktop-8k resolves
> to 2,365×1,330 each /6,290,900 combined, as does 5,120×2,880. On a density/viewport transition the
> old backdrop texture/canvas is destroyed and collapsed before replacement
> allocation, with exact peak/budget evidence. A same-integer-backing resize still
> updates CSS size, Pixi screen/texture/event geometry, pointer mapping, backdrop
> logical dimensions, and generation. Downshift and restore each require a bounded
> target plus concurrent browser heartbeat, then an advancing later post-render
> ticker turn; stopped/stale ticker controls fail closed. The existing scene rerender
> remains—no scene-rerender optimization landed.
>
> **Evidence boundary:** immutable executable evidence source
> `7d9980e37e60f0cec8cb840e75098872b9cc90d0` passed its complete exact
> sequential battery. Root preflight selftest/preflight, validate/fingerprint,
> root smoke, layout selftest plus `exact-7d9980e-root-layout` 787/787 across
> 10/10 viewports, rarity 60M/0, dead-code review, v2 273 pass / 1 skip and every
> type/art/override/coverage/spec/instrument selftest all passed. One-attempt smoke
> passed with 0 findings / 10 screenshots, including the real restart/import/
> duplicate-import interlocks and rollback. Exact-source certifying glass passed
> 12/12 viewports and 52/52 controls with `omitted=[]`, 0 findings/instrument
> failures/retries, working-tree
> digest `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> All 12 exact import-phase/release/ready paths passed; replacement totals were
> 194–239 ms. Desktop-8k recorded a 3 ms arm, 21 ms import-phase span with the
> ticker true only at `invoked`, 0 ms primary write, 19 ms release, both
> 5,461×3,072 canvases collapsing to 1×1, `performanceNow` 199.5 ms, 1 ms
> confirmation and 239 ms total. All nine automated personas passed, still not a
> human playtest. Exact preview `dev-preview-exact-7d9980e` verified and browser-
> smoked 37 files / 10,170,996 bytes under Edge 151 for the expected separate
> origin, with content SHA-256
> `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`,
> production distinct and `publishable:false`. Prior CI #201 remains preserved
> red without retry. `7d9980e` remains immutable prior exact evidence; the later
> prior #204 repair evidence is bound to clean source `46fb627` below.
> CI #202, run `31594595288` / job `94106996466`, is also preserved red without
> retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`: every earlier gate
> and `smoke:ci` passed, while desktop-8k glass first observed replacement state
> at 61.163 seconds. The serial three-command probe could itself consume up to
> roughly 90 seconds, so #202 is instrument ambiguity, not a save rejection or
> proof of a slow product boot. Matching final-tip CI remains required; the clean
> local battery does not authorize preview publication, human certification,
> Ready, merge, versioning or deployment.
> CI #203, run `31602984470` / job `94134750800`, is preserved **RED** without
> retry at exact pushed head `38e4f362533e272f56f708229f7a037f38ae8951`.
> Every preceding gate, including `smoke:ci`, passed; only the desktop-8k
> preference import failed after 20,015 ms before any release, replacement-ready,
> navigation, fatal, command, or event evidence appeared. Eleven other viewport
> rows passed. This was a pre-release renderer-pressure finding: the outgoing
> 5,461×3,072 Pixi ticker remained active while the durable write and teardown
> awaited service under CI software rendering. It is not evidence of save
> corruption or a rejected repository write.
> CI #204, run `31612817092` / job `94168172635`, is preserved **RED** without
> retry at exact pushed head `4cee7d807b8f9258e370aad31c30756269f95a96`.
> Every earlier gate and `smoke:ci` passed. Its 8K arm queued for 9,504 ms;
> durable write, 35 ms renderer release, changed-loader navigation 45 ms later,
> load at 231 ms and FCP at 268 ms were all healthy, with no fatal event. No
> ready witness arrived inside the unchanged 20-second boot bound. That is not a
> save, import, write or navigation failure: both replacement canvases allocated
> the full 16,777,216-pixel allowance and Pixi auto-started before asynchronous
> save/scene/slice/input wiring, starving application readiness under software
> rendering. Preserve #204 without retry or a timeout increase.
>
> Before the stable-source battery, one smoke attempt correctly refused mixed-
> source evidence because tracked documentation changed during its run (`source
> identity changed during slice smoke`). That single execution had no automatic
> retry and remains coordination/instrument evidence, not a product failure. The
> local battery and package do not authorize preview publication, human
> certification, Ready, merge, versioning, or deployment. The initial malformed
> `npm run perf -- --runs=4` command was likewise rejected before any browser;
> the correct one-run diagnostic was not a retry of an evidence failure.
> Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
> passed the exact local battery. One malformed `--verify-run` operator invocation
> caused local SIGABRT/report overwrite; one correct rerun plus verification then
> passed `exact-46fb627-root-layout` at 787/787 across 10/10 viewports. V2 passed
> 273/1 plus all gates/selftests, and one-attempt smoke passed 0 findings /10
> screenshots. Full certifying glass at source-snapshot digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
> passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
> failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
> release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms,
> 1 ms confirmation, and two 3,862×2,172 replacement canvases /16,776,528 pixels
> combined after both outgoing canvases collapsed to 1×1. Nine automated personas
> passed; terminal-only performance was 595/676/76/168 ms. Exact preview manifest
> `dev-preview-exact-46fb627` records 37 files /10,176,376 bytes, content SHA-256
> `4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`,
> expected origin `https://dev-celestialfrontier.github.io`, production distinct
> and `publishable:false`. `46fb627` remains prior immutable exact evidence.
> CI #205, run `31621227550` / job `94196289291`, is preserved **RED** without
> retry at exact pushed `c57305fbf30af2bc8158ff46af1ec49ec4455d95`.
> Every preceding gate and `smoke:ci` passed. Desktop-8k completed import,
> primary write, renderer release, changed-loader navigation, all 12 boot phases,
> and ready at browser-native `performanceNow` about 3,733 ms; only the following
> exact-context confirmation timed out at two seconds. No concurrent browser
> heartbeat was recorded, so #205 is strong evidence of post-ready target
> starvation, not proof that browser/CDP transport remained healthy. It is not a
> save, import, durability, release, or navigation failure.
>
> Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass
> captures based on `c57305f` remain non-authoritative; their sandbox `EPERM`
> and corrected `7680.000000000001` harness assertion did not retry a product
> failure. Immutable executable source
> `135a635d066d1c67e3096dc134de9247267898d5` passed the complete exact
> sequential battery from clean source-status SHA-256
> `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
> and source-snapshot
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
> passed outside sandbox without a product retry. Root validate, legacy smoke,
> rarity and dead-code passed. Root layout
> `exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
> under Edge 151 in 75,532 ms; report SHA-256
> `7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`.
> V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt
> slice smoke passed 0 findings /10 screenshots /0 retries in 105,379 ms;
> report SHA-256 `c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`.
> Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
> zero findings/instrument failures/retries in 52,254 ms; report SHA-256
> `1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`;
> reloads were 176–185 ms. Exact 8K was 185 ms /2 ms arm /12 ms
> invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
> `performanceNow`, with target confirmations 1/9 ms and heartbeats 1/1 ms.
> Outgoing/replacement canvases were 2,730×1,536 each; outgoing collapsed to
> 1×1 and the replacement pair remained 8,386,560 pixels. Nine automated
> personas passed (not human play), with JSON/Markdown SHA-256
> `c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
> `43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`;
> terminal-only performance was 578/659/76/170 ms. Exact preview
> `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
> Edge 151; manifest SHA-256
> `0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
> 37 files /10,186,230 bytes, content
> `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
> tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
> production distinct and `publishable:false`. Live Git/status/PR checks determine
> the docs-only tip; matching CI and all host/human/Ready/merge/release/deploy/
> version boundaries remain open. No save-format change occurred.
> CI #206, run `31635297321` attempt 1 / job `94243979205`, is preserved **RED**
> without retry at exact pushed `558e0565d368a0b81d86d99fd380ebc50d30bc02`;
> merge `e160577` is tree-identical. All preceding steps and `smoke:ci` passed.
> Desktop-8k reload passed in 8,749 ms, ready published at `performanceNow`
> 2,578.6 ms, and target cycles completed in 1,905/1,910 ms with 3/1 ms
> heartbeats. The later 5,120×2,880 resize target timed out at 2,003 ms against
> the strict 2,000 ms bound while `Browser.getVersion` answered in 2 ms;
> `last:null`. The sole `ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` is therefore a
> product finding, not an instrument failure: 12 viewports, 1 product finding,
> 0 instrument failures, 56 executed +1 product-blocked =57, `omitted=[]`, 0
> retries, and no persona/preview evidence. It is not a save, import, durability,
> renderer-release, navigation, or boot-readiness failure.
>
> Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
> underlies the current/forthcoming documentation-only tip (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
> snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
> Root preflight warned Edge 151 vs pin 150; validate/smoke and layout 787/787 across
> 10/10 passed; v2 passed 273/1 plus all gates. One-attempt slice smoke passed 0
> findings/10 screenshots in 105,217 ms (`b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474`),
> and certifying glass passed 12/12, 57/57, empty blocked/omitted and zero findings/
> instrument failures/retries in 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`).
> Exact 8K was 203 ms / `performanceNow` 158.2 ms, targets 1/10 ms, heartbeats 0/0 ms;
> outgoing 2,365×1,330 stores →1×1 and replacement stayed 6,290,900 pixels combined.
> Nine automated-only personas and terminal-only 581/659/73/152 ms performance passed;
> exact preview `dev-preview-exact-df1c28b-20260812T211642Z` passed Edge 151 at the
> separate dev origin with `publishable:false`. Exact docs tip/upstream/CI is live and its
> final pushed tip needs matching CI. No save-format, host/human/Ready/merge/release/
> deployment/version authority follows.
> No save-format or version change is involved.

**STATUS:** legacy sections match `main.js` as of 2026-07-31; the v2 overlay
matches `port/v2` as of 2026-08-12. ⚠ Read the v1.8.7 section (a reverted
`size` clamp that corrupted bred creatures) and the v1.8.8 section (`conq[].e`,
harvest on play time).
**Purpose:** persist the player's *progress* (never the universe — that's regenerated
from seeds) to `localStorage` under one hardened key, with load-time coerce/clamp so a
tampered or truncated save can never inject markup or poison the numbers.
**Source of truth:** this doc is the DESIGN spec; `main.js` + `tools/` implement
the legacy sections, and `port/v2` implements the dated port overlay.

## ⚠ v1.8.4 — `_sanitizeSavedGenome` mirrors `normGenome`

The load path clamped `brood`/`fed`/`xp`/`hurt` and let `_mult`, `_wf` and `apex`
round-trip untouched, because the codex is written wholesale. `battleStats` multiplies by
`_mult` with no bound and `abilityOf` grants `apex` the Sovereign art at max magnitude, so an
edited `localStorage` save minted a ~1000× champion for free. The share-code path (`normGenome`)
had always validated all three; **the load path now does the same**: `_mult`/`_wf` deleted,
`apex` honoured only in 12..TIER_MAX, `par` only in 8..11.

Rule of thumb going forward: **anything `normGenome` strips from a shared creature must also be
stripped from a loaded one.** They are the same trust boundary — one is another player's bytes,
the other is the player's own editable bytes.

## ⚠⚠ v1.8.7 — THE `size` CLAMP BELOW WAS WRONG AND HAS BEEN REMOVED. DO NOT RE-ADD IT.

Read this before the v1.8.6 section, which describes a fix that lasted one release.

v1.8.6 shipped **two fixes for one problem, in the same release, and they contradicted each
other**: `battleStats` began *wrapping* `size` (`% FA_SIZE.length`, the value the card prints)
and the load path began *clamping* it to 0–5. The wrap alone was correct. The clamp was
actively harmful, and it corrupted real player data.

**`crossGenome`'s mutation list includes `size` and never wraps it**, and `evolveGenome` mutates
again on every breed — so **honest saves carry `size > 5`.** Measured on this build's own
functions across 500 lineages: **12.4% past size 5 by generation 5**, max seen 10. Those are not
edited saves; that is ordinary breeding.

The clamp rewrote every one of them, permanently, on the next load — `_sanitizeSavedGenome`
mutates in place, `_storeSpecies` keeps the genome by reference, and the writer persists it:

| stored `size` | in session | after ONE reload |
|---|---|---|
| 6 | "tiny", vit 50 | **"titanic", vit 70** |
| 9 | "large", vit 62 | **"titanic", vit 70** |
| 12 | "tiny", vit 50 | **"titanic", vit 70** |

Portrait scale, voice pitch (`sizeF` reads `size % 6`), the body-length dial and the "Size
Classes" collection slot all moved with it, and a share code exported before the reload no
longer matched one exported after.

**And it bought nothing.** Its own justification was the crafted `size:1e6` save. The wrap in
the same release already closed that: measured, `size:1e6` yields **vit 66 against a legitimate
maximum of 70** at size 5. `normGenome` feeds the same wrapped reader, so the share-code path is
closed by the wrap too.

> ✅ **RESOLVED IN v1.8.9, and not by wrapping at load.** The six *readers* that took `size` raw
> (`sapienceTier`, `classifyRealm`, `speciesGrade` ×2, the titan roster check) now share one helper.
> That closes the divergence without touching stored data at all — the load path still does not,
> and must not, rewrite `size`. Fingerprint held: those probes are fed `makeGenome` outputs whose
> size is already 0-5, so the wrap is the identity function over every probe input.
>
> ⚠ **Do not "finish" this by wrapping at load instead.** `speciesGrade`, `rarityRoll` and
> `sapience` read `g.size` **raw** (`>=3`, `>=4`, `>=5`), so a stored 6 is *not* equivalent to a
> stored 0 — wrapping on load would also rewrite honest data, just less visibly. The drift is a
> **balance** question, and `crossGenome`/`evolveGenome` are determinism-fingerprint probes, so
> changing the mutation needs a deliberate re-pin.

**Guarded by `node tools/sizedrift-check.js`**, which asserts a drifted genome survives the load
path unchanged and that the crafted-save exploit stays bounded. It fails on v1.8.6 (`size 9 → 5`,
`vit 80 → 88`) and passes on v1.8.7 — a check that could not tell the two apart would be worthless.

**The lesson (round 9's pattern):** *two correct fixes for one bug, shipped together, that
disagree.* Neither line was wrong alone; nobody asked what the other one did. When a fix touches
a value, grep every reader and writer of that field and make them agree — for `size` that is
`battleStats`, `describeSpecies`, `speciesPortrait`, `voiceOf`, `speciesGrade`, `rarityRoll`,
`sapience`, the collection slots, `normGenome` and `_sanitizeSavedGenome`. That grep is cheaper
than the fix.

## ⚠ v1.8.6 — the same rule, applied to a field nobody thought of as a stat *(SUPERSEDED — see above)*

v1.8.4 mirrored `normGenome`'s handling of *battlefield modifiers*. It did **not** mirror
`normGenome`'s coercion of the **24 trait indices** — and one of those is a linear power term:

```js
const sz = (g.size || 0);
s[0] += sz * 4;  s[3] = Math.max(6, s[3] - sz * 2);   /* battleStats */
```

`_sanitizeSavedGenome` clamped `brood`, `fed`, `xp`, `hurt`, `_mult`, `_wf`, `apex`, `par` —
**precisely the fields that had been exploited before** — and never touched `size`. Legitimate
range is 0–5. Editing one codex entry to `size: 1000000` bought **+4,000,000 vitality**, and
because `runDuel` decides a capped fight on HP *fraction*, a 12-million-HP pool cannot be dented
in 26 rounds. It travelled, too: `encodeCreature` serialises the raw genome and `normGenome`'s
`Math.abs((+o.size)|0)` preserves `1e6` intact, so a crafted share code presented a
four-million-power challenger in another player's duel box.

~~The load path now clamps `size` to `0..FA_SIZE.length-1` alongside the rest.~~ **REVERTED in v1.8.7 — see the section above.** The reasoning below about `size` being an unclamped power term is still correct; the remedy was not.

> **The lesson is about how the previous clamp list was chosen.** Every field on it had been
> exploited first. That makes the list a record of past incidents rather than a statement of the
> trust boundary — and a field graduates from "cosmetic index" to "power term" the moment any
> consumer multiplies by it. Audit by **what battleStats reads**, not by what has burned us.
>
> ⚠ Related and still open: `crossGenome`'s mutation list includes `size` and never wraps it, so
> size drifts above 5 in ordinary breeding. That is not a save problem and is **not** fixed —
> `crossGenome` and `evolveGenome` are both determinism-fingerprint probes, so wrapping the
> mutation breaks the v1.0 baseline. v1.8.6 closed the player-visible half at `battleStats`
> (which now reads the same `% FA_SIZE.length` the card prints). See COMBAT_AND_CONQUEST.md and
> DETERMINISM.md, both 2026-07-30 addenda.

## ⭐ v1.8.8 — `conq[].e`, and a clamp that retired with the clock it defended

Harvest readiness moved from the wall clock to `COSMIC_EPOCH` (play time). Two consequences here:

**New field, additive and absent-safe.** `conq[].e` is the epoch at last harvest. A save from
≤v1.8.7 has no `e`, reads as **ready**, and pays one cycle per world on its first load —
deliberate and one-time; the alternative is penalising an existing empire for our clock change.
On load it is clamped to `[0, EPOCH_BASE]`: a save claiming a **future** epoch would otherwise hold
a world hostage forever, and a wildly negative one would grant a free harvest.

**The `_hvFloor` harvest clamp is now vestigial.** It floored `conq.t` to at most one `HARVEST_CD`
before the save's own stamp, to stop a mass-edited `t` from paying out an empire at once. `t` is now
a **display stamp that gates nothing**, so there is nothing left to defend by clamping it — it is
kept only because `t` is still shown on the card. If `t` ever becomes load-bearing again, this
reasoning has to be revisited.

> The rule this batch adds to the ones above: **a guard's justification should be re-read whenever
> the thing it guards changes shape.** Three rounds of hardening `t` were rendered moot in one
> release — not by better hardening, but by making `t` stop mattering.

## 1. Overview
Module `SaveSystem [app]` (main.js 10000–10359) owns a debounced write, a hardened
load, and the reset/wipe paths. The save is **local only** — there is no server and
the universe needs no saving. Since the v1.5 fresh start the key is **`cfcc_save_v2`**;
the old `cfcc_save_v1` is read exactly once at boot to mine its rarest catalogued find
for a farewell card, then removed. There is **no migration** — the key bump *is* the
wipe (Nick's call). The universe (seeds, worlds, genomes, share codes) never changed.

## 2. Rules & mechanics

### Write path
- **`queueSave()`** (10046) — debounced: `setTimeout(doSave, 900)`; no-ops while
  `_loading` or `_wiping`. Called after every progress-affecting action.
- **`doSave()`** (10047–10103) — serializes one JSON object to `SAVE_KEY`. Header
  `v:4`, `epoch:COSMIC_EPOCH`, `at:Date.now()` (wall-clock stamp that anchors
  offline-accrual clamps on load). On failure (quota / private mode) it toasts once
  (`_saveFailWarned`) and the session continues unsaved.
- Bound to `beforeunload` and `visibilitychange→hidden` (10353–10355) so a close or
  tab-hide flushes; `pageshow` with `persisted` reloads (bfcache safety).

### Load path — hardening is mandatory
**`loadSave()`** (10104–10282) treats the save as hostile input:
- `num(v,d)` coerces every counter to a finite number (10111); `clamp(...)` bounds
  ranges (essence 0–1e9, hp 1–HP_MAX, pstats 1–330, etc.).
- Names run through `cleanName` (strips markup, caps length); `explorerName`,
  custom world names, prime-record strings are all re-sanitized.
- Enum/class fields are **whitelisted** before use: `fs`∈{fs-lg,fs-xl}, `tone`∈
  {tone-bright,tone-max}, `font`∈{font-sys,font-mono} — each becomes a body class, so
  an arbitrary value could otherwise inject a class.
- Set-membership validated against real tables: cargo materials via the `MATERIALS`
  registry (47-entry; superseded the 42-symbol `ELEM_NAME` table), items
  via `ITEM_BY`, tech via `TECHS`, charter ids against `CHARTER_STARTERS`/
  `CHARTER_POOL`, binder sets via `BINDER_SETS`.
- Exploit clamps: mined timestamps clamped to at most one accrual window before the
  save's own `at` stamp (10139–10141, defeats the "edit timestamp to 0 → 30 preloaded
  extractor pulls" edit); conquered-world **harvest** stamps get the parallel anti-edit
  clamp on load — at most one `HARVEST_CD` before the save's own stamp; conquered/mined
  unioned into `land` so cap eviction can't re-hide a held census.
- Notifications are escaped + coerced on load (the tray sink uses `esc()`), so a
  hand-edited save can't inject markup through the notification tray.
- `_loading=true` for the whole pass so nested writes don't re-enter `queueSave`.

### "New fields must default safely when absent" (the veteran-save rule)
A field missing from an older save must resolve to the *safe* default — never force a
regression on a held run:
| field | absent ⇒ | code |
|---|---|---|
| `tut` | tutorial **done** (never force training on a veteran) | 10270 |
| `tips` | tooltips **on** (`tipsOn=data.tips!==0`) | 10198 |
| `vol` | **full** volume (pre-slider saves) | 10202 |
| `rm` | **Auto** (-1) — keep following OS reduce-motion live | 10204–10206 |
| `chart` | orbit charts **off** (clean sky is default) | 10195 |
| `cx` | all card folds **collapsed** (0) | 10209 |
| `asc` | Ascent **chapter 1** (the canon opening) | 10178 |
| `mx` | every mined world counts **1 pull** (finite reserves never refill) | 10145–10153 |
| `hd` | **ignored** — HD is always on now (ship decision) | 10210 |
| `chacc` | **nothing accepted** (board offers chains fresh) | 10238 |

### Reset / wipe
- **`resetMemoryState()`** (10283–10321) — belt-and-suspenders clear of every in-memory
  container (codex, logMap, conquered, mined, items, ascent, claimed sets, nameplate
  hue, charter badge…) so a soft-navigate is as clean as a hard reload.
- **`wipeSaveAndReload()`** (10322–10352) — arms `_wiping` (unload guard), removes the
  key, resets memory, drops any share-link hash, and rebuilds the opening expedition in
  place (works in sandboxed frames where reload is blocked); explicitly hides the death
  and ending overlays first (a past soft-lock bug).

### Versioning & migration policy
Shape changes require **versioning + migration** (CLAUDE.md rule 5). The current schema
is `v:4`. The v1.5 transition was deliberately NOT a migration — the key bump
`v1`→`v2` served as the wipe, no data grandfathered, and it cost one documented
single-key baseline re-pin of the constants probe (`note_saveKey_repin_v15`; see
DETERMINISM.md). Preserve the load-time hardening on any future change.

## 3. Key names & numbers (REAL values)
- **`SAVE_KEY = 'cfcc_save_v2'`** (10012). **`LEGACY_SAVE_KEY = 'cfcc_save_v1'`** (10013).
- Schema header **`v:4`**; debounce **900 ms**; log slice **120** entries (planet thumbs
  nulled, rebuilt from seed); notifications persisted **50** (tray cap 60 on load,
  10212); `land`/`cont` capped **4000**; `wvo` (wave-off pity) capped **400**.
- Related caps (enforced elsewhere, see UI_PRESENTATION.md): notification tray 60,
  art cache 1,200, DPR 3 desktop / 2 touch.

## 4. Data / save fields (full list, from `doSave` 10052–10097)
Settings & player: `v`, `epoch`, `at`, `view`, `hp`, `pstats`, `me` (explorerName),
`nh` (nameHue), `essence`.
Settings toggles: `fs`, `tone`, `font`, `snd`, `fx`, `chart`, `shake`, `notif`,
**`tips`** (tooltips), **`vol`** (=`sfxVol*100`), **`rm`** (=`motionMode`), **`cx`**
(=`cardExpand` fold bitmask), `guide`, **`tut`** (=`tutDone`), `rn` (release-notes seen),
**`sv`** (=`salvageConfirm` — confirm-before-salvage toggle, default **on**), **`gt`**
(=`glassTint` panel-tint slider, 0..1; absent ⇒ 0.72).
Exploration: `land` (settled ∪ conquered ∪ mined), `scout`, `landings`, `cont`
(contacted), `surveyed`, `gals`, `surf`, `sysv`, `starK`, `ptypes`, `evts`, `evann`,
`home`, `conq` (conquered → {t,tier}).
Economy / engineer track: `cargo`, **`cgx`** (v1.7 §5 — exceptional sub-counts per
substance, load-clamped `cgx[k] <= cargo[k]`), `minedw`, `mx` (pulls per world), **`skx`**
(stellar-skim samples per star — mirrors `mx`), **`bx`**
(=`bioX` — v1.6 Biosphere Yield: `[attempts, epochStamp]` per world), `tech`, `items`,
`eq` (equipped), **`ea`** (=`equipAff` — v1.6 worn loot-core affixes `{k,v,forId}`),
`asc`/`ascp` (Ascent chapter + progress).
QoL fields (2026-07-24, all absent-safe): **`jrn`** (Expedition Journal — up to 24
`{s,n,w,t}` landing lines, strings clamped on load), **`pin`** (pinned Fabricator
recipe id, validated vs `ITEM_BY`), **`ctb`** (sticky hold tab `mat|craft|gear`),
**`seen`** (viewed-specimen ids for the NEW dots — intersected with the codex on save).
Charters: `chs` (done), `chw` (week), `chp` (progress), **`chacc`** (=`chacc` — v1.5.2
accepted-but-unfinished ids), `charters` (count).
Records / stats: `notifs`, `breeds`, `breedwins`, `feeds`, `feedfails`, `harvests`,
`essenceEarned`, `guardians`, `paragons`, `br` (bestRank), `setsc` (claimed binder
sets), `mines`, `crafts`, `minedout`, **`skims`** (stellar-skim stat counter),
**`cosmics`** (cosmic-material stat counter), `shares`, `jumps`, `anomalies`, `anomKey`,
`events`, `duels`, `duelwins`, `ach` (unlocked achievements).
Codex & world: `codex` (`[{g:genome,f:from,w:where}]`), `names` (custom names), `log`,
`prime` (Prime Codex signature records), `frontier`, `ending`.

## 5. Determinism (how this system interacts with the fingerprint)
The save stores no generated content — only progress keyed by seed/id, so the same
share code always rebuilds the same world regardless of what's saved. The one point of
contact with the fingerprint is `SAVE_KEY`'s literal value, which the `constants` probe
pins; that is why the v1→v2 bump was an authorized single-key re-pin. `SaveSystem` is an
`[app]` module, so it may (and does) use `Date.now()` freely — its output never feeds
generation.

## 6. Code anchors
- `SaveSystem` module — main.js **10000–10359**; keys 10012–10013; `readLegacySave`/
  `legacyFarewell` (farewell card) 10017–10043; `queueSave` 10046; `doSave` 10047–10103;
  `loadSave` 10104–10282; `resetMemoryState` 10283–10321; `wipeSaveAndReload`
  10322–10352; unload/visibility hooks 10353–10355; freeze/export 10356–10358.
- Tooling: `tools/smoke.js` drives save/load, veteran-save and skip paths;
  `tools/uilayout.js` asserts a positive `"tut":true` in `cfcc_save_v2` after training
  (proves the debounced flush landed).

## 7. Open questions / pending
- Schema is `v:4` but `loadSave` is version-tolerant by field presence rather than a
  `switch(data.v)` migration ladder — intentional (fields default safe when absent), but
  a future breaking shape change would need an explicit migration branch keyed on `v`.
- `mx` is stored uncapped while some sibling structures cap; documented as intentional
  in-code (the finite-reserve refill audit), noted here for future maintainers.
