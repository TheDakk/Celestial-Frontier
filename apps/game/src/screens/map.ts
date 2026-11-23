/* The map screen: the universe, a galaxy or a system, drawn by seeded code, with the survey card of whatever is
   selected and travel between the three by tap, zoom, keyboard and pasted code. */
import { describePickWithState, type Descriptor } from '@cf/domain-descriptors';
import { OBS_R } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import type { SaveStateV2 } from '@cf/persistence';
import { currentRegionOf, type NavState } from '@cf/scene';
import { paintPixels } from '../platform/canvas';
import { PICK_RADIUS_PX, escapeTarget, mountGestures, mountMapKeys, pick, type Gesture, type MapKeyTarget } from '../input';
import type { NavController, NavOutcome } from '../nav';
import {
  ascentCamera, descentCamera, diveIntent, entryZoom, mapPicture, minSideOf, parkBelowTrigger, pictureWidth, placedLabels, showSpace,
  supernovaBodies, toScreen, visibleBodies, zoomAbout, zoomLimits, type Camera, type Lettered, type MapBody, type MapFrame, type Viewport,
} from '../space';
import { createFrameCoalescer, currentSheet, drawLines, interfaceGaps, sheetColours, type Toast } from '../ui';
import { el } from './dom';
import type { ScreenDef } from './registry';
import { createSearchBox } from './search-box';
import { createSelectionCard, type CardAction } from './selection-card';

export interface MapPorts {
  nav: NavController;
  live(): Pick<SaveStateV2, 'primeFill' | 'chartsOn' | 'fxOn' | 'customNames'>;
  /** The committed ecology epoch: every card and picture reads this one. */
  epoch(): number;
  sound: { whoosh(): void; ping(): void };
  toast: Toast;
  panels: { openId(): string | null; close(): void };
  /** Monotonic ms. */
  now(): number;
  dpr(): number;
  frames: { request(run: () => void): number; cancel(handle: number): void };
  reducedMotion(): boolean;
  /** The parts of the page the map's words keep off, as the browser lays them out: the top bar and the dock. */
  covers(): readonly { left: number; top: number; width: number; height: number }[];
}

const REFUSAL_TITLES = { 'prime-reach': 'Beyond Your Saved Reach', 'charter-reach': 'Beyond Your Charter' } as const;
/** How near the ring of the observable universe, in screen pixels, a tap on empty space opens the origin card. */
const RING_PICK_PX = 30;
const DEPTH = { universe: 0, galaxy: 1, system: 2, surface: 3 } as const;
type Selected = { body: MapBody; x: number; y: number } & MapKeyTarget;

