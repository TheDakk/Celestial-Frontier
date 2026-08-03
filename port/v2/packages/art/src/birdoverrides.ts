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
  'Osprey': B({ legs: 0.02, bill: 'hook', size: 1.02, hue: '#6c5f50' }),
  'Kestrel': B({ legs: 0.02, bill: 'hook', size: 0.72, hue: '#a5713d' }),
  'Condor': B({ legs: 0.03, bill: 'hook', size: 1.30, hue: '#2a2723' }),
  'Skua': B({ legs: 0.02, bill: 'hook', size: 0.90, hue: '#5d5347' }),
  /* ── OWLS: the facial disc, forward eyes, ear tufts ── */
  'Owl': B({ legs: 0.015, bill: 'hook', owl: true, neck: 'none', size: 1.0, crest: true, hue: '#7d6a4f' }),
  'Snowy Owl': B({ legs: 0.015, bill: 'hook', owl: true, neck: 'none', size: 1.10, hue: '#eef1f4' }),
  'Desert Owl': B({ legs: 0.015, bill: 'hook', owl: true, neck: 'none', size: 0.88, crest: true, hue: '#c3ab84' }),
  /* ── corvids and songbirds: small, perched, cone bills ── */
  'Crow': B({ legs: 0.025, bill: 'stout', size: 0.80, hue: '#23252e' }),
  'Raven': B({ legs: 0.025, bill: 'stout', size: 0.92, hue: '#191b22', plump: 1.06, elong: 1.08 }),
  'Magpie': B({ legs: 0.025, bill: 'stout', size: 0.74, tail: 'long', hue: '#22242c' }),
  'Jay': B({ legs: 0.02, bill: 'stout', size: 0.66, crest: true, hue: '#3f6fa8' }),
  'Chough': B({ legs: 0.02, bill: 'long', size: 0.70, hue: '#24262c' }),
  'Sparrow': B({ legs: 0.015, bill: 'cone', size: 0.46, hue: '#8a6f4c', plump: 1.10, elong: 0.96, streak: true, cap: '#6b5334' }),
  'Finch': B({ legs: 0.015, bill: 'cone', size: 0.44, hue: '#a8552f', plump: 1.18, elong: 0.92 }),
  'Robin': B({ legs: 0.018, bill: 'fine', size: 0.50, hue: '#6d6154', plump: 1.28, elong: 0.86, bib: '#d4622a' }),
  'Cardinal': B({ legs: 0.018, bill: 'cone', size: 0.54, hue: '#c0261f', plump: 1.22, elong: 0.88, crest: true, mask: true }),
  'Tanager': B({ legs: 0.015, bill: 'cone', size: 0.48, hue: '#c9342b', plump: 1.12, elong: 0.94 }),
  'Weaverbird': B({ legs: 0.015, bill: 'cone', size: 0.46, hue: '#e3c231', plump: 1.10, elong: 0.94, mask: true }),
  'Starling': B({ legs: 0.018, bill: 'fine', size: 0.52, hue: '#2b2f3d', plump: 0.94, elong: 1.06, speckle: true }),
  'Lark': B({ legs: 0.020, bill: 'fine', size: 0.48, hue: '#9c8560', plump: 0.98, elong: 1.06, streak: true, crest: true }),
  'Swallow': B({ legs: 0.012, bill: 'fine', size: 0.46, hue: '#2f4a6b', plump: 0.74, elong: 1.34, tail: 'forked', bib: '#c9743e' }),
  'Swift': B({ legs: 0.008, bill: 'fine', size: 0.46, hue: '#4b4640', plump: 0.58, elong: 1.62, tail: 'forked' }),
  'Hummingbird': B({ hue: '#1e8a5a', legs: 0.008, bill: 'needle', size: 0.34 }),
  'Kingfisher': B({ legs: 0.012, bill: 'chisel', size: 0.56, crest: true, hue: '#1b6fa8' }),
  'Woodpecker': B({ legs: 0.015, bill: 'chisel', size: 0.62, crest: true, hue: '#2c2a28' }),
  'Quetzal': B({ legs: 0.015, bill: 'short', size: 0.62, tail: 'long', crest: true, hue: '#0f8a6a' }),
  /* ── parrots ── */
  'Parrot': B({ legs: 0.018, bill: 'hook', parrotBill: true, zygo: true, headMass: 1.3, size: 0.72, tail: 'long', hue: '#2f9e4a' }),
  /* ★ D-ART-121 — a macaw's bill and feet had REGRESSED to the shared eagle
     assets; a parrot's deep bill and two-back toes are its whole read. */
  'Macaw': B({ legs: 0.020, bill: 'hook', parrotBill: true, zygo: true, headMass: 1.4, size: 0.92, tail: 'long', hue: '#c2331f' }),
  'Cockatoo': B({ legs: 0.020, bill: 'hook', size: 0.82, crest: true, hue: '#f0ece2' }),
  /* ── gamebirds: heavy body, short legs, fanned tails ── */
  'Peacock': B({ legs: 0.045, bill: 'stout', size: 0.96, tail: 'fan', eyespots: true, crest: true, hue: '#12656b' }),
  'Pheasant': B({ legs: 0.045, bill: 'stout', size: 0.86, tail: 'long', hue: '#8c4a22' }),
  'Turkey': B({ legs: 0.045, bill: 'stout', size: 1.05, tail: 'fan', hue: '#4a3a2c' }),
  'Grouse': B({ legs: 0.030, bill: 'stout', size: 0.80, tail: 'fan', hue: '#6d5942' }),
  'Ptarmigan': B({ legs: 0.028, bill: 'stout', size: 0.72, hue: '#e8e6df' }),
  'Quail': B({ legs: 0.025, bill: 'short', size: 0.54, crest: true, hue: '#a08761' }),
  'Partridge': B({ legs: 0.028, bill: 'cone', size: 0.62, hue: '#a4794e', plump: 1.20, elong: 0.94, streak: true }),
  'Guineafowl': B({ legs: 0.040, bill: 'short', size: 0.78, crest: true, hue: '#3c4250' }),
  'Bustard': B({ legs: 0.075, bill: 'stout', size: 0.98, hue: '#a08f70' }),
  'Sandgrouse': B({ legs: 0.028, bill: 'short', size: 0.60, hue: '#c3a878', plump: 0.96, elong: 1.14, speckle: true }),
  'Roadrunner': B({ legs: 0.060, bill: 'long', size: 0.72, tail: 'long', crest: true, hue: '#8a7554' }),
  'Dove': B({ legs: 0.018, bill: 'fine', size: 0.58, hue: '#b9aa9c', plump: 1.14, elong: 1.00 }),
  'Pigeon': B({ legs: 0.020, bill: 'fine', size: 0.62, hue: '#6e7684', plump: 1.06, elong: 1.04, cap: '#3f6a63' }),
  /* ── WATERFOWL: the waterline is the whole read ── */
  'Duck': B({ legs: 0.010, bill: 'duck', size: 0.76, swim: true, neck: 'short', hue: '#5b6b4a' }),
  'Eider Duck': B({ legs: 0.010, bill: 'duck', size: 0.82, swim: true, neck: 'short', hue: '#e4e2dc' }),
  'Goose': B({ legs: 0.012, bill: 'duck', size: 0.98, swim: true, neck: 'long', hue: '#7d7468' }),
  /* sooty black with a WHITE bill running up into a white forehead shield */
  'Coot': B({ legs: 0.012, bill: 'cone', size: 0.62, swim: true, hue: '#26292f', plump: 1.16, cap: '#eef0f2' }),
  /* red bill and shield, and a WHITE STREAK along the flank */
  'Moorhen': B({ legs: 0.012, bill: 'cone', size: 0.60, swim: true, hue: '#3d4a44', plump: 1.06, cap: '#c33a26', bib: '#e8e6df' }),
  'Loon': B({ legs: 0.008, bill: 'long', size: 0.86, swim: true, neck: 'long', hue: '#23272e' }),
  'Grebe': B({ legs: 0.008, bill: 'long', size: 0.66, swim: true, neck: 'long', crest: true, hue: '#6a5340' }),
  'Cormorant': B({ legs: 0.012, bill: 'hook', size: 0.90, swim: true, neck: 'long', hue: '#262a2e' }),
  /* ── UPRIGHT divers: a flipper, not a wing ── */
  'Penguin': B({ legs: 0.012, bill: 'stout', size: 0.94, upright: true, neck: 'none', flightless: true, hue: '#20242c' }),
  'Auk': B({ legs: 0.012, bill: 'stout', size: 0.68, upright: true, neck: 'none', hue: '#26292f' }),
  'Guillemot': B({ legs: 0.012, bill: 'long', size: 0.70, upright: true, neck: 'none', hue: '#2b2f36' }),
  /* ── seabirds ── */
  'Gull': B({ legs: 0.030, bill: 'stout', size: 0.82, hue: '#e6e9ee' }),
  'Tern': B({ legs: 0.022, bill: 'long', size: 0.64, tail: 'forked', hue: '#e9edf2' }),
  'Petrel': B({ legs: 0.014, bill: 'long', size: 0.62, hue: '#4d4741' }),
  'Snow Petrel': B({ legs: 0.014, bill: 'long', size: 0.60, hue: '#f1f4f7' }),
  'Gannet': B({ legs: 0.016, bill: 'long', size: 0.92, hue: '#eef0f2' }),
  'Booby': B({ legs: 0.020, bill: 'long', size: 0.84, hue: '#dfe3e8' }),
  'Tropicbird': B({ legs: 0.012, bill: 'long', size: 0.70, tail: 'long', hue: '#f0f2f5' }),
  'Frigatebird': B({ legs: 0.012, bill: 'hook', size: 0.96, tail: 'forked', hue: '#22242a' }),
  'Seabird': B({ legs: 0.024, bill: 'long', size: 0.76, hue: '#cfd5dc' }),
  /* ── shorebirds and marsh ── */
  'Plover': B({ legs: 0.045, bill: 'short', size: 0.50, hue: '#8d8778', plump: 1.16, elong: 0.92, bib: '#f0ece2' }),
  'Sandpiper': B({ legs: 0.050, bill: 'long', size: 0.50, hue: '#a2926f', plump: 0.94, elong: 1.10, streak: true }),
  'Curlew': B({ legs: 0.070, bill: 'long', size: 0.72, hue: '#a2916f' }),
  'Oystercatcher': B({ legs: 0.055, bill: 'long', size: 0.66, hue: '#23262b' }),
  'Egret': B({ legs: 0.120, bill: 'long', size: 0.84, neck: 'long', hue: '#f2f4f6' }),
  'Bittern': B({ legs: 0.080, bill: 'long', size: 0.74, neck: 'long', hue: '#9b8256' }),
  'Rail': B({ legs: 0.055, bill: 'long', size: 0.56, hue: '#7b6a52' }),
  /* ── the big flightless ratites ── */
  'Rhea': B({ legs: 0.125, bill: 'stout', size: 1.12, flightless: true, neck: 'long', hue: '#8b8172' }),
  'Seriema': B({ legs: 0.095, bill: 'hook', size: 0.80, crest: true, hue: '#a99878' }),
  'Screamer': B({ legs: 0.060, bill: 'short', size: 0.88, hue: '#6b6459' }),
  /* ── the swan's S-curve ── */
  'Swan': B({ legs: 0.012, bill: 'duck', size: 1.10, swim: true, neck: 'swan', hue: '#f4f6f8' }),
  /* ★ WAVE 10 — Chicken and Rooster were unrouted and came out as waders.
     A gamebird is a plump body on scaly legs with a comb, wattles and an
     upswept tail; the rooster adds the sickle plumes and the hackle cape. */
  'Chicken': B({ legs: 0.038, bill: 'cone', size: 0.74, hue: '#c9a05c', plump: 1.30, elong: 0.90, tail: 'fan', crest: true }),
  'Rooster': B({ legs: 0.046, bill: 'cone', size: 0.86, hue: '#8d3a24', plump: 1.24, elong: 0.92, tail: 'long', crest: true, bib: '#d8a53a' }),
};
