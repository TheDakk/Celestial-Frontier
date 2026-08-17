/* surface.ts — THE SURFACE LAWS. Shared by every painter, so a marking,
   a coat or a spine belongs to the animal instead of sitting on top of it.

   Three things make a mark read as PAINTED ON, and all three are geometric
   rather than a matter of taste:

   1 · IT IGNORES THE FORM. A spot near the rim of a rounded flank is seen
       almost edge-on, so it should be foreshortened and turned along the
       surface. Drawn as the same circle everywhere, it announces that the
       body is flat.
   2 · IT IGNORES THE LIGHT. Every painter in this engine lights from the
       upper left. A marking that keeps one opacity across a lit shoulder
       and a shadowed belly is a decal; a real one is bleached where the
       light hits and drowned where it does not.
   3 · IT STOPS AT THE OUTLINE. Fur and spines that live strictly inside a
       smooth silhouette look like wallpaper inside a cutout. Real coats
       BREAK the outline — the silhouette is the first thing the eye reads,
       and a furry animal does not have a clean one.

   Everything here is pure canvas and takes explicit geometry, so it can be
   used by the Earth painters and by the procedural body plans alike. */

import type { ArtContext2D } from './speciescanvas.js';

type Ctx = ArtContext2D;
const TAU = Math.PI * 2;

/** the engine's light: upper-left, matching every bodyGrad in the codebase */
export const LIGHT_X = -0.38;
export const LIGHT_Y = -0.46;

export interface Form {
  cx: number; cy: number;      /** centre of the body mass this mark lies on */
  rx: number; ry: number;      /** its radii — the surface being wrapped */
  rot?: number;                /** the body's own tilt */
}

/** How much a point on the form faces the viewer: 1 dead centre, 0 at the
    rim. This is the whole trick — it drives foreshortening AND shading. */
export function facing(form: Form, x: number, y: number): number {
  const dx = (x - form.cx) / Math.max(1e-6, form.rx);
  const dy = (y - form.cy) / Math.max(1e-6, form.ry);
  const d2 = dx * dx + dy * dy;
  return Math.sqrt(Math.max(0, 1 - Math.min(1, d2)));
}

/** How lit a point is: 1 full light, 0 full shadow. */
export function lightAt(form: Form, x: number, y: number): number {
  const dx = (x - form.cx) / Math.max(1e-6, form.rx);
  const dy = (y - form.cy) / Math.max(1e-6, form.ry);
  const d = dx * LIGHT_X + dy * LIGHT_Y;          /* -1 … 1 along the light axis */
  return Math.min(1, Math.max(0, 0.5 - d * 0.75));
}

/** A MARK THAT WRAPS. Same call shape as the old softMark, plus the form it
    lies on — it foreshortens toward the rim, turns to follow the surface,
    and lets the light bleach or drown it. Falls back to a plain soft mark
    when no form is supplied, so it is a drop-in everywhere. */
export function formMark(
  c: Ctx, x: number, y: number, rx: number, ry: number,
  rgb: string, a: number, form?: Form, light = true,
): void {
  let sx = rx, sy = ry, rot = 0, alpha = a;
  if (form) {
    const f = facing(form, x, y);
    /* foreshorten ACROSS the radius direction; the tangent length survives */
    const squash = 0.34 + 0.66 * f;
    const ang = Math.atan2((y - form.cy) / Math.max(1e-6, form.ry), (x - form.cx) / Math.max(1e-6, form.rx));
    rot = ang + Math.PI / 2 + (form.rot ?? 0);   /* long axis runs ALONG the surface */
    sx = rx; sy = ry * squash;
    if (light) {
      /* a dark mark fades where the light is strong; a light mark fades in
         shadow. Either way the mark stops being uniform across the body. */
      const L = lightAt(form, x, y);
      const ch = rgb.split(',').map(Number);
      const isDark = ((ch[0] ?? 0) + (ch[1] ?? 0) + (ch[2] ?? 0)) / 3 < 128;
      alpha = a * (isDark ? 0.55 + 0.85 * (1 - L) : 0.45 + 1.0 * L);
    }
  }
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, Math.max(0.06, sy / sx));
  const gg = c.createRadialGradient(0, 0, sx * 0.10, 0, 0, sx);
  gg.addColorStop(0, `rgba(${rgb},${alpha})`);
  gg.addColorStop(0.55, `rgba(${rgb},${alpha * 0.80})`);
  gg.addColorStop(0.82, `rgba(${rgb},${alpha * 0.32})`);
  gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, sx, 0, TAU); c.fill();
  c.restore();
}