export function mapScreen(ports: MapPorts): ScreenDef {
  const { nav } = ports;
  return {
    id: 'map',
    fixtures: [{ id: 'map', setup() {} }],
    mount(root, ctx) {
      const canvas = el('canvas', { class: 'map' });
      const ring = el('div', { class: 'map-focus', 'aria-hidden': 'true', hidden: true }, el('span'));
      // The map has its own box: beside an open card on a wide view it is narrower than the stage.
      const captions = el('div', { class: 'map-captions', 'aria-hidden': 'true' });
      // The line about the map while the keyboard has it: inside the map's own box and below the top bar.
      const edge = el('div', { class: 'map-edge', 'aria-hidden': 'true' });
      const area = el('div', { class: 'map-area' }, canvas, captions, ring, edge);
      root.append(area);
      const card = createSelectionCard(root, () => { root.dataset.card = card.open ? 'open' : 'closed'; redraw.request(); });
      root.dataset.card = 'closed';
      const view = (): Viewport => ({ w: area.clientWidth, h: area.clientHeight });
      const minSide = (): number => minSideOf(view());

      /** The camera drawn, and the one it eases to. */
      let cam: Camera = { x: 0, y: 0, z: 1 };
      let camT: Camera = { ...cam };
      let place: NavState = nav.nav;
      const seat = (move: { from: Camera; to: Camera }): void => { cam = { ...move.from }; camT = { ...move.to }; };
      if (place.mode === 'galaxy' || place.mode === 'system') {
        const arrived = descentCamera(place.mode, minSide()).to;
        seat({ from: arrived, to: arrived });
      }
      const limits = (): readonly [number, number] => {
        const mode = nav.nav.mode;
        return zoomLimits(mode, minSide(), mode === 'galaxy' || mode === 'system' ? entryZoom(mode, minSide()) : 0);
      };

      const start = ports.now();
      let last: number | null = null;
      const time = (): number => (ports.reducedMotion() ? 0 : (ports.now() - start) / 1000);
      const bodiesAt = (camera: Camera): MapBody[] =>
        [...visibleBodies(nav.nav, camera, view(), time()), ...supernovaBodies(nav.nav, ports.epoch())];

      const describe = (kind: string, data: unknown): Descriptor | null => {
        const names = ports.live().customNames;
        const at = nav.nav;
        return describePickWithState({ kind, data },
          { gal: at.mode === 'universe' ? null : at.gal, star: at.mode === 'system' || at.mode === 'surface' ? at.star : null },
          (key) => names.find(([name]) => name === key)?.[1], ports.epoch());
      };
      /** The card of a body, as the game routes it, and the travel it offers. */
      const cardOf = (body: MapBody): { descriptor: Descriptor | null; action: CardAction | null; ping: boolean } => {
        if (body.kind === 'galaxy') {
          const g = body.ref;
          return { descriptor: describe(g.quasar ? 'quasar' : g.radio ? 'radio' : 'galaxy', g), ping: true,
            action: { label: 'Enter galaxy', run: () => { travel(nav.enterGalaxy(g), body); } } };
        }
        if (body.kind === 'star') {
          const s = { seed: body.ref.seed, x: body.ref.x, y: body.ref.y };
          return { descriptor: describe('star', body.ref), ping: true,
            action: { label: 'Enter system', run: () => { travel(nav.enterSystem(s), body); } } };
        }
        if (body.kind === 'planet') {
          const p = body.ref;
          const star = nav.nav.mode === 'system' ? nav.nav.star.seed : 0;
          return { descriptor: describe('planet', { P: p.P, sys: systemFor(star), pl: { name: p.name, orb: p.orb } }), action: null, ping: true };
        }
        // Scenery of a galaxy opens its card in silence; the rest answer with the ping.
        return { descriptor: describe(body.kind, body.ref), action: null, ping: body.kind !== 'deco' };
      };
      const select = (body: MapBody, opener: HTMLElement | null): boolean => {
        const { descriptor, action, ping } = cardOf(body);
        if (descriptor === null) return false;
        card.show(descriptor, action, opener);
        if (ping) ports.sound.ping();
        return true;
      };
      /** A refused dive holds the zoom just under the one that would dive again. */
      const travel = (outcome: NavOutcome, body: MapBody | null): void => {
        if (outcome.ok || body === null || (body.kind !== 'galaxy' && body.kind !== 'star')) return;
        const park = parkBelowTrigger(body, minSide());
        camT = { ...camT, z: Math.min(camT.z, park) };
        if (body.kind === 'star') cam = { ...cam, z: Math.min(cam.z, park) };
        redraw.request();
      };
      const goUp = (): void => { nav.ascend(); };
      /** What the zoom the view is heading for asks for. */
      const followZoom = (): void => {
        const intent = diveIntent(nav.nav, camT, bodiesAt(camT), minSide());
        if (intent.kind === 'ascend') goUp();
        else if (intent.kind === 'park') { camT = { ...camT, z: Math.min(camT.z, intent.z) }; cam = { ...cam, z: Math.min(cam.z, intent.z) }; }
        else if (intent.kind === 'dive' && intent.body.kind === 'galaxy') travel(nav.enterGalaxy(intent.body.ref), intent.body);
        else if (intent.kind === 'dive' && intent.body.kind === 'star') {
          travel(nav.enterSystem({ seed: intent.body.ref.seed, x: intent.body.ref.x, y: intent.body.ref.y }), intent.body);
        }
      };

      const targets = (): Selected[] => bodiesAt(cam).map((body) => {
        const at = toScreen(cam, view(), body.wx, body.wy);
        return {
          body, key: body.key, x: at.x, y: at.y, priority: body.priority,
          // A press anywhere on the body's picture selects it, as in the game: half its width each way.
          reach: pictureWidth(body, cam.z) * cam.z / 2,
          // A catalogued body is announced by its name; the rest by the title of their card.
          get label(): string {
            return body.kind === 'galaxy' || body.kind === 'star' || body.kind === 'planet' ? body.label : cardOf(body).descriptor?.title ?? body.label;
          },
        };
      });

      const onGesture = (gesture: Gesture): void => {
        if (gesture.kind === 'pan') {
          // A pan moves the view at once; only a zoom eases.
          cam = { ...cam, x: cam.x - gesture.dx / cam.z, y: cam.y - gesture.dy / cam.z };
          camT = { ...camT, x: cam.x, y: cam.y };
        } else if (gesture.kind === 'zoom') {
          const { w, h } = view();
          camT = zoomAbout(camT, gesture.factor, gesture.x - w / 2, gesture.y - h / 2, limits());
          followZoom();
        } else if (gesture.kind === 'back') {
          if (card.open) card.hide(false); else goUp();
        } else {
          const hit = pick(targets(), gesture.x, gesture.y, PICK_RADIUS_PX[ctx.inputMode()]);
          if (hit !== null) select(hit.body, null);
          else if (nav.nav.mode === 'universe') {
            const { w, h } = view();
            const wx = cam.x + (gesture.x - w / 2) / cam.z;
            const wy = cam.y + (gesture.y - h / 2) / cam.z;
            if (Math.abs(Math.hypot(wx, wy) - OBS_R) * cam.z < RING_PICK_PX) {
              const origin = describe('cmb', {});
              if (origin !== null) { card.show(origin, null, null); ports.sound.ping(); }
            }
          }
        }
        redraw.request();
      };

      let held: string | null = null;
      const keys = mountMapKeys(canvas, {
        targets,
        viewport: () => ({ width: view().w, height: view().h }),
        select(target) {
          const found = targets().find((t) => t.key === target.key);
          // The outcome of a keyboard survey lands on the card's action, or on its close control.
          if (found !== undefined && select(found.body, canvas)) card.focusPrimary();
        },
        zoom(target, factor) {
          const found = targets().find((t) => t.key === target.key);
          if (found === undefined) return;
          const [lo, hi] = limits();
          camT = { x: found.body.wx, y: found.body.wy, z: Math.min(hi, Math.max(lo, camT.z * factor)) };
          followZoom();
          redraw.request();
        },
        show(target) { held = target?.key ?? null; redraw.request(); },
      });
      const stopGestures = mountGestures(canvas, root.ownerDocument, onGesture);
      const search = createSearchBox(root, (text) => nav.travelToCode(text).ok);

      const onKey = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        const layer = escapeTarget({ search: root.ownerDocument.activeElement === search.el, panel: ports.panels.openId() !== null, card: card.open });
        if (layer === 'search') search.blurIfFocused();
        else if (layer === 'panel') ports.panels.close();
        else if (layer === 'card') card.hide(true);
        else goUp();
      };
      root.ownerDocument.addEventListener('keydown', onKey);

      const stops = [
        ctx.bus.on('nav:changed', (event) => {
          const left = place;
          place = event.nav;
          card.hide(false);
          if (DEPTH[event.to] < DEPTH[event.from] && left.mode !== 'universe') {
            seat(ascentCamera(event.to === 'universe' || left.mode === 'galaxy'
              ? { kind: 'galaxy', x: left.gal.x, y: left.gal.y, size: left.gal.size }
              : { kind: 'star', x: left.star.x, y: left.star.y }, minSide()));
          } else if (event.to === 'galaxy' || event.to === 'system') {
            seat(descentCamera(event.to, minSide()));
          }
          ports.sound.whoosh();
          redraw.request();
        }),
        ctx.bus.on('nav:refused', (event) => {
          // The game says nothing when a place is not a real one.
          if (event.hint !== '' && event.reason !== 'not-proven') ports.toast.show(REFUSAL_TITLES[event.reason], event.hint);
        }),
        ctx.bus.on('layout:size-class', () => redraw.request()),
        ctx.bus.on('settings:changed', () => redraw.request()),
        ctx.bus.on('save:committed', () => redraw.request()),
      ];

      /** Each caption is drawn once, in the display font, and then only moved: its box is in the picture's own pixels. */
      const lettered = new Map<string, HTMLCanvasElement>();
      const seenGlyphs = new Set(interfaceGaps.glyphs);
      const letter = (list: readonly Lettered[], pixel: number): void => {
        const sheet = currentSheet();
        const live = new Set<HTMLCanvasElement>();
        for (const words of list) {
          const key = `${sheet.font.line}:${words.lines.join('\n')}`;
          let drawn = lettered.get(key);
          if (drawn === undefined || live.has(drawn)) {
            const gaps = { glyphs: [] as number[], icons: [] as string[], elements: [] as string[] };
            const fresh = el('canvas', { 'data-caption': words.text });
            paintPixels(fresh, drawLines(sheet.font, words.lines, gaps), sheetColours(sheet));
            for (const glyph of gaps.glyphs) if (!seenGlyphs.has(glyph)) { seenGlyphs.add(glyph); interfaceGaps.glyphs.push(glyph); }
            if (drawn === undefined) lettered.set(key, fresh);
            drawn = fresh;
          }
          live.add(drawn);
          Object.assign(drawn.style, { width: `${words.w * pixel}px`, height: `${words.h * pixel}px`, left: `${words.x * pixel}px`, top: `${words.y * pixel}px` });
        }
        captions.replaceChildren(...live);
      };
      /** What covers the map, measured from the map's own corner. */
      const covered = (): { x: number; y: number; w: number; h: number }[] => {
        const box = area.getBoundingClientRect();
        return ports.covers().filter((cover) => cover.width > 0 && cover.height > 0)
          .map((cover) => ({ x: cover.left - box.left, y: cover.top - box.top, w: cover.width, h: cover.height }));
      };

      const seen = new Set(interfaceGaps.elements);
      function frame(): void {
        const size = view();
        if (size.w === 0 || size.h === 0) return;
        const now = ports.now();
        const dt = last === null ? 1 / 60 : Math.min(0.1, (now - last) / 1000);
        const animate = !ports.reducedMotion();
        const k = animate ? 1 - Math.pow(0.0025, dt) : 1;
        cam = { x: cam.x + (camT.x - cam.x) * k, y: cam.y + (camT.y - cam.y) * k, z: cam.z + (camT.z - cam.z) * k };
        const settledNow = Math.abs(camT.z - cam.z) <= camT.z * 0.001
          && Math.abs(camT.x - cam.x) * cam.z < 0.25 && Math.abs(camT.y - cam.y) * cam.z < 0.25;
        if (settledNow) cam = { ...camT };

        const sheet = currentSheet();
        const gaps = { glyphs: [] as number[], icons: [] as string[], elements: [] as string[] };
        const state = ports.live();
        const region = currentRegionOf(Object.keys(state.primeFill || {}).length);
        const shown: MapFrame = {
          nav: nav.nav, cam, view: size, dpr: ports.dpr(), time: time(), epoch: ports.epoch(), reach: region.r, charts: state.chartsOn,
          // The whole map of the game, each thing the size the game gives it at this zoom; reduced motion holds every
          // clock of it at its start.
          passes: { effects: state.fxOn, motion: animate }, sized: true,
          // Its words stand clear of each other, of their bodies and of what covers the map.
          placement: { keepOut: covered(), tails: true, stand: true, apart: true },
        };
        const picture = mapPicture(shown, sheet, gaps);
        showSpace(canvas, picture, sheet.palette.colours, ports.dpr());
        letter(placedLabels(shown, region.name, sheet.font), picture.scale / ports.dpr());
        // A missing element is counted once, however many frames ask for it.
        for (const name of gaps.elements) if (!seen.has(name)) { seen.add(name); interfaceGaps.elements.push(name); }

        const mark = held === null ? undefined : targets().find((t) => t.key === held);
        ring.hidden = mark === undefined;
        if (mark !== undefined) {
          ring.style.left = `${mark.x}px`;
          ring.style.top = `${mark.y}px`;
          ring.firstElementChild!.textContent = mark.label;
        }
        // With motion on the map is alive on every level: galaxies turn, fog drifts, worlds orbit.
        const moving = !settledNow || animate;
        last = moving ? now : null;
        if (moving) redraw.request();
      }
      const redraw = createFrameCoalescer(ports.frames.request, ports.frames.cancel, frame);
      const onResize = (): void => redraw.request();
      root.ownerDocument.defaultView!.addEventListener('resize', onResize);
      redraw.request();

      return () => {
        redraw.cancel();
        keys.dispose();
        stopGestures();
        for (const stop of stops) stop();
        root.ownerDocument.removeEventListener('keydown', onKey);
        root.ownerDocument.defaultView!.removeEventListener('resize', onResize);
        root.replaceChildren();
      };
    },
  };
}
