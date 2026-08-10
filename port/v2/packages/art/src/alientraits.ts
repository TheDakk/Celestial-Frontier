/* alientraits.ts — THE MORPHOLOGY PASS, wave 14: STRANGENESS INSIDE OUR
   RENDERING LANGUAGE.

   Wave 13 routed procedural genomes through our body-plan systems and bought
   coherence at a price Nick and I both named out loud: the mapped plans read
   markedly more EARTH-LIKE, and the segmented aliens with stalked eyes were
   gone. Nick chose option (b) — push the strangeness back IN rather than
   accept the trade.

   The rule that keeps this from undoing wave 13: an alien trait is an
   ADDITION to a body our systems already draw well, never a replacement for
   it. A six-legged creature is still built on the quadruped's jointed limbs,
   deep chest and tucked waist; it simply has three pairs. That is what makes
   an alien animal look like an ANIMAL rather than a pile of shapes — and it
   is the whole reason the Earth pass had to come first.

   Every trait here is driven by a gene the genome already carries, and none
   of them reads Math.random or Date: same genome, same creature, on every
   device (hard rule 1). */
import { formMark, type Form } from './surface.js';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }

export interface AlienTraits {
  /** 2 = an ordinary tetrapod; 3 and 4 are what the genome's many-legged
      locomotion genes have always claimed and the art never showed */
  legPairs?: 2 | 3 | 4;
  eyes?: 'normal' | 'stalked' | 'cluster' | 'blind';
  skin?: 'plated' | 'crystalline' | 'translucent' | 'chitinous' | 'warty';
  tendrils?: boolean;      /** the tendril-fringed head gene */
  lumin?: boolean;         /** the genome's own lumin flag, finally visible */
  sail?: boolean;          /** a membranous dorsal sail */
  armor?: boolean;         /** segmented plate bands over the spine */
}

/** stalked or clustered eyes — the single most alien thing a face can do */
export function alienEyes(
  c: Ctx, x: number, y: number, r: number, kind: NonNullable<AlienTraits['eyes']>, p: Pal,
): void {
  if (kind === 'blind') {
    /* eyeless and smooth: not a blank face — a sensory pit, so it still
       reads as a head that perceives rather than a head that is missing */
    formMark(c, x, y, r * 1.6, r * 1.1, '18,16,22', 0.55);
    c.strokeStyle = 'rgba(220,232,248,0.22)'; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(x, y, r * 1.5, r * 0.95, 0, 0, TAU); c.stroke();
    return;
  }
  if (kind === 'cluster') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU, d = r * 1.15;
      const ex = x + Math.cos(a) * d * 0.9, ey = y + Math.sin(a) * d * 0.7;
      const rr = r * (i % 2 ? 0.42 : 0.56);
      c.fillStyle = '#0e1218'; c.beginPath(); c.arc(ex, ey, rr, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath(); c.arc(ex - rr * 0.3, ey - rr * 0.34, rr * 0.3, 0, TAU); c.fill();
    }
    return;
  }
  if (kind === 'stalked') {
    for (const s of [-1, 1] as const) {
      const ex = x + s * r * 1.5, ey = y - r * 2.4;
      c.strokeStyle = p.base; c.lineCap = 'round'; c.lineWidth = r * 0.52;
      c.beginPath(); c.moveTo(x + s * r * 0.4, y);
      c.quadraticCurveTo(x + s * r * 1.2, y - r * 1.4, ex, ey); c.stroke();
      c.fillStyle = p.lit; c.beginPath(); c.arc(ex, ey, r * 0.82, 0, TAU); c.fill();
      c.fillStyle = '#0d1016'; c.beginPath(); c.arc(ex, ey, r * 0.48, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(ex - r * 0.22, ey - r * 0.26, r * 0.18, 0, TAU); c.fill();
    }
    return;
  }
  c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#0d1016'; c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.fill();
}

/** A SKIN FINISH, applied INSIDE the body clip so it reads as the animal's
    own surface. Each obeys the surface laws — wrapped to the form and lit
    by it — because a plate that ignores the light is a sticker (D-ART-44). */
