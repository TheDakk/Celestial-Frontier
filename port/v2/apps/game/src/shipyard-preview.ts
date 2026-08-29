import type { ShipChassisStage, ShipVisualState } from '@cf/scene';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PREVIEW_SELECTOR = 'svg[data-cf-shipyard-preview="v1"]';

interface ChassisPresentation {
  readonly id: string;
  readonly name: string;
  readonly reach: string;
  readonly hullPath: string;
  readonly insetPath: string;
}

const CHASSIS: Readonly<Record<ShipChassisStage, ChassisPresentation>> = Object.freeze({
  0: Object.freeze({
    id: 'scout-chemical',
    name: 'Scout',
    reach: 'chemical-system reach',
    hullPath: 'M180 18 236 105 211 148 180 132 149 148 124 105Z',
    insetPath: 'M180 43 207 105 180 121 153 105Z',
  }),
  1: Object.freeze({
    id: 'jump-interstellar',
    name: 'Jump',
    reach: 'interstellar reach',
    hullPath: 'M180 16 219 77 307 127 229 138 180 161 131 138 53 127 141 77Z',
    insetPath: 'M180 42 207 89 242 120 180 139 118 120 153 89Z',
  }),
  2: Object.freeze({
    id: 'survey-cruiser-array',
    name: 'Survey Cruiser',
    reach: 'survey-array reach',
    hullPath: 'M180 13 226 50 268 73 318 119 232 116 214 157 146 157 128 116 42 119 92 73 134 50Z',
    insetPath: 'M180 39 218 68 244 101 208 119 197 143 163 143 152 119 116 101 142 68Z',
  }),
  3: Object.freeze({
    id: 'frontier-intergalactic',
    name: 'Frontier',
    reach: 'intergalactic reach',
    hullPath: 'M180 9 217 48 247 43 333 105 271 131 232 119 214 169 146 169 128 119 89 131 27 105 113 43 143 48Z',
    insetPath: 'M180 34 211 62 242 70 265 105 218 108 201 148 159 148 142 108 95 105 118 70 149 62Z',
  }),
});

function svgElement<K extends keyof SVGElementTagNameMap>(
  document: Document,
  name: K,
  attributes: Readonly<Record<string, string | number>>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  return element;
}

interface ShipLivery {
  readonly hull: string;
  readonly hullDeep: string;
  readonly hullBright: string;
  readonly inset: string;
  readonly insetBright: string;
  readonly light: string;
  readonly lightWarm: string;
}

function livery(state: ShipVisualState): ShipLivery {
  const seed = state.liverySeed >>> 0;
  const hue = (Math.imul(seed, 2_654_435_761) >>> 0) % 360;
  return Object.freeze({
    hull: `hsl(${hue} 34% 31%)`,
    hullDeep: `hsl(${hue} 43% 12%)`,
    hullBright: `hsl(${(hue + 8) % 360} 44% 47%)`,
    inset: `hsl(${(hue + 24) % 360} 43% 18%)`,
    insetBright: `hsl(${(hue + 32) % 360} 48% 32%)`,
    light: `hsl(${(hue + 174) % 360} 82% 68%)`,
    lightWarm: `hsl(${(hue + 58) % 360} 94% 72%)`,
  });
}

function paintIdentity(state: ShipVisualState): string {
  const hardpointMask = +state.hardpoints.array
    | (+state.hardpoints.autoext << 1)
    | (+state.hardpoints.cscoop << 2);
  return `cf-ship-${state.chassisStage}-${hardpointMask}-${(state.liverySeed >>> 0).toString(16)}`;
}

function appendStop(
  document: Document,
  gradient: SVGLinearGradientElement | SVGRadialGradientElement,
  offset: string,
  color: string,
  opacity = 1,
): void {
  gradient.append(svgElement(document, 'stop', {
    offset,
    'stop-color': color,
    'stop-opacity': opacity,
  }));
}

function backdropStars(state: ShipVisualState): ReadonlyArray<Readonly<{
  x: number; y: number; radius: number; opacity: number;
}>> {
  let value = (state.liverySeed ^ 0x51A7_5EED) >>> 0;
  const next = (): number => {
    value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0;
    return value / 0x1_0000_0000;
  };
  return Object.freeze(Array.from({ length: 18 }, () => Object.freeze({
    x: 12 + next() * 336,
    y: 10 + next() * 156,
    radius: 0.45 + next() * 1.15,
    opacity: 0.2 + next() * 0.5,
  })));
}

