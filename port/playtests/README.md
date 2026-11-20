# Human Playtest Records

This directory is an append-only development log. Use
`PLAYTEST_TEMPLATE.md` for every scheduled session and save the completed copy as:

```text
YYYY-MM-DD_<short-commit>_<tester-or-persona-slug>.md
```

Do not overwrite an earlier report when a fix lands. Create a new report bound to the new
preview commit and cross-link the finding it retests. Screenshots or recordings may live in
an external evidence store when they are too large for Git, but the committed report must
record their immutable URL/hash and must remain useful if those media later disappear.

A browser-driven automated persona is valuable evidence, but label it **AUTOMATED**. Do not
describe it as a human accessibility, comfort, comprehension, visual-quality, or fun verdict.
Those questions require real people. The bounded synthesis command is
`npm run persona:report` from `port/v2`; it joins matching passing slice-smoke and glass-matrix
reports into ignored `apps/game/smoke/automated-persona-report.{json,md}` evidence. It does not
create or replace a completed report in this human-log directory.

The current v2 preview has a protected **Bring expedition** import path but no
player-facing export button. For a veteran-import session, the moderator must
prepare a copied v1 save blob outside the preview and retain the untouched
original. Never ask a tester to overwrite or extract their production save as
part of the session itself.

At batch handoff, the active agent records all open playtest findings in `ROADMAP.md`, updates
the affected system references and in-game explanations in the same batch, and names the
exact next retest. Historical reports remain unchanged.
