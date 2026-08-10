# Bat Family Reset Review — 2026-08-10

_Durable independent verdict record for `Bat`, `Fruit Bat`,
`Insect-Eating Bat`, and `Vampire Bat`. This is frozen family evidence only;
it is not a catalogue score, global art PASS, or literal certification._

## Why the family was reopened

Fruit Bat kept the same SHA-256 through GP7.1 r1, r2, and r3—
`877AB8C2028350AF672E4B1E48979834FBCEEC1CE31651A360AD2796AF4B6C72`—
while direct review showed that it did not read as a flying fox. The older
`_rigBat` and newer named `faunaBat` paths each contained useful anatomy, but
the named route owned all four catalogue bats and still produced rigid,
paper-like membranes, weak joined limb anatomy, absent or unreadable feet and
thumb structures, and a generic eye pass that covered Fruit Bat's intended
eyes. This proved that a stable hash identifies the pixels; it does not prove
that the pixels are biologically correct.

The reset used the existing exact set/species contracts plus anatomy references
from the [Smithsonian](https://www.si.edu/spotlight/bats/batfacts), the
[University of Michigan bat-wing atlas](https://animaldiversity.org/collections/mammal_anatomy/bat_wings/),
[Pteropodidae](https://animaldiversity.org/accounts/Pteropodidae/),
[Vespertilionidae](https://animaldiversity.org/accounts/Vespertilionidae/), and
[Common Vampire Bat](https://animaldiversity.org/accounts/Desmodus_rotundus/)
accounts. The required read was one connected shoulder–elbow–wrist–digit
skeleton, continuous membrane attached through the ankle/rear, separate free
thumbs and feet, and species-specific head, ear, nose, tail-membrane, and
posture cues.

## Refine2d did not pass

The first rebuilt family was materially stronger, but independent review kept
all four rows at **FAIL**. Across native 440px, gameplay 300px, and 132px card
evidence, the reviewer could not reliably follow the jointed/radiating digit
supports, joined free thumbs, ankle/foot connections, or the rear
membrane/tail/calcar support. A detail that disappears at the size where the
player sees it is not a satisfied must-read. No prior bat verdict was carried.

## Refine3 independent result

The source was frozen before judging. Independent review of the new unlabeled
family and nearby-control evidence returned:

| Exact identity | Frozen refine3 verdict |
|---|---|
| `earth-fauna / Bat` | **PASS** |
| `earth-fauna / Fruit Bat` | **PASS** |
| `earth-fauna / Insect-Eating Bat` | **PASS** |
| `earth-fauna / Vampire Bat` | **PASS** |

The refine2d blockers are legible in the final pixels at all three scales:
jointed/radiating digit supports, joined free thumbs, ankle/foot connections,
and species-appropriate rear membrane/tail/calcar support. Head and rear-body
differences carry the four unlabeled identities rather than palette alone.

| Frozen unlabeled family evidence | SHA-256 |
|---|---|
| 440px | `EA10A1348227FB7171F1FB8C61F8A97707A1241988C88C864B26D54D9906445C` |
| 300px | `CE38BEDFED401A94A1F3CC3E7F8D4B55C19FDDACC3F8A0204F302B41ABA5C092` |
| 132px | `72E8A20341C66F2C5717AA9E83CD2E798F9982BE426C8AB97AE79A8AB54BE24C` |

The paired rerender reproduced each family hash exactly. All nine native A/B
subjects (four bats plus five nearby controls) repeated byte-for-byte. The
nearby controls also remained identical to refine2d:

| Control evidence | Refine2d = refine3 SHA-256 |
|---|---|
| 440px unlabeled | `5C6389EC3C3CF6B111B2F12063B03E30E7A4ACEB10A771FA9F663C98765C2711` |
| 300px unlabeled | `CF9A0B77228777CF04873F15035F726AE4B073A8726DE483F751A3199E5F85D3` |
| 132px unlabeled | `28F573900797734AB2A2132F5D602264540B14C4BF79E5B934388ED5EF0EEB13` |
| labelled control sheet | `A9010E0D556798F36D24F7DA473138413227F903E3495A2C740ECFEC30FFE241` |

The evidence files are under
`apps/game/smoke/full-reset-audit/bats/` as
`bat-family-refine3-{440,300,132}px-unlabeled.png`, their matching `repeat`
files, and `bat-controls-refine3-{440,300,132}px-unlabeled.png`.

## Boundary of this verdict

This closes the four-bat family review only for the frozen refine3 pixels. It
does not certify the other 1,246 catalogue identities, the hybrid continuity
matrix, a clean-commit full-reset capture, the final image package, or any
release. It also does not replace route, determinism, negative-control, or full
gate results. If a bat painter or any pixel input changes, these verdicts do not
carry: create new hash-bound evidence and rejudge the affected rows.