/** THE FUR RIM. Walks a silhouette and pushes tufts THROUGH it, so the
    outline itself goes soft. Without this a "shaggy" coat is just noise
    inside a machined edge, which is exactly what reads as painted on.
    `pts` is the outline, ordered; `out` returns the outward normal. */
export function furRim(
  c: Ctx, pts: Array<[number, number]>, cx: number, cy: number,
  col: string, len: number, r: () => number, density = 0.55,
): void {
  c.lineCap = 'round';
  for (let i = 0; i < pts.length; i++) {
    if (r() > density) continue;
    const [x, y] = pts[i]!;
    const nx = x - cx, ny = y - cy;
    const nl = Math.hypot(nx, ny) || 1;
    const L = len * (0.45 + r() * 0.9);
    const jitter = (r() - 0.5) * 0.7;
    const ux = (nx / nl) * Math.cos(jitter) - (ny / nl) * Math.sin(jitter);
    const uy = (nx / nl) * Math.sin(jitter) + (ny / nl) * Math.cos(jitter);
    /* the tuft starts INSIDE the body so it grows out of it, not off it */
    c.strokeStyle = col;
    c.lineWidth = Math.max(1.2, L * 0.20);
    c.globalAlpha = 0.30 + r() * 0.45;
    c.beginPath();
    c.moveTo(x - ux * L * 0.55, y - uy * L * 0.55);
    c.quadraticCurveTo(x + ux * L * 0.4, y + uy * L * 0.4, x + ux * L, y + uy * L + L * 0.15);
    c.stroke();
  }
  c.globalAlpha = 1;
}

/** A ROOTED SPINE. A quill drawn as a bare line looks glued on; a real one
    parts the fur around its base, so it gets a dark contact shadow at the
    root and tapers to a point. */
export function rootedSpine(
  c: Ctx, x: number, y: number, ang: number, len: number,
  col: string, rootRgb = '20,16,12',
): void {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
  /* the socket: a small dark smudge where the spine leaves the skin */
  formMark(c, x, y, len * 0.16, len * 0.10, rootRgb, 0.42);
  c.strokeStyle = col; c.lineCap = 'round';
  c.lineWidth = Math.max(1.6, len * 0.11);
  c.beginPath(); c.moveTo(x, y); c.lineTo((x + ex) / 2, (y + ey) / 2); c.stroke();
  c.lineWidth = Math.max(0.8, len * 0.05);          /* the taper to a point */
  c.beginPath(); c.moveTo((x + ex) / 2, (y + ey) / 2); c.lineTo(ex, ey); c.stroke();
}

/** Sample an ellipse outline — the common case for handing points to furRim. */
export function ellipsePts(cx: number, cy: number, rx: number, ry: number, rot: number, n = 64): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ★ THE SPECIES HUE, in one place.

   D-ART-108 established that no formula can naturalise the Earth palette —
   the only thing that works is a per-species colour read off the real animal.
   D-ART-113 then started applying those colours, and hit a wall: only the
   painters that happened to have a `hue` field could take one, so 575
   organisms were stuck on the random rarity roll purely because of which
   painter drew them.

   This is the axis those painters were missing. It takes the rolled palette
   and a hex, and returns the palette that species should actually have.

   ⚠ FIVE NEAR-IDENTICAL COPIES OF THIS ALREADY EXIST — `hued` in
   invertoverrides, `pal` in quadrupedoverrides, and inline blocks in
   faunaBird, fishBody and marineShell. They are NOT unified here, and that is
   deliberate: their lit/dark multipliers genuinely differ (1.28 vs 1.30 vs
   1.32, 0.42/0.44/0.48 vs a flat 0.45), so folding them together would
   silently restyle hundreds of already-signed-off organisms to save a few
   lines. New painters use this one; the old ones keep their own until there
   is a reason to re-bless them.
   ═══════════════════════════════════════════════════════════════════════════ */
