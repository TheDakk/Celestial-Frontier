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

type Ctx = CanvasRenderingContext2D;
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
