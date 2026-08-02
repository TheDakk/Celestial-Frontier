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
import { faunaBird, type BirdSpec, type FaunaPainter } from './faunaoverrides.js';

const B = (spec: BirdSpec): FaunaPainter => (c, g, p, n) => faunaBird(c, g, p, spec, n);

export const BIRD_NAME: Record<string, FaunaPainter> = {
  /* ── raptors and scavengers: the hooked bill, the heavy foot ── */
  'Osprey': B({ legs: 0.02, bill: 'hook', size: 1.02 }),
  'Kestrel': B({ legs: 0.02, bill: 'hook', size: 0.72 }),
  'Condor': B({ legs: 0.03, bill: 'hook', size: 1.30 }),
  'Skua': B({ legs: 0.02, bill: 'hook', size: 0.90 }),
  /* ── OWLS: the facial disc, forward eyes, ear tufts ── */
  'Owl': B({ legs: 0.015, bill: 'hook', owl: true, neck: 'none', size: 1.0, crest: true }),
  'Snowy Owl': B({ legs: 0.015, bill: 'hook', owl: true, neck: 'none', size: 1.10 }),
  'Desert Owl': B({ legs: 0.015, bill: 'hook', owl: true, neck: 'none', size: 0.88, crest: true }),
  /* ── corvids and songbirds: small, perched, cone bills ── */
  'Crow': B({ legs: 0.025, bill: 'stout', size: 0.80 }),
  'Raven': B({ legs: 0.025, bill: 'stout', size: 0.92 }),
  'Magpie': B({ legs: 0.025, bill: 'stout', size: 0.74, tail: 'long' }),
  'Jay': B({ legs: 0.02, bill: 'stout', size: 0.66, crest: true }),
  'Chough': B({ legs: 0.02, bill: 'long', size: 0.70 }),
  'Sparrow': B({ legs: 0.015, bill: 'short', size: 0.46 }),
  'Finch': B({ legs: 0.015, bill: 'short', size: 0.44 }),
  'Robin': B({ legs: 0.018, bill: 'short', size: 0.50 }),
  'Cardinal': B({ legs: 0.018, bill: 'short', size: 0.54, crest: true }),
  'Tanager': B({ legs: 0.015, bill: 'short', size: 0.48 }),
  'Weaverbird': B({ legs: 0.015, bill: 'short', size: 0.46 }),
  'Starling': B({ legs: 0.018, bill: 'short', size: 0.52 }),
  'Lark': B({ legs: 0.020, bill: 'short', size: 0.48 }),
  'Swallow': B({ legs: 0.012, bill: 'short', size: 0.46, tail: 'forked' }),
  'Swift': B({ legs: 0.010, bill: 'short', size: 0.46, tail: 'forked' }),
  'Hummingbird': B({ legs: 0.008, bill: 'needle', size: 0.34 }),
  'Kingfisher': B({ legs: 0.012, bill: 'chisel', size: 0.56, crest: true }),
  'Woodpecker': B({ legs: 0.015, bill: 'chisel', size: 0.62, crest: true }),
  'Quetzal': B({ legs: 0.015, bill: 'short', size: 0.62, tail: 'long', crest: true }),
  /* ── parrots ── */
  'Parrot': B({ legs: 0.018, bill: 'hook', size: 0.72 }),
  'Macaw': B({ legs: 0.020, bill: 'hook', size: 0.92, tail: 'long' }),
  'Cockatoo': B({ legs: 0.020, bill: 'hook', size: 0.82, crest: true }),
  /* ── gamebirds: heavy body, short legs, fanned tails ── */
  'Peacock': B({ legs: 0.045, bill: 'stout', size: 0.96, tail: 'fan', eyespots: true, crest: true }),
  'Pheasant': B({ legs: 0.045, bill: 'stout', size: 0.86, tail: 'long' }),
  'Turkey': B({ legs: 0.045, bill: 'stout', size: 1.05, tail: 'fan' }),
  'Grouse': B({ legs: 0.030, bill: 'stout', size: 0.80, tail: 'fan' }),
  'Ptarmigan': B({ legs: 0.028, bill: 'stout', size: 0.72 }),
  'Quail': B({ legs: 0.025, bill: 'short', size: 0.54, crest: true }),
  'Partridge': B({ legs: 0.028, bill: 'short', size: 0.62 }),
  'Guineafowl': B({ legs: 0.040, bill: 'short', size: 0.78, crest: true }),
  'Bustard': B({ legs: 0.075, bill: 'stout', size: 0.98 }),
  'Sandgrouse': B({ legs: 0.028, bill: 'short', size: 0.60 }),
  'Roadrunner': B({ legs: 0.060, bill: 'long', size: 0.72, tail: 'long', crest: true }),
  'Dove': B({ legs: 0.018, bill: 'short', size: 0.58 }),
  'Pigeon': B({ legs: 0.020, bill: 'short', size: 0.62 }),
  /* ── WATERFOWL: the waterline is the whole read ── */
  'Duck': B({ legs: 0.010, bill: 'duck', size: 0.76, swim: true, neck: 'short' }),
  'Eider Duck': B({ legs: 0.010, bill: 'duck', size: 0.82, swim: true, neck: 'short' }),
  'Goose': B({ legs: 0.012, bill: 'duck', size: 0.98, swim: true, neck: 'long' }),
  'Coot': B({ legs: 0.012, bill: 'short', size: 0.62, swim: true }),
  'Moorhen': B({ legs: 0.012, bill: 'short', size: 0.60, swim: true }),
  'Loon': B({ legs: 0.008, bill: 'long', size: 0.86, swim: true, neck: 'long' }),
  'Grebe': B({ legs: 0.008, bill: 'long', size: 0.66, swim: true, neck: 'long', crest: true }),
  'Cormorant': B({ legs: 0.012, bill: 'hook', size: 0.90, swim: true, neck: 'long' }),
  /* ── UPRIGHT divers: a flipper, not a wing ── */
  'Penguin': B({ legs: 0.012, bill: 'stout', size: 0.94, upright: true, neck: 'none', flightless: true }),
  'Auk': B({ legs: 0.012, bill: 'stout', size: 0.68, upright: true, neck: 'none' }),
  'Guillemot': B({ legs: 0.012, bill: 'long', size: 0.70, upright: true, neck: 'none' }),
  /* ── seabirds ── */
  'Gull': B({ legs: 0.030, bill: 'stout', size: 0.82 }),
  'Tern': B({ legs: 0.022, bill: 'long', size: 0.64, tail: 'forked' }),
  'Petrel': B({ legs: 0.014, bill: 'long', size: 0.62 }),
  'Snow Petrel': B({ legs: 0.014, bill: 'long', size: 0.60 }),
  'Gannet': B({ legs: 0.016, bill: 'long', size: 0.92 }),
  'Booby': B({ legs: 0.020, bill: 'long', size: 0.84 }),
  'Tropicbird': B({ legs: 0.012, bill: 'long', size: 0.70, tail: 'long' }),
  'Frigatebird': B({ legs: 0.012, bill: 'hook', size: 0.96, tail: 'forked' }),
  'Seabird': B({ legs: 0.024, bill: 'long', size: 0.76 }),
  /* ── shorebirds and marsh ── */
  'Plover': B({ legs: 0.045, bill: 'short', size: 0.50 }),
  'Sandpiper': B({ legs: 0.050, bill: 'long', size: 0.50 }),
  'Curlew': B({ legs: 0.070, bill: 'long', size: 0.72 }),
  'Oystercatcher': B({ legs: 0.055, bill: 'long', size: 0.66 }),
  'Egret': B({ legs: 0.120, bill: 'long', size: 0.84, neck: 'long' }),
  'Bittern': B({ legs: 0.080, bill: 'long', size: 0.74, neck: 'long' }),
  'Rail': B({ legs: 0.055, bill: 'long', size: 0.56 }),
  /* ── the big flightless ratites ── */
  'Rhea': B({ legs: 0.125, bill: 'stout', size: 1.12, flightless: true, neck: 'long' }),
  'Seriema': B({ legs: 0.095, bill: 'hook', size: 0.80, crest: true }),
  'Screamer': B({ legs: 0.060, bill: 'short', size: 0.88 }),
  /* ── the swan's S-curve ── */
  'Swan': B({ legs: 0.012, bill: 'duck', size: 1.10, swim: true, neck: 'swan' }),
};