function hardpointNames(state: ShipVisualState): string[] {
  return [
    ...(state.hardpoints.array ? ['Long-Range Array'] : []),
    ...(state.hardpoints.autoext ? ['Auto-Extractor'] : []),
    ...(state.hardpoints.cscoop ? ['Corona Scoop'] : []),
  ];
}

export function shipVisualStateKey(state: ShipVisualState): string {
  return [
    'ship-v1',
    state.chassisStage,
    `${+state.hardpoints.array}${+state.hardpoints.autoext}${+state.hardpoints.cscoop}`,
    state.installedSystemIds.join(','),
    state.liverySeed >>> 0,
    state.provenance,
  ].join(':');
}

export function shipPreviewAriaLabel(state: ShipVisualState): string {
  const chassis = CHASSIS[state.chassisStage];
  const hardpoints = hardpointNames(state);
  const provenance = state.provenance === 'legacy-charter-refit'
    ? ' Generic legacy charter refit markings are shown.'
    : '';
  const mounted = hardpoints.length > 0
    ? ` Mounted hardpoints: ${hardpoints.join(', ')}.`
    : ' No mounted hardpoints.';
  return `${chassis.name} ship preview with ${chassis.reach}.${provenance}${mounted}`;
}

export function createShipyardPreview(
  document: Document,
  state: ShipVisualState,
): SVGSVGElement {
  const chassis = CHASSIS[state.chassisStage];
  const colors = livery(state);
  const paint = paintIdentity(state);
  const hullGradientId = `${paint}-hull`;
  const insetGradientId = `${paint}-inset`;
  const coreGradientId = `${paint}-core`;
  const backdropGradientId = `${paint}-backdrop`;
  const hullClipId = `${paint}-clip`;
  const svg = svgElement(document, 'svg', {
    viewBox: '0 0 360 180',
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': shipPreviewAriaLabel(state),
    focusable: 'false',
    'data-cf-shipyard-preview': 'v1',
    'data-state-key': shipVisualStateKey(state),
    'data-chassis-stage': state.chassisStage,
    'data-provenance': state.provenance,
    'data-visual-treatment': 'polished-v1',
  });

  /* One deterministic material-and-light pass around the existing paths.
     The four silhouettes and every capability-owned hardpoint stay byte-for-
     byte identical; gradients, reflected light and a sparse static starfield
     provide depth without adding geometry that could imply new equipment. */
  const defs = svgElement(document, 'defs', {});
  const hullGradient = svgElement(document, 'linearGradient', {
    id: hullGradientId, x1: '12%', y1: '4%', x2: '88%', y2: '96%',
  });
  appendStop(document, hullGradient, '0%', colors.hullBright);
  appendStop(document, hullGradient, '42%', colors.hull);
  appendStop(document, hullGradient, '100%', colors.hullDeep);
  const insetGradient = svgElement(document, 'linearGradient', {
    id: insetGradientId, x1: '25%', y1: '0%', x2: '78%', y2: '100%',
  });
  appendStop(document, insetGradient, '0%', colors.insetBright);
  appendStop(document, insetGradient, '100%', colors.inset);
  const coreGradient = svgElement(document, 'radialGradient', {
    id: coreGradientId, cx: '42%', cy: '35%', r: '68%',
  });
  appendStop(document, coreGradient, '0%', '#ffffff');
  appendStop(document, coreGradient, '36%', colors.lightWarm, 0.98);
  appendStop(document, coreGradient, '100%', colors.light, 0.42);
  const backdropGradient = svgElement(document, 'radialGradient', {
    id: backdropGradientId, cx: '50%', cy: '42%', r: '74%',
  });
  appendStop(document, backdropGradient, '0%', colors.hull, 0.3);
  appendStop(document, backdropGradient, '58%', '#091326', 0.82);
  appendStop(document, backdropGradient, '100%', '#030711');
  const hullClip = svgElement(document, 'clipPath', { id: hullClipId });
  hullClip.append(svgElement(document, 'path', { d: chassis.hullPath }));
  defs.append(hullGradient, insetGradient, coreGradient, backdropGradient, hullClip);
  svg.append(defs);

  const backdrop = svgElement(document, 'g', {
    'data-layer': 'backdrop',
    'aria-hidden': 'true',
  });
  backdrop.append(svgElement(document, 'rect', {
    x: 2, y: 2, width: 356, height: 176, rx: 15,
    fill: `url(#${backdropGradientId})`,
  }));
  for (const star of backdropStars(state)) {
    backdrop.append(svgElement(document, 'circle', {
      cx: star.x.toFixed(2), cy: star.y.toFixed(2), r: star.radius.toFixed(2),
      fill: colors.light, opacity: star.opacity.toFixed(3),
    }));
  }
  backdrop.append(svgElement(document, 'ellipse', {
    cx: 180, cy: 112, rx: 112 + state.chassisStage * 18, ry: 48,
    fill: colors.light, opacity: 0.055,
    'data-layer': 'ship-underlight',
  }));
  svg.append(backdrop);

  const chassisLayer = svgElement(document, 'g', {
    'data-layer': 'chassis',
    'data-silhouette': chassis.id,
    'aria-hidden': 'true',
  });
  chassisLayer.append(
    svgElement(document, 'path', {
      d: chassis.hullPath,
      fill: `url(#${hullGradientId})`,
      stroke: colors.light,
      'stroke-width': 3,
      'stroke-linejoin': 'round',
    }),
    svgElement(document, 'path', {
      d: chassis.insetPath,
      fill: `url(#${insetGradientId})`,
      stroke: colors.light,
      'stroke-width': 1.5,
      'stroke-opacity': 0.72,
      'stroke-linejoin': 'round',
    }),
    svgElement(document, 'circle', {
      cx: 180,
      cy: 92,
      r: state.chassisStage + 5,
      fill: `url(#${coreGradientId})`,
      opacity: 0.88,
      'data-layer': 'livery-core',
    }),
  );
  const materialLight = svgElement(document, 'g', {
    'data-layer': 'material-light',
    'aria-hidden': 'true',
    'clip-path': `url(#${hullClipId})`,
  });
  materialLight.append(
    svgElement(document, 'path', {
      d: 'M86 36 202 14 282 135 250 150Z',
      fill: '#ffffff', opacity: 0.075,
    }),
    svgElement(document, 'path', {
      d: 'M74 125Q180 88 286 125',
      fill: 'none', stroke: colors.lightWarm,
      'stroke-width': 2, 'stroke-opacity': 0.24,
      'stroke-linecap': 'round',
    }),
  );
  chassisLayer.append(materialLight);
  svg.append(chassisLayer);

  if (state.hardpoints.array) {
    const array = svgElement(document, 'g', {
      'data-hardpoint': 'array',
      'aria-hidden': 'true',
      fill: 'none',
      stroke: colors.light,
      'stroke-width': 4,
      'stroke-linecap': 'round',
    });
    array.append(
      svgElement(document, 'path', { d: 'M180 62V31' }),
      svgElement(document, 'path', { d: 'M157 27Q180 48 203 27' }),
      svgElement(document, 'circle', { cx: 180, cy: 31, r: 4, fill: colors.light, stroke: 'none' }),
    );
    svg.append(array);
  }

  if (state.hardpoints.autoext) {
    const extractor = svgElement(document, 'g', {
      'data-hardpoint': 'autoext',
      'aria-hidden': 'true',
      fill: 'none',
      stroke: colors.light,
      'stroke-width': 4,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    extractor.append(
      svgElement(document, 'path', { d: 'M145 124 118 151 101 141' }),
      svgElement(document, 'path', { d: 'M215 124 242 151 259 141' }),
      svgElement(document, 'circle', { cx: 101, cy: 141, r: 5, fill: colors.light, stroke: 'none' }),
      svgElement(document, 'circle', { cx: 259, cy: 141, r: 5, fill: colors.light, stroke: 'none' }),
    );
    svg.append(extractor);
  }

  if (state.hardpoints.cscoop) {
    const scoop = svgElement(document, 'g', {
      'data-hardpoint': 'cscoop',
      'aria-hidden': 'true',
      fill: 'none',
      stroke: colors.light,
      'stroke-width': 5,
      'stroke-linecap': 'round',
    });
    scoop.append(
      svgElement(document, 'path', { d: 'M151 157Q180 175 209 157' }),
      svgElement(document, 'path', { d: 'M161 151Q180 163 199 151', 'stroke-width': 2.5 }),
    );
    svg.append(scoop);
  }

  if (state.provenance === 'legacy-charter-refit') {
    const refit = svgElement(document, 'g', {
      'data-marking': 'legacy-charter-refit',
      'aria-hidden': 'true',
      fill: 'none',
      stroke: colors.light,
      'stroke-width': 3,
      'stroke-linecap': 'round',
      opacity: 0.92,
    });
    refit.append(
      svgElement(document, 'path', { d: 'M130 93 142 84 154 93' }),
      svgElement(document, 'path', { d: 'M206 93 218 84 230 93' }),
    );
    svg.append(refit);
  }

  return svg;
}

export interface ShipyardPreviewDiagnostics {
  readonly activePreviewCount: 0 | 1;
  readonly createdPreviewCount: number;
  readonly disposedPreviewCount: number;
  readonly peakActivePreviewCount: 0 | 1;
  readonly domPreviewCount: number;
  readonly retainedPreviewCount: number;
  readonly faultCount: number;
  readonly stateKey: string | null;
}

interface PreviewRecord {
  readonly element: SVGSVGElement;
  readonly stateKey: string;
}

/** Owns the Shipyard's single code-native SVG preview. Diagnostics are
 * observational: an externally removed or duplicated node is visible before
 * the next lifecycle operation repairs it. `open` is state-key idempotent;
 * `replace` deliberately creates a fresh preview. */
export class ShipyardPreviewOwner {
  private current: PreviewRecord | null = null;
  private createdPreviewCount = 0;
  private disposedPreviewCount = 0;
  private peakActivePreviewCount: 0 | 1 = 0;
  private repairedFaultCount = 0;

  constructor(private readonly mount: HTMLElement) {}

  open(state: ShipVisualState): SVGSVGElement {
    this.repairFaults();
    const key = shipVisualStateKey(state);
    if (this.current?.stateKey === key && this.isActive(this.current.element)) {
      return this.current.element;
    }
    return this.install(state);
  }

  replace(state: ShipVisualState): SVGSVGElement {
    this.repairFaults();
    return this.install(state);
  }

  dispose(): void {
    this.repairFaults();
    this.detachCurrent();
  }

  diagnostics(): ShipyardPreviewDiagnostics {
    const nodes = this.previewNodes();
    const active = this.current !== null && this.isActive(this.current.element)
      ? this.current.element
      : null;
    const retained = nodes.filter((node) => node !== active);
    const missingActiveFault = this.current !== null && active === null ? 1 : 0;
    return Object.freeze({
      activePreviewCount: active === null ? 0 : 1,
      createdPreviewCount: this.createdPreviewCount,
      disposedPreviewCount: this.disposedPreviewCount,
      peakActivePreviewCount: this.peakActivePreviewCount,
      domPreviewCount: nodes.length,
      retainedPreviewCount: retained.length,
      faultCount: this.repairedFaultCount + missingActiveFault + retained.length,
      stateKey: active === null ? null : this.current!.stateKey,
    });
  }

  private install(state: ShipVisualState): SVGSVGElement {
    this.detachCurrent();
    const element = createShipyardPreview(this.mount.ownerDocument, state);
    const stateKey = shipVisualStateKey(state);
    this.mount.append(element);
    this.current = { element, stateKey };
    this.createdPreviewCount++;
    this.peakActivePreviewCount = 1;
    return element;
  }

  private detachCurrent(): void {
    if (this.current === null) return;
    if (this.isActive(this.current.element)) this.current.element.remove();
    this.current = null;
    this.disposedPreviewCount++;
  }

  private repairFaults(): void {
    const nodes = this.previewNodes();
    const active = this.current !== null && this.isActive(this.current.element)
      ? this.current.element
      : null;

    if (this.current !== null && active === null) {
      this.repairedFaultCount++;
      this.disposedPreviewCount++;
      this.current = null;
    }
    for (const node of nodes) {
      if (node === active) continue;
      this.repairedFaultCount++;
      node.remove();
    }
  }

  private previewNodes(): SVGSVGElement[] {
    return Array.from(this.mount.querySelectorAll<SVGSVGElement>(PREVIEW_SELECTOR));
  }

  private isActive(element: SVGSVGElement): boolean {
    return element.parentNode === this.mount;
  }
}
