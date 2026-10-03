# C198 pending shrimp/prawn ledger correction

The first combined develop run stopped on `Unplanned body structure shrimp-prawn` in
`specialized-anatomy.test.ts`: splitting the five shrimp/prawn attack-intent names into a
new profile had left the coverage ledger target map incomplete. The retained develop red
is unchanged; no develop, native or I5 rerun was performed here.

The correction adds only `shrimp-prawn: crustacean-small` to `MISSING_BODY_TARGETS`.
The focused test checks the five exact names, water medium, template and pending status.
All 53 pending identities remain pending; together with the five previously admitted
crabs, the identity union remains 58. No admission flag, anatomy, pose, limit, certificate
or source painting changed. ATTACK_ANATOMY now states this separation explicitly.

`tests-01.log`: 18 tests pass across specialized anatomy, small-crustacean attack and
Earth fauna profiles. `missing-body-structures.before.ts` is the measured-commit source;
`proof.json` and `proof-after.json` execute it against the same current profile input and
reproduce the exact missing-map error. The corrected source succeeds with the original
53/58 coverage intent and all five names still pending.

The only code consumers are the specialized-anatomy test and the offline
`tools/creature-animation/coverage-ledger.mjs` entry. The historical
`tools/fauna-coverage/roster-inventory.json` remains an unchanged captured inventory from
its named September audit; it is not rewritten as though it were current admission.

## Browser and certificate scope

A single build-only comparison was separately authorized after the stopped gate. The
existing workspace lock guarded it. `tools/local-image-generation/node_modules` was
renamed aside and restored in `finally`; the current active selector was never changed.
The evidence-mode Vite build exits 0. `dist-before.json` and `dist-after.json` match all
1,156 output files outside sourcemaps byte-for-byte, with no other output excluded.

Both read-only proofs find neither modified TypeScript file among 941 unique inputs in
78 emitted source maps. The unchanged PWA builder constructs identity from emitted
runtime assets, pinned first-use assets and its worker revision, not all unbundled source
files. The 509 worker assets, canonical build ID, exact service-worker bytes, all five
producer-authority inputs and all nine active certificate files match before and after
the build. The Vite/PWA builder sources also match the measured commit. The selector is
read and hash-checked at both ends of each proof.

The producer *cache receipt* hashes all nonignored source, including this ledger and its
test, so that cache digest is stale after this correction. That is separate from the
unchanged browser product and unchanged I5 certificate. A future authorized develop
owner can prepare its normal current-source receipt; this evidence neither selects a
certificate nor authorizes a gate retry. No new I5 measurement or rebinding was done.

## Frozen scope

Changed current references/source:
- `port/v2/apps/game/src/missing-body-structures.ts`
- `port/v2/apps/game/src/motion/specialized-anatomy.test.ts`
- `ATTACK_ANATOMY.md`

Everything else in this directory is additive evidence. The prior Prawn deliveries and
Tortoise capture delivery remain immutable. Tortoise's retained software publication
still has explicit full-size visual holds; this coverage correction does not resolve them.