export interface HuePal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }

/** the rolled palette, replaced by the species' own colour. `undefined` hue
    means "this species has no reference colour yet" and the roll stands. */
export function speciesHue<T extends HuePal>(rolled: T, hue?: string): T {
  if (!hue) return rolled;
  const n = parseInt(hue.slice(1), 16);
  const cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  const rgb = (a: number, b: number, d: number): string =>
    'rgb(' + (a | 0) + ',' + (b | 0) + ',' + (d | 0) + ')';
  return { ...rolled, base: hue, cr, cg, cb,
    lit: rgb(Math.min(255, cr * 1.30), Math.min(255, cg * 1.29), Math.min(255, cb * 1.27)),
    dark: rgb(cr * 0.43, cg * 0.45, cb * 0.48) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ★ THE LEAF SURFACE — the material layer reaches the plants.

   Waves 21–23 gave mammals fur, birds feathers, fish scales and arthropods
   shell, and stopped there. That left ~330 plants as the last flat gradients
   in the catalogue, which is the worse half of the "partial material" problem:
   the eye grades every card against the best one on the sheet, so a flat leaf
   beside a furred wolf reads as unfinished rather than as different.

   A leaf's material is not texture, it is VENATION. A midrib alone — which is
   all these had — says "leaf-shaped"; the laterals branching off it at a
   consistent angle and dying before the margin are what say "leaf". The
   second cue is that a leaf is slightly glossy along the light side of the
   midrib, and matte in the shadow of its own curl.

   Deliberately NOT tube-based, unlike coatMaterial: a leaf is a flat blade
   drawn in its own rotated frame, so it needs plain local geometry rather
   than a swept-circle surface. Same reason it lives here and not in skin.ts.
   ═══════════════════════════════════════════════════════════════════════════ */
export function leafSurface(
  c: Ctx, len: number, w: number,
  o: { veins?: number; detail?: number; parallel?: boolean } = {},
): void {
  const detail = o.detail ?? 1;
  if (detail <= 0 || len < 6) return;
  const n = Math.max(2, Math.round((o.veins ?? 6) * detail));

  c.save();
  c.lineCap = 'round';
  /* THE LATERALS. They leave the midrib at a swept-back angle, arc toward the
     tip, and stop short of the edge — a vein drawn to the margin reads as a
     crack. Both sides, mirrored but not identical, because a real leaf is not. */
  for (let i = 1; i <= n; i++) {
    const u = i / (n + 1);
    const x0 = len * u * 0.96;
    /* the blade is widest in the middle, so a lateral there is longest */
    const half = w * Math.sin(Math.PI * Math.min(1, u * 1.05)) * 0.86;
    for (const s of [-1, 1]) {
      const sweep = 0.34 + u * 0.22;
      const x1 = x0 + half * sweep * 1.9;
      const y1 = s * half;
      c.strokeStyle = 'rgba(22,36,20,' + (0.13 + 0.07 * (1 - u)).toFixed(2) + ')';
      c.lineWidth = Math.max(0.6, w * 0.035 * (1 - u * 0.4));
      c.beginPath();
      c.moveTo(x0, 0);
      if (o.parallel) c.lineTo(x0 + half * 1.4, y1);      /* a monocot: straight, parallel */
      else c.quadraticCurveTo(x0 + half * 0.5, y1 * 0.55, x1, y1 * 0.92);
      c.stroke();
    }
  }
  /* the gloss, on the upper side of the midrib only — this is most of what
     stops a leaf reading as a paper cut-out */
  const g = c.createLinearGradient(0, -w * 0.9, 0, w * 0.5);
  g.addColorStop(0, 'rgba(255,255,245,0.16)');
  g.addColorStop(0.45, 'rgba(255,255,245,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.42, -w, len, 0);
  c.quadraticCurveTo(len * 0.42, -w * 0.12, 0, 0);
  c.closePath(); c.fill();
  c.restore();
}
