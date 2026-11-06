# PROGRAM C266 — all-agents pass over the 194 unaccepted species (Claude, 2026-10-17)

Dakk: "I would like to do a pass where we're doing more agents to finish all this at once."

## What limits speed

C383 filmed 16 times and accepted none. GPU time per species is about two minutes. The time goes into repair loops on paintings
and labels that were never going to pass. So more agents help only on the CPU side: each one should hand the GPU queue
a source that already passes static and has been looked at, and should fix a hold *class* once rather than one species at a time.
The GPU queue stays one heavy job at a time with the 30 GiB floor (42 GiB before inference).

## Where the 194 sit (C383 `remaining-species.json`)

| Bucket | Count | Owner this pass |
|---|---|---|
| SOURCE_INTAKE_REFUSED (auto-author refuses the painting) | 90 | Claude agents author observed-source labels on the exact original (CPU); a painting missing the anatomy gets a corrected prompt for Codex to generate |
| REFERENCE_BLOCKED | 50 | Claude: family template design for radial, annelid, clawed decapod, arachnid, myriapod (patches, not applied) |
| VISUAL_HOLD | 24 | pink key fringe class (8) and seam/tear class (11): Claude diagnoses and supplies a fix proven on stills; eels leaving the frame (2) and serpent victory (2): motion patch |
| SOURCE_IDENTITY_HOLD | 14 | Claude writes canonical-pose generation prompts; Codex generates |
| class stops and static RED | 16 | crab/bat/bivalve stops, Mandrill, Orangutan, Owl, Echidna: Claude source plans |

## Claude lane (CPU only, nine workstreams, each with an independent verifier)

1. **Pink fringe** (Bee, Honeybee, Moth, Thrips, Lionfish, Pipefish, Walrus, Warthog): find where key colour survives finish and supply a despill fix proven on the existing finished stills.
2. **Seams, mammals** (Kangaroo jaw, Wallaby arm/chest, Monkey shoulder, Gibbon).
3. **Seams, birds and shells** (Hoatzin, Kakapo, Kookaburra, Pheasant, Cassowary, Giant Clam, Oyster).
4. **Motion** (Gulper Eel and Moray Eel leave the frame; Boa and Mountain Viper victory, patches already in `audits/C262_REFERENCES_20261016/axial-foreground/`).
5. **Intake, quadrupeds and primates** (27).
6. **Intake, insects and arachnids** (20).
7. **Intake, crustaceans** (14).
8. **Intake, fish, birds, snake, hare** (29).
9. **Identity holds, static RED and class stops** (30): corrected prompts and source plans.

Output lands in `audits/C266_ALLOUT_20261017/<workstream>/`. A packet is posted only after its verifier passes it. No runtime code is
applied: motion and template changes come as patches with proof, for Dakk's call.

## Codex lane

Coordinator plus workers as in C262. Codex films and finishes only Claude-verified packets and its own W2-CLEAN films, and generates
new paintings only from the corrected prompts. Class rule stays: prove a fix on one representative before propagating.
