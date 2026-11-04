# Overnight sprint O1 — 2026-11-01 → 2026-11-02 (work order)

Authorized by Dakk 2026-11-01 22:30 EST, decisions D44–D46 in `audits/MAILBOX/DECISIONS.md`. Sprint mode: no per-step
stops. A blocked species becomes an evidenced HOLD and the run continues with the next one.

## Goal

Finish the Earth-fauna heavy lifting: all **142** remaining species (131 with no accepted painting, 11 registry HOLDs;
list in `audits/C475_DECISIONS_20261019/delivery/terminal-resumed-final/progress170.json` plus the C506 remainder) go
through painting → fit → static → native → W2 checkpoint → finish → W2/W3 → READY → Claude full-size review, plus the
**first painted guardian** (D2 Earth-temperate apex, the bear, at 1536 per ART_KIT "THE GUARDIAN RULE"). The night ends in
one I5 epoch and ONE certification of every overnight accept (D44).

Starting point: 489/631 certified, 0 pending; develop gate PASS on f8c00a5d84; 65 GiB free; arenas done (45 WebP, 43 biomes).

## Lanes

**Codex (`openai/mac`) — owns the heavy machine all night (one serial reservation, 42 GiB start / 30 GiB floor).**
1. Generate first (remote imagegen, not local heavy): source paintings for the 131 unrepresented species, grouped by
   body family; the D38 green background for pink-fringe-risk species; and ONE bear guardian source at 1536×1536.
   Deliver the guardian source to Claude in an early signed commit.
2. Then the usual serial chain per family, representative first, propagating only after the representative's W2 is
   CLEAN (unchanged C477/C495 procedure): producer/fit → static → native → C261 → W2 checkpoint BEFORE AI → finish →
   rebind → fresh native → W2/W3 → READY packet.
3. Order: the 11 HOLDs whose fix is already decided (Comb pink via D38 green regenerate, Butterfly/Centipede/
   WaterFlea material repairs), then the 131 by family size, largest first (most species per proven template).
4. Signed commit at each wave; a mailbox row per wave naming READY packets. List every runtime/game-imported path you
   change in an `I5_CHANGES.md` so Claude's epoch covers it.
5. TERMINAL row when the queue is drained OR at **06:00 EST**, whichever comes first, releasing the reservation.
   Finish only the current stage at 06:00; leave the rest as an exact, resumable queue.

**Claude (`anthropic/mac`) — CPU only while Codex's reservation is open.** A recurring session tick (~every 25 min):
1. Read Codex's mailbox; merge new signed `HEAD..openai/mac` commits with a hand-reconciled --no-ff (signatures G,
   no mode-120000).
2. Review every new READY packet: all five stills at full size, plus 2× crops of joins, tails, legs and heads (D45).
   ACCEPT or HOLD in `audits/C243_ALLOUT_20261011/review/review-notes.tsv` with a concrete reason; the gallery sheet
   for Dakk's morning QA pass goes in `audits/OVERNIGHT_20261101/gallery/`.
3. Guardian (D46), CPU side: author the bear guardian fit/rig at 1536 from Codex's source, run the static gates and
   the guardian choreography outcome tests; keep it behind `?guardianChoreo=1` (no default change: D6 still waits for
   the iPhone probe).
4. One mailbox row per tick only if something changed (no idle chatter).

**Claude end window (after Codex TERMINAL), one attempt, first red stops, zero retries (D44):**
1. Merge Codex's final signed head; root `node tools/validate.js` and `node tools/check-profile.mjs --profile=develop`
   (from `port/v2`).
2. Guardian native film at 1536 (full-size review, flag-off).
3. Fresh I5 3+1 epoch on the clean signed head, repeating the C502 procedure exactly
   (`audits/C502_I5_EPOCH_20261020/README.md`); select it.
4. D44: ONE certification of exactly the species Claude accepted overnight, with the existing flip owner against the new
   epoch, following the D43 spec (`audits/C504_D43_CERTIFICATION_20261020/coordinator/SPEC.md`): develop before/after,
   validate after, other rows unchanged, coverage regenerated.
5. Morning report in `ROADMAP.md` and the mailbox: certified/pending/held counts, the gallery sheet, and the decisions
   batched for Dakk.

## Hard stops (everything else continues)

- Push / PR / label / hosted run / develop / main / release / deploy: never in this program.
- Any NEW sealed-row rebind or limit change (D32/D39 shape) → that species becomes HOLD with the proposed patch; it is
  batched for Dakk, never applied overnight.
- A signing refusal that one retry does not clear → stop committing; report.
- Free space below 42 GiB at a heavy stage start → stop heavy work, clean own scratch, report.
- No native or heavy CPU from Claude while Codex's reservation is open (its TERMINAL row ends it).
- Visual acceptance means looking at full-size stills; a gate pass is not acceptance.

## Morning deliverables

Certified count (target ≥ 600/631), the gallery sheet of every overnight accept, the HOLD list with exact reasons, the
guardian film, the decisions queue, and disk ≥ 60 GiB after each lane cleans its own scratch.
