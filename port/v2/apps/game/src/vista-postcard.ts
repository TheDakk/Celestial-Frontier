/** @module vista-postcard [app] — the landing vista's ⛶ view and ⇪ postcard (D16 parity; v1.8.9 `_vistaExtras`, `savePostcard`, the
 * vista card's tap-to-zoom — INVENTORY rows #9/#10; the ledger's A6 share card).
 *
 * v2 draws the vista as the full-stage background of the surface itself, so v1's "⛶ Full screen" becomes a VIEW mode: the survey card
 * and the HUD step aside and the vista stands alone; any tap or Escape steps back (v1: tapping anywhere while zoomed steps OUT).
 * The postcard is v1's exact composition — the vista, an 86 px band, the world's title (Georgia 26), its CF1 share code (9 px mono) and
 * the "C E L E S T I A L   F R O N T I E R" wordmark — deterministic from the world (the vista is the world's deterministic render; the
 * text is the world's own name and code). It goes to the Web Share API with the file when the device can share files (the iPhone share
 * sheet: Save Image, Messages…), else it downloads. Fully offline; no network.
 *
 * The pill row lives OVER the stage, outside the survey card, so the measured default card is unchanged. */

export interface PostcardContextLike {
  fillStyle: string | CanvasGradient | CanvasPattern; font: string; textAlign: CanvasTextAlign;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
  fillText(text: string, x: number, y: number): void;
}
export interface PostcardCanvasLike {
  width: number; height: number;
  getContext(kind: '2d'): PostcardContextLike | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string): void;
}
/** A postcard never exceeds this width: a desktop-sized stage vista scales down (phones keep their native size). */
export const POSTCARD_MAX_WIDTH = 1600;
export const POSTCARD_BAND_PX = 86;
export const POSTCARD_WORDMARK = 'C E L E S T I A L   F R O N T I E R';

/** v1's file name: the title with every run of non-word characters as one underscore, then "-postcard.png". */
export const postcardFileNameV1 = (title: string): string => `${String(title).replace(/[^\w-]+/g, '_')}-postcard.png`;
export const postcardTitleV1 = (name: string | null | undefined): string => (name && name.trim() ? name.trim() : 'An uncharted world');

/** v1 `savePostcard`'s composition, measured in the vista's own pixels (scaled to POSTCARD_MAX_WIDTH at most). */
export function composeVistaPostcardV1(input: Readonly<{
  vista: CanvasImageSource & { readonly width: number; readonly height: number };
  title: string; shareCode: string | null;
  createCanvas: (width: number, height: number) => PostcardCanvasLike;
}>): PostcardCanvasLike {
  const scale = Math.min(1, POSTCARD_MAX_WIDTH / Math.max(1, input.vista.width));
  const w = Math.max(1, Math.round(input.vista.width * scale)), h = Math.max(1, Math.round(input.vista.height * scale));
  const canvas = input.createCanvas(w, h + POSTCARD_BAND_PX), g = canvas.getContext('2d');
  if (!g) throw new Error('postcard: no 2D context');
  g.fillStyle = '#0a0c14'; g.fillRect(0, 0, w, h + POSTCARD_BAND_PX);
  g.drawImage(input.vista, 0, 0, w, h);
  g.fillStyle = 'rgba(150,162,210,0.25)'; g.fillRect(0, h, w, 1);
  g.fillStyle = '#ffd96a'; g.font = '600 26px Georgia,serif'; g.textAlign = 'left';
  g.fillText(input.title, 24, h + 40);
  if (input.shareCode) { g.fillStyle = '#7c86ae'; g.font = '9px monospace'; g.fillText(input.shareCode, 24, h + 66); }
  g.fillStyle = '#aab3d2'; g.font = '600 12px sans-serif'; g.textAlign = 'right';
  g.fillText(POSTCARD_WORDMARK, w - 24, h + 40);
  return canvas;
}

export type PostcardDeliveryV1 = 'shared' | 'downloaded' | 'cancelled' | 'failed';
export interface PostcardDeliveryEnvV1 {
  readonly document: Document;
  readonly navigator?: Readonly<{ canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> }> | null;
  readonly createObjectURL: (blob: Blob) => string;
  readonly revokeObjectURL: (url: string) => void;
  readonly makeFile?: (blob: Blob, name: string) => File;
}
/** Share the postcard file when the device can (the iPhone share sheet), else download it. A dismissed share sheet is 'cancelled'
 * (never a silent download the player did not ask for). */
export async function deliverVistaPostcardV1(canvas: PostcardCanvasLike, title: string, env: PostcardDeliveryEnvV1): Promise<PostcardDeliveryV1> {
  const blob = await new Promise<Blob | null>((resolve) => { try { canvas.toBlob(resolve, 'image/png'); } catch { resolve(null); } });
  if (!blob) return 'failed';
  const name = postcardFileNameV1(title);
  const file = env.makeFile ? env.makeFile(blob, name) : new File([blob], name, { type: 'image/png' });
  const nav = env.navigator;
  if (nav?.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title }); return 'shared'; }
    catch (error) { if ((error as { name?: string })?.name === 'AbortError') return 'cancelled'; /* fall through to download */ }
  }
  const href = env.createObjectURL(blob), a = env.document.createElement('a');
  a.href = href; a.download = name;
  env.document.body.append(a); a.click(); a.remove();
  setTimeout(() => env.revokeObjectURL(href), 4000);
  return 'downloaded';
}

/** The pill row over the stage: ⛶ Vista (view mode) and ⇪ Postcard; in view mode one "✕ Back" pill. Real 44 px buttons. */
export class VistaPillsControllerV1 {
  readonly element: HTMLElement;
  #visible = false; #viewing = false;
  readonly #o: Readonly<{ document: Document; onView: () => void; onBack: () => void; onPostcard: () => void }>;
  constructor(options: Readonly<{ document: Document; onView: () => void; onBack: () => void; onPostcard: () => void }>) {
    this.#o = options;
    const el = options.document.createElement('div');
    el.className = 'vista-pills'; el.dataset.sel = 'vista-pills'; el.hidden = true;
    el.addEventListener('click', (event) => {
      const b = (event.target as HTMLElement).closest<HTMLElement>('[data-vista]');
      if (!b) return;
      event.stopPropagation();
      if (b.dataset.vista === 'view') this.#o.onView(); else if (b.dataset.vista === 'back') this.#o.onBack(); else if (b.dataset.vista === 'postcard') this.#o.onPostcard();
    });
    options.document.body.append(el);
    this.element = el;
  }
  /** Shown only when a vista is on screen. */
  sync(visible: boolean, viewing: boolean): void {
    if (visible === this.#visible && viewing === this.#viewing && this.element.childElementCount > 0) return;
    this.#visible = visible; this.#viewing = viewing;
    this.element.hidden = !visible;
    this.element.innerHTML = viewing
      ? '<button type="button" data-vista="back" data-sel="vista-back">✕ Back</button><button type="button" data-vista="postcard" data-sel="vista-postcard">⇪ Postcard</button>'
      : '<button type="button" data-vista="view" data-sel="vista-view">⛶ Vista</button><button type="button" data-vista="postcard" data-sel="vista-postcard">⇪ Postcard</button>';
  }
}
