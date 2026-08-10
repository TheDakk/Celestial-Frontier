/* birdoverrides.ts — THE MORPHOLOGY PASS, wave 9: THE BIRDS.
   77 catalog birds were still on the verbatim engine — the largest group
   left after wave 8's fish, measured the same way (the catalog diffed
   against every override table, never recalled from memory).

   Wave 3's faunaBird gave every bird THE WING, and the reviews scored it
   well, so this wave EXTENDS its spec rather than replacing it (D-ART-14:
   never override what already excels). The new axes are all optional and
   defaulted, so the 28 wave-3 birds take the code paths they always took:
     · size      — a hummingbird is not an ostrich, and body scale said so
                   nowhere; every bird was one size with different legs
     · neck      — short · long · SWAN (the S-curve IS the bird) · none
     · tail      — short · fan · long streamers · forked, + peacock ocelli
     · owl       — the facial disc and FORWARD-FACING eyes; the one head in
                   the catalog that does not read in profile
     · swim      — the WATERLINE, which is why a duck reads as a duck and
                   not as a bird standing in a hole
     · upright   — the penguin/auk stance: a stiff FLIPPER, not a wing
     · bills     — short (finch cone) · chisel (woodpecker) · needle
                   (hummingbird) · duck (spatulate) */
import { faunaBird, faunaBirdB1, faunaBirdB2, type BirdB1Kind, type BirdB2Kind, type BirdSpec, type FaunaPainter } from './faunaoverrides.js';

const B = (spec: BirdSpec): FaunaPainter => (c, g, p, n) => faunaBird(c, g, p, spec, n);
const B1 = (kind: BirdB1Kind): FaunaPainter => (c, g, p) => faunaBirdB1(c, g, p, kind);
const B2 = (kind: BirdB2Kind): FaunaPainter => (c, g, p) => faunaBirdB2(c, g, p, kind);

/* Named B1 routes live outside the table so the override audit sees a strict
   species-to-painter mapping rather than treating anatomy labels as routes. */
const ospreyB1 = B1('Osprey'), kestrelB1 = B1('Kestrel'), condorB1 = B1('Condor');
const owlB1 = B1('Owl'), snowyOwlB1 = B1('Snowy Owl'), desertOwlB1 = B1('Desert Owl');
const hummingbirdB1 = B1('Hummingbird'), woodpeckerB1 = B1('Woodpecker');
const bustardB1 = B1('Bustard'), rheaB1 = B1('Rhea'), seriemaB1 = B1('Seriema'), screamerB1 = B1('Screamer');

/* Wave 2c B2: literal named whole forms. Keep the kind strings outside the
   route table so the override audit sees only species-to-painter ownership. */
const duckB2 = B2('Duck'), eiderDuckB2 = B2('Eider Duck'), gooseB2 = B2('Goose');
const flamingoB2 = B2('Flamingo'), heronB2 = B2('Heron'), bitternB2 = B2('Bittern'), egretB2 = B2('Egret');
const cootB2 = B2('Coot'), moorhenB2 = B2('Moorhen'), railB2 = B2('Rail');
const pelicanB2 = B2('Pelican'), boobyB2 = B2('Booby'), cormorantB2 = B2('Cormorant');
const frigatebirdB2 = B2('Frigatebird'), gannetB2 = B2('Gannet'), puffinB2 = B2('Puffin');
const petrelB2 = B2('Petrel'), seabirdB2 = B2('Seabird'), skuaB2 = B2('Skua');
const snowPetrelB2 = B2('Snow Petrel'), ternB2 = B2('Tern');
const avocetB2 = B2('Avocet'), godwitB2 = B2('Godwit'), snipeB2 = B2('Snipe');
const oystercatcherB2 = B2('Oystercatcher'), sandpiperB2 = B2('Sandpiper');
const grebeB2 = B2('Grebe'), loonB2 = B2('Loon');

