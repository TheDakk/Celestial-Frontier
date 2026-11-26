/* The capture card as data: which of the three verbs a world offers, the roster's line, and what a press says.
   No element is made here; the screen draws from this.

   LEGACY celestial-frontier.html, v1.8.9:
   - the three buttons, their words and tips, each shown only on a grounded world and only while its kind has a
     species the Compendium does not hold: 13973-13982;
   - the roster line ("N / M in your Compendium", attempts left or "worked out"): 13984-13988;
   - nothing left of a kind: `_captureKind` 14837-14844, said at 14868; Worked Out: 14869-14872;
   - a miss, with its odds in whole percent and the attempts left: 14883-14886;
   - Species Catalogued: 14944-14946; the Rare Find Bonus: 14936-14939.
   The legacy game drew a small picture before each word; here each is the name of an icon. Its "Species
   Catalogued" line led with the rarity's word in the rarity's colour: that word is not built (a new design
   replaces rarity's show). The legacy game shows no odds before a press, and neither does this model.

   The painted port's `capture-card.ts` also held a press lock, focus handling and its own words; the save loop
   is the lock here, and the words are the legacy game's. */
import { preflightCaptureV1, type AcquisitionSnapshotV1, type AcquisitionVerbV1 } from '@cf/domain-acquisition';
import { captureFenceV1, type CaptureFactsV1, type CaptureGateV1 } from './action';

export const CAPTURE_VERBS = Object.freeze(['tame', 'scavenge', 'sample'] as const);

/** Words with icons among them: each part is text, or the name of an icon drawn in its place in the line. */
export type CaptureCopyPart = string | Readonly<{ icon: string }>;
export interface CaptureNotice {
  /** Drawn before the title; null when the legacy game drew none. */
  readonly icon: string | null;
  readonly title: string;
  readonly message: readonly CaptureCopyPart[];
}

export const CAPTURE_VERB_COPY: Readonly<Record<AcquisitionVerbV1, Readonly<{ icon: string; label: string; tip: string; empty: string }>>> = Object.freeze({
  tame: Object.freeze({
    icon: 'tame', label: 'Tame',
    tip: 'Try to tame one of this world’s uncaught beasts — rarer creatures resist harder; crafted gear tips the hand.',
    empty: 'Every beast here already walks your Compendium.',
  }),
  scavenge: Object.freeze({
    icon: 'scavenge', label: 'Scavenge',
    tip: 'Gather an uncaught growth — flora or fungus — for your Compendium. Rarity resists; gear persuades.',
    empty: 'Every growth here is already pressed into your Compendium.',
  }),
  sample: Object.freeze({
    icon: 'sample', label: 'Sample',
    tip: 'Sample an uncaught microbe — the life of primitive worlds. Gentle odds; a research and crafting resource.',
    empty: 'Every microbe here is already sampled into your Compendium.',
  }),
});
const WORKED_OUT = 'This world’s biosphere is spent for now. It regrows as the cosmic year turns — come back later to find it recovered, and its life evolved.';

export interface CaptureCardModel {
  /** What a press must present (`shown`); null when no press may be made from this card. */
  readonly fence: string | null;
  /** The verbs whose button is shown, in the legacy order. */
  readonly offered: readonly AcquisitionVerbV1[];
  readonly total: number;
  /** Species of this roster already in the Compendium. */
  readonly catalogued: number;
  /** Attempts left on this world; null on a world not grounded, where the legacy card shows none. */
  readonly left: number | null;
  /** The roster line of the legacy card. */
  readonly digest: string;
}

/** The card for one snapshot. `gate`: what stands in the way of any press on this world (`captureGateV1`). */
export function captureCardModel(snapshot: AcquisitionSnapshotV1, gate: CaptureGateV1 | null): CaptureCardModel {
  const known = new Set(snapshot.ownership.catalogSpecies.map((row) => row.speciesId));
  const total = snapshot.candidates.length;
  const catalogued = snapshot.candidates.filter((candidate) => known.has(candidate.identity.speciesId)).length;
  const grounded = gate === null;
  const progress = snapshot.ownership.biosphereProgress.find((row) => row.worldKey === snapshot.worldKey);
  const left = grounded ? Math.max(0, snapshot.biosphereYield - (progress !== undefined && progress.cycle === snapshot.cycle ? progress.used : 0)) : null;
  // A button stands while its kind has an uncaught species, spent world or not (13975-13981).
  const offered = grounded ? CAPTURE_VERBS.filter((verb) => {
    const preflight = preflightCaptureV1(snapshot, verb);
    return preflight.kind === 'ready' || preflight.reason === 'depleted';
  }) : [];
  return Object.freeze({
    fence: grounded ? captureFenceV1(snapshot) : null,
    offered: Object.freeze(offered),
    total, catalogued, left,
    digest: `${catalogued} / ${total} in your Compendium`
      + (catalogued < total ? ' — tame and scavenge the rest' : '')
      + (left === null ? '' : ` · ${left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left` : 'worked out'}`),
  });
}

/** What a committed press says: the legacy notices for a hit (two when a rare find paid) or for a miss. */
export function captureResultNotices(facts: CaptureFactsV1): readonly CaptureNotice[] {
  const copy = CAPTURE_VERB_COPY[facts.verb];
  if (!facts.hit) {
    return Object.freeze([Object.freeze({
      icon: copy.icon, title: `${copy.label} — it slipped away`,
      message: Object.freeze([`${facts.name} eluded you (${Math.round(facts.chance * 100)}% odds). ` + (facts.left > 0
        ? `${facts.left} attempt${facts.left === 1 ? '' : 's'} left on this world; sharper gear tips the hand.`
        : 'That was the last attempt — the biosphere is worked out.')]),
    })]);
  }
  const notices: CaptureNotice[] = [Object.freeze({
    icon: null, title: 'Species Catalogued', message: Object.freeze([`${facts.name} — view it in your Compendium.`]),
  })];
  if (facts.stardust > 0) {
    notices.push(Object.freeze({
      icon: 'stardust', title: 'Rare Find Bonus',
      message: Object.freeze([`+${facts.stardust} Stardust for a legendary specimen. Total: ${facts.essence}.`]),
    }));
  }
  return Object.freeze(notices);
}

/** What a press that was not made says, where the legacy game says anything: nothing left of the kind, or a
    spent world. Any other refusal has no legacy words; null. */
export function captureRefusalNotice(verb: AcquisitionVerbV1, detail: string): CaptureNotice | null {
  const copy = CAPTURE_VERB_COPY[verb];
  if (detail === 'empty') return Object.freeze({ icon: copy.icon, title: copy.label, message: Object.freeze([copy.empty]) });
  if (detail === 'depleted') return Object.freeze({ icon: 'world', title: 'Worked Out', message: Object.freeze([WORKED_OUT]) });
  return null;
}
