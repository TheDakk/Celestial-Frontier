# PROGRAM C262 — parallel agents for the C243 finish (Claude, 2026-10-16)

Dakk: "create a prompt that will use multiple agents to complete all of this faster."

## The constraint that decides the shape

There is one Mac GPU and a 30 GiB disk floor. Native filming, AI finish, rebind and finished-native capture stay **one job at a time**;
more agents cannot make that queue run in parallel. What agents *can* do is keep that queue full and stop it carrying work that will
be held. Everything that is CPU-only fans out: source diagnosis, guide/label authoring, static checks, fragment-check, identity cards,
2× checkpoint stills, delivery paperwork and reference packets.

## Codex lane: one coordinator, four workers

| Agent | Owns | May not |
|---|---|---|
| **Coordinator** (the main Codex session) | reservation rows, the GPU queue (one heavy job at a time, ≥30 GiB floor), merges, every signed commit, mailbox rows | hand heavy work to a worker |
| **W1 Source-repair** (one per hold class: jaw/gape = River Dolphin; bird wing-tail = Hoatzin, Kakapo; any new class) | source-side diagnosis, guides, static checks under unchanged limits, one representative per class first | run native/AI jobs, change rulers or limits |
| **W2 Checkpoint reviewer** | for every native film as it lands: all five frames, junctions and jaw/beak gape at 2×, fragment-check over all C243 roots, identity card; verdict CLEAN or HOLD with frames and boxes | promote a film it has not looked at at full size |
| **W3 Finished reviewer** | the same review on finished-native films; ready only when every marker is answered | review its own source repairs (W1's work is checked by W2/W3) |
| **W4 Paperwork** | delivery.json, visual-review.json, remaining-species, per-stage time/yield log | commit or edit outside its batch directory |

Each worker writes only inside its own subdirectory of the batch (`w1-<class>/`, `w2-checkpoint/`, `w3-finished/`, `w4-delivery/`), so two
agents never touch the same file. The coordinator queues only W2-CLEAN films for AI finish (C261). It runs the next queued job the
moment the last one ends, and delivers per batch without review waits.

## Claude lane: reference packets, CPU only

About 64 species are blocked on "no other hand-authored subject of this family". These packets need **no GPU**. Each packet
hand-authors the part labels and landmark inventory on an *existing* exact original of one species in the family. That species then
qualifies its siblings, never itself; a second species in the family qualifies the first. One agent per family group (frogs/toads;
worms/annelids; cephalopods; corals/jellies/colonial filters; bivalves/gastropods/barnacles/chitons; crabs/clawed crustaceans/
xiphosurans; bats; myriapods/lobopods/larvae; arachnids incl. Tarantula with 8 legs + 2 palps + downward fangs). Each packet follows
the format of the existing hand-authored subjects, gets negative controls (a wrong-family subject must fail it), and lists every exact
source master by index. A verifier agent checks each packet against the compiler before it is posted. Claude also takes the battle2
axial victory foreground envelope (Boa, Mountain Viper), the Monkey wrist seam and the Wall Lizard tail interpretation as separate
agents. None of this needs a native window, so it runs while Codex holds its reservation. Claude posts packets in its mailbox as they
pass, and Codex picks them up at its next batch end.