export function alienSkin(
  c: Ctx, kind: NonNullable<AlienTraits['skin']>, form: Form, p: Pal, r: () => number,
): void {
  const { cx, cy, rx, ry } = form;
  if (kind === 'plated' || kind === 'chitinous') {
    /* overlapping plates that follow the body's long axis */
    const n = kind === 'plated' ? 7 : 11;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * 1.7;
      const x = cx + t * rx;
      formMark(c, x, cy - ry * 0.15, rx * 0.10, ry * 0.82, '235,238,244', kind === 'plated' ? 0.22 : 0.15, form);
      formMark(c, x + rx * 0.055, cy - ry * 0.10, rx * 0.035, ry * 0.78, '14,12,16', kind === 'plated' ? 0.38 : 0.31, form);
    }
  } else if (kind === 'crystalline') {
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = r() ** 0.6;
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const s = rx * (0.05 + r() * 0.07);
      c.save(); c.translate(x, y); c.rotate(r() * TAU);
      const gg = c.createLinearGradient(-s, -s, s, s);
      gg.addColorStop(0, 'rgba(240,250,255,0.42)');
      gg.addColorStop(0.5, `rgba(${p.cr},${p.cg},${p.cb},0.18)`);
      gg.addColorStop(1, 'rgba(160,200,255,0.30)');
      c.fillStyle = gg;
      c.beginPath();
      c.moveTo(0, -s); c.lineTo(s * 0.62, 0); c.lineTo(0, s); c.lineTo(-s * 0.62, 0);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(230,245,255,0.34)'; c.lineWidth = 1; c.stroke();
      c.restore();
    }
  } else if (kind === 'translucent') {
    /* you can see the shadow of what is inside — the clearest single cue
       that a body is not made of flesh */
    formMark(c, cx + rx * 0.10, cy + ry * 0.08, rx * 0.22, ry * 0.30, '18,26,34', 0.16, form);
    for (let i = 0; i < 5; i++) {
      formMark(c, cx - rx * 0.42 + i * rx * 0.22, cy + ry * 0.16, rx * 0.035, ry * 0.22, '225,235,242', 0.15, form);
    }
    formMark(c, cx - rx * 0.30, cy - ry * 0.34, rx * 0.36, ry * 0.26, '245,250,255', 0.16, form);
  } else if (kind === 'warty') {
    for (let i = 0; i < 30; i++) {
      const a = r() * TAU, d = r() ** 0.6;
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const s = rx * (0.018 + r() * 0.022);
      formMark(c, x, y, s * 1.5, s * 1.1, '30,26,16', 0.34, form);
      formMark(c, x - s * 0.3, y - s * 0.35, s * 0.7, s * 0.5, '240,238,220', 0.22, form);
    }
  }
}

/** BIOLUMINESCENCE. The luminous tissue belongs to the body's surface; only a
    restrained halo may spill beyond it. Earlier large free-floating bulbs hid
    the torso and read as pasted lamps rather than living photophores. */
export function alienGlow(
  c: Ctx, form: Form, p: Pal, r: () => number, n = 9,
): void {
  const { cx, cy, rx, ry } = form;
  const hue = `${Math.min(255, p.cr * 0.4 + 130 | 0)},${Math.min(255, p.cg * 0.5 + 170 | 0)},255`;
  const nodes: Array<[number, number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = 0.18 + r() * 0.48;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const s = rx * (0.035 + r() * 0.035);
    nodes.push([x, y, s]);
  }
  for (const [x, y, s] of nodes) {
    const gg = c.createRadialGradient(x, y, 0, x, y, s * 2.2);
    gg.addColorStop(0, `rgba(${hue},0.30)`);
    gg.addColorStop(0.40, `rgba(${hue},0.10)`);
    gg.addColorStop(1, `rgba(${hue},0)`);
    c.fillStyle = gg; c.beginPath(); c.arc(x, y, s * 2.2, 0, TAU); c.fill();
    formMark(c, x, y, s * 0.95, s * 1.05, hue, 0.54, form, false);
  }
}

/** A MEMBRANOUS DORSAL SAIL on spines that rise from the back. */
export function alienSail(c: Ctx, cx: number, cy: number, w: number, h: number, p: Pal): void {
  const gg = c.createLinearGradient(0, cy - h, 0, cy);
  gg.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},0.30)`);
  gg.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.68)`);
  c.fillStyle = gg;
  c.beginPath();
  c.moveTo(cx - w, cy);
  c.quadraticCurveTo(cx - w * 0.4, cy - h * 1.25, cx, cy - h);
  c.quadraticCurveTo(cx + w * 0.5, cy - h * 0.8, cx + w, cy);
  c.closePath(); c.fill();
  c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.9)`; c.lineWidth = 2.6; c.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {   /* the spines that hold it up */
    const t = i / 3;
    c.beginPath(); c.moveTo(cx + t * w * 0.9, cy);
    c.lineTo(cx + t * w * 0.72, cy - h * (0.95 - Math.abs(t) * 0.45)); c.stroke();
  }
}

/** SEGMENTED ARMOUR over the spine — bands, not a texture. */
export function alienArmor(c: Ctx, form: Form, p: Pal): void {
  const { cx, cy, rx, ry } = form;
  for (let i = 0; i < 6; i++) {
    const t = (i / 5 - 0.5) * 1.6, x = cx + t * rx;
    c.save();
    const gg = c.createLinearGradient(x, cy - ry, x, cy + ry * 0.2);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath();
    c.ellipse(x, cy - ry * 0.52, rx * 0.11, ry * 0.46, 0, Math.PI, TAU);
    c.fill();
    c.strokeStyle = 'rgba(16,14,18,0.42)'; c.lineWidth = 1.8;
    c.beginPath(); c.ellipse(x, cy - ry * 0.52, rx * 0.11, ry * 0.46, 0, Math.PI, TAU); c.stroke();
    c.restore();
  }
}