export const BIRD_NAME: Record<string, FaunaPainter> = {
  /* ── raptors and scavengers: the hooked bill, the heavy foot ── */
  /* wave 50 — see the Hawk/Falcon note in faunaoverrides: three raptors, one
     bird, separated only by hue. An osprey is the biggest of the three and
     flies on long angled wings over water. */
  'Osprey': ospreyB1,
  'Kestrel': kestrelB1,
  'Condor': condorB1,
  'Skua': skuaB2,
  /* ── OWLS: the facial disc, forward eyes, ear tufts ── */
  'Owl': owlB1,
  'Snowy Owl': snowyOwlB1,
  'Desert Owl': desertOwlB1,
  /* ── corvids and songbirds: small, perched, cone bills ── */
  'Crow': B({ legs: 0.025, bill: 'stout', size: 0.80, hue: '#23252e', billHue: '#16171c', legHue: '#16171c', tail: 'square' }),
  'Raven': B({ legs: 0.025, bill: 'hook', size: 0.92, hue: '#191b22', plump: 1.06, elong: 1.08, billHue: '#141519', legHue: '#141519', tail: 'wedge', shaggy: true }),
  'Magpie': B({ legs: 0.025, bill: 'stout', size: 0.74, tail: 'long', hue: '#22242c', billHue: '#141519', legHue: '#141519', bib: '#eef0f2' }),
  'Jay': B({ legs: 0.02, bill: 'stout', size: 0.66, crest: true, hue: '#3f6fa8' }),
  'Chough': B({ legs: 0.02, bill: 'long', size: 0.70, hue: '#24262c' , billHue: '#e2451c', legHue: '#d93a12' }),
  'Sparrow': B({ legs: 0.015, bill: 'cone', size: 0.46, hue: '#8a6f4c', plump: 1.10, elong: 0.96, streak: true, cap: '#6b5334' }),
  'Finch': B({ legs: 0.015, bill: 'cone', size: 0.44, hue: '#a8552f', plump: 1.18, elong: 0.92 }),
  'Robin': B({ legs: 0.018, bill: 'fine', size: 0.50, hue: '#6d6154', plump: 1.28, elong: 0.86, bib: '#d4622a' }),
  'Cardinal': B({ legs: 0.018, bill: 'cone', size: 0.54, hue: '#c0261f', plump: 1.22, elong: 0.88, crest: true, mask: true }),
  'Tanager': B({ legs: 0.015, bill: 'cone', size: 0.48, hue: '#c9342b', plump: 1.12, elong: 0.94 }),
  'Weaverbird': B({ legs: 0.015, bill: 'cone', size: 0.46, hue: '#e3c231', plump: 1.10, elong: 0.94, mask: true, nest: true }),
  'Starling': B({ legs: 0.018, bill: 'fine', size: 0.52, hue: '#2b2f3d', plump: 0.94, elong: 1.06, speckle: true  }),
  'Lark': B({ legs: 0.020, bill: 'fine', size: 0.48, hue: '#9c8560', plump: 0.98, elong: 1.06, streak: true, crest: true }),
  'Swallow': B({ legs: 0.012, bill: 'fine', size: 0.46, hue: '#2f4a6b', plump: 0.74, elong: 1.34, tail: 'forked', bib: '#c9743e' }),
  'Swift': B({ legs: 0.008, bill: 'fine', size: 0.46, hue: '#4b4640', plump: 0.58, elong: 1.62, tail: 'forked' }),
  'Hummingbird': hummingbirdB1,
  'Kingfisher': B({ legs: 0.012, bill: 'long', size: 0.62, crest: true, headMass: 1.52, neck: 'none', tail: 'short', hue: '#1b6fa8' }),
  'Woodpecker': woodpeckerB1,
  'Quetzal': B({ legs: 0.015, bill: 'short', size: 0.62, tail: 'long', crest: true, hue: '#0f8a6a' }),
  /* ── parrots ── */
  'Parrot': B({ legs: 0.018, bill: 'hook', parrotBill: true, zygo: true, headMass: 1.3, size: 0.72, tail: 'long', hue: '#2f9e4a' }),
  /* ★ D-ART-121 — a macaw's bill and feet had REGRESSED to the shared eagle
     assets; a parrot's deep bill and two-back toes are its whole read. */
  'Macaw': B({ legs: 0.020, bill: 'hook', parrotBill: true, zygo: true, headMass: 1.4, size: 0.92, tail: 'long', hue: '#c2331f' }),
  'Cockatoo': B({ legs: 0.020, bill: 'hook', size: 0.82, crest: true, hue: '#f0ece2' }),
  /* ── gamebirds: heavy body, short legs, fanned tails ── */
  'Peacock': B({ legs: 0.045, bill: 'stout', size: 0.96, tail: 'train', eyespots: true, crest: true, hue: '#12656b' }),
  'Pheasant': B({ legs: 0.045, bill: 'stout', size: 0.86, tail: 'long', hue: '#8c4a22' }),
  'Turkey': B({ legs: 0.045, bill: 'stout', size: 1.05, tail: 'fan', hue: '#4a3a2c' }),
  'Grouse': B({ legs: 0.030, bill: 'short', size: 0.80, tail: 'fan', hue: '#6d5942', streak: true, featherFeet: true, browComb: true }),
  'Ptarmigan': B({ legs: 0.028, bill: 'stout', size: 0.72, hue: '#e8e6df', browComb: true, featherFeet: true }),
  'Quail': B({ legs: 0.025, bill: 'short', size: 0.54, crest: true, hue: '#a08761' }),
  'Partridge': B({ legs: 0.028, bill: 'short', size: 0.62, hue: '#a4794e', plump: 1.20, elong: 0.94, streak: true }),
  'Guineafowl': B({ legs: 0.040, bill: 'short', size: 0.78, pearled: true, hue: '#3c4250' }),
  'Bustard': bustardB1,
  'Sandgrouse': B({ legs: 0.028, bill: 'short', size: 0.60, hue: '#c3a878', plump: 0.96, elong: 1.14, speckle: true }),
  'Roadrunner': B({ legs: 0.060, bill: 'long', size: 0.72, tail: 'long', crest: true, hue: '#8a7554' }),
  'Dove': B({ legs: 0.018, bill: 'fine', size: 0.58, hue: '#b9aa9c', plump: 1.14, elong: 1.00 }),
  'Pigeon': B({ legs: 0.020, bill: 'fine', size: 0.62, hue: '#6e7684', plump: 1.06, elong: 1.04, cap: '#3f6a63' }),
  /* ── WATERFOWL: the waterline is the whole read ── */
  'Duck': duckB2,
  'Eider Duck': eiderDuckB2,
  'Goose': gooseB2,
  /* sooty black with a WHITE bill running up into a white forehead shield */
  'Coot': cootB2,
  /* red bill and shield, and a WHITE STREAK along the flank */
  'Moorhen': moorhenB2,
  'Loon': loonB2,
  'Grebe': grebeB2,
  'Cormorant': cormorantB2,
  /* ── UPRIGHT divers: a flipper, not a wing ── */
  'Penguin': B({ legs: 0.012, bill: 'stout', size: 0.94, upright: true, neck: 'none', flightless: true, hue: '#20242c' }),
  'Auk': B({ legs: 0.012, bill: 'stout', size: 0.68, upright: true, neck: 'none', hue: '#26292f'  }),
  'Guillemot': B({ legs: 0.012, bill: 'long', size: 0.70, upright: true, neck: 'none', hue: '#2b2f36'  }),
  /* ── seabirds ── */
  'Gull': B({ legs: 0.030, bill: 'hook', size: 0.82, hue: '#e6e9ee', billHue: '#e0b13c', wings: 'soaring', belly: '#f4f5f5' }),
  'Tern': ternB2,
  'Petrel': petrelB2,
  'Snow Petrel': snowPetrelB2,
  'Gannet': gannetB2,
  'Booby': boobyB2,
  'Tropicbird': B({ legs: 0.012, bill: 'long', size: 0.70, tail: 'long', hue: '#f0f2f5' }),
  'Frigatebird': frigatebirdB2,
  'Seabird': seabirdB2,
  'Pelican': pelicanB2,
  'Puffin': puffinB2,
  /* ── shorebirds and marsh ── */
  'Plover': B({ legs: 0.045, bill: 'short', size: 0.50, hue: '#8d8778', plump: 1.16, elong: 0.92, bib: '#f0ece2' }),
  'Sandpiper': sandpiperB2,
  'Curlew': B({ legs: 0.100, bill: 'downcurve', size: 0.72, hue: '#a2916f', billHue: '#2b2118', legHue: '#8b6b52' }),
  'Oystercatcher': oystercatcherB2,
  'Egret': egretB2,
  'Bittern': bitternB2,
  'Rail': railB2,
  'Flamingo': flamingoB2,
  'Heron': heronB2,
  'Avocet': avocetB2,
  'Godwit': godwitB2,
  'Snipe': snipeB2,
  /* ── the big flightless ratites ── */
  'Rhea': rheaB1,
  'Seriema': seriemaB1,
  'Screamer': screamerB1,
  /* ── the swan's S-curve ── */
  'Swan': B({ legs: 0.012, bill: 'duck', size: 1.10, swim: true, neck: 'swan', hue: '#f4f6f8' , billHue: '#e08a1c', legHue: '#2a2723' }),
  /* ★ WAVE 10 — Chicken and Rooster were unrouted and came out as waders.
     A gamebird is a plump body on scaly legs with a comb, wattles and an
     upswept tail; the rooster adds the sickle plumes and the hackle cape. */
  'Chicken': B({ legs: 0.038, bill: 'cone', size: 0.74, hue: '#c9a05c', plump: 1.30, elong: 0.90, tail: 'shortFan', comb: true }),
  'Rooster': B({ legs: 0.046, bill: 'cone', size: 0.86, hue: '#8d3a24', plump: 1.24, elong: 0.92, tail: 'sickle', comb: true, bib: '#d8a53a' }),
};
