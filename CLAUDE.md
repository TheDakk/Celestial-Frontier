# Agent rules for Claude

## What this branch is
- The clean v2 code branch of Celestial Frontier.
- Designs and plans live on the `celestial-frontier-v2-design` branch.

## The four rules
1. The game stays the game. Every system carries over. Pixel art replaces the art layer only. Anything better than the current game is named as an improvement, separate from the conversion. No system is dropped, shrunk or redesigned as a side effect. If conversion seems to need gameplay removed, stop and ask Dakk.
2. Procedural generation is the heart. Anything a seed can produce must be drawable and animatable, identically on every device, offline.
3. The code branch stays clean. It holds only what the game needs to build, run and test. No designs, plans, notes, references, images or evidence.
4. Only clean and necessary code is ported. Nothing arrives because it existed before.

Fifth goal: a small change to the game must be small to ship.

## Ownership
- Claude owns code, tests and the renderer.
- Codex owns art packs, the manifest and authoring tools, on its own local branch.
- One owner per folder. Ask the owner before changing their folder.

## Hard rules
- No push, pull request, branch deletion, force operation, release or deploy without Dakk's explicit word for that exact action.
- Signed commits only.
- Hosted runs only on Dakk's label.
- Refer to the owner only as Dakk.
- No real name, email address or home path in any file.

## How to work
- One short task branch per task, off the code branch.
- `npm run gate` must be green before merging.
- A small change must be small to ship.

## Process laws
- Assert the outcome, not the code path.
- Prove every new check both ways.
- Suspect the instrument first.
- Judge visuals on stills at real size.
- Find every reader and writer of a field before changing it.
- A disagreement between a document and the code is a finding.

## Never on this branch
- Images, designs, plans, notes, evidence.
